(function() {
    var params = {},
        r = /([^&=]+)=?([^&]*)/g;

    function d(s) {
        return decodeURIComponent(s.replace(/\+/g, ' '));
    }

    var match, search = window.location.search;
    while (match = r.exec(search.substring(1))) {
        params[d(match[1])] = d(match[2]);

        if (d(match[2]) === 'true' || d(match[2]) === 'false') {
            params[d(match[1])] = d(match[2]) === 'true' ? true : false;
        }
    }

    window.params = params;
})();

var recordingDIV = document.querySelector('.recordrtc');
var recordingMedia = recordingDIV.querySelector('.recording-media');
var recordingPlayer = recordingDIV.querySelector('video');
var mediaContainerFormat = recordingDIV.querySelector('.media-container-format');

//// Initialization for recordDIV
recordingDIV.querySelector('button').onclick = function() {
    var button = this;
    button.disabled = true;

    if (button.innerHTML === 'Stop Recording') {

        button.disableStateWaiting = true;
        setTimeout(function() {
            button.disabled = false;
            button.disableStateWaiting = false;
        }, 2 * 1000);

        button.innerHTML = 'Record Again';

        function stopStream() {
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

                        saveRecording(button.recordRTC[0]);
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

                    saveRecording(button.recordRTC);
                });
            }
        }

        return;

    } else { // It means ( button.innerHTML === 'Stop Recording' || button.innerHTML === 'Record Again' )

        var commonConfig = {
            onMediaCaptured: function(stream) {
                button.stream = stream;
                if (button.mediaCapturedCallback) {
                    button.mediaCapturedCallback();
                }

                button.innerHTML = 'Stop Recording';
                button.disabled = false;
            },
            onMediaStopped: function() {
                button.innerHTML = 'Start Recording';

                if (!button.disableStateWaiting) {
                    button.disabled = false;
                }
            },
            onMediaCapturingFailed: function(error) {
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
                }

                commonConfig.onMediaStopped();
            }
        };

        if (recordingMedia.value === 'record-audio') {
            captureAudio(commonConfig);

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
                    var audio = new Audio();
                    audio.src = url;
                    audio.controls = true;
                    //audio.id = recordrtc_get_recording_id(url);

                    recordingDIV.appendChild(document.createElement('hr'));
                    recordingDIV.appendChild(audio);

                    if (audio.paused) audio.play();

                    audio.onended = function() {
                        audio.pause();
                        audio.src = URL.createObjectURL(button.recordRTC.blob);
                    };
                    audio.onfocus = function() {
                        recordrtc_select_recording(audio, 'onfocus');
                    };
                    audio.onclick = function() {
                        recordrtc_select_recording(audio, 'onclick');
                    };
                    audio.onmouseover = function() {
                        recordrtc_select_recording(audio, 'onmouseover');
                    };

                    audio.click();
                };

                button.recordRTC.startRecording();

                // As a recording started, make sure the message for uploading the last recording is set
                recordingDIV.querySelector('#upload-to-server').innerHTML = "Upload Last Recording to Server";
            };
        }

        return;
    }
};

function captureAudio(config) {
    captureUserMedia({audio: true}, function(audioStream) {
        recordingPlayer.srcObject = audioStream;
        recordingPlayer.play();

        config.onMediaCaptured(audioStream);

        audioStream.onended = function() {
            config.onMediaStopped();
        };
    }, function(error) {
        config.onMediaCapturingFailed(error);
    });
}

function captureUserMedia(mediaConstraints, successCallback, errorCallback) {
    navigator.mediaDevices.getUserMedia(mediaConstraints).then(successCallback).catch(errorCallback);
}

function setMediaContainerFormat(arrayOfOptionsSupported) {
    var options = Array.prototype.slice.call(
        mediaContainerFormat.querySelectorAll('option')
    );

    var selectedItem;
    options.forEach(function(option) {
        option.disabled = true;

        if (arrayOfOptionsSupported.indexOf(option.value) !== -1) {
            option.disabled = false;

            if (!selectedItem) {
                option.selected = true;
                selectedItem = option;
            }
        }
    });
}


//// Initialization for recordingMedia
recordingMedia.onchange = function() {
    if (this.value === 'record-audio') {
        setMediaContainerFormat(['Ogg']);   // On Chrome this still uploads a .wav file
        return;
    }
    setMediaContainerFormat(['WebM', /*'Mp4',*/ 'Gif']);
};

if (webrtcDetectedBrowser === 'edge') {
    // webp isn't supported in Microsoft Edge
    // neither MediaRecorder API
    // so lets disable both video/screen recording options

    console.warn('Neither MediaRecorder API nor webp is supported in Microsoft Edge. You cam merely record audio.');

    recordingMedia.innerHTML = '<option value="record-audio">Audio</option>';
    setMediaContainerFormat(['WAV']);
}

// disabling this option because currently this demo
// doesn't supports publishing two blobs.
// todo: add support of uploading both WAV/WebM to server.
if (false && webrtcDetectedBrowser === 'chrome') {
    recordingMedia.innerHTML = '<option value="record-audio-plus-video">Audio+Video</option>' + recordingMedia.innerHTML;
    console.info('This RecordRTC demo merely tries to playback recorded audio/video sync inside the browser. It still generates two separate files (WAV/WebM).');
}

