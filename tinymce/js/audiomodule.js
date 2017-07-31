// TinyMCE recordrtc library functions.
// @package    tinymce_recordrtc.
// @author     Jesus Federico  (jesus [at] blindsidenetworks [dt] com).
// @copyright  2016 to present, Blindside Networks Inc.
// @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later.

// Scrutinizer CI directives.
/** global: M */
/** global: Y */
/** global: tinyMCEPopup */
/** global: recordrtc */
/** global: alertWarning */
/** global: alertDanger */
/** global: blobSize */
/** global: chunks */
/** global: countdownSeconds */
/** global: countdownTicker */
/** global: maxUploadSize */
/** global: mediaRecorder */
/** global: player */
/** global: playerDOM */
/** global: recType */
/** global: startStopBtn */
/** global: uploadBtn */

// This function is initialized from PHP.
M.tinymce_recordrtc.view_init = function() {
    // Assignment of global variables.
    alertWarning = Y.one('div#alert-warning');
    alertDanger = Y.one('div#alert-danger');
    player = Y.one('audio#player');
    playerDOM = document.querySelector('audio#player');
    startStopBtn = Y.one('button#start-stop');
    uploadBtn = Y.one('button#upload');
    recType = 'audio';
    // Extract the numbers from the string, and convert to bytes.
    maxUploadSize = window.parseInt(recordrtc.maxfilesize.match(/\d+/)[0], 10) * Math.pow(1024, 2);

    // Show alert and redirect user if connection is not secure.
    M.tinymce_recordrtc.check_secure();
    // Show alert if using non-ideal browser.
    M.tinymce_recordrtc.check_browser();

    // Run when user clicks on "record" button.
    startStopBtn.on('click', function() {
        startStopBtn.set('disabled', true);

        // If button is displaying "Start Recording" or "Record Again".
        if ((startStopBtn.get('textContent') === M.util.get_string('startrecording', 'tinymce_recordrtc')) ||
            (startStopBtn.get('textContent') === M.util.get_string('recordagain', 'tinymce_recordrtc')) ||
            (startStopBtn.get('textContent') === M.util.get_string('recordingfailed', 'tinymce_recordrtc'))) {
            // Make sure the audio player and upload button are not shown.
            player.ancestor().ancestor().addClass('hide');
            uploadBtn.ancestor().ancestor().addClass('hide');

            // Change look of recording button.
            if (!recordrtc.oldermoodle) {
                startStopBtn.replaceClass('btn-outline-danger', 'btn-danger');
            }

            // Empty the array containing the previously recorded chunks.
            chunks = [];
            blobSize = 0;

            // Initialize common configurations.
            var commonConfig = {
                // When the stream is captured from the microphone/webcam.
                onMediaCaptured: function(stream) {
                    // Make audio stream available at a higher level by making it a property of startStopBtn.
                    startStopBtn.stream = stream;

                    M.tinymce_recordrtc.start_recording(recType, startStopBtn.stream);
                },

                // Revert button to "Record Again" when recording is stopped.
                onMediaStopped: function(btnLabel) {
                    startStopBtn.set('textContent', btnLabel);
                },

                // Handle recording errors.
                onMediaCapturingFailed: function(error) {
                    var btnLabel = null;

                    // Handle getUserMedia-thrown errors.
                    switch (error.name) {
                        case 'AbortError':
                            Y.use('moodle-core-notification-alert', function() {
                                new M.core.alert({
                                    title: M.util.get_string('gumabort_title', 'tinymce_recordrtc'),
                                    message: M.util.get_string('gumabort', 'tinymce_recordrtc')
                                });
                            });

                            btnLabel = M.util.get_string('recordingfailed', 'tinymce_recordrtc');
                            break;
                        case 'NotAllowedError':
                            Y.use('moodle-core-notification-alert', function() {
                                new M.core.alert({
                                    title: M.util.get_string('gumnotallowed_title', 'tinymce_recordrtc'),
                                    message: M.util.get_string('gumnotallowed', 'tinymce_recordrtc')
                                });
                            });

                            btnLabel = M.util.get_string('recordingfailed', 'tinymce_recordrtc');
                            break;
                        case 'NotFoundError':
                            Y.use('moodle-core-notification-alert', function() {
                                new M.core.alert({
                                    title: M.util.get_string('gumnotfound_title', 'tinymce_recordrtc'),
                                    message: M.util.get_string('gumnotfound', 'tinymce_recordrtc')
                                });
                            });

                            btnLabel = M.util.get_string('recordingfailed', 'tinymce_recordrtc');
                            break;
                        case 'NotReadableError':
                            Y.use('moodle-core-notification-alert', function() {
                                new M.core.alert({
                                    title: M.util.get_string('gumnotreadable_title', 'tinymce_recordrtc'),
                                    message: M.util.get_string('gumnotreadable', 'tinymce_recordrtc')
                                });
                            });

                            btnLabel = M.util.get_string('recordingfailed', 'tinymce_recordrtc');
                            break;
                        case 'OverConstrainedError':
                            Y.use('moodle-core-notification-alert', function() {
                                new M.core.alert({
                                    title: M.util.get_string('gumoverconstrained_title', 'tinymce_recordrtc'),
                                    message: M.util.get_string('gumoverconstrained', 'tinymce_recordrtc')
                                });
                            });

                            btnLabel = M.util.get_string('recordingfailed', 'tinymce_recordrtc');
                            break;
                        case 'SecurityError':
                            Y.use('moodle-core-notification-alert', function() {
                                new M.core.alert({
                                    title: M.util.get_string('gumsecurity_title', 'tinymce_recordrtc'),
                                    message: M.util.get_string('gumsecurity', 'tinymce_recordrtc')
                                });
                            });

                            tinyMCEPopup.close();
                            break;
                        case 'TypeError':
                            Y.use('moodle-core-notification-alert', function() {
                                new M.core.alert({
                                    title: M.util.get_string('gumtype_title', 'tinymce_recordrtc'),
                                    message: M.util.get_string('gumtype', 'tinymce_recordrtc')
                                });
                            });
                            break;
                        default:
                            break;
                    }

                    // Proceed to treat as a stopped recording.
                    btnLabel = M.util.get_string('recordingfailed', 'tinymce_recordrtc');
                    commonConfig.onMediaStopped(btnLabel);
                }
            };

            // Capture audio stream from microphone.
            M.tinymce_recordrtc.capture_audio(commonConfig);
        } else { // If button is displaying "Stop Recording".
            // First of all clears the countdownTicker.
            window.clearInterval(countdownTicker);

            // Disable "Record Again" button for 1s to allow background processing (closing streams).
            window.setTimeout(function() {
                startStopBtn.set('disabled', false);
            }, 1000);

            // Stop recording.
            M.tinymce_recordrtc.stop_recording_audio(startStopBtn.stream);

            // Change button to offer to record again.
            startStopBtn.set('textContent', M.util.get_string('recordagain', 'tinymce_recordrtc'));
            if (!recordrtc.oldermoodle) {
                startStopBtn.replaceClass('btn-danger', 'btn-outline-danger');
            }
        }
    });
};

