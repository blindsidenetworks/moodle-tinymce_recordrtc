// TinyMCE recordrtc library functions.
// @package    tinymce_recordrtc.
// @author     Jesus Federico  (jesus [at] blindsidenetworks [dt] com).
// @copyright  2016 to present, Blindside Networks Inc.
// @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later.

/** global: M */
/** global: URL */
/** global: params */
/** global: initialized variables */

M.tinymce_recordrtc = M.tinymce_recordrtc || {};

// Extract plugin settings to params hash.
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

// Initialize some variables.
var player = null;
var startStopBtn = null;
var uploadBtn = null;
var countdownSeconds = null;
var countdownTicker = null;
var mediaRecorder = null;
var chunks = null;

/**
 * This function is initialized from PHP
 *
 * @param {Object}
 *            Y YUI instance
 */
M.tinymce_recordrtc.view_init = function() {
    // Assignment of global variables.
    player = document.querySelector('audio#player');
    startStopBtn = document.querySelector('button#start-stop');
    uploadBtn = document.querySelector('button#upload');

    // Display "consider switching browsers" message if not using:
    // - Firefox 29+;
    // - Chrome 49+;
    // - Opera 36+.
    if (!((bowser.firefox && bowser.version >= 29) ||
          (bowser.chrome && bowser.version >= 49) ||
          (bowser.opera && bowser.version >= 36))) {
        var alert = document.querySelector('div[id=alert-info]');
        alert.textContent = M.util.get_string('browseralert', 'tinymce_recordrtc');
        alert.classList.remove('hide');
    }

    // Run when user clicks on "record" button.
    startStopBtn.onclick = function() {
        var btn = this;
        btn.disabled = true;

        // If button is displaying "Start Recording" or "Record Again".
        if ((btn.textContent === M.util.get_string('startrecording', 'tinymce_recordrtc')) ||
            (btn.textContent === M.util.get_string('recordagain', 'tinymce_recordrtc')) ||
            (btn.textContent === M.util.get_string('recordingfailed', 'tinymce_recordrtc'))) {
            // Hide alert-danger if it is shown.
            var alert = document.querySelector('div[id=alert-danger]');
            alert.classList.add('hide');

            // Make sure the audio player and upload button is not shown.
            player.classList.add('hide');
            uploadBtn.parentElement.classList.add('hide');

            // Change look of recording button.
            startStopBtn.classList.remove('btn-outline-danger');
            startStopBtn.classList.add('btn-danger');

            // Empty the array containing the previously recorded chunks.
            chunks = [];

            // Initialize common configurations.
            var commonConfig = {
                // When the stream is captured from the microphone/webcam.
                onMediaCaptured: function(stream) {
                    // Make audio stream available at a higher level by making it a property of btn.
                    btn.stream = stream;

                    if (btn.mediaCapturedCallback) {
                        btn.mediaCapturedCallback();
                    }
                },

                // Revert button to "Record Again" when recording is stopped.
                onMediaStopped: function(btnLabel) {
                    btn.textContent = btnLabel;
                },

                // Handle recording errors.
                onMediaCapturingFailed: function(error) {
                    var btnLabel = null;

                    // If Firefox and Permission Denied error.
                    if ((error.name === 'PermissionDeniedError') && bowser.firefox) {
                        InstallTrigger.install({
                            'Foo': {
                                // Link: https://addons.mozilla.org/firefox/downloads/latest/655146/addon-655146...
                                // ...-latest.xpi?src=dp-btn-primary.
                                URL: 'https://addons.mozilla.org/en-US/firefox/addon/enable-screen-capturing/',
                                toString: function() {
                                    return this.URL;
                                }
                            }
                        });

                        btnLabel = M.util.get_string('startrecording', 'tinymce_recordrtc');
                    } else if ((error.name === 'DevicesNotFoundError') ||
                               (error.name === 'NotFoundError')) { // If Device Not Found error.
                        var alert = document.querySelector('div[id=alert-danger]');
                        alert.classList.remove('hide');
                        alert.textContent = M.util.get_string('inputdevicealert', 'tinymce_recordrtc');

                        btnLabel = M.util.get_string('recordingfailed', 'tinymce_recordrtc');
                    }

                    // Proceed to treat as a stopped recording.
                    commonConfig.onMediaStopped(btnLabel);
                }
            };

            // Capture audio stream from microphone.
            M.tinymce_recordrtc.captureAudio(commonConfig);

            // When audio stream is successfully captured, start recording.
            btn.mediaCapturedCallback = function() {
                M.tinymce_recordrtc.startRecording(btn.stream);
            };

            return;
        } else { // If button is displaying "Stop Recording".
            // First of all clears the countdownTicker.
            clearInterval(countdownTicker);

            // Disable "Record Again" button for 1s to allow background processing (closing streams).
            setTimeout(function() {
                btn.disabled = false;
            }, 1000);

            // Stop recording.
            M.tinymce_recordrtc.stopRecording(btn.stream);

            // Change button to offer to record again.
            btn.textContent = M.util.get_string('recordagain', 'tinymce_recordrtc');
            startStopBtn.classList.remove('btn-danger');
            startStopBtn.classList.add('btn-outline-danger');

            return;
        }
    };
};

