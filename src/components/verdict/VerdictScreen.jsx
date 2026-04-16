import { useState, useEffect } from 'react';
import { useGame, useGameDispatch } from '../../context/GameContext';
import ScalesTipping from './ScalesTipping';
import Scorecard from './Scorecard';
import CaseSummary from './CaseSummary';
import './VerdictScreen.css';

export default function VerdictScreen() {
  const state = useGame();
  const dispatch = useGameDispatch();

  const [phase, setPhase] = useState('blackout');    // blackout → announce → scales → scorecard
  const [showScorecard, setShowScorecard] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const verdict = state.verdict;
  const isUserWinner = verdict?.winner === 'user';

  useEffect(() => {
    // Dramatic reveal sequence
    const t1 = setTimeout(() => setPhase('announce'), 1500);
    const t2 = setTimeout(() => setPhase('scales'), 3500);
    const t3 = setTimeout(() => setShowScorecard(true), 5500);
    const t4 = setTimeout(() => setShowSummary(true), 6500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  const handlePlayAgain = () => {
    dispatch({ type: 'RESET' });
  };

  const handleTryDifferent = () => {
    dispatch({ type: 'RESET' });
  };

  if (!verdict) return null;

  return (
    <div className="verdict" id="verdict-screen">
      {/* Blackout overlay */}
      <div className={`verdict__blackout ${phase !== 'blackout' ? 'verdict__blackout--gone' : ''}`} />

      {/* Background */}
      <div className={`verdict__bg ${isUserWinner ? 'verdict__bg--win' : 'verdict__bg--lose'}`} />

      <div className="verdict__scroll-container">
        {/* Judge announcement */}
        {phase !== 'blackout' && (
          <div className="verdict__announce">
            <div className="verdict__announce-ornament">
              <span className="verdict__announce-line" />
              <span className="verdict__announce-icon">⚜</span>
              <span className="verdict__announce-line" />
            </div>
            <p className="verdict__announce-text">
              "Having heard the arguments of both learned counsels, this Court is now prepared to deliver its judgment..."
            </p>
          </div>
        )}

        {/* Scales animation */}
        {(phase === 'scales' || showScorecard) && (
          <ScalesTipping
            winner={verdict.winner}
            userTotal={verdict.userTotal}
            aiTotal={verdict.aiTotal}
          />
        )}

        {/* Winner announcement */}
        {showScorecard && (
          <div className="verdict__winner">
            <h2 className={`verdict__winner-text ${isUserWinner ? 'verdict__winner-text--win' : 'verdict__winner-text--lose'}`}>
              {isUserWinner ? 'JUDGMENT IN YOUR FAVOUR' : 'JUDGMENT AGAINST YOU'}
            </h2>
            <p className="verdict__winner-subtitle">
              {isUserWinner
                ? 'The Court finds that your arguments were more compelling.'
                : 'The opposing counsel presented a stronger case before the Court.'}
            </p>
            <div className="verdict__margin">
              <span className="verdict__margin-label">Final Score</span>
              <span className="verdict__margin-values">
                <span className="verdict__margin-user">{verdict.userTotal}</span>
                <span className="verdict__margin-sep">—</span>
                <span className="verdict__margin-ai">{verdict.aiTotal}</span>
              </span>
            </div>
          </div>
        )}

        {/* Scorecard */}
        {showScorecard && (
          <Scorecard roundScores={state.roundScores} />
        )}

        {/* Case Summary */}
        {showSummary && (
          <CaseSummary
            arguments={state.arguments}
            caseData={state.selectedCase}
            selectedSide={state.selectedSide}
          />
        )}

        {/* Actions */}
        {showSummary && (
          <div className="verdict__actions">
            <button className="verdict__btn verdict__btn--primary" onClick={handlePlayAgain} id="play-again-btn">
              <span>↺</span> Argue This Case Again
            </button>
            <button className="verdict__btn verdict__btn--secondary" onClick={handleTryDifferent} id="try-different-btn">
              <span>←</span> Try a Different Case
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
