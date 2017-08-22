// TinyMCE recordrtc library functions for function abstractions.
// @package    tinymce_recordrtc.
// @author     Jesus Federico  (jesus [at] blindsidenetworks [dt] com).
// @author     Jacob Prud'homme (jacob [dt] prudhomme [at] blindsidenetworks [dt] com)
// @copyright  2016 onwards, Blindside Networks Inc.
// @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later.

// ESLint directives.
/* global tinyMCEPopup */
/* exported countdownTicker, playerDOM */
/* eslint-disable camelcase, no-alert */

// Scrutinizer CI directives.
/** global: M */
/** global: Y */
/** global: tinyMCEPopup */

M.tinymce_recordrtc = M.tinymce_recordrtc || {};

// A helper for making a Moodle alert appear.
// Subject is the content of the alert (which error ther alert is for).
// Possibility to add on-alert-close event.
M.tinymce_recordrtc.show_alert = function(subject, onCloseEvent) {
    Y.use('moodle-core-notification-alert', function() {
        var dialogue = new M.core.alert({
            title: M.util.get_string(subject + '_title', 'tinymce_recordrtc'),
            message: M.util.get_string(subject, 'tinymce_recordrtc')
        });

        if (onCloseEvent) {
            dialogue.after('complete', onCloseEvent);
        }
    });
};

// Handle getUserMedia errors.
M.tinymce_recordrtc.handle_gum_errors = function(error, commonConfig) {
    var btnLabel = M.util.get_string('recordingfailed', 'tinymce_recordrtc'),
        treatAsStopped = function() {
            commonConfig.onMediaStopped(btnLabel);
        };

    // Changes 'CertainError' -> 'gumcertain' to match language string names.
    var stringName = 'gum' + error.name.replace('Error', '').toLowerCase();

    // After alert, proceed to treat as stopped recording, or close dialogue.
    if (stringName !== 'gumsecurity') {
        M.tinymce_recordrtc.show_alert(stringName, treatAsStopped);
    } else {
        M.tinymce_recordrtc.show_alert(stringName, function() {
            tinyMCEPopup.close();
        });
    }
};

// Select best options for the recording codec.
M.tinymce_recordrtc.select_rec_options = function(recType) {
    var types, options;

    if (recType === 'audio') {
        types = [
            'audio/webm;codecs=opus',
            'audio/ogg;codecs=opus'
        ];
        options = {
            audioBitsPerSecond: window.parseInt(window.params.audiobitrate)
        };
    } else {
        types = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=h264,opus',
            'video/webm;codecs=vp8,opus'
        ];
        options = {
            audioBitsPerSecond: window.parseInt(window.params.audiobitrate),
            videoBitsPerSecond: window.parseInt(window.params.videobitrate)
        };
    }

    var compatTypes = types.filter(function(type) {
        return window.MediaRecorder.isTypeSupported(type);
    });

    if (compatTypes.length !== 0) {
        options.mimeType = compatTypes[0];
    }

    return options;
};
