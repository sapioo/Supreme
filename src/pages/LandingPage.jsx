import { useMemo, useState } from 'react';
import CaseGrid from '../components/landing/CaseGrid';
import cases from '../data/cases';
import './LandingPage.css';

export default function LandingPage({ onSelectCase, selectedCase }) {
  const [query, setQuery] = useState('');

  const filteredCases = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return cases;

    return cases.filter((item) => {
      return (
        item.shortName.toLowerCase().includes(trimmed)
        || item.name.toLowerCase().includes(trimmed)
        || item.tags.some((tag) => tag.toLowerCase().includes(trimmed))
      );
    });
  }, [query]);

  const selectionLabel = useMemo(() => {
    if (!selectedCase) {
      return 'No case selected yet';
    }

    return `${selectedCase.shortName} · ${selectedCase.year}`;
  }, [selectedCase]);

  return (
    <section className="landing-step" id="landing-step">
      <div className="landing-step__head">
        <h2 className="landing-step__title">Select a case to start with.</h2>
        
      </div>

      <section className="landing-step__cases">
        <div className="landing-step__cases-head">
          <div className="landing-step__selection" aria-live="polite">
            <p className="landing-step__selection-label">Selected case</p>
            <div>
              <h3 className="landing-step__selection-value">{selectionLabel}</h3>
              <p className="landing-step__selection-copy">
                {selectedCase ? selectedCase.summary : 'Choose one case to load facts and arguments.'}
              </p>
            </div>
          </div>

          <label className="landing-step__search" htmlFor="case-search">
            <span className="landing-step__search-label">Search</span>
            <input
              id="case-search"
              type="search"
              placeholder="Search by case, court, or tag"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

        {filteredCases.length === 0 ? (
          <div className="landing-step__empty" role="status">
            <p className="landing-step__empty-title">No cases found</p>
            <p className="landing-step__empty-copy">Try a different keyword or clear the search.</p>
          </div>
        ) : (
          <CaseGrid onSelectCase={onSelectCase} selectedCase={selectedCase} casesData={filteredCases} />
        )}
      </section>
    </section>
  );
}
