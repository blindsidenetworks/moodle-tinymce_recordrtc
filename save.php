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

// Disable Moodle-specific debug messages and any errors in output.
define('NO_DEBUG_DISPLAY', true);

require_once(dirname(dirname(dirname(dirname(dirname(dirname(__FILE__)))))).'/config.php');
require_once(dirname(__FILE__).'/locallib.php');

$contextid = optional_param('contextid', 0, PARAM_INT);

list($context, $course, $cm) = get_context_info_array($contextid);
require_login($course, false, $cm);
require_sesskey();

if (!(isset($_FILES["audio-blob"]) || isset($_FILES["video-blob"]))) {
    $error = "Blob not included";
    debugging($error, DEBUG_DEVELOPER);
    header("HTTP/1.0 400 Bad Request");
    return;
}

if (!(isset($_POST["audio-filename"]) || isset($_POST["video-filename"]))) {
    $error = "Filename not included";
    debugging($error, DEBUG_DEVELOPER);
    header("HTTP/1.0 400 Bad Request");
    return;
}


if (!(isset($_FILES["video-blob"]) && isset($_POST["video-filename"]))) {
    $filename = $_POST["audio-filename"];
    $filetmp = $_FILES["audio-blob"]["tmp_name"];
} else {
    $filename = $_POST["video-filename"];
    $filetmp = $_FILES["video-blob"]["tmp_name"];
}

$fs = get_file_storage();

// Prepare file record object.
$usercontext = context_user::instance($USER->id);
$fileinfo = array(
    'contextid' => $usercontext->id,    // ID of context.
    'component' => 'tinymce_recordrtc', // Usually = table name.
    'filearea' => 'annotation',         // Usually = table name.
    'itemid' => time(),                 // Usually = ID of row in table.
    'filepath' => '/',                  // Any path beginning and ending in "/".
    'filename' => $filename,            // Any filename.
    'author' => fullname($USER),
    'licence' => $CFG->sitedefaultlicense
);
$filesaved = $fs->create_file_from_pathname($fileinfo, $filetmp);

// OK response.
$filetarget = $filesaved->get_contextid().'/'.$filesaved->get_component().'/'.$filesaved->get_filearea().'/'.
              $filesaved->get_itemid().'/'.$filesaved->get_filename();
echo($filetarget);
