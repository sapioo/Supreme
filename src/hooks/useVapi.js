import { useState, useEffect, useRef, useCallback } from 'react';
import VapiModule from '@vapi-ai/web';
// Handle CJS default export: the package exports { default: class Vapi }
const Vapi = VapiModule.default || VapiModule;

/**
 * useVapi — Custom hook for managing Vapi voice sessions in the courtroom
 *
 * Handles:
 * - Vapi instance lifecycle
 * - Call start/stop
 * - Live transcripts (user + assistant)
 * - Volume levels for waveform visualization
 * - Speech state tracking (who's speaking)
 * - Mute/unmute
 */
export default function useVapi({
  systemPrompt,
  onUserTranscript,
  onAssistantTranscript,
  onCallStart,
  onCallEnd,
  onError,
  enabled = true,
}) {
  const vapiRef = useRef(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('idle'); // idle | connecting | connected | error

  // Store latest callbacks in refs to avoid re-creating effects
  const callbacksRef = useRef({ onUserTranscript, onAssistantTranscript, onCallStart, onCallEnd, onError });
  useEffect(() => {
    callbacksRef.current = { onUserTranscript, onAssistantTranscript, onCallStart, onCallEnd, onError };
  });

  // Initialize Vapi instance — always create it so it's ready when user clicks mic
  useEffect(() => {

    const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
    if (!publicKey || publicKey === 'your-vapi-public-key-here') {
      console.warn('[Vapi] No valid VITE_VAPI_PUBLIC_KEY found. Voice features disabled.');
      return;
    }

    try {
      const vapi = new Vapi(publicKey);
      vapiRef.current = vapi;

      // --- Event Handlers ---

      vapi.on('call-start', () => {
        setIsCallActive(true);
        setConnectionStatus('connected');
        callbacksRef.current.onCallStart?.();
      });

      vapi.on('call-end', () => {
        setIsCallActive(false);
        setIsUserSpeaking(false);
        setIsAssistantSpeaking(false);
        setVolumeLevel(0);
        setConnectionStatus('idle');
        callbacksRef.current.onCallEnd?.();
      });

      vapi.on('speech-start', () => {
        setIsUserSpeaking(true);
      });

      vapi.on('speech-end', () => {
        setIsUserSpeaking(false);
      });

      vapi.on('volume-level', (volume) => {
        setVolumeLevel(volume);
        setIsAssistantSpeaking(volume > 0.01);
      });

      vapi.on('error', (error) => {
        console.error('[Vapi] Error:', error);
        setConnectionStatus('error');
        callbacksRef.current.onError?.(error);
      });

      vapi.on('message', (message) => {
        if (message.type === 'transcript') {
          if (message.transcriptType === 'final') {
            if (message.role === 'user') {
              callbacksRef.current.onUserTranscript?.(message.transcript);
            } else if (message.role === 'assistant') {
              callbacksRef.current.onAssistantTranscript?.(message.transcript);
            }
          }
        }
      });

      return () => {
        vapi.stop();
        vapiRef.current = null;
      };
    } catch (err) {
      console.error('[Vapi] Failed to initialize:', err);
      setConnectionStatus('error');
    }
  }, []);

  /**
   * Start a voice call with the courtroom assistant.
   * Uses VITE_VAPI_ASSISTANT_ID if available (pre-configured in Vapi dashboard),
   * otherwise falls back to inline assistant config.
   */
  const startCall = useCallback(async () => {
    const vapi = vapiRef.current;
    if (!vapi) {
      console.warn('[Vapi] Instance not initialized. Check VITE_VAPI_PUBLIC_KEY.');
      return;
    }

    setConnectionStatus('connecting');

    const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;

    try {
      if (assistantId) {
        // Use pre-configured assistant from Vapi dashboard — no overrides
        console.log('[Vapi] Starting call with assistant ID:', assistantId);
        await vapi.start(assistantId);
      } else {
        // Fallback: inline assistant configuration (no assistant ID)
        console.log('[Vapi] Starting call with inline config');
        await vapi.start({
          model: {
            provider: 'openai',
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: systemPrompt || 'You are an AI legal counsel in a courtroom debate simulation.',
              },
            ],
          },
          voice: {
            provider: '11labs',
            voiceId: 'pNInz6obpgDQGcFmaJgB',
          },
          firstMessage: "My Lords, the opposing counsel is now ready to present their arguments before this Hon'ble Court.",
          transcriber: {
            provider: 'deepgram',
            model: 'nova-2',
            language: 'en',
          },
        });
      }
    } catch (err) {
      console.error('[Vapi] Failed to start call:', err?.message || err);
      console.error('[Vapi] Full error:', JSON.stringify(err, null, 2));
      setConnectionStatus('error');
    }
  }, [systemPrompt]);

  /**
   * Stop the active voice call
   */
  const stopCall = useCallback(() => {
    vapiRef.current?.stop();
    setIsCallActive(false);
    setConnectionStatus('idle');
  }, []);

  /**
   * Toggle microphone mute
   */
  const toggleMute = useCallback(() => {
    if (!vapiRef.current) return;
    const newMuted = !isMuted;
    vapiRef.current.setMuted(newMuted);
    setIsMuted(newMuted);
  }, [isMuted]);

  /**
   * Send a text message to the assistant during an active call
   */
  const sendMessage = useCallback((text) => {
    if (!vapiRef.current || !isCallActive) return;
    vapiRef.current.send({
      type: 'add-message',
      message: { role: 'user', content: text },
    });
  }, [isCallActive]);

  /**
   * Make the assistant say something
   */
  const say = useCallback((text, endAfterSpeaking = false) => {
    if (!vapiRef.current || !isCallActive) return;
    vapiRef.current.say(text, endAfterSpeaking);
  }, [isCallActive]);

  /**
   * Check if Vapi is available (key configured)
   */
  const isAvailable = (() => {
    const key = import.meta.env.VITE_VAPI_PUBLIC_KEY;
    return !!key && key !== 'your-vapi-public-key-here';
  })();

  return {
    // State
    isCallActive,
    isMuted,
    isUserSpeaking,
    isAssistantSpeaking,
    volumeLevel,
    connectionStatus,
    isAvailable,

    // Actions
    startCall,
    stopCall,
    toggleMute,
    sendMessage,
    say,
  };
}
