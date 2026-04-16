import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Mic, Keyboard, Volume2, VolumeX, Loader2 } from "lucide-react";
import { PromptBox } from "@/components/ui/chatgpt-prompt-input";

export default function ArgumentInput({
  onSubmit,
  disabled,
  roundComplete = false,
  currentRound,
  totalRounds,
  selectedSide,
  voiceEnabled = false,
  isVoiceMode = false,
  onToggleVoiceMode,
  isCallActive = false,
  isMuted = false,
  isUserSpeaking = false,
  connectionStatus = 'idle',
  onStartVoice,
  onStopVoice,
  onToggleMute,
}) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim().length < 20 || disabled || roundComplete) return;
    onSubmit(text.trim());
    setText('');
  };

  const isLastRound = currentRound === totalRounds;

  return (
    <div className="border-t border-zinc-800 bg-[#171717] p-4" id="argument-input">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-zinc-300" />
          <span className="text-[11px] uppercase tracking-[0.15em] text-zinc-400">
            Arguing as {selectedSide === 'petitioner' ? 'Petitioner' : 'Respondent'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {voiceEnabled && (
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-7 border-zinc-700 px-2 text-[10px] uppercase tracking-wider",
                isVoiceMode && "border-zinc-500 bg-zinc-800 text-zinc-100"
              )}
              onClick={onToggleVoiceMode}
              id="voice-text-toggle"
            >
              {isVoiceMode ? <Keyboard className="w-3 h-3 mr-1" /> : <Mic className="w-3 h-3 mr-1" />}
              {isVoiceMode ? 'Type Instead' : 'Use Voice'}
            </Button>
          )}

            <span className="text-[10px] text-zinc-500">
              {roundComplete
                ? 'Round complete - click Proceed to Round'
                : disabled
                ? 'Awaiting opposing counsel...'
                : isVoiceMode
                  ? isCallActive ? 'Speak your argument' : 'Press mic to begin'
                  : 'Ctrl + Enter to submit'}
          </span>
        </div>
      </div>

      {/* Voice Mode UI */}
      {isVoiceMode ? (
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          {/* Microphone button */}
          <button
            className={cn(
              "relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300",
              "bg-zinc-800 border-2 border-zinc-700 hover:border-zinc-600",
              isCallActive && "border-amber-500 bg-amber-500/10 shadow-[0_0_30px_rgba(233,193,118,0.3)]",
              isUserSpeaking && "scale-110",
              connectionStatus === 'connecting' && "animate-pulse"
            )}
            onClick={isCallActive ? onStopVoice : onStartVoice}
            disabled={disabled || connectionStatus === 'connecting'}
            id="mic-button"
          >
            {/* Pulse rings when active */}
            {isCallActive && (
              <>
                <span className="absolute inset-0 rounded-full border border-amber-500/30 animate-ping" style={{ animationDuration: '2s' }} />
                <span className="absolute inset-2 rounded-full border border-amber-500/20 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
              </>
            )}
            <span className="relative z-10 text-2xl">
              {connectionStatus === 'connecting' ? (
                <Loader2 className="h-6 w-6 animate-spin text-zinc-200" />
              ) : isCallActive ? (
                <span className="block h-4 w-4 rounded-full bg-zinc-200" />
              ) : (
                <Mic className="h-6 w-6 text-zinc-400" />
              )}
            </span>
          </button>

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-2 h-2 rounded-full",
                isCallActive ? "bg-zinc-200 animate-pulse" : "bg-zinc-600"
              )} />
            <span className="text-xs text-zinc-400">
              {connectionStatus === 'connecting' && 'Connecting to courtroom...'}
              {connectionStatus === 'connected' && isUserSpeaking && 'Recording your argument...'}
              {connectionStatus === 'connected' && !isUserSpeaking && 'Listening — speak when ready'}
              {connectionStatus === 'idle' && 'Press to start voice session'}
              {connectionStatus === 'error' && 'Connection error — try again'}
            </span>
          </div>

          {/* Mute toggle */}
          {isCallActive && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-3",
                isMuted ? "text-zinc-100" : "text-zinc-400"
              )}
              onClick={onToggleMute}
              id="mute-toggle"
            >
              {isMuted ? <VolumeX className="w-4 h-4 mr-1" /> : <Volume2 className="w-4 h-4 mr-1" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>
          )}
        </div>
      ) : (
        /* Text Mode UI */
        <PromptBox
          value={text}
          onChange={(event) => setText(event.target.value)}
          onSubmit={handleSubmit}
          disabled={disabled}
          submitDisabled={disabled || roundComplete}
          minLength={20}
          submitLabel={isLastRound ? 'Final Submission' : 'Submit Argument'}
          placeholder=""
          id="argument-textarea"
        />
      )}
    </div>
  );
}
