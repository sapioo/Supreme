import { useCallback } from 'react';
import { useGame, useGameDispatch } from './context/GameContext';
import { createLogger } from './lib/logger';
import ChooseSide from './components/landing/ChooseSide';
import GavelLoader from './components/common/GavelLoader';
import CourtroomArena from './components/courtroom/CourtroomArena';
import VerdictScreen from './components/verdict/VerdictScreen';
import StartPage from './pages/StartPage';
import LandingPage from './pages/LandingPage';
import SetupWizardShell from './components/onboarding/SetupWizardShell';
import './App.css';

const wizardSteps = [
  { key: 'start', label: 'Welcome' },
  { key: 'landing', label: 'Case' },
  { key: 'chooseSide', label: 'Role' },
];

const logger = createLogger('App');

function SetupWizard() {
  const state = useGame();
  const dispatch = useGameDispatch();

  const currentStep = (() => {
    const index = wizardSteps.findIndex((step) => step.key === state.currentPage);
    return index === -1 ? 0 : index;
  })();

  const handleSetStep = useCallback(
    (index) => {
      const step = wizardSteps[index];
      if (!step) return;
      logger.debug('Navigating setup step', { index, step: step.key });
      dispatch({ type: 'SET_PAGE', payload: step.key });
    },
    [dispatch]
  );

  const handleBack = useCallback(() => {
    if (currentStep <= 0) return;
    handleSetStep(currentStep - 1);
  }, [currentStep, handleSetStep]);

  const handleSkipIntro = useCallback(() => {
    logger.info('Intro skipped by user');
    dispatch({ type: 'SET_PAGE', payload: 'landing' });
  }, [dispatch]);

  const handleSelectCase = useCallback(
    (caseData) => {
      logger.info('Case selected', {
        caseId: caseData?.id,
        shortName: caseData?.shortName,
      });
      dispatch({ type: 'SELECT_CASE', payload: caseData });
    },
    [dispatch]
  );

  const handleSelectSide = useCallback(
    (side) => {
      logger.info('Side selected', { side });
      dispatch({ type: 'SELECT_SIDE', payload: side });
    },
    [dispatch]
  );

  const handleNext = useCallback(() => {
    if (state.currentPage === 'start') {
      handleSetStep(1);
      return;
    }

    if (state.currentPage === 'landing') {
      if (!state.selectedCase) {
        logger.warn('Next blocked: case not selected yet');
        return;
      }
      handleSetStep(2);
      return;
    }

    if (state.currentPage === 'chooseSide') {
      if (!state.selectedSide) {
        logger.warn('Next blocked: side not selected yet');
        return;
      }
      logger.info('Setup complete, entering loading phase');
      dispatch({ type: 'SET_PAGE', payload: 'loading' });
    }
  }, [dispatch, handleSetStep, state.currentPage, state.selectedCase, state.selectedSide]);

  const config = (() => {
    if (state.currentPage === 'start') {
      return {
        title: 'Welcome. Let us configure your first session.',
        description: 'You only need to choose one case and one side. This setup is editable later.',
        nextLabel: 'Start setup',
        nextDisabled: false,
        secondaryAction: {
          label: 'Skip intro',
          onClick: handleSkipIntro,
        },
      };
    }

    if (state.currentPage === 'landing') {
      return {
        title: 'Select a case to start with.',
        description: '',
        nextLabel: state.selectedCase ? 'Continue' : 'Select a case to continue',
        nextDisabled: !state.selectedCase,
        secondaryAction: null,
      };
    }

    return {
      title: 'Choose your side.',
      description: 'Your role sets defaults. AI counsel automatically takes the opposing side.',
      nextLabel: state.selectedSide ? 'Enter courtroom' : 'Choose a side to continue',
      nextDisabled: !state.selectedSide,
      secondaryAction: null,
    };
  })();

  const content = (() => {
    if (state.currentPage === 'start') {
      return <StartPage />;
    }

    if (state.currentPage === 'landing') {
      return <LandingPage onSelectCase={handleSelectCase} selectedCase={state.selectedCase} />;
    }

    return (
      <ChooseSide
        caseData={state.selectedCase}
        selectedSide={state.selectedSide}
        onSelectSide={handleSelectSide}
      />
    );
  })();

  return (
    <SetupWizardShell
      steps={wizardSteps}
      currentStep={currentStep}
      title={config.title}
      description={config.description}
      nextLabel={config.nextLabel}
      onNext={handleNext}
      nextDisabled={config.nextDisabled}
      onBack={currentStep === 0 ? null : handleBack}
      secondaryAction={config.secondaryAction}
    >
      {content}
    </SetupWizardShell>
  );
}

export default function App() {
  const state = useGame();
  const dispatch = useGameDispatch();

  const handleLoadingComplete = useCallback(() => {
    logger.info('Loading complete, starting courtroom');
    dispatch({ type: 'START_GAME' });
  }, [dispatch]);

  const handleLoadingContext = useCallback((context) => {
    if (context) {
      logger.info('Initial case context loaded', {
        contextLength: context.length,
      });
      dispatch({ type: 'SET_CASE_CONTEXT', payload: context });
      return;
    }

    logger.warn('No initial case context loaded; continuing with fallback data');
  }, [dispatch]);

  const isWizardPage = state.currentPage === 'start' || state.currentPage === 'landing' || state.currentPage === 'chooseSide';

  return (
    <div className="app" id="courtroom-ai-app">
      {isWizardPage && <SetupWizard />}

      {state.currentPage === 'loading' && (
        <GavelLoader
          selectedCase={state.selectedCase}
          selectedSide={state.selectedSide}
          onContextLoaded={handleLoadingContext}
          onComplete={handleLoadingComplete}
        />
      )}

      {state.currentPage === 'courtroom' && <CourtroomArena />}

      {state.currentPage === 'verdict' && <VerdictScreen />}
    </div>
  );
}
