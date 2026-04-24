import './ArgumentBubble.css';

export default function ArgumentBubble({ side, text, round, isTyping, isSpeaking, isLive, currentRound }) {
  const isUser = side === 'user';
  // Stamp appears on bubbles from rounds that are now in the past
  const isSubmitted = !isTyping && !isLive && typeof currentRound === 'number' && round < currentRound;

  return (
    <div className={`arg-bubble ${isUser ? 'arg-bubble--user' : 'arg-bubble--ai'} ${isTyping ? 'arg-bubble--typing' : ''} ${isLive ? 'arg-bubble--live' : ''}`}>
      <div className="arg-bubble__header">
        <span className="arg-bubble__side-dot" />
        <span className="arg-bubble__side-label">
          {isUser ? 'Your Submission' : 'Opposing Counsel'}
        </span>
        <span className="arg-bubble__round">Round {round}</span>
      </div>

      <div className="arg-bubble__content">
        {isTyping ? (
          <div className="arg-bubble__typing">
            <span className="arg-bubble__typing-text">
              {isSpeaking ? 'Opposing counsel is speaking...' : 'Court Reporter transcribing...'}
            </span>
            <div className="arg-bubble__typing-dots">
              <span /><span /><span />
            </div>
          </div>
        ) : (
          <p className="arg-bubble__text">
            {typeof text === 'string' ? text : String(text ?? '')}
            {isLive && <span className="arg-bubble__cursor" />}
          </p>
        )}
      </div>

      {/* Submitted watermark — faint diagonal stamp on past-round bubbles */}
      {isSubmitted && (
        <span className="arg-bubble__stamp" aria-hidden="true">SUBMITTED</span>
      )}

      <div className="arg-bubble__corner" />
    </div>
  );
}
