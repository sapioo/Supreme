import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useVapi — Voice session hook for the courtroom
 *
 * Vapi instance is created lazily (only when user clicks mic) to avoid
 * touching audio/DOM APIs on page load. The module itself is statically
 * imported so Vite pre-bundles the CJS→ESM conversion correctly.
 */

// Static top-level import so Vite pre-bundles @vapi-ai/web as ESM.
// We don't instantiate it here — just capture the class reference.
import VapiSDK from '@vapi-ai/web';
const VapiClass = VapiSDK?.default ?? VapiSDK;

export default function useVapi({
  systemPrompt = '',
  onUserTranscript,
  onAssistantTranscript,
  onCallStart,
  onCallEnd,
  onError,
}) {
  const vapiRef = useRef(null);

  const [isCallActive, setIsCallActive]               = useState(false);
  const [isMuted, setIsMuted]                         = useState(false);
  const [isUserSpeaking, setIsUserSpeaking]           = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel]                 = useState(0);
  const [connectionStatus, setConnectionStatus]       = useState('idle');
  const [lastError, setLastError]                     = useState('');

  // Keep latest callbacks in a ref so event handlers never go stale
  const cbRef = useRef({});
  useEffect(() => {
    cbRef.current = { onUserTranscript, onAssistantTranscript, onCallStart, onCallEnd, onError };
  });

  // Keep latest systemPrompt in a ref so startCall always uses the freshest value
  const systemPromptRef = useRef(systemPrompt);
  useEffect(() => {
    systemPromptRef.current = systemPrompt;
  }, [systemPrompt]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (vapiRef.current) {
        try { vapiRef.current.stop(); } catch { /* ignore */ }
        vapiRef.current = null;
      }
    };
  }, []);

  // ─── Create Vapi instance (once, on first startCall) ──────────────────────
  const ensureInstance = useCallback(async () => {
    if (vapiRef.current) return vapiRef.current;

    const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
    if (!publicKey || publicKey === 'your-vapi-public-key-here') {
      setLastError('No Vapi public key configured.');
      return null;
    }

    if (!VapiClass) {
      setLastError('Voice SDK not available.');
      return null;
    }

    try {
      const vapi = new VapiClass(publicKey);
      vapiRef.current = vapi;

      // Debounce timer — keeps isAssistantSpeaking true for 1.5s after
      // the last non-zero volume sample, preventing stutter on brief pauses
      let speakingHoldTimer = null;

      vapi.on('call-start', () => {
        setIsCallActive(true);
        setIsMuted(false);
        setConnectionStatus('connected');
        setLastError('');
        cbRef.current.onCallStart?.();
      });

      vapi.on('call-end', () => {
        if (speakingHoldTimer) { clearTimeout(speakingHoldTimer); speakingHoldTimer = null; }
        setIsCallActive(false);
        setIsUserSpeaking(false);
        setIsAssistantSpeaking(false);
        setVolumeLevel(0);
        setConnectionStatus('idle');
        cbRef.current.onCallEnd?.();
      });

      vapi.on('speech-start', () => setIsUserSpeaking(true));
      vapi.on('speech-end',   () => setIsUserSpeaking(false));

      vapi.on('volume-level', (vol) => {
        setVolumeLevel(vol);

        if (vol > 0.02) {
          // AI is producing audio — mark as speaking immediately
          setIsAssistantSpeaking(true);
          // Reset the hold timer on every active sample
          if (speakingHoldTimer) { clearTimeout(speakingHoldTimer); speakingHoldTimer = null; }
        } else {
          // Volume dropped to near-zero — only clear after 1.5s of sustained silence
          // This prevents stutter from brief pauses mid-sentence
          if (!speakingHoldTimer) {
            speakingHoldTimer = setTimeout(() => {
              setIsAssistantSpeaking(false);
              speakingHoldTimer = null;
            }, 1500);
          }
        }
      });

      vapi.on('error', (err) => {
        console.error('[Vapi] Error:', err);
        const msg = err?.error?.message || err?.message || 'Voice connection failed.';
        setConnectionStatus('error');
        setLastError(msg);
        setIsCallActive(false);
        cbRef.current.onError?.(err);
      });

      vapi.on('message', (msg) => {
        if (msg.type !== 'transcript' || msg.transcriptType !== 'final') return;
        if (msg.role === 'user') {
          cbRef.current.onUserTranscript?.(msg.transcript);
        } else if (msg.role === 'assistant') {
          cbRef.current.onAssistantTranscript?.(msg.transcript);
        }
      });

      return vapi;
    } catch (err) {
      console.error('[Vapi] Failed to create instance:', err);
      setLastError('Voice init failed: ' + (err?.message || 'unknown'));
      return null;
    }
  }, []);

  // ─── startCall ─────────────────────────────────────────────────────────────
  const startCall = useCallback(async () => {
    setConnectionStatus('connecting');
    setLastError('');

    const vapi = await ensureInstance();
    if (!vapi) {
      setConnectionStatus('error');
      return;
    }

    const prompt = systemPromptRef.current;
    const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;

    const inlineConfig = {
      model: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: prompt || 'You are an AI legal counsel in a courtroom debate simulation.' }],
      },
      voice: { provider: '11labs', voiceId: 'pNInz6obpgDQGcFmaJgB' },
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'en',
        // Wait 500ms of silence before finalising transcript — prevents
        // breath pauses from cutting the recording mid-sentence
        endpointing: 500,
      },
      // Prevent user from interrupting the AI while it's speaking
      interruptionsEnabled: false,
      firstMessage: "My Lords, the opposing counsel is present and ready to address the Court.",
    };

    try {
      if (assistantId && assistantId !== 'your-vapi-assistant-id-here') {
        console.log('[Vapi] Starting with assistant ID + overrides');
        await vapi.start(assistantId, {
          model: inlineConfig.model,
          transcriber: inlineConfig.transcriber,
          interruptionsEnabled: false,
        });
      } else {
        console.log('[Vapi] Starting with inline config');
        await vapi.start(inlineConfig);
      }
    } catch (err) {
      console.error('[Vapi] startCall failed:', err);
      setConnectionStatus('error');
      setLastError(err?.message || 'Unable to start voice session.');
    }
  }, [ensureInstance]);

  // ─── stopCall ──────────────────────────────────────────────────────────────
  const stopCall = useCallback(() => {
    try { vapiRef.current?.stop(); } catch { /* ignore */ }
    setIsCallActive(false);
    setConnectionStatus('idle');
  }, []);

  // ─── toggleMute ────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (!vapiRef.current) return;
    setIsMuted((prev) => {
      const next = !prev;
      vapiRef.current.setMuted(next);
      return next;
    });
  }, []);

  // ─── sendMessage ───────────────────────────────────────────────────────────
  const sendMessage = useCallback((text) => {
    if (!vapiRef.current || !isCallActive) return;
    vapiRef.current.send({ type: 'add-message', message: { role: 'system', content: text } });
  }, [isCallActive]);

  // ─── say ───────────────────────────────────────────────────────────────────
  const say = useCallback((text, endAfterSpeaking = false) => {
    if (!vapiRef.current || !isCallActive) return;
    vapiRef.current.say(text, endAfterSpeaking);
  }, [isCallActive]);

  const isAvailable = !!(
    import.meta.env.VITE_VAPI_PUBLIC_KEY &&
    import.meta.env.VITE_VAPI_PUBLIC_KEY !== 'your-vapi-public-key-here'
  );

  return {
    isCallActive, isMuted, isUserSpeaking, isAssistantSpeaking,
    volumeLevel, connectionStatus, isAvailable, lastError,
    startCall, stopCall, toggleMute, sendMessage, say,
  };
}
