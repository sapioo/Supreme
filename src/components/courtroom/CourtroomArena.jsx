import { useState, useCallback, useRef, useEffect } from 'react';
import { useGame, useGameDispatch } from '../../context/GameContext';
import { scoreArgument, getAIScore, getJudgeComment, getAIResponse } from '../../data/mockAI';
import { generateAIArgument, scoreArgumentWithAI, checkNIMConnectivity } from '../../services/nimService';
import { isQdrantConfigured, checkCollectionHealth, searchRelevantContext, getCaseOverview } from '../../services/qdrantService';
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

  const [showScores, setShowScores]             = useState(false);
  const [roundComplete, setRoundComplete]       = useState(false);
  // Default to voice mode — text is the fallback option
  const [isVoiceMode, setIsVoiceMode]           = useState(true);
  const [isUserTurnActive, setIsUserTurnActive] = useState(true);
  const [turnTimerKey, setTurnTimerKey]         = useState(0);
  const [voiceError, setVoiceError]             = useState('');

  // Qdrant
  const [qdrantReady, setQdrantReady]                   = useState(false);
  const [roundContext, setRoundContext]                 = useState('');
  const [hasContextAttempted, setHasContextAttempted]   = useState(false);

  // Voice priming
  const [hasPrimedVoice, setHasPrimedVoice] = useState(false);

  // Live transcript accumulator — chunks from Vapi build into one bubble
  const [liveTranscript, setLiveTranscript] = useState('');
  const liveTranscriptRef = useRef('');

  // Track whether AI is currently speaking so we can mute the user mic
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  // Ref to track mute state without triggering re-renders in the effect
  const isMutedByAiRef = useRef(false);

  const aiSide = state.selectedSide === 'petitioner' ? 'respondent' : 'petitioner';

  // ─── Qdrant: fetch case overview on mount ──────────────────────────────────
  useEffect(() => {
    // Check NIM connectivity once on mount (result visible in browser console)
    checkNIMConnectivity();

    if (!state.selectedCase) return;

    setHasContextAttempted(false);
    setRoundContext('');

    // First check if Qdrant is configured at all
    if (!isQdrantConfigured()) {
      setQdrantReady(false);
      setHasContextAttempted(true);
      return;
    }

    (async () => {
      dispatch({ type: 'SET_LOADING_CONTEXT', payload: true });
      try {
        // Check collection health before attempting search
        const health = await checkCollectionHealth();
        if (!health.exists || health.pointCount === 0) {
          console.warn('[CourtRoom] Qdrant collection empty or missing — skipping RAG.');
          setQdrantReady(false);
          return;
        }

        setQdrantReady(true);
        const overview = await getCaseOverview(state.selectedCase.id);
        if (overview.formatted) {
          dispatch({ type: 'SET_CASE_CONTEXT', payload: overview.formatted });
          console.log(`[CourtRoom] Qdrant context loaded (${health.pointCount} points).`);
        }
      } catch (err) {
        console.error('[CourtRoom] Qdrant setup failed:', err.message);
        setQdrantReady(false);
      } finally {
        dispatch({ type: 'SET_LOADING_CONTEXT', payload: false });
        setHasContextAttempted(true);
      }
    })();
  }, [state.selectedCase?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Build Vapi system prompt ──────────────────────────────────────────────
  const buildSystemPrompt = useCallback(() => {
    if (!state.selectedCase) return '';
    const aiParty = state.selectedCase[aiSide];
    const userParty = state.selectedCase[state.selectedSide];

    let prompt =
      `You are ${aiParty.name}, arguing as the ${aiSide} in the landmark Indian Supreme Court case ` +
      `"${state.selectedCase.shortName}" (${state.selectedCase.year}).\n\n` +
      `Your position: ${aiParty.position}\n` +
      `${aiParty.description}\n\n` +
      `Key arguments you should draw from:\n` +
      aiParty.keyArgs.map((a, i) => `${i + 1}. ${a}`).join('\n') +
      `\n\nRelevant constitutional articles: ${state.selectedCase.articles.join(', ')}\n\n` +
      `The opposing counsel is ${userParty.name} (${state.selectedSide}).\n\n` +
      `RULES:\n` +
      `- Address the bench as "My Lords" or "Your Lordships"\n` +
      `- Keep responses to 2-3 paragraphs\n` +
      `- Be formal, authoritative, and precise\n` +
      `- Directly counter the opponent's specific points\n` +
      `- Cite constitutional articles and legal principles\n` +
      `- Do NOT use bullet points — write in flowing legal prose\n` +
      `- This is Round ${state.currentRound} of ${state.totalRounds}`;

    if (state.caseContext) {
      prompt += `\n\nCASE KNOWLEDGE BASE (from actual judgment):\n${state.caseContext}`;
    }
    if (roundContext) {
      prompt += `\n\nRELEVANT CONTEXT FOR THIS ROUND:\n${roundContext}`;
    }

    return prompt;
  }, [state.selectedCase, state.selectedSide, state.currentRound, state.totalRounds, state.caseContext, aiSide, roundContext]);

  // ─── Vapi callbacks ────────────────────────────────────────────────────────

  // Assistant transcript chunks → accumulate into one live bubble
  // Vapi fires this multiple times per response (one per sentence/chunk)
  const handleAssistantTranscript = useCallback((transcript) => {
    if (!transcript?.trim()) return;
    // Append chunk with a space separator
    const updated = liveTranscriptRef.current
      ? liveTranscriptRef.current + ' ' + transcript.trim()
      : transcript.trim();
    liveTranscriptRef.current = updated;
    setLiveTranscript(updated);
  }, []);

  // User voice transcript → submit as argument, score it
  const handleUserVoiceTranscript = useCallback(async (transcript) => {
    if (!transcript || transcript.trim().length < 10) return;
    setIsUserTurnActive(false);
    dispatch({ type: 'SUBMIT_ARGUMENT', payload: transcript });
    setShowScores(false);

    // Score after a delay to let Vapi respond first
    setTimeout(async () => {
      let userScore = scoreArgument(transcript, state.selectedCase, state.selectedSide, state.currentRound);
      const aiScoreAttempt = await scoreArgumentWithAI({
        userArgument: transcript,
        caseData: state.selectedCase,
        side: state.selectedSide,
        round: state.currentRound,
      });
      if (aiScoreAttempt) userScore = aiScoreAttempt;

      const aiScore = getAIScore(state.currentRound);
      const judgeComment = getJudgeComment(userScore, aiScore);

      dispatch({ type: 'SCORE_ROUND', payload: { userScore, aiScore, judgeComment } });
      setShowScores(true);
      setRoundComplete(true);
      // Ensure isAiTyping is cleared even if assistant transcript never fires
      dispatch({ type: 'AI_RESPOND', payload: '' });
    }, 4000);
  }, [dispatch, state.selectedCase, state.selectedSide, state.currentRound]);

  const vapi = useVapi({
    systemPrompt: buildSystemPrompt(),
    onUserTranscript: handleUserVoiceTranscript,
    onAssistantTranscript: handleAssistantTranscript,
    onCallStart: () => {
      setVoiceError('');
      setIsAiSpeaking(false);
      liveTranscriptRef.current = '';
      setLiveTranscript('');
    },
    onCallEnd: () => {
      setIsAiSpeaking(false);
      // Commit any remaining transcript
      const remaining = liveTranscriptRef.current.trim();
      if (remaining) {
        dispatch({ type: 'AI_RESPOND', payload: remaining });
        liveTranscriptRef.current = '';
        setLiveTranscript('');
      }
    },
    onError: (err) => {
      setVoiceError(err?.message || 'Voice connection failed.');
      setIsAiSpeaking(false);
    },
  });

  // ─── Mute/unmute user mic based on who is speaking ────────────────────────
  // When AI volume goes above threshold → mute user mic
  // ─── Mute/unmute user mic based on who is speaking ────────────────────────
  // Uses isMutedByAiRef so we only call toggleMute() once per transition,
  // not on every volume-level event. The 1.5s debounce in useVapi ensures
  // isAssistantSpeaking only flips after sustained silence — no stutter.
  useEffect(() => {
    if (!vapi.isCallActive) {
      isMutedByAiRef.current = false;
      return;
    }

    if (vapi.isAssistantSpeaking && !isMutedByAiRef.current) {
      isMutedByAiRef.current = true;
      setIsAiSpeaking(true);
      vapi.toggleMute(); // mute user while AI speaks
    } else if (!vapi.isAssistantSpeaking && isMutedByAiRef.current) {
      isMutedByAiRef.current = false;
      setIsAiSpeaking(false);
      vapi.toggleMute(); // unmute user when AI finishes

      // Commit the accumulated live transcript to the chat as one bubble
      const fullTranscript = liveTranscriptRef.current.trim();
      if (fullTranscript) {
        dispatch({ type: 'AI_RESPOND', payload: fullTranscript });
        liveTranscriptRef.current = '';
        setLiveTranscript('');
      }
    }
  }, [vapi.isAssistantSpeaking, vapi.isCallActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Prime Vapi with case context once call is active ─────────────────────
  useEffect(() => {
    if (!isVoiceMode || !vapi.isCallActive || hasPrimedVoice) return;
    if (!state.selectedCase) return;

    const userParty = state.selectedCase[state.selectedSide];
    const aiParty = state.selectedCase[aiSide];
    const primer =
      `CASE CONTEXT: You are ${aiParty.name} (${aiSide}) in ${state.selectedCase.shortName}. ` +
      `The user is ${userParty.name} (${state.selectedSide}). ` +
      `Respond only in formal Indian courtroom style. Do not ask for context.` +
      (state.caseContext ? `\n\nCase knowledge:\n${state.caseContext}` : '');

    vapi.sendMessage(primer);
    setHasPrimedVoice(true);
  }, [isVoiceMode, vapi.isCallActive, hasPrimedVoice, state.selectedCase, state.selectedSide, aiSide, state.caseContext, vapi]);

  useEffect(() => {
    if (!vapi.isCallActive) setHasPrimedVoice(false);
  }, [vapi.isCallActive]);

  // ─── Text mode: real NIM AI response ──────────────────────────────────────
  const getAIResponseText = useCallback(async (userArgument) => {
    if (qdrantReady) {
      try {
        const { formatted } = await searchRelevantContext({
          queryText: userArgument,
          caseId: state.selectedCase.id,
          aiSide,
          limit: 5,
        });
        if (formatted) setRoundContext(formatted);
      } catch (err) {
        console.warn('[CourtRoom] Qdrant round context failed:', err.message);
      }
    }

    const history = state.arguments.map((a) => ({ side: a.side, text: a.text }));

    try {
      return await generateAIArgument({
        userArgument,
        caseData: state.selectedCase,
        aiSide,
        currentRound: state.currentRound,
        totalRounds: state.totalRounds,
        difficulty: state.difficulty || 'medium',
        caseContext: state.caseContext || roundContext,
        conversationHistory: history,
      });
    } catch (err) {
      console.error('[CourtRoom] NIM failed, falling back to mock:', err.message);
      return getAIResponse(state.selectedCase.id, state.currentRound, aiSide);
    }
  }, [state.selectedCase, state.currentRound, state.totalRounds, state.caseContext, state.arguments, aiSide, qdrantReady, roundContext]);

  // ─── Submit argument (text mode) ──────────────────────────────────────────
  const handleSubmitArgument = useCallback(async (text) => {
    setIsUserTurnActive(false);
    dispatch({ type: 'SUBMIT_ARGUMENT', payload: text });
    setShowScores(false);

    const [aiResponse, aiScoreAttempt] = await Promise.all([
      getAIResponseText(text),
      scoreArgumentWithAI({
        userArgument: text,
        caseData: state.selectedCase,
        side: state.selectedSide,
        round: state.currentRound,
      }),
    ]);

    dispatch({ type: 'AI_RESPOND', payload: aiResponse });

    const userScore = aiScoreAttempt || scoreArgument(text, state.selectedCase, state.selectedSide, state.currentRound);
    const aiScore = getAIScore(state.currentRound);
    const judgeComment = getJudgeComment(userScore, aiScore);

    dispatch({ type: 'SCORE_ROUND', payload: { userScore, aiScore, judgeComment } });
    setShowScores(true);
    setRoundComplete(true);
  }, [dispatch, state.selectedCase, state.selectedSide, state.currentRound, getAIResponseText]);

  // ─── Next round / end game — immediate, no delay ──────────────────────────
  const handleNextRound = useCallback(() => {
    if (state.currentRound >= state.totalRounds) {
      // End game
      if (vapi.isCallActive) vapi.stopCall();

      const userTotal = state.roundScores.reduce(
        (sum, r) => sum + Object.values(r.userScore).reduce((a, b) => a + b, 0), 0
      );
      const aiTotal = state.roundScores.reduce(
        (sum, r) => sum + Object.values(r.aiScore).reduce((a, b) => a + b, 0), 0
      );

      dispatch({
        type: 'END_GAME',
        payload: {
          winner: userTotal >= aiTotal ? 'user' : 'ai',
          userTotal,
          aiTotal,
          margin: Math.abs(userTotal - aiTotal),
        },
      });
    } else {
      // Immediately advance — reset all round state synchronously
      setShowScores(false);
      setRoundComplete(false);
      setRoundContext('');
      setIsUserTurnActive(true);
      setIsAiSpeaking(false);
      liveTranscriptRef.current = '';
      setLiveTranscript('');
      setTurnTimerKey((k) => k + 1);
      dispatch({ type: 'NEXT_ROUND' });
    }
  }, [dispatch, state.currentRound, state.totalRounds, state.roundScores, vapi]);

  const handleTimerEnd = useCallback(() => {
    if (isUserTurnActive && !state.isAiTyping && !roundComplete) {
      handleSubmitArgument("The counsel requests the Court's indulgence. [Time expired]");
    }
  }, [isUserTurnActive, state.isAiTyping, roundComplete, handleSubmitArgument]);

  const handleToggleVoiceMode = useCallback(() => {
    if (isVoiceMode && vapi.isCallActive) vapi.stopCall();
    setIsVoiceMode((v) => !v);
    setVoiceError('');
  }, [isVoiceMode, vapi]);

  const canStartVoice = !state.isLoadingContext && (!qdrantReady || hasContextAttempted);

  const handleStartVoice = useCallback(() => {
    if (!canStartVoice) return;
    setVoiceError('');
    vapi.startCall();
  }, [vapi, canStartVoice]);

  // Mic is disabled when AI is speaking or round is complete or input is disabled
  const isInputDisabled = state.isAiTyping || roundComplete;
  const isMicDisabled   = isInputDisabled || isAiSpeaking || vapi.isAssistantSpeaking;
  const displayVoiceError = vapi.lastError || voiceError;

  return (
    <div className="courtroom" id="courtroom-arena">
      {/* Loading overlay */}
      {state.isLoadingContext && (
        <div className="courtroom__context-loading" id="context-loading-indicator">
          <div className="courtroom__context-loading-inner">
            <div className="courtroom__context-spinner" />
            <span>Retrieving case knowledge...</span>
          </div>
        </div>
      )}

      {/* Qdrant badge */}
      {qdrantReady && (
        <div className="courtroom__qdrant-badge" title="Connected to case knowledge base">
          <span className="courtroom__qdrant-dot" />
          <span>Live Knowledge</span>
        </div>
      )}

      <TopBar
        caseName={state.selectedCase?.shortName}
        courtBadge={state.selectedCase?.courtBadge}
        currentRound={state.currentRound}
        totalRounds={state.totalRounds}
        timer={state.timer || 120}
        onTimerEnd={handleTimerEnd}
        isTimerRunning={isUserTurnActive && !roundComplete}
        timerKey={turnTimerKey}
        timerLabel={isUserTurnActive ? 'Your Turn Time' : 'Turn Complete'}
      />

      <section className="courtroom__scene">
        <aside className="courtroom__side-panel">
          <JudgeBench roundScores={state.roundScores} isVisible={showScores} />

          {/* Waveform — show whenever call is active, not just in voice mode */}
          {vapi.isCallActive && (
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
                  <><span>Hear the Verdict</span><span className="courtroom__next-icon">⚖</span></>
                ) : (
                  <><span>Round {state.currentRound + 1}</span><span className="courtroom__next-icon">→</span></>
                )}
              </button>
            </div>
          )}
        </aside>

        <div className="courtroom__main-panel">
          <ChatArea
            arguments={state.arguments}
            isAiTyping={state.isAiTyping}
            isAiSpeaking={isAiSpeaking}
            liveTranscript={liveTranscript}
            currentRound={state.currentRound}
          />

          <ArgumentInput
            onSubmit={handleSubmitArgument}
            disabled={isInputDisabled}
            micDisabled={isMicDisabled}
            currentRound={state.currentRound}
            totalRounds={state.totalRounds}
            selectedSide={state.selectedSide}
            voiceEnabled={vapi.isAvailable}
            isVoiceMode={isVoiceMode}
            onToggleVoiceMode={handleToggleVoiceMode}
            isCallActive={vapi.isCallActive}
            isMuted={vapi.isMuted}
            isUserSpeaking={vapi.isUserSpeaking}
            isAiSpeaking={isAiSpeaking || vapi.isAssistantSpeaking}
            connectionStatus={vapi.connectionStatus}
            onStartVoice={handleStartVoice}
            onStopVoice={vapi.stopCall}
            onToggleMute={vapi.toggleMute}
            canStartVoice={canStartVoice}
            voiceError={displayVoiceError}
          />
        </div>
      </section>
    </div>
  );
}
