import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { ArrowUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import './ai-prompt-box.css';

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef(function TooltipContent(
  { className, sideOffset = 6, ...props },
  ref,
) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn('prompt-input-box__tooltip', className)}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
});

function PromptAction({ tooltip, children }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export const PromptInputBox = React.forwardRef(function PromptInputBox(
  {
    value = '',
    onValueChange,
    onSend,
    isLoading = false,
    placeholder,
    className,
  },
  ref,
) {
  const textareaRef = React.useRef(null);

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = '0px';
    const nextHeight = textarea.scrollHeight;
    textarea.style.height = `${Math.max(nextHeight, 56)}px`;
  }, [value]);

  const hasContent = value.trim().length > 0;

  const handleSubmit = React.useCallback(() => {
    if (!hasContent || isLoading) return;
    onSend?.(value);
  }, [hasContent, isLoading, onSend, value]);

  const handleKeyDown = React.useCallback(
    (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <TooltipProvider delayDuration={120}>
      <div
        ref={ref}
        className={cn('prompt-input-box', className)}
      >
        <div className="prompt-input-box__layout">
          <div className="prompt-input-box__field-wrap">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(event) => onValueChange?.(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder="Ask anything about this draft..."
              className="prompt-input-box__textarea"
            />
          </div>

          <div className="prompt-input-box__actions">
            <PromptAction tooltip={hasContent ? 'Send message' : 'Type a message'}>
              <button
                type="button"
                onClick={handleSubmit}
                className={cn(
                  'prompt-input-box__button',
                  hasContent
                    ? 'prompt-input-box__button--send-ready'
                    : 'prompt-input-box__button--send-idle',
                )}
                disabled={!hasContent || isLoading}
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </PromptAction>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
});
