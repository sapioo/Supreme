import { useState, useCallback, useRef, useEffect } from 'react';
import { useGame, useGameDispatch } from '../../context/GameContext';
import { getAIResponse, scoreArgument, getAIScore, getJudgeComment } from '../../data/mockAI';
import { isQdrantConfigured, searchRelevantContext } from '../../services/qdrantService';
import useVapi from '../../hooks/useVapi';
import { createLogger } from '../../lib/logger';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import TopBar from './TopBar';
import JudgeBench from './JudgeBench';
import ChatArea from './ChatArea';
import VoiceWaveform from './VoiceWaveform';
import ArgumentInput from './ArgumentInput';

const logger = createLogger('CourtroomArena');

export default function CourtroomArena() {
  const state = useGame();
  const dispatch = useGameDispatch();
  const [viewMode, setViewMode] = useState('voice');
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const vapiSayRef = useRef(null);
  const isVoiceMode = viewMode === 'voice';

  const qdrantReady = isQdrantConfigured();
  const [roundContext, setRoundContext] = useState('');

  const aiSide = state.selectedSide === 'petitioner' ? 'respondent' : 'petitioner';

  const roundComplete = state.roundScores.length > 0 &&
    state.roundScores[state.roundScores.length - 1].round === state.currentRound;

  const buildSystemPrompt = useCallback(() => {
    if (!state.selectedCase) return '';
    const aiParty = state.selectedCase[aiSide];

    let prompt = `You are ${aiParty.name}, the ${aiSide} in the landmark Indian case "${state.selectedCase.shortName}" (${state.selectedCase.year}), argued before the ${state.selectedCase.court}.

Your position: ${aiParty.position}
${aiParty.description}

You are in a courtroom debate simulation. The user is arguing the opposing side. Respond to their arguments as a skilled Indian lawyer would — citing constitutional articles, relevant precedents, and making persuasive legal arguments.

Rules:
- Address the bench as "My Lords" or "Your Lordships"
- Keep responses to 2-3 paragraphs maximum
- Be formal, articulate, and authoritative
- Reference specific constitutional articles: ${state.selectedCase.articles.join(', ')}
- Counter the opponent's arguments directly
- This is Round ${state.currentRound} of ${state.totalRounds}`;

    if (state.caseContext) {
      prompt += `\n\n--- CASE KNOWLEDGE BASE ---\nThe following excerpts are from the actual judgment of this case. Use them to strengthen your arguments with specific citations and legal reasoning:\n${state.caseContext}`;
    }

    if (roundContext) {
      prompt += `\n\n--- RELEVANT CONTEXT FOR THIS ROUND ---\nThe following excerpts are directly relevant to the opponent's latest argument. Use them to craft a targeted response:\n${roundContext}`;
    }

    return prompt;
  }, [state.selectedCase, state.currentRound, state.totalRounds, state.caseContext, aiSide, roundContext]);

  const getEnhancedAIResponse = useCallback(async (userArgument) => {
    const mockResponse = getAIResponse(state.selectedCase.id, state.currentRound, aiSide);

    if (!qdrantReady) {
      return mockResponse;
    }

    try {
      dispatch({ type: 'SET_LOADING_CONTEXT', payload: true });

      const { formatted } = await searchRelevantContext({
        queryText: userArgument,
        caseId: state.selectedCase.id,
        aiSide,
        limit: 5,
      });

      if (formatted) {
        setRoundContext(formatted);
        logger.info('Round context retrieved from retrieval service', {
          round: state.currentRound,
          contextLength: formatted.length,
        });
      }

      dispatch({ type: 'SET_LOADING_CONTEXT', payload: false });
      return mockResponse;
    } catch (err) {
      logger.error('Round retrieval failed; using mock response', err, {
        round: state.currentRound,
        caseId: state.selectedCase?.id,
      });
      dispatch({ type: 'SET_LOADING_CONTEXT', payload: false });
      return mockResponse;
    }
  }, [state.selectedCase, state.currentRound, aiSide, qdrantReady, dispatch]);

  const handleUserVoiceTranscript = useCallback(async (transcript) => {
    if (!transcript || transcript.trim().length < 10) {
      logger.debug('Ignoring short/empty user voice transcript');
      return;
    }

    logger.info('Processing final user voice transcript', {
      round: state.currentRound,
      length: transcript.length,
    });

    dispatch({ type: 'SUBMIT_ARGUMENT', payload: transcript });

    const aiDelay = 1000 + Math.random() * 1000;
    setTimeout(async () => {
      const aiResponse = await getEnhancedAIResponse(transcript);
      dispatch({ type: 'AI_RESPOND', payload: aiResponse });

      vapiSayRef.current?.(aiResponse);

      setTimeout(() => {
        const userScore = scoreArgument(transcript, state.selectedCase, state.selectedSide, state.currentRound);
        const aiScore = getAIScore(state.currentRound);
        const judgeComment = getJudgeComment(userScore, aiScore);

        dispatch({
          type: 'SCORE_ROUND',
          payload: { userScore, aiScore, judgeComment }
        });
      }, 800);
    }, aiDelay);
  }, [dispatch, state.selectedCase, state.selectedSide, state.currentRound, getEnhancedAIResponse]);

  const handleAssistantVoiceTranscript = useCallback((transcript) => {
    if (!transcript || !transcript.trim()) return;

    logger.debug('Assistant transcript received', {
      round: state.currentRound,
      length: transcript.trim().length,
    });

    dispatch({
      type: 'UPDATE_LAST_AI_ARGUMENT',
      payload: {
        text: transcript.trim(),
        round: state.currentRound,
      },
    });
  }, [dispatch, state.currentRound]);

  const vapi = useVapi({
    systemPrompt: buildSystemPrompt(),
    onUserTranscript: handleUserVoiceTranscript,
    onAssistantTranscript: handleAssistantVoiceTranscript,
    onCallStart: () => logger.info('Voice session started'),
    onCallEnd: () => logger.info('Voice session ended'),
    onError: (err) => logger.error('Voice runtime error surfaced to courtroom', err),
    enabled: isVoiceMode,
  });

  useEffect(() => {
    vapiSayRef.current = vapi.say;
  }, [vapi.say]);

  const handleSubmitArgument = useCallback(async (text) => {
    logger.info('User submitted text argument', {
      round: state.currentRound,
      length: text.length,
    });

    dispatch({ type: 'SUBMIT_ARGUMENT', payload: text });

    const aiDelay = 1500 + Math.random() * 2000;
    setTimeout(async () => {
      const aiResponse = await getEnhancedAIResponse(text);
      dispatch({ type: 'AI_RESPOND', payload: aiResponse });

      setTimeout(() => {
        const userScore = scoreArgument(text, state.selectedCase, state.selectedSide, state.currentRound);
        const aiScore = getAIScore(state.currentRound);
        const judgeComment = getJudgeComment(userScore, aiScore);

        dispatch({
          type: 'SCORE_ROUND',
          payload: { userScore, aiScore, judgeComment }
        });
      }, 800);
    }, aiDelay);
  }, [dispatch, state.selectedCase, state.selectedSide, state.currentRound, getEnhancedAIResponse]);

  const handleNextRound = useCallback(() => {
    if (state.currentRound >= state.totalRounds) {
      if (vapi.isCallActive) {
        vapi.stopCall();
      }

      const allScores = [...state.roundScores];
      const userTotal = allScores.reduce((sum, r) => {
        return sum + Object.values(r.userScore).reduce((a, b) => a + b, 0);
      }, 0);
      const aiTotal = allScores.reduce((sum, r) => {
        return sum + Object.values(r.aiScore).reduce((a, b) => a + b, 0);
      }, 0);

      const verdict = {
        winner: userTotal >= aiTotal ? 'user' : 'ai',
        userTotal,
        aiTotal,
        margin: Math.abs(userTotal - aiTotal),
      };

      logger.info('Final verdict computed', verdict);

      dispatch({ type: 'END_GAME', payload: verdict });
    } else {
      logger.info('Proceeding to next round', {
        fromRound: state.currentRound,
        toRound: state.currentRound + 1,
      });
      dispatch({ type: 'NEXT_ROUND' });
      setRoundContext('');
    }
  }, [dispatch, state.currentRound, state.totalRounds, state.roundScores, vapi]);

  const handleTimerEnd = useCallback(() => {
    if (!state.isAiTyping && !roundComplete) {
      logger.warn('Round timer expired; submitting fallback argument', {
        round: state.currentRound,
      });
      handleSubmitArgument("The counsel requests the Court's indulgence... [Time expired]");
    }
  }, [state.isAiTyping, roundComplete, handleSubmitArgument]);

  const handleViewModeChange = useCallback((nextMode) => {
    if (nextMode === viewMode) return;

    if (nextMode === 'chat' && vapi.isCallActive) {
      vapi.stopCall();
    }

    logger.info('View mode changed', {
      previousMode: viewMode,
      nextMode,
      stoppedActiveCall: nextMode === 'chat' && vapi.isCallActive,
    });

    setViewMode(nextMode);
  }, [viewMode, vapi]);

  const handleToggleVoiceMode = useCallback(() => {
    handleViewModeChange(isVoiceMode ? 'chat' : 'voice');
  }, [handleViewModeChange, isVoiceMode]);

  const handleStartVoice = useCallback(() => {
    vapi.startCall();
  }, [vapi]);

  const handleStopVoice = useCallback(() => {
    vapi.stopCall();
  }, [vapi]);

  const handleCloseSession = useCallback(() => {
    setShowCloseDialog(true);
  }, []);

  const handleConfirmClose = useCallback(() => {
    if (vapi.isCallActive) {
      vapi.stopCall();
    }
    dispatch({ type: 'RESET' });
  }, [dispatch, vapi]);

  const isInputDisabled = state.isAiTyping || roundComplete;
  const petitioner = state.selectedCase?.petitioner;
  const respondent = state.selectedCase?.respondent;
  const userParty = state.selectedSide ? state.selectedCase?.[state.selectedSide] : null;
  const aiParty = state.selectedCase?.[aiSide];

  return (
    <div className="relative flex h-screen min-h-screen flex-col overflow-hidden bg-[#101012]" id="courtroom-arena">
      {/* Grid Background Pattern */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 1) 1px, transparent 1px)
          `,
          backgroundSize: '8px 8px'
        }}
      />
      
      {/* Gradient Overlays */}
      <div 
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 16%),
            radial-gradient(circle at 8% 8%, rgba(255, 255, 255, 0.03), transparent 35%)
          `
        }}
      />

      {/* Loading Context Overlay */}
      {state.isLoadingContext && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" id="context-loading-indicator">
          <Card className="flex items-center gap-4 border-zinc-700 bg-zinc-900/90 px-6 py-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-200" />
            <span className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-300">Retrieving case knowledge...</span>
          </Card>
        </div>
      )}

      {/* Top Bar */}
      <div className="relative z-10">
        <TopBar
          caseName={state.selectedCase?.shortName}
          currentRound={state.currentRound}
          totalRounds={state.totalRounds}
          timer={state.timer}
          onTimerEnd={handleTimerEnd}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onCloseSession={handleCloseSession}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 grid min-h-0 flex-1 grid-cols-[280px_1fr] gap-0">
        {/* Sidebar */}
        <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto border-r border-zinc-800 p-4">
          <JudgeBench roundScores={state.roundScores} />

          {isVoiceMode && vapi.isCallActive && (
            <Card className="border-zinc-800 bg-zinc-900/60 p-4">
              <VoiceWaveform
                volumeLevel={vapi.volumeLevel}
                isActive={vapi.isAssistantSpeaking}
              />
            </Card>
          )}

          {roundComplete && (
            <div className="mt-auto">
              <Button 
                onClick={handleNextRound}
                className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-semibold uppercase tracking-wider text-xs"
                id="next-round-btn"
              >
                {state.currentRound >= state.totalRounds ? (
                  <>
                    <span>Hear the Verdict</span>
                    <span className="ml-2 text-base">⚖</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Round {state.currentRound + 1}</span>
                    <span className="ml-2">→</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </aside>

        {/* Main Panel */}
        <div className="m-0 flex min-h-0 flex-col overflow-hidden rounded-none border-l border-zinc-800 bg-[#141414]/85 shadow-none">
          <ChatArea
            arguments={state.arguments}
            isAiTyping={state.isAiTyping}
            currentRound={state.currentRound}
            viewMode={viewMode}
            selectedSide={state.selectedSide}
            aiSide={aiSide}
            petitioner={petitioner}
            respondent={respondent}
            userParty={userParty}
            aiParty={aiParty}
            voiceEnabled={vapi.isAvailable}
            isVoiceMode={isVoiceMode}
            isCallActive={vapi.isCallActive}
            isUserSpeaking={vapi.isUserSpeaking}
            isAssistantSpeaking={vapi.isAssistantSpeaking || state.isAiTyping}
            assistantLiveTranscript={vapi.assistantLiveTranscript}
            connectionStatus={vapi.connectionStatus}
            onStartVoice={handleStartVoice}
            onStopVoice={handleStopVoice}
            onToggleVoiceMode={handleToggleVoiceMode}
          />

          <ArgumentInput
            onSubmit={handleSubmitArgument}
            disabled={state.isAiTyping}
            roundComplete={roundComplete}
            currentRound={state.currentRound}
            totalRounds={state.totalRounds}
            selectedSide={state.selectedSide}
            voiceEnabled={vapi.isAvailable}
            isVoiceMode={isVoiceMode}
            onToggleVoiceMode={handleToggleVoiceMode}
            isCallActive={vapi.isCallActive}
            isMuted={vapi.isMuted}
            isUserSpeaking={vapi.isUserSpeaking}
            connectionStatus={vapi.connectionStatus}
            onStartVoice={handleStartVoice}
            onStopVoice={handleStopVoice}
            onToggleMute={vapi.toggleMute}
          />
        </div>
      </div>

      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent className="max-w-sm border-zinc-700 bg-zinc-900 p-6" showClose={false}>
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800">
              <span className="text-2xl">⚖️</span>
            </div>
            <div>
              <DialogTitle className="text-zinc-100">Close Session?</DialogTitle>
              <DialogDescription className="mt-1.5">
                All progress in this session will be lost. You will return to the start screen.
              </DialogDescription>
            </div>
            <div className="flex w-full gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowCloseDialog(false)}
                className="flex-1 border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmClose}
                className="flex-1 bg-red-600 text-white hover:bg-red-700"
              >
                Close Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
