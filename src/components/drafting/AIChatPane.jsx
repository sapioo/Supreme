import { useState } from 'react';
import { Card } from '../ui/card';
import { PromptInputBox } from '../ui/ai-prompt-box';
import { ChevronRight } from 'lucide-react';

export default function AIChatPane({
  providerStatus,
  chatMessages,
  isChatLoading,
  chatInput,
  onChatInputChange,
  onSendChat,
  onApplyProposal,
  onDiscardProposal,
}) {
  return (
    <Card className="drafting-pane drafting-pane--ai">
      {/* Header */}
      <div className="drafting-pane__head">
        <div className="drafting-pane__head-main">
          <h2>AI Drafting Chat</h2>
        </div>
        <span>{providerStatus}</span>
      </div>

      {/* Chat thread */}
      <div className="drafting-chat-thread">
        {/* Messages */}
        {chatMessages.map((message) => (
          <div
            key={message.id}
            className={`drafting-chat-row ${
              message.role === 'user'
                ? 'drafting-chat-row--user'
                : 'drafting-chat-row--assistant'
            }`}
          >
            <div
              className={`drafting-chat-bubble ${
                message.role === 'user'
                  ? 'drafting-chat-bubble--user'
                  : 'drafting-chat-bubble--assistant'
              }`}
            >
              <p className="drafting-chat-bubble__content">{message.content}</p>

              {/* Proposal — collapsed by default */}
              {message.proposedSource && (
                <ProposalBlock
                  message={message}
                  onApply={onApplyProposal}
                  onDiscard={onDiscardProposal}
                />
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isChatLoading && (
          <div className="drafting-chat-row drafting-chat-row--assistant">
            <div className="drafting-chat-bubble drafting-chat-bubble--assistant drafting-chat-typing">
              <span className="drafting-chat-typing__dot" />
              <span className="drafting-chat-typing__dot" />
              <span className="drafting-chat-typing__dot" />
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="drafting-chat-composer">
        <PromptInputBox
          value={chatInput}
          onValueChange={onChatInputChange}
          onSend={onSendChat}
          isLoading={isChatLoading}
        />
      </div>
    </Card>
  );
}

function ProposalBlock({ message, onApply, onDiscard }) {
  const [isOpen, setIsOpen] = useState(false);
  const isPending = message.proposalState === 'pending';
  const stateLabel = isPending ? 'pending' : message.proposalState;

  return (
    <div className="drafting-chat-proposal">
      <div className="drafting-chat-proposal__bar">
        <button
          type="button"
          className="drafting-chat-proposal__toggle"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <ChevronRight
            className={`drafting-chat-proposal__chevron ${isOpen ? 'drafting-chat-proposal__chevron--open' : ''}`}
          />
          <span className="drafting-chat-proposal__label">View changes</span>
          <span className={`drafting-chat-proposal__badge drafting-chat-proposal__badge--${stateLabel}`}>
            {stateLabel}
          </span>
        </button>

        {isPending && (
          <div className="drafting-chat-proposal__actions">
            <button
              type="button"
              className="drafting-chat-proposal__btn drafting-chat-proposal__btn--apply"
              onClick={() => onApply(message.id)}
            >
              Apply
            </button>
            <button
              type="button"
              className="drafting-chat-proposal__btn drafting-chat-proposal__btn--discard"
              onClick={() => onDiscard(message.id)}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {isOpen && (
        <pre className="drafting-chat-proposal__source">
          {message.proposedSource}
        </pre>
      )}
    </div>
  );
}
