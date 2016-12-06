// Last time updated at Fri Jan 08 2016 14:06

// gumadapter.js
// https://cdn.webrtc-experiment.com/gumadapter.js

// getUserMedia hacks from git/webrtc/adapter; 
// removed redundant codes
// A-to-Zee, all copyrights goes to:
// https://github.com/webrtc/adapter/blob/master/LICENSE.md

var getUserMedia = null;
var webrtcDetectedBrowser = null;
var webrtcDetectedVersion = null;
var webrtcMinimumVersion = null;

var webrtcUtils = window.webrtcUtils || {};
if(!webrtcUtils.enableLogs) {
    webrtcUtils.enableLogs = true;
}
if(!webrtcUtils.log) {
    webrtcUtils.log = function() {
        if(!webrtcUtils.enableLogs) {
            return;
        }

        // suppress console.log output when being included as a module.
        if (typeof module !== 'undefined' ||
            typeof require === 'function' && typeof define === 'function') {
            return;
        }
        console.log.apply(console, arguments);
    };
}

if(!webrtcUtils.extractVersion) {
    webrtcUtils.extractVersion = function(uastring, expr, pos) {
        var match = uastring.match(expr);
        return match && match.length >= pos && parseInt(match[pos], 10);
    };
}

if (typeof window === 'object') {
  if (window.HTMLMediaElement &&
    !('srcObject' in window.HTMLMediaElement.prototype)) {
    // Shim the srcObject property, once, when HTMLMediaElement is found.
    Object.defineProperty(window.HTMLMediaElement.prototype, 'srcObject', {
      get: function() {
        // If prefixed srcObject property exists, return it.
        // Otherwise use the shimmed property, _srcObject
        return 'mozSrcObject' in this ? this.mozSrcObject : this._srcObject;
      },
      set: function(stream) {
        if ('mozSrcObject' in this) {
          this.mozSrcObject = stream;
        } else {
          // Use _srcObject as a private property for this shim
          this._srcObject = stream;
          // TODO: revokeObjectUrl(this.src) when !stream to release resources?
          this.src = stream ? URL.createObjectURL(stream) : null;
        }
      }
    });
  }
  // Proxy existing globals
  getUserMedia = window.navigator && window.navigator.getUserMedia;
}

