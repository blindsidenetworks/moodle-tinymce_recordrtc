tinymce_recordrtc
=================

This plugin will add a button to the TinyMCE text editor in Moodle that facilitates
*audio/video* functionality and performs a near instant recording. Users are able to
validate the recorded *audio/video* and attach it to the html document through the
editor by embedding the recorded file in the current text area.

NOTE: if the plugin does not display anything in the popup when either of the recording
buttons are clicked, it is probably due to a problem with the set X-Frame-Options header.
In the global-, site-, or directory-level configuration for the server, set X-Frame-Options
to SAMEORIGIN. Also, make sure that this header is not set twice (sometimes there is
conflicting configuration or individual web apps that set the header to another value),
as a browser will default to setting it to DENY if this is the case.
