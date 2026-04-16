import { useState, useEffect } from 'react';
import './TopBar.css';

export default function TopBar({ caseName, courtBadge, currentRound, totalRounds, timer, onTimerEnd }) {
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
      setTime(prev => {
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

  const progressPercent = ((timer - time) / timer) * 100;

  return (
    <header className="topbar" id="courtroom-topbar">
      {/* Left: Case info */}
      <div className="topbar__case">
        <span className="topbar__badge">{courtBadge}</span>
        <div className="topbar__case-info">
          <h2 className="topbar__case-name">{caseName}</h2>
        </div>
      </div>

      {/* Center: Round */}
      <div className="topbar__round">
        <span className="topbar__round-label">Round</span>
        <div className="topbar__round-display">
          <span className="topbar__round-current">{currentRound}</span>
          <span className="topbar__round-sep">of</span>
          <span className="topbar__round-total">{totalRounds}</span>
        </div>
        {/* Round progress dots */}
        <div className="topbar__round-dots">
          {Array.from({ length: totalRounds }, (_, i) => (
            <span
              key={i}
              className={`topbar__round-dot ${i < currentRound ? 'topbar__round-dot--done' : ''} ${i === currentRound - 1 ? 'topbar__round-dot--active' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* Right: Timer */}
      <div className={`topbar__timer ${isUrgent ? 'topbar__timer--urgent' : ''}`}>
        <span className="topbar__timer-label">Time Remaining</span>
        <span className="topbar__timer-value">{formatTime(time)}</span>
        <div className="topbar__timer-bar">
          <div className="topbar__timer-fill" style={{ width: `${100 - progressPercent}%` }} />
        </div>
      </div>
    </header>
  );
}
