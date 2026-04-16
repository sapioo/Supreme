import { useState, useEffect } from 'react';
import './Scorecard.css';

const categories = [
  { key: 'legalReasoning', label: 'Legal Reasoning', icon: '§' },
  { key: 'useOfPrecedent', label: 'Use of Precedent', icon: '⚖' },
  { key: 'persuasiveness', label: 'Persuasiveness', icon: '◈' },
  { key: 'constitutionalValidity', label: 'Constitutional Validity', icon: '☆' },
];

export default function Scorecard({ roundScores }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 300);
    return () => clearTimeout(t);
  }, []);

  // Calculate aggregate scores per category
  const aggregates = categories.map(cat => {
    const userTotal = roundScores.reduce((sum, r) => sum + (r.userScore[cat.key] || 0), 0);
    const aiTotal = roundScores.reduce((sum, r) => sum + (r.aiScore[cat.key] || 0), 0);
    const maxPossible = roundScores.length * 100;
    return {
      ...cat,
      userTotal,
      aiTotal,
      userPercent: (userTotal / maxPossible) * 100,
      aiPercent: (aiTotal / maxPossible) * 100,
      winner: userTotal >= aiTotal ? 'user' : 'ai',
    };
  });

  return (
    <div className="scorecard" id="scorecard">
      <h3 className="scorecard__title">Detailed Scorecard</h3>

      {/* Aggregate bars */}
      <div className="scorecard__categories">
        {aggregates.map((cat, index) => (
          <div key={cat.key} className="scorecard__cat" style={{ animationDelay: `${index * 0.15}s` }}>
            <div className="scorecard__cat-header">
              <span className="scorecard__cat-icon">{cat.icon}</span>
              <span className="scorecard__cat-label">{cat.label}</span>
              <span className={`scorecard__cat-winner ${cat.winner === 'user' ? 'scorecard__cat-winner--user' : 'scorecard__cat-winner--ai'}`}>
                {cat.winner === 'user' ? 'You' : 'AI'}
              </span>
            </div>
            <div className="scorecard__cat-bars">
              <div className="scorecard__cat-bar-row">
                <span className="scorecard__cat-side-label">You</span>
                <div className="scorecard__cat-track">
                  <div
                    className="scorecard__cat-fill scorecard__cat-fill--user"
                    style={{ width: animate ? `${cat.userPercent}%` : '0%' }}
                  />
                </div>
                <span className="scorecard__cat-value scorecard__cat-value--user">{cat.userTotal}</span>
              </div>
              <div className="scorecard__cat-bar-row">
                <span className="scorecard__cat-side-label">AI</span>
                <div className="scorecard__cat-track">
                  <div
                    className="scorecard__cat-fill scorecard__cat-fill--ai"
                    style={{ width: animate ? `${cat.aiPercent}%` : '0%' }}
                  />
                </div>
                <span className="scorecard__cat-value scorecard__cat-value--ai">{cat.aiTotal}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Per-round breakdown */}
      <div className="scorecard__rounds">
        <h4 className="scorecard__rounds-title">Round-by-Round</h4>
        <div className="scorecard__rounds-grid">
          {roundScores.map((r, i) => {
            const userTotal = Object.values(r.userScore).reduce((a, b) => a + b, 0);
            const aiTotal = Object.values(r.aiScore).reduce((a, b) => a + b, 0);
            const winner = userTotal >= aiTotal ? 'user' : 'ai';
            return (
              <div key={i} className="scorecard__round-card" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
                <span className="scorecard__round-num">R{r.round}</span>
                <div className="scorecard__round-scores">
                  <span className={`scorecard__round-score ${winner === 'user' ? 'scorecard__round-score--winner' : ''}`}>
                    {userTotal}
                  </span>
                  <span className="scorecard__round-vs">vs</span>
                  <span className={`scorecard__round-score scorecard__round-score--ai ${winner === 'ai' ? 'scorecard__round-score--winner' : ''}`}>
                    {aiTotal}
                  </span>
                </div>
                <span className={`scorecard__round-result ${winner === 'user' ? 'scorecard__round-result--win' : 'scorecard__round-result--lose'}`}>
                  {winner === 'user' ? 'Won' : 'Lost'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
