@editor @tinymce @editor_tinymce @recordrtc @tinymce_recordrtc @tinymce_recordrtc_video
Feature: record video to annotate it in tinymce editor
  In order to record a video for annotation
  As a user
  I need to see the plugin dialogue when I click on record video button

  @javascript
  Scenario: the popup dialogue shows when clicking on record video button
    When I log in as "admin"
    And I follow "Preferences" in the user menu
    And I follow "Editor preferences"
    And I set the field "Text editor" to "TinyMCE HTML editor"
    And I press "Save changes"
    And I follow "Home"
    And I follow "Site home"
    And I click on "Add a new course" "button"
    And I click on "#id_summary_editor_videortc" "css_element"
    Then "iframe" "css_element" should be visible
    When I switch to popup iframe
    Then I should see "Start Recording"
    And "button#start-stop" "css_element" should exist
    And "video#player" "css_element" should exist
    And "button#upload" "css_element" should exist
