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
        <h2>AI Drafting Chat</h2>
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

              {/* Proposal */}
              {message.proposedSource && (
                <div className="drafting-chat-proposal">
                  <div className="drafting-chat-proposal__head">
                    <strong>Proposed full-source rewrite</strong>
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