if (typeof window === 'undefined' || !window.navigator) {
    webrtcDetectedBrowser = 'not a browser';
} else if (navigator.mozGetUserMedia && window.mozRTCPeerConnection) {
    webrtcDetectedBrowser = 'firefox';

    // the detected firefox version.
    webrtcDetectedVersion = webrtcUtils.extractVersion(navigator.userAgent,
        /Firefox\/([0-9]+)\./, 1);

    // the minimum firefox version still supported by adapter.
    webrtcMinimumVersion = 31;

    // getUserMedia constraints shim.
    getUserMedia = function(constraints, onSuccess, onError) {
        var constraintsToFF37 = function(c) {
            if (typeof c !== 'object' || c.require) {
                return c;
            }
            var require = [];
            Object.keys(c).forEach(function(key) {
                if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
                    return;
                }
                var r = c[key] = (typeof c[key] === 'object') ?
                    c[key] : {
                        ideal: c[key]
                    };
                if (r.min !== undefined ||
                    r.max !== undefined || r.exact !== undefined) {
                    require.push(key);
                }
                if (r.exact !== undefined) {
                    if (typeof r.exact === 'number') {
                        r.min = r.max = r.exact;
                    } else {
                        c[key] = r.exact;
                    }
                    delete r.exact;
                }
                if (r.ideal !== undefined) {
                    c.advanced = c.advanced || [];
                    var oc = {};
                    if (typeof r.ideal === 'number') {
                        oc[key] = {
                            min: r.ideal,
                            max: r.ideal
                        };
                    } else {
                        oc[key] = r.ideal;
                    }
                    c.advanced.push(oc);
                    delete r.ideal;
                    if (!Object.keys(r).length) {
                        delete c[key];
                    }
                }
            });
            if (require.length) {
                c.require = require;
            }
            return c;
        };
        if (webrtcDetectedVersion < 38) {
            webrtcUtils.log('spec: ' + JSON.stringify(constraints));
            if (constraints.audio) {
                constraints.audio = constraintsToFF37(constraints.audio);
            }
            if (constraints.video) {
                constraints.video = constraintsToFF37(constraints.video);
            }
            webrtcUtils.log('ff37: ' + JSON.stringify(constraints));
        }
        return navigator.mozGetUserMedia(constraints, onSuccess, onError);
    };

    navigator.getUserMedia = getUserMedia;

    // Shim for mediaDevices on older versions.
    if (!navigator.mediaDevices) {
        navigator.mediaDevices = {
            getUserMedia: requestUserMedia,
            addEventListener: function() {},
            removeEventListener: function() {}
        };
    }
    navigator.mediaDevices.enumerateDevices =
        navigator.mediaDevices.enumerateDevices || function() {
            return new Promise(function(resolve) {
                var infos = [{
                    kind: 'audioinput',
                    deviceId: 'default',
                    label: '',
                    groupId: ''
                }, {
                    kind: 'videoinput',
                    deviceId: 'default',
                    label: '',
                    groupId: ''
                }];
                resolve(infos);
            });
        };

    if (webrtcDetectedVersion < 41) {
        // Work around http://bugzil.la/1169665
        var orgEnumerateDevices =
            navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
        navigator.mediaDevices.enumerateDevices = function() {
            return orgEnumerateDevices().then(undefined, function(e) {
                if (e.name === 'NotFoundError') {
                    return [];
                }
                throw e;
            });
        };
    }

} else if (navigator.webkitGetUserMedia && window.webkitRTCPeerConnection) {
    webrtcDetectedBrowser = 'chrome';

    webrtcDetectedVersion = webrtcUtils.extractVersion(navigator.userAgent,
        /Chrom(e|ium)\/([0-9]+)\./, 2);

    // the minimum chrome version still supported by adapter.
    webrtcMinimumVersion = 38;

    // getUserMedia constraints shim.
    var constraintsToChrome = function(c) {
        if (typeof c !== 'object' || c.mandatory || c.optional) {
            return c;
        }
        var cc = {};
        Object.keys(c).forEach(function(key) {
            if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
                return;
            }
            var r = (typeof c[key] === 'object') ? c[key] : {
                ideal: c[key]
            };
            if (r.exact !== undefined && typeof r.exact === 'number') {
                r.min = r.max = r.exact;
            }
            var oldname = function(prefix, name) {
                if (prefix) {
                    return prefix + name.charAt(0).toUpperCase() + name.slice(1);
                }
                return (name === 'deviceId') ? 'sourceId' : name;
            };
            if (r.ideal !== undefined) {
                cc.optional = cc.optional || [];
                var oc = {};
                if (typeof r.ideal === 'number') {
                    oc[oldname('min', key)] = r.ideal;
                    cc.optional.push(oc);
                    oc = {};
                    oc[oldname('max', key)] = r.ideal;
                    cc.optional.push(oc);
                } else {
                    oc[oldname('', key)] = r.ideal;
                    cc.optional.push(oc);
                }
            }
            if (r.exact !== undefined && typeof r.exact !== 'number') {
                cc.mandatory = cc.mandatory || {};
                cc.mandatory[oldname('', key)] = r.exact;
            } else {
                ['min', 'max'].forEach(function(mix) {
                    if (r[mix] !== undefined) {
                        cc.mandatory = cc.mandatory || {};
                        cc.mandatory[oldname(mix, key)] = r[mix];
                    }
                });
            }
        });
        if (c.advanced) {
            cc.optional = (cc.optional || []).concat(c.advanced);
        }
        return cc;
    };

    getUserMedia = function(constraints, onSuccess, onError) {
        if (constraints.audio) {
            constraints.audio = constraintsToChrome(constraints.audio);
        }
        if (constraints.video) {
            constraints.video = constraintsToChrome(constraints.video);
        }
        webrtcUtils.log('chrome: ' + JSON.stringify(constraints));
        return navigator.webkitGetUserMedia(constraints, onSuccess, onError);
    };
    navigator.getUserMedia = getUserMedia;

    if (!navigator.mediaDevices) {
        navigator.mediaDevices = {
            getUserMedia: requestUserMedia
        };
    }

    // A shim for getUserMedia method on the mediaDevices object.
    // TODO(KaptenJansson) remove once implemented in Chrome stable.
    if (!navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia = function(constraints) {
            return requestUserMedia(constraints);
        };
    } else {
        // Even though Chrome 45 has navigator.mediaDevices and a getUserMedia
        // function which returns a Promise, it does not accept spec-style
        // constraints.
        var origGetUserMedia = navigator.mediaDevices.getUserMedia.
        bind(navigator.mediaDevices);
        navigator.mediaDevices.getUserMedia = function(c) {
            webrtcUtils.log('spec:   ' + JSON.stringify(c)); // whitespace for alignment
            c.audio = constraintsToChrome(c.audio);
            c.video = constraintsToChrome(c.video);
            webrtcUtils.log('chrome: ' + JSON.stringify(c));
            return origGetUserMedia(c);
        };
    }

    // Dummy devicechange event methods.
    // TODO(KaptenJansson) remove once implemented in Chrome stable.
    if (typeof navigator.mediaDevices.addEventListener === 'undefined') {
        navigator.mediaDevices.addEventListener = function() {
            webrtcUtils.log('Dummy mediaDevices.addEventListener called.');
        };
    }
    if (typeof navigator.mediaDevices.removeEventListener === 'undefined') {
        navigator.mediaDevices.removeEventListener = function() {
            webrtcUtils.log('Dummy mediaDevices.removeEventListener called.');
        };
    }

} else if (navigator.mediaDevices && navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) {
    webrtcUtils.log('This appears to be Edge');
    webrtcDetectedBrowser = 'edge';

    webrtcDetectedVersion = webrtcUtils.extractVersion(navigator.userAgent, /Edge\/(\d+).(\d+)$/, 2);

    // the minimum version still supported by adapter.
    webrtcMinimumVersion = 12;
} else {
    webrtcUtils.log('Browser does not appear to be WebRTC-capable');
}

