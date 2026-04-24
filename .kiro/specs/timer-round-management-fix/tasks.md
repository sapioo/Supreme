# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Timer and Round State Change Notifications
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing cases: timer expiration, round completion, voice state changes without clear notifications
  - Test that when timer expires, prominent "Time's Up!" notification appears (from Bug Condition in design)
  - Test that when round completes, clear "Round Complete" status notification appears
  - Test that when AI speaks in voice mode, clear muted mic indicator appears
  - Test that when voice errors occur, prominent error notifications appear
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Gameplay Functionality
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for normal gameplay interactions
  - Observe: Timer countdown displays correctly during normal gameplay
  - Observe: Argument submission works in both text and voice modes
  - Observe: Round scoring calculations and display work correctly
  - Observe: Game state transitions and navigation work properly
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Fix for timer and round management state notifications

  - [x] 3.1 Implement notification system in CourtroomArena
    - Add notifications state array to track active notifications
    - Add addNotification() and removeNotification() functions
    - Create NotificationToast component for displaying messages
    - Integrate notification display into CourtroomArena render
    - _Bug_Condition: isBugCondition(input) where input.eventType IN ['timerStop', 'roundComplete', 'voiceStateChange', 'timerExpire'] AND input.hasUserNotification == false_
    - _Expected_Behavior: clearNotificationDisplayed(result) AND userUnderstandsAvailableActions(result) from design_
    - _Preservation: Timer countdown, argument processing, scoring, and game flow from Preservation Requirements_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 3.2 Enhance timer end handling with clear feedback
    - Modify handleTimerEnd() to add prominent "Time's Up!" notification
    - Explain that round ended due to timeout and show available actions
    - Maintain existing timer stop and input locking logic
    - _Bug_Condition: Timer expiration without clear user notification_
    - _Expected_Behavior: Prominent "Time's Up" message and clear round end indication from design_
    - _Preservation: Existing timer countdown and input locking behavior_
    - _Requirements: 2.3, 2.6_

  - [x] 3.3 Improve round completion feedback
    - Add "Round Complete" status notification when both parties have spoken
    - Clearly label next round button with context
    - Show round completion reason (both spoke vs. timeout)
    - _Bug_Condition: Round completion without clear status indication_
    - _Expected_Behavior: Clear "Round Complete" status and next round button labeling from design_
    - _Preservation: Existing round advancement and scoring logic_
    - _Requirements: 2.2, 2.5_

  - [x] 3.4 Enhance voice state feedback
    - Add prominent visual indicator when user mic is muted during AI speech
    - Show clear connection status and error messages for voice issues
    - Provide guidance on voice mode actions and troubleshooting
    - _Bug_Condition: Voice state changes without clear visual feedback_
    - _Expected_Behavior: Clear visual indicator for muted mic and voice status from design_
    - _Preservation: Existing voice call management and transcript handling_
    - _Requirements: 2.1, 2.4_

  - [x] 3.5 Centralize state change notifications
    - Add notification calls to voice call start/end events
    - Add notifications for round advancement
    - Add notifications for input state changes (enabled/disabled)
    - Add notifications for error conditions and recovery guidance
    - _Bug_Condition: State changes without user notification_
    - _Expected_Behavior: Clear notifications for all state changes affecting user actions from design_
    - _Preservation: All existing state management and event handling_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 3.6 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Timer and Round State Change Notifications
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: Expected Behavior Properties from design_

  - [x] 3.7 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Gameplay Functionality
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.