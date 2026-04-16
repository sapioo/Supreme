import { useState, useRef, useEffect } from 'react';
import './ArgumentInput.css';

export default function ArgumentInput({
  onSubmit,
  disabled,
  currentRound,
  totalRounds,
  selectedSide,
  // Voice props
  voiceEnabled = false,
  isVoiceMode = false,
  onToggleVoiceMode,
  isCallActive = false,
  isMuted = false,
  isUserSpeaking = false,
  connectionStatus = 'idle',
  onStartVoice,
  onStopVoice,
  onToggleMute,
}) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

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

  return (
    <div className={`arg-input ${disabled ? 'arg-input--disabled' : ''}`} id="argument-input">
      {/* Input header */}
      <div className="arg-input__header">
        <span className="arg-input__side-indicator">
          <span className="arg-input__side-dot" />
          Arguing as {selectedSide === 'petitioner' ? 'Petitioner' : 'Respondent'}
        </span>

        <div className="arg-input__header-right">
          {/* Voice/Text toggle */}
          {voiceEnabled && (
            <button
              className={`arg-input__mode-toggle ${isVoiceMode ? 'arg-input__mode-toggle--voice' : ''}`}
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
                ? isCallActive ? 'Speak your argument' : 'Press mic to begin'
                : 'Ctrl + Enter to submit'}
          </span>
        </div>
      </div>

      {/* Voice Mode UI */}
      {isVoiceMode ? (
        <div className="arg-input__voice-area">
          {/* Microphone button */}
          <button
            className={`arg-input__mic-btn
              ${isCallActive ? 'arg-input__mic-btn--active' : ''}
              ${isUserSpeaking ? 'arg-input__mic-btn--speaking' : ''}
              ${connectionStatus === 'connecting' ? 'arg-input__mic-btn--connecting' : ''}
            `}
            onClick={isCallActive ? onStopVoice : onStartVoice}
            disabled={disabled || connectionStatus === 'connecting'}
            id="mic-button"
          >
            <div className="arg-input__mic-icon-wrap">
              {/* Pulse rings when active */}
              {isCallActive && (
                <>
                  <span className="arg-input__mic-ring arg-input__mic-ring--1" />
                  <span className="arg-input__mic-ring arg-input__mic-ring--2" />
                  <span className="arg-input__mic-ring arg-input__mic-ring--3" />
                </>
              )}
              <span className="arg-input__mic-icon">
                {connectionStatus === 'connecting' ? '⟳' : isCallActive ? '⬤' : '🎙'}
              </span>
            </div>
          </button>

          {/* Status text */}
          <div className="arg-input__voice-status">
            <span className={`arg-input__voice-status-dot ${isCallActive ? 'arg-input__voice-status-dot--live' : ''}`} />
            <span className="arg-input__voice-status-text">
              {connectionStatus === 'connecting' && 'Connecting to courtroom...'}
              {connectionStatus === 'connected' && isUserSpeaking && 'Recording your argument...'}
              {connectionStatus === 'connected' && !isUserSpeaking && 'Listening — speak when ready'}
              {connectionStatus === 'idle' && 'Press to start voice session'}
              {connectionStatus === 'error' && 'Connection error — try again'}
            </span>
          </div>

          {/* Mute toggle during active call */}
          {isCallActive && (
            <button
              className={`arg-input__mute-btn ${isMuted ? 'arg-input__mute-btn--muted' : ''}`}
              onClick={onToggleMute}
              id="mute-toggle"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          )}
        </div>
      ) : (
        /* Text Mode UI (existing) */
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
