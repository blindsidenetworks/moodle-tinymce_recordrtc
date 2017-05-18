
/**
 * TinyMCE recordrtc library functions
 *
 * @package    tinymce_recordrtc
 * @author     Jesus Federico  (jesus [at] blindsidenetworks [dt] com)
 * @copyright  2017 Blindside Networks Inc.
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/** global: M */

M.tinymce_recordrtc = M.tinymce_recordrtc || {};

// Extraction of parameters
(function() {
    var params = {};
    var r = /([^&=]+)=?([^&]*)/g;

    var d = function(s) {
        return decodeURIComponent(s.replace(/\+/g, ' '));
    };

    var search = window.location.search;
    var match = r.exec(search.substring(1));
    while (match) {
        params[d(match[1])] = d(match[2]);

        if (d(match[2]) === 'true' || d(match[2]) === 'false') {
            params[d(match[1])] = d(match[2]) === 'true' ? true : false;
        }
        match = r.exec(search.substring(1));
    }

    window.params = params;
})();

/**
 * This function is initialized from PHP
 *
 * @param {Object}
 *            Y YUI instance
 */

// Initialize some variables
var recordingDIV = null;
var recordingMedia = null;
var audioPlayer = null;
var videoPlayer = null;
var startStopBtn = null;
var uploadBtn = null;
var countdownSeconds = null;
var countdownTicker = null;

