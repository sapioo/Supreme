import { Card } from '../ui/card';

export default function PreviewPane({ previewBlocks }) {
  return (
    <Card className="drafting-pane drafting-pane--preview">
      {/* Header */}
      <div className="drafting-pane__head">
        <h2>
          Preview
        </h2>
        <span>
          Rendered structure
        </span>
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
