import { useState } from 'react';
import './CaseCard.css';

export default function CaseCard({ caseData, index, onSelect }) {
  const [isHovered, setIsHovered] = useState(false);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(caseData);
    }
  };

  const complexityBars = Array.from({ length: 5 }, (_, i) => (
    <span
      key={i}
      className={`case-card__complexity-bar ${i < caseData.difficulty ? 'case-card__complexity-bar--filled' : ''}`}
    />
  ));

  return (
    <article
      className={`case-card ${isHovered ? 'case-card--hovered' : ''}`}
      style={{ animationDelay: `${index * 0.12}s` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(caseData)}
      onKeyDown={handleKeyDown}
      id={`case-card-${caseData.id}`}
      tabIndex={0}
      role="button"
      aria-label={`Select case: ${caseData.shortName}`}
    >
      <div className="case-card__texture" />

      <div className="case-card__head">
        <span className="case-card__year">{caseData.year}</span>
        <span className="case-card__court-pill">{caseData.court}</span>
      </div>

      <div className="case-card__content">
        <h3 className="case-card__name">{caseData.shortName}</h3>

        <p className="case-card__summary">{caseData.summary}</p>

        <div className="case-card__tags">
          {caseData.tags.slice(0, 2).map((tag, i) => (
            <span key={i} className="case-card__tag">{tag}</span>
          ))}
        </div>

        <div className="case-card__difficulty">
          <span className="case-card__difficulty-label">Complexity</span>
          <div className="case-card__complexity">
            {complexityBars}
          </div>
        </div>
      </div>

      <div className="case-card__hover-overlay">
        <span className="case-card__hover-text">Argue This Case</span>
        <span className="case-card__hover-icon" aria-hidden="true">→</span>
      </div>
    </article>
  );
}
