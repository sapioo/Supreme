import './ChooseSide.css';

export default function ChooseSide({ caseData, selectedSide, onSelectSide }) {
  if (!caseData) return null;

  const handleKeySelect = (event, side) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectSide(side);
    }
  };

  const sideCards = [
    {
      key: 'petitioner',
      label: 'Petitioner',
      party: caseData.petitioner,
      previewLabel: 'Primary contention',
      buttonLabel: 'Represent petitioner',
      accentClass: 'choose-side__side--petitioner',
    },
    {
      key: 'respondent',
      label: 'Respondent',
      party: caseData.respondent,
      previewLabel: 'Defense strategy',
      buttonLabel: 'Represent respondent',
      accentClass: 'choose-side__side--respondent',
    },
  ];

  return (
    <section className="choose-side" id="choose-side-step">
      <div className="choose-side__header">
        <div className="choose-side__case-card">
          <p className="choose-side__eyebrow">Selected case</p>
          <h2 className="choose-side__case-name">{caseData.shortName}</h2>
          <p className="choose-side__case-meta">{caseData.year} · {caseData.court}</p>
        </div>
        <p className="choose-side__case-note">Choose one role. AI counsel will take the opposite side automatically.</p>
      </div>

      <div className="choose-side__arena" role="radiogroup" aria-label="Select your role">
        {sideCards.map((side) => {
          const isSelected = selectedSide === side.key;

          return (
            <article
              key={side.key}
              className={`choose-side__side ${side.accentClass} ${isSelected ? 'choose-side__side--selected' : ''}`}
              onClick={() => onSelectSide(side.key)}
              onKeyDown={(event) => handleKeySelect(event, side.key)}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              aria-label={`Choose ${side.label}`}
            >
              <div className="choose-side__side-head">
                <p className="choose-side__side-label">{side.label}</p>
                <span className={`choose-side__select-indicator ${isSelected ? 'choose-side__select-indicator--selected' : ''}`} aria-hidden="true" />
              </div>

              <h3 className="choose-side__side-name">{side.party.name}</h3>
              <p className="choose-side__side-position">{side.party.position}</p>
              <p className="choose-side__side-description">{side.party.description}</p>

              <div className="choose-side__side-preview">
                <span className="choose-side__side-preview-label">{side.previewLabel}</span>
                <p className="choose-side__side-preview-text">
                  "{side.party.keyArgs[0].substring(0, 130)}..."
                </p>
              </div>

              <span className="choose-side__side-btn" aria-hidden="true">
                {isSelected ? `Selected: ${side.label}` : side.buttonLabel}
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
