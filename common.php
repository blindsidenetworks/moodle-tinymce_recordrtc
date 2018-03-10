<?php
/**
 * Created by PhpStorm.
 * User: riadvice
 * Date: 02/03/18
 * Time: 02:47 م
 */

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
$oldermoodle = $moodleversion < $moodle32;
$jsvars = array(
    'maxfilesize' => $maxuploadsize,
    'oldermoodle' => $oldermoodle
);
$PAGE->requires->data_for_js('recordrtc', $jsvars);