// Returns the result of getUserMedia as a Promise.
function requestUserMedia(constraints) {
    return new Promise(function(resolve, reject) {
        getUserMedia(constraints, resolve, reject);
    });
}

if (typeof module !== 'undefined') {
    module.exports = {
        getUserMedia: getUserMedia,
        webrtcDetectedBrowser: webrtcDetectedBrowser,
        webrtcDetectedVersion: webrtcDetectedVersion,
        webrtcMinimumVersion: webrtcMinimumVersion,
        webrtcUtils: webrtcUtils
    };
} else if ((typeof require === 'function') && (typeof define === 'function')) {
    // Expose objects and functions when RequireJS is doing the loading.
    define([], function() {
        return {
            getUserMedia: getUserMedia,
            webrtcDetectedBrowser: webrtcDetectedBrowser,
            webrtcDetectedVersion: webrtcDetectedVersion,
            webrtcMinimumVersion: webrtcMinimumVersion,
            webrtcUtils: webrtcUtils
        };
    });
}

(function() {
    var params = {},
        r = /([^&=]+)=?([^&]*)/g;

    function d(s) {
        return decodeURIComponent(s.replace(/\+/g, ' '));
    }

    var match, search = window.location.search;
    while (match = r.exec(search.substring(1))) {
        params[d(match[1])] = d(match[2]);

        if(d(match[2]) === 'true' || d(match[2]) === 'false') {
            params[d(match[1])] = d(match[2]) === 'true' ? true : false;
        }
    }

    window.params = params;
})();

var recordingDIV = document.querySelector('.recordrtc');
var recordingMedia = recordingDIV.querySelector('.recording-media');
var recordingPlayer = recordingDIV.querySelector('video');
var mediaContainerFormat = recordingDIV.querySelector('.media-container-format');

