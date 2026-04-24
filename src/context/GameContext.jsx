import { createContext, useContext, useReducer } from 'react';

const GameContext = createContext(null);
const GameDispatchContext = createContext(null);

/**
 * Pages: start | drafting | landing | chooseSide | loading | courtroom | verdict
 */
const initialState = {
  currentPage: 'start',
  selectedCase: null,
  selectedSide: null,        // 'petitioner' | 'respondent'
  difficulty: 'medium',      // 'easy' | 'medium' | 'hard'
  currentRound: 1,
  totalRounds: 5,
  arguments: [],              // { side: 'user'|'ai', text, round }
  roundScores: [],            // { round, userScore: {...}, aiScore: {...}, judgeComment }
  timer: 120,
  isAiTyping: false,
  verdict: null,
  isTransitioning: false,
  caseContext: null,           // Retrieved Qdrant context for the current case
  isLoadingContext: false,     // Loading state during Qdrant retrieval
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'SELECT_CASE':
      return {
        ...state,
        selectedCase: action.payload,
        currentPage: 'chooseSide',
      };

    case 'SELECT_SIDE':
      return {
        ...state,
        selectedSide: action.payload,
        currentPage: 'loading',
      };

    case 'SET_DIFFICULTY':
      return {
        ...state,
        difficulty: action.payload,
      };

    case 'START_GAME':
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
          { side: 'user', text: String(action.payload ?? ''), round: state.currentRound }
        ],
        isAiTyping: true,
      };

    case 'AI_RESPOND': {
      const aiText = String(action.payload ?? '');
      return {
        ...state,
        arguments: aiText
          ? [
            ...state.arguments,
            { side: 'ai', text: aiText, round: state.currentRound },
          ]
          : state.arguments,
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
      return {
        ...state,
        currentPage: 'verdict',
        verdict: action.payload,
      };

    case 'SET_PAGE':
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
      return {
        ...initialState,
      };

    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

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
