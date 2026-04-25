import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { ArrowUp, Mic, Square } from 'lucide-react';
import { cn } from '../../lib/utils';

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
        className={cn(
          'z-50 overflow-hidden rounded-md border border-[#333333] bg-[#1F2023] px-3 py-1.5 text-sm text-white shadow-md',
          'data-[state=delayed-open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=delayed-open]:fade-in-0',
          className,
        )}
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

function VoicePulse() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2, 3].map((index) => (
        <Motion.span
          key={index}
          className="block w-1 rounded-full bg-red-400"
          animate={{ height: [8, 18, 10, 16, 8] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index * 0.08,
          }}
        />
      ))}
    </div>
  );
}

export const PromptInputBox = React.forwardRef(function PromptInputBox(
  {
    value = '',
    onValueChange,
    onSend,
    isLoading = false,
    placeholder = 'Type your message here...',
    className,
  },
  ref,
) {
  const [isRecording, setIsRecording] = React.useState(false);
  const textareaRef = React.useRef(null);

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = '0px';
    const nextHeight = Math.min(textarea.scrollHeight, 140);
    textarea.style.height = `${Math.max(nextHeight, 48)}px`;
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
        className={cn(
          'w-full rounded-[28px] border border-[#3c3d42] bg-[#f4efe7] p-2 text-[#16181d]',
          'shadow-[0_12px_36px_rgba(0,0,0,0.22)] transition-all duration-200',
          isRecording && 'border-red-500/60 bg-[#fff5f5]',
          className,
        )}
      >
        <div className="flex min-w-0 items-end gap-2">
          <div className="min-w-0 flex-1 rounded-[22px] bg-transparent px-2 py-1">
            <AnimatePresence initial={false} mode="wait">
              {isRecording ? (
                <Motion.div
                  key="recording"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex min-h-[48px] items-center justify-between rounded-[18px] px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <VoicePulse />
                    <span className="text-sm font-medium text-[#7f1d1d]">
                      Recording...
                    </span>
                  </div>
                  <span className="text-xs uppercase tracking-[0.08em] text-[#b91c1c]">
                    Voice
                  </span>
                </Motion.div>
              ) : (
                <Motion.textarea
                  key="textarea"
                  ref={textareaRef}
                  value={value}
                  onChange={(event) => onValueChange?.(event.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder={placeholder}
                  className={cn(
                    'block w-full resize-none overflow-y-auto border-0 bg-transparent px-3 py-2.5',
                    'text-[17px] leading-[1.45] text-[#16181d] placeholder:text-[#8a8d94]',
                    'focus:outline-none focus:ring-0',
                  )}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <PromptAction tooltip={isRecording ? 'Stop recording' : 'Voice input'}>
              <button
                type="button"
                onClick={() => setIsRecording((current) => !current)}
                className={cn(
                  'inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors',
                  isRecording
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'text-[#5e6167] hover:bg-black/5 hover:text-[#24262b]',
                )}
                disabled={isLoading}
              >
                {isRecording ? (
                  <Square className="h-4 w-4 fill-current" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </button>
            </PromptAction>

            <PromptAction tooltip={hasContent ? 'Send message' : 'Type a message'}>
              <button
                type="button"
                onClick={handleSubmit}
                className={cn(
                  'inline-flex h-10 w-10 items-center justify-center rounded-full transition-all',
                  hasContent
                    ? 'bg-[#16181d] text-white hover:bg-[#2a2d33]'
                    : 'bg-[#d9dbdf] text-[#8b8e96]',
                )}
                disabled={!hasContent || isLoading || isRecording}
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
