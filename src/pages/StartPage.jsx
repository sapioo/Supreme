import { useEffect, useMemo, useState } from 'react';
import heroImage from '../assets/hero.png';
import cases from '../data/cases';
import { getSessions } from '../services/sessionStorage';
import './StartPage.css';

const agendaItems = [
  {
    label: 'Practice',
    title: 'Browse live case drills',
    text: 'Open the practice workspace and jump straight into landmark matters or custom simulations.',
  },
  {
    label: 'Archive',
    title: 'Review previous sessions',
    text: 'Your saved arguments and outcomes remain available inside the practice workspace.',
  },
  {
    label: 'Drafting',
    title: 'Preview the document lane',
    text: 'See the upcoming workbench for briefs, petitions, memos, and document-led tasks.',
  },
];

const modeCards = [
  {
    key: 'practice',
    eyebrow: 'Primary workflow',
    title: 'Practice Law',
    description:
      'Go directly into the case workspace for oral submissions, side selection, and courtroom rounds.',
    cta: 'Open practice workspace',
  },
  {
    key: 'drafting',
    eyebrow: 'Next workflow',
    title: 'Drafting',
    description:
      'Enter the drafting placeholder and preview the structure for written legal work.',
    cta: 'Open drafting lane',
  },
];

export default function StartPage({ onSelectPractice, onSelectDrafting }) {
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    setSessionCount(getSessions().length);
  }, []);

  const metrics = useMemo(() => {
    const totalCases = cases.length;
    const totalArticles = new Set(cases.flatMap((item) => item.articles)).size;
    return [
      { label: 'Live case drills', value: String(totalCases).padStart(2, '0') },
      { label: 'Archived sessions', value: String(sessionCount).padStart(2, '0') },
      { label: 'Constitutional references', value: String(totalArticles).padStart(2, '0') },
    ];
  }, [sessionCount]);

  const actionMap = {
    practice: onSelectPractice,
    drafting: onSelectDrafting,
  };

  return (
    <main className="start-page" id="start-page">
      <div className="start-page__bg" aria-hidden="true">
        <img src={heroImage} alt="Courtroom ambience" className="start-page__bg-image" />
      </div>
      <div className="start-page__scrim" aria-hidden="true" />
      <div className="start-page__ambient" aria-hidden="true" />

      <section className="start-page__panel texture-leather">
        <div className="start-page__topbar">
          <div>
            <p className="start-page__brand">SUPREME</p>
            <p className="start-page__eyebrow">Home</p>
          </div>
          <div className="start-page__status-pill">Counsel startup</div>
        </div>

        <div className="start-page__hero">
          <div className="start-page__hero-copy">
            <h1 className="start-page__title">Work starts here.</h1>
            <p className="start-page__subtitle">
              Choose the lane you need right now and keep the first screen focused on the
              essential actions only.
            </p>

            <div className="start-page__primary-actions">
              <button
                className="start-page__primary-btn start-page__primary-btn--solid"
                type="button"
                onClick={onSelectPractice}
              >
                Practice Law
              </button>
              <button
                className="start-page__primary-btn start-page__primary-btn--ghost"
                type="button"
                onClick={onSelectDrafting}
              >
                Drafting
              </button>
            </div>
          </div>

          <aside className="start-page__metrics" aria-label="home-metrics">
            {metrics.map((item) => (
              <div key={item.label} className="start-page__metric-card">
                <span className="start-page__metric-value">{item.value}</span>
                <span className="start-page__metric-label">{item.label}</span>
              </div>
            ))}
          </aside>
        </div>

        <div className="start-page__content">
          <section className="start-page__agenda" aria-label="today-agenda">
            <div className="start-page__section-head">
              <h2 className="start-page__section-title">What’s on the agenda today</h2>
              <span className="start-page__section-tag">Essential overview</span>
            </div>
            <ul className="start-page__agenda-list">
              {agendaItems.map((item) => (
                <li key={item.title} className="start-page__agenda-item">
                  <span className="start-page__agenda-item-label">{item.label}</span>
                  <div>
                    <h3 className="start-page__agenda-item-title">{item.title}</h3>
                    <p className="start-page__agenda-item-text">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="start-page__modes" aria-label="work-mode-selection">
            <div className="start-page__section-head">
              <h2 className="start-page__section-title">Choose your mode</h2>
            </div>
            <div className="start-page__mode-grid">
              {modeCards.map((card) => (
                <article key={card.key} className="start-page__mode-card">
                  <span className="start-page__mode-eyebrow">{card.eyebrow}</span>
                  <h3 className="start-page__mode-title">{card.title}</h3>
                  <p className="start-page__mode-description">{card.description}</p>
                  <button
                    className="start-page__mode-btn"
                    type="button"
                    onClick={actionMap[card.key]}
                  >
                    {card.cta}
                  </button>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