// Setup to get audio stream from microphone.
M.tinymce_recordrtc.capture_audio = function(config) {
    M.tinymce_recordrtc.capture_user_media(
        // Media constraints.
        {
            audio: true
        },

        // Success callback.
        function(audioStream) {
            // Set audio player source to microphone stream.
            playerDOM.srcObject = audioStream;

            config.onMediaCaptured(audioStream);
        },

        // Error callback.
        function(error) {
            config.onMediaCapturingFailed(error);
        }
    );
};

M.tinymce_recordrtc.stop_recording_audio = function(stream) {
    // Stop recording microphone stream.
    mediaRecorder.stop();

    // Stop each individual MediaTrack.
    stream.getTracks().forEach(function(track) {
        track.stop();
    });

    // Set source of audio player.
    var blob = new window.Blob(chunks, {type: mediaRecorder.mimeType});
    player.set('src', window.URL.createObjectURL(blob));

    // Show audio player with controls enabled, and unmute.
    player.set('muted', false);
    player.set('controls', true);
    player.ancestor().ancestor().removeClass('hide');

    // Show upload button.
    uploadBtn.ancestor().ancestor().removeClass('hide');
    uploadBtn.set('textContent', M.util.get_string('attachrecording', 'tinymce_recordrtc'));
    uploadBtn.set('disabled', false);

    // Handle when upload button is clicked.
    uploadBtn.on('click', function() {
        // Trigger error if no recording has been made.
        if (!player.get('src') || chunks === []) {
            Y.use('moodle-core-notification-alert', function() {
                new M.core.alert({
                    title: M.util.get_string('norecordingfound_title', 'tinymce_recordrtc'),
                    message: M.util.get_string('norecordingfound', 'tinymce_recordrtc')
                });
            });
        } else {
            uploadBtn.set('disabled', true);

            // Upload recording to server.
            M.tinymce_recordrtc.upload_to_server(recType, function(progress, fileURLOrError) {
                if (progress === 'ended') { // Insert annotation in text.
                    uploadBtn.set('disabled', false);
                    M.tinymce_recordrtc.insert_annotation(recType, fileURLOrError);
                } else if (progress === 'upload-failed') { // Show error message in upload button.
                    uploadBtn.set('disabled', false);
                    uploadBtn.set('textContent', M.util.get_string('uploadfailed', 'tinymce_recordrtc') + ' ' + fileURLOrError);
                } else if (progress === 'upload-failed-404') { // 404 error = File too large in Moodle.
                    uploadBtn.set('disabled', false);
                    uploadBtn.set('textContent', M.util.get_string('uploadfailed404', 'tinymce_recordrtc'));
                } else if (progress === 'upload-aborted') {
                    uploadBtn.set('disabled', false);
                    uploadBtn.set('textContent', M.util.get_string('uploadaborted', 'tinymce_recordrtc') + ' ' + fileURLOrError);
                } else {
                    uploadBtn.set('textContent', progress);
                }
            });
        }
    });
};
