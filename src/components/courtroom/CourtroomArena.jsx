import { useState, useCallback, useRef, useEffect } from 'react';
import { useGame, useGameDispatch } from '../../context/GameContext';
import { scoreArgument, getAIScore, getJudgeComment, getAIResponse } from '../../data/mockAI';
import { generateAIArgument, scoreArgumentWithAI, checkNIMConnectivity } from '../../services/nimService';
import { analyzeTone } from '../../services/tonalService';
import { isQdrantConfigured, checkCollectionHealth, searchRelevantContext, getCaseOverview } from '../../services/qdrantService';
import useVapi from '../../hooks/useVapi';
import TopBar from './TopBar';
import JudgeBench from './JudgeBench';
import ChatArea from './ChatArea';
import VoiceWaveform from './VoiceWaveform';
import ArgumentInput from './ArgumentInput';
import TurnBanner from './TurnBanner';
import ToneChip from './ToneChip';
import NotificationToast from './NotificationToast';
import './CourtroomArena.css';

export default function CourtroomArena() {
  const state = useGame();
  const dispatch = useGameDispatch();

  const [showScores, setShowScores] = useState(false);
  const [roundComplete, setRoundComplete] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isUserTurnActive, setIsUserTurnActive] = useState(true);
  const [voiceError, setVoiceError] = useState('');

  const [notifications, setNotifications] = useState([]);

  const [qdrantReady, setQdrantReady] = useState(false);
  const [roundContext, setRoundContext] = useState('');
  const [hasContextAttempted, setHasContextAttempted] = useState(false);

  const [liveUserTranscript, setLiveUserTranscript] = useState('');
  const [liveAssistantTranscript, setLiveAssistantTranscript] = useState('');
  const userTranscriptRef = useRef('');
  const userPartialTranscriptRef = useRef('');
  const assistantTranscriptRef = useRef('');
  const assistantPartialTranscriptRef = useRef('');

  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const isMutedByAiRef = useRef(false);
  const notificationTimeoutsRef = useRef(new Set());
  const hasShownOpeningNotificationRef = useRef(false);
  const announcedTurnRoundRef = useRef(null);
  const hasSubmittedRoundRef = useRef(false);
  const voiceStopReasonRef = useRef(null);
  const primedVoiceRoundRef = useRef(null);

  const aiSide = state.selectedSide === 'petitioner' ? 'respondent' : 'petitioner';

  const mergeTranscript = useCallback((committed, incoming) => {
    const base = String(committed ?? '').trim();
    const next = String(incoming ?? '').trim();

    if (!next) return base;
    if (!base) return next;
    if (next === base || base.endsWith(next)) return base;
    if (next.startsWith(base)) return next;
    return `${base} ${next}`.replace(/\s+/g, ' ').trim();
  }, []);

  const composeTranscript = useCallback((committed, partial) => {
    const base = String(committed ?? '').trim();
    const draft = String(partial ?? '').trim();

    if (!draft) return base;
    if (!base) return draft;
    if (draft === base || base.endsWith(draft)) return base;
    if (draft.startsWith(base)) return draft;
    return `${base} ${draft}`.replace(/\s+/g, ' ').trim();
  }, []);

  const addNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, duration };
    setNotifications((prev) => [...prev, notification]);

    if (duration > 0) {
      const timeoutId = setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        notificationTimeoutsRef.current.delete(timeoutId);
      }, duration);
      notificationTimeoutsRef.current.add(timeoutId);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  useEffect(() => () => {
    notificationTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    notificationTimeoutsRef.current.clear();
  }, []);

  useEffect(() => {
    hasSubmittedRoundRef.current = false;
    voiceStopReasonRef.current = null;
    announcedTurnRoundRef.current = null;
  }, [state.currentRound]);

  const currentRoundArgs = state.arguments.filter((argument) => argument.round === state.currentRound);
  const currentRoundUserArg = [...currentRoundArgs].reverse().find((argument) => argument.side === 'user');
  const currentRoundAiArg = [...currentRoundArgs].reverse().find((argument) => argument.side === 'ai');

  useEffect(() => {
    checkNIMConnectivity();

    if (!state.selectedCase) return;

    let isCancelled = false;

    setHasContextAttempted(false);
    setRoundContext('');

    if (!isQdrantConfigured()) {
      setQdrantReady(false);
      setHasContextAttempted(true);
      return undefined;
    }

    (async () => {
      dispatch({ type: 'SET_LOADING_CONTEXT', payload: true });
      try {
        const health = await checkCollectionHealth();
        if (isCancelled) return;

        if (!health.exists || health.pointCount === 0) {
          console.warn('[CourtRoom] Qdrant collection empty or missing — skipping RAG.');
          setQdrantReady(false);
          return;
        }

        setQdrantReady(true);
        const overview = await getCaseOverview(state.selectedCase.id);
        if (isCancelled) return;

        if (overview.formatted) {
          dispatch({ type: 'SET_CASE_CONTEXT', payload: overview.formatted });
          console.log(`[CourtRoom] Qdrant context loaded (${health.pointCount} points).`);
          addNotification(
            'Case knowledge base loaded successfully. Enhanced AI responses are now available.',
            'success',
            4000
          );
        }
      } catch (err) {
        if (isCancelled) return;
        console.error('[CourtRoom] Qdrant setup failed:', err.message);
        setQdrantReady(false);
        addNotification(
          'Case knowledge base unavailable. Using standard AI responses.',
          'warning',
          4000
        );
      } finally {
        if (!isCancelled) {
          dispatch({ type: 'SET_LOADING_CONTEXT', payload: false });
          setHasContextAttempted(true);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [state.selectedCase?.id, dispatch, addNotification]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (
      state.currentRound === 1 &&
      isUserTurnActive &&
      state.arguments.length === 0 &&
      !hasShownOpeningNotificationRef.current
    ) {
      hasShownOpeningNotificationRef.current = true;
      announcedTurnRoundRef.current = 1;

      const timeoutId = setTimeout(() => {
        addNotification(
          state.totalRounds === 1
            ? 'Case proceedings begin. Present your opening argument.'
            : `Case proceedings begin! Round 1 of ${state.totalRounds}. Present your opening argument.`,
          'round',
          5000
        );
      }, 1000);

      return () => clearTimeout(timeoutId);
    }

    return undefined;
  }, [state.currentRound, isUserTurnActive, state.arguments.length, state.totalRounds, addNotification]);

  useEffect(() => {
    if (
      isUserTurnActive &&
      !roundComplete &&
      state.currentRound > 0 &&
      state.arguments.length > 0 &&
      announcedTurnRoundRef.current !== state.currentRound
    ) {
      announcedTurnRoundRef.current = state.currentRound;
      const timeoutId = setTimeout(() => {
        addNotification(
          `Your turn is active for Round ${state.currentRound}. Present your argument.`,
          'info',
          4000
        );
      }, 500);

      return () => clearTimeout(timeoutId);
    }

    return undefined;
  }, [isUserTurnActive, roundComplete, state.currentRound, state.arguments.length, addNotification]);

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
      (state.totalRounds === 1
        ? '- This is the only round in the case. Deliver one concise argument.'
        : `- This is Round ${state.currentRound} of ${state.totalRounds}`);

    if (state.caseContext) {
      prompt += `\n\nCASE KNOWLEDGE BASE (from actual judgment):\n${state.caseContext}`;
    }
    if (roundContext) {
      prompt += `\n\nRELEVANT CONTEXT FOR THIS ROUND:\n${roundContext}`;
    }

    const priorArgs = state.arguments.filter((a) => a.round < state.currentRound);
    if (priorArgs.length > 0) {
      const history = priorArgs.map((a) =>
        `Round ${a.round} — ${a.side === 'user' ? 'Opposing Counsel' : 'You'}: ${a.text}`
      ).join('\n');
      prompt += `\n\nPREVIOUS ROUNDS (do NOT repeat these — build upon them):\n${history}`;
    }

    return prompt;
  }, [state.selectedCase, state.selectedSide, state.currentRound, state.totalRounds, state.caseContext, state.arguments, aiSide, roundContext]);

  const buildVoiceRoundInstruction = useCallback(() => {
    if (!state.selectedCase) return '';

    const aiParty = state.selectedCase[aiSide];
    const userParty = state.selectedCase[state.selectedSide];
    const priorArgs = state.arguments.filter((argument) => argument.round < state.currentRound);
    const history = priorArgs.length > 0
      ? priorArgs.map((argument) =>
        `Round ${argument.round} — ${argument.side === 'user' ? userParty.name : aiParty.name}: ${argument.text}`
      ).join('\n')
      : 'No previous rounds yet.';

    const roundDirective = state.currentRound === 1
      ? 'This is the opening round. After the user finishes speaking, immediately deliver your opening submission. Do not ask anyone to begin.'
      : `This is Round ${state.currentRound} of ${state.totalRounds}. Build on the previous rounds, rebut the user's latest position, and add one fresh point for your side. Do not restart from Round 1 or ask for opening statements.`;

    return [
      `ROUND SYNC`,
      `You are ${aiParty.name} for the ${aiSide}. The opposing counsel is ${userParty.name} for the ${state.selectedSide}.`,
      `Current round: ${state.currentRound} of ${state.totalRounds}.`,
      roundDirective,
      `Stay in character, address the bench formally, and respond in 2-3 sentences maximum.`,
      `Prior rounds:`,
      history,
      roundContext ? `Round-specific context:\n${roundContext}` : '',
    ].filter(Boolean).join('\n\n');
  }, [state.selectedCase, state.selectedSide, state.currentRound, state.totalRounds, state.arguments, aiSide, roundContext]);

  const handleAssistantTranscript = useCallback((transcript, message) => {
    if (!transcript) return;

    const chunk = String(transcript).trim();
    if (!chunk) return;

    const transcriptType = typeof message?.transcriptType === 'string'
      ? message.transcriptType.toLowerCase()
      : 'final';

    if (transcriptType === 'partial') {
      assistantPartialTranscriptRef.current = chunk;
      setLiveAssistantTranscript(
        composeTranscript(assistantTranscriptRef.current, assistantPartialTranscriptRef.current)
      );
      return;
    }

    assistantTranscriptRef.current = mergeTranscript(assistantTranscriptRef.current, chunk);
    assistantPartialTranscriptRef.current = '';
    setLiveAssistantTranscript(assistantTranscriptRef.current);
  }, [composeTranscript, mergeTranscript]);

  const handleUserVoiceTranscript = useCallback((transcript, message) => {
    if (!transcript) return;
    const chunk = String(transcript).trim();
    if (!chunk) return;

    const transcriptType = typeof message?.transcriptType === 'string'
      ? message.transcriptType.toLowerCase()
      : 'final';

    if (transcriptType === 'partial') {
      userPartialTranscriptRef.current = chunk;
      setLiveUserTranscript(
        composeTranscript(userTranscriptRef.current, userPartialTranscriptRef.current)
      );
      return;
    }

    userTranscriptRef.current = mergeTranscript(userTranscriptRef.current, chunk);
    userPartialTranscriptRef.current = '';
    setLiveUserTranscript(userTranscriptRef.current);
  }, [composeTranscript, mergeTranscript]);

  const getAIResponseText = useCallback(async (userArgument) => {
    const priorRoundUserArgument = [...state.arguments]
      .reverse()
      .find((argument) => argument.side === 'user' && argument.round === state.currentRound - 1)?.text;
    const responseMode = state.currentRound === 1 ? 'opening-statement' : 'delayed-rebuttal';
    const promptArgument = state.currentRound === 1
      ? `Deliver your opening submission for Round 1. Do not rebut the opponent's current-round statement. Opponent's latest statement for context only: ${userArgument}`
      : priorRoundUserArgument
        ? `Rebut this previous-round argument and advance one new point for your side: ${priorRoundUserArgument}`
        : `Advance one fresh argument for Round ${state.currentRound} without rebutting the opponent's current-round statement.`;

    if (qdrantReady) {
      try {
        const { formatted } = await searchRelevantContext({
          queryText: promptArgument,
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
        userArgument: promptArgument,
        caseData: state.selectedCase,
        aiSide,
        currentRound: state.currentRound,
        totalRounds: state.totalRounds,
        difficulty: state.difficulty || 'medium',
        caseContext: state.caseContext || roundContext,
        conversationHistory: history,
        responseMode,
      });
    } catch (err) {
      console.error('[CourtRoom] NIM failed, falling back to mock:', err.message);
      return getAIResponse(state.selectedCase.id, state.currentRound, aiSide);
    }
  }, [state.selectedCase, state.currentRound, state.totalRounds, state.caseContext, state.arguments, state.difficulty, aiSide, qdrantReady, roundContext]);

  const finalizeRoundScoring = useCallback(async (userText) => {
    let userScore = scoreArgument(userText, state.selectedCase, state.selectedSide, state.currentRound);
    const aiScoreAttempt = await scoreArgumentWithAI({
      userArgument: userText,
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
      state.totalRounds === 1
        ? 'Round result recorded. Press the verdict button to conclude the case.'
        : 'Round result recorded. Press next round when you are ready to continue.',
      'round',
      5000
    );
  }, [dispatch, state.selectedCase, state.selectedSide, state.currentRound, state.totalRounds, addNotification]);

  const commitVoiceRoundArguments = useCallback(() => {
    const committedUserText = currentRoundUserArg?.text?.trim() || userTranscriptRef.current.trim();
    const committedAiText = currentRoundAiArg?.text?.trim() || assistantTranscriptRef.current.trim();

    if (!currentRoundUserArg?.text && committedUserText) {
      hasSubmittedRoundRef.current = true;
      setIsUserTurnActive(false);
      dispatch({ type: 'SUBMIT_ARGUMENT', payload: committedUserText });
      analyzeTone({ text: committedUserText, side: state.selectedSide, round: state.currentRound })
        .then((result) => { if (result) dispatch({ type: 'SET_TONE_RESULT', payload: result }); });
      setShowScores(false);
    }

    if (!currentRoundAiArg?.text && committedAiText) {
      dispatch({ type: 'AI_RESPOND', payload: committedAiText });
    }

    return {
      userText: committedUserText,
      aiText: committedAiText,
    };
  }, [currentRoundAiArg?.text, currentRoundUserArg?.text, dispatch, state.selectedSide, state.currentRound]);

  const processAndSubmitUserTranscript = useCallback(async () => {
    if (hasSubmittedRoundRef.current || roundComplete) return '';

    const raw = userTranscriptRef.current;
    const fullTranscript = typeof raw === 'string' ? raw.trim() : String(raw ?? '').trim();
    userTranscriptRef.current = '';
    userPartialTranscriptRef.current = '';
    setLiveUserTranscript('');

    if (!fullTranscript || fullTranscript.length < 10) return '';

    hasSubmittedRoundRef.current = true;
    setIsUserTurnActive(false);
    addNotification(
      "Voice argument submitted. Awaiting opposing counsel's response...",
      'info',
      3000
    );

    dispatch({ type: 'SUBMIT_ARGUMENT', payload: fullTranscript });
    analyzeTone({ text: fullTranscript, side: state.selectedSide, round: state.currentRound })
      .then((result) => { if (result) dispatch({ type: 'SET_TONE_RESULT', payload: result }); });
    setShowScores(false);
    return fullTranscript;
  }, [dispatch, state.selectedSide, state.currentRound, addNotification, roundComplete]);

  const handleCallStart = useCallback(() => {
    setVoiceError('');
    setIsAiSpeaking(false);
    primedVoiceRoundRef.current = null;
    userTranscriptRef.current = '';
    userPartialTranscriptRef.current = '';
    assistantTranscriptRef.current = '';
    assistantPartialTranscriptRef.current = '';
    setLiveUserTranscript('');
    setLiveAssistantTranscript('');
  }, []);

  const handleCallEnd = useCallback(() => {
    const stopReason = voiceStopReasonRef.current;
    voiceStopReasonRef.current = null;

    setIsAiSpeaking(false);
    const committedAssistantTranscript = assistantTranscriptRef.current.trim();
    setLiveAssistantTranscript((current) => current.trim());

    if (stopReason === 'end-case' || stopReason === 'toggle-mode' || stopReason === 'finalize-round') {
      setLiveAssistantTranscript('');
      return;
    }

    if (stopReason === 'manual-stop' && !committedAssistantTranscript) {
      void processAndSubmitUserTranscript();
      return;
    }

    void (async () => {
      const userTranscript = await processAndSubmitUserTranscript();
      if (!userTranscript || !committedAssistantTranscript) return;

      dispatch({ type: 'AI_RESPOND', payload: committedAssistantTranscript });
      addNotification(
        'Opposing counsel has completed the round. Press the round button to hear the Bench.',
        'info',
        4000
      );
    })();
  }, [dispatch, addNotification, processAndSubmitUserTranscript]);

  const handleVapiError = useCallback((err) => {
    const errorMessage = err?.message || 'Voice connection failed.';
    setVoiceError(errorMessage);
    setIsAiSpeaking(false);
    setLiveAssistantTranscript('');
    addNotification(
      `Voice Error: ${errorMessage}. Check microphone permissions and try again, or switch to text mode.`,
      'error',
      8000
    );
  }, [addNotification]);

  const vapi = useVapi({
    systemPrompt: buildSystemPrompt(),
    onUserTranscript: handleUserVoiceTranscript,
    onAssistantTranscript: handleAssistantTranscript,
    onCallStart: handleCallStart,
    onCallEnd: handleCallEnd,
    onError: handleVapiError,
  });

  useEffect(() => {
    if (!vapi.isCallActive) {
      isMutedByAiRef.current = false;
      setIsAiSpeaking(false);
      return;
    }

    if (vapi.isAssistantSpeaking && !isMutedByAiRef.current) {
      isMutedByAiRef.current = true;
      setIsAiSpeaking(true);
      vapi.toggleMute();
    } else if (!vapi.isAssistantSpeaking && isMutedByAiRef.current) {
      isMutedByAiRef.current = false;
      setIsAiSpeaking(false);
      vapi.toggleMute();
    }
  }, [vapi.isAssistantSpeaking, vapi.isCallActive]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (
      vapi.isAssistantSpeaking &&
      isUserTurnActive &&
      !hasSubmittedRoundRef.current &&
      userTranscriptRef.current.trim()
    ) {
      setIsUserTurnActive(false);
    }
  }, [vapi.isAssistantSpeaking, isUserTurnActive]);

  useEffect(() => {
    if (!isVoiceMode || !vapi.isCallActive || !state.selectedCase) return;
    if (primedVoiceRoundRef.current === state.currentRound) return;

    vapi.sendMessage(buildVoiceRoundInstruction());
    primedVoiceRoundRef.current = state.currentRound;
  }, [isVoiceMode, vapi.isCallActive, state.selectedCase, state.currentRound, buildVoiceRoundInstruction, vapi]);

  useEffect(() => {
    if (!vapi.isCallActive) {
      primedVoiceRoundRef.current = null;
    }
  }, [vapi.isCallActive]);

  const handleSubmitArgument = useCallback(async (text) => {
    if (hasSubmittedRoundRef.current || roundComplete || !isUserTurnActive) return;

    hasSubmittedRoundRef.current = true;
    setIsUserTurnActive(false);
    addNotification(
      "Text argument submitted. Awaiting opposing counsel's response...",
      'info',
      3000
    );

    dispatch({ type: 'SUBMIT_ARGUMENT', payload: text });
    setTimeout(() => {
      analyzeTone({ text, side: state.selectedSide, round: state.currentRound })
        .then((result) => { if (result) dispatch({ type: 'SET_TONE_RESULT', payload: result }); });
    }, 2000);
    setShowScores(false);

    const aiResponse = await getAIResponseText(text);
    const aiText = typeof aiResponse === 'string' ? aiResponse.trim() : String(aiResponse ?? '').trim();

    await new Promise((r) => setTimeout(r, 500));
    dispatch({ type: 'AI_RESPOND', payload: aiText });

    addNotification(
      'Opposing counsel has responded. Press the round button to hear the Bench.',
      'info',
      4000
    );
  }, [dispatch, state.selectedSide, state.currentRound, getAIResponseText, addNotification, roundComplete, isUserTurnActive]);

  const stopVoiceSession = useCallback((reason) => {
    voiceStopReasonRef.current = reason;
    if (vapi.isCallActive) {
      vapi.stopCall();
    }
  }, [vapi]);

  const handleStopVoice = useCallback(() => {
    stopVoiceSession('manual-stop');
  }, [stopVoiceSession]);

  const advanceToNextRound = useCallback(() => {
    if (state.currentRound >= state.totalRounds) {
      stopVoiceSession('end-case');

      const userTotal = state.roundScores.reduce(
        (sum, r) => sum + Object.values(r.userScore).reduce((a, b) => a + b, 0), 0
      );
      const aiTotal = state.roundScores.reduce(
        (sum, r) => sum + Object.values(r.aiScore).reduce((a, b) => a + b, 0), 0
      );

      addNotification(
        'Case concluded! Proceeding to verdict based on all arguments presented.',
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
      return;
    }

    setShowScores(false);
    setRoundComplete(false);
    setRoundContext('');
    setIsUserTurnActive(true);
    setIsAiSpeaking(false);
    hasSubmittedRoundRef.current = false;
    userTranscriptRef.current = '';
    userPartialTranscriptRef.current = '';
    assistantTranscriptRef.current = '';
    assistantPartialTranscriptRef.current = '';
    setLiveUserTranscript('');
    setLiveAssistantTranscript('');
    dispatch({ type: 'NEXT_ROUND' });

    addNotification(
      `Round ${state.currentRound + 1} begins! Present your next argument.`,
      'round',
      4000
    );
  }, [dispatch, state.currentRound, state.totalRounds, state.roundScores, stopVoiceSession, addNotification]);

  const handleRoundAction = useCallback(async () => {
    if (roundComplete) {
      advanceToNextRound();
      return;
    }

    const { userText, aiText } = commitVoiceRoundArguments();
    if (!userText || !aiText || state.isAiTyping) return;

    if (vapi.isCallActive) {
      stopVoiceSession('finalize-round');
    }

    await finalizeRoundScoring(userText);
  }, [
    advanceToNextRound,
    commitVoiceRoundArguments,
    finalizeRoundScoring,
    roundComplete,
    state.isAiTyping,
    stopVoiceSession,
    vapi.isCallActive,
  ]);

  const handleEndCase = useCallback(() => {
    stopVoiceSession('end-case');

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
  }, [dispatch, state.roundScores, stopVoiceSession]);

  const handleToggleVoiceMode = useCallback(() => {
    if (isVoiceMode && vapi.isCallActive) stopVoiceSession('toggle-mode');
    setIsVoiceMode((v) => !v);
    setVoiceError('');

    addNotification(
      isVoiceMode
        ? 'Switched to text mode. Type your arguments in the text area below.'
        : 'Switched to voice mode. Press the microphone button to begin speaking.',
      'info',
      3000
    );
  }, [isVoiceMode, vapi.isCallActive, stopVoiceSession, addNotification]);

  const canStartVoice = !state.isLoadingContext && (!qdrantReady || hasContextAttempted);

  const handleStartVoice = useCallback(() => {
    if (!canStartVoice) return;
    setVoiceError('');
    vapi.startCall();
  }, [vapi, canStartVoice]);

  const isInputDisabled = state.isAiTyping || roundComplete || !isUserTurnActive;
  const isMicDisabled = isInputDisabled || isAiSpeaking || vapi.isAssistantSpeaking;
  const displayVoiceError = vapi.lastError || voiceError;
  const readyUserText = currentRoundUserArg?.text?.trim() || userTranscriptRef.current.trim();
  const readyAiText = currentRoundAiArg?.text?.trim() || assistantTranscriptRef.current.trim();
  const canScoreRound = Boolean(readyUserText && readyAiText) && !state.isAiTyping;
  const canAdvanceRound = roundComplete;
  const showRoundAction = canScoreRound || canAdvanceRound;

  return (
    <div className="courtroom" id="courtroom-arena">
      <TurnBanner
        side={state.selectedSide}
        round={state.currentRound}
        totalRounds={state.totalRounds}
        active={isUserTurnActive && !roundComplete}
      />

      {state.isLoadingContext && (
        <div className="courtroom__context-loading" id="context-loading-indicator">
          <div className="courtroom__context-loading-inner">
            <div className="courtroom__context-spinner" />
            <span>Retrieving case knowledge...</span>
          </div>
        </div>
      )}

      <TopBar
        currentRound={state.currentRound}
        totalRounds={state.totalRounds}
        onEndCase={handleEndCase}
      />

      <section className="courtroom__scene">
        <aside className="courtroom__side-panel">
          <JudgeBench roundScores={state.roundScores} isVisible={showScores} />

          {state.toneResults.length > 0 && (
            <div className="courtroom__tone-panel">
              <div className="courtroom__tone-panel-header">
                <div className="courtroom__tone-panel-line" />
                <span className="courtroom__tone-panel-label">TONE ANALYSIS</span>
                <div className="courtroom__tone-panel-line" />
              </div>
              <ToneChip tone={state.toneResults[state.toneResults.length - 1]} />
            </div>
          )}

          {vapi.isCallActive && (
            <div className="courtroom__waveform-container">
              <VoiceWaveform
                volumeLevel={vapi.volumeLevel}
                isActive={vapi.isAssistantSpeaking}
              />
            </div>
          )}

          {showRoundAction && (
            <div className="courtroom__round-action">
              <button
                className="courtroom__next-btn"
                onClick={handleRoundAction}
                id="next-round-btn"
                disabled={!canScoreRound && !canAdvanceRound}
              >
                {roundComplete
                  ? (state.currentRound >= state.totalRounds ? 'Hear the Verdict' : `Next Round ${state.currentRound + 1}`)
                  : (state.currentRound >= state.totalRounds ? 'Hear the Bench, Then Verdict' : 'Hear the Bench')}
              </button>
            </div>
          )}

        </aside>

        <div className="courtroom__main-panel">
          <ChatArea
            arguments={state.arguments}
            isAiTyping={state.isAiTyping}
            isAiSpeaking={isAiSpeaking}
            liveUserTranscript={liveUserTranscript}
            liveAssistantTranscript={liveAssistantTranscript}
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
            onStopVoice={handleStopVoice}
            onToggleMute={vapi.toggleMute}
            canStartVoice={canStartVoice}
            voiceError={displayVoiceError}
          />
        </div>
      </section>

      {notifications.length > 0 && (
        <div className="courtroom__notifications" id="notification-container">
          {notifications.map((notification) => (
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