recordingDIV.querySelector('button').onclick = function() {
    var button = this;

    if(button.innerHTML === 'Stop Recording') {
        button.disabled = true;
        button.disableStateWaiting = true;
        setTimeout(function() {
            button.disabled = false;
            button.disableStateWaiting = false;
        }, 2 * 1000);

        button.innerHTML = 'Record Again';

        function stopStream() {
            if(button.stream && button.stream.stop) {
                button.stream.stop();
                button.stream = null;
            }
        }

        if(button.recordRTC) {
            if(button.recordRTC.length) {
                button.recordRTC[0].stopRecording(function(url) {
                    if(!button.recordRTC[1]) {
                        button.recordingEndedCallback(url);
                        stopStream();

                        saveToDiskOrOpenNewTab(button.recordRTC[0]);
                        return;
                    }

                    button.recordRTC[1].stopRecording(function(url) {
                        button.recordingEndedCallback(url);
                        stopStream();
                    });
                });
            }
            else {
                button.recordRTC.stopRecording(function(url) {
                    button.recordingEndedCallback(url);
                    stopStream();

                    saveToDiskOrOpenNewTab(button.recordRTC);
                });
            }
        }

        return;
    }

    button.disabled = true;

    var commonConfig = {
        onMediaCaptured: function(stream) {
            button.stream = stream;
            if(button.mediaCapturedCallback) {
                button.mediaCapturedCallback();
            }

            button.innerHTML = 'Stop Recording';
            button.disabled = false;
        },
        onMediaStopped: function() {
            button.innerHTML = 'Start Recording';

            if(!button.disableStateWaiting) {
                button.disabled = false;
            }
        },
        onMediaCapturingFailed: function(error) {
            if(error.name === 'PermissionDeniedError' && !!navigator.mozGetUserMedia) {
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


    if(recordingMedia.value === 'record-audio') {
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
                recordingPlayer.parentNode.appendChild(document.createElement('hr'));
                recordingPlayer.parentNode.appendChild(audio);

                if(audio.paused) audio.play();

                audio.onended = function() {
                    audio.pause();
                    audio.src = URL.createObjectURL(button.recordRTC.blob);
                };
            };

            button.recordRTC.startRecording();
        };
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

        if(arrayOfOptionsSupported.indexOf(option.value) !== -1) {
            option.disabled = false;

            if(!selectedItem) {
                option.selected = true;
                selectedItem = option;
            }
        }
    });
}

recordingMedia.onchange = function() {
    if(this.value === 'record-audio') {
        setMediaContainerFormat(['Ogg']);   // On Chrome this still uploads a .wav file
        return;
    }
    setMediaContainerFormat(['WebM', /*'Mp4',*/ 'Gif']);
};

if(webrtcDetectedBrowser === 'edge') {
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
if(false && webrtcDetectedBrowser === 'chrome') {
    recordingMedia.innerHTML = '<option value="record-audio-plus-video">Audio+Video</option>'
                                + recordingMedia.innerHTML;
    console.info('This RecordRTC demo merely tries to playback recorded audio/video sync inside the browser. It still generates two separate files (WAV/WebM).');
}

function saveToDiskOrOpenNewTab(recordRTC) {
    recordingDIV.querySelector('#save-to-disk').parentNode.style.display = 'block';
    recordingDIV.querySelector('#save-to-disk').onclick = function() {
        if(!recordRTC) return alert('No recording found.');

        recordRTC.save();
    };

    recordingDIV.querySelector('#open-new-tab').onclick = function() {
        if(!recordRTC) return alert('No recording found.');

        window.open(recordRTC.toURL());
    };

    recordingDIV.querySelector('#upload-to-server').disabled = false;
    recordingDIV.querySelector('#upload-to-server').onclick = function() {
        if(!recordRTC) return alert('No recording found.');
        this.disabled = true;

        var button = this;
        uploadToServer(recordRTC, function(progress, fileURL) {
            if(progress === 'ended') {
                button.disabled = false;
                button.innerHTML = 'Click to download from server';
                button.onclick = function() {
                    window.open(fileURL);
                };
                return;
            }
            button.innerHTML = progress;
        });
    };
}

var listOfFilesUploaded = [];

function uploadToServer(recordRTC, callback) {
    var blob = recordRTC instanceof Blob ? recordRTC : recordRTC.blob;
    var fileType = blob.type.split('/')[0] || 'audio';
    var fileName = (Math.random() * 1000).toString().replace('.', '');

    if (fileType === 'audio') {
        // fileName += '.' + (!!navigator.mozGetUserMedia ? 'ogg' : 'wav');
        fileName += '.' + (!!navigator.mozGetUserMedia ? 'ogg' : 'wav');
    } else {
        fileName += '.webm';
    }

    // create FormData
    var formData = new FormData();
    formData.append(fileType + '-filename', fileName);
    formData.append(fileType + '-blob', blob);

    callback('Uploading ' + fileType + ' recording to server.');

    makeXMLHttpRequest('save-xyz.php', formData, function(progress) {
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
    request.send(data);
}

window.onbeforeunload = function() {
    recordingDIV.querySelector('button').disabled = false;
    recordingMedia.disabled = false;
    mediaContainerFormat.disabled = false;

    if(!listOfFilesUploaded.length) return;

    listOfFilesUploaded.forEach(function(fileURL) {
        var request = new XMLHttpRequest();
        request.onreadystatechange = function() {
            if (request.readyState == 4 && request.status == 200) {
                if(this.responseText === ' problem deleting files.') {
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