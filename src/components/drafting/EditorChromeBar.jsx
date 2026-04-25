import {
  ChevronLeft,
  Columns2,
  Copy,
  Eye,
  FileCode2,
  PanelRightClose,
  PanelRightOpen,
  Settings2,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';

const layoutOptions = [
  { value: 'source', label: 'Code view', icon: FileCode2 },
  { value: 'preview', label: 'Preview view', icon: Eye },
  { value: 'split', label: 'Split view', icon: Columns2 },
];

export default function EditorChromeBar({
  activeDraft,
  onTitleChange,
  showRightSidebar,
  onToggleSidebar,
  onOpenSettings,
  onCopy,
  copyState,
  onBackToSetup,
  editorLayout,
  onEditorLayoutChange,
}) {
  const currentTemplateName = activeDraft?.templateName || 'No template selected';

  return (
    <header className="drafting-editor-bar">
      <div className="drafting-editor-bar__identity">
        <Button
          variant="outline"
          size="icon"
          onClick={onBackToSetup}
          className="drafting-editor-bar__setup"
          aria-label="Back to setup"
          title="Back to setup"
        >
          <ChevronLeft className="drafting-editor-bar__icon" />
        </Button>

        <div className="drafting-editor-bar__main">
          <div className="drafting-editor-bar__title-wrap">
            <div className="drafting-editor-bar__eyebrow">
              <span className="drafting-editor-bar__eyebrow-badge">Draft workspace</span>
              <span className="drafting-editor-bar__eyebrow-separator" aria-hidden="true" />
              <span className="drafting-editor-bar__eyebrow-text">{currentTemplateName}</span>
            </div>
            <Input
              className="drafting-editor-bar__title-input"
              value={activeDraft?.title || 'Untitled Draft'}
              onChange={(event) => onTitleChange(event.target.value)}
              disabled={!activeDraft}
              aria-label="Draft title"
            />
          </div>
        </div>
      </div>

      <div className="drafting-editor-bar__actions">
        <div className="drafting-editor-bar__action-group">
          <Button
            variant="outline"
            size="icon"
            className="drafting-editor-bar__action"
            onClick={onOpenSettings}
            aria-label="Open settings"
            title="Open settings"
          >
            <Settings2 className="drafting-editor-bar__icon" />
          </Button>

          <div
            className="drafting-editor-layout-switch"
            role="tablist"
            aria-label="Source and preview layout"
          >
            {layoutOptions.map((option) => {
              const Icon = option.icon;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={editorLayout === option.value}
                  aria-label={option.label}
                  title={option.label}
                  className={cn(
                    'drafting-editor-layout-switch__option',
                    editorLayout === option.value && 'drafting-editor-layout-switch__option--active'
                  )}
                  onClick={() => onEditorLayoutChange(option.value)}
                >
                  <Icon className="drafting-editor-layout-switch__icon" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="drafting-editor-bar__action-group">
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
            {showRightSidebar ? (
              <PanelRightClose className="drafting-editor-bar__icon" />
            ) : (
              <PanelRightOpen className="drafting-editor-bar__icon" />
            )}
          </Button>

          <Button
            className="drafting-editor-bar__copy"
            onClick={onCopy}
            disabled={!activeDraft}
            size="icon"
            aria-label={copyState}
            title={copyState}
          >
            <Copy className="drafting-editor-bar__icon" />
          </Button>
        </div>
      </div>
    </header>
  );
}
