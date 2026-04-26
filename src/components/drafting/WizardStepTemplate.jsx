import { cn } from '../../lib/utils';

export default function WizardStepTemplate({
  templates,
  selectedId,
  onSelect,
  setupTitle,
  onTitleChange,
}) {
  return (
    <div className="drafting-wizard-panel">
      {/* Step header */}
      <div className="drafting-wizard-panel__head">
        <p>
          Step 1 of 3
        </p>
        <h2>
          Select the document type
        </h2>
        <span>
          Choose from an India-specific drafting library spanning writs, civil and criminal pleadings, family matters, property work, corporate records, and contracts.
        </span>
      </div>

      {/* Template grid */}
      <div className="drafting-template-list">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => {
              onSelect(template.id);
              if (!setupTitle.trim()) onTitleChange(template.name);
            }}
            className={cn(
              'drafting-template-card',
              selectedId === template.id
                ? 'drafting-template-card--active'
                : 'drafting-template-card--idle',
            )}
          >
            <div className="drafting-template-card__topline">
              <strong>
                {template.name}
              </strong>
              <span>
                {template.category}
              </span>
            </div>

            <p className="drafting-template-card__description">
              {template.description}
            </p>

            <div className="drafting-template-card__meta">
              <small>
                {template.sectionTitles.length} sections
              </small>
              <small>
                {template.shortName}
              </small>
            </div>

            <p className="drafting-template-card__sections">
              {template.sectionTitles.join(' • ')}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
