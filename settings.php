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
 * Settings definitions for the plugin.
 *
 * @package    tinymce_recordrtc
 * @author     Jesus Federico  (jesus [at] blindsidenetworks [dt] com)
 * @copyright  2016 to present, Blindside Networks Inc.
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die;

if ($ADMIN->fulltree) {
    $options = array(
        'both' => get_string('both', 'tinymce_recordrtc'),
        'audio' => get_string('onlyaudio', 'tinymce_recordrtc'),
        'video' => get_string('onlyvideo', 'tinymce_recordrtc')
    );
    $settings->add(new admin_setting_configselect('tinymce_recordrtc/allowedtypes',
        get_string('allowedtypes', 'tinymce_recordrtc'), get_string('allowedtypes_desc', 'tinymce_recordrtc'),
        '', $options));
    $settings->add(new admin_setting_configtext('tinymce_recordrtc/audiobitrate',
        get_string('audiobitrate', 'tinymce_recordrtc'), get_string('audiobitrate_desc', 'tinymce_recordrtc'),
        '128000', PARAM_RAW, 6));
    $settings->add(new admin_setting_configtext('tinymce_recordrtc/videobitrate',
        get_string('videobitrate', 'tinymce_recordrtc'), get_string('videobitrate_desc', 'tinymce_recordrtc'),
        '2500000', PARAM_RAW, 7));
    $settings->add(new admin_setting_configtext_with_maxlength('tinymce_recordrtc/timelimit',
        get_string('timelimit', 'tinymce_recordrtc'), get_string('timelimit_desc', 'tinymce_recordrtc'),
        '120', PARAM_RAW, 4, 4));
}
