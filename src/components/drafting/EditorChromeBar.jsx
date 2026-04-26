import {
  Clipboard,
  Columns2,
  Eye,
  FileCode2,
  PanelLeftOpen,
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
  editorLayout,
  onEditorLayoutChange,
}) {
  return (
    <header className="drafting-editor-bar">
      <div className="drafting-editor-bar__identity">
        <div className="drafting-editor-bar__main">
          <div className="drafting-editor-bar__title-wrap">
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
          {!showRightSidebar ? (
            <Button
              variant="outline"
              size="icon"
              className="drafting-editor-bar__action"
              onClick={onToggleSidebar}
              aria-label="Show AI sidebar"
              title="Show AI sidebar"
            >
              <PanelLeftOpen className="drafting-editor-bar__icon drafting-editor-bar__icon--strong" />
            </Button>
          ) : null}

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
            className="drafting-editor-bar__copy"
            onClick={onCopy}
            disabled={!activeDraft}
            size="icon"
            aria-label={copyState}
            title={copyState}
          >
            <Clipboard className="drafting-editor-bar__icon drafting-editor-bar__icon--strong" />
          </Button>
        </div>
      </div>
    </header>
  );
}
