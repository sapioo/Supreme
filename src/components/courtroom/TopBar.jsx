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
  const timerKeyRef = useRef(timerKey);

  // Reset when a new round starts (timerKey changes) or timer prop changes
  useEffect(() => {
    timerKeyRef.current = timerKey;
    setTime(timer);
    hasEndedRef.current = false;
  }, [timer, timerKey]);

  // Single stable interval — only restarts when isTimerRunning or timerKey changes
  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      setTime((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimerRunning, timerKey]);

  // Fire onTimerEnd exactly once per round, guarded by both hasEndedRef and timerKey
  useEffect(() => {
    if (!isTimerRunning || time > 0 || hasEndedRef.current) return;
    // Extra safety: only fire if the timerKey ref still matches (not a stale closure)
    if (timerKeyRef.current !== timerKey) return;
    hasEndedRef.current = true;
    onTimerEnd?.();
  }, [time, isTimerRunning, timerKey, onTimerEnd]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = timer > 0 ? ((timer - time) / timer) * 100 : 0;
  const isUrgent = isTimerRunning && time <= 30;

  return (
    <header className="topbar" id="courtroom-topbar">
      {/* Left: Supreme wordmark */}
      <div className="topbar__case">
        <span className="topbar__wordmark">SUPREME</span>
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