/////////////////////////
// Functions for capturing, recording, and uploading stream.
/////////////////////////

// Capture webcam/microphone stream.
M.tinymce_recordrtc.captureUserMedia = function(mediaConstraints, successCallback, errorCallback) {
    navigator.mediaDevices.getUserMedia(mediaConstraints).then(successCallback).catch(errorCallback);
};

// Setup to get audio stream from microphone.
M.tinymce_recordrtc.captureAudio = function(config) {
    M.tinymce_recordrtc.captureUserMedia(
        // Media constraints.
        {
            audio: true
        },

        // Success callback.
        function(audioStream) {
            console.log('getUserMedia() got stream:', audioStream);

            // Set audio player to play microphone stream.
            player.srcObject = audioStream;
            player.play();

            config.onMediaCaptured(audioStream);
        },

        // Error callback.
        function(error) {
            console.log('getUserMedia() error:', error);
            config.onMediaCapturingFailed(error);
        }
    );
};

// Add chunks of audio to array when made available.
M.tinymce_recordrtc.handleDataAvailable = function(event) {
    chunks.push(event.data);
};

// Output information to console when recording stopped.
M.tinymce_recordrtc.handleStop = function(event) {
    console.log('MediaRecorder stopped:', event);
};

M.tinymce_recordrtc.startRecording = function(stream) {
    // Initialize recording of stream.
    mediaRecorder = new MediaRecorder(stream);
    console.log('Created MediaRecorder:', mediaRecorder);

    mediaRecorder.ondataavailable = M.tinymce_recordrtc.handleDataAvailable;
    mediaRecorder.onstop = M.tinymce_recordrtc.handleStop;
    mediaRecorder.start(10); // Capture in 10ms chunks. Must be set to work with Firefox.
    console.log('MediaRecorder started:', mediaRecorder);

    // Set recording timer to the time specified in the settings.
    countdownSeconds = params['timelimit'];
    countdownSeconds++;
    startStopBtn.innerHTML = M.util.get_string('stoprecording', 'tinymce_recordrtc') +
                             ' (<span id="minutes"></span>:<span id="seconds"></span>)';
    M.tinymce_recordrtc.setTime();
    startStopBtn.disabled = false;
    countdownTicker = setInterval(M.tinymce_recordrtc.setTime, 1000);
};

M.tinymce_recordrtc.stopRecording = function(stream) {
    mediaRecorder.stop();

    stream.getTracks().forEach(function(track) {
        track.stop();
        console.log('MediaTrack stopped:', track);
    });

    // Set source of audio player, then show it with controls enabled.
    // Not sure if necessary, need to figure out what formats the different browsers record in.
    /*
    if (webrtcDetectedBrowser === 'firefox') {
      var blob = new Blob(chunks, {type: 'audio/ogg'});
    } else {
      var blob = new Blob(chunks, {type: 'audio/wav'});
    }
    */
    var blob = new Blob(chunks, {
        type: 'audio/ogg;codecs=opus'
    });
    player.src = URL.createObjectURL(blob);

    player.muted = false;
    player.controls = true;
    player.classList.remove('hide');
    player.play();

    player.onended = function() {
        player.pause();
    };

    // Show upload button.
    uploadBtn.parentElement.classList.remove('hide');
    uploadBtn.textContent = M.util.get_string('attachrecording', 'tinymce_recordrtc');
    uploadBtn.disabled = false;

    // Handle when upload button is clicked.
    uploadBtn.onclick = function() {
        // Trigger error if no recording has been made.
        if (!player.src || chunks === []) {
            return alert(M.util.get_string('norecordingfound', 'tinymce_recordrtc'));
        }

        var btn = uploadBtn;
        btn.disabled = true;

        // Upload recording to server.
        M.tinymce_recordrtc.uploadToServer(function(progress, fileURL) {
            if (progress === 'ended') {
                btn.disabled = false;
                M.tinymce_recordrtc.insert_annotation(fileURL);
                return;
            } else if (progress === 'upload-failed') {
                btn.disabled = false;
                btn.textContent = M.util.get_string('uploadfailed', 'tinymce_recordrtc');
                return;
            } else {
                btn.textContent = progress;
                return;
            }
        });
    };
};

