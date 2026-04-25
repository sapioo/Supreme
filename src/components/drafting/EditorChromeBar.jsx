import { Settings, FileText, PanelRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

function formatTime(iso) {
  if (!iso) return 'Not saved';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EditorChromeBar({
  activeDraft,
  onTitleChange,
  aiSettings,
  saveState,
  showEditorDetails,
  onToggleDetails,
  showRightSidebar,
  onToggleSidebar,
  onOpenSettings,
  onCopy,
  copyState,
  onBackToSetup,
}) {
  const providerStatus =
    aiSettings.apiKey && aiSettings.model ? 'Ready' : 'Needs setup';
  const currentTemplateName = activeDraft?.templateName || 'No template selected';

  return (
    <header className="drafting-editor-bar">
      {/* Back button */}
      <Button variant="outline" onClick={onBackToSetup}>
        Setup
      </Button>

      {/* Main section */}
      <div className="drafting-editor-bar__main">
        {/* Title row */}
        <div className="drafting-editor-bar__title">
          <span>
            Draft Workspace
          </span>
          <Input
            className="drafting-editor-bar__title-input"
            value={activeDraft?.title || 'Untitled Draft'}
            onChange={(event) => onTitleChange(event.target.value)}
            disabled={!activeDraft}
            aria-label="Draft title"
          />
        </div>

        {/* Metadata chips */}
        {showEditorDetails && (
          <div className="drafting-editor-bar__meta">
            <div className="drafting-editor-chip">
              <span>
                Provider
              </span>
              <strong>
                OpenRouter
              </strong>
            </div>
            <div className="drafting-editor-chip">
              <span>
                Model
              </span>
              <strong>
                {aiSettings.model || 'Not configured'}
              </strong>
            </div>
            <div className="drafting-editor-chip">
              <span>
                Status
              </span>
              <strong>
                {providerStatus} |{' '}
                {saveState === 'saving'
                  ? 'Saving...'
                  : `Saved ${formatTime(activeDraft?.updatedAt)}`}
              </strong>
            </div>
            <div className="drafting-editor-chip">
              <span>
                Template
              </span>
              <strong>
                {currentTemplateName}
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="drafting-editor-bar__actions">
        {/* Settings */}
        <Button
          variant="outline"
          className="drafting-editor-bar__action"
          onClick={onOpenSettings}
        >
          <Settings className="drafting-editor-bar__icon" />
          <span className="drafting-editor-bar__action-label">Settings</span>
        </Button>

        {/* Details toggle */}
        <Button
          variant="outline"
          size="icon"
          className={
            showEditorDetails
              ? 'drafting-editor-bar__icon-button drafting-editor-bar__icon-button--active'
              : 'drafting-editor-bar__icon-button'
          }
          onClick={onToggleDetails}
          aria-label={
            showEditorDetails ? 'Hide draft details' : 'Show draft details'
          }
          title={
            showEditorDetails ? 'Hide draft details' : 'Show draft details'
          }
        >
          <FileText className="drafting-editor-bar__icon" />
        </Button>

        {/* AI rail toggle */}
        <Button
          variant="outline"
          size="icon"
          className={
            showRightSidebar
              ? 'drafting-editor-bar__icon-button drafting-editor-bar__icon-button--active'
              : 'drafting-editor-bar__icon-button'
          }
          onClick={onToggleSidebar}
          aria-label={showRightSidebar ? 'Hide AI rail' : 'Show AI rail'}
          title={showRightSidebar ? 'Hide AI rail' : 'Show AI rail'}
        >
          <PanelRight className="drafting-editor-bar__icon" />
        </Button>

        {/* Copy Draft */}
        <Button className="drafting-editor-bar__copy" onClick={onCopy} disabled={!activeDraft}>
          {copyState}
        </Button>
      </div>
    </header>
  );
}