function saveRecording(recordRTC) {
    recordingDIV.querySelector('#save-to-disk').parentNode.style.display = 'block';
    recordingDIV.querySelector('#save-to-disk').onclick = function() {
        if (!recordRTC) return alert('No recording found.');

        recordRTC.save();
    };

    recordingDIV.querySelector('#upload-to-server').disabled = false;
    recordingDIV.querySelector('#upload-to-server').onclick = function() {
        // Find the one that is currently selected
        var selected = recordingDIV.querySelectorAll('audio.selected');
        // Trigger error if noone is found
        if ( selected.length == 0 ) return alert('No recording found.');

        if (!recordRTC) return alert('No recording found.');
        this.disabled = true;

        var button = this;
        uploadSelectedToServer(selected[0], function(progress, fileURL) {
            if (progress === 'ended') {
                //button.disabled = false;
                //button.innerHTML = 'Download Last Recording from Server';
                //button.onclick = function() {
                //    window.open(fileURL);
                //};

                recordrtc_view_annotate(fileURL);

                return;
            }
            button.innerHTML = progress;
        });
        /*
        uploadLastToServer(recordRTC, function(progress, fileURL) {
            if (progress === 'ended') {
                button.disabled = false;
                button.innerHTML = 'Download Last Recording from Server';
                button.onclick = function() {
                    window.open(fileURL);
                };

                //recordrtc_view_annotate(fileURL);

                return;
            }
            button.innerHTML = progress;
        });
        */
    };
}

var listOfFilesUploaded = [];

function uploadSelectedToServer(selected, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', selected.src, true);
    xhr.responseType = 'blob';
    xhr.onload = function(e) {
        if (this.status == 200) {
            // blob is now the blob that the object URL pointed to.
            var blob = this.response;
            var fileType = blob.type.split('/')[0] || 'audio';
            var fileName = selected.id;

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

            makeXMLHttpRequest('save.php', formData, function(progress) {
                if (progress !== 'upload-ended') {
                    callback(progress);
                    return;
                }

                var initialURL = location.href.replace(location.href.split('/').pop(), '') + 'uploads/';
                callback('ended', initialURL + fileName.replace('wav','ogg'));

                // to make sure we can delete as soon as visitor leaves
                // FFD: Added code to convert .wav to .ogg on the server
                listOfFilesUploaded.push(initialURL + fileName.replace('wav','ogg'));
            });
        }
    };
    xhr.send();
}

function uploadLastToServer(recordRTC, callback) {
    var blob = recordRTC instanceof Blob ? recordRTC : recordRTC.blob;
    var fileType = blob.type.split('/')[0] || 'audio';
    var fileName = recordrtc_get_recording_id(recordRTC.toURL());

    if (fileType === 'audio') {
        fileName += '.' + (!!navigator.mozGetUserMedia ? 'ogg' : 'wav');
    } else {
        fileName += '.webm';
    }

    // create FormData
    var formData = new FormData();
    formData.append(fileType + '-filename', fileName);
    formData.append(fileType + '-blob', blob);

    callback('Uploading ' + fileType + ' recording to server.');

    makeXMLHttpRequest('save.php', formData, function(progress) {
        if (progress !== 'upload-ended') {
            callback(progress);
            return;
        }

        var initialURL = location.href.replace(location.href.split('/').pop(), '') + 'uploads/';
        callback('ended', initialURL + fileName.replace('wav','ogg'));

        // to make sure we can delete as soon as visitor leaves
        // FFD: Added code to convert .wav to .ogg on the server
        listOfFilesUploaded.push(initialURL + fileName.replace('wav','ogg'));
    });
}

function makeXMLHttpRequest(url, data, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            callback('upload-ended');
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
    console.info(data);
    request.send(data);
}

window.onbeforeunload = function() {
    recordingDIV.querySelector('button').disabled = false;
    recordingMedia.disabled = false;
    mediaContainerFormat.disabled = false;

    if (!listOfFilesUploaded.length) return;

    listOfFilesUploaded.forEach(function(fileURL) {
        var request = new XMLHttpRequest();
        request.onreadystatechange = function() {
            if (request.readyState == 4 && request.status == 200) {
                if (this.responseText === ' problem deleting files.') {
                    return;
                }

                listOfFilesUploaded = [];
            }
        };
        request.open('POST', 'delete.php');

        var formData = new FormData();
        formData.append('delete-file', fileURL.split('/').pop());
        request.send(formData);
    });

    return 'Please wait few seconds before your recordings are deleted from the server.';
};

recordrtc_view_annotate = function(recording_url) {
    console.info('Annotate...');
    var annotation = recordrtc_create_annotation(recording_url);

    tinyMCEPopup.editor.execCommand('mceInsertContent', false, annotation);
    tinyMCEPopup.close();
};

recordrtc_create_annotation = function(recording_url) {
    console.info('Creating annotation...');
    //Shows an icon in both, the editor content box and the submission page
    var annotation = '<div id="recordrtc_annotation" class="text-center"><a target="_blank" href="' + recording_url + '"><img alt="RecordRTC Annotation" title="RecordRTC Annotation" src="' + recordrtc.recording_icon32 + '" /></a></div>';
    //Shows a text in the editor content box and a player in the submission page
    //var annotation = '<div id="recordrtc_annotation" class="text-center"><a target="_blank" href="' + recording_url + '">RecordRTC Annotation</a></div>';
    return annotation;
};

recordrtc_select_recording = function(audio, event) {
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

recordrtc_get_recording_id = function (url) {
    return url.substr(url.lastIndexOf('/') + 1);
};