// Run when user clicks on "record" button in TinyMCE
M.tinymce_recordrtc.view_init = function() {
  console.info('Using ' + webrtcDetectedBrowser +
               ', version ' + webrtcDetectedVersion);
  console.info('Initializing tinymce_recordrtc.js...');

  // Assignment of global variables
  recordingDIV = document.querySelector('.recordrtc');
  recordingMedia = recordingDIV.querySelector('.recording-media');
  audioPlayer = recordingDIV.querySelector('audio#audio-player');
  videoPlayer = recordingDIV.querySelector('video#video-player');
  startStopBtn = recordingDIV.querySelector('button#start-stop');
  uploadBtn = recordingDIV.querySelector('button#upload');

  // Initially do not display audio/video players
  audioPlayer.classList.add('hide');
  videoPlayer.classList.add('hide');

  // Initializations for recordDIV
  startStopBtn.onclick = function() {
    var btn = this;
    btn.disabled = true;

    // If button is displaying "Start Recording" or "Record Again"
    if ((btn.innerHTML === 'Start Recording') || (btn.innerHTML === 'Record Again') ||
        (btn.innerHTML === 'Recording failed, try again')) {
      // Hide alert-danger if it is shown
      var alert = document.querySelector('div[id=alert-danger]');
      alert.innerHTML = "";
      alert.classList.add('hide');

      // Make sure the upload button is not shown
      uploadBtn.parentNode.style.display = 'none';

      // Initialize common configurations
      var commonConfig = {
        // When the stream is captured from the microphone/webcam
        onMediaCaptured: function(stream) {
          // Make audio/video stream available on a higher level by making it a property of btn
          btn.stream = stream;

          if (btn.mediaCapturedCallback) {
            btn.mediaCapturedCallback();
          }

          // Set recording timer at 2:00
          btn.innerHTML = 'Stop Recording (<label id="minutes">02</label>:<label id="seconds">00</label>)';
          btn.disabled = false;
          countdownSeconds = 120;
          countdownTicker = setInterval(M.tinymce_recordrtc.setTime, 1000);
        },

        // Revert button to "Record Again" when recording is stopped
        onMediaStopped: function(btnLabel) {
          btn.innerHTML = btnLabel;

          if (!btn.disableStateWaiting) {
            btn.disabled = false;
          }
        },

        // Handle recording errors
        onMediaCapturingFailed: function(error) {
          var btnLabel = 'Start Recording';

          // If Firefox and Permission Denied error
          if ((error.name === 'PermissionDeniedError') && (!!navigator.mozGetUserMedia)) {
            InstallTrigger.install({
              'Foo': {
                // https://addons.mozilla.org/firefox/downloads/latest/655146/addon-655146-latest.xpi?src=dp-btn-primary
                URL: 'https://addons.mozilla.org/en-US/firefox/addon/enable-screen-capturing/',
                toString: function () {
                  return this.URL;
                }
              }
            });

          // If Device Not Found error
          } else if ((error.name === 'DevicesNotFoundError') || (error.name === 'NotFoundError')) {
            var alert = document.querySelector('div[id=alert-danger]');
            alert.classList.remove('hide');
            alert.innerHTML = "There is no input device enabled";

            btnLabel = 'Recording failed, try again';

            console.info(alert.innerHTML);
          }

          // Proceed to treat as a stopped recording
          commonConfig.onMediaStopped(btnLabel);
        }
      };

      // If user has selected to record only audio
      if (recordingMedia.value === 'record-audio') {
        // Hide audio and video tags if previously shown
        audioPlayer.classList.add('hide');
        videoPlayer.classList.add('hide');

        // Capture audio stream from microphone
        M.tinymce_recordrtc.captureAudio(commonConfig);

        // Start actual recording via RecordRTC
        btn.mediaCapturedCallback = function() {
          btn.recordRTC = RecordRTC(btn.stream, {
            type: 'audio',
            bufferSize: typeof params.bufferSize === 'undefined' ? 0 : parseInt(params.bufferSize),
            sampleRate: typeof params.sampleRate === 'undefined' ? 44100 : parseInt(params.sampleRate),
            leftChannel: params.leftChannel || false,
            disableLogs: params.disableLogs || false,
            recorderType: webrtcDetectedBrowser === 'edge' ? StereoAudioRecorder : null
          });

          // On recording end
          btn.recordingEndedCallback = function(url) {
            // Set audio tag src and controls, and unhide it
            audioPlayer.srcObject = null;
            audioPlayer.muted = false;
            audioPlayer.controls = true;
            audioPlayer.src = url;
            audioPlayer.play();
            audioPlayer.classList.remove('hide');

            audioPlayer.onended = function() {
              audioPlayer.pause();
              audioPlayer.src = URL.createObjectURL(btn.recordRTC.blob);
            };
          };

          // Start recording
          btn.recordRTC.startRecording();

          // As a recording started, make sure the message for uploading the last recording is set
          uploadBtn.innerHTML = 'Attach Recording as Annotation';
        };
      }

      // If user has selected to record video and audio
      if (recordingMedia.value === 'record-video') {
        // Hide audio tag if previously shown
        // Show video tag without controls to view webcam stream
        audioPlayer.classList.add('hide');
        videoPlayer.classList.remove('hide');
        videoPlayer.controls = false;

        // Capture audio+video stream from webcam/microphone
        M.tinymce_recordrtc.captureAudioPlusVideo(commonConfig);

        // Start actual recording via RceordRTC
        btn.mediaCapturedCallback = function() {
          btn.recordRTC = RecordRTC(btn.stream, {
            type: 'video',
            disableLogs: params.disableLogs || false
          });

          // On recording end
          btn.recordingEndedCallback = function(url) {
            // Set video tag src and controls, and unhide it
            videoPlayer.srcObject = null;
            videoPlayer.muted = false;
            videoPlayer.controls = true;
            videoPlayer.src = url;
            videoPlayer.play();

            videoPlayer.onended = function() {
              videoPlayer.pause();
              videoPlayer.src = URL.createObjectURL(btn.recordRTC.blob);
            };
          };

          // Start recording
          btn.recordRTC.startRecording();

          // As a recording started, make sure the message for uploading the last recording is set
          uploadBtn.innerHTML = 'Attach Recording as Annotation';
        };
      }

      return;

    // If button is displaying "Stop Recording"
    } else {
      // First of all clears the countdownTicker
      clearInterval(countdownTicker);

      btn.disableStateWaiting = true;
      setTimeout(function() {
        btn.disabled = false;
        btn.disableStateWaiting = false;
      }, 1000);

      btn.innerHTML = 'Record Again';

      var stopStream = function() {
        if (btn.stream && btn.stream.stop) {
          btn.stream.stop();
          btn.stream = null;
        }
      }

      // Close webcam/microphone streams
      if (btn.recordRTC) {
        if (btn.recordRTC.length) {
          btn.recordRTC[0].stopRecording(function(url) {
            if (!btn.recordRTC[1]) {
              btn.recordingEndedCallback(url);
              stopStream();

              M.tinymce_recordrtc.startRecording(btn.recordRTC[0]);
              return;
            }

            btn.recordRTC[1].stopRecording(function(url) {
              btn.recordingEndedCallback(url);
              stopStream();
            });
          });
        } else {
          btn.recordRTC.stopRecording(function(url) {
            btn.recordingEndedCallback(url);
            stopStream();

            M.tinymce_recordrtc.startRecording(btn.recordRTC);
          });
        }
      }

      return;
    }
  };

  // Display "consider switching browsers" message if not using
  // - Firefox v.29 or higher
  // - Chrome v.49 or higher
  // - Opera v.36 or higher (when gumadapter.js is updated to include it)
  if (!(((webrtcDetectedBrowser === 'firefox') && (webrtcDetectedVersion >= 29)) ||
       ((webrtcDetectedBrowser === 'chrome') && (webrtcDetectedVersion >= 49)))) {
    var alert = document.querySelector('div[id=alert-info]');
    // Add "or Opera >= 36" when gumadapter.js gets updated to include Opera detection
    alert.innerHTML = "Use Firefox >= 29 or Chrome >= 49 for best experience";
    alert.classList.remove('hide');
  }
  // Video recording not yet supported in Microsoft Edge
  // Only allow audio recording option
  if (webrtcDetectedBrowser === 'edge') {
    console.warn('Neither MediaRecorder API nor webp is supported in Microsoft Edge. You can merely record audio.');

    recordingMedia.innerHTML = '<option value="record-audio">Audio</option>';
  }
};

