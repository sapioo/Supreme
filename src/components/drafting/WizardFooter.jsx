import { Button } from '../ui/button';

export default function WizardFooter({
  isFirstStep,
  isFinalStep,
  onBack,
  onNext,
  onCreate,
}) {
  return (
    <footer className="drafting-wizard-footer">
      <Button
        variant="outline"
        onClick={onBack}
        disabled={isFirstStep}
        className="drafting-wizard-footer__button"
      >
        Back
      </Button>

      {isFinalStep ? (
        <Button
          onClick={onCreate}
          className="drafting-wizard-footer__button drafting-wizard-footer__button--primary"
        >
          Create and Open Editor
        </Button>
      ) : (
        <Button
          onClick={onNext}
          className="drafting-wizard-footer__button drafting-wizard-footer__button--primary"
        >
          Continue
        </Button>
      )}
    </footer>
  );
}
