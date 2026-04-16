import { useState, useEffect, useMemo } from 'react';
import heroImage from '../../assets/hero.png';
import './HeroSection.css';

export default function HeroSection({ onExplore }) {
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setReveal(true), 250);
    return () => clearTimeout(timeout);
  }, []);

  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: `${(i * 11) % 100}%`,
        y: `${(i * 17) % 100}%`,
        duration: `${12 + (i % 7) * 2}s`,
        delay: `${(i % 6) * 0.6}s`,
        size: `${2 + (i % 4)}px`,
      })),
    []
  );

  return (
    <section className="hero" id="hero-section">
      <div className="hero__bg" aria-hidden="true">
        <img src={heroImage} alt="Courtroom ambience" className="hero__bg-image" />
      </div>
      <div className="hero__overlay" aria-hidden="true" />

      <div className="hero__particles" aria-hidden="true">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="hero__particle"
            style={{
              '--x': particle.x,
              '--y': particle.y,
              '--duration': particle.duration,
              '--delay': particle.delay,
              '--size': particle.size,
            }}
          />
        ))}
      </div>

      <div className={`hero__content ${reveal ? 'hero__content--revealed' : ''}`}>
        <div className="hero__eyebrow-wrap">
          <span className="hero__eyebrow">The Sovereign Architect</span>
        </div>

        <h1 className="hero__title">
          Explore Landmark <span>Cases</span>
        </h1>

        <p className="hero__tagline">
          Where legal tradition meets sovereign intelligence. Build strategy, test doctrine,
          and enter the courtroom with authority.
        </p>

        <div className="hero__actions">
          <button className="hero__cta hero__cta--primary" onClick={onExplore} id="explore-cases-btn">
            Initiate Briefing
          </button>
          <button className="hero__cta hero__cta--ghost" onClick={onExplore}>
            Browse Archive
          </button>
        </div>
      </div>
    </section>
  );
}
