// TinyMCE recordrtc library functions.
// @package    tinymce_recordrtc.
// @author     Jesus Federico  (jesus [at] blindsidenetworks [dt] com).
// @copyright  2016 to present, Blindside Networks Inc.
// @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later.

/** global: M */
/** global: tinyMCEPopup */
/** global: bowser */
/** global: params */
/** global: recordrtc */

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
var recType = null;
var mediaRecorder = null;
var chunks = null;
var blobSize = null;
var maxUploadSize = null;

// Notify and redirect user if plugin is used from insecure location.
M.tinymce_recordrtc.check_secure = function() {
    var isSecureOrigin = (window.location.protocol === 'https:') ||
                         (window.location.host.indexOf('localhost') !== -1);

    if (!isSecureOrigin) {
        window.alert(M.util.get_string('insecurealert', 'tinymce_recordrtc'));
        tinyMCEPopup.close();
    }
}

// Display "consider switching browsers" message if not using:
// - Firefox 29+;
// - Chrome 49+;
// - Opera 36+.
M.tinymce_recordrtc.check_browser = function() {
    if (!((bowser.firefox && bowser.version >= 29) ||
          (bowser.chrome && bowser.version >= 49) ||
          (bowser.opera && bowser.version >= 36))) {
        var alert = document.querySelector('div[id=alert-warning]');
        alert.parentElement.parentElement.classList.remove('hide');
    }
};

// Capture webcam/microphone stream.
M.tinymce_recordrtc.captureUserMedia = function(mediaConstraints, successCallback, errorCallback) {
    navigator.mediaDevices.getUserMedia(mediaConstraints).then(successCallback).catch(errorCallback);
};

// Add chunks of audio/video to array when made available.
M.tinymce_recordrtc.handleDataAvailable = function(event) {
    // Size of all recorded data so far.
    blobSize += event.data.size;

    // Push recording slice to array.
    // If total size of recording so far exceeds max upload limit, stop recording.
    // An extra condition exists to avoid displaying alert twice.
    if ((blobSize >= maxUploadSize) && (!localStorage.getItem('alerted'))) {
        localStorage.setItem('alerted', 'true');

        startStopBtn.click();
        window.alert(M.util.get_string('nearingmaxsize', 'tinymce_recordrtc'));
    } else if ((blobSize >= maxUploadSize) && (localStorage.getItem('alerted') === 'true')) {
        localStorage.removeItem('alerted');
    } else {
        chunks.push(event.data);
    }
};

// Get everything set up to start recording.
M.tinymce_recordrtc.startRecording = function(type, stream) {
    // The options for the recording codecs and bitrates.
    var options = null;
    if (type === 'audio') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            options = {
                audioBitsPerSecond: params['audiobitrate'],
                mimeType: 'audio/webm;codecs=opus'
            };
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
            options = {
                audioBitsPerSecond: params['audiobitrate'],
                mimeType: 'audio/ogg;codecs=opus'
            };
        }
    } else {
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
            options = {
                audioBitsPerSecond: params['audiobitrate'],
                videoBitsPerSecond: params['videobitrate'],
                mimeType: 'video/webm;codecs=vp9,opus'
            };
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264,opus')) {
            options = {
                audioBitsPerSecond: params['audiobitrate'],
                videoBitsPerSecond: params['videobitrate'],
                mimeType: 'video/webm;codecs=h264,opus'
            };
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
            options = {
                audioBitsPerSecond: params['audiobitrate'],
                videoBitsPerSecond: params['videobitrate'],
                mimeType: 'video/webm;codecs=vp8,opus'
            };
        }
    }

    // If none of the options above are supported, fall back on browser defaults.
    mediaRecorder = options ? new MediaRecorder(stream)
                            : new MediaRecorder(stream, options);

    // Initialize MediaRecorder events and start recording.
    mediaRecorder.ondataavailable = M.tinymce_recordrtc.handleDataAvailable;
    mediaRecorder.start(1000); // Capture in 10ms chunks. Must be set to work with Firefox.

    // Mute audio, distracting while recording.
    player.muted = true;

    // Set recording timer to the time specified in the settings.
    countdownSeconds = params['timelimit'];
    countdownSeconds++;
    startStopBtn.innerHTML = M.util.get_string('stoprecording', 'tinymce_recordrtc') + ' (<span id="minutes"></span>:<span id="seconds"></span>)';
    M.tinymce_recordrtc.setTime();
    countdownTicker = setInterval(M.tinymce_recordrtc.setTime, 1000);

    // Make button clickable again, to allow stopping recording.
    startStopBtn.disabled = false;
};

