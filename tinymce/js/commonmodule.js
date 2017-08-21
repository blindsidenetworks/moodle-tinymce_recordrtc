// TinyMCE recordrtc library functions.
// @package    tinymce_recordrtc.
// @author     Jesus Federico  (jesus [at] blindsidenetworks [dt] com).
// @author     Jacob Prud'homme (jacob [dt] prudhomme [at] blindsidenetworks [dt] com)
// @copyright  2016 onwards, Blindside Networks Inc.
// @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later.

// ESLint directives.
/* global tinyMCE, tinyMCEPopup */
/* exported countdownTicker, playerDOM */
/* eslint-disable camelcase, no-alert */

// Scrutinizer CI directives.
/** global: M */
/** global: Y */
/** global: recordrtc */
/** global: tinyMCEPopup */

M.tinymce_recordrtc = M.tinymce_recordrtc || {};

// Extract plugin settings to params hash.
(function() {
    var params = {};
    var r = /([^&=]+)=?([^&]*)/g;

    var d = function(s) {
        return window.decodeURIComponent(s.replace(/\+/g, ' '));
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
var alertWarning = null;
var alertDanger = null;
var blobSize = null;
var chunks = null;
var countdownSeconds = null;
var countdownTicker = null;
var maxUploadSize = null;
var mediaRecorder = null;
var player = null;
var playerDOM = null;
var recType = null;
var startStopBtn = null;
var uploadBtn = null;

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

// Capture webcam/microphone stream.
M.tinymce_recordrtc.capture_user_media = function(mediaConstraints, successCallback, errorCallback) {
    window.navigator.mediaDevices.getUserMedia(mediaConstraints).then(successCallback).catch(errorCallback);
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

    if (compatTypes !== []) {
        options.mimeType = compatTypes[0];
    }

    return options;
};

// Add chunks of audio/video to array when made available.
M.tinymce_recordrtc.handle_data_available = function(event) {
    // Size of all recorded data so far.
    blobSize += event.data.size;

    // Push recording slice to array.
    // If total size of recording so far exceeds max upload limit, stop recording.
    // An extra condition exists to avoid displaying alert twice.
    if ((blobSize >= maxUploadSize) && (!window.localStorage.getItem('alerted'))) {
        window.localStorage.setItem('alerted', 'true');

        Y.use('node-event-simulate', function() {
            startStopBtn.simulate('click');
        });
        M.tinymce_recordrtc.show_alert('nearingmaxsize');
    } else if ((blobSize >= maxUploadSize) && (window.localStorage.getItem('alerted') === 'true')) {
        window.localStorage.removeItem('alerted');
    } else {
        chunks.push(event.data);
    }
};

M.tinymce_recordrtc.handle_stop = function() {
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
            M.tinymce_recordrtc.show_alert('norecordingfound');
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

// Get everything set up to start recording.
M.tinymce_recordrtc.start_recording = function(type, stream) {
    // The options for the recording codecs and bitrates.
    var options = M.tinymce_recordrtc.select_rec_options(type);
    mediaRecorder = new window.MediaRecorder(stream, options);

    // Initialize MediaRecorder events and start recording.
    mediaRecorder.ondataavailable = M.tinymce_recordrtc.handle_data_available;
    mediaRecorder.onstop = M.tinymce_recordrtc.handle_stop;
    mediaRecorder.start(1000); // Capture in 1s chunks. Must be set to work with Firefox.

    // Mute audio, distracting while recording.
    player.set('muted', true);

    // Set recording timer to the time specified in the settings.
    countdownSeconds = window.params.timelimit;
    countdownSeconds++;
    var timerText = M.util.get_string('stoprecording', 'tinymce_recordrtc');
    timerText += ' (<span id="minutes"></span>:<span id="seconds"></span>)';
    startStopBtn.setHTML(timerText);
    M.tinymce_recordrtc.set_time();
    countdownTicker = window.setInterval(M.tinymce_recordrtc.set_time, 1000);

    // Make button clickable again, to allow stopping recording.
    startStopBtn.set('disabled', false);
};

// Upload recorded audio/video to server.
M.tinymce_recordrtc.upload_to_server = function(type, callback) {
    var xhr = new window.XMLHttpRequest();

    // Get src media of audio/video tag.
    xhr.open('GET', player.get('src'), true);
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

            // Create FormData to send to PHP filepicker-upload script.
            var formData = new window.FormData(),
                editorId = tinyMCE.activeEditor.id,
                filepickerOptions = parent.M.editor_tinymce.filepicker_options[editorId].link,
                repositoryKeys = window.Object.keys(filepickerOptions.repositories);

            formData.append('repo_upload_file', blob, fileName);
            formData.append('itemid', filepickerOptions.itemid);

            for (var i = 0; i < repositoryKeys.length; i++) {
                if (filepickerOptions.repositories[repositoryKeys[i]].type === 'upload') {
                    formData.append('repo_id', filepickerOptions.repositories[repositoryKeys[i]].id);
                    break;
                }
            }

            formData.append('env', filepickerOptions.env);
            formData.append('sesskey', M.cfg.sesskey);
            formData.append('client_id', filepickerOptions.client_id);
            formData.append('savepath', '/');
            formData.append('ctx_id', filepickerOptions.context.id);

            // Pass FormData to PHP script using XHR.
            var uploadEndpoint = M.cfg.wwwroot + '/repository/repository_ajax.php?action=upload';
            M.tinymce_recordrtc.make_xmlhttprequest(uploadEndpoint, formData, function(progress, responseText) {
                if (progress === 'upload-ended') {
                    callback('ended', window.JSON.parse(responseText).url);
                } else {
                    callback(progress);
                }
            });
        }
    };

    xhr.send();
};

// Handle XHR sending/receiving/status.
M.tinymce_recordrtc.make_xmlhttprequest = function(url, data, callback) {
    var xhr = new window.XMLHttpRequest();

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
M.tinymce_recordrtc.set_time = function() {
    countdownSeconds--;

    startStopBtn.one('span#seconds').set('textContent', M.tinymce_recordrtc.pad(countdownSeconds % 60));
    startStopBtn.one('span#minutes').set('textContent', M.tinymce_recordrtc.pad(window.parseInt(countdownSeconds / 60, 10)));

    if (countdownSeconds === 0) {
        Y.use('node-event-simulate', function() {
            startStopBtn.simulate('click');
        });
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
        var annotation = '<div><a target="_blank" href="' + recording_url + '">' + linkText + '</a></div>';
        return annotation;
    }
};

// Inserts link to annotation in editor text area.
M.tinymce_recordrtc.insert_annotation = function(type, recording_url) {
    var annotation = M.tinymce_recordrtc.create_annotation(type, recording_url);

    // Insert annotation link.
    // If user pressed "Cancel", just go back to main recording screen.
    if (!annotation) {
        uploadBtn.set('textContent', M.util.get_string('attachrecording', 'tinymce_recordrtc'));
    } else {
        tinyMCEPopup.editor.execCommand('mceInsertContent', false, annotation);
        tinyMCEPopup.close();
    }
};
