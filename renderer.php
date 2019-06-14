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
 * Moodle renderer used to display special elements of the lesson module.
 *
 * @package    tinymce_recordrtc
 * @author     Jesus Federico (jesus [at] blindsidenetworks [dt] com)
 * @author     Jacob Prud'homme (jacob [dt] prudhomme [at] blindsidenetworks [dt] com)
 * @copyright  2016 onwards, Blindside Networks Inc.
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die;

/**
 * This class defines the custom renderer for this plugin.
 * @copyright  2017 onwards, Blindside Networks Inc.
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class tinymce_recordrtc_renderer extends plugin_renderer_base {
    /**
     * Renders the HTML for the plugin, for the alerts section.
     * @param boolean $oldermoodle True if Moodle >= 3.2, else False.
     * @return string
     */
    public function render_alerts($oldermoodle) {
        if ($oldermoodle) {
            $output = html_writer::start_tag('div', array('class' => 'row-fluid hide'));
            $output .= html_writer::start_tag('div', array('class' => 'span12'));
            $output .= html_writer::start_tag('div', array('id' => 'alert-warning', 'class' => 'alert'));
        } else {
            $output = html_writer::start_tag('div', array('class' => 'row hide'));
            $output .= html_writer::start_tag('div', array('class' => 'col-xs-12'));
            $output .= html_writer::start_tag('div', array('id' => 'alert-warning', 'class' => 'alert alert-warning'));
        }
        $output .= html_writer::start_tag('strong');
        $output .= get_string('browseralert_title', 'tinymce_recordrtc');
        $output .= html_writer::end_tag('strong');
        $output .= ' ';
        $output .= get_string('browseralert', 'tinymce_recordrtc');
        $output .= html_writer::end_tag('div');
        $output .= html_writer::end_tag('div');
        $output .= html_writer::end_tag('div');
        if ($oldermoodle) {
            $output .= html_writer::start_tag('div', array('class' => 'row-fluid hide'));
            $output .= html_writer::start_tag('div', array('class' => 'span12'));
            $output .= html_writer::start_tag('div', array('id' => 'alert-danger', 'class' => 'alert alert-error'));
        } else {
            $output .= html_writer::start_tag('div', array('class' => 'row hide'));
            $output .= html_writer::start_tag('div', array('class' => 'col-xs-12'));
            $output .= html_writer::start_tag('div', array('id' => 'alert-danger', 'class' => 'alert alert-danger'));
        }
        $output .= html_writer::start_tag('strong');
        $output .= get_string('insecurealert_title', 'tinymce_recordrtc');
        $output .= html_writer::end_tag('strong');
        $output .= ' ';
        $output .= get_string('insecurealert', 'tinymce_recordrtc');
        $output .= html_writer::end_tag('div');
        $output .= html_writer::end_tag('div');
        $output .= html_writer::end_tag('div');

        return $output;
    }

    /**
     * Renders the HTML for the plugin, for the audio/video player section.
     * @param boolean $oldermoodle True if Moodle >= 3.2, else False.
     * @param string $type Either 'audio' or 'video', depending on where it's being rendered.
     * @return string
     */
    public function render_player($oldermoodle, $type) {
        if ($oldermoodle && $type === 'audio') {
            $output = html_writer::start_tag('div', array('class' => 'row-fluid hide'));
            $output .= html_writer::start_tag('div', array('class' => 'span1')).html_writer::end_tag('div');
            $output .= html_writer::start_tag('div', array('class' => 'span10'));
            $output .= html_writer::start_tag('audio', array('id' => 'player'));
            $output .= html_writer::end_tag('audio');
            $output .= html_writer::end_tag('div');
            $output .= html_writer::start_tag('div', array('class' => 'span1')).html_writer::end_tag('div');
        } else if ($oldermoodle && $type === 'video') {
            $output = html_writer::start_tag('div', array('class' => 'row-fluid hide'));
            $output .= html_writer::start_tag('div', array('class' => 'span12'));
            $output .= html_writer::start_tag('video', array('id' => 'player'));
            $output .= html_writer::end_tag('video');
            $output .= html_writer::end_tag('div');
        } else if ($type === 'audio') {
            $output = html_writer::start_tag('div', array('class' => 'row hide'));
            $output .= html_writer::start_tag('div', array('class' => 'col-xs-1')).html_writer::end_tag('div');
            $output .= html_writer::start_tag('div', array('class' => 'col-xs-10'));
            $output .= html_writer::start_tag('audio', array('id' => 'player'));
            $output .= html_writer::end_tag('audio');
            $output .= html_writer::end_tag('div');
            $output .= html_writer::start_tag('div', array('class' => 'col-xs-1')).html_writer::end_tag('div');
        } else {
            $output = html_writer::start_tag('div', array('class' => 'row hide'));
            $output .= html_writer::start_tag('div', array('class' => 'col-xs-12'));
            $output .= html_writer::start_tag('video', array('id' => 'player'));
            $output .= html_writer::end_tag('video');
            $output .= html_writer::end_tag('div');
        }
        $output .= html_writer::end_tag('div');

        return $output;
    }

    /**
     * Renders the HTML for the plugin, for the start/stop and upload buttons section.
     * @param boolean $oldermoodle True if Moodle >= 3.2, else False.
     * @return string
     */
    public function render_buttons($oldermoodle) {
        if ($oldermoodle) {
            $output = html_writer::start_tag('div', array('class' => 'row-fluid'));
            $output .= html_writer::start_tag('div', array('class' => 'span1')).html_writer::end_tag('div');
            $output .= html_writer::start_tag('div', array('class' => 'span10'));
            $output .= html_writer::start_tag('button', array(
                    'id' => 'start-stop',
                    'class' => 'btn btn-large btn-danger btn-block'
            ));
            $output .= get_string('startrecording', 'tinymce_recordrtc');
            $output .= html_writer::end_tag('button');
            $output .= html_writer::end_tag('div');
            $output .= html_writer::start_tag('div', array('class' => 'span1')).html_writer::end_tag('div');
            $output .= html_writer::end_tag('div');
            $output .= html_writer::start_tag('div', array('class' => 'row-fluid hide'));
            $output .= html_writer::start_tag('div', array('class' => 'span3')).html_writer::end_tag('div');
            $output .= html_writer::start_tag('div', array('class' => 'span6'));
            $output .= html_writer::start_tag('button', array('id' => 'upload', 'class' => 'btn btn-primary btn-block'));
            $output .= get_string('attachrecording', 'tinymce_recordrtc');
            $output .= html_writer::end_tag('button');
            $output .= html_writer::end_tag('div');
            $output .= html_writer::start_tag('div', array('class' => 'span3')).html_writer::end_tag('div');
            $output .= html_writer::end_tag('div');
        } else {
            $output = html_writer::start_tag('div', array('class' => 'row'));
            $output .= html_writer::start_tag('div', array('class' => 'col-xs-1')).html_writer::end_tag('div');
            $output .= html_writer::start_tag('div', array('class' => 'col-xs-10'));
            $output .= html_writer::start_tag('button', array(
                    'id' => 'start-stop',
                    'class' => 'btn btn-lg btn-outline-danger btn-block'
            ));
            $output .= get_string('startrecording', 'tinymce_recordrtc');
            $output .= html_writer::end_tag('button');
            $output .= html_writer::end_tag('div');
            $output .= html_writer::start_tag('div', array('class' => 'col-xs-1')).html_writer::end_tag('div');
            $output .= html_writer::end_tag('div');
            $output .= html_writer::start_tag('div', array('class' => 'row hide'));
            $output .= html_writer::start_tag('div', array('class' => 'col-xs-3')).html_writer::end_tag('div');
            $output .= html_writer::start_tag('div', array('class' => 'col-xs-6'));
            $output .= html_writer::start_tag('button', array('id' => 'upload', 'class' => 'btn btn-primary btn-block'));
            $output .= get_string('attachrecording', 'tinymce_recordrtc');
            $output .= html_writer::end_tag('button');
            $output .= html_writer::end_tag('div');
            $output .= html_writer::start_tag('div', array('class' => 'col-xs-3')).html_writer::end_tag('div');
            $output .= html_writer::end_tag('div');
        }

        return $output;
    }

    /**
     * Renders the HTML for the plugin, for audio recording.
     * @param boolean $oldermoodle True if Moodle >= 3.2, else False.
     * @return string
     */
    public function render_audiortc_index($oldermoodle) {
        $output = html_writer::start_tag('div', array('class' => 'container-fluid'));
        $output .= self::render_alerts($oldermoodle);
        $output .= self::render_player($oldermoodle, 'audio');
        $output .= self::render_buttons($oldermoodle);
        $output .= html_writer::end_tag('div');

        return $output;
    }

    /**
     * Renders the HTML for the plugin, for video recording.
     * @param boolean $oldermoodle True if Moodle >= 3.2, else False.
     * @return string
     */
    public function render_videortc_index($oldermoodle) {
        $output = html_writer::start_tag('div', array('class' => 'container-fluid'));
        $output .= self::render_alerts($oldermoodle);
        $output .= self::render_player($oldermoodle, 'video');
        $output .= self::render_buttons($oldermoodle);
        $output .= html_writer::end_tag('div');

        return $output;
    }

    /**
     * Renders the HTML to include the necessary scripts.
     * @return string
     */
    public function render_scripts() {
        $output = html_writer::start_tag('script', array('type' => 'text/javascript'));
        $output .= 'var editor_tinymce_include = function(path) {'."\n";
        $output .= 'document.write(\'<script type="text/javascript" src="\' + parent.tinyMCE.baseURL + \'/\' +
                    path + \'"></\' + \'script>\');'."\n";
        $output .= '};'."\n";
        $output .= 'editor_tinymce_include(\'tiny_mce_popup.js\');'."\n";
        $output .= 'editor_tinymce_include(\'utils/validate.js\');'."\n";
        $output .= 'editor_tinymce_include(\'utils/form_utils.js\');'."\n";
        $output .= 'editor_tinymce_include(\'utils/editable_selects.js\');'."\n";
        $output .= html_writer::end_tag('script');

        return $output;
    }
}
