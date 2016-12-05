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
$content = optional_param('content', '', PARAM_RAW);
$action = optional_param('action', '', PARAM_TEXT);

list($context, $course, $cm) = get_context_info_array($contextid);
require_login($course, false, $cm);
require_sesskey();

$PAGE->set_context($context);
$PAGE->set_url(MOODLE_TINYMCE_RECORDRTC_URL);
$PAGE->set_cacheable(false);
$title = isset($cm->name)? $cm->name: '';
$PAGE->set_title($title);
$PAGE->set_heading($title);

// Reset page layout for inside editor.
$PAGE->set_pagelayout('popup');

if ( $action != '' && isset($SESSION->recordrtc_bbbsession) && !is_null($SESSION->recordrtc_bbbsession) ) {
    $bbbsession = $SESSION->recordrtc_bbbsession;
} else {
    ////////////////////////////////////////////////
    /////  WebRTC Session Setup Starts  /////
    ////////////////////////////////////////////////
    // User data
    $bbbsession['username'] = get_string('fullnamedisplay', 'moodle', $USER);
    $bbbsession['userID'] = $USER->id;
    $bbbsession['moderator'] = true;
    $bbbsession['managerecordings'] = true;

    // WebRTC server data
    $bbbsession['endpoint'] = recordrtc_get_cfg_server_url();
    $bbbsession['shared_secret'] = recordrtc_get_cfg_shared_secret();

    // Server data
    $bbbsession['modPW'] = recordrtc_random_password(12);
    $bbbsession['viewerPW'] = recordrtc_random_password(12);

    // Database info related to the activity
    $bbbsession['meetingid'] = sha1($CFG->wwwroot.$cm->id.$USER->id.$bbbsession['shared_secret']);
    if ( isset($cm->modname) ) {
        $cm_module = $DB->get_record($cm->modname, array('id' => $cm->instance));
        $bbbsession['meetingname'] = $cm->name;
        $bbbsession['meetingdescription'] = recordrtc_html2text($cm_module->intro, 64);
    } else {
        $bbbsession['meetingname'] = "";
        $bbbsession['meetingdescription'] = "";
    }

    $bbbsession['record'] = true;

    // Additional info related to the course
    $bbbsession['context'] = $context;
    $bbbsession['course'] = $course;
    $bbbsession['cm'] = $cm;

    // Metadata (origin)
    $bbbsession['origin'] = "Moodle";
    $bbbsession['originVersion'] = $CFG->release;
    $parsedUrl = parse_url($CFG->wwwroot);
    $bbbsession['originServerName'] = $parsedUrl['host'];
    $bbbsession['originServerUrl'] = $CFG->wwwroot;
    $bbbsession['originServerCommonName'] = '';
    $bbbsession['originTag'] = 'moodle-tinymce_recordrtc ('.get_config('mod_recordrtc', 'version').')';
    // Metadata (context)
    $bbbsession['contextActivityName'] = $bbbsession['meetingname'];
    $bbbsession['contextActivityDescription'] = $bbbsession['meetingdescription'];
    $bbbsession['contextActivityTags'] = "";

    // Operation URLs
    $sesskey = sesskey();
    $bbbsession['logoutURL'] = $CFG->wwwroot.MOODLE_TINYMCE_RECORDRTC_URL.'?contextid='.$contextid.'&content='.urlencode($content).'&sesskey='.$sesskey.'&action=logout';
    $bbbsession['launchURL'] = $CFG->wwwroot.MOODLE_TINYMCE_RECORDRTC_URL.'?contextid='.$contextid.'&content='.urlencode($content).'&sesskey='.$sesskey.'&action=launch';
    //$bbbsession['recordingReadyURL'] = $CFG->wwwroot.'/mod/recordrtc/bbb_broker.php?action=recording_ready';

    $SESSION->recordrtc_bbbsession = $bbbsession;
    ////////////////////////////////////////////////
    /////   WebRTC Session Setup Ends   /////
    ////////////////////////////////////////////////
}

echo $OUTPUT->header();
//$mform->display();

