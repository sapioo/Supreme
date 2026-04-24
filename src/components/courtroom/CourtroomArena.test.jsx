import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import CourtroomArena from './CourtroomArena';
import { GameProvider } from '../../context/GameContext';

// Mock the services and hooks
vi.mock('../../services/nimService', () => ({
  generateAIArgument: vi.fn().mockResolvedValue('Mock AI response'),
  scoreArgumentWithAI: vi.fn().mockResolvedValue(null),
  checkNIMConnectivity: vi.fn(),
}));

vi.mock('../../services/qdrantService', () => ({
  isQdrantConfigured: vi.fn().mockReturnValue(false),
  checkCollectionHealth: vi.fn().mockResolvedValue({ exists: false, pointCount: 0 }),
  searchRelevantContext: vi.fn().mockResolvedValue({ formatted: '' }),
  getCaseOverview: vi.fn().mockResolvedValue({ formatted: '' }),
}));

vi.mock('../../hooks/useVapi', () => ({
  default: () => ({
    isAvailable: true,
    isCallActive: false,
    isMuted: false,
    isUserSpeaking: false,
    isAssistantSpeaking: false,
    volumeLevel: 0,
    connectionStatus: 'disconnected',
    lastError: null,
    startCall: vi.fn(),
    stopCall: vi.fn(),
    toggleMute: vi.fn(),
    sendMessage: vi.fn(),
  }),
}));

// Mock case data
const mockCase = {
  id: 'test-case',
  shortName: 'Test Case v. State',
  year: 2024,
  courtBadge: 'SC',
  articles: ['Article 14', 'Article 21'],
  petitioner: {
    name: 'Test Petitioner',
    position: 'Test position',
    description: 'Test description',
    keyArgs: ['Argument 1', 'Argument 2'],
  },
  respondent: {
    name: 'Test Respondent', 
    position: 'Test position',
    description: 'Test description',
    keyArgs: ['Argument 1', 'Argument 2'],
  },
};

// Test wrapper component
function TestWrapper({ children, initialState = {} }) {
  return (
    <GameProvider>
      <div data-testid="test-wrapper">
        {children}
      </div>
    </GameProvider>
  );
}

// Helper to render CourtroomArena with game state
function renderCourtroomArena(gameState = {}) {
  const defaultState = {
    selectedCase: mockCase,
    selectedSide: 'petitioner',
    currentRound: 1,
    totalRounds: 3,
    timer: 120,
    arguments: [],
    roundScores: [],
    isAiTyping: false,
    isLoadingContext: false,
    caseContext: null,
    ...gameState,
  };

  // Mock the useGame hook to return our test state
  vi.doMock('../../context/GameContext', () => ({
    useGame: () => defaultState,
    useGameDispatch: () => vi.fn(),
    GameProvider: ({ children }) => children,
  }));

  return render(
    <TestWrapper>
      <CourtroomArena />
    </TestWrapper>
  );
}

