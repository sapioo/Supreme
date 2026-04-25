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

export default function PreviewPane({
  previewBlocks,
  showViewSwitcher = false,
  activeView = 'preview',
  onViewChange,
}) {
  return (
    <Card className="drafting-pane drafting-pane--preview">
      {/* Header */}
      <div className="drafting-pane__head">
        <h2>
          Preview
        </h2>
        <div className="drafting-pane__head-side">
          {showViewSwitcher && onViewChange ? (
            <SinglePaneViewSwitcher activeView={activeView} onViewChange={onViewChange} />
          ) : null}
          <span>
            Rendered structure
          </span>
        </div>
      </div>

      {/* Preview content */}
      <article className="drafting-preview">
        {previewBlocks.map((block, index) => {
          if (block.type === 'title') {
            return (
              <h1
                key={index}
                className="drafting-preview__title"
              >
                {block.text}
              </h1>
            );
          }
          if (block.type === 'meta') {
            return (
              <p
                key={index}
                className="drafting-preview__meta"
              >
                {block.text}
              </p>
            );
          }
          if (block.type === 'section') {
            return (
              <h2
                key={index}
                className="drafting-preview__section"
              >
                {block.text}
              </h2>
            );
          }
          if (block.type === 'subsection') {
            return (
              <h3
                key={index}
                className="drafting-preview__subsection"
              >
                {block.text}
              </h3>
            );
          }
          if (block.type === 'list') {
            return (
              <p key={index} className="drafting-preview__list">
                {block.text}
              </p>
            );
          }
          return (
            <p key={index} className="drafting-preview__paragraph">
              {block.text}
            </p>
          );
        })}
      </article>
    </Card>
  );
}
