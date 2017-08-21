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
 * Functionality to allow accessing saved recordings.
 *
 * @package    tinymce_recordrtc
 * @author     Jesus Federico  (jesus [at] blindsidenetworks [dt] com)
 * @copyright  2016 to present, Blindside Networks Inc.
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Disable Moodle-specific debug messages and any errors in output.
define('NO_DEBUG_DISPLAY', true);

require_once(dirname(dirname(dirname(dirname(dirname(dirname(__FILE__)))))).'/config.php');
require_once(dirname(__FILE__).'/locallib.php');

require_login();
if (isguestuser()) {
    print_error('noguest');
}

$relativepath = get_file_argument();
$preview = optional_param('preview', null, PARAM_ALPHANUM);

// Relative path must start with '/'.
if (!$relativepath) {
    print_error('invalidargorconf');
} else if ($relativepath{0} != '/') {
    print_error('pathdoesnotstartslash');
}

// Extract relative path components.
$args = explode('/', ltrim($relativepath, '/'));

if (count($args) == 0) { // Always at least user id.
    print_error('invalidarguments');
}

$contextid = (int)array_shift($args);
$component = array_shift($args);
$filearea  = array_shift($args);
$draftid   = (int)array_shift($args);

if ($component !== 'tinymce_recordrtc' and
    $component !== 'atto_recordrtc' or
    $filearea !== 'annotation') {
    send_file_not_found();
}

$context = context::instance_by_id($contextid);
if ($context->contextlevel != CONTEXT_USER) {
    send_file_not_found();
}

$fs = get_file_storage();

$relativepath = implode('/', $args);
$fullpath = "/$context->id/$component/$filearea/$draftid/$relativepath";

if (!$file = $fs->get_file_by_hash(sha1($fullpath)) or $file->get_filename() == '.') {
    send_file_not_found();
}


// Finally send the file.
\core\session\manager::write_close(); // Unlock session during file serving.
send_stored_file($file, 0, false, false, array('preview' => $preview));
