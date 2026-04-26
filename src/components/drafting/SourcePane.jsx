import { Card } from '../ui/card';

export default function SourcePane({
  source,
  onChange,
  showViewSwitcher = false,
  onViewChange,
}) {
  return (
    <Card className="drafting-pane drafting-pane--source">
      {/* Header */}
      <div className="drafting-pane__head">
        <div className="drafting-pane__head-main">
          <h2>
            LaTeX Source
          </h2>
          <span>
            {source.length} chars
          </span>
        </div>

        {showViewSwitcher && onViewChange ? (
          <div className="drafting-pane__head-side">
            <button
              type="button"
              className="drafting-pane__switch-button"
              onClick={() => onViewChange('preview')}
            >
              Preview
            </button>
          </div>
        ) : null}
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
