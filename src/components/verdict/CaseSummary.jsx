import { useState } from 'react';
import './CaseSummary.css';

export default function CaseSummary({ arguments: args, caseData, selectedSide }) {
  const [expandedRound, setExpandedRound] = useState(null);

  // Group arguments by round
  const rounds = [];
  const maxRound = Math.max(...args.map(a => a.round), 0);

  for (let r = 1; r <= maxRound; r++) {
    const roundArgs = args.filter(a => a.round === r);
    rounds.push({ round: r, arguments: roundArgs });
  }

  const toggleRound = (round) => {
    setExpandedRound(expandedRound === round ? null : round);
  };

  return (
    <div className="case-summary" id="case-summary">
      <h3 className="case-summary__title">Case Summary</h3>
      <p className="case-summary__subtitle">
        {caseData?.shortName} — You argued as {selectedSide === 'petitioner' ? 'Petitioner' : 'Respondent'}
      </p>

      <div className="case-summary__rounds">
        {rounds.map(({ round, arguments: roundArgs }) => (
          <div
            key={round}
            className={`case-summary__round ${expandedRound === round ? 'case-summary__round--expanded' : ''}`}
          >
            <button
              className="case-summary__round-header"
              onClick={() => toggleRound(round)}
            >
              <span className="case-summary__round-num">Round {round}</span>
              <span className="case-summary__round-toggle">
                {expandedRound === round ? '−' : '+'}
              </span>
            </button>

            {expandedRound === round && (
              <div className="case-summary__round-content">
                {roundArgs.map((arg, i) => (
                  <div
                    key={i}
                    className={`case-summary__arg ${arg.side === 'user' ? 'case-summary__arg--user' : 'case-summary__arg--ai'}`}
                  >
                    <div className="case-summary__arg-header">
                      <span className="case-summary__arg-dot" />
                      <span className="case-summary__arg-label">
                        {arg.side === 'user' ? 'Your Submission' : 'Opposing Counsel'}
                      </span>
                    </div>
                    <p className="case-summary__arg-text">{arg.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
