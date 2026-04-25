import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { PromptInputBox } from '../ui/ai-prompt-box';

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
        <h2>
          AI Drafting Chat
        </h2>
        <span>
          {providerStatus}
        </span>
      </div>

      {/* Chat thread */}
      <div className="drafting-chat-thread">
        {/* Empty state */}
        {chatMessages.length === 0 && (
          <div className="drafting-chat-empty">
            <strong>
              Ask the drafting assistant to review, explain, or rewrite this
              document.
            </strong>
            <p>
              If you ask for an edit, the assistant can return a full revised
              LaTeX draft for you to apply explicitly.
            </p>
          </div>
        )}

        {/* Messages */}
        {chatMessages.map((message) => (
          <article
            key={message.id}
            className={`drafting-chat-message ${
              message.role === 'user'
                ? 'drafting-chat-message drafting-chat-message--user'
                : 'drafting-chat-message drafting-chat-message--assistant'
            }`}
          >
            {/* Message head */}
            <div className="drafting-chat-message__head">
              <strong>
                {message.role === 'user' ? 'You' : 'Assistant'}
              </strong>
              {message.role === 'assistant' && message.source && (
                <span>
                  {message.source}
                </span>
              )}
            </div>

            {/* Content */}
            <p className="drafting-chat-message__content">
              {message.content}
            </p>

            {/* Proposal */}
            {message.proposedSource && (
              <div className="drafting-chat-proposal">
                <div className="drafting-chat-proposal__head">
                  <strong>
                    Proposed full-source rewrite
                  </strong>
                  <span>
                    {message.proposalState === 'pending'
                      ? 'Pending'
                      : message.proposalState}
                  </span>
                </div>
                <pre className="drafting-chat-proposal__source">
                  {message.proposedSource}
                </pre>
                {message.proposalState === 'pending' && (
                  <div className="drafting-chat-proposal__actions">
                    <Button
                      size="sm"
                      className="drafting-chat-proposal__button"
                      onClick={() => onApplyProposal(message.id)}
                    >
                      Apply to Source
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="drafting-chat-proposal__button"
                      onClick={() => onDiscardProposal(message.id)}
                    >
                      Discard
                    </Button>
                  </div>
                )}
              </div>
            )}
          </article>
        ))}

        {/* Loading indicator */}
        {isChatLoading && (
          <div className="drafting-chat-loading">
            <span className="drafting-chat-loading__dot" />
            <p>
              Contacting OpenRouter...
            </p>
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
          placeholder="Suggest cleaner structure for this draft"
        />
      </div>
    </Card>
  );
}