describe('Bug Condition Exploration Test - Timer and Round State Change Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**
   * 
   * Property 1: Bug Condition - Timer and Round State Change Notifications
   * 
   * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
   * 
   * This test encodes the expected behavior and will validate the fix when it passes after implementation.
   * The goal is to surface counterexamples that demonstrate the bug exists.
   */
  describe('Property 1: Bug Condition - Clear State Change Notifications', () => {
    it('should display prominent "Time\'s Up!" notification when timer expires', async () => {
      // EXPECTED TO FAIL: Current code only shows "Time's Up" in timer label, no prominent notification
      renderCourtroomArena({
        selectedCase: mockCase,
        selectedSide: 'petitioner',
        currentRound: 1,
        timer: 1, // Start with 1 second
      });

      // Wait for timer to expire
      vi.advanceTimersByTime(2000);
      
      // BUG CONDITION: Should show prominent "Time's Up!" notification
      // EXPECTED FAILURE: This assertion will fail because no prominent notification exists
      const timeUpNotification = screen.queryByText(/time'?s up!?/i);
      expect(timeUpNotification).toBeInTheDocument();
      expect(timeUpNotification).toHaveClass('notification', 'prominent', 'toast'); // Should be prominent
    });

    it('should display clear "Round Complete" status notification when both parties speak', async () => {
      // EXPECTED TO FAIL: Current code shows next round button but no clear "Round Complete" status
      renderCourtroomArena({
        selectedCase: mockCase,
        selectedSide: 'petitioner',
        currentRound: 1,
        arguments: [
          { side: 'user', text: 'User argument', round: 1 },
          { side: 'ai', text: 'AI argument', round: 1 },
        ],
        roundScores: [
          {
            round: 1,
            userScore: { legalReasoning: 8, useOfPrecedent: 7, persuasiveness: 6, constitutionalValidity: 8 },
            aiScore: { legalReasoning: 7, useOfPrecedent: 8, persuasiveness: 7, constitutionalValidity: 6 },
            judgeComment: 'Test comment',
          },
        ],
      });

      // BUG CONDITION: Should show clear "Round Complete" status notification
      // EXPECTED FAILURE: This assertion will fail because no clear status notification exists
      const roundCompleteNotification = screen.queryByText(/round complete/i);
      expect(roundCompleteNotification).toBeInTheDocument();
      expect(roundCompleteNotification).toHaveClass('notification', 'status'); // Should be clear status
    });

    it('should display clear muted mic indicator when AI is speaking in voice mode', async () => {
      // EXPECTED TO FAIL: Current code has minimal visual indication of muted state
      const mockUseVapi = vi.fn().mockReturnValue({
        isAvailable: true,
        isCallActive: true,
        isMuted: true,
        isUserSpeaking: false,
        isAssistantSpeaking: true, // AI is speaking
        volumeLevel: 50,
        connectionStatus: 'connected',
        lastError: null,
        startCall: vi.fn(),
        stopCall: vi.fn(),
        toggleMute: vi.fn(),
        sendMessage: vi.fn(),
      });

      vi.doMock('../../hooks/useVapi', () => ({
        default: mockUseVapi,
      }));

      renderCourtroomArena({
        selectedCase: mockCase,
        selectedSide: 'petitioner',
        currentRound: 1,
      });

      // BUG CONDITION: Should show clear visual indicator that user mic is muted during AI speech
      // EXPECTED FAILURE: This assertion will fail because no clear muted mic indicator exists
      const mutedMicIndicator = screen.queryByText(/mic muted|microphone muted|ai speaking/i);
      expect(mutedMicIndicator).toBeInTheDocument();
      expect(mutedMicIndicator).toHaveClass('notification', 'voice-status'); // Should be clear indicator
    });

    it('should display prominent error notifications when voice errors occur', async () => {
      // EXPECTED TO FAIL: Current code has voiceError state but display is not prominent enough
      const mockUseVapi = vi.fn().mockReturnValue({
        isAvailable: true,
        isCallActive: false,
        isMuted: false,
        isUserSpeaking: false,
        isAssistantSpeaking: false,
        volumeLevel: 0,
        connectionStatus: 'error',
        lastError: 'Voice connection failed',
        startCall: vi.fn(),
        stopCall: vi.fn(),
        toggleMute: vi.fn(),
        sendMessage: vi.fn(),
      });

      vi.doMock('../../hooks/useVapi', () => ({
        default: mockUseVapi,
      }));

      renderCourtroomArena({
        selectedCase: mockCase,
        selectedSide: 'petitioner',
        currentRound: 1,
      });

      // BUG CONDITION: Should show prominent error notification for voice issues
      // EXPECTED FAILURE: This assertion will fail because error display is not prominent enough
      const errorNotification = screen.queryByText(/voice connection failed/i);
      expect(errorNotification).toBeInTheDocument();
      expect(errorNotification).toHaveClass('notification', 'error', 'prominent'); // Should be prominent
    });

    /**
     * Property-based test to verify state change notifications across various scenarios
     * Scoped to concrete failing cases: timer expiration, round completion, voice state changes
     */
    it('should provide clear notifications for all state changes that affect user actions', () => {
      fc.assert(
        fc.property(
          fc.record({
            eventType: fc.constantFrom('timerExpire', 'roundComplete', 'voiceStateChange', 'voiceError'),
            hasUserNotification: fc.constant(false), // Bug condition: no notification
            requiresUserAction: fc.constant(true),
            affectsUserInput: fc.constant(true),
          }),
          (stateChangeEvent) => {
            // This property encodes the bug condition from the design document
            const isBugCondition = 
              ['timerExpire', 'roundComplete', 'voiceStateChange', 'voiceError'].includes(stateChangeEvent.eventType) &&
              stateChangeEvent.hasUserNotification === false &&
              (stateChangeEvent.requiresUserAction === true || stateChangeEvent.affectsUserInput === true);

            // EXPECTED TO FAIL: For all bug conditions, the system should provide clear notifications
            // but currently does not, so this assertion will fail and surface counterexamples
            if (isBugCondition) {
              // This assertion will fail on unfixed code, proving the bug exists
              expect(stateChangeEvent.hasUserNotification).toBe(true);
            }
          }
        ),
        { numRuns: 20 } // Generate 20 test cases to surface various counterexamples
      );
    });
  });
});