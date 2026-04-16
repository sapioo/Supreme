import { useState, useEffect, useRef } from 'react';
import './TopBar.css';

export default function TopBar({
  caseName,
  courtBadge,
  currentRound,
  totalRounds,
  timer,
  onTimerEnd,
  isTimerRunning = true,
  timerKey,
  timerLabel,
  onEndCase,
}) {
  const [time, setTime] = useState(timer);
  const hasEndedRef = useRef(false);

  useEffect(() => {
    setTime(timer);
    hasEndedRef.current = false;
  }, [timer, timerKey]);

  useEffect(() => {
    if (!isTimerRunning || time <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTime((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, time]);

  useEffect(() => {
    if (!isTimerRunning) {
      hasEndedRef.current = false;
      return;
    }

    if (time > 0 || hasEndedRef.current) {
      return;
    }

    hasEndedRef.current = true;
    onTimerEnd?.();
  }, [time, isTimerRunning, onTimerEnd]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = timer > 0 ? ((timer - time) / timer) * 100 : 0;
  const isUrgent = isTimerRunning && time <= 30;

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

      {/* Right: Timer + End Case */}
      <div className="topbar__right">
        <div className={`topbar__timer ${isUrgent ? 'topbar__timer--urgent' : ''}`}>
          <span className="topbar__timer-label">{timerLabel || 'Time Remaining'}</span>
          <span className="topbar__timer-value">{formatTime(time)}</span>
          <div className="topbar__timer-bar">
            <div className="topbar__timer-fill" style={{ width: `${100 - progressPercent}%` }} />
          </div>
        </div>

        {onEndCase && (
          <button
            className="topbar__end-btn"
            onClick={onEndCase}
            id="end-case-btn"
            title="End case and receive verdict based on arguments so far"
          >
            <span className="topbar__end-icon">⚖</span>
            <span>End</span>
          </button>
        )}
      </div>
    </header>
  );
}