// Upload recorded audio to server.
M.tinymce_recordrtc.uploadToServer = function(callback) {
    var xhr = new XMLHttpRequest();

    // Get src URL of audio tag.
    xhr.open('GET', player.src, true);
    xhr.responseType = 'blob';

    xhr.onload = function(e) {
        if (xhr.status === 200) {
            var date = new Date();

            // Variable blob is now the blob that the audio tag's src pointed to.
            var blob = this.response;
            // Generate filename with random ID and file extension.
            var fileName = (Math.random() * 1000).toString().replace('.', '');
            // Not sure if necessary, need to figure out what formats the different browsers record in:
            // fileName += '.' + (webrtcDetectedBrowser === 'firefox' ? '-audio.ogg' : '-audio.wav');.
            fileName += '-audio.ogg';

            // Create FormData to send to PHP upload/save script.
            var formData = new FormData();
            formData.append('contextid', recordrtc.contextid);
            formData.append('sesskey', parent.M.cfg.sesskey);
            formData.append('audio-filename', fileName);
            formData.append('audio-blob', blob);

            // Pass FormData to PHP script using XHR.
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

// Handle XHR sending/receiving/status.
M.tinymce_recordrtc.makeXMLHttpRequest = function(url, data, callback) {
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function() {
        // When request is finished and successful.
        if ((xhr.readyState === 4) && (xhr.status === 200)) {
            callback('upload-ended', xhr.responseText);
        } else if (xhr.status === 404) { // When request returns 404 Not Found.
            callback('upload-failed');
        }
    };

    xhr.upload.onprogress = function(event) {
        callback(Math.round(event.loaded / event.total * 100) + "% " +
                 M.util.get_string('uploadprogress', 'tinymce_recordrtc'));
    };

    xhr.upload.onerror = function(error) {
        callback('upload-failed');
        console.error('XMLHttpRequest failed: ', error);
    };

    xhr.upload.onabort = function(error) {
        callback(M.util.get_string('uploadaborted', 'tinymce_recordrtc'));
        console.error('XMLHttpRequest aborted: ', error);
    };

    // POST FormData to PHP script that handles uploading/saving.
    xhr.open('POST', url);
    xhr.send(data);
}

// Makes 1min and 2s display as 1:02 on timer instead of 1:2, for example.
M.tinymce_recordrtc.pad = function(val) {
    var valString = val + "";

    if (valString.length < 2) {
        return "0" + valString;
    } else {
        return valString;
    }
};

// Functionality to make recording timer count down.
// Also makes recording stop when time limit is hit.
M.tinymce_recordrtc.setTime = function() {
    countdownSeconds--;

    startStopBtn.querySelector('span#seconds').textContent = M.tinymce_recordrtc.pad(countdownSeconds % 60);
    startStopBtn.querySelector('span#minutes').textContent = M.tinymce_recordrtc.pad(parseInt(countdownSeconds / 60));

    if (countdownSeconds === 0) {
        startStopBtn.click();
    }
};

// Generates link to recorded annotation.
M.tinymce_recordrtc.create_annotation = function(recording_url) {
    // Create an icon linked to file in both editor text area and submission page:
    // var annotation = '<div id="recordrtc_annotation" class="text-center">...
    // ...<a target="_blank" href="' + recording_url + '"><img alt="RecordRTC Annotation"...
    // ...title="RecordRTC Annotation" src="' + recordrtc.icon32 + '" /></a></div>';.

    // Create link to file in editor text area and audio player in submission page.
    var annotation = '<div id="recordrtc_annotation" class="text-center"><a target="_blank" href="' + recording_url + '">' +
                     M.util.get_string('annotation', 'tinymce_recordrtc') + '</a></div>';

    return annotation;
};

// Inserts link to annotation in editor text area.
M.tinymce_recordrtc.insert_annotation = function(recording_url) {
    var annotation = M.tinymce_recordrtc.create_annotation(recording_url);

    tinyMCEPopup.editor.execCommand('mceInsertContent', false, annotation);
    tinyMCEPopup.close();
};
