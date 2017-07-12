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
 * @package    tinymce_recordrtc
 * @author     Jesus Federico  (jesus [at] blindsidenetworks [dt] com)
 * @copyright  2016 to present, Blindside Networks Inc.
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

// Get max file upload size.
$maxuploadsize = ini_get('upload_max_filesize');
$jsvars = array(
    'contextid' => $contextid,
    'icon32' => $CFG->wwwroot.MOODLE_TINYMCE_RECORDRTC_ROOT.'tinymce/img/audiortc32.png',
    'maxfilesize' => $maxuploadsize
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

echo $OUTPUT->header();

?>
<div class="container-fluid">
    <div class="row hide">
        <div class="col-sm-12">
            <div id="alert-warning" class="alert alert-warning">
                <strong><?php get_string('browseralert_title', 'tinymce_recordrtc') ?></strong>
                <?php get_string('browseralert', 'tinymce_recordrtc') ?>
            </div>
        </div>
    </div>
    <div class="row hide">
        <div class="col-sm-12">
            <div id="alert-danger" class="alert alert-danger"></div>
        </div>
    </div>
    <div class="row hide">
        <div class="col-sm-1">
        </div>
        <div class="col-sm-10">
            <audio id="player"></audio>
        </div>
        <div class="col-sm-1">
        </div>
    </div>
    <div class="row">
        <div class="col-sm-1">
        </div>
        <div class="col-sm-10">
            <button id="start-stop" class="btn btn-lg btn-outline-danger btn-block">
                <?php get_string('startrecording', 'tinymce_recordrtc') ?>
            </button>
        </div>
        <div class="col-sm-1">
        </div>
    </div>
    <div class="row hide">
        <div class="col-sm-3">
        </div>
        <div class="col-sm-6">
            <button id="upload" class="btn btn-primary btn-block">
                <?php get_string('attachrecording', 'tinymce_recordrtc') ?>
            </button>
        </div>
        <div class="col-sm-3">
        </div>
    </div>
</div>

<!--
Because there is no relative path to TinyMCE, we have to use JavaScript
to work out correct path from the .js files from TinyMCE. Only files
inside this plugin can be included with relative path (below).
-->
<script type="text/javascript">
    function editor_tinymce_include(path) {
        document.write('<script type="text/javascript" src="' + parent.tinyMCE.baseURL + '/' + path + '"><\/script>');
    }
    editor_tinymce_include('tiny_mce_popup.js');
    editor_tinymce_include('utils/validate.js');
    editor_tinymce_include('utils/form_utils.js');
    editor_tinymce_include('utils/editable_selects.js');
</script>
<?php

echo $OUTPUT->footer();
