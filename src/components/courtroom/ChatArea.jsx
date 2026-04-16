import { useRef, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import ArgumentBubble from './ArgumentBubble';

function VoiceHalfPanel({
  role,
  partyName,
  isUser,
  isActive,
  voiceEnabled,
  isCallActive,
  connectionStatus,
  onStartVoice,
  onStopVoice,
  isLeft,
  liveSubtitle,
}) {
  const canControlVoice = isUser && voiceEnabled;
  const isUserVoiceLive = isUser && isCallActive;
  const statusText = isUser
    ? connectionStatus === 'connected'
      ? isUserVoiceLive
        ? 'Microphone live'
        : 'Ready to speak'
      : connectionStatus === 'connecting'
        ? 'Connecting voice session...'
        : 'Voice idle'
    : isActive
      ? 'Opposing counsel is speaking'
      : 'Opposing counsel is waiting';
  const shouldShowConnectionBadge = isUser && connectionStatus !== 'idle';
  const connectionBadgeText = connectionStatus === 'connected'
    ? 'Live session'
    : connectionStatus === 'connecting'
      ? 'Connecting'
      : connectionStatus;

  const handleVoiceClick = () => {
    if (!canControlVoice) return;

    if (isCallActive) {
      onStopVoice?.();
    } else {
      onStartVoice?.();
    }
  };

  const isOpposingWaiting = !isUser && !isActive;

  return (
    <section
      className={cn(
        "relative flex min-h-0 flex-col items-center justify-center gap-5 overflow-hidden px-6 py-10",
        isLeft ? "border-b border-zinc-800 md:border-b-0 md:border-r" : ""
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0",
          isUser ? "bg-zinc-100/[0.02]" : "bg-zinc-700/[0.08]",
          isOpposingWaiting && "bg-red-950/10"
        )}
      />

      <div className="relative text-center">
        <p className={cn(
          "text-[11px] uppercase tracking-[0.18em]",
          isOpposingWaiting ? "text-red-400/70" : "text-zinc-500"
        )}>{role}</p>
        <h3 className={cn(
          "mt-2 text-base font-medium sm:text-lg",
          isOpposingWaiting ? "text-red-300" : "text-zinc-100"
        )}>{partyName || `${role} Counsel`}</h3>
      </div>

      {canControlVoice ? (
        <button
          className={cn(
            "relative z-10 flex h-28 w-28 items-center justify-center rounded-full border-2 transition-all duration-300",
            "border-zinc-700 bg-zinc-900/70 hover:border-zinc-500",
            isUserVoiceLive && "border-zinc-300 bg-zinc-800",
            isActive && "scale-105"
          )}
          type="button"
          onClick={handleVoiceClick}
          aria-label={`${role} voice controls`}
        >
          {isUserVoiceLive && (
            <span className="absolute inset-0 rounded-full border border-zinc-200/40 animate-ping" style={{ animationDuration: '2s' }} />
          )}
          <svg
            className={cn(
              "relative z-10 h-9 w-9 transition-colors",
              isUserVoiceLive ? "text-zinc-100" : "text-zinc-400"
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
      ) : (
        <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/40">
          <span
            className={cn(
              "h-4 w-4 rounded-full bg-zinc-600",
              isActive && "animate-pulse bg-red-400 shadow-[0_0_14px_rgba(248,113,113,0.55)]"
            )}
          />
        </div>
      )}

      <Card className="relative w-full max-w-xs border-zinc-800 bg-zinc-900/45 px-4 py-3 text-center shadow-none">
        <p className={cn(
          "text-[11px] uppercase tracking-[0.16em]",
          isOpposingWaiting ? "text-red-400/60" : "text-zinc-400"
        )}>{statusText}</p>
        {!!liveSubtitle && !isUser && isActive && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-300/90">
            {liveSubtitle}
          </p>
        )}
        {shouldShowConnectionBadge && (
          <Badge
            variant="secondary"
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em]",
              connectionStatus === 'connected'
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                : "border-zinc-700 bg-zinc-800 text-zinc-300"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                connectionStatus === 'connected' ? "bg-emerald-300" : "bg-zinc-400",
                connectionStatus === 'connecting' && "animate-pulse"
              )}
            />
            {connectionBadgeText}
          </Badge>
        )}
      </Card>
    </section>
  );
}

export default function ChatArea({
  arguments: args,
  isAiTyping,
  currentRound,
  viewMode = 'voice',
  selectedSide,
  aiSide,
  petitioner,
  respondent,
  userParty,
  aiParty,
  voiceEnabled,
  isCallActive,
  isUserSpeaking,
  isAssistantSpeaking,
  connectionStatus,
  onStartVoice,
  onStopVoice,
  assistantLiveTranscript,
}) {
  const chatEndRef = useRef(null);
  const isChatMode = viewMode === 'chat';
  const leftIsUser = selectedSide === 'petitioner';
  const rightIsUser = selectedSide === 'respondent';
  const leftPartyName = petitioner?.name;
  const rightPartyName = respondent?.name;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [args, isAiTyping, viewMode]);

  if (!isChatMode) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-[#171717]" id="chat-area">
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2">
          <VoiceHalfPanel
            role="Petitioner"
            partyName={leftPartyName}
            isUser={leftIsUser}
            isActive={leftIsUser ? isUserSpeaking : aiSide === 'petitioner' && isAssistantSpeaking}
            voiceEnabled={voiceEnabled}
            isCallActive={isCallActive}
            connectionStatus={connectionStatus}
            onStartVoice={onStartVoice}
            onStopVoice={onStopVoice}
            isLeft={true}
            liveSubtitle={aiSide === 'petitioner' ? assistantLiveTranscript : ''}
          />

          <VoiceHalfPanel
            role="Respondent"
            partyName={rightPartyName}
            isUser={rightIsUser}
            isActive={rightIsUser ? isUserSpeaking : aiSide === 'respondent' && isAssistantSpeaking}
            voiceEnabled={voiceEnabled}
            isCallActive={isCallActive}
            connectionStatus={connectionStatus}
            onStartVoice={onStartVoice}
            onStopVoice={onStopVoice}
            isLeft={false}
            liveSubtitle={aiSide === 'respondent' ? assistantLiveTranscript : ''}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#0d0d0d]" id="chat-area">
      {/* Messages */}
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
        {args.length === 0 && !isAiTyping && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/50 border border-zinc-700/50">
              <svg className="h-6 w-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-zinc-300 font-medium mb-2">Court in Session</h3>
            <p className="text-zinc-500 text-sm max-w-sm">
              Present your opening argument to begin the proceedings.
            </p>
          </div>
        )}

        <div className="mx-auto max-w-3xl space-y-6">
          {args.map((arg, index) => (
            <ArgumentBubble
              key={index}
              side={arg.side}
              text={arg.text}
              round={arg.round}
              layout={viewMode}
              sideName={arg.side === 'user' ? userParty?.name : aiParty?.name}
            />
          ))}

          {isAiTyping && (
            <ArgumentBubble
              side="ai"
              text=""
              round={currentRound}
              isTyping={true}
              layout={viewMode}
              sideName={aiParty?.name}
            />
          )}
        </div>

        <div ref={chatEndRef} className="h-4" />
      </div>
    </div>
  );
}
