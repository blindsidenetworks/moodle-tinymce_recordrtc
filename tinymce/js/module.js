
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

var recordingDIV = null;
var recordingMedia = null;
var audioPlayer = null;
var videoPlayer = null;
var countdownSeconds = null;
var countdownTicker = null;

M.tinymce_recordrtc.view_init = function() {
    console.info('Init tinymce_recordrtc.js...');
    //// Declaration of global variables
    recordingDIV = document.querySelector('.recordrtc');
    recordingMedia = recordingDIV.querySelector('.recording-media');
    audioPlayer = recordingDIV.querySelector('#audio-player');
    videoPlayer = recordingDIV.querySelector('#video-player');

    //// Initializations for recordDIV
    recordingDIV.querySelector('button').onclick = function() {
        var button = this;
        button.disabled = true;

        if ( button.innerHTML.indexOf('Start Recording') >= 0 || button.innerHTML.indexOf('Record Again') >= 0 ) {
            // Hide alert-danger if shown
            var alert = document.querySelector('div[id=alert-danger]');
            alert.innerHTML = "";
            alert.classList.add('hide');
            // Make sure the upload button is not shown
            recordingDIV.querySelector('#upload').parentNode.style.display = 'none';

            var commonConfig = {
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
                onMediaStopped: function(btnLabel) {
                    button.innerHTML = btnLabel;

                    if (!button.disableStateWaiting) {
                        button.disabled = false;
                    }
                },
                onMediaCapturingFailed: function(error) {
                    var btnLabel = 'Start Recording';
                    if (error.name === 'PermissionDeniedError' && !!navigator.mozGetUserMedia) {
                        InstallTrigger.install({
                            'Foo': {
                                // https://addons.mozilla.org/firefox/downloads/latest/655146/addon-655146-latest.xpi?src=dp-btn-primary
                                URL: 'https://addons.mozilla.org/en-US/firefox/addon/enable-screen-capturing/',
                                toString: function () {
                                    return this.URL;
                                }
                            }
                        });
                    } else if ( /* For most browsers */ error.name === 'DevicesNotFoundError' || /* For Firefox */ error.name === 'NotFoundError' ) {
                        // Show alert
                        var alert = document.querySelector('div[id=alert-danger]');
                        alert.classList.remove('hide');
                        alert.innerHTML = "There is no input device enabled";
                        // Update button
                        if ( button.innerHTML.indexOf('Start Recording') >= 0 ) {
                            btnLabel = 'Start Recording failed, try again';
                        } else {
                            btnLabel = 'Record Again failed, try once more';
                        }
                        // Send alert to the development console
                        console.info(alert.innerHTML);
                    }

                    commonConfig.onMediaStopped(btnLabel);
                }
            };

            if (recordingMedia.value === 'record-audio') {
                audioPlayer.classList.add('hide');
                videoPlayer.classList.add('hide');

                M.tinymce_recordrtc.captureAudio(commonConfig);

                button.mediaCapturedCallback = function() {
                    button.recordRTC = RecordRTC(button.stream, {
                        type: 'audio',
                        bufferSize: typeof params.bufferSize == 'undefined' ? 0 : parseInt(params.bufferSize),
                        sampleRate: typeof params.sampleRate == 'undefined' ? 44100 : parseInt(params.sampleRate),
                        leftChannel: params.leftChannel || false,
                        disableLogs: params.disableLogs || false,
                        recorderType: webrtcDetectedBrowser === 'edge' ? StereoAudioRecorder : null
                    });

                    button.recordingEndedCallback = function(url) {
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

                    button.recordRTC.startRecording();

                    // As a recording started, make sure the message for uploading the last recording is set
                    recordingDIV.querySelector('#upload').innerHTML = "Upload Recording to Server";
                };
            }

            if(recordingMedia.value === 'record-video') {
                audioPlayer.classList.add('hide');
                videoPlayer.classList.remove('hide');
                videoPlayer.controls = false;

                M.tinymce_recordrtc.captureAudioPlusVideo(commonConfig);
                button.mediaCapturedCallback = function() {
                    button.recordRTC = RecordRTC(button.stream, {
                        type: 'video',
                        disableLogs: params.disableLogs || false
                    });
                    button.recordingEndedCallback = function(url) {
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

                    button.recordRTC.startRecording();

                    // As a recording started, make sure the message for uploading the last recording is set
                    recordingDIV.querySelector('#upload').innerHTML = "Upload Recording to Server";
                };
            }

            return;

        } else { // It means (button.innerHTML === 'Stop Recording')

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

    //// Initialization for recordingMedia
    if ( webrtcDetectedBrowser !== 'firefox' ) {
        var alert = document.querySelector('div[id=alert-info]');
        alert.innerHTML == "Use Firefox for best experience";
        alert.classList.remove('hide');
    }
    if (webrtcDetectedBrowser === 'edge') {
        // webp isn't supported in Microsoft Edge
        // neither MediaRecorder API
        // so lets disable both video/screen recording options
        console.warn('Neither MediaRecorder API nor webp is supported in Microsoft Edge. You can merely record audio.');

        recordingMedia.innerHTML = '<option value="record-audio">Audio</option>';
    }
};

//// Functions
M.tinymce_recordrtc.captureAudio = function(config) {
    M.tinymce_recordrtc.captureUserMedia(
        // media constraints
        {audio: true},
        // success callback
        function(audioStream) {
            audioPlayer.srcObject = audioStream;
            audioPlayer.play();

            config.onMediaCaptured(audioStream);

            audioStream.onended = function() {
                config.onMediaStopped('Start Recording');
            };
        },
        // error callback
        function(error) {
            console.info("MediaCapturingFailed: " + error.name);
            config.onMediaCapturingFailed(error);
        }
    );
}

M.tinymce_recordrtc.captureAudioPlusVideo = function(config) {
    M.tinymce_recordrtc.captureUserMedia(
      {video: true, audio: true},
      function(audioVideoStream) {
        videoPlayer.srcObject = audioVideoStream;
        videoPlayer.play();
        config.onMediaCaptured(audioVideoStream);
        audioVideoStream.onended = function() {
            config.onMediaStopped();
        };
    }, function(error) {
        config.onMediaCapturingFailed(error);
    });
}

M.tinymce_recordrtc.captureUserMedia = function(mediaConstraints, successCallback, errorCallback) {
    navigator.mediaDevices.getUserMedia(mediaConstraints).then(successCallback).catch(errorCallback);
}

M.tinymce_recordrtc.startRecording = function(recordRTC) {
    recordingDIV.querySelector('#upload').parentNode.style.display = 'block';
    recordingDIV.querySelector('#upload').disabled = false;
    recordingDIV.querySelector('#upload').onclick = function() {
        // Find the one that is currently selected
        var selected;
        if (recordingDIV.querySelectorAll('audio.hide').length === 0) {
            selected = recordingDIV.querySelector('audio');
        } else {
            selected = recordingDIV.querySelector('video');
        }
        // Trigger error if noone is found
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

M.tinymce_recordrtc.uploadSelectedToServer = function(selected, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', selected.src, true);
    xhr.responseType = 'blob';
    xhr.onload = function(e) {
        if (this.status == 200) {
            // blob is now the blob that the object URL pointed to.
            var date = new Date();

            var blob = this.response;
            var fileType = blob.type.split('/')[0] || 'audio';
            var fileName = date.getYear() + date.getMonth() + date.getDay() +
                           date.getHours() + date.getMinutes() +
                           date.getSeconds() + '-' +
                           (Math.random() * 1000).toString().replace('.', '');

            if (fileType === 'audio') {
                fileName += '.' + (!!navigator.mozGetUserMedia ? 'ogg' : 'wav');
            } else {
                fileName += '.webm';
            }

            // create FormData
            var formData = new FormData();
            formData.append('contextid', recordrtc.contextid);
            formData.append('sesskey', parent.M.cfg.sesskey);
            formData.append(fileType + '-filename', fileName);
            formData.append(fileType + '-blob', blob);

            callback('Uploading ' + fileType + ' recording to server.');

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

    request.open('POST', url);
    request.send(data);
}

M.tinymce_recordrtc.view_annotate = function(recording_url) {
    var annotation = M.tinymce_recordrtc.create_annotation(recording_url);

    tinyMCEPopup.editor.execCommand('mceInsertContent', false, annotation);
    tinyMCEPopup.close();
};

M.tinymce_recordrtc.create_annotation = function(recording_url) {
    //Shows an icon in both, the editor content box and the submission page
    //var annotation = '<div id="recordrtc_annotation" class="text-center"><a target="_blank" href="' + recording_url + '"><img alt="RecordRTC Annotation" title="RecordRTC Annotation" src="' + recordrtc.recording_icon32 + '" /></a></div>';
    //Shows a text in the editor content box and a player in the submission page
    var annotation = '<div id="recordrtc_annotation" class="text-center"><a target="_blank" href="' + recording_url + '">RecordRTC Annotation</a></div>';
    return annotation;
};

M.tinymce_recordrtc.select_recording = function(audio) {
    // Find the one that is currently selected
    var selected = recordingDIV.querySelectorAll('audio.selected');

    // Remove the class selected from the current one selected, if there is one
    if ( selected.length > 0 ) {
        if ( selected[0].id != audio.id ) {
            selected[0].classList.remove('selected');
        }
    }

    // Add the class selected to the new one
    audio.classList.add('selected');
};

M.tinymce_recordrtc.get_recording_id = function (url) {
    return url.substr(url.lastIndexOf('/') + 1);
};

M.tinymce_recordrtc.setTime = function () {
    countdownSeconds--;
    recordingDIV.querySelector('label[id=seconds]').innerHTML = M.tinymce_recordrtc.pad(countdownSeconds%60);
    recordingDIV.querySelector('label[id=minutes]').innerHTML = M.tinymce_recordrtc.pad(parseInt(countdownSeconds/60));
    if ( countdownSeconds === 0 ) {
        recordingDIV.querySelector('button').click();
    }
};

M.tinymce_recordrtc.pad = function (val) {
    var valString = val + "";
    if (valString.length < 2) {
        return "0" + valString;
    } else {
        return valString;
    }
}
