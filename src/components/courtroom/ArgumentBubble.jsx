import './ArgumentBubble.css';

export default function ArgumentBubble({ side, text, round, isTyping, isSpeaking }) {
  const isUser = side === 'user';

  return (
    <div className={`arg-bubble ${isUser ? 'arg-bubble--user' : 'arg-bubble--ai'} ${isTyping ? 'arg-bubble--typing' : ''}`}>
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
              <span />
              <span />
              <span />
            </div>
          </div>
        ) : (
          <p className="arg-bubble__text">{text}</p>
        )}
      </div>

      <div className="arg-bubble__corner" />
    </div>
  );
}
