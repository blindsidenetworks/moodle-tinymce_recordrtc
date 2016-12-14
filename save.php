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
        //\core\antivirus\manager::scan_file($_FILES[$elname]['tmp_name'], $_FILES[$elname]['name'], true);

        $fileName = $_POST["${type}-filename"];
        $fileTmp = $_FILES["${type}-blob"]["tmp_name"];

        $fs = get_file_storage();
        error_log($fileTmp." uploaded, it should be registered as ".$fileName);
        //$sourcefield = $repo->get_file_source_info($fileurl);
        //$record->source = repository::build_source_field($sourcefield);

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
        // $file = $fs->get_file($user_context->id, 'user', 'draft', $draftid, $filepath, $filename);
        // Create file containing the uploaded file
        error_log("**************************************************************");
        $fileSaved = $fs->create_file_from_pathname($fileinfo, $fileTmp);
        //error_log("".$fileSaved->get_content_file_handle());
        //error_log($fileSaved->get_component());
        //error_log($fileSaved->get_itemid());
        //error_log($fileSaved->get_filearea());
        //error_log($fileSaved->get_filepath());
        //error_log($fileSaved->get_filename());
        //error_log($fileSaved->get_userid());
        //error_log($fileSaved->get_contextid());
        //error_log(json_encode($fileSaved));

        // $file = $fs->get_file($user_context->id, 'tinymce_recordrtc', 'annotation', $DRAFTID, '/', $fileName);

        // Former method for uploads
        //$fileTarget = $fileSaved->get_filename();
        //if (!move_uploaded_file($fileTmp, $fileTarget)) {
        //    error_log("Problem moving uploaded file");
        //    header("HTTP/1.0 500 Internal Server Error");
        //    return;
        //}
        //// OK response
        $fileTarget = $fileSaved->get_contextid().'/'.$fileSaved->get_component().'/'.$fileSaved->get_filearea().'/'.$fileSaved->get_itemid().'/'.$fileSaved->get_filename();
        error_log($fileTarget);
        echo($fileTarget);
    }
}
