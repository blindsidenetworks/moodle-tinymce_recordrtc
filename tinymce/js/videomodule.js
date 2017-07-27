// TinyMCE recordrtc library functions.
// @package    tinymce_recordrtc.
// @author     Jesus Federico  (jesus [at] blindsidenetworks [dt] com).
// @copyright  2016 to present, Blindside Networks Inc.
// @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later.

/** global: M */
/** global: bowser */
/** global: recordrtc */
/** global: Blob */
/** global: player */
/** global: startStopBtn */
/** global: uploadBtn */
/** global: countdownSeconds */
/** global: countdownTicker */
/** global: recType */
/** global: mediaRecorder */
/** global: chunks */
/** global: blobSize */
/** global: maxUploadSize */

/**
 * This function is initialized from PHP
 *
 * @param {Object}
 *            Y YUI instance
 */
M.tinymce_recordrtc.view_init = function() {
    // Assignment of global variables.
    player = document.querySelector('video#player');
    startStopBtn = document.querySelector('button#start-stop');
    uploadBtn = document.querySelector('button#upload');
    recType = 'video';
    // Extract the numbers from the string, and convert to bytes.
    maxUploadSize = parseInt(recordrtc.maxfilesize.match(/\d+/)[0], 10) * Math.pow(1024, 2);

    // Show alert and redirect user if connection is not secure.
    M.tinymce_recordrtc.check_secure();
    // Show alert if using non-ideal browser.
    M.tinymce_recordrtc.check_browser();

    // Run when user clicks on "record" button.
    startStopBtn.onclick = function() {
        var btn = this;
        btn.disabled = true;

        // If button is displaying "Start Recording" or "Record Again".
        if ((btn.textContent === M.util.get_string('startrecording', 'tinymce_recordrtc')) ||
            (btn.textContent === M.util.get_string('recordagain', 'tinymce_recordrtc')) ||
            (btn.textContent === M.util.get_string('recordingfailed', 'tinymce_recordrtc'))) {
            // Make sure the upload button is not shown.
            uploadBtn.parentElement.parentElement.classList.add('hide');

            // Change look of recording button.
            if (!recordrtc.oldermoodle) {
                startStopBtn.classList.remove('btn-outline-danger');
                startStopBtn.classList.add('btn-danger');
            }

            // Empty the array containing the previously recorded chunks.
            chunks = [];
            blobSize = 0;

            // Initialize common configurations.
            var commonConfig = {
                // When the stream is captured from the microphone/webcam.
                onMediaCaptured: function(stream) {
                    // Make video stream available at a higher level by making it a property of btn.
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
                        alert.parentElement.parentElement.classList.remove('hide');
                        alert.textContent = M.util.get_string('inputdevicealert_title', 'tinymce_recordrtc') + ' ';
                        alert.textContent += M.util.get_string('inputdevicealert', 'tinymce_recordrtc');

                        btnLabel = M.util.get_string('recordingfailed', 'tinymce_recordrtc');
                    }

                    // Proceed to treat as a stopped recording.
                    commonConfig.onMediaStopped(btnLabel);
                }
            };

            // Show video tag without controls to view webcam stream.
            player.parentElement.parentElement.classList.remove('hide');
            player.controls = false;

            // Capture audio+video stream from webcam/microphone.
            M.tinymce_recordrtc.capture_audio_video(commonConfig);

            // When audio+video stream is successfully captured, start recording.
            btn.mediaCapturedCallback = function() {
                M.tinymce_recordrtc.start_recording(recType, btn.stream);
            };
        } else { // If button is displaying "Stop Recording".
            // First of all clears the countdownTicker.
            clearInterval(countdownTicker);

            // Disable "Record Again" button for 1s to allow background processing (closing streams).
            setTimeout(function() {
                btn.disabled = false;
            }, 1000);

            // Stop recording.
            M.tinymce_recordrtc.stop_recording_video(btn.stream);

            // Change button to offer to record again.
            btn.textContent = M.util.get_string('recordagain', 'tinymce_recordrtc');
            if (!recordrtc.oldermoodle) {
                startStopBtn.classList.remove('btn-danger');
                startStopBtn.classList.add('btn-outline-danger');
            }
        }
    };
};

// Setup to get audio+video stream from microphone/webcam.
M.tinymce_recordrtc.capture_audio_video = function(config) {
    M.tinymce_recordrtc.capture_user_media(
        // Media constraints.
        {
            audio: true,
            video: {
                width: {ideal: 640},
                height: {ideal: 480}
            }
        },

        // Success callback.
        function(audioVideoStream) {
            // Set video player source to microphone+webcam stream, and play it back as it's recording.
            player.srcObject = audioVideoStream;
            player.play();

            config.onMediaCaptured(audioVideoStream);
        },

        // Error callback.
        function(error) {
            config.onMediaCapturingFailed(error);
        }
    );
};

M.tinymce_recordrtc.stop_recording_video = function(stream) {
    // Stop recording microphone stream.
    mediaRecorder.stop();

    // Stop each individual MediaTrack.
    stream.getTracks().forEach(function(track) {
        track.stop();
    });

    // Set source of video player.
    var blob = new Blob(chunks, {type: mediaRecorder.mimeType});
    player.src = URL.createObjectURL(blob);

    // Enable controls for video player, and unmute.
    player.muted = false;
    player.controls = true;

    // Show upload button.
    uploadBtn.parentElement.parentElement.classList.remove('hide');
    uploadBtn.textContent = M.util.get_string('attachrecording', 'tinymce_recordrtc');
    uploadBtn.disabled = false;

    // Handle when upload button is clicked.
    uploadBtn.onclick = function() {
        // Trigger error if no recording has been made.
        if (!player.src || chunks === []) {
            Y.use('moodle-core-notification-alert', function() {
                new M.core.alert({
                    title: M.util.get_string('norecordingfound_title', 'tinymce_recordrtc'),
                    message: M.util.get_string('norecordingfound', 'tinymce_recordrtc')
                });
            });
        } else {
            var btn = uploadBtn;
            btn.disabled = true;

            // Upload recording to server.
            M.tinymce_recordrtc.upload_to_server(recType, function(progress, fileURLOrError) {
                if (progress === 'ended') { // Insert annotation in text.
                    btn.disabled = false;
                    M.tinymce_recordrtc.insert_annotation(recType, fileURLOrError);
                } else if (progress === 'upload-failed') { // Show error message in upload button.
                    btn.disabled = false;
                    btn.textContent = M.util.get_string('uploadfailed', 'tinymce_recordrtc') + ' ' + fileURLOrError;
                } else if (progress === 'upload-failed-404') { // 404 error = File too large in Moodle.
                    btn.disabled = false;
                    btn.textContent = M.util.get_string('uploadfailed404', 'tinymce_recordrtc');
                } else if (progress === 'upload-aborted') {
                    btn.disabled = false;
                    btn.textContent = M.util.get_string('uploadaborted', 'tinymce_recordrtc') + ' ' + fileURLOrError;
                } else {
                    btn.textContent = progress;
                }
            });
        }
    };
};
