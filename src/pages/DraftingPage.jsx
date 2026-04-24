import heroImage from '../assets/hero.png';
import './DraftingPage.css';

const draftingTracks = [
  {
    title: 'Brief Builder',
    text: 'Structure arguments, authorities, and issue framing for longer-form submissions.',
  },
  {
    title: 'Petition Workspace',
    text: 'Prepare filing-oriented drafts with prayer clauses, facts, and relief sections.',
  },
  {
    title: 'Legal Memo Lane',
    text: 'Draft internal analysis, risk notes, and research-backed advisory documents.',
  },
];

export default function DraftingPage({ onBack }) {
  return (
    <main className="drafting-page" id="drafting-page">
      <div className="drafting-page__bg" aria-hidden="true">
        <img src={heroImage} alt="Drafting chamber ambience" className="drafting-page__bg-image" />
      </div>
      <div className="drafting-page__scrim" aria-hidden="true" />

      <section className="drafting-page__panel texture-leather">
        <button className="drafting-page__back" type="button" onClick={onBack}>
          ← Back to startup
        </button>

        <p className="drafting-page__eyebrow">Document workbench</p>
        <h1 className="drafting-page__title">Drafting is the next lane we’re opening.</h1>
        <p className="drafting-page__subtitle">
          This placeholder marks the future written-work workflow for briefs, petitions,
          memos, and document-led legal preparation. The structure exists now; the editing
          tools come next.
        </p>

        <div className="drafting-page__tracks" aria-label="drafting-workflows">
          {draftingTracks.map((track) => (
            <article key={track.title} className="drafting-page__track">
              <h2 className="drafting-page__track-title">{track.title}</h2>
              <p className="drafting-page__track-text">{track.text}</p>
            </article>
          ))}
        </div>

        <div className="drafting-page__footer">
          <span className="drafting-page__status">Phase 1 placeholder</span>
          <p className="drafting-page__note">
            No templates, uploads, persistence, or editor surface are enabled in this slice.
          </p>
        </div>
      </section>
    </main>
  );
}