// RecordRTC settings for recording audio
M.tinymce_recordrtc.captureAudio = function(config) {
  M.tinymce_recordrtc.captureUserMedia(
    // Media constraints
    {audio: true},

    // Success callback
    function(audioStream) {
      console.log('getUserMedia() got stream: ', audioStream);

      // Set audio player to play microphone stream being recorded
      if (window.URL) {
        audioPlayer.src = window.URL.createObjectURL(audioStream);
      } else {
        audioPlayer.src = audioStream;
      }
      audioPlayer.play();

      // WHAT?
      config.onMediaCaptured(audioStream);
    },

    // Error callback
    function(error) {
      console.log('getUserMedia() error: ' + error);
      config.onMediaCapturingFailed(error);
    }
  );
}

// RecordRTC settings for recording video with audio
M.tinymce_recordrtc.captureAudioPlusVideo = function(config) {
  M.tinymce_recordrtc.captureUserMedia(
    // Media constraints
    {video: true, audio: true},

    // Success callback
    function(audioVideoStream) {
      console.log('getUserMedia() got stream: ', audioVideoStream);

      // Set audio player to play microphone+webcam stream being recorded
      if (window.URL) {
        videoPlayer.src = window.URL.createObjectURL(audioVideoStream);
      } else {
        videoPlayer.src = audioVideoStream;
      }
      videoPlayer.play();

      // WHAT?
      config.onMediaCaptured(audioVideoStream);
    },

    // Error callback
    function(error) {
      console.log('getUserMedia() error: ' + error);
      config.onMediaCapturingFailed(error);
    }
  );
}

// Begin capturing webcam/microphone
M.tinymce_recordrtc.captureUserMedia = function(mediaConstraints, successCallback, errorCallback) {
  navigator.mediaDevices.getUserMedia(mediaConstraints).then(successCallback).catch(errorCallback);
}

// Handle what happens when upload button is clicked
M.tinymce_recordrtc.startRecording = function(recordRTC) {
  uploadBtn.parentNode.style.display = 'block';
  uploadBtn.disabled = false;

  uploadBtn.onclick = function() {
    var selected;

    // Find whether video or audio recording is selected
    if (!audioPlayer.classList.contains('hide')) {
      selected = audioPlayer;
    } else {
      selected = videoPlayer;
    }

    // Trigger error if no recording has been made
    if (!recordRTC) return alert('No recording found.');

    var btn = this;
    btn.disabled = true;
    M.tinymce_recordrtc.uploadToServer(selected, function(progress, fileURL) {
      if (progress === 'ended') {
        btn.disabled = false;
        M.tinymce_recordrtc.insert_annotation(fileURL);
        return;
      } else if (progress === 'upload-failed') {
        btn.disabled = false;
        btn.innerHTML = 'Upload failed, try again';
        return;
      } else {
        btn.innerHTML = progress;
        return;
      }
    });
  };
}

