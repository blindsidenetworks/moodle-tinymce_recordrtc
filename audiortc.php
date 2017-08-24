<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * The audio recording module for RecordRTC.
 *
 * @package    tinymce_recordrtc
 * @author     Jesus Federico  (jesus [at] blindsidenetworks [dt] com)
 * @author     Jacob Prud'homme (jacob [dt] prudhomme [at] blindsidenetworks [dt] com)
 * @copyright  2016 onwards, Blindside Networks Inc.
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(dirname(dirname(dirname(__FILE__)))))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$contextid = required_param('contextid', PARAM_INT);

list($context, $course, $cm) = get_context_info_array($contextid);
require_login($course, false, $cm);
require_sesskey();

$PAGE->set_context($context);
$PAGE->set_url(MOODLE_TINYMCE_RECORDRTC_ROOT.'audiortc.php');
$PAGE->set_cacheable(false);
$title = '';
if (isset($cm->name)) {
    $title = $cm->name;
}
$PAGE->set_title($title);
$PAGE->set_heading($title);

// Reset page layout for inside editor.
$PAGE->set_pagelayout('embedded');

$PAGE->requires->css(new moodle_url($CFG->wwwroot.MOODLE_TINYMCE_RECORDRTC_ROOT.'tinymce/css/style.css'));
$PAGE->requires->js(new moodle_url($CFG->wwwroot.MOODLE_TINYMCE_RECORDRTC_ROOT.'vendor/js/bowser.js'), true);
$PAGE->requires->js(new moodle_url($CFG->wwwroot.MOODLE_TINYMCE_RECORDRTC_ROOT.'vendor/js/adapter.js'), true);
$PAGE->requires->js(new moodle_url($CFG->wwwroot.MOODLE_TINYMCE_RECORDRTC_ROOT.'tinymce/js/commonmodule.js'), true);
$PAGE->requires->js(new moodle_url($CFG->wwwroot.MOODLE_TINYMCE_RECORDRTC_ROOT.'tinymce/js/abstractmodule.js'), true);
$PAGE->requires->js(new moodle_url($CFG->wwwroot.MOODLE_TINYMCE_RECORDRTC_ROOT.'tinymce/js/compatcheckmodule.js'), true);

// Get max file upload size.
$maxuploadsize = ini_get('upload_max_filesize');
// Determine if the current version of Moodle is 3.2+.
$moodleversion = intval($CFG->version, 10);
$moodle32 = 2016120500;
$oldermoodle = $moodleversion <= $moodle32;
$jsvars = array(
    'maxfilesize' => $maxuploadsize,
    'oldermoodle' => $oldermoodle
);
$PAGE->requires->data_for_js('recordrtc', $jsvars);

$jsmodule = array(
    'name'     => 'tinymce_recordrtc',
    'fullpath' => MOODLE_TINYMCE_RECORDRTC_ROOT.'tinymce/js/audiomodule.js'
);
$PAGE->requires->js_init_call('M.tinymce_recordrtc.view_init', array(), false, $jsmodule);

// Get localized strings for use in JavaScript.
$stringmanager = get_string_manager();
$strings = $stringmanager->load_component_strings('tinymce_recordrtc', $USER->lang);
$PAGE->requires->strings_for_js(array_keys($strings), 'tinymce_recordrtc');

$output = $PAGE->get_renderer('tinymce_recordrtc');

echo $output->header();

echo $output->render_audiortc_index($oldermoodle);

// Because there is no relative path to TinyMCE, we have to use JavaScript
// to work out correct path from the .js files from TinyMCE. Only files
// inside this plugin can be included with relative path (below).
echo $output->render_scripts();

echo $output->footer();
