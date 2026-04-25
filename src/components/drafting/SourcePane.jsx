import { Card } from '../ui/card';
import { cn } from '../../lib/utils';

function SinglePaneViewSwitcher({ activeView, onViewChange }) {
  return (
    <div className="drafting-pane-view-switcher" role="tablist" aria-label="Source and preview views">
      <button
        type="button"
        role="tab"
        aria-selected={activeView === 'source'}
        className={cn(
          'drafting-pane-view-switcher__option',
          activeView === 'source' && 'drafting-pane-view-switcher__option--active'
        )}
        onClick={() => onViewChange('source')}
      >
        Code
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeView === 'preview'}
        className={cn(
          'drafting-pane-view-switcher__option',
          activeView === 'preview' && 'drafting-pane-view-switcher__option--active'
        )}
        onClick={() => onViewChange('preview')}
      >
        Preview
      </button>
    </div>
  );
}

export default function SourcePane({
  source,
  onChange,
  showViewSwitcher = false,
  activeView = 'source',
  onViewChange,
}) {
  return (
    <Card className="drafting-pane drafting-pane--source">
      {/* Header */}
      <div className="drafting-pane__head">
        <h2>
          LaTeX Source
        </h2>
        <div className="drafting-pane__head-side">
          {showViewSwitcher && onViewChange ? (
            <SinglePaneViewSwitcher activeView={activeView} onViewChange={onViewChange} />
          ) : null}
          <span>
            {source.length} chars
          </span>
        </div>
      </div>

      {/* Source textarea */}
      <textarea
        className="drafting-source"
        value={source}
        onChange={(event) => onChange(event.target.value)}
        spellCheck="false"
        placeholder="Create a draft from a template to begin."
      />
    </Card>
  );
}
