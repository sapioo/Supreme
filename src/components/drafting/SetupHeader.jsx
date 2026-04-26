import { Button } from '../ui/button';

export default function SetupHeader({ onBack, activeDraft, onContinueEditor }) {
  return (
    <header className="drafting-setup-header">
      <Button variant="outline" onClick={onBack}>
        Back Home
      </Button>

      <div className="drafting-setup-header__title">
        <p>
          Drafting setup
        </p>
        <h1>
          Prepare a draft
        </h1>
        <p>
          Set the document type, matter context, and save it before opening the editor.
        </p>
      </div>

      {activeDraft && (
        <Button onClick={onContinueEditor}>
          Continue Editor
        </Button>
      )}
    </header>
  );
}
