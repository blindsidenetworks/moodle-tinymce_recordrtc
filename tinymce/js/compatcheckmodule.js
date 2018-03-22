// TinyMCE recordrtc library functions for checking browser compatibility.
// @package    tinymce_recordrtc.
// @author     Jesus Federico  (jesus [at] blindsidenetworks [dt] com).
// @author     Jacob Prud'homme (jacob [dt] prudhomme [at] blindsidenetworks [dt] com)
// @copyright  2016 onwards, Blindside Networks Inc.
// @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later.

// ESLint directives.
/* global tinyMCEPopup, alertWarning, alertDanger */
/* exported countdownTicker, playerDOM */
/* eslint-disable camelcase, no-alert */

// Scrutinizer CI directives.
/** global: navigator */
/** global: M */
/** global: tinyMCEPopup */
/** global: alertDanger */
/** global: alertWarning */

M.tinymce_recordrtc = M.tinymce_recordrtc || {};

// Show alert and close plugin if browser does not support WebRTC at all.
M.tinymce_recordrtc.check_has_gum = function() {
    if (!(navigator.mediaDevices && window.MediaRecorder)) {
        M.tinymce_recordrtc.show_alert('nowebrtc', function() {
            tinyMCEPopup.close();
        });
    }
};

// Notify and redirect user if plugin is used from insecure location.
M.tinymce_recordrtc.check_secure = function() {
    var isSecureOrigin = (window.location.protocol === 'https:') ||
                         (window.location.host.indexOf('localhost') !== -1);

    if (!isSecureOrigin && (window.bowser.chrome || window.bowser.opera)) {
        M.tinymce_recordrtc.show_alert('gumsecurity', function() {
            tinyMCEPopup.close();
        });
    } else if (!isSecureOrigin) {
        alertDanger.ancestor().ancestor().removeClass('hide');
    }
};

// Display "consider switching browsers" message if not using:
// - Firefox 29+;
// - Chrome 49+;
// - Opera 36+.
M.tinymce_recordrtc.check_browser = function() {
    if (!((window.bowser.firefox && window.bowser.version >= 29) ||
          (window.bowser.chrome && window.bowser.version >= 49) ||
          (window.bowser.opera && window.bowser.version >= 36))) {
        alertWarning.ancestor().ancestor().removeClass('hide');
    }
};
