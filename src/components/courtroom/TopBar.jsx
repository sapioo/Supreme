import './TopBar.css';

export default function TopBar({
  currentRound,
  totalRounds,
  onEndCase,
}) {
  const isSingleRound = totalRounds === 1;
  const roundLabel = isSingleRound
    ? 'Final Round'
    : `Round ${currentRound} of ${totalRounds}`;

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
          {isSingleRound ? (
            <span className="topbar__round-total">{roundLabel}</span>
          ) : (
            <>
              <span className="topbar__round-current">{currentRound}</span>
              <span className="topbar__round-sep">of</span>
              <span className="topbar__round-total">{totalRounds}</span>
            </>
          )}
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

      {/* Right: End Case */}
      <div className="topbar__right">
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
