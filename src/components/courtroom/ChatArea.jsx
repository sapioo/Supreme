import './ChatArea.css';

function Panel({ side, label, text, isLive, isTyping, currentRound }) {
  const isUser = side === 'user';
  const isEmpty = !text && !isTyping && !isLive;

  return (
    <div className={`split-panel split-panel--${side}`}>
      {/* Column header */}
      <div className="split-panel__header">
        <span className="split-panel__dot" />
        <span className="split-panel__label">{label}</span>
        <span className="split-panel__round">Round {currentRound}</span>
      </div>

      {/* Divider */}
      <div className="split-panel__divider" />

      {/* Content */}
      <div className="split-panel__body">
        {isEmpty && (
          <p className="split-panel__empty">
            {isUser ? 'Awaiting your argument…' : 'Awaiting opposing counsel…'}
          </p>
        )}

        {isTyping && !isLive && (
          <div className="split-panel__typing">
            <span />
            <span />
            <span />
          </div>
        )}

        {(text || isLive) && (
          <p className="split-panel__text">
            {text}
            {isLive && <span className="split-panel__cursor" />}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ChatArea({
  arguments: args,
  isAiTyping,
  isAiSpeaking,
  liveUserTranscript,
  liveAssistantTranscript,
  currentRound,
  caseName,
}) {
  const roundArgs = args.filter((a) => a.round === currentRound);
  const userArg = [...roundArgs].reverse().find((a) => a.side === 'user');
  const aiArg = [...roundArgs].reverse().find((a) => a.side === 'ai');

  const userText = userArg?.text || liveUserTranscript || '';
  const aiText = aiArg?.text || liveAssistantTranscript || '';

  const isUserLive = !!liveUserTranscript;
  const isAiLive = !aiArg?.text && !!liveAssistantTranscript && (isAiSpeaking || isAiTyping);

  return (
    <div className="chat-area" id="chat-area">
      {/* Case name header */}
      <div className="chat-area__court-header">
        <div className="chat-area__court-line" />
        <span className="chat-area__court-text">
          {caseName ? caseName.toUpperCase() : 'PROCEEDINGS OF THE COURT'}
        </span>
        <div className="chat-area__court-line" />
      </div>

      {/* Split panels */}
      <div className="chat-area__split">
        <Panel
          side="user"
          label="Your Submission"
          text={userText}
          isLive={isUserLive}
          isTyping={false}
          currentRound={currentRound}
        />

        {/* Centre divider */}
        <div className="chat-area__split-sep" />

        <Panel
          side="ai"
          label="Opposing Counsel"
          text={aiText}
          isLive={isAiLive}
          isTyping={isAiTyping}
          currentRound={currentRound}
        />
      </div>
    </div>
  );
}
