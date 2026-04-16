import heroImage from '../../assets/hero.png';
import './SetupWizardShell.css';

export default function SetupWizardShell({
  steps,
  currentStep,
  title,
  description,
  children,
  nextLabel,
  onNext,
  nextDisabled,
  onBack,
  secondaryAction,
}) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <main className="setup-wizard" id="setup-wizard">
      <div className="setup-wizard__bg" aria-hidden="true">
        <img src={heroImage} alt="" className="setup-wizard__bg-image" />
      </div>
      <div className="setup-wizard__scrim" aria-hidden="true" />

      <section className="setup-wizard__panel">
        <header className="setup-wizard__header">
          <div className="setup-wizard__bar">
            <div className="setup-wizard__identity">
              <p className="setup-wizard__brand">CourtRoom AI</p>
              <p className="setup-wizard__meta">Workspace setup</p>
            </div>
            <p className="setup-wizard__counter">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>

          <ol className="setup-wizard__steps" aria-label="onboarding-progress">
            {steps.map((step, index) => {
              const status =
                index < currentStep
                  ? 'complete'
                  : index === currentStep
                    ? 'active'
                    : 'upcoming';

              return (
                <li
                  key={step.key}
                  className={`setup-wizard__step setup-wizard__step--${status}`}
                >
                  <span className="setup-wizard__step-index">{index + 1}</span>
                  <span className="setup-wizard__step-label">{step.label}</span>
                </li>
              );
            })}
          </ol>

          <div
            className="setup-wizard__progress"
            role="progressbar"
            aria-label="Setup completion"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
          >
            <span className="setup-wizard__progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </header>

        <section className="setup-wizard__card" aria-labelledby="setup-title">
          <div className="setup-wizard__intro">
            <h1 className="setup-wizard__title" id="setup-title">{title}</h1>
            <p className="setup-wizard__description">{description}</p>
          </div>

          <div className="setup-wizard__content">{children}</div>
        </section>

        <footer className="setup-wizard__footer">
          <button
            type="button"
            className="setup-wizard__btn setup-wizard__btn--ghost"
            onClick={onBack}
            disabled={!onBack}
          >
            Back
          </button>

          <div className="setup-wizard__actions">
            {secondaryAction && (
              <button
                type="button"
                className="setup-wizard__btn setup-wizard__btn--subtle"
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </button>
            )}

            <button
              type="button"
              className="setup-wizard__btn setup-wizard__btn--primary"
              onClick={onNext}
              disabled={nextDisabled}
            >
              {nextLabel}
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}