// Upload recorded audio/video to server.
M.tinymce_recordrtc.uploadToServer = function(type, callback) {
    var xhr = new XMLHttpRequest();

    // Get src media of audio/video tag.
    xhr.open('GET', player.src, true);
    xhr.responseType = 'blob';

    xhr.onload = function() {
        if (xhr.status === 200) { // If src media was successfully retrieved.
            // blob is now the media that the audio/video tag's src pointed to.
            var blob = this.response;

            // Generate filename with random ID and file extension.
            var fileName = (Math.random() * 1000).toString().replace('.', '');
            if (type === 'audio') {
                fileName += '-audio.ogg';
            } else {
                fileName += '-video.webm';
            }

            // Create FormData to send to PHP upload/save script.
            var formData = new FormData();
            formData.append('contextid', recordrtc.contextid);
            formData.append('sesskey', parent.M.cfg.sesskey);
            formData.append(type + '-filename', fileName);
            formData.append(type + '-blob', blob);

            // Pass FormData to PHP script using XHR.
            M.tinymce_recordrtc.makeXMLHttpRequest('save.php', formData, function(progress, responseText) {
                if (progress === 'upload-ended') {
                    var initialURL = location.href.replace(location.href.split('/').pop(), '') + 'uploads.php/';
                    callback('ended', initialURL + responseText);
                } else {
                    callback(progress);
                }
            });
        }
    };

    xhr.send();
};

// Handle XHR sending/receiving/status.
M.tinymce_recordrtc.makeXMLHttpRequest = function(url, data, callback) {
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function() {
        if ((xhr.readyState === 4) && (xhr.status === 200)) { // When request is finished and successful.
            callback('upload-ended', xhr.responseText);
        } else if (xhr.status === 404) { // When request returns 404 Not Found.
            callback('upload-failed-404');
        }
    };

    xhr.upload.onprogress = function(event) {
        callback(Math.round(event.loaded / event.total * 100) + "% " + M.util.get_string('uploadprogress', 'tinymce_recordrtc'));
    };

    xhr.upload.onerror = function(error) {
        callback('upload-failed', error);
    };

    xhr.upload.onabort = function(error) {
        callback('upload-aborted', error);
    };

    // POST FormData to PHP script that handles uploading/saving.
    xhr.open('POST', url);
    xhr.send(data);
};

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

// Generates link to recorded annotation to be inserted.
M.tinymce_recordrtc.create_annotation = function(type, recording_url) {
    var linkText = window.prompt(M.util.get_string('annotationprompt', 'tinymce_recordrtc'),
                                 M.util.get_string('annotation:' + type, 'tinymce_recordrtc'));

    // Return HTML for annotation link, if user did not press "Cancel".
    if (!linkText) {
        return undefined;
    } else {
        var annotation = '<div id="recordrtc_annotation" class="text-center"><a target="_blank" href="' + recording_url + '">' + linkText + '</a></div>';
        return annotation;
    }
};

// Inserts link to annotation in editor text area.
M.tinymce_recordrtc.insert_annotation = function(type, recording_url) {
    var annotation = M.tinymce_recordrtc.create_annotation(type, recording_url);

    // Insert annotation link.
    // If user pressed "Cancel", just go back to main recording screen.
    if (!annotation) {
        uploadBtn.textContent = M.util.get_string('attachrecording', 'tinymce_recordrtc');
    } else {
        tinyMCEPopup.editor.execCommand('mceInsertContent', false, annotation);
        tinyMCEPopup.close();
    }
};
