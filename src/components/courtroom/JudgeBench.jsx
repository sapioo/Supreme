import { useState, useEffect } from 'react';
import './JudgeBench.css';

const categories = [
  { key: 'legalReasoning', label: 'Legal Reasoning', icon: '§' },
  { key: 'useOfPrecedent', label: 'Use of Precedent', icon: '⚖' },
  { key: 'persuasiveness', label: 'Persuasiveness', icon: '◈' },
  { key: 'constitutionalValidity', label: 'Constitutional Validity', icon: '☆' },
];

// ── Typewriter hook ─────────────────────────────────────────────────────────
function useTypewriter(text, active, speed = 28) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    if (!active || !text) { setDisplayed(''); return; }
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, active, speed]);

  return displayed;
}

export default function JudgeBench({ roundScores, isVisible }) {
  const [animatedRound, setAnimatedRound] = useState(0);
  const [commentRound, setCommentRound] = useState(0);

  const latestScore = roundScores.length > 0 ? roundScores[roundScores.length - 1] : null;
  const latestRound = latestScore ? latestScore.round : 0;
  const shouldShow = Boolean(latestScore && isVisible);
  const animateScores = shouldShow && animatedRound === latestRound;
  const showComment = shouldShow && commentRound === latestRound;

  const commentText = latestScore?.judgeComment ?? '';
  const typedComment = useTypewriter(commentText, showComment);

  useEffect(() => {
    if (shouldShow) {
      const t1 = setTimeout(() => setAnimatedRound(latestRound), 200);
      const t2 = setTimeout(() => setCommentRound(latestRound), 900);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    return undefined;
  }, [shouldShow, latestRound]);

  const getTotalScore = (scoreObj) => {
    if (!scoreObj) return 0;
    return Object.values(scoreObj).reduce((a, b) => a + b, 0);
  };

  return (
    <div className={`judge-bench ${isVisible ? 'judge-bench--visible' : ''}`} id="judge-bench">
      {/* Bench ornament */}
      <div className="judge-bench__ornament">
        <span className="judge-bench__ornament-line" />
        <span className="judge-bench__ornament-icon">⚜</span>
        <span className="judge-bench__ornament-line" />
      </div>

      <div className="judge-bench__header">
        <h3 className="judge-bench__title">Judge's Bench</h3>
        {latestScore && (
          <span className="judge-bench__round-label">Round {latestScore.round} Scores</span>
        )}
      </div>

      {latestScore ? (
        <>
          {/* Score bars */}
          <div className="judge-bench__scores">
            {categories.map((cat) => {
              const userVal = latestScore.userScore[cat.key] || 0;
              const aiVal = latestScore.aiScore[cat.key] || 0;
              return (
                <div key={cat.key} className="judge-bench__category">
                  <div className="judge-bench__cat-header">
                    <span className="judge-bench__cat-icon">{cat.icon}</span>
                    <span className="judge-bench__cat-label">{cat.label}</span>
                  </div>
                  <div className="judge-bench__bar-row">
                    <span className="judge-bench__bar-value judge-bench__bar-value--user">{userVal}</span>
                    <div className="judge-bench__bar-track">
                      <div
                        className="judge-bench__bar-fill judge-bench__bar-fill--user"
                        style={{ width: animateScores ? `${userVal}%` : '0%' }}
                      />
                    </div>
                    <div className="judge-bench__bar-vs">vs</div>
                    <div className="judge-bench__bar-track">
                      <div
                        className="judge-bench__bar-fill judge-bench__bar-fill--ai"
                        style={{ width: animateScores ? `${aiVal}%` : '0%' }}
                      />
                    </div>
                    <span className="judge-bench__bar-value judge-bench__bar-value--ai">{aiVal}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="judge-bench__totals">
            <div className="judge-bench__total judge-bench__total--user">
              <span className="judge-bench__total-label">You</span>
              <span className="judge-bench__total-value">{getTotalScore(latestScore.userScore)}</span>
            </div>
            <div className="judge-bench__total-divider">—</div>
            <div className="judge-bench__total judge-bench__total--ai">
              <span className="judge-bench__total-label">AI Counsel</span>
              <span className="judge-bench__total-value">{getTotalScore(latestScore.aiScore)}</span>
            </div>
          </div>

          {/* Judge comment — typewriter animation */}
          {showComment && commentText && (
            <div className="judge-bench__comment">
              <span className="judge-bench__comment-gavel">⚖</span>
              <p className="judge-bench__comment-text">
                &ldquo;{typedComment}
                {typedComment.length < commentText.length && (
                  <span className="judge-bench__comment-cursor" />
                )}
                {typedComment.length >= commentText.length && '\u201d'}
              </p>
            </div>
          )}
        </>
      ) : (
        <p className="judge-bench__waiting">
          The Bench awaits the first round of arguments...
        </p>
      )}
    </div>
  );
}
