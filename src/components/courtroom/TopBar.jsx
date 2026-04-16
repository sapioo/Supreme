import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function TopBar({
  caseName,
  currentRound,
  totalRounds,
  timer,
  onTimerEnd,
  viewMode = 'voice',
  onViewModeChange,
  onCloseSession,
}) {
  const [time, setTime] = useState(timer);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    setTime(timer);
  }, [timer]);

  useEffect(() => {
    if (time <= 0) {
      onTimerEnd?.();
      return;
    }

    const interval = setInterval(() => {
      setTime((prev) => {
        const next = prev - 1;
        if (next <= 30) setIsUrgent(true);
        else setIsUrgent(false);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [time, onTimerEnd]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const timeRemainingPercent = timer > 0 ? (time / timer) * 100 : 0;
  const isCritical = time > 0 && time <= 15;

  return (
    <Card className="rounded-none border-0 border-b border-zinc-800 bg-[#141414] shadow-none">
      <div className="grid grid-cols-1 items-center gap-3 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-4 sm:px-5 sm:py-4">
<div className="flex items-center gap-2 min-w-0">
           {onCloseSession && (
             <button
               onClick={onCloseSession}
               className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800/80 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-100 hover:bg-zinc-700"
               title="Close session"
             >
               <X className="h-3.5 w-3.5" />
             </button>
           )}
<div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Proceedings of the Court</p>
              <div className="mt-0.5 min-w-0">
                <h1
                  className="truncate font-sans text-sm font-semibold leading-tight tracking-[0.01em] text-zinc-100 sm:text-lg"
                  title={caseName}
                >
                  {caseName}
                </h1>
              </div>
            </div>
          </div>

        <div className="mx-auto w-full max-w-[330px] rounded-md border border-zinc-800 bg-[#171717] px-3 py-2">
          <div className="flex items-end justify-center gap-7">
            <div className="text-center">
              <span className="mb-1 block text-[10px] uppercase tracking-[0.22em] text-zinc-500">Round</span>
              <div className="font-sans text-2xl font-semibold leading-none text-zinc-100">
                {currentRound}
                <span className="mx-1 text-zinc-600">/</span>
                <span className="text-zinc-400">{totalRounds}</span>
              </div>
            </div>

            <div className="text-center">
              <span className="mb-1 block text-[10px] uppercase tracking-[0.22em] text-zinc-500">Time</span>
              <div className={cn(
                "font-mono text-3xl tabular-nums leading-none tracking-tight transition-colors duration-300",
                isCritical ? "text-red-400" : isUrgent ? "text-zinc-300" : "text-zinc-100"
              )}>
                {formatTime(time)}
              </div>
            </div>
          </div>

        </div>

        <div className="flex items-center justify-start gap-2 sm:justify-end">
          <Tabs value={viewMode} onValueChange={(value) => onViewModeChange?.(value)} className="shrink-0">
            <TabsList className="h-10 gap-2 bg-transparent p-0">
              <TabsTrigger
                value="voice"
                className="h-8 min-w-[112px] rounded-md px-3 font-sans text-[13px] font-medium normal-case tracking-normal text-zinc-300 data-[state=active]:bg-zinc-700 data-[state=active]:font-semibold data-[state=active]:text-zinc-100"
              >
                Voice Mode
              </TabsTrigger>
              <TabsTrigger
                value="chat"
                className="h-8 min-w-[106px] rounded-md px-3 font-sans text-[13px] font-medium normal-case tracking-normal text-zinc-300 data-[state=active]:bg-zinc-700 data-[state=active]:font-semibold data-[state=active]:text-zinc-100"
              >
                Chat Mode
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </Card>
  );
}
