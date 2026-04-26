import { useRef, useCallback, useState } from 'react';
import HeroSection from '../components/landing/HeroSection';
import CaseGrid from '../components/landing/CaseGrid';
import ArchiveSection from '../components/landing/ArchiveSection';
import './LandingPage.css';

export default function LandingPage({ onSelectCase, onCustomCase, onFirm }) {
  const caseGridRef = useRef(null);
  const archiveRef = useRef(null);
  const [showArchive, setShowArchive] = useState(false);

  const handleExplore = useCallback(() => {
    caseGridRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleBrowseArchive = useCallback(() => {
    setShowArchive(true);
    setTimeout(() => {
      archiveRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, []);

  return (
    <div className="landing-page" id="landing-page">
      <HeroSection onExplore={handleExplore} onArchive={handleBrowseArchive} onCustomCase={onCustomCase} onFirm={onFirm} />
      <section className="landing-page__cases" ref={caseGridRef}>
        <div className="landing-page__cases-head">
          <div>
            <p className="landing-page__cases-eyebrow">Practice workspace</p>
            <h2 className="landing-page__cases-title">Historical Dossiers</h2>
          </div>
        </div>
        <CaseGrid onSelectCase={onSelectCase} />

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
