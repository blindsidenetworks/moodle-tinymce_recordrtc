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
 * Behat recordrtc-related steps definitions for tinymce editor.
 *
 * @package    tinymce_recordrtc
 * @category   test
 * @copyright  2018 Marouene Agrebi <marouene.agrebi@riadvice.tn>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// NOTE: no MOODLE_INTERNAL test here, this file may be required by behat before including /config.php.

require_once(__DIR__ . '/../../../../../../behat/behat_base.php');


/**
 * Behat recordrtc-related steps definitions for tinymce editor.
 *
 * @package    tinymce_recordrtc
 * @category   test
 * @copyright  2018 Marouene Agrebi <marouene.agrebi@riadvice.tn>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class behat_recordrtc extends behat_base {

    /**
     * Switch to iframe inside the popup window.
     *
     * @When /^I switch to popup iframe$/
     */
    public function i_switch_to_popup_iframe() {

        // We spin to give time to the iframe to be loaded.
        $this->spin(
            function () {
                $this->switch_to_popup_iframe();
                // If no exception we are done.
                return true;
            },
            self::EXTENDED_TIMEOUT
        );
    }

    /**
     * Switches to the first iFrame in the document.
     *
     * @throws Exception When no iFrame is found.
     */
    public function switch_to_popup_iframe() {

        // Find the only iFrame in the document by tag name.
        // The reason: this iFrame has only one selector: id, that can not be used to find it
        // because it is generated automatically.
        $function = <<<JS
            (function(){
                 var iframe = document.getElementsByTagName('iframe');
                 iframe[1].name = "iframeTinymce";
            })()
JS;
        try {
            $this->getSession()->executeScript($function);
        } catch (Exception $e) {
            throw new \Exception("iFrame was NOT found." . PHP_EOL . $e->getMessage());
        }

        // After injecting the name attribute to the iFrame
        // we can now use the original switchToIFrame function which needs
        // the name attribute as an argument.
        $this->getSession()->getDriver()->switchToIFrame("iframeTinymce");
    }

    /**
     * Switch to iframe inside the editor textarea.
     *
     * @When /^I switch to editor iframe$/
     *
     * @throws Exception When no iFrame is found.
     */
    public function i_switch_to_editor_iframe()  {

        // Find the only iFrame in the document by tag name.
        // The reason: this iFrame has only one selector: id, that can not be used to find it
        // because it is generated automatically.
        $function = <<<JS
            (function(){
                 var iframe = document.getElementById('id_summary_editor_ifr');
                 iframe.name = "iframeTinymceEditor";
            })()
JS;
        try {
            $this->getSession()->executeScript($function);
        } catch (Exception $e) {
            throw new \Exception("iFrame was NOT found." . PHP_EOL . $e->getMessage());
        }

        // After injecting the name attribute to the iFrame
        // we can now use the original switchToIFrame function which needs
        // the name attribute as an argument.
        $this->getSession()->getDriver()->switchToIFrame("iframeTinymceEditor");
    }

    /**
     * Confirm browser alert popup.
     *
     * @When /^I confirm the popup$/
     */
    public function iConfirmThePopup()
    {
        sleep(1);
        $this->getSession()->getDriver()->getWebDriverSession()->accept_alert();
    }
}
