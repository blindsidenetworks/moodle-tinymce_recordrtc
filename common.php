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

defined('MOODLE_INTERNAL') || die();

$PAGE->set_cacheable(false);
$title = '';
if (isset($cm->name)) {
    $title = $cm->name;
}
$PAGE->set_title($title);
$PAGE->set_heading($title);

// Reset page layout for inside editor.
$PAGE->set_pagelayout('embedded');

$PAGE->requires->css(MOODLE_TINYMCE_RECORDRTC_ROOT.'tinymce/css/style.css');
$PAGE->requires->js(MOODLE_TINYMCE_RECORDRTC_ROOT.'vendor/js/bowser.js', true);
$PAGE->requires->js(MOODLE_TINYMCE_RECORDRTC_ROOT.'vendor/js/adapter.js', true);
$PAGE->requires->js(MOODLE_TINYMCE_RECORDRTC_ROOT.'tinymce/js/commonmodule.js', true);
$PAGE->requires->js(MOODLE_TINYMCE_RECORDRTC_ROOT.'tinymce/js/abstractmodule.js', true);
$PAGE->requires->js(MOODLE_TINYMCE_RECORDRTC_ROOT.'tinymce/js/compatcheckmodule.js', true);

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
