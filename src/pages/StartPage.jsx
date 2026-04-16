import './StartPage.css';

const setupChecklist = [
  {
    title: 'Pick a case',
    text: 'Select one landmark dispute to load facts, context, and argument framing.',
  },
  {
    title: 'Pick your role',
    text: 'Choose petitioner or respondent. AI counsel automatically takes the opposite side.',
  },
  {
    title: 'Enter courtroom',
    text: 'Begin live rounds with structured speaking turns and automated scoring.',
  },
];

export default function StartPage() {
  return (
    <section className="start-step" id="start-step">
      <header className="start-step__overview">
        <p className="start-step__eyebrow">Guided onboarding</p>
        <h2 className="start-step__heading">Set up your first courtroom session in under 2 minutes.</h2>
        <p className="start-step__copy">
          This flow asks for only two decisions. Everything else can be changed later from session
          settings.
        </p>
      </header>

      <ul className="start-step__checklist" aria-label="wizard-checklist">
        {setupChecklist.map((item, index) => (
          <li key={item.title} className="start-step__item">
            <span className="start-step__item-index">{index + 1}</span>
            <div>
              <h3 className="start-step__item-title">{item.title}</h3>
              <p className="start-step__item-text">{item.text}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="start-step__note" role="note">
        <p>Data use: case metadata and selected role only during setup.</p>
        <p>Your preferences are saved and can be edited any time.</p>
      </div>
    </section>
  );
}
