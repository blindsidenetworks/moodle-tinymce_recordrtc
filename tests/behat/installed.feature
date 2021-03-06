@editor @tinymce @editor_tinymce @recordrtc @tinymce_recordrtc @tinymce_recordrtc_installed
Feature: Installation succeeds
  In order to use this plugin
  As a user
  I need the installation to work

  Scenario: Check the Plugins overview for the name of this plugin
    When I log in as "admin"
    And I navigate to "Plugins > Plugins overview" in site administration
    Then the following should exist in the "plugins-control-panel" table:
        |RecordRTC|
        |tinymce_recordrtc|