<?php

/**
 * @package    tinymce_recordrtc
 * @author     Jesus Federico  (jesus [at] blindsidenetworks [dt] com)
 * @copyright  2016 Blindside Networks Inc.
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(dirname(dirname(dirname(__FILE__)))))).'/config.php');
require_once(dirname(__FILE__).'/locallib.php');

$contextid = required_param('contextid', PARAM_INT);

require_sesskey();

list($context, $course, $cm) = get_context_info_array($contextid);


//foreach(array('video', 'audio') as $type) {
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
        $fileTarget = 'uploads/'.$fileName;

        //require_login($course, false, $cm);
        $fs = get_file_storage();

        error_log($fileTmp." uploaded, it should be registered as ".$fileName);

        // Prepare file record object
        $fileinfo = array(
              'contextid' => $contextid,      // ID of context
              'component' => 'mod_mymodule',  // usually = table name
              'filearea' => 'myarea',         // usually = table name
              'itemid' => 0,                  // usually = ID of row in table
              'filepath' => '/',              // any path beginning and ending in /
              'filename' => $fileName);       // any filename

        // Create file containing the uploaded file
        $fs->create_file_from_string($fileinfo, $fileTmp);

        if (!move_uploaded_file($fileTmp, $fileTarget)) {
            error_log("Problem moving uploaded file");
            header("HTTP/1.0 500 Internal Server Error");
            return;
        } else {
            // OK response
            echo($fileTarget);
        }
    }
}
