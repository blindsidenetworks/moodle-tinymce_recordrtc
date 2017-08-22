/**
 * TinyMCE plugin RecordRTC - provides UI to annotate the content in the text editor with a WebRTC recording.
 *
 * @package    tinymce_recordrtc
 * @author     Jesus Federico  (jesus [at] blindsidenetworks [dt] com)
 * @author     Jacob Prud'homme (jacob [dt] prudhomme [at] blindsidenetworks [dt] com)
 * @copyright  2016 onwards, Blindside Networks Inc.
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// ESLint directives.
/* global tinyMCE */
/* eslint-disable camelcase, require-jsdoc */

// Scrutinizer CI directives.
/** global: M */
/** global: tinyMCE */

function addForceRepaint(ed) {
    ed.addCommand('mceForceRepaint', function() {
        var root = ed.dom.getRoot(),
            items = root.getElementsByTagName("img");

        for (var i = 0; i < items.length; i++) {
            var src = items[i].getAttribute('src').replace(/\?\d+$/, '');
            items[i].setAttribute('src', src + '?' + (new Date().getTime()));
        }

        ed.execCommand('mceRepaint');
        ed.focus();
    });
}

function addMaximizeWindow(ed) {
    ed.addCommand('mceMaximizeWindow', function(w) {
        // This function duplicates the TinyMCE windowManager code when 'maximize' button is pressed.
        var vp = ed.dom.getViewPort(),
            id = w.id;

        // Reduce viewport size to avoid scrollbars.
        vp.w -= 2;
        vp.h -= 2;

        w.oldPos = w.element.getXY();
        w.oldSize = w.element.getSize();

        w.element.moveTo(vp.x, vp.y);
        w.element.resizeTo(vp.w, vp.h);

        ed.dom.setStyles(id + '_ifr', {width: vp.w - w.deltaWidth, height: vp.h - w.deltaHeight});
        ed.dom.addClass(id + '_wrapper', 'mceMaximized');
    });
}

function addAudio(ed, url) {
    ed.addCommand('mceAudioRTC', function() {
        var audiortc = ed.getParam('audiortc', {});
        var viewparams = '';
        window.Object.keys(audiortc).forEach(function(key) {
            viewparams += (viewparams !== '' ? '&' : '') + window.encodeURIComponent(key);
            viewparams += '=' + window.encodeURIComponent(audiortc[key]);
        });
        var viewurl = ed.getParam("moodle_plugin_base") + 'recordrtc/audiortc.php';
        viewurl += (viewparams != '' ? '?' + viewparams : '');

        var onClose = function() {
            ed.windowManager.onClose.remove(onClose);
            ed.execCommand('mceForceRepaint');
        };
        ed.windowManager.onClose.add(onClose);

        var vp = ed.dom.getViewPort(),
            baseWidth = 640 + window.parseInt(ed.getLang('advimage.delta_width', 0)),
            percentOfViewportWidth = vp.w * 0.75,
            width = percentOfViewportWidth > baseWidth ? percentOfViewportWidth : baseWidth,
            height = 340 + window.parseInt(ed.getLang('advimage.delta_width', 0)),
            maximizedmode = (width >= vp.w - 2 || height >= vp.h - 2);
        if (maximizedmode) {
            width = vp.w;
            height = vp.h;
        }
        var w = ed.windowManager.open({
            file: viewurl,
            width: width,
            height: height,
            inline: 1,
            popup_css: ed.getParam("moodle_plugin_base") + 'recordrtc/tinymce/css/popup.css'
        }, {
            plugin_url: url // Plugin absolute URL.
        });
        if (maximizedmode) {
            ed.execCommand('mceMaximizeWindow', w);
        }
    });

    // Register AudioRTC button.
    ed.addButton('audiortc', {
        title: 'recordrtc.audiortc',
        cmd: 'mceAudioRTC',
        image: url + '/img/audiortc.png'
    });
}

function addVideo(ed, url) {
    ed.addCommand('mceVideoRTC', function() {
        var videortc = ed.getParam('videortc', {});
        var viewparams = '';
        window.Object.keys(videortc).forEach(function(key) {
            viewparams += (viewparams !== '' ? '&' : '') + window.encodeURIComponent(key);
            viewparams += '=' + window.encodeURIComponent(videortc[key]);
        });
        var viewurl = ed.getParam("moodle_plugin_base") + 'recordrtc/videortc.php';
        viewurl += (viewparams != '' ? '?' + viewparams : '');

        var onClose = function() {
            ed.windowManager.onClose.remove(onClose);
            ed.execCommand('mceForceRepaint');
        };
        ed.windowManager.onClose.add(onClose);

        var vp = ed.dom.getViewPort(),
            baseWidth = 720 + window.parseInt(ed.getLang('advimage.delta_width', 0)),
            percentOfViewportWidth = vp.w * 0.75,
            width = percentOfViewportWidth > baseWidth ? percentOfViewportWidth : baseWidth,
            height = 780 + window.parseInt(ed.getLang('advimage.delta_width', 0)),
            maximizedmode = (width >= vp.w - 2 || height >= vp.h - 2);
        if (maximizedmode) {
            width = vp.w;
            height = vp.h;
        }
        var w = ed.windowManager.open({
            file: viewurl,
            width: width,
            height: height,
            inline: 1,
            popup_css: ed.getParam("moodle_plugin_base") + 'recordrtc/tinymce/css/popup.css'
        }, {
            plugin_url: url // Plugin absolute URL.
        });
        if (maximizedmode) {
            ed.execCommand('mceMaximizeWindow', w);
        }
    });

    // Register VideoRTC button.
    ed.addButton('videortc', {
        title: 'recordrtc.videortc',
        cmd: 'mceVideoRTC',
        image: url + '/img/videortc.png'
    });
}

(function() {
    tinyMCE.PluginManager.requireLangPack('recordrtc');

    tinyMCE.create('tinymce.plugins.RecordRTC', {
        /**
         * Initializes the plugin, this will be executed after the plugin has been created.
         * This call is done before the editor instance has finished it's initialization so use the onInit event
         * of the editor instance to intercept that event.
         *
         * @param {tinyMCE.Editor} ed Editor instance that the plugin is initialized in.
         * @param {string} url Absolute URL to where the plugin is located.
         */
        init: function(ed, url) {
            // Add commands to the editor.
            addForceRepaint(ed);
            addMaximizeWindow(ed);

            if (M.editor_tinymce.filepicker_options[ed.id] &&
                M.editor_tinymce.filepicker_options[ed.id].hasOwnProperty('media')) {
                addAudio(ed, url);
                addVideo(ed, url);
            }
        },

        createControl: function() {
            return null;
        },

        /**
         * Returns information about the plugin as a name/value array.
         * The current keys are longname, author, authorurl, infourl and version.
         *
         * @return {Object} Name/value array containing information about the plugin.
         */
        getInfo: function() {
            return {
                longname: 'Moodle TinyMCE RecordRTC plugin',
                author: 'Jesus Federico',
                infourl: 'http://blindsidenetworks.com',
                version: "1.0"
            };
        },
    });

    // Register plugin.
    tinyMCE.PluginManager.add('recordrtc', tinyMCE.plugins.RecordRTC);
})();
