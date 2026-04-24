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
import TurnBanner from './TurnBanner';
import NotificationToast from './NotificationToast';
import './CourtroomArena.css';

export default function CourtroomArena() {
  const state = useGame();
  const dispatch = useGameDispatch();

  const [showScores, setShowScores] = useState(false);
  const [roundComplete, setRoundComplete] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(true);
  const [isUserTurnActive, setIsUserTurnActive] = useState(true);
  const [turnTimerKey, setTurnTimerKey] = useState(0);
  const [voiceError, setVoiceError] = useState('');
  // Objection system — max 2 uses per game, fires a NIM rebuttal prompt
  const [objectionCount, setObjectionCount] = useState(0);
  const [isObjecting, setIsObjecting] = useState(false);
  const MAX_OBJECTIONS = 2;

  // Notification system
  const [notifications, setNotifications] = useState([]);

  // Qdrant
  const [qdrantReady, setQdrantReady] = useState(false);
  const [roundContext, setRoundContext] = useState('');
  const [hasContextAttempted, setHasContextAttempted] = useState(false);

  // Voice priming
  const [hasPrimedVoice, setHasPrimedVoice] = useState(false);

  // Live transcript accumulator — chunks from Vapi build into one bubble
  const [liveTranscript, setLiveTranscript] = useState('');
  const liveTranscriptRef = useRef('');

  // User speech accumulator — chunks build into one full argument per round
  const [liveUserTranscript, setLiveUserTranscript] = useState('');
  const userTranscriptRef = useRef('');

  // Track whether AI is currently speaking so we can mute the user mic
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  // Ref to track mute state without triggering re-renders in the effect
  const isMutedByAiRef = useRef(false);

  const aiSide = state.selectedSide === 'petitioner' ? 'respondent' : 'petitioner';

  // ─── Notification system functions ─────────────────────────────────────────
  const addNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, duration };
    setNotifications(prev => [...prev, notification]);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

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

          // Add notification for successful context loading
          addNotification(
            "Case knowledge base loaded successfully. Enhanced AI responses are now available.",
            'success',
            4000
          );
        }
      } catch (err) {
        console.error('[CourtRoom] Qdrant setup failed:', err.message);
        setQdrantReady(false);

        // Add notification for context loading failure
        addNotification(
          "Case knowledge base unavailable. Using standard AI responses.",
          'warning',
          4000
        );
      } finally {
        dispatch({ type: 'SET_LOADING_CONTEXT', payload: false });
        setHasContextAttempted(true);
      }
    })();
  }, [state.selectedCase?.id, dispatch, addNotification]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Add notification when game starts (first round) ──────────────────────
  useEffect(() => {
    if (state.currentRound === 1 && isUserTurnActive && state.arguments.length === 0) {
      // This is the start of the first round
      const timeoutId = setTimeout(() => {
        addNotification(
          `Case proceedings begin! Round 1 of ${state.totalRounds}. Present your opening argument.`,
          'round',
          5000
        );
      }, 1000); // Delay to let other initialization complete

      return () => clearTimeout(timeoutId);
    }
  }, [state.currentRound, isUserTurnActive, state.arguments.length, state.totalRounds, addNotification]);

  // ─── Add notification when user turn becomes active ──────────────────────
  useEffect(() => {
    if (isUserTurnActive && !roundComplete && state.currentRound > 0) {
      // Only show this notification if we're in an active round (not initial state)
      const timeoutId = setTimeout(() => {
        addNotification(
          `Your turn is active for Round ${state.currentRound}. Present your argument before time runs out.`,
          'info',
          4000
        );
      }, 500); // Small delay to avoid showing during rapid state changes

      return () => clearTimeout(timeoutId);
    }
  }, [isUserTurnActive, roundComplete, state.currentRound, addNotification]);

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
      `- CRITICAL: Respond in 2-3 sentences MAXIMUM. Never more. Stop after the third sentence.\n` +
      `- Be formal and precise\n` +
      `- Directly counter the opponent's point in one sentence\n` +
      `- Do NOT use bullet points — flowing prose only\n` +
      `- Do NOT break character\n` +
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

  // User voice transcript chunk → accumulate into one argument bubble
  // Scoring + submission happens only once at round end (processAndSubmitUserTranscript)
  const handleUserVoiceTranscript = useCallback((transcript) => {
    if (!transcript) return;
    const chunk = String(transcript).trim();   // always a string
    if (!chunk) return;
    const updated = userTranscriptRef.current
      ? userTranscriptRef.current + ' ' + chunk
      : chunk;
    userTranscriptRef.current = updated;
    setLiveUserTranscript(updated);
  }, []);

  // Flush accumulated user transcript → submit + score once per round
  const processAndSubmitUserTranscript = useCallback(async () => {
    const raw = userTranscriptRef.current;
    const fullTranscript = typeof raw === 'string' ? raw.trim() : String(raw ?? '').trim();
    userTranscriptRef.current = '';
    setLiveUserTranscript('');

    if (!fullTranscript || fullTranscript.length < 10) return;

    setIsUserTurnActive(false);
    addNotification(
      "Voice argument submitted. Awaiting opposing counsel's response...",
      'info',
      3000
    );

    dispatch({ type: 'SUBMIT_ARGUMENT', payload: fullTranscript });
    setShowScores(false);

    // Score after a short delay to let AI respond first
    setTimeout(async () => {
      let userScore = scoreArgument(fullTranscript, state.selectedCase, state.selectedSide, state.currentRound);
      const aiScoreAttempt = await scoreArgumentWithAI({
        userArgument: fullTranscript,
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

      addNotification(
        "Round Complete! Both parties have presented their arguments. You can now proceed to the next round.",
        'round',
        5000
      );

      // Ensure isAiTyping is cleared even if assistant transcript never fires
      dispatch({ type: 'AI_RESPOND', payload: '' });
    }, 4000);
  }, [dispatch, state.selectedCase, state.selectedSide, state.currentRound, addNotification]);

  const vapi = useVapi({
    systemPrompt: buildSystemPrompt(),
    onUserTranscript: handleUserVoiceTranscript,
    onAssistantTranscript: handleAssistantTranscript,
    onCallStart: () => {
      setVoiceError('');
      setIsAiSpeaking(false);
      liveTranscriptRef.current = '';
      setLiveTranscript('');
      userTranscriptRef.current = '';
      setLiveUserTranscript('');
      addNotification(
        "Voice session started successfully. You can now speak your arguments.",
        'voice',
        3000
      );
    },
    onCallEnd: () => {
      setIsAiSpeaking(false);
      // Flush any remaining user speech as a complete submission
      processAndSubmitUserTranscript();
      // Commit any remaining AI transcript
      const remaining = liveTranscriptRef.current.trim();
      if (remaining) {
        dispatch({ type: 'AI_RESPOND', payload: remaining });
        liveTranscriptRef.current = '';
        setLiveTranscript('');
      }
      addNotification(
        "Voice session ended. You can start a new session or switch to text mode.",
        'voice',
        3000
      );
    },
    onError: (err) => {
      const errorMessage = err?.message || 'Voice connection failed.';
      setVoiceError(errorMessage);
      setIsAiSpeaking(false);
      addNotification(
        `Voice Error: ${errorMessage}. Check microphone permissions and try again, or switch to text mode.`,
        'error',
        8000
      );
    },
  });

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
      // Add notification when mic gets muted
      addNotification(
        "Your microphone is temporarily muted while opposing counsel speaks.",
        'voice',
        2000
      );
    } else if (!vapi.isAssistantSpeaking && isMutedByAiRef.current) {
      isMutedByAiRef.current = false;
      setIsAiSpeaking(false);
      vapi.toggleMute(); // unmute user when AI finishes
      // Add notification when mic gets unmuted
      addNotification(
        "Your microphone is now active. You can speak your response.",
        'voice',
        2000
      );

      // Commit the accumulated live transcript to the chat as one bubble
      const fullTranscript = liveTranscriptRef.current.trim();
      if (fullTranscript) {
        dispatch({ type: 'AI_RESPOND', payload: fullTranscript });
        liveTranscriptRef.current = '';
        setLiveTranscript('');
      }
    }
  }, [vapi.isAssistantSpeaking, vapi.isCallActive, addNotification]); // eslint-disable-line react-hooks/exhaustive-deps

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

    // Add notification for input being disabled after text submission
    addNotification(
      "Text argument submitted. Awaiting opposing counsel's response...",
      'info',
      3000
    );

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

    // Ensure aiResponse is always a string — never let an object reach the reducer
    const aiText = typeof aiResponse === 'string' ? aiResponse : String(aiResponse ?? '');

    // Item 2 — 500ms "thinking" pause before AI response appears
    await new Promise(r => setTimeout(r, 500));
    dispatch({ type: 'AI_RESPOND', payload: aiText });

    const userScore = aiScoreAttempt || scoreArgument(text, state.selectedCase, state.selectedSide, state.currentRound);
    const aiScore = getAIScore(state.currentRound);
    const judgeComment = getJudgeComment(userScore, aiScore);

    // Item 3 — 800ms deliberation delay before Judge reveals scores
    await new Promise(r => setTimeout(r, 800));
    dispatch({ type: 'SCORE_ROUND', payload: { userScore, aiScore, judgeComment } });
    setShowScores(true);
    setRoundComplete(true);

    addNotification(
      "Round Complete! Both parties have presented their arguments. You can now proceed to the next round.",
      'round',
      5000
    );
  }, [dispatch, state.selectedCase, state.selectedSide, state.currentRound, getAIResponseText, addNotification]);

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

      // Add notification for game ending
      addNotification(
        "Case concluded! Proceeding to verdict based on all arguments presented.",
        'round',
        4000
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
      userTranscriptRef.current = '';
      setLiveUserTranscript('');
      setTurnTimerKey((k) => k + 1);
      dispatch({ type: 'NEXT_ROUND' });

      // Add notification for round advancement
      addNotification(
        `Round ${state.currentRound + 1} begins! Present your next argument within the time limit.`,
        'round',
        4000
      );

      // Add notification for input being re-enabled
      addNotification(
        "Your turn is now active. You can submit arguments in voice or text mode.",
        'info',
        3000
      );
    }
  }, [dispatch, state.currentRound, state.totalRounds, state.roundScores, vapi, addNotification]);

  // ─── End Case early — verdict from scores so far ──────────────────────────
  const handleEndCase = useCallback(() => {
    if (vapi.isCallActive) vapi.stopCall();

    // Use whatever round scores exist; if none, use 0s
    const scores = state.roundScores.length > 0 ? state.roundScores : [];
    const userTotal = scores.reduce(
      (sum, r) => sum + Object.values(r.userScore).reduce((a, b) => a + b, 0), 0
    );
    const aiTotal = scores.reduce(
      (sum, r) => sum + Object.values(r.aiScore).reduce((a, b) => a + b, 0), 0
    );

    dispatch({
      type: 'END_GAME',
      payload: {
        winner: userTotal >= aiTotal ? 'user' : 'ai',
        userTotal,
        aiTotal,
        margin: Math.abs(userTotal - aiTotal),
        earlyVerdict: true,
      },
    });
  }, [dispatch, state.roundScores, vapi]);

  // ─── Timer end: lock input, stop mic, show next-round prompt ────────────────
  const handleTimerEnd = useCallback(() => {
    if (!isUserTurnActive || roundComplete) return;

    // Add prominent "Time's Up!" notification
    addNotification(
      "Time's Up! The round has ended due to timeout. You can now proceed to the next round or end the case.",
      'timer',
      6000 // Show for 6 seconds to ensure user sees it
    );

    // Stop voice call immediately so user can't keep speaking
    if (vapi.isCallActive) vapi.stopCall();
    // Lock the turn — no fake message submitted
    setIsUserTurnActive(false);
    setRoundComplete(true);
    // Both sides score zero — nothing was argued this round
    const userScore = { legalReasoning: 0, useOfPrecedent: 0, persuasiveness: 0, constitutionalValidity: 0 };
    const aiScore = { legalReasoning: 0, useOfPrecedent: 0, persuasiveness: 0, constitutionalValidity: 0 };
    const judgeComment = 'The counsel did not present arguments within the allotted time.';
    dispatch({ type: 'SCORE_ROUND', payload: { userScore, aiScore, judgeComment } });
    setShowScores(true);
  }, [isUserTurnActive, roundComplete, state.currentRound, dispatch, vapi, addNotification]);

  const handleToggleVoiceMode = useCallback(() => {
    if (isVoiceMode && vapi.isCallActive) vapi.stopCall();
    setIsVoiceMode((v) => !v);
    setVoiceError('');

    // Add notification for mode switching
    addNotification(
      isVoiceMode
        ? "Switched to text mode. Type your arguments in the text area below."
        : "Switched to voice mode. Press the microphone button to begin speaking.",
      'info',
      3000
    );
  }, [isVoiceMode, vapi, addNotification]);

  const canStartVoice = !state.isLoadingContext && (!qdrantReady || hasContextAttempted);

  const handleStartVoice = useCallback(() => {
    if (!canStartVoice) return;
    setVoiceError('');
    vapi.startCall();
  }, [vapi, canStartVoice]);

  // ─── Objection — pure NIM call, no Vapi involvement ────────────────────────
  const handleObjection = useCallback(async () => {
    if (objectionCount >= MAX_OBJECTIONS || isObjecting) return;
    // Find the last AI argument in this round
    const lastAiArg = [...state.arguments].reverse().find(a => a.side === 'ai');
    if (!lastAiArg) return;

    setIsObjecting(true);
    setObjectionCount(c => c + 1);
    addNotification('OBJECTION filed! Opposing counsel must justify their argument.', 'round', 4000);

    const objectionPrompt =
      `[OBJECTION] The user challenges your last statement: "${lastAiArg.text.slice(0, 300)}…". ` +
      `You must directly justify and defend this argument with specific legal authority. Keep your response under 120 words.`;

    try {
      const rebuttal = await generateAIArgument({
        userArgument: objectionPrompt,
        caseData: state.selectedCase,
        aiSide,
        currentRound: state.currentRound,
        totalRounds: state.totalRounds,
        difficulty: state.difficulty || 'medium',
        caseContext: state.caseContext || '',
        conversationHistory: state.arguments.map(a => ({ side: a.side, text: a.text })),
      });
      const rebuttalText = typeof rebuttal === 'string' ? rebuttal : String(rebuttal ?? '');
      if (rebuttalText) dispatch({ type: 'AI_RESPOND', payload: `[Objection Rebuttal] ${rebuttalText}` });
    } catch (err) {
      console.error('[Objection] NIM rebuttal failed:', err.message);
    } finally {
      setIsObjecting(false);
    }
  }, [objectionCount, isObjecting, state.arguments, state.selectedCase, state.selectedSide, state.currentRound, state.totalRounds, state.caseContext, aiSide, dispatch, addNotification]);

  // Mic is disabled when AI is speaking or round is complete or input is disabled
  const isInputDisabled = state.isAiTyping || roundComplete;
  const isMicDisabled = isInputDisabled || isAiSpeaking || vapi.isAssistantSpeaking;
  const displayVoiceError = vapi.lastError || voiceError;

  // Next round button shows when round is complete
  // (either both spoke, or timer expired and locked the round)
  const currentRoundArgs = state.arguments.filter(a => a.round === state.currentRound);
  const userHasSpoken = currentRoundArgs.some(a => a.side === 'user');
  const aiHasSpoken = currentRoundArgs.some(a => a.side === 'ai');
  const canAdvanceRound = roundComplete && (userHasSpoken && aiHasSpoken || !isUserTurnActive);

  // Determine round completion reason for button labeling
  const roundCompletionReason = !isUserTurnActive && !userHasSpoken ? 'timeout' : 'both-spoke';

  return (
    <div className="courtroom" id="courtroom-arena">
      {/* Turn banner — slides in at start of each user turn */}
      <TurnBanner
        side={state.selectedSide}
        round={state.currentRound}
        totalRounds={state.totalRounds}
        active={isUserTurnActive && !roundComplete}
      />

      {/* Loading overlay */}
      {state.isLoadingContext && (
        <div className="courtroom__context-loading" id="context-loading-indicator">
          <div className="courtroom__context-loading-inner">
            <div className="courtroom__context-spinner" />
            <span>Retrieving case knowledge...</span>
          </div>
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
        timerLabel={
          roundComplete && !isUserTurnActive
            ? "Time's Up"
            : isUserTurnActive
              ? 'Your Turn'
              : 'Turn Complete'
        }
        onEndCase={handleEndCase}
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

          {/* Objection button — NIM only, no Vapi involvement */}
          {!roundComplete && state.arguments.some(a => a.side === 'ai') && (
            <div className="courtroom__objection-area">
              <button
                className={`courtroom__objection-btn ${isObjecting ? 'courtroom__objection-btn--loading' : ''}`}
                onClick={handleObjection}
                disabled={objectionCount >= MAX_OBJECTIONS || isObjecting}
                id="objection-btn"
                title={objectionCount >= MAX_OBJECTIONS ? 'No objections remaining' : 'Challenge the opposing counsel\'s last argument'}
              >
                <span className="courtroom__objection-label">OBJECTION</span>
                <span className="courtroom__objection-meta">
                  {isObjecting ? 'Filing…' : `${MAX_OBJECTIONS - objectionCount} remaining`}
                </span>
              </button>
            </div>
          )}

          {canAdvanceRound && (
            <div className="courtroom__round-action">
              <button
                className="courtroom__next-btn"
                onClick={handleNextRound}
                id="next-round-btn"
              >
                {state.currentRound >= state.totalRounds ? (
                  <><span>Hear the Verdict</span><span className="courtroom__next-icon">⚖</span></>
                ) : (
                  <><span>Next Round {state.currentRound + 1}</span><span className="courtroom__next-icon">→</span></>
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
            liveUserTranscript={liveUserTranscript}
            currentRound={state.currentRound}
            caseName={state.selectedCase?.shortName}
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

      {/* Notification system */}
      {notifications.length > 0 && (
        <div className="courtroom__notifications" id="notification-container">
          {notifications.map(notification => (
            <NotificationToast
              key={notification.id}
              notification={notification}
              onRemove={removeNotification}
            />
          ))}
        </div>
      )}
    </div>
  );
}
