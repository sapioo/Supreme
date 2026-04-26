export default function WizardStepReview({
  templateName,
  draftName,
  matterType,
  urgency,
}) {
  const displayName = draftName?.trim() || templateName;

  return (
    <div className="drafting-wizard-panel">
      {/* Step header */}
      <div className="drafting-wizard-panel__head">
        <p>
          Step 3 of 3
        </p>
        <h2>
          Review and create
        </h2>
        <span>
          Confirm the setup before opening the LaTeX-style drafting editor.
        </span>
      </div>

      {/* 2×2 review grid */}
      <div className="drafting-review-grid">
        <div className="drafting-review-item">
          <span>
            Template
          </span>
          <strong>
            {templateName}
          </strong>
        </div>

        <div className="drafting-review-item">
          <span>
            Draft name
          </span>
          <strong>
            {displayName}
          </strong>
        </div>

        <div className="drafting-review-item">
          <span>
            Matter
          </span>
          <strong>
            {matterType}
          </strong>
        </div>

        <div className="drafting-review-item">
          <span>
            Priority
          </span>
          <strong>
            {urgency}
          </strong>
        </div>
      </div>
    </div>
  );
}
