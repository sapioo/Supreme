import { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { createLogger } from '../lib/logger';

const GameContext = createContext(null);
const GameDispatchContext = createContext(null);

const STORAGE_KEY = 'courtroom_ai_state';
const CURRENT_VERSION = 1;
const logger = createLogger('GameContext');

const TRANSIENT_KEYS = new Set([
  'isAiTyping',
  'isTransitioning',
  'isLoadingContext',
  'timer',
]);

const initialState = {
  currentPage: 'start',
  selectedCase: null,
  selectedSide: null,
  currentRound: 1,
  totalRounds: 5,
  arguments: [],
  roundScores: [],
  timer: 120,
  isAiTyping: false,
  verdict: null,
  isTransitioning: false,
  caseContext: null,
  isLoadingContext: false,
};

function pickPersistable(state) {
  return Object.fromEntries(
    Object.entries(state).filter(([k]) => !TRANSIENT_KEYS.has(k))
  );
}

function sanitizeHydratedState(saved) {
  const state = { ...saved };

  if (state.currentPage === 'loading') {
    state.currentPage = 'chooseSide';
  }

  if (state.isAiTyping) {
    state.isAiTyping = false;
  }
  if (state.isTransitioning) {
    state.isTransitioning = false;
  }
  if (state.isLoadingContext) {
    state.isLoadingContext = false;
  }

  if (state.currentPage === 'courtroom' && state.arguments) {
    const last = state.arguments[state.arguments.length - 1];
    if (last && last.side === 'user') {
      const hasScoreForRound = state.roundScores?.some(
        (s) => s.round === state.currentRound
      );
      if (!hasScoreForRound) {
        state.arguments = state.arguments.slice(0, -1);
      }
    }
  }

  return state;
}

function hydrateState(initial) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    const saved = JSON.parse(raw);

    if (!saved || typeof saved !== 'object' || !saved._version) {
      return initial;
    }

    const restored = sanitizeHydratedState(saved);
    const result = {};
    for (const key of Object.keys(initial)) {
      if (key in restored) {
        result[key] = restored[key];
      } else {
        result[key] = initial[key];
      }
    }
    logger.info('Restored session from localStorage', {
      currentPage: result.currentPage,
      currentRound: result.currentRound,
      argumentsCount: result.arguments?.length || 0,
      scoresCount: result.roundScores?.length || 0,
    });
    return result;
  } catch (err) {
    logger.warn('Failed to hydrate state; using defaults', {
      error: err instanceof Error ? err.message : String(err),
    });
    return initial;
  }
}

function saveState(state) {
  try {
    const persistable = pickPersistable(state);
    persistable._version = CURRENT_VERSION;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  } catch (err) {
    logger.warn('Failed to persist state to localStorage', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    logger.warn('Failed to clear persisted state', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

function gameReducer(state, action) {
  switch (action.type) {
    case 'SELECT_CASE':
      return {
        ...state,
        selectedCase: action.payload,
        selectedSide: null,
      };

    case 'SELECT_SIDE':
      return {
        ...state,
        selectedSide: action.payload,
      };

    case 'START_GAME':
      logger.info('Game started', {
        caseId: state.selectedCase?.id || null,
        selectedSide: state.selectedSide,
      });
      return {
        ...state,
        currentPage: 'courtroom',
        currentRound: 1,
        arguments: [],
        roundScores: [],
        timer: 120,
        verdict: null,
      };

    case 'SUBMIT_ARGUMENT':
      return {
        ...state,
        arguments: [
          ...state.arguments,
          { side: 'user', text: action.payload, round: state.currentRound }
        ],
        isAiTyping: true,
      };

    case 'AI_RESPOND':
      return {
        ...state,
        arguments: action.payload
          ? [
              ...state.arguments,
              { side: 'ai', text: action.payload, round: state.currentRound },
            ]
          : state.arguments,
        isAiTyping: false,
      };

    case 'UPDATE_LAST_AI_ARGUMENT': {
      const nextArguments = [...state.arguments];
      const lastAiIndex = [...nextArguments].reverse().findIndex((arg) => arg.side === 'ai');

      if (lastAiIndex === -1) {
        nextArguments.push({
          side: 'ai',
          text: action.payload.text,
          round: action.payload.round ?? state.currentRound,
        });
      } else {
        const resolvedIndex = nextArguments.length - 1 - lastAiIndex;
        nextArguments[resolvedIndex] = {
          ...nextArguments[resolvedIndex],
          text: action.payload.text,
          round: action.payload.round ?? nextArguments[resolvedIndex].round,
        };
      }

      return {
        ...state,
        arguments: nextArguments,
        isAiTyping: false,
      };
    }

    case 'SCORE_ROUND':
      return {
        ...state,
        roundScores: [
          ...state.roundScores,
          {
            round: state.currentRound,
            userScore: action.payload.userScore,
            aiScore: action.payload.aiScore,
            judgeComment: action.payload.judgeComment,
          }
        ],
      };

    case 'NEXT_ROUND':
      logger.info('Advancing round', {
        fromRound: state.currentRound,
        toRound: state.currentRound + 1,
      });
      return {
        ...state,
        currentRound: state.currentRound + 1,
        timer: 120,
      };

    case 'UPDATE_TIMER':
      return {
        ...state,
        timer: action.payload,
      };

    case 'END_GAME':
      logger.info('Game ended', action.payload);
      return {
        ...state,
        currentPage: 'verdict',
        verdict: action.payload,
      };

    case 'SET_PAGE':
      logger.debug('Page changed', {
        from: state.currentPage,
        to: action.payload,
      });
      return {
        ...state,
        currentPage: action.payload,
      };

    case 'SET_TRANSITIONING':
      return {
        ...state,
        isTransitioning: action.payload,
      };

    case 'SET_CASE_CONTEXT':
      return {
        ...state,
        caseContext: action.payload,
      };

    case 'SET_LOADING_CONTEXT':
      return {
        ...state,
        isLoadingContext: action.payload,
      };

    case 'RESET':
      logger.info('Session reset requested');
      clearState();
      return {
        ...initialState,
      };

    default:
      logger.error('Unknown reducer action encountered', null, { actionType: action?.type });
      throw new Error(`Unknown action: ${action.type}`);
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState, hydrateState);

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (state.currentPage !== initialState.currentPage) {
        saveState(state);
      }
      return;
    }
    saveState(state);
  }, [state]);

  return (
    <GameContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>
        {children}
      </GameDispatchContext.Provider>
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

export function useGameDispatch() {
  const context = useContext(GameDispatchContext);
  if (!context) {
    throw new Error('useGameDispatch must be used within a GameProvider');
  }
  return context;
}