// Uploads recorded video/audio to server
M.tinymce_recordrtc.uploadToServer = function(selected, callback) {
  var xhr = new XMLHttpRequest();
  // Get src URL of either audio or video tag, depending on which is selected
  xhr.open('GET', selected.src, true);
  xhr.responseType = 'blob';

  xhr.onload = function(e) {
    if (xhr.status === 200) {
      var date = new Date();

      // blob is now the blob that the video/audio tag's src pointed to
      var blob = this.response;
      // Determine if video or audio
      var fileType = blob.type.split('/')[0] || 'audio';
      // Generate filename with timestamp, random ID and file extension
      var fileName = date.getYear() + date.getMonth() + date.getDay() +
                     date.getHours() + date.getMinutes() +
                     date.getSeconds() + '-' +
                     (Math.random() * 1000).toString().replace('.', '');
      if (fileType === 'audio') {
        fileName += '.' + (!!navigator.mozGetUserMedia ? 'ogg' : 'wav');
      } else {
        fileName += '.webm';
      }

      // Create FormData to send to PHP upload/save script
      var formData = new FormData();
      formData.append('contextid', recordrtc.contextid);
      formData.append('sesskey', parent.M.cfg.sesskey);
      formData.append(fileType + '-filename', fileName);
      formData.append(fileType + '-blob', blob);

      callback('Uploading ' + fileType + ' recording to server.');

      // Pass FormData to PHP script using XHR
      M.tinymce_recordrtc.makeXMLHttpRequest('save.php', formData, function(progress, responseText) {
        if (progress === 'upload-ended') {
          var initialURL = location.href.replace(location.href.split('/').pop(), '') + 'uploads.php/';
          callback('ended', initialURL + responseText);
          return;
        } else {
          callback(progress);
          return;
        }
      });
    }
  };

  xhr.send();
}

M.tinymce_recordrtc.makeXMLHttpRequest = function(url, data, callback) {
  var xhr = new XMLHttpRequest();

  xhr.onreadystatechange = function() {
    // When request is finished and successful
    if ((xhr.readyState === 4) && (xhr.status === 200)) {
      callback('upload-ended', xhr.responseText);

    // When request returns 404 Not Found
    } else if (xhr.status === 404) {
      callback('upload-failed');
    }
  };

  xhr.upload.onloadstart = function() {
    callback('Upload started');
  };

  xhr.upload.onprogress = function(event) {
    callback('Upload progress: ' + Math.round(event.loaded / event.total * 100) + "%");
  };

  xhr.upload.onload = function() {
    callback('Upload ended');
  };

  xhr.upload.onerror = function(error) {
    callback('Failed to upload to server');
    console.error('XMLHttpRequest failed: ', error);
  };

  xhr.upload.onabort = function(error) {
    callback('Upload aborted');
    console.error('XMLHttpRequest aborted: ', error);
  };

  // POST FormData to PHP script that handles uploading/saving
  xhr.open('POST', url);
  xhr.send(data);
}

// Inserts link to annotation in editor text area
M.tinymce_recordrtc.insert_annotation = function(recording_url) {
  var annotation = M.tinymce_recordrtc.create_annotation(recording_url);

  tinyMCEPopup.editor.execCommand('mceInsertContent', false, annotation);
  tinyMCEPopup.close();
};

// Generates link to recorded annotation
M.tinymce_recordrtc.create_annotation = function(recording_url) {
  // Create an icon linked to file in both editor text area and submission page
  //// var annotation = '<div id="recordrtc_annotation" class="text-center"><a target="_blank" href="' + recording_url + '"><img alt="RecordRTC Annotation" title="RecordRTC Annotation" src="' + recordrtc.recording_icon32 + '" /></a></div>';

  // Creates link to file in editor text area and audio/video player in submission page
  var annotation = '<div id="recordrtc_annotation" class="text-center"><a target="_blank" href="' + recording_url + '">RecordRTC Annotation</a></div>';

  return annotation;
};

// Functionality to make recording timer count down
// Also makes recording stop when time limit is hit
M.tinymce_recordrtc.setTime = function () {
  countdownSeconds--;

  startStopBtn.querySelector('label#seconds').innerHTML = M.tinymce_recordrtc.pad(countdownSeconds%60);
  startStopBtn.querySelector('label#minutes').innerHTML = M.tinymce_recordrtc.pad(parseInt(countdownSeconds/60));

  if (countdownSeconds === 0) {
    startStopBtn.click();
  }
};

// Makes 1min and 2s display as 1:02 on timer instead of 1:2, for example
M.tinymce_recordrtc.pad = function (val) {
  var valString = val + "";

  if (valString.length < 2) {
    return "0" + valString;
  } else {
    return valString;
  }
}
