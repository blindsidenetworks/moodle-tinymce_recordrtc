<?php

/**
 * @package    tinymce_recordrtc
 * @author     Jesus Federico  (jesus [at] blindsidenetworks [dt] com)
 * @copyright  2016 Blindside Networks Inc.
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// disable moodle specific debug messages and any errors in output
define('NO_DEBUG_DISPLAY', true);

require_once(dirname(dirname(dirname(dirname(dirname(dirname(__FILE__)))))).'/config.php');
require_once(dirname(__FILE__).'/locallib.php');

$contextid = required_param('contextid', PARAM_INT);

list($context, $course, $cm) = get_context_info_array($contextid);
require_login($course, false, $cm);
require_sesskey();

//foreach(array('video', 'audio') as $type) { //Only works with audio
foreach(array('audio') as $type) {
    if ( !isset($_FILES["${type}-blob"]) ) {
        error_log("Blob not included");
        header("HTTP/1.0 400 Bad Request");
        return;
    } else if ( !isset($_POST["${type}-filename"]) ) {
        error_log("Filename not included");
        header("HTTP/1.0 400 Bad Request");
        return;
    } else {
        $fileName = $_POST["${type}-filename"];
        $fileTmp = $_FILES["${type}-blob"]["tmp_name"];

        $fs = get_file_storage();

        // Prepare file record object
        $user_context = context_user::instance($USER->id);
        $fileinfo = array(
              'contextid' => $user_context->id,   // ID of context
              'component' => 'tinymce_recordrtc', // usually = table name
              'filearea' => 'annotation',         // usually = table name
              'itemid' => time(),                 // usually = ID of row in table
              'filepath' => '/',                  // any path beginning and ending in /
              'filename' => $fileName,            // any filename
              'author' => fullname($USER),
              'licence' => $CFG->sitedefaultlicense
              );
        $fileSaved = $fs->create_file_from_pathname($fileinfo, $fileTmp);

        //// OK response
        $fileTarget = $fileSaved->get_contextid().'/'.$fileSaved->get_component().'/'.$fileSaved->get_filearea().'/'.$fileSaved->get_itemid().'/'.$fileSaved->get_filename();
        echo($fileTarget);
    }
}
