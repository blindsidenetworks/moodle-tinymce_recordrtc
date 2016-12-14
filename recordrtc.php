<?php

/**
 * @package    tinymce_recordrtc
 * @author     Jesus Federico  (jesus [at] blindsidenetworks [dt] com)
 * @copyright  2016 Blindside Networks Inc.
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
$PAGE->set_pagelayout('popup');

$PAGE->requires->css( new moodle_url($CFG->wwwroot.MOODLE_TINYMCE_RECORDRTC_ROOT.'RecordRTC.css'));
$PAGE->requires->js( new moodle_url($CFG->wwwroot.MOODLE_TINYMCE_RECORDRTC_ROOT.'RecordRTC.js'));
$PAGE->requires->js( new moodle_url($CFG->wwwroot.MOODLE_TINYMCE_RECORDRTC_ROOT.'gumadapter.js'));
$PAGE->requires->js( new moodle_url($CFG->wwwroot.MOODLE_TINYMCE_RECORDRTC_ROOT.'view_init.js'));

$jsVars = array(
    'contextid' => $contextid,
    'recording_icon32' => $CFG->wwwroot.MOODLE_TINYMCE_RECORDRTC_ROOT.'pix/recordrtc-32.png'
);
$PAGE->requires->data_for_js('recordrtc', $jsVars);

$jsmodule = array(
    'name'     => 'tinymce_recordrtc',
    'fullpath' => MOODLE_TINYMCE_RECORDRTC_ROOT.'tinymce_module.js'
);
$PAGE->requires->js_init_call('M.tinymce_recordrtc.view_init', array(), false, $jsmodule);

echo $OUTPUT->header();

echo get_output();

echo $OUTPUT->footer();


function get_output() {
  global $CFG;
  $out = "";

  $out .= '<section class="experiment recordrtc">'."\n";
  $out .= '  <h2 class="header">'."\n";
  $out .= '    <select class="recording-media" style="display:none">'."\n";
  $out .= '      <option value="record-audio">Audio</option>'."\n";
  $out .= '    </select>'."\n";
  $out .= '    <select class="media-container-format" style="display:none">'."\n";
  $out .= '      <option>Ogg</option>'."\n";
  $out .= '    </select>'."\n";
  $out .= '    <button>Start Recording</button>'."\n";
  $out .= '  </h2>'."\n";
  $out .= '  <h3 style="display:none;">'."\n";
  $out .= '    <button id="upload-to-server">Upload Recording to Server</button>'."\n";
  $out .= '  </h3>'."\n";
  $out .= '  <video width="1" height="1" muted></video>'."\n";
  $out .= '</section>'."\n";

  $out .= '<script type="text/javascript">'."\n";
  // Because there is no relative path to TinyMCE, we have to use JavaScript
  // to work out correct path from the .js files from TinyMCE. Only files
  // inside this plugin can be included with relative path (below).
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