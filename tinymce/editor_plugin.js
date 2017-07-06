/**
 * TinyMCE plugin RecordRTC - provides UI to annotate the content in the text editor with a WebRTC recording.
 *
 * @package    tinymce_recordrtc
 * @author     Jesus Federico  (jesus [at] blindsidenetworks [dt] com)
 * @copyright  2016 to present, Blindside Networks Inc.
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

(function() {
    var each = tinymce.each;

    tinymce.PluginManager.requireLangPack('recordrtc');

    tinymce.create('tinymce.plugins.RecordRTC', {
        /**
         * Initializes the plugin, this will be executed after the plugin has been created.
         * This call is done before the editor instance has finished it's initialization so use the onInit event
         * of the editor instance to intercept that event.
         *
         * @param {tinymce.Editor} ed Editor instance that the plugin is initialized in.
         * @param {string} url Absolute URL to where the plugin is located.
         */
        init : function(ed, url) {
            ed.addCommand('mceForceRepaint', function() {
                var root = ed.dom.getRoot();
                items = root.getElementsByTagName("img");
                for (var i = 0; i < items.length; i++) {
                    src = items[i].getAttribute('src').replace(/\?\d+$/, '');
                    items[i].setAttribute('src', src + '?' + (new Date().getTime()))
                }
                ed.execCommand('mceRepaint');
                ed.focus();
            });

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
                ed.dom.setStyles(id + '_ifr', {width : vp.w - w.deltaWidth, height : vp.h - w.deltaHeight});
                ed.dom.addClass(id + '_wrapper', 'mceMaximized');
            });

            var audiortc = ed.getParam('audiortc', {});
            if ( typeof audiortc.type !== 'undefined' ) {
                this.test('audiortc');
            }

            var videortc = ed.getParam('videortc', {});
            if ( typeof videortc.type !== 'undefined' ) {
                this.test('videortc');
            }

            ed.addCommand('mceAudioRTC', function() {
                var audiortc = ed.getParam('audiortc', {});
                var viewparams = '';
                for (key in audiortc) {
                    viewparams += (viewparams != '' ? '&' : '') + encodeURIComponent(key) + "=" + encodeURIComponent(audiortc[key]);
                }
                var viewurl = ed.getParam("moodle_plugin_base") + 'recordrtc/audiortc.php' + (viewparams != '' ? '?' + viewparams : '');
                var onClose = function() {
                    ed.windowManager.onClose.remove(onClose);
                    ed.execCommand('mceForceRepaint');
                };
                ed.windowManager.onClose.add(onClose);
                var vp = ed.dom.getViewPort(),
                    baseWidth = 640 + parseInt(ed.getLang('advimage.delta_width', 0)),
                    percentOfViewportWidth = vp.w * 0.75,
                    width = percentOfViewportWidth > baseWidth ? percentOfViewportWidth : baseWidth,
                    height = 200 + parseInt(ed.getLang('advimage.delta_width', 0)),
                    maximizedmode = (width >= vp.w - 2 || height >= vp.h - 2);
                if (maximizedmode) {
                    width = vp.w;
                    height = vp.h;
                }
                w = ed.windowManager.open({
                    file : viewurl ,
                    width : width,
                    height : height,
                    inline : 1,
                    popup_css : ed.getParam("moodle_plugin_base") + 'recordrtc/tinymce/css/popup.css'
                }, {
                    plugin_url : url // Plugin absolute URL.
                });
                if (maximizedmode) {
                    ed.execCommand('mceMaximizeWindow', w);
                }
            });

            // Register audiortc button.
            ed.addButton('audiortc', {
                title : 'recordrtc.audiortc',
                cmd : 'mceAudioRTC',
                image : url + '/img/audiortc.png'
            });

            ed.addCommand('mceVideoRTC', function() {
                var videortc = ed.getParam('videortc', {});
                var viewparams = '';
                for (key in videortc) {
                    viewparams += (viewparams != '' ? '&' : '') + encodeURIComponent(key) + "=" + encodeURIComponent(videortc[key]);
                }
                var viewurl = ed.getParam("moodle_plugin_base") + 'recordrtc/videortc.php' + (viewparams != '' ? '?' + viewparams : '');
                var onClose = function() {
                    ed.windowManager.onClose.remove(onClose);
                    ed.execCommand('mceForceRepaint');
                };
                ed.windowManager.onClose.add(onClose);
                var vp = ed.dom.getViewPort(),
                    baseWidth = 720 + parseInt(ed.getLang('advimage.delta_width', 0)),
                    percentOfViewportWidth = vp.w * 0.75,
                    width = percentOfViewportWidth > baseWidth ? percentOfViewportWidth : baseWidth,
                    height = 640 + parseInt(ed.getLang('advimage.delta_width', 0)),
                    maximizedmode = (width >= vp.w - 2 || height >= vp.h - 2);
                if (maximizedmode) {
                    width = vp.w;
                    height = vp.h;
                }
                w = ed.windowManager.open({
                    file : viewurl ,
                    width : width,
                    height : height,
                    inline : 1,
                    popup_css : ed.getParam("moodle_plugin_base") + 'recordrtc/tinymce/css/popup.css'
                }, {
                    plugin_url : url // Plugin absolute URL.
                });
                if (maximizedmode) {
                    ed.execCommand('mceMaximizeWindow', w);
                }
            });

            // Register videortc button.
            ed.addButton('videortc', {
                title : 'recordrtc.videortc',
                cmd : 'mceVideoRTC',
                image : url + '/img/videortc.png'
            });
        },
        createControl : function(n, cm) {
            return null;
        },

        /**
         * Returns information about the plugin as a name/value array.
         * The current keys are longname, author, authorurl, infourl and version.
         *
         * @return {Object} Name/value array containing information about the plugin.
         */
        getInfo : function() {
            return {
                longname : 'Moodle TinyMCE RecordRTC plugin',
                author : 'Jesus Federico',
                infourl : 'http://blindsidenetworks.com',
                version : "1.0"
            };
        },

        addCommand : function(ed, type) {
            var typeparams = ed.getParam(type, {});
            var viewparams = '';
            for (key in typeparams) {
                viewparams += (viewparams != '' ? '&' : '') + encodeURIComponent(key) + "=" + encodeURIComponent(typeparams[key]);
            }
            var viewurl = ed.getParam("moodle_plugin_base") + 'recordrtc/' + type + '.php' + (viewparams != '' ? '?' + viewparams : '');
            var onClose = function() {
                ed.windowManager.onClose.remove(onClose);
                ed.execCommand('mceForceRepaint');
            };
            ed.windowManager.onClose.add(onClose);
            var vp = ed.dom.getViewPort(),
                    width = 900 + parseInt(ed.getLang('advimage.delta_width', 0)),
                    height = 600 + parseInt(ed.getLang('advimage.delta_height', 0)),
                    maximizedmode = (width >= vp.w - 2 || height >= vp.h - 2);
            if (maximizedmode) {
                width = vp.w;
                height = vp.h;
            }
            w = ed.windowManager.open({
                file : viewurl ,
                width : width,
                height : height,
                inline : 1
            }, {
                plugin_url : url // Plugin absolute URL.
            });
            if (maximizedmode) {
                ed.execCommand('mceMaximizeWindow', w);
            }

        },

        test : function(type) {
            console.info("Testing " + type);
        }

    });

    // Register plugin.
    tinymce.PluginManager.add('recordrtc', tinymce.plugins.RecordRTC);
})();
