@editor @tinymce @editor_tinymce @recordrtc @tinymce_recordrtc @tinymce_recordrtc_audio
Feature: record audio to annotate it in tinymce editor
  In order to record a audio for annotation
  As a user
  I need to see the plugin dialogue when I click on record audio button

  @javascript
  Scenario: the popup dialogue shows when clicking on record audio button
    When I log in as "admin"
    And I follow "Preferences" in the user menu
    And I follow "Editor preferences"
    And I set the field "Text editor" to "TinyMCE HTML editor"
    And I press "Save changes"
    And I follow "Home"
    And I follow "Site home"
    And I click on "Add a new course" "button"
    And I click on "#id_summary_editor_audiortc" "css_element"
    Then "iframe" "css_element" should be visible
    When I switch to popup iframe
    Then I should see "Start Recording"
    And "button#start-stop" "css_element" should exist
    When I click on "Start Recording" "button"
    Then "#minutes" "css_element" should be visible
    And "#seconds" "css_element" should be visible
    And I should see "Stop Recording"
    When I wait "2" seconds
    And I click on "Stop Recording" "button"
    Then "audio#player" "css_element" should be visible
    And I should see "Record Again"
    And I should see "Attach Recording as Annotation"
    And "button#upload" "css_element" should exist
    When I click on "Attach Recording as Annotation" "button"
    And I confirm the popup
    When I set the following fields to these values:
      | Course full name | Test Course |
      | Course short name | testcourse |
    And I click on "Save and display" "button"
    And I follow "Site home"
    Then "audio.vjs-tech" "css_element" should exist

