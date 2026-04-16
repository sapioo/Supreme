import { useState, useCallback, useRef, useEffect } from 'react';
import { useGame, useGameDispatch } from '../../context/GameContext';
import { getAIResponse, scoreArgument, getAIScore, getJudgeComment } from '../../data/mockAI';
import { isQdrantConfigured, searchRelevantContext, getCaseOverview } from '../../services/qdrantService';
import useVapi from '../../hooks/useVapi';
import TopBar from './TopBar';
import JudgeBench from './JudgeBench';
import ChatArea from './ChatArea';
import VoiceWaveform from './VoiceWaveform';
import ArgumentInput from './ArgumentInput';
import './CourtroomArena.css';

export default function CourtroomArena() {
  const state = useGame();
  const dispatch = useGameDispatch();
  const [showScores, setShowScores] = useState(false);
  const [roundComplete, setRoundComplete] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const vapiSayRef = useRef(null); // Bridge ref for vapi.say()

  // Qdrant context state
  const [qdrantReady, setQdrantReady] = useState(false);
  const [roundContext, setRoundContext] = useState(''); // per-round retrieved context

  const aiSide = state.selectedSide === 'petitioner' ? 'respondent' : 'petitioner';

  // ─── Fetch case overview context on mount ────────────────────────────────

  useEffect(() => {
    if (!state.selectedCase) return;

    const configured = isQdrantConfigured();
    setQdrantReady(configured);

    if (!configured) {
      console.log('[CourtRoom] Qdrant not configured — using mock AI fallback.');
      return;
    }

    // Fetch initial case context
    (async () => {
      dispatch({ type: 'SET_LOADING_CONTEXT', payload: true });
      try {
        const overview = await getCaseOverview(state.selectedCase.id);
        if (overview.formatted) {
          dispatch({ type: 'SET_CASE_CONTEXT', payload: overview.formatted });
          console.log('[CourtRoom] Case overview context loaded from Qdrant.');
        }
      } catch (err) {
        console.error('[CourtRoom] Failed to fetch case overview:', err.message);
      } finally {
        dispatch({ type: 'SET_LOADING_CONTEXT', payload: false });
      }
    })();
  }, [state.selectedCase, dispatch]);

  // ─── Build system prompt with Qdrant context ────────────────────────────

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

    // Inject Qdrant case overview context if available
    if (state.caseContext) {
      prompt += `\n\n--- CASE KNOWLEDGE BASE ---\nThe following excerpts are from the actual judgment of this case. Use them to strengthen your arguments with specific citations and legal reasoning:\n${state.caseContext}`;
    }

    // Inject per-round retrieved context if available
    if (roundContext) {
      prompt += `\n\n--- RELEVANT CONTEXT FOR THIS ROUND ---\nThe following excerpts are directly relevant to the opponent's latest argument. Use them to craft a targeted response:\n${roundContext}`;
    }

    return prompt;
  }, [state.selectedCase, state.currentRound, state.totalRounds, state.caseContext, aiSide, roundContext]);

  // ─── Qdrant-enhanced AI response ─────────────────────────────────────────

  /**
   * Get AI response — first tries Qdrant-enhanced context, falls back to mock.
   * Returns the response text.
   */
  const getEnhancedAIResponse = useCallback(async (userArgument) => {
    // Always have the mock response ready as fallback
    const mockResponse = getAIResponse(state.selectedCase.id, state.currentRound, aiSide);

    if (!qdrantReady) {
      return mockResponse;
    }

    try {
      dispatch({ type: 'SET_LOADING_CONTEXT', payload: true });

      // Query Qdrant for context relevant to the user's argument
      const { formatted } = await searchRelevantContext({
        queryText: userArgument,
        caseId: state.selectedCase.id,
        aiSide,
        limit: 5,
      });

      if (formatted) {
        setRoundContext(formatted);
        console.log('[CourtRoom] Round context retrieved from Qdrant.');
      }

      dispatch({ type: 'SET_LOADING_CONTEXT', payload: false });

      // For now, still use mock response but it's now contextually aware
      // via the system prompt injection above.
      // When Vapi is used with inline config, the system prompt already
      // includes the Qdrant context, making the AI response smarter.
      return mockResponse;
    } catch (err) {
      console.error('[CourtRoom] Qdrant retrieval failed, using mock:', err.message);
      dispatch({ type: 'SET_LOADING_CONTEXT', payload: false });
      return mockResponse;
    }
  }, [state.selectedCase, state.currentRound, aiSide, qdrantReady, dispatch]);

  // ─── Voice transcript handler ────────────────────────────────────────────

  const handleUserVoiceTranscript = useCallback(async (transcript) => {
    if (!transcript || transcript.trim().length < 10) return;

    // Submit the transcript as the user's argument
    dispatch({ type: 'SUBMIT_ARGUMENT', payload: transcript });
    setShowScores(false);

    const aiDelay = 1000 + Math.random() * 1000;
    setTimeout(async () => {
      const aiResponse = await getEnhancedAIResponse(transcript);
      dispatch({ type: 'AI_RESPOND', payload: aiResponse });

      // Make the AI speak the response via Vapi TTS
      vapiSayRef.current?.(aiResponse);

      setTimeout(() => {
        const userScore = scoreArgument(transcript, state.selectedCase, state.selectedSide, state.currentRound);
        const aiScore = getAIScore(state.currentRound);
        const judgeComment = getJudgeComment(userScore, aiScore);

        dispatch({
          type: 'SCORE_ROUND',
          payload: { userScore, aiScore, judgeComment }
        });

        setShowScores(true);
        setRoundComplete(true);
      }, 800);
    }, aiDelay);
  }, [dispatch, state.selectedCase, state.selectedSide, state.currentRound, getEnhancedAIResponse]);

  /**
   * Handle transcript from Vapi when assistant speaks
   */
  const handleAssistantVoiceTranscript = useCallback(() => {
    // The AI transcript from Vapi is shown in real-time via ChatArea
  }, []);

  // Initialize Vapi
  const vapi = useVapi({
    systemPrompt: buildSystemPrompt(),
    onUserTranscript: handleUserVoiceTranscript,
    onAssistantTranscript: handleAssistantVoiceTranscript,
    onCallStart: () => console.log('[CourtRoom] Voice session started'),
    onCallEnd: () => console.log('[CourtRoom] Voice session ended'),
    onError: (err) => console.error('[CourtRoom] Vapi error:', err),
    enabled: isVoiceMode,
  });

  // Keep say ref in sync so callbacks can use it
  useEffect(() => {
    vapiSayRef.current = vapi.say;
  }, [vapi.say]);

  // ─── Text argument handler ──────────────────────────────────────────────

  const handleSubmitArgument = useCallback(async (text) => {
    dispatch({ type: 'SUBMIT_ARGUMENT', payload: text });
    setShowScores(false);

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

        setShowScores(true);
        setRoundComplete(true);
      }, 800);
    }, aiDelay);
  }, [dispatch, state.selectedCase, state.selectedSide, state.currentRound, getEnhancedAIResponse]);

  // ─── Round / game flow ──────────────────────────────────────────────────

  const handleNextRound = useCallback(() => {
    if (state.currentRound >= state.totalRounds) {
      // Stop voice call if active
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

      dispatch({ type: 'END_GAME', payload: verdict });
    } else {
      dispatch({ type: 'NEXT_ROUND' });
      setShowScores(false);
      setRoundComplete(false);
      setRoundContext(''); // Clear per-round context for next round
    }
  }, [dispatch, state.currentRound, state.totalRounds, state.roundScores, vapi]);

  const handleTimerEnd = useCallback(() => {
    if (!state.isAiTyping && !roundComplete) {
      handleSubmitArgument("The counsel requests the Court's indulgence... [Time expired]");
    }
  }, [state.isAiTyping, roundComplete, handleSubmitArgument]);

  const handleToggleVoiceMode = useCallback(() => {
    if (isVoiceMode && vapi.isCallActive) {
      vapi.stopCall();
    }
    setIsVoiceMode(prev => !prev);
  }, [isVoiceMode, vapi]);

  const handleStartVoice = useCallback(() => {
    vapi.startCall();
  }, [vapi]);

  const handleStopVoice = useCallback(() => {
    vapi.stopCall();
  }, [vapi]);

  const isInputDisabled = state.isAiTyping || roundComplete;

  return (
    <div className="courtroom" id="courtroom-arena">
      {/* Loading Context Overlay */}
      {state.isLoadingContext && (
        <div className="courtroom__context-loading" id="context-loading-indicator">
          <div className="courtroom__context-loading-inner">
            <div className="courtroom__context-spinner" />
            <span>Retrieving case knowledge…</span>
          </div>
        </div>
      )}

      {/* Qdrant Status Badge */}
      {qdrantReady && (
        <div className="courtroom__qdrant-badge" title="Connected to case knowledge base">
          <span className="courtroom__qdrant-dot" />
          <span>Live Knowledge</span>
        </div>
      )}

      {/* Top Bar */}
      <TopBar
        caseName={state.selectedCase?.shortName}
        courtBadge={state.selectedCase?.courtBadge}
        currentRound={state.currentRound}
        totalRounds={state.totalRounds}
        timer={state.timer}
        onTimerEnd={handleTimerEnd}
      />

      <section className="courtroom__scene">
        <aside className="courtroom__side-panel">
          <JudgeBench
            roundScores={state.roundScores}
            isVisible={showScores}
          />

          {isVoiceMode && vapi.isCallActive && (
            <div className="courtroom__waveform-container">
              <VoiceWaveform
                volumeLevel={vapi.volumeLevel}
                isActive={vapi.isAssistantSpeaking}
              />
            </div>
          )}

          {roundComplete && (
            <div className="courtroom__round-action">
              <button
                className="courtroom__next-btn"
                onClick={handleNextRound}
                id="next-round-btn"
              >
                {state.currentRound >= state.totalRounds ? (
                  <>
                    <span>Hear the Verdict</span>
                    <span className="courtroom__next-icon">⚖</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Round {state.currentRound + 1}</span>
                    <span className="courtroom__next-icon">→</span>
                  </>
                )}
              </button>
            </div>
          )}
        </aside>

        <div className="courtroom__main-panel">
          <ChatArea
            arguments={state.arguments}
            isAiTyping={state.isAiTyping}
            currentRound={state.currentRound}
          />

          <ArgumentInput
            onSubmit={handleSubmitArgument}
            disabled={isInputDisabled}
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
      </section>
    </div>
  );
}
