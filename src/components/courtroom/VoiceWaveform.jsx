import { useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";

export default function VoiceWaveform({ volumeLevel, isActive, barCount = 24 }) {
  const barsRef = useRef([]);
  const phaseRef = useRef(0);

  useEffect(() => {
    let raf;

    const tick = () => {
      phaseRef.current += 0.08;

      barsRef.current.forEach((bar, i) => {
        if (!bar) return;

        const phase = (i / barCount) * Math.PI * 2 + phaseRef.current;
        const baseHeight = 4;
        const volumeScale = volumeLevel * 95;
        const envelope = 0.55 + ((i % 5) * 0.08);
        const wave = Math.sin(phase) * 0.5 + 0.5;
        const height = baseHeight + volumeScale * wave * envelope;
        bar.style.height = `${Math.min(height, 50)}px`;
      });

      if (isActive) {
        raf = requestAnimationFrame(tick);
      }
    };

    if (isActive) {
      raf = requestAnimationFrame(tick);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [barCount, isActive, volumeLevel]);

  useEffect(() => {
    if (!isActive) return;

    barsRef.current.forEach((bar) => {
      if (!bar) return;
      bar.style.height = '4px';
    });
  }, [isActive]);

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center py-4 transition-opacity duration-300",
        isActive ? "opacity-100" : "opacity-50"
      )} 
      id="voice-waveform"
    >
      <div className="flex items-end justify-center gap-[2px] h-14">
        {Array.from({ length: barCount }, (_, i) => (
          <div
            key={i}
            ref={el => barsRef.current[i] = el}
            className={cn(
              "w-1 rounded-full transition-colors duration-200",
              isActive 
                ? "bg-gradient-to-t from-amber-500/60 to-amber-400 shadow-[0_0_8px_rgba(233,193,118,0.4)]"
                : "bg-zinc-700"
            )}
            style={{
              height: '4px',
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>
      <span className="mt-3 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
        {isActive ? 'Opposing Counsel Speaking...' : 'Awaiting Response'}
      </span>
    </div>
  );
}
