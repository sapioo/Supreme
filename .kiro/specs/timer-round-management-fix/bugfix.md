# Bugfix Requirements Document

## Introduction

The timer and round management system in CourtRoom AI has critical issues that disrupt gameplay flow and user experience. Users report that the timer stops unexpectedly during gameplay without clear indication of why, the round changing system is confusing with unclear state transitions, and there's an overall lack of clarity in timer/round state management. These issues prevent users from understanding when they can speak, when rounds advance, and what actions are available to them.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the timer is running and voice call ends unexpectedly THEN the system stops the timer without notifying the user why it stopped

1.2 WHEN both user and AI have spoken in a round THEN the system shows "next round" button but doesn't clearly indicate the round is complete

1.3 WHEN the timer expires THEN the system locks user input but doesn't provide clear feedback about what happened or what to do next

1.4 WHEN voice mode is active and AI is speaking THEN the system mutes the user mic but doesn't show clear visual indication of this state

1.5 WHEN round completion conditions are met THEN the system doesn't clearly communicate to users what triggers round advancement

1.6 WHEN timer reaches zero THEN the system forces round completion but the user interface doesn't clearly show this transition

### Expected Behavior (Correct)

2.1 WHEN the timer stops for any reason THEN the system SHALL display a clear notification explaining why the timer stopped and what the user should do next

2.2 WHEN both user and AI have spoken in a round THEN the system SHALL clearly indicate "Round Complete" status and show the next round button with clear labeling

2.3 WHEN the timer expires THEN the system SHALL show a prominent "Time's Up" message and clearly indicate that the round has ended due to timeout

2.4 WHEN voice mode is active and AI is speaking THEN the system SHALL display a clear visual indicator that the user mic is temporarily muted during AI speech

2.5 WHEN round completion conditions are met THEN the system SHALL display clear status messages explaining what happened and what actions are available

2.6 WHEN timer reaches zero THEN the system SHALL provide immediate visual feedback about the timeout and automatically transition to round completion state with clear messaging

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the timer is running normally during user turn THEN the system SHALL CONTINUE TO count down and display the remaining time accurately

3.2 WHEN users submit arguments in text mode THEN the system SHALL CONTINUE TO process them and advance rounds as expected

3.3 WHEN voice calls are active and working properly THEN the system SHALL CONTINUE TO handle transcripts and responses correctly

3.4 WHEN round scoring occurs THEN the system SHALL CONTINUE TO calculate and display scores accurately

3.5 WHEN users navigate between voice and text modes THEN the system SHALL CONTINUE TO maintain game state correctly

3.6 WHEN the final round completes THEN the system SHALL CONTINUE TO transition to the verdict screen properly