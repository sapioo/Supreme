import { Card } from '../ui/card';

export default function SourcePane({ source, onChange }) {
  return (
    <Card className="drafting-pane drafting-pane--source">
      {/* Header */}
      <div className="drafting-pane__head">
        <h2>
          LaTeX Source
        </h2>
        <span>
          {source.length} chars
        </span>
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
