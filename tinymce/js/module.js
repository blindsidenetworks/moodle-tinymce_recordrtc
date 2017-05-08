
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

//// Extraction of parameters
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

//// Initialize some things
var recordingDIV = null;
var recordingMedia = null;
var audioPlayer = null;
var videoPlayer = null;
var countdownSeconds = null;
var countdownTicker = null;

//// Run when user clicks on "record" button in TinyMCE
M.tinymce_recordrtc.view_init = function() {
    console.info('Init tinymce_recordrtc.js...');
    // Declaration of global variables
    recordingDIV = document.querySelector('.recordrtc');
    recordingMedia = recordingDIV.querySelector('.recording-media');
    audioPlayer = recordingDIV.querySelector('#audio-player');
    videoPlayer = recordingDIV.querySelector('#video-player');

    // Initializations for recordDIV
    recordingDIV.querySelector('button').onclick = function() {
        var button = this;
        button.disabled = true;

        // If button is displaying "Start Recording" or "Record Again"
        if ((button.innerHTML.indexOf('Start Recording') >= 0) || (button.innerHTML.indexOf('Record Again') >= 0)) {
            // Hide alert-danger if it is shown
            var alert = document.querySelector('div[id=alert-danger]');
            alert.innerHTML = "";
            alert.classList.add('hide');

            // Make sure the upload button is not shown
            recordingDIV.querySelector('#upload').parentNode.style.display = 'none';

            // Initialize common configurations
            var commonConfig = {
                // Set countdown timer to update every second when recording is started
                onMediaCaptured: function(stream) {
                    button.stream = stream;
                    if (button.mediaCapturedCallback) {
                        button.mediaCapturedCallback();
                    }

                    button.innerHTML = 'Stop Recording (<label id="minutes">02</label>:<label id="seconds">00</label>)';
                    button.disabled = false;

                    countdownSeconds = 120;
                    countdownTicker = setInterval(M.tinymce_recordrtc.setTime, 1000);
                },

                // Revert button to "Record Again" when recording is stopped
                onMediaStopped: function(btnLabel) {
                    button.innerHTML = btnLabel;

                    if (!button.disableStateWaiting) {
                        button.disabled = false;
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
                    } else if ((error.name === 'DevicesNotFoundError') || (error.name === 'NotFoundError')) { // If Device Not Found error
                        var alert = document.querySelector('div[id=alert-danger]');
                        alert.classList.remove('hide');
                        alert.innerHTML = "There is no input device enabled";

                        if ( button.innerHTML.indexOf('Start Recording') >= 0 ) {
                            btnLabel = 'Start Recording failed, try again';
                        } else {
                            btnLabel = 'Record Again failed, try once more';
                        }

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

                M.tinymce_recordrtc.captureAudio(commonConfig);

                button.mediaCapturedCallback = function() {
                    // Start recording with these parameters
                    button.recordRTC = RecordRTC(button.stream, {
                        type: 'audio',
                        bufferSize: typeof params.bufferSize == 'undefined' ? 0 : parseInt(params.bufferSize),
                        sampleRate: typeof params.sampleRate == 'undefined' ? 44100 : parseInt(params.sampleRate),
                        leftChannel: params.leftChannel || false,
                        disableLogs: params.disableLogs || false,
                        recorderType: webrtcDetectedBrowser === 'edge' ? StereoAudioRecorder : null
                    });

                    // On recording end
                    button.recordingEndedCallback = function(url) {
                        // Set audio tag src and controls, and unhide it
                        audioPlayer.srcObject = null;
                        audioPlayer.muted = false;
                        audioPlayer.controls = true;
                        audioPlayer.src = url;
                        audioPlayer.play();
                        audioPlayer.classList.remove('hide');

                        audioPlayer.onended = function() {
                            audioPlayer.pause();
                            audioPlayer.src = URL.createObjectURL(button.recordRTC.blob);
                        };
                    };

                    // Start recording
                    button.recordRTC.startRecording();

                    // As a recording started, make sure the message for uploading the last recording is set
                    recordingDIV.querySelector('#upload').innerHTML = "Upload Recording to Server";
                };
            }

            // If user has selected to record video and audio
            if (recordingMedia.value === 'record-video') {
                // Hide audio tag if previously shown
                // Show video tag without controls to view webcam stream
                audioPlayer.classList.add('hide');
                videoPlayer.classList.remove('hide');
                videoPlayer.controls = false;

                M.tinymce_recordrtc.captureAudioPlusVideo(commonConfig);
                button.mediaCapturedCallback = function() {
                    // Start recording with these parameters
                    button.recordRTC = RecordRTC(button.stream, {
                        type: 'video',
                        disableLogs: params.disableLogs || false
                    });

                    // On recording end
                    button.recordingEndedCallback = function(url) {
                        // Set video tag src and controls, and unhide it
                        videoPlayer.srcObject = null;
                        videoPlayer.muted = false;
                        videoPlayer.controls = true;
                        videoPlayer.src = url;
                        videoPlayer.play();
                        videoPlayer.classList.remove('hide');

                        videoPlayer.onended = function() {
                            videoPlayer.pause();
                            videoPlayer.src = URL.createObjectURL(button.recordRTC.blob);
                        };
                    };

                    // Start recording
                    button.recordRTC.startRecording();

                    // As a recording started, make sure the message for uploading the last recording is set
                    recordingDIV.querySelector('#upload').innerHTML = "Upload Recording to Server";
                };
            }

            return;
        } else { // If button is displaying "Stop Recording"
            // First of all clears the countdownTicker
            clearInterval(countdownTicker);

            button.disableStateWaiting = true;
            setTimeout(function() {
                button.disabled = false;
                button.disableStateWaiting = false;
            }, 2 * 1000);

            button.innerHTML = 'Record Again';

            var stopStream = function() {
                if (button.stream && button.stream.stop) {
                    button.stream.stop();
                    button.stream = null;
                }
            }

            // Close webcam/microphone streams
            if (button.recordRTC) {
                if (button.recordRTC.length) {
                    button.recordRTC[0].stopRecording(function(url) {
                        if (!button.recordRTC[1]) {
                            button.recordingEndedCallback(url);
                            stopStream();

                            M.tinymce_recordrtc.startRecording(button.recordRTC[0]);
                            return;
                        }

                        button.recordRTC[1].stopRecording(function(url) {
                            button.recordingEndedCallback(url);
                            stopStream();
                        });
                    });
                } else {
                    button.recordRTC.stopRecording(function(url) {
                        button.recordingEndedCallback(url);
                        stopStream();

                        M.tinymce_recordrtc.startRecording(button.recordRTC);
                    });
                }
            }

            return;
        }
    };

    // Display "consider switching browsers" message if not using Firefox
    if (webrtcDetectedBrowser !== 'firefox') {
        var alert = document.querySelector('div[id=alert-info]');
        alert.innerHTML == "Use Firefox for best experience";
        alert.classList.remove('hide');
    }
    // Video recording not yet supported in Microsoft Edge
    // Only allow audio recording option
    if (webrtcDetectedBrowser === 'edge') {
        console.warn('Neither MediaRecorder API nor webp is supported in Microsoft Edge. You can merely record audio.');

        recordingMedia.innerHTML = '<option value="record-audio">Audio</option>';
    }
};

//// RecordRTC settings for recording audio
M.tinymce_recordrtc.captureAudio = function(config) {
    M.tinymce_recordrtc.captureUserMedia(
        // media constraints
        {audio: true},
        // success callback
        function(audioStream) {
            // Set audio tag to play microphone stream being recorded
            audioPlayer.srcObject = audioStream;
            audioPlayer.play();

            config.onMediaCaptured(audioStream);

            audioStream.onended = function() {
                config.onMediaStopped('Start Recording');
            };
        },

        // Error callback
        function(error) {
            console.info("MediaCapturingFailed: " + error.name);
            config.onMediaCapturingFailed(error);
        }
    );
}

//// RecordRTC settings for recording video with audio
M.tinymce_recordrtc.captureAudioPlusVideo = function(config) {
    M.tinymce_recordrtc.captureUserMedia(
      {video: true, audio: true},
      function(audioVideoStream) {
        // Set video tag to display webcam stream being recorded
        videoPlayer.srcObject = audioVideoStream;
        videoPlayer.play();

        config.onMediaCaptured(audioVideoStream);

        audioVideoStream.onended = function() {
            config.onMediaStopped();
        };
    },

    // Error callback
    function(error) {
        config.onMediaCapturingFailed(error);
    });
}

//// Begin capturing webcam/microphone
M.tinymce_recordrtc.captureUserMedia = function(mediaConstraints, successCallback, errorCallback) {
    navigator.mediaDevices.getUserMedia(mediaConstraints).then(successCallback).catch(errorCallback);
}

//// Handle what happens when upload button is clicked
M.tinymce_recordrtc.startRecording = function(recordRTC) {
    recordingDIV.querySelector('#upload').parentNode.style.display = 'block';
    recordingDIV.querySelector('#upload').disabled = false;
    recordingDIV.querySelector('#upload').onclick = function() {
        var selected;

        // Find whether video or audio recording is selected
        if (recordingDIV.querySelectorAll('audio.hide').length === 0) {
            selected = recordingDIV.querySelector('audio');
        } else {
            selected = recordingDIV.querySelector('video');
        }

        // Trigger error if no recording has been made
        if (!recordRTC) return alert('No recording found.');
        this.disabled = true;

        var button = this;
        M.tinymce_recordrtc.uploadSelectedToServer(selected, function(progress, fileURL) {
            if (progress === 'ended') {
                button.disabled = false;
                M.tinymce_recordrtc.view_annotate(fileURL);
                return;
            } else if ( progress === 'upload-failed') {
                button.disabled = false;
                button.innerHTML = 'Upload failed, try again';
                return;
            } else {
                button.innerHTML = progress;
                return;
            }
        });
    };
}

//// Uploads recorded video/audio to server
M.tinymce_recordrtc.uploadSelectedToServer = function(selected, callback) {
    var xhr = new XMLHttpRequest();
    // Get src URL of either audio or video tag, depending on which is selected
    xhr.open('GET', selected.src, true);
    xhr.responseType = 'blob';

    xhr.onload = function(e) {
        if (this.status == 200) {
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
    var request = new XMLHttpRequest();

    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            callback('upload-ended', this.responseText);
        } else if (request.status == 404) {
            callback('upload-failed');
        }
    };

    request.upload.onloadstart = function() {
        callback('Upload started...');
    };

    request.upload.onprogress = function(event) {
        callback('Upload Progress ' + Math.round(event.loaded / event.total * 100) + "%");
    };

    request.upload.onload = function() {
        callback('progress-about-to-end');
    };

    request.upload.onload = function() {
        callback('progress-ended');
    };

    request.upload.onerror = function(error) {
        callback('Failed to upload to server');
        console.error('XMLHttpRequest failed', error);
    };

    request.upload.onabort = function(error) {
        callback('Upload aborted.');
        console.error('XMLHttpRequest aborted', error);
    };

    // POST FormData to PHP script
    request.open('POST', url);
    request.send(data);
}

//// Inserts link to annotation in text area
M.tinymce_recordrtc.view_annotate = function(recording_url) {
    var annotation = M.tinymce_recordrtc.create_annotation(recording_url);

    tinyMCEPopup.editor.execCommand('mceInsertContent', false, annotation);
    tinyMCEPopup.close();
};

//// Generates link to recorded annotation
M.tinymce_recordrtc.create_annotation = function(recording_url) {
    //Shows an icon in both, the editor content box and the submission page
    //var annotation = '<div id="recordrtc_annotation" class="text-center"><a target="_blank" href="' + recording_url + '"><img alt="RecordRTC Annotation" title="RecordRTC Annotation" src="' + recordrtc.recording_icon32 + '" /></a></div>';
    //Shows a text in the editor content box and a player in the submission page
    var annotation = '<div id="recordrtc_annotation" class="text-center"><a target="_blank" href="' + recording_url + '">RecordRTC Annotation</a></div>';
    return annotation;
};

//// Sets the recording countdown timer
M.tinymce_recordrtc.setTime = function () {
    countdownSeconds--;
    recordingDIV.querySelector('label[id=seconds]').innerHTML = M.tinymce_recordrtc.pad(countdownSeconds%60);
    recordingDIV.querySelector('label[id=minutes]').innerHTML = M.tinymce_recordrtc.pad(parseInt(countdownSeconds/60));
    if ( countdownSeconds === 0 ) {
        recordingDIV.querySelector('button').click();
    }
};

//// Makes 1min and 2s display as 1:02 on timer instead of 1:2, for example
M.tinymce_recordrtc.pad = function (val) {
    var valString = val + "";
    if (valString.length < 2) {
        return "0" + valString;
    } else {
        return valString;
    }
}
