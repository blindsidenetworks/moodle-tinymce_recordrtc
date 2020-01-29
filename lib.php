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
 * TinyMCE RecordRTC library functions
 *
 * @package    tinymce_recordrtc
 * @author     Jesus Federico (jesus [at] blindsidenetworks [dt] com)
 * @author     Jacob Prud'homme (jacob [dt] prudhomme [at] blindsidenetworks [dt] com)
 * @copyright  2016 onwards, Blindside Networks Inc.
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

global $CFG;

/**
 * The root path of the plugin, relative to the Moodle root.
 */
const MOODLE_TINYMCE_RECORDRTC_ROOT = '/lib/editor/tinymce/plugins/recordrtc/';

/**
 * This class defines functions for the plugin.
 *
 * @copyright  2017 onwards, Blindside Networks Inc.
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class tinymce_recordrtc extends editor_tinymce_plugin {
    /** @var array list of buttons defined by this plugin */
    protected $buttons = array('audiortc', 'videortc');

    /**
     * Adjusts TinyMCE init parameters for tinymce_recordrtc
     *
     * Adds file area restrictions parameters and actual 'recordrtc' button
     *
     * @param array $params TinyMCE init parameters array
     * @param context $context Context where editor is being shown
     * @param array $options Options for this editor
     */
    protected function update_init_params(array &$params, context $context, array $options = null) {
        if (!isloggedin() or isguestuser()) {
            // Must be a real user to manage any files.
            return;
        }

        // Add JS file, which uses default name.
        $this->add_js_plugin($params);

        // Add audio/video buttons at the end of the first row.
        $allowedtypes = $this->get_config('allowedtypes', 'both');
        $allowedtypes = str_replace('both', 'audio,video', $allowedtypes);
        $allowedtypes = explode(',', $allowedtypes);

        foreach ($allowedtypes as &$type) {
            $params[$type.'rtc'] = array(
                'contextid' => $context->id,
                'sesskey' => sesskey(),
                'timelimit' => $this->get_config('timelimit'),
                'audiobitrate' => $this->get_config('audiobitrate'),
                'videobitrate' => $this->get_config('videobitrate')
            );
            $this->add_button_after($params, 0, $type.'rtc');

            unset($type);
        }
    }

    /**
     * This function returns 310.
     */
    protected function get_sort_order() {
        return 310;
    }
}
