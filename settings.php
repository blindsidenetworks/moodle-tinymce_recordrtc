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
 * @author     Jacob Prud'homme (jacob [dt] prudhomme [at] blindsidenetworks [dt] com)
 * @copyright  2016 onwards, Blindside Networks Inc.
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die;

if ($ADMIN->fulltree) {
    // Types allowed.
    $options = array(
        'both' => new lang_string('both', 'tinymce_recordrtc'),
        'audio' => new lang_string('onlyaudio', 'tinymce_recordrtc'),
        'video' => new lang_string('onlyvideo', 'tinymce_recordrtc')
    );
    $name = get_string('allowedtypes', 'tinymce_recordrtc');
    $desc = get_string('allowedtypes_desc', 'tinymce_recordrtc');
    $default = '';
    $setting = new admin_setting_configselect('tinymce_recordrtc/allowedtypes', $name, $desc, $default, $options);
    $settings->add($setting);

    // Audio bitrate.
    $name = get_string('audiobitrate', 'tinymce_recordrtc');
    $desc = get_string('audiobitrate_desc', 'tinymce_recordrtc');
    $default = '128000';
    $setting = new admin_setting_configtext('tinymce_recordrtc/audiobitrate', $name, $desc, $default, PARAM_INT, 8);
    $settings->add($setting);

    // Video bitrate.
    $name = get_string('videobitrate', 'tinymce_recordrtc');
    $desc = get_string('videobitrate_desc', 'tinymce_recordrtc');
    $default = '2500000';
    $setting = new admin_setting_configtext('tinymce_recordrtc/videobitrate', $name, $desc, $default, PARAM_INT, 8);
    $settings->add($setting);

    // Recording time limit.
    $name = get_string('timelimit', 'tinymce_recordrtc');
    $desc = get_string('timelimit_desc', 'tinymce_recordrtc');
    $default = '120';
    $setting = new admin_setting_configtext('tinymce_recordrtc/timelimit', $name, $desc, $default, PARAM_INT, 8);
    $settings->add($setting);
}
