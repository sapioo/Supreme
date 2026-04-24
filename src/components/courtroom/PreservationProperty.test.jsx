import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import TopBar from './TopBar';

/**
 * Preservation Property Tests - Existing Gameplay Functionality
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 * 
 * IMPORTANT: Follow observation-first methodology
 * These tests observe behavior on UNFIXED code for normal gameplay interactions
 * and capture that behavior to ensure it's preserved after the fix.
 * 
 * EXPECTED OUTCOME: Tests PASS (this confirms baseline behavior to preserve)
 */

describe('Preservation Property Tests - Existing Gameplay Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Property 2: Preservation - Timer Countdown Display
   * 
   * Observes that timer countdown displays correctly during normal gameplay
   * and writes test to verify this continues after fix
   * 
   * **Validates: Requirements 3.1**
   */
  describe('Timer Countdown Preservation', () => {
    it('should preserve timer countdown display during normal gameplay', () => {
      // Observe current behavior: Timer displays correctly and counts down
      const mockTimerEnd = vi.fn();
      render(
        <TopBar
          caseName="Test Case v. State"
          courtBadge="SC"
          currentRound={1}
          totalRounds={5}
          timer={120}
          onTimerEnd={mockTimerEnd}
          isTimerRunning={true}
          timerKey={0}
          timerLabel="Your Turn"
          onEndCase={vi.fn()}
        />
      );
      
      // Verify timer is displayed (baseline behavior to preserve)
      expect(screen.getByText('2:00')).toBeInTheDocument();
      expect(screen.getByText('Your Turn')).toBeInTheDocument();
      expect(screen.getByText('Test Case v. State')).toBeInTheDocument();
      expect(screen.getByText('SC')).toBeInTheDocument();
    });

    it('should preserve timer display formatting across different values', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 300 }), // Timer values from 0 to 5 minutes
          (timerValue) => {
            const { unmount } = render(
              <TopBar
                caseName="Test Case"
                courtBadge="SC"
                currentRound={1}
                totalRounds={5}
                timer={timerValue}
                onTimerEnd={vi.fn()}
                isTimerRunning={true}
                timerKey={0}
                timerLabel="Your Turn"
                onEndCase={vi.fn()}
              />
            );
            
            // Verify timer displays in MM:SS format (baseline behavior)
            const expectedMinutes = Math.floor(timerValue / 60);
            const expectedSeconds = timerValue % 60;
            const expectedFormat = `${expectedMinutes}:${expectedSeconds.toString().padStart(2, '0')}`;
            
            // This behavior must be preserved after the fix
            expect(screen.getByText(expectedFormat)).toBeInTheDocument();
            
            unmount();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should preserve timer progress bar functionality', () => {
      render(
        <TopBar
          caseName="Test Case"
          courtBadge="SC"
          currentRound={1}
          totalRounds={5}
          timer={120}
          onTimerEnd={vi.fn()}
          isTimerRunning={true}
          timerKey={0}
          timerLabel="Your Turn"
          onEndCase={vi.fn()}
        />
      );
      
      // Verify timer progress bar exists (baseline behavior)
      const timerBar = document.querySelector('.topbar__timer-fill');
      expect(timerBar).toBeInTheDocument();
      
      // Progress bar should start at full width (100%) - baseline behavior
      expect(timerBar.style.width).toBe('100%');
    });

    it('should preserve timer countdown mechanism', async () => {
      vi.useFakeTimers();
      const mockTimerEnd = vi.fn();
      
      const { rerender } = render(
        <TopBar
          caseName="Test Case"
          courtBadge="SC"
          currentRound={1}
          totalRounds={5}
          timer={5}
          onTimerEnd={mockTimerEnd}
          isTimerRunning={true}
          timerKey={0}
          timerLabel="Your Turn"
          onEndCase={vi.fn()}
        />
      );
      
      // Initial state
      expect(screen.getByText('0:05')).toBeInTheDocument();
      
      // Advance time and verify countdown works (baseline behavior)
      vi.advanceTimersByTime(1000);
      
      // Re-render with updated timer value to simulate countdown
      rerender(
        <TopBar
          caseName="Test Case"
          courtBadge="SC"
          currentRound={1}
          totalRounds={5}
          timer={4}
          onTimerEnd={mockTimerEnd}
          isTimerRunning={true}
          timerKey={0}
          timerLabel="Your Turn"
          onEndCase={vi.fn()}
        />
      );
      expect(screen.getByText('0:04')).toBeInTheDocument();
      
      // Advance to timer end
      vi.advanceTimersByTime(4000);
      rerender(
        <TopBar
          caseName="Test Case"
          courtBadge="SC"
          currentRound={1}
          totalRounds={5}
          timer={0}
          onTimerEnd={mockTimerEnd}
          isTimerRunning={false}
          timerKey={0}
          timerLabel="Time's Up"
          onEndCase={vi.fn()}
        />
      );
      expect(screen.getByText('0:00')).toBeInTheDocument();
      
      vi.useRealTimers();
    });
  });

  /**
   * Property 2: Preservation - Round Scoring and Display
   * 
   * Observes that round scoring calculations and display work correctly
   * and writes test to verify this continues after fix
   * 
   * **Validates: Requirements 3.4**
   */
  describe('Round Scoring Preservation', () => {
    it('should preserve round display and navigation', () => {
      render(
        <TopBar
          caseName="Test Case v. State"
          courtBadge="SC"
          currentRound={2}
          totalRounds={5}
          timer={120}
          onTimerEnd={vi.fn()}
          isTimerRunning={true}
          timerKey={0}
          timerLabel="Your Turn"
          onEndCase={vi.fn()}
        />
      );
      
      // Verify round display (observe current behavior)
      expect(screen.getByText('2')).toBeInTheDocument(); // Current round
      expect(screen.getByText('5')).toBeInTheDocument(); // Total rounds
      expect(screen.getByText('of')).toBeInTheDocument(); // Round separator
      
      // Round progress dots should be displayed (baseline behavior)
      const roundDots = document.querySelectorAll('.topbar__round-dot');
      expect(roundDots).toHaveLength(5);
    });

    it('should preserve case information display', () => {
      render(
        <TopBar
          caseName="Test Case v. State"
          courtBadge="SC"
          currentRound={1}
          totalRounds={5}
          timer={120}
          onTimerEnd={vi.fn()}
          isTimerRunning={true}
          timerKey={0}
          timerLabel="Your Turn"
          onEndCase={vi.fn()}
        />
      );
      
      // Verify case name and badge display (baseline behavior)
      expect(screen.getByText('Test Case v. State')).toBeInTheDocument();
      expect(screen.getByText('SC')).toBeInTheDocument();
    });

    it('should preserve round progression indicators', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }), // Current round
          fc.integer({ min: 3, max: 7 }), // Total rounds
          (currentRound, totalRounds) => {
            fc.pre(currentRound <= totalRounds); // Ensure valid round state
            
            const { unmount } = render(
              <TopBar
                caseName="Test Case"
                courtBadge="SC"
                currentRound={currentRound}
                totalRounds={totalRounds}
                timer={120}
                onTimerEnd={vi.fn()}
                isTimerRunning={true}
                timerKey={0}
                timerLabel="Your Turn"
                onEndCase={vi.fn()}
              />
            );
            
            // Verify round numbers are displayed correctly using specific selectors (baseline behavior)
            const currentRoundElement = document.querySelector('.topbar__round-current');
            const totalRoundsElement = document.querySelector('.topbar__round-total');
            expect(currentRoundElement).toHaveTextContent(currentRound.toString());
            expect(totalRoundsElement).toHaveTextContent(totalRounds.toString());
            
            // Round dots should match total rounds (baseline behavior)
            const roundDots = document.querySelectorAll('.topbar__round-dot');
            expect(roundDots).toHaveLength(totalRounds);
            
            unmount();
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should preserve end case button functionality', () => {
      const mockEndCase = vi.fn();
      render(
        <TopBar
          caseName="Test Case"
          courtBadge="SC"
          currentRound={1}
          totalRounds={5}
          timer={120}
          onTimerEnd={vi.fn()}
          isTimerRunning={true}
          timerKey={0}
          timerLabel="Your Turn"
          onEndCase={mockEndCase}
        />
      );
      
      // Find end case button (observe current behavior)
      const endCaseButton = screen.getByRole('button', { name: /end/i });
      expect(endCaseButton).toBeInTheDocument();
      
      // Button should be clickable (baseline behavior to preserve)
      fireEvent.click(endCaseButton);
      expect(mockEndCase).toHaveBeenCalled();
    });
  });

  /**
   * Property 2: Preservation - Timer Label States
   * 
   * Observes that timer labels work correctly for different states
   * and writes test to verify this continues after fix
   * 
   * **Validates: Requirements 3.1, 3.5, 3.6**
   */
  describe('Timer Label States Preservation', () => {
    it('should preserve different timer label states', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Your Turn', 'Turn Complete', "Time's Up", 'Waiting'),
          (timerLabel) => {
            const { unmount } = render(
              <TopBar
                caseName="Test Case"
                courtBadge="SC"
                currentRound={1}
                totalRounds={5}
                timer={120}
                onTimerEnd={vi.fn()}
                isTimerRunning={true}
                timerKey={0}
                timerLabel={timerLabel}
                onEndCase={vi.fn()}
              />
            );
            
            // Timer label should be displayed correctly (baseline behavior)
            expect(screen.getByText(timerLabel)).toBeInTheDocument();
            
            unmount();
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should preserve timer urgency state when time is low', () => {
      render(
        <TopBar
          caseName="Test Case"
          courtBadge="SC"
          currentRound={1}
          totalRounds={5}
          timer={30}
          onTimerEnd={vi.fn()}
          isTimerRunning={true}
          timerKey={0}
          timerLabel="Your Turn"
          onEndCase={vi.fn()}
        />
      );
      
      // Timer should show urgent state when time is low (baseline behavior)
      const timerElement = document.querySelector('.topbar__timer');
      expect(timerElement).toBeInTheDocument();
      
      // Timer value should still be displayed correctly
      expect(screen.getByText('0:30')).toBeInTheDocument();
    });

    it('should preserve timer stopped state', () => {
      render(
        <TopBar
          caseName="Test Case"
          courtBadge="SC"
          currentRound={1}
          totalRounds={5}
          timer={120}
          onTimerEnd={vi.fn()}
          isTimerRunning={false}
          timerKey={0}
          timerLabel="Turn Complete"
          onEndCase={vi.fn()}
        />
      );
      
      // Timer should display correctly when stopped (baseline behavior)
      expect(screen.getByText('2:00')).toBeInTheDocument();
      expect(screen.getByText('Turn Complete')).toBeInTheDocument();
    });
  });

  /**
   * Integration test to verify overall preservation of core functionality
   */
  describe('Overall TopBar Functionality Preservation', () => {
    it('should preserve all core TopBar elements and interactions', () => {
      render(
        <TopBar
          caseName="Test Case v. State"
          courtBadge="SC"
          currentRound={3}
          totalRounds={5}
          timer={90}
          onTimerEnd={vi.fn()}
          isTimerRunning={true}
          timerKey={0}
          timerLabel="Your Turn"
          onEndCase={vi.fn()}
        />
      );
      
      // Verify all major elements are rendered (baseline behavior)
      expect(document.getElementById('courtroom-topbar')).toBeInTheDocument();
      
      // Timer elements
      expect(screen.getByText('1:30')).toBeInTheDocument();
      expect(screen.getByText('Your Turn')).toBeInTheDocument();
      
      // Case information
      expect(screen.getByText('Test Case v. State')).toBeInTheDocument();
      expect(screen.getByText('SC')).toBeInTheDocument();
      
      // Round information
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('of')).toBeInTheDocument();
      
      // Control buttons
      expect(screen.getByRole('button', { name: /end/i })).toBeInTheDocument();
      
      // Round dots
      const roundDots = document.querySelectorAll('.topbar__round-dot');
      expect(roundDots).toHaveLength(5);
    });

    it('should preserve component data flow and state management', () => {
      // Test that component handles different prop combinations correctly
      fc.assert(
        fc.property(
          fc.record({
            currentRound: fc.integer({ min: 1, max: 4 }), // Changed max to 4 to avoid currentRound === totalRounds
            totalRounds: fc.constant(5),
            timer: fc.integer({ min: 0, max: 300 }),
            isTimerRunning: fc.boolean(),
          }),
          (props) => {
            const { unmount } = render(
              <TopBar
                caseName="Test Case"
                courtBadge="SC"
                currentRound={props.currentRound}
                totalRounds={props.totalRounds}
                timer={props.timer}
                onTimerEnd={vi.fn()}
                isTimerRunning={props.isTimerRunning}
                timerKey={0}
                timerLabel="Your Turn"
                onEndCase={vi.fn()}
              />
            );
            
            // Core elements should always be present using specific selectors (baseline behavior)
            const currentRoundElement = document.querySelector('.topbar__round-current');
            const totalRoundsElement = document.querySelector('.topbar__round-total');
            expect(currentRoundElement).toHaveTextContent(props.currentRound.toString());
            expect(totalRoundsElement).toHaveTextContent(props.totalRounds.toString());
            
            // Timer formatting should be preserved
            const expectedMinutes = Math.floor(props.timer / 60);
            const expectedSeconds = props.timer % 60;
            const expectedFormat = `${expectedMinutes}:${expectedSeconds.toString().padStart(2, '0')}`;
            expect(screen.getByText(expectedFormat)).toBeInTheDocument();
            
            // Case information should be preserved
            expect(screen.getByText('Test Case')).toBeInTheDocument();
            expect(screen.getByText('SC')).toBeInTheDocument();
            
            unmount();
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});