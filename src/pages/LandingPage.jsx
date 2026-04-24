import { useRef, useCallback, useState } from 'react';
import CaseGrid from '../components/landing/CaseGrid';
import CustomCaseBuilder from '../components/landing/CustomCaseBuilder';
import ArchiveSection from '../components/landing/ArchiveSection';
import './LandingPage.css';

export default function LandingPage({ onSelectCase, onBackHome }) {
  const caseGridRef = useRef(null);
  const archiveRef = useRef(null);
  const [showArchive, setShowArchive] = useState(false);

  const handleBrowseArchive = useCallback(() => {
    setShowArchive(true);
    setTimeout(() => {
      archiveRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, []);

  return (
    <div className="landing-page" id="landing-page">
      <section className="landing-page__cases" ref={caseGridRef}>
        <div className="landing-page__toolbar">
          <button className="landing-page__toolbar-back" onClick={onBackHome}>
            ← Home
          </button>
          <button className="landing-page__toolbar-btn" onClick={handleBrowseArchive}>
            Open Session Archive
          </button>
        </div>

        <div className="landing-page__cases-head">
          <div>
            <p className="landing-page__cases-eyebrow">Practice workspace</p>
            <h2 className="landing-page__cases-title">Historical Dossiers</h2>
          </div>
          <p className="landing-page__cases-copy">
            Select a case and move directly into side selection. Archive and custom case tools stay in this workspace.
          </p>
        </div>
        <CaseGrid onSelectCase={onSelectCase} />

        {/* Custom case builder — below the premade cases */}
        <CustomCaseBuilder onSelectCase={onSelectCase} />

        {/* Archive section — below the case grid */}
        <div className="landing-page__archive-head" ref={archiveRef}>
          <button
            className="landing-page__archive-toggle"
            onClick={() => setShowArchive(v => !v)}
          >
            <span className="landing-page__archive-toggle-icon">{showArchive ? '▲' : '▼'}</span>
            Session Archive
            <span className="landing-page__archive-toggle-sub">Your past battles</span>
          </button>
        </div>

        {showArchive && (
          <div className="landing-page__archive">
            <ArchiveSection />
          </div>
        )}
      </section>
    </div>
  );
}
