import { useRef, useEffect } from 'react';
import ArgumentBubble from './ArgumentBubble';
import './ChatArea.css';

export default function ChatArea({ arguments: args, isAiTyping, isAiSpeaking, liveTranscript, currentRound }) {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [args, isAiTyping, liveTranscript]);

  return (
    <div className="chat-area" id="chat-area">
      <div className="chat-area__court-header">
        <div className="chat-area__court-line" />
        <span className="chat-area__court-text">Proceedings of the Court</span>
        <div className="chat-area__court-line" />
      </div>

      <div className="chat-area__messages">
        {args.length === 0 && !isAiTyping && !liveTranscript && (
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

        {/* Live accumulating transcript while AI speaks — single bubble that grows */}
        {liveTranscript && (
          <ArgumentBubble
            side="ai"
            text={liveTranscript}
            round={currentRound}
            isLive={true}
          />
        )}

        {/* Typing indicator when waiting for text-mode AI response */}
        {isAiTyping && !liveTranscript && (
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
