<?php

/**
 * @package    tinymce_recordrtc
 * @author     Jesus Federico  (jesus [at] blindsidenetworks [dt] com)
 * @copyright  2016 Blindside Networks Inc.
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(dirname(dirname(dirname(__FILE__)))))).'/config.php');
require_once(dirname(__FILE__).'/locallib.php');

foreach(array('video', 'audio') as $type) {
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
        $uploadDirectory = 'uploads/'.$fileName;

        if (!move_uploaded_file($_FILES["${type}-blob"]["tmp_name"], $uploadDirectory)) {
            error_log("Problem moving uploaded file");
            header("HTTP/1.0 500 Internal Server Error");
            return;
        } else {
            // OK response
            echo($uploadDirectory);
        }
    } else {
        error_log("Blob not included");
        header("HTTP/1.0 400 Bad Request");
        return;
    }
}
