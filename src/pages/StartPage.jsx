import heroImage from '../assets/hero.png';
import './StartPage.css';

const highlights = [
  {
    title: 'Landmark Cases',
    text: 'Navigate constitutional cases that shaped modern legal doctrine.',
  },
  {
    title: 'AI-Driven Judgment',
    text: 'Challenge an adaptive opposing counsel grounded in precedent logic.',
  },
  {
    title: 'Voice-First Advocacy',
    text: 'Present oral arguments with live transcription and response flow.',
  },
];

export default function StartPage({ onStart }) {
  return (
    <main className="start-page" id="start-page">
      <div className="start-page__bg" aria-hidden="true">
        <img src={heroImage} alt="Courtroom ambience" className="start-page__bg-image" />
      </div>
      <div className="start-page__scrim" aria-hidden="true" />
      <div className="start-page__ambient" aria-hidden="true" />

      <span className="start-page__protocol">Case Protocol #882-Alpha // System Active</span>

      <section className="start-page__panel texture-leather">
        <p className="start-page__brand">SUPREME</p>

        <h1 className="start-page__title">Experience the Bench.</h1>
        <p className="start-page__subtitle">
          Argue landmark Indian cases against an AI counsel.
          Your argument is the evidence.
        </p>

        <ul className="start-page__highlights" aria-label="experience-highlights">
          {highlights.map((item, index) => (
            <li key={item.title} className="start-page__highlight">
              <span className="start-page__highlight-dot" aria-hidden="true" />
              <div>
                <h3 className="start-page__highlight-title">{item.title}</h3>
                <p className="start-page__highlight-text">{item.text}</p>
              </div>
              <span className="start-page__highlight-index">0{index + 1}</span>
            </li>
          ))}
        </ul>

        <button
          className="start-page__start-btn"
          id="start-trial-btn"
          type="button"
          onClick={onStart}
        >
          <span className="start-page__start-btn-shine" aria-hidden="true" />
          <span className="start-page__start-btn-text">Enter the Court</span>
          <span className="start-page__start-btn-icon" aria-hidden="true">→</span>
        </button>
      </section>
    </main>
  );
}
