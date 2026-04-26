import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '../ui/card';

const PAGED_PREVIEW_STYLES = `
  @page {
    size: A4;
    margin: 18mm 16mm 14mm;

    @bottom-right {
      content: "Page " counter(page);
      color: rgba(31, 37, 44, 0.62);
      font-family: Georgia, "Times New Roman", serif;
      font-size: 11pt;
    }
  }

  .drafting-preview-flow {
    color: #1f252c;
    font-family: Georgia, "Times New Roman", serif;
    line-height: 1.62;
  }

  .drafting-preview-flow .drafting-preview__title,
  .drafting-preview-flow .drafting-preview__section,
  .drafting-preview-flow .drafting-preview__subsection,
  .drafting-preview-flow .drafting-preview__meta,
  .drafting-preview-flow .drafting-preview__list,
  .drafting-preview-flow .drafting-preview__paragraph {
    color: #1f252c;
  }

  .drafting-preview-title-block,
  .drafting-preview-keep {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .drafting-preview-flow .drafting-preview__title {
    margin: 0 0 8px;
    text-align: center;
    font-size: 1.6rem;
    letter-spacing: 0.04em;
  }

  .drafting-preview-flow .drafting-preview__meta {
    margin: 8px 0;
    text-align: center;
    font-size: 0.9rem;
  }

  .drafting-preview-flow .drafting-preview__section {
    margin: 22px 0 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid rgba(31, 37, 44, 0.22);
    font-size: 1.12rem;
    break-after: avoid-page;
    page-break-after: avoid;
  }

  .drafting-preview-flow .drafting-preview__subsection {
    margin: 16px 0 6px;
    font-size: 1rem;
    break-after: avoid-page;
    page-break-after: avoid;
  }

  .drafting-preview-flow .drafting-preview__list {
    margin: 8px 0;
    padding-left: 18px;
    orphans: 2;
    widows: 2;
  }

  .drafting-preview-flow .drafting-preview__paragraph {
    margin: 8px 0;
    orphans: 2;
    widows: 2;
  }
`;

function renderBlock(block, key) {
  if (block.type === 'title') {
    return <h1 key={key} className="drafting-preview__title">{block.text}</h1>;
  }

  if (block.type === 'meta') {
    return <p key={key} className="drafting-preview__meta">{block.text}</p>;
  }

  if (block.type === 'section') {
    return <h2 key={key} className="drafting-preview__section">{block.text}</h2>;
  }

  if (block.type === 'subsection') {
    return <h3 key={key} className="drafting-preview__subsection">{block.text}</h3>;
  }

  if (block.type === 'list') {
    return <p key={key} className="drafting-preview__list">{block.text}</p>;
  }

  return <p key={key} className="drafting-preview__paragraph">{block.text}</p>;
}

function buildPreviewFlow(blocks) {
  const items = [];
  let index = 0;

  while (index < blocks.length) {
    const block = blocks[index];
    const next = blocks[index + 1];

    if (block.type === 'title') {
      const titleGroup = [block];
      let cursor = index + 1;

      while (blocks[cursor]?.type === 'meta') {
        titleGroup.push(blocks[cursor]);
        cursor += 1;
      }

      if (blocks[cursor] && blocks[cursor].type !== 'section' && blocks[cursor].type !== 'subsection') {
        titleGroup.push(blocks[cursor]);
        cursor += 1;
      }

      items.push(
        <div key={`title-group-${index}`} className="drafting-preview-title-block">
          {titleGroup.map((entry, entryIndex) => renderBlock(entry, `title-${index}-${entryIndex}`))}
        </div>
      );

      index = cursor;
      continue;
    }

    if (
      (block.type === 'section' || block.type === 'subsection') &&
      next &&
      (next.type === 'paragraph' || next.type === 'list')
    ) {
      items.push(
        <div key={`keep-${index}`} className="drafting-preview-keep">
          {renderBlock(block, `keep-heading-${index}`)}
          {renderBlock(next, `keep-body-${index}`)}
        </div>
      );
      index += 2;
      continue;
    }

    items.push(renderBlock(block, `block-${index}`));
    index += 1;
  }

  return items;
}

export default function PreviewPane({
  previewBlocks,
  showViewSwitcher = false,
  onViewChange,
}) {
  const sourceRef = useRef(null);
  const pagesRef = useRef(null);
  const renderRunRef = useRef(0);
  const [pageCount, setPageCount] = useState(0);

  const previewFlow = useMemo(() => buildPreviewFlow(previewBlocks), [previewBlocks]);

  useEffect(() => {
    if (!sourceRef.current || !pagesRef.current) return;

    const runId = renderRunRef.current + 1;
    renderRunRef.current = runId;

    const source = sourceRef.current.cloneNode(true);
    const previewRoot = pagesRef.current;
    previewRoot.innerHTML = '';
    let cancelled = false;

    (async () => {
      try {
        const { Previewer } = await import('pagedjs');
        if (cancelled || renderRunRef.current !== runId) return;

        const previewer = new Previewer();
        const flow = await previewer.preview(
          source,
          [{ [`${window.location.href}#drafting-preview`]: PAGED_PREVIEW_STYLES }],
          previewRoot,
        );

        if (cancelled || renderRunRef.current !== runId) return;
        setPageCount(flow?.total || previewRoot.querySelectorAll('.pagedjs_page').length);
      } catch {
        if (cancelled || renderRunRef.current !== runId) return;
        previewRoot.innerHTML = '';
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [previewFlow]);

  return (
    <Card className="drafting-pane drafting-pane--preview">
      <div className="drafting-pane__head">
        <div className="drafting-pane__head-main">
          <h2>
            Preview
          </h2>
          <span>
            {pageCount > 0 ? `${pageCount} page${pageCount === 1 ? '' : 's'}` : 'Paginating...'}
          </span>
        </div>

        {showViewSwitcher && onViewChange ? (
          <div className="drafting-pane__head-side">
            <button
              type="button"
              className="drafting-pane__switch-button"
              onClick={() => onViewChange('source')}
            >
              Source
            </button>
          </div>
        ) : null}
      </div>

      <div className="drafting-preview-pages" ref={pagesRef} />

      <div className="drafting-preview-source" aria-hidden="true">
        <div ref={sourceRef} className="drafting-preview-flow">
          {previewFlow}
        </div>
      </div>
    </Card>
  );
}
