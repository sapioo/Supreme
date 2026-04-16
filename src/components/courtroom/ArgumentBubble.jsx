import './ArgumentBubble.css';

export default function ArgumentBubble({ side, text, round, isTyping }) {
  const isUser = side === 'user';

  return (
    <div className={`arg-bubble ${isUser ? 'arg-bubble--user' : 'arg-bubble--ai'} ${isTyping ? 'arg-bubble--typing' : ''}`}>
      {/* Side indicator */}
      <div className="arg-bubble__header">
        <span className="arg-bubble__side-dot" />
        <span className="arg-bubble__side-label">
          {isUser ? 'Your Submission' : 'Opposing Counsel'}
        </span>
        <span className="arg-bubble__round">Round {round}</span>
      </div>

      {/* Content */}
      <div className="arg-bubble__content">
        {isTyping ? (
          <div className="arg-bubble__typing">
            <span className="arg-bubble__typing-text">Court Reporter transcribing...</span>
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

      {/* Decorative corner */}
      <div className="arg-bubble__corner" />
    </div>
  );
}
