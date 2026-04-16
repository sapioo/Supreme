import { useState, useEffect } from 'react';
import { getSessions, deleteSession } from '../../services/sessionStorage';
import './ArchiveSection.css';

const DIFFICULTY_LABELS = { easy: 'Junior', medium: 'Senior', hard: 'Counsel' };
const SIDE_LABELS = { petitioner: 'Petitioner', respondent: 'Respondent' };

function downloadSession(s) {
  const lines = [];
  lines.push('═'.repeat(60));
  lines.push(`SUPREME — Session Transcript`);
  lines.push('═'.repeat(60));
  lines.push(`Case:       ${s.caseName}`);
  lines.push(`Date:       ${new Date(s.timestamp).toLocaleString('en-IN')}`);
  lines.push(`Side:       ${SIDE_LABELS[s.side] || s.side}`);
  lines.push(`Difficulty: ${DIFFICULTY_LABELS[s.difficulty] || s.difficulty}`);
  lines.push(`Result:     ${s.winner === 'user' ? 'WON' : 'LOST'} (${s.userTotal} — ${s.aiTotal})`);
  lines.push('─'.repeat(60));
  lines.push('');

  let currentRound = 0;
  for (const entry of s.transcript) {
    if (entry.round !== currentRound) {
      currentRound = entry.round;
      lines.push(`ROUND ${currentRound}`);
      lines.push('─'.repeat(30));
    }
    const speaker = entry.side === 'user' ? 'YOU' : 'AI COUNSEL';
    lines.push(`[${speaker}]`);
    lines.push(entry.text);
    lines.push('');
  }

  lines.push('═'.repeat(60));
  lines.push('End of transcript');

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `supreme-${s.caseId || 'session'}-${s.id}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ArchiveSection() {
  const [sessions, setSessions] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    setSessions(getSessions());
  }, []);

  const handleDelete = (e, id) => {
    e.stopPropagation();
    deleteSession(id);
    setSessions(getSessions());
    if (expanded === id) setExpanded(null);
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (sessions.length === 0) {
    return (
      <div className="archive__empty">
        <span className="archive__empty-icon">📜</span>
        <p>No sessions archived yet. Complete a case to see your record here.</p>
      </div>
    );
  }

  return (
    <div className="archive">
      {sessions.map((s) => (
        <div
          key={s.id}
          className={`archive__item ${expanded === s.id ? 'archive__item--open' : ''}`}
        >
          {/* Header row */}
          <button
            className="archive__header"
            onClick={() => setExpanded(expanded === s.id ? null : s.id)}
          >
            <div className="archive__meta">
              <span className={`archive__verdict archive__verdict--${s.winner}`}>
                {s.winner === 'user' ? '✓ Won' : '✗ Lost'}
              </span>
              <span className="archive__case">{s.caseName}</span>
            </div>
            <div className="archive__info">
              <span className="archive__tag">{SIDE_LABELS[s.side] || s.side}</span>
              <span className="archive__tag archive__tag--diff">{DIFFICULTY_LABELS[s.difficulty] || s.difficulty}</span>
              <span className="archive__score">{s.userTotal} — {s.aiTotal}</span>
              <span className="archive__date">{formatDate(s.timestamp)}</span>
              <button
                className="archive__delete"
                onClick={(e) => handleDelete(e, s.id)}
                title="Delete session"
              >✕</button>
            </div>
            <span className="archive__chevron">{expanded === s.id ? '▲' : '▼'}</span>
          </button>

          {/* Transcript */}
          {expanded === s.id && (
            <div className="archive__transcript">
              <div className="archive__transcript-toolbar">
                <button
                  className="archive__download-btn"
                  onClick={(e) => { e.stopPropagation(); downloadSession(s); }}
                  title="Download transcript as .txt"
                >
                  ↓ Download .txt
                </button>
              </div>
              {s.transcript.map((entry, i) => (
                <div key={i} className={`archive__entry archive__entry--${entry.side}`}>
                  <span className="archive__entry-label">
                    {entry.side === 'user' ? 'You' : 'AI Counsel'} · Round {entry.round}
                  </span>
                  <p className="archive__entry-text">{entry.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
