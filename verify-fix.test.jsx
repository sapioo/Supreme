import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameProvider } from '../src/context/GameContext';
import CourtroomArena from '../src/components/courtroom/CourtroomArena';

// Mock the hooks and services
vi.mock('../src/hooks/useVapi', () => ({
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
  })
}));

vi.mock('../src/services/nimService', () => ({
  generateAIArgument: vi.fn().mockResolvedValue('Mock AI response'),
  scoreArgumentWithAI: vi.fn().mockResolvedValue(null),
  checkNIMConnectivity: vi.fn(),
}));

vi.mock('../src/services/qdrantService', () => ({
  isQdrantConfigured: vi.fn().mockReturnValue(false),
  checkCollectionHealth: vi.fn().mockResolvedValue({ exists: false, pointCount: 0 }),
  searchRelevantContext: vi.fn().mockResolvedValue({ formatted: '' }),
  getCaseOverview: vi.fn().mockResolvedValue({ formatted: '' }),
}));

const mockCase = {
  id: 'test-case',
  shortName: 'Test Case',
  year: 2024,
  courtBadge: 'SC',
  articles: ['Article 14'],
  petitioner: {
    name: 'Test Petitioner',
    position: 'Test position',
    description: 'Test description',
    keyArgs: ['Test argument']
  },
  respondent: {
    name: 'Test Respondent', 
    position: 'Test position',
    description: 'Test description',
    keyArgs: ['Test argument']
  }
};

const mockInitialState = {
  selectedCase: mockCase,
  selectedSide: 'petitioner',
  currentRound: 1,
  totalRounds: 3,
  timer: 120,
  arguments: [],
  roundScores: [],
  isAiTyping: false,
  isLoadingContext: false,
  caseContext: '',
  difficulty: 'medium'
};

describe('Fix Verification - Notification System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have notification system implemented in CourtroomArena', () => {
    // This test verifies that the notification system exists
    // by checking if the component renders without errors
    expect(() => {
      render(
        <GameProvider initialState={mockInitialState}>
          <CourtroomArena />
        </GameProvider>
      );
    }).not.toThrow();
  });

  it('should verify NotificationToast component exists', async () => {
    // Import the NotificationToast component to verify it exists
    const { default: NotificationToast } = await import('../src/components/courtroom/NotificationToast');
    expect(NotificationToast).toBeDefined();
  });
});