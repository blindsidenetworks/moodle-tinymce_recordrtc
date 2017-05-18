<?php

/**
 * @package    tinymce_recordrtc
 * @author     Jesus Federico  (jesus [at] blindsidenetworks [dt] com)
 * @copyright  2017 Blindside Networks Inc.
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(dirname(dirname(dirname(__FILE__)))))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$contextid = required_param('contextid', PARAM_INT);

list($context, $course, $cm) = get_context_info_array($contextid);
require_login($course, false, $cm);
require_sesskey();

$PAGE->set_context($context);
$PAGE->set_url(MOODLE_TINYMCE_RECORDRTC_URL);
$PAGE->set_cacheable(false);
$title = isset($cm->name)? $cm->name: '';
$PAGE->set_title($title);
$PAGE->set_heading($title);

// Reset page layout for inside editor.
$PAGE->set_pagelayout('embedded');

$PAGE->requires->css( new moodle_url($CFG->wwwroot.MOODLE_TINYMCE_RECORDRTC_ROOT.'tinymce/css/style.css') );
$PAGE->requires->js( new moodle_url($CFG->wwwroot.MOODLE_TINYMCE_RECORDRTC_ROOT.'tinymce/js/RecordRTC.js') );
$PAGE->requires->js( new moodle_url($CFG->wwwroot.MOODLE_TINYMCE_RECORDRTC_ROOT.'tinymce/js/gumadapter.js') );

$jsVars = array(
    'contextid' => $contextid,
    'recording_icon32' => $CFG->wwwroot.MOODLE_TINYMCE_RECORDRTC_ROOT.'tinymce/img/recordrtc-32.png'
);
$PAGE->requires->data_for_js('recordrtc', $jsVars);

$jsmodule = array(
    'name'     => 'tinymce_recordrtc',
    'fullpath' => MOODLE_TINYMCE_RECORDRTC_ROOT.'tinymce/js/module.js'
);
$PAGE->requires->js_init_call('M.tinymce_recordrtc.view_init', array(), false, $jsmodule);

echo $OUTPUT->header();

echo get_output();

echo $OUTPUT->footer();


function get_output() {
  global $CFG;

  $out  = '<div class="container-fluid">'."\n";
  $out .= '  <div class="row">'."\n";
  $out .= '    <div class="col-md-16">'."\n";
  $out .= '      <div id="alert-info" class="alert alert-info h5 hide">Use Firefox for best experience</div>'."\n";
  $out .= '      <div id="alert-danger" class="alert alert-danger h5 hide"></div>'."\n";
  $out .= '      <div class="recordrtc">'."\n";
  $out .= '        <div class="header">'."\n";
  $out .= '          <select class="recording-media">'."\n";
  $out .= '            <option value="record-video">Video</option>'."\n";
  $out .= '            <option value="record-audio">Audio</option>'."\n";
  $out .= '          </select>'."\n";
  $out .= '          <button id="start-stop" class="btn btn-primary btn-lg btn-danger">Start Recording</button>'."\n";
  $out .= '        </div>'."\n";
  $out .= '        <div style="display:none;">'."\n";
  $out .= '          <button id="upload" class="btn btn-primary btn-md">Attach Recording as Annotation</button>'."\n";
  $out .= '        </div>'."\n";
  $out .= '        <br>'."\n";
  $out .= '        <audio id="audio-player" muted></audio>'."\n";
  $out .= '        <video id="video-player" width="320" height="240" muted></video>'."\n";
  $out .= '      </div>'."\n";
  $out .= '    </div>'."\n";
  $out .= '  </div>'."\n";
  $out .= '</div>'."\n";

  // Because there is no relative path to TinyMCE, we have to use JavaScript
  // to work out correct path from the .js files from TinyMCE. Only files
  // inside this plugin can be included with relative path (below).
  $out .= '<script type="text/javascript">'."\n";
  $out .= '   var editor_tinymce_include = function(path) {'."\n";
  $out .= '       document.write(\'<script type="text/javascript" src="\' + parent.tinyMCE.baseURL + \'/\' + path + \'"></\' + \'script>\');'."\n";
  $out .= '   };'."\n";
  $out .= '   editor_tinymce_include(\'tiny_mce_popup.js\');'."\n";
  $out .= '   editor_tinymce_include(\'utils/validate.js\');'."\n";
  $out .= '   editor_tinymce_include(\'utils/form_utils.js\');'."\n";
  $out .= '   editor_tinymce_include(\'utils/editable_selects.js\');'."\n";
  $out .= '</script>'."\n";

  return $out;
}
