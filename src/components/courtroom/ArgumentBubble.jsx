import { cn } from "@/lib/utils";

export default function ArgumentBubble({ side, text, round, isTyping, layout = 'court', sideName }) {
  const isUser = side === 'user';
  const sideLabel = isUser ? 'You' : 'Opposing Counsel';
  const timestamp = new Date().toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  return (
    <div className={cn('group flex w-full gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold',
        isUser 
          ? 'bg-zinc-700 text-zinc-200' 
          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
      )}>
        {isUser ? 'Y' : 'O'}
      </div>

      {/* Content */}
      <div className={cn('flex min-w-0 flex-col', isUser ? 'items-end' : 'items-start')}>
        {/* Header */}
        <div className="mb-1 flex items-center gap-2">
          <span className={cn(
            'text-xs font-medium',
            isUser ? 'text-zinc-200' : 'text-zinc-400'
          )}>
            {sideLabel}
          </span>
          {sideName && (
            <span className="text-xs text-zinc-500">
              {sideName}
            </span>
          )}
          <span className="text-[10px] text-zinc-600">{timestamp}</span>
        </div>

        {/* Message */}
        <div className={cn(
          'relative max-w-[85vw] px-4 py-3 text-[15px] leading-relaxed sm:max-w-[600px]',
          isUser 
            ? 'rounded-2xl rounded-tr-sm bg-zinc-800 text-zinc-100' 
            : 'rounded-2xl rounded-tl-sm bg-zinc-900/50 text-zinc-300 border border-zinc-800/50',
          layout === 'chat' && 'sm:max-w-[520px]'
        )}>
          {isTyping ? (
            <div className="flex items-center gap-3 py-1">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm text-zinc-500">Transcribing...</span>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words">
              {text}
            </p>
          )}
        </div>

        {/* Round indicator */}
        <div className="mt-1.5 text-[10px] text-zinc-600">
          Round {round}
        </div>
      </div>
    </div>
  );
}
