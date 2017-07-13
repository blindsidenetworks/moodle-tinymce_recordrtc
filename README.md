# RecordRTC TinyMCE plugin for Moodle

### Features

Add audio and video annotations to text, anywhere a TinyMCE text editor is present. This plugin adds buttons for recording audio or video (with audio) to the editor's toolbar. Using WebRTC technologies, all recording is done instantly in the browser. After recording, users can embed the annotation directly into the text they are currently editing. The recording will appear as an audio or video player in the published writing.

### Installation

There are currently two ways to install the plugin:

1. Installing via zip file:

   * Download the project's repository as a zip archive from GitHub: https://github.com/blindsidenetworks/moodle-tinymce_recordrtc/archive/master.zip
   * In Moodle, go to `Site administration` > `Plugins` > `Install plugins`
   * Under the `Install plugin from ZIP file` section, either select the above archive, or drag and drop it into the specified box on the page
   * Click the installation button


2. Installing manually (if the user does not have necessary permissions for installing the first way):

   * Navigate to `moodle_root_path/lib/editor/tinymce/plugins`, where `moodle_root_path` is the location where Moodle is installed (ex.: `/var/www/html/moodle`)
   * Execute `sudo git clone https://github.com/blindsidenetworks/moodle-tinymce_recordrtc.git recordrtc`
   * Log into a Moodle account with administration capabilities
   * A screen should appear asking the install the plugin, similar to above

Soon, there will also be the possibility to install easily via the Moodle Plugins Directory.

### Usage 

To use the plugin, just click on one of the recording buttons (either the microphone or the video camera), and a popup will appear with a big "Start Recording" button. When clicked, the browser will probably ask for permission to use the webcam/microphone.

![screenshot from 2017-07-13 11-47-41](https://user-images.githubusercontent.com/2160185/28175664-ddbba8be-67c2-11e7-8afb-eaa47d1ffcf1.png)

After the recording starts, a timer will begin counting down, indicating how much time is left to record; when the timer hits 0, the recording will automatically stop (this will also happen if approaching the maximum upload size determined in the server settings).

![screenshot from 2017-07-13 11-48-10](https://user-images.githubusercontent.com/2160185/28175782-3958a992-67c3-11e7-8a76-4eb99a5dbdbc.png)

When the recording is finished, the user can play it back to see/hear if it is what they want. To embed the file, the user must click "Attach Recording as Annotation". A dialog box will pop up asking the user what the link should appear as in the text editor. After that, the file gets embedded right where the cursor was in the text.

![screenshot from 2017-07-13 11-48-37](https://user-images.githubusercontent.com/2160185/28175825-5312bc38-67c3-11e7-9bac-ef5bee8e9e16.png)

![screenshot from 2017-07-13 11-48-48](https://user-images.githubusercontent.com/2160185/28175838-618e1a14-67c3-11e7-82e1-954af24e8d34.png)

![screenshot from 2017-07-13 11-49-14](https://user-images.githubusercontent.com/2160185/28175858-7129047a-67c3-11e7-9398-98012f95577d.png)

### Configuration

The plugin can be configured during the initial install, and later by navigating to `Site administration` > `Plugins` > `Text editors` > `TinyMCE HTML editor` > `RecordRTC`. The administrator can:

* Allow the users to record only audio, only video, or both (changing the buttons that appear in the editor toolbar)
* Change the target bitrate of recorded audio
* Change the target bitrate of recorded video
* Set the recording time limit, to control maximum recording size

### Common problems

* If nothing is displayed in the popup after clicking one of the buttons in the TinyMCE toolbar, it is likely an issue with the `X-Frame-Options` header. To fix this, change the server configuration to set the header to `SAMEORIGIN`. Also, make sure that the header is not set twice as the browser will default the value to `DENY` (sometimes individual web apps also set the header, or there is some conflicting server configuration)
* The default maximum size of uploads in PHP is very small, it is recommended to set the `upload_max_filesize` setting to `40M` and the `post_max_size` setting to `50M` for a time limit of 2:00 to avoid getting an alert while recording
* The filesize of recorded video for Firefox will likely be twice that of other browsers, even with the same settings; this is expected as it uses a different writing library for recording video. The audio filesize should be similar across all browsers