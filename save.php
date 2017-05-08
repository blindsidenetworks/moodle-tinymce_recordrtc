<?php

/**
 * @package    tinymce_recordrtc
 * @author     Jesus Federico  (jesus [at] blindsidenetworks [dt] com)
 * @copyright  2017 Blindside Networks Inc.
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Disable moodle specific debug messages and any errors in output
define('NO_DEBUG_DISPLAY', true);

require_once(dirname(dirname(dirname(dirname(dirname(dirname(__FILE__)))))).'/config.php');
require_once(dirname(__FILE__).'/locallib.php');

$contextid = optional_param('contextid', 0, PARAM_INT);

list($context, $course, $cm) = get_context_info_array($contextid);
require_login($course, false, $cm);
require_sesskey();

if ( !isset($_FILES["audio-blob"]) && !isset($_FILES["video-blob"]) ) {
    error_log("Blob not included");
    header("HTTP/1.0 400 Bad Request");
    return;
} else if ( !isset($_POST["audio-filename"]) && !isset($_POST["video-filename"]) ) {
    error_log("Filename not included");
    header("HTTP/1.0 400 Bad Request");
    return;
} else {
    if ( !isset($_FILES["audio-blob"]) || !isset($_POST["audio-filename"]) ) {
        $fileName = $_POST["video-filename"];
        $fileTmp = $_FILES["video-blob"]["tmp_name"];
    } else {
        $fileName = $_POST["audio-filename"];
        $fileTmp = $_FILES["audio-blob"]["tmp_name"];
    }

    $fs = get_file_storage();

    // Prepare file record object
    $user_context = context_user::instance($USER->id);
    $fileinfo = array(
          'contextid' => $user_context->id,   // ID of context
          'component' => 'tinymce_recordrtc', // Usually = table name
          'filearea' => 'annotation',         // Usually = table name
          'itemid' => time(),                 // Usually = ID of row in table
          'filepath' => '/',                  // Any path beginning and ending in /
          'filename' => $fileName,            // Any filename
          'author' => fullname($USER),
          'licence' => $CFG->sitedefaultlicense
          );
    $fileSaved = $fs->create_file_from_pathname($fileinfo, $fileTmp);

    //// OK response
    $fileTarget = $fileSaved->get_contextid().'/'.$fileSaved->get_component().'/'.$fileSaved->get_filearea().'/'.$fileSaved->get_itemid().'/'.$fileSaved->get_filename();
    echo($fileTarget);
}