$recordings = Array();
//If not annotated and no recordings or action=launch proceed with the login
if ( $action == 'launch' || $action != 'logout' && !recordrtc_is_annotated($content) && empty($recordings) ) {
    // Try to join WebRTC directly.
    $error = array();
    $meeting = Array();
    if ( $meeting ) {
        $password = $meeting['moderatorPW'];
    } else {

        $response = NULL;
        if (!$response) {
            //////// If the server is unreachable, then prompts the user of the necessary action
            error_log("If the server is unreachable, then prompts the user of the necessary action");
            $error = array('messageKey' => $response['messageKey'], 'message' => $response['message']);
        } else if( $response['returncode'] == "FAILED" ) {
            //////// The meeting was not created
            error_log("The meeting was not created");
            $error = array('messageKey' => $response['messageKey'], 'message' => $response['message']);
        } else if ($response['hasBeenForciblyEnded'] == "true"){
            //////// Meeting has been forcibely ended
            error_log("Meeting has been forcibely ended");
            $error = array('messageKey' => $response['messageKey'], 'message' => $response['message']);
        } else {
            //////// Meeting was successfuly created
        }

        $password = $bbbsession['modPW'];
    }

    if ( empty($error) ) {
        // get defaul config XML
        $defaultConfigXML = recordrtc_getDefaultConfigXML($bbbsession['endpoint'], $bbbsession['shared_secret']);
        if ( isset($defaultConfigXML->returncode) ) {
            error_log("Default config XML could not be retrieved");
            $error = array('messageKey' => $defaultConfigXML->response['messageKey'], 'message' => $defaultConfigXML->response['message']);
            $configToken = null;
        } else {
            error_log("Default config XML successfuly retrieved");
            //prepare configXML
            $defaultConfigXMLTrimmed = str_replace("\n", '', preg_replace('~\s*(<([^-->]*)>[^<]*<!--\2-->|<[^>]*>)\s*~','$1', str_replace("<?xml version=\"1.0\"?>\n", '', $defaultConfigXML->asXML())));

            $dom = new DOMDocument();
            $dom->loadXML($defaultConfigXMLTrimmed);
            $xpath = new DOMXPath($dom);
            //// set layout bbb.layout.name.videochat
            $element = $xpath->query('//layout')->item(0);
            $element->setAttribute('defaultLayout', 'bbb.layout.name.videochat');
            $element->setAttribute('showLayoutTools', 'false');
            $element->setAttribute('confirmLogout', 'false');
            $element->setAttribute('showRecordingNotification', 'false');
            //// remove desktop sharing
            $element = $xpath->query('//modules/module[@name=\'DeskShareModule\']')->item(0);
            if ( $element != null ) {
                $element->setAttribute('showButton', 'false');
            } else {
                $element = $xpath->query('//modules/module[@name=\'ScreenshareModule\']')->item(0);
                if ( $element != null ) {
                    $element->setAttribute('showButton', 'false');
                }
            }
            //// remove layout menu
            $element = $xpath->query('//modules/module[@name=\'LayoutModule\']')->item(0);
            $element->setAttribute('enableEdit', 'false');
            //// remove PhoneModule button
            $element = $xpath->query('//modules/module[@name=\'PhoneModule\']')->item(0);
            $element->setAttribute('showButton', 'true');
            $element->setAttribute('skipCheck', 'true');
            $element->setAttribute('listenOnlyMode', 'false');
            //// remove VideoconfModule button
            $element = $xpath->query('//modules/module[@name=\'VideoconfModule\']')->item(0);
            $element->setAttribute('autoStart', 'true');
            $element->setAttribute('showButton', 'true');
            $element->setAttribute('skipCamSettingsCheck', 'true');

            // set config XML
            $configXML = str_replace("<?xml version=\"1.0\"?>\n", '', $dom->saveXML());
            $configToken = recordrtc_bbb_broker_set_config_xml($bbbsession['meetingid'], $configXML);
        }
        // obtain join_url
        $join_url = recordrtc_getJoinURL($bbbsession['meetingid'], $bbbsession['username'], $password, $bbbsession['shared_secret'], $bbbsession['endpoint'], $bbbsession['logoutURL'], $configToken);
        // render javascript for executing the redirect
        echo "<script language=\"javascript\">//<![CDATA[\n";
        echo "window.location = '".$join_url."';";
        echo "//]]\n";
        echo "</script>\n";
    } else {
        print $error['message'];
    }

} else {
    if ( $action == 'logout' ) {
        //Execute end command
        $meeting_info = recordrtc_bbb_broker_do_end_meeting($bbbsession['meetingid'], $bbbsession['modPW']);
    }
    // Recording ready (or annotation deleted manually). Show UI for annotate/cancel based on the existent recording.

    $out = "\n";

    $out .= '<style>'."\n";
    $out .= '    div.show-recording {'."\n";
    $out .= '        position: relative;'."\n";
    $out .= '        float:left;'."\n";
    $out .= '        margin:5px;'."\n";
    $out .= '    }'."\n";
    $out .= '    div.show-recording:hover img{'."\n";
    $out .= '        opacity:0.5;'."\n";
    $out .= '    }'."\n";
    $out .= '    div.show-recording:hover input {'."\n";
    $out .= '        display: block;'."\n";
    $out .= '    }'."\n";
    $out .= '    div.show-recording input {'."\n";
    $out .= '        position:absolute;'."\n";
    $out .= '        display:none;'."\n";
    $out .= '    }'."\n";
    $out .= '    div.show-recording input.delete {'."\n";
    $out .= '        top:0;'."\n";
    $out .= '        left:79%;'."\n";
    $out .= '    }'."\n";
    $out .= '</style>'."\n";

    $out .= '<script type="text/javascript">'."\n";
    // Because there is no relative path to TinyMCE, we have to use JavaScript
    // to work out correct path from the .js files from TinyMCE. Only files
    // inside this plugin can be included with relative path (below).
    $out .= '   var editor_tinymce_include = function(path) {'."\n";
    $out .= '       document.write(\'<script type="text/javascript" src="\' + parent.tinyMCE.baseURL + \'/\' + path + \'"></\' + \'script>\');'."\n";
    $out .= '   };'."\n";
    $out .= '   editor_tinymce_include(\'tiny_mce_popup.js\');'."\n";
    $out .= '   editor_tinymce_include(\'utils/validate.js\');'."\n";
    $out .= '   editor_tinymce_include(\'utils/form_utils.js\');'."\n";
    $out .= '   editor_tinymce_include(\'utils/editable_selects.js\');'."\n";
    $out .= '</script>'."\n";


    $out .= '<div><center>'."\n";
    //// Recordings
    $out .= html_writer::start_tag('div', array('id' => 'recording_selector', 'class' => 'btn-group', 'role' => 'group'));
    $rec_img_src = $CFG->wwwroot.'/mod/recordrtc/pix/recordrtc-80.png';
    $rec_img_lbl = get_string('recording_ready', 'tinymce_recordrtc');
    foreach ( $recordings as $recording ) {
        // If recording is the one used in the annotation add class 'active'
        $rec_lnk_att = array('onclick' => 'M.tinymce_recordrtc.view_select(this);', 'type' => 'button', 'class' => 'btn btn-secondary recording', 'ondblclick' => 'window.open(\''.$recording['playbacks']['presentation']['url'].'\');return false;', 'id' => $recording['recordID'], 'title' => $rec_img_lbl, 'data-url' => $recording['playbacks']['presentation']['url']);
        $rec_btn =  html_writer::tag('button', html_writer::img($rec_img_src, $rec_img_lbl), $rec_lnk_att);
        $out .= '<div id="'.$recording['recordID'].'" class="show-recording">'.$rec_btn.'<input class="delete" type="button" value="x" onclick="M.tinymce_recordrtc.view_delete(\''.$recording['recordID'].'\');" /></div>';
    }
    $out .= html_writer::end_tag('div');

    //// Create a button for adding a new recording to the selection panel
    $add_rec_icon = $OUTPUT->pix_icon('t/add', get_string('add'), null, array('title' => get_string('add'), 'class' => 'icon'));
    $add_rec_lnk_att = array('id' => 'recording_add', 'onclick' => 'window.location.replace(\''.$bbbsession['launchURL'].'\');return false;');

    //// If logout, add a processing recording resource
    if ( $action == 'logout' ) {
        ////// Button for adding a new recording is hidden
        $add_rec_lnk_att['class'] = 'hidden';
        ////// Add the spinning wheel
        $poll_img_src = $CFG->wwwroot.'/mod/recordrtc/pix/processing64.gif';
        $poll_img_lbl =get_string('recording_processing', 'tinymce_recordrtc');
        $poll_img_att = array('id' => 'recording_polling', 'title' => get_string('recording_processing', 'tinymce_recordrtc'));
        $out .= '&nbsp;'.html_writer::img($poll_img_src, $poll_img_lbl, $poll_img_att);
    }

    //// Add the button for adding a new recording to the selection panel
    $out .= '&nbsp;'.html_writer::tag('button', $add_rec_icon, $add_rec_lnk_att);

    // Button for Annotate
    $text = get_string('action_annotation_annotate', 'tinymce_recordrtc');
    $linkatt = array('onclick' => 'M.tinymce_recordrtc.view_annotate();', 'class' => 'hidden-print');
    $button =  html_writer::tag('button', $text, $linkatt);
    $out .= '<br><br>'.$button;
    // Button for Cancel
    $text = get_string('action_annotation_cancel', 'tinymce_recordrtc');
    $linkatt = array('onclick' => 'M.tinymce_recordrtc.view_cancel();', 'class' => 'hidden-print');
    $button =  html_writer::tag('button', $text, $linkatt);
    $out .= '&nbsp;'.$button;
    $out .= "\n".'</center></div>'."\n";

    print $out;

    $ping_interval = recordrtc_get_cfg_waitformoderator_ping_interval();
    $jsVars = array(
      'meetingid' => $bbbsession['meetingid'],
      'ping_interval' => ($ping_interval > 0? $ping_interval * 1000: 15000),
      'action' => $action,
      'recording_ready' => get_string('recording_ready', 'tinymce_recordrtc'),
      'recording_icon80' => $CFG->wwwroot.'/mod/recordrtc/pix/recordrtc-80.png',
      'recording_icon32' => $CFG->wwwroot.'/mod/recordrtc/pix/recordrtc-32.png'
    );
    $PAGE->requires->data_for_js('recordrtc', $jsVars);

    $jsmodule = array(
        'name'     => 'tinymce_recordrtc',
        'fullpath' => MOODLE_TINYMCE_RECORDRTC_ROOT.'tinymce_module.js',
        'requires' => array('datasource-get', 'datasource-jsonschema', 'datasource-polling'),
    );
    $PAGE->requires->js_init_call('M.tinymce_recordrtc.view_init', array(), false, $jsmodule);
}

echo $OUTPUT->footer();
