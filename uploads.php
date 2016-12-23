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

require_login();
if (isguestuser()) {
    print_error('noguest');
}

$relativepath = get_file_argument();
$preview = optional_param('preview', null, PARAM_ALPHANUM);

// relative path must start with '/'
if (!$relativepath) {
    print_error('invalidargorconf');
} else if ($relativepath{0} != '/') {
    print_error('pathdoesnotstartslash');
}

// extract relative path components
$args = explode('/', ltrim($relativepath, '/'));

if (count($args) == 0) { // always at least user id
    print_error('invalidarguments');
}

$contextid = (int)array_shift($args);
$component = array_shift($args);
$filearea  = array_shift($args);
$draftid   = (int)array_shift($args);

if ($component !== 'tinymce_recordrtc' or $filearea !== 'annotation') {
    send_file_not_found();
}

$context = context::instance_by_id($contextid);
if ($context->contextlevel != CONTEXT_USER) {
    send_file_not_found();
}

$fs = get_file_storage();

$relativepath = implode('/', $args);
$fullpath = "/$context->id/tinymce_recordrtc/annotation/$draftid/$relativepath";

if (!$file = $fs->get_file_by_hash(sha1($fullpath)) or $file->get_filename() == '.') {
    send_file_not_found();
}

// ========================================
// finally send the file
// ========================================
\core\session\manager::write_close(); // Unlock session during file serving.
send_stored_file($file, 0, false, false, array('preview' => $preview));
