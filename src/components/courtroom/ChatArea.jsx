import { useRef, useEffect } from 'react';
import ArgumentBubble from './ArgumentBubble';
import './ChatArea.css';

export default function ChatArea({ arguments: args, isAiTyping, currentRound }) {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [args, isAiTyping]);

  return (
    <div className="chat-area" id="chat-area">
      {/* Courtroom header */}
      <div className="chat-area__court-header">
        <div className="chat-area__court-line" />
        <span className="chat-area__court-text">Proceedings of the Court</span>
        <div className="chat-area__court-line" />
      </div>

      {/* Messages */}
      <div className="chat-area__messages">
        {args.length === 0 && !isAiTyping && (
          <div className="chat-area__empty">
            <span className="chat-area__empty-icon">⚖</span>
            <p className="chat-area__empty-text">
              The Court is in session. Present your opening argument.
            </p>
          </div>
        )}

        {args.map((arg, index) => (
          <ArgumentBubble
            key={index}
            side={arg.side}
            text={arg.text}
            round={arg.round}
          />
        ))}

        {isAiTyping && (
          <ArgumentBubble
            side="ai"
            text=""
            round={currentRound}
            isTyping={true}
          />
        )}

        <div ref={chatEndRef} />
      </div>
    </div>
  );
}
