import { useState, useEffect } from 'react';
import { useGameDispatch } from '../../context/GameContext';
import './ChooseSide.css';

const DIFFICULTIES = [
  {
    id: 'easy',
    label: 'Junior Counsel',
    desc: 'Brief arguments, easier to counter',
    icon: '§',
    tokens: 150,
  },
  {
    id: 'medium',
    label: 'Senior Advocate',
    desc: 'Balanced, well-structured arguments',
    icon: '⚖',
    tokens: 300,
  },
  {
    id: 'hard',
    label: 'Senior Counsel',
    desc: 'Exhaustive, citation-heavy arguments',
    icon: '⚜',
    tokens: 550,
  },
];

export default function ChooseSide({ caseData, onSelectSide, onBack }) {
  const dispatch = useGameDispatch();
  const [hoveredSide, setHoveredSide] = useState(null);
  const [selectedSide, setSelectedSide] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => {
      setIsAnimatingIn(true);
    });
  }, []);

  const handleSelect = (side) => {
    setSelectedSide(side);
    // Persist difficulty to global state before transitioning
    dispatch({ type: 'SET_DIFFICULTY', payload: difficulty });

    setTimeout(() => setIsAnimatingOut(true), 600);
    setTimeout(() => onSelectSide(side), 1400);
  };

  const handleBack = () => {
    setIsAnimatingOut(true);
    setTimeout(() => onBack(), 500);
  };

  if (!caseData) return null;

  const handleKeySelect = (event, side) => {
    if (selectedSide) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelect(side);
    }
  };

  return (
    <div className={`choose-side ${isAnimatingIn ? 'choose-side--in' : ''} ${isAnimatingOut ? 'choose-side--out' : ''}`} id="choose-side-modal">
      <div className="choose-side__backdrop" />

      <button className="choose-side__back" onClick={handleBack} id="back-to-cases-btn">
        ← Back to Cases
      </button>

      <div className="choose-side__header">
        <p className="choose-side__eyebrow">Active Litigation Proceeding</p>
        <h2 className="choose-side__case-name">{caseData.shortName}</h2>
        <p className="choose-side__case-year">{caseData.year} · {caseData.court}</p>
        <div className="choose-side__header-tags">
          <span>{caseData.tags[0]}</span>
          <span>{caseData.court}</span>
        </div>
      </div>

      <h3 className="choose-side__title">Choose Counsel</h3>

      <div className="choose-side__arena">
        <div
          className={`choose-side__side choose-side__side--petitioner
            ${hoveredSide === 'petitioner' ? 'choose-side__side--active' : ''}
            ${hoveredSide === 'respondent' ? 'choose-side__side--dimmed' : ''}
            ${selectedSide === 'petitioner' ? 'choose-side__side--selected' : ''}
            ${selectedSide === 'respondent' ? 'choose-side__side--rejected' : ''}
          `}
          onMouseEnter={() => !selectedSide && setHoveredSide('petitioner')}
          onMouseLeave={() => !selectedSide && setHoveredSide(null)}
          onClick={() => !selectedSide && handleSelect('petitioner')}
          onKeyDown={(event) => handleKeySelect(event, 'petitioner')}
          id="choose-petitioner"
          role="button"
          tabIndex={0}
        >
          <div className="choose-side__side-inner">
            <div className="choose-side__side-label">The Petitioner</div>
            <h4 className="choose-side__side-name">{caseData.petitioner.name}</h4>
            <div className="choose-side__side-divider" />
            <p className="choose-side__side-position">{caseData.petitioner.position}</p>
            <p className="choose-side__side-description">{caseData.petitioner.description}</p>

            <div className="choose-side__side-preview">
              <span className="choose-side__side-preview-label">Primary Contention</span>
              <p className="choose-side__side-preview-text">
                "{caseData.petitioner.keyArgs[0].substring(0, 120)}..."
              </p>
            </div>

            <button className="choose-side__side-btn" tabIndex={-1}>
              Select Petitioner
            </button>
          </div>

          <div className="choose-side__side-glow" />
        </div>

        <div className={`choose-side__vs ${hoveredSide ? 'choose-side__vs--active' : ''}`}>
          <div className="choose-side__vs-emblem">
            <div className="choose-side__vs-ring choose-side__vs-ring--1" />
            <div className="choose-side__vs-ring choose-side__vs-ring--2" />
            <div className="choose-side__vs-ring choose-side__vs-ring--3" />
            <div className="choose-side__vs-crack" />
            <span className="choose-side__vs-text">VS</span>
          </div>
        </div>

        <div
          className={`choose-side__side choose-side__side--respondent
            ${hoveredSide === 'respondent' ? 'choose-side__side--active' : ''}
            ${hoveredSide === 'petitioner' ? 'choose-side__side--dimmed' : ''}
            ${selectedSide === 'respondent' ? 'choose-side__side--selected' : ''}
            ${selectedSide === 'petitioner' ? 'choose-side__side--rejected' : ''}
          `}
          onMouseEnter={() => !selectedSide && setHoveredSide('respondent')}
          onMouseLeave={() => !selectedSide && setHoveredSide(null)}
          onClick={() => !selectedSide && handleSelect('respondent')}
          onKeyDown={(event) => handleKeySelect(event, 'respondent')}
          id="choose-respondent"
          role="button"
          tabIndex={0}
        >
          <div className="choose-side__side-inner">
            <div className="choose-side__side-label">The Respondent</div>
            <h4 className="choose-side__side-name">{caseData.respondent.name}</h4>
            <div className="choose-side__side-divider" />
            <p className="choose-side__side-position">{caseData.respondent.position}</p>
            <p className="choose-side__side-description">{caseData.respondent.description}</p>

            <div className="choose-side__side-preview">
              <span className="choose-side__side-preview-label">Defense Strategy</span>
              <p className="choose-side__side-preview-text">
                "{caseData.respondent.keyArgs[0].substring(0, 120)}..."
              </p>
            </div>

            <button className="choose-side__side-btn" tabIndex={-1}>
              Select Respondent
            </button>
          </div>

          <div className="choose-side__side-glow" />
        </div>
      </div>

      {/* Difficulty selector */}
      <div className="choose-side__difficulty">
        <p className="choose-side__difficulty-label">Opposing Counsel Intensity</p>
        <div className="choose-side__difficulty-options">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              className={`choose-side__diff-btn choose-side__diff-btn--${d.id} ${difficulty === d.id ? 'choose-side__diff-btn--active' : ''}`}
              onClick={() => !selectedSide && setDifficulty(d.id)}
              disabled={!!selectedSide}
            >
              <span className="choose-side__diff-icon">{d.icon}</span>
              <span className="choose-side__diff-name">{d.label}</span>
              <span className="choose-side__diff-desc">{d.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <footer className="choose-side__footnote">
        <span>Jurisprudential Integrity Verified</span>
        <span>Case Ref: {caseData.id}</span>
      </footer>
    </div>
  );
}
