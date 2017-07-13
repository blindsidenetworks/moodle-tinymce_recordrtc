# RecordRTC TinyMCE plugin for Moodle

Add audio and video annotations to text, anywhere a TinyMCE text editor is present. This plugin adds buttons for recording audio or video (with audio) to the editor's toolbar. Using WebRTC technologies, all recording is done instantly in the browser. After recording, users can embed the annotation directly into the text they are currently editing.

### Installation

There are currently two ways to install the plugin:

1. Installing via zip file:
   * Download the project's repository as a zip archive from GitHub: https://github.com/blindsidenetworks/moodle-tinymce_recordrtc/archive/master.zip
   * In Moodle, go to `Site Administration` > `Plugins` > `Install plugins`
   * Under the `Install plugin from ZIP file` section, either select the above archive, or drag and drop it into the specified box on the page
   * Click the installation button
2. Installing manually (if the user does not have necessary permissions for installing the first way):
   * Navigate to `moodle_root_path/lib/editor/tinymce/plugins`, where `moodle_root_path` is the location where Moodle is installed (ex.: `/var/www/html/moodle`)
   * Execute `sudo git clone https://github.com/blindsidenetworks/moodle-tinymce_recordrtc.git recordrtc`
   * Log into a Moodle account with administration capabilities

Soon, there will also be the possibility to install easily via the Moodle Plugins Directory.

