import { useState, useRef, useEffect } from 'react';
import './ArgumentInput.css';

export default function ArgumentInput({
  onSubmit,
  disabled,
  micDisabled = false,       // true when AI is speaking — blocks mic
  currentRound,
  totalRounds,
  selectedSide,
  // Voice props
  voiceEnabled = false,
  isVoiceMode = true,        // default voice
  onToggleVoiceMode,
  isCallActive = false,
  isMuted = false,
  isUserSpeaking = false,
  isAiSpeaking = false,      // AI is currently speaking
  connectionStatus = 'idle',
  onStartVoice,
  onStopVoice,
  onToggleMute,
  canStartVoice = true,
  voiceError = '',
}) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);
  const charCount = text.length;
  const wordCount  = text.trim() ? text.trim().split(/\s+/).length : 0;

  useEffect(() => {
    if (!disabled && !isVoiceMode && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled, isVoiceMode]);

  const handleSubmit = () => {
    if (text.trim().length < 20 || disabled) return;
    onSubmit(text.trim());
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isLastRound = currentRound === totalRounds;

  // Mic button is blocked when AI is speaking or round is done
  const micBlocked = micDisabled || isAiSpeaking;

  // Status message for voice mode
  const getVoiceStatus = () => {
    if (connectionStatus === 'connecting')          return 'Connecting to courtroom...';
    if (connectionStatus === 'error')               return 'Connection error — try again';
    if (isAiSpeaking)                               return 'Opposing counsel is speaking...';
    if (connectionStatus === 'connected' && isUserSpeaking) return 'Recording your argument...';
    if (connectionStatus === 'connected')           return 'Listening — speak when ready';
    if (!canStartVoice)                             return 'Preparing case context...';
    if (isCallActive)                               return 'Session active';
    return 'Press mic to begin';
  };

  return (
    <div className={`arg-input ${disabled ? 'arg-input--disabled' : ''}`} id="argument-input">
      {/* Header */}
      <div className="arg-input__header">
        <span className="arg-input__side-indicator">
          <span className="arg-input__side-dot" />
          Arguing as {selectedSide === 'petitioner' ? 'Petitioner' : 'Respondent'}
        </span>

        <div className="arg-input__header-right">
          {/* Toggle between voice and text */}
          {voiceEnabled && (
            <button
              className={`arg-input__mode-toggle ${!isVoiceMode ? 'arg-input__mode-toggle--voice' : ''}`}
              onClick={onToggleVoiceMode}
              id="voice-text-toggle"
              title={isVoiceMode ? 'Switch to text input' : 'Switch to voice input'}
            >
              <span className="arg-input__mode-icon">
                {isVoiceMode ? '⌨' : '🎙'}
              </span>
              <span className="arg-input__mode-label">
                {isVoiceMode ? 'Type Instead' : 'Use Voice'}
              </span>
            </button>
          )}

          <span className="arg-input__hint">
            {disabled
              ? 'Awaiting opposing counsel...'
              : isVoiceMode
                ? isCallActive ? 'Voice session active' : 'Press mic to begin'
                : 'Ctrl + Enter to submit'}
          </span>
        </div>
      </div>

      {/* ── Voice Mode ── */}
      {isVoiceMode ? (
        <div className="arg-input__voice-area">
          {/* Mic button */}
          <button
            className={[
              'arg-input__mic-btn',
              isCallActive                              ? 'arg-input__mic-btn--active'     : '',
              isUserSpeaking                            ? 'arg-input__mic-btn--speaking'   : '',
              connectionStatus === 'connecting'         ? 'arg-input__mic-btn--connecting' : '',
              micBlocked && isCallActive                ? 'arg-input__mic-btn--ai-speaking': '',
              !isCallActive && !canStartVoice           ? 'arg-input__mic-btn--blocked'    : '',
            ].join(' ')}
            onClick={isCallActive ? onStopVoice : onStartVoice}
            disabled={
              connectionStatus === 'connecting' ||
              (!isCallActive && !canStartVoice) ||
              (isCallActive && micBlocked)        // can't interrupt AI
            }
            id="mic-button"
            title={isAiSpeaking ? 'Wait for opposing counsel to finish' : undefined}
          >
            <div className="arg-input__mic-icon-wrap">
              {/* Pulse rings when user is speaking */}
              {isCallActive && isUserSpeaking && (
                <>
                  <span className="arg-input__mic-ring arg-input__mic-ring--1" />
                  <span className="arg-input__mic-ring arg-input__mic-ring--2" />
                  <span className="arg-input__mic-ring arg-input__mic-ring--3" />
                </>
              )}
              {/* AI speaking indicator rings */}
              {isCallActive && isAiSpeaking && (
                <>
                  <span className="arg-input__mic-ring arg-input__mic-ring--ai arg-input__mic-ring--1" />
                  <span className="arg-input__mic-ring arg-input__mic-ring--ai arg-input__mic-ring--2" />
                </>
              )}
              <span className="arg-input__mic-icon">
                {connectionStatus === 'connecting' ? '⟳'
                  : isAiSpeaking && isCallActive   ? '🔇'
                  : isCallActive                   ? '⬤'
                  : '🎙'}
              </span>
            </div>
          </button>

          {/* Status */}
          <div className="arg-input__voice-status">
            <span className={[
              'arg-input__voice-status-dot',
              isCallActive && !isAiSpeaking ? 'arg-input__voice-status-dot--live' : '',
              isAiSpeaking                  ? 'arg-input__voice-status-dot--ai'   : '',
            ].join(' ')} />
            <span className={`arg-input__voice-status-text ${isAiSpeaking ? 'arg-input__voice-status-text--ai' : ''}`}>
              {getVoiceStatus()}
            </span>
          </div>

          {/* Mute toggle — only when call active and AI is NOT speaking */}
          {isCallActive && !isAiSpeaking && (
            <button
              className={`arg-input__mute-btn ${isMuted ? 'arg-input__mute-btn--muted' : ''}`}
              onClick={onToggleMute}
              id="mute-toggle"
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          )}

          {voiceError && !isCallActive && (
            <p className="arg-input__voice-error" role="alert">{voiceError}</p>
          )}
        </div>
      ) : (
        /* ── Text Mode ── */
        <>
          <div className="arg-input__field-wrap">
            <textarea
              ref={textareaRef}
              className="arg-input__field"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                currentRound === 1
                  ? "My Lords, I humbly submit before this Hon'ble Court that..."
                  : "May it please the Court, in continuation of my submission..."
              }
              disabled={disabled}
              rows={4}
              id="argument-textarea"
            />
            <div className="arg-input__meta">
              <span className={`arg-input__word-count ${wordCount < 10 ? 'arg-input__word-count--low' : ''}`}>
                {charCount} / 1500 characters
              </span>
              {text.trim().length > 0 && text.trim().length < 20 && (
                <span className="arg-input__warning">Minimum 20 characters required</span>
              )}
            </div>
          </div>

          <button
            className={`arg-input__submit ${text.trim().length >= 20 && !disabled ? 'arg-input__submit--ready' : ''}`}
            onClick={handleSubmit}
            disabled={text.trim().length < 20 || disabled}
            id="submit-argument-btn"
          >
            <span className="arg-input__submit-icon">🔨</span>
            <span className="arg-input__submit-text">
              {isLastRound ? 'Final Submission' : 'Submit Argument'}
            </span>
          </button>
        </>
      )}
    </div>
  );
}
