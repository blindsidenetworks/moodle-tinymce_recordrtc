// TinyMCE recordrtc library functions.
// @package    tinymce_recordrtc.
// @author     Jesus Federico  (jesus [at] blindsidenetworks [dt] com).
// @author     Jacob Prud'homme (jacob [dt] prudhomme [at] blindsidenetworks [dt] com)
// @copyright  2016 onwards, Blindside Networks Inc.
// @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later.

// ESLint directives.
/* global recordrtc, alertWarning, alertDanger, player, playerDOM, startStopBtn, uploadBtn */
/* global recType, maxUploadSize, chunks, blobSize, countdownTicker */
/* exported alertWarning, alertDanger, maxUploadSize, chunks, blobSize */
/* eslint-disable camelcase, no-global-assign */

// JSHint directives.
/* global alertWarning: true, alertDanger: true, player: true, playerDOM: true, startStopBtn: true */
/* global uploadBtn: true, recType: true, maxUploadSize: true, chunks: true, blobSize: true */

// Scrutinizer CI directives.
/** global: M */
/** global: Y */
/** global: recordrtc */
/** global: alertWarning */
/** global: alertDanger */
/** global: blobSize */
/** global: chunks */
/** global: countdownSeconds */
/** global: countdownTicker */
/** global: maxUploadSize */
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
    player = Y.one('video#player');
    playerDOM = document.querySelector('video#player');
    startStopBtn = Y.one('button#start-stop');
    uploadBtn = Y.one('button#upload');
    recType = 'video';
    // Extract the numbers from the string, and convert to bytes.
    maxUploadSize = window.parseInt(recordrtc.maxfilesize.match(/\d+/)[0], 10) * Math.pow(1024, 2);

    // Show alert and close plugin if WebRTC is not supported.
    M.tinymce_recordrtc.check_has_gum();
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
            // Make sure the upload button is not shown.
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
                    // Make video stream available at a higher level by making it a property of startStopBtn.
                    startStopBtn.stream = stream;

                    M.tinymce_recordrtc.start_recording(recType, startStopBtn.stream);
                },

                // Revert button to "Record Again" when recording is stopped.
                onMediaStopped: function(btnLabel) {
                    startStopBtn.set('textContent', btnLabel);
                    startStopBtn.set('disabled', false);
                    if (!recordrtc.oldermoodle) {
                        startStopBtn.replaceClass('btn-danger', 'btn-outline-danger');
                    }
                },

                // Handle recording errors.
                onMediaCapturingFailed: function(error) {
                    M.tinymce_recordrtc.handle_gum_errors(error, commonConfig);
                }
            };

            // Show video tag without controls to view webcam stream.
            player.ancestor().ancestor().removeClass('hide');
            player.set('controls', false);

            // Capture audio+video stream from webcam/microphone.
            M.tinymce_recordrtc.capture_audio_video(commonConfig);
        } else { // If button is displaying "Stop Recording".
            // First of all clears the countdownTicker.
            window.clearInterval(countdownTicker);

            // Disable "Record Again" button for 1s to allow background processing (closing streams).
            window.setTimeout(function() {
                startStopBtn.set('disabled', false);
            }, 1000);

            // Stop recording.
            M.tinymce_recordrtc.stop_recording(startStopBtn.stream);

            // Change button to offer to record again.
            startStopBtn.set('textContent', M.util.get_string('recordagain', 'tinymce_recordrtc'));
            if (!recordrtc.oldermoodle) {
                startStopBtn.replaceClass('btn-danger', 'btn-outline-danger');
            }
        }
    });
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
            playerDOM.srcObject = audioVideoStream;
            playerDOM.play();

            config.onMediaCaptured(audioVideoStream);
        },

        // Error callback.
        function(error) {
            config.onMediaCapturingFailed(error);
        }
    );
};
