import { cn } from '../../lib/utils';

function formatTime(iso) {
  if (!iso) return 'Not saved';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function WizardRail({
  wizardSteps,
  currentStep,
  onStepClick,
  drafts,
  onOpenDraft,
}) {
  const currentStepIndex = wizardSteps.findIndex((s) => s.id === currentStep);

  return (
    <aside className="drafting-wizard-rail" aria-label="Draft setup steps">
      {/* Step progress */}
      <div className="drafting-wizard-rail__steps">
        {wizardSteps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isDone = index < currentStepIndex;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepClick(step.id)}
              className={cn(
                'drafting-wizard-step',
                isActive
                  ? 'drafting-wizard-step--active'
                  : 'drafting-wizard-step--idle',
              )}
            >
              <span
                className={cn(
                  'drafting-wizard-step__number',
                  isActive || isDone
                    ? 'drafting-wizard-step__number--done'
                    : 'drafting-wizard-step__number--idle',
                )}
              >
                {index + 1}
              </span>
              <strong>{step.label}</strong>
            </button>
          );
        })}
      </div>

      {/* Recent drafts */}
      <div className="drafting-recents">
        <div className="drafting-recents__head">
          <h2>
            Recent drafts
          </h2>
          <span>
            {drafts.length}
          </span>
        </div>

        {drafts.length === 0 && (
          <p className="drafting-empty">No saved drafts yet.</p>
        )}

        {drafts.slice(0, 5).map((draft) => (
          <button
            key={draft.id}
            type="button"
            onClick={() => onOpenDraft(draft)}
            className="drafting-recent-draft"
          >
            <span>{draft.title}</span>
            <small>
              {draft.templateName} | {formatTime(draft.updatedAt)}
            </small>
          </button>
        ))}
      </div>
    </aside>
  );
}
