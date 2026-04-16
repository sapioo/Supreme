import { useRef, useCallback } from 'react';
import HeroSection from '../components/landing/HeroSection';
import CaseGrid from '../components/landing/CaseGrid';
import './LandingPage.css';

export default function LandingPage({ onSelectCase }) {
  const caseGridRef = useRef(null);

  const handleExplore = useCallback(() => {
    caseGridRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="landing-page" id="landing-page">
      <HeroSection onExplore={handleExplore} />
      <section className="landing-page__cases" ref={caseGridRef}>
        <div className="landing-page__cases-head">
          <h2 className="landing-page__cases-title">Historical Dossiers</h2>
          <div className="landing-page__cases-meta">
            <span>Filter by Jurisdiction</span>
            <span>/</span>
            <span>Sort by Precedent</span>
          </div>
        </div>
        <CaseGrid onSelectCase={onSelectCase} />

        <div className="landing-page__stats texture-paper" aria-label="platform-stats">
          <article className="landing-page__stat">
            <strong>1,240+</strong>
            <span>Precedents Mapped</span>
          </article>
          <article className="landing-page__stat">
            <strong>98.4%</strong>
            <span>AI Accuracy</span>
          </article>
          <article className="landing-page__stat">
            <strong>45k</strong>
            <span>Oral Arguments</span>
          </article>
        </div>
      </section>
    </div>
  );
}
