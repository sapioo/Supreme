import { useEffect, useRef } from 'react';
import './VoiceWaveform.css';

/**
 * VoiceWaveform — Animated audio visualizer bars
 * Shows volume-reactive bars when the AI assistant is speaking
 */
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
    <div className={`waveform ${isActive ? 'waveform--active' : ''}`} id="voice-waveform">
      <div className="waveform__bars">
        {Array.from({ length: barCount }, (_, i) => (
          <div
            key={i}
            ref={el => barsRef.current[i] = el}
            className="waveform__bar"
            style={{
              animationDelay: `${i * 0.05}s`,
              '--bar-index': i,
            }}
          />
        ))}
      </div>
      <span className="waveform__label">
        {isActive ? 'Opposing Counsel Speaking...' : 'Awaiting Response'}
      </span>
    </div>
  );
}
