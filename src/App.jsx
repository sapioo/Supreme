import { useCallback } from 'react';
import { useGame, useGameDispatch } from './context/GameContext';
import ChooseSide from './components/landing/ChooseSide';
import GavelLoader from './components/common/GavelLoader';
import CourtroomArena from './components/courtroom/CourtroomArena';
import VerdictScreen from './components/verdict/VerdictScreen';
import StartPage from './pages/StartPage';
import LandingPage from './pages/LandingPage';
import './App.css';

export default function App() {
  const state = useGame();
  const dispatch = useGameDispatch();

  const handleEnterExperience = useCallback(() => {
    dispatch({ type: 'SET_PAGE', payload: 'landing' });
  }, [dispatch]);

  const handleSelectCase = useCallback((caseData) => {
    dispatch({ type: 'SELECT_CASE', payload: caseData });
  }, [dispatch]);

  const handleSelectSide = useCallback((side) => {
    dispatch({ type: 'SELECT_SIDE', payload: side });
  }, [dispatch]);

  const handleBackToCases = useCallback(() => {
    dispatch({ type: 'SET_PAGE', payload: 'landing' });
  }, [dispatch]);

  const handleLoadingComplete = useCallback(() => {
    dispatch({ type: 'START_GAME' });
  }, [dispatch]);

  return (
    <div className="app" id="courtroom-ai-app">
      {/* Page: Start */}
      {state.currentPage === 'start' && (
        <div className="app__page app__page--start">
          <StartPage onStart={handleEnterExperience} />
        </div>
      )}

      {/* Page: Landing */}
      {state.currentPage === 'landing' && (
        <div className="app__page app__page--landing">
          <LandingPage onSelectCase={handleSelectCase} />
        </div>
      )}

      {/* Page: Choose Side */}
      {state.currentPage === 'chooseSide' && (
        <ChooseSide
          caseData={state.selectedCase}
          onSelectSide={handleSelectSide}
          onBack={handleBackToCases}
        />
      )}

      {/* Page: Loading */}
      {state.currentPage === 'loading' && (
        <GavelLoader onComplete={handleLoadingComplete} />
      )}

      {/* Page: Courtroom */}
      {state.currentPage === 'courtroom' && (
        <CourtroomArena />
      )}

      {/* Page: Verdict */}
      {state.currentPage === 'verdict' && (
        <VerdictScreen />
      )}
    </div>
  );
}
