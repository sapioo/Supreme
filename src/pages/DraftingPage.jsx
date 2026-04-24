import { useCallback, useEffect, useMemo, useState } from 'react';
import { draftingTemplates } from '../data/draftingTemplates';
import { createDraft, createDraftFromTemplate, deleteDraft, listDrafts, saveDraft } from '../services/draftStorage';
import { DRAFTING_EDIT_MODES, rewriteDraftSection } from '../services/draftingAIService';
import './DraftingPage.css';

const EMPTY_PREVIEW = [{ type: 'paragraph', text: 'Create or open a draft to begin.' }];
const matterTypes = ['Civil', 'Criminal', 'Constitutional', 'Commercial', 'Advisory'];
const urgencyLevels = ['Standard', 'Due this week', 'Urgent filing', 'Review only'];

function formatTime(iso) {
  if (!iso) return 'Not saved';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function extractCommand(source, command) {
  const match = source.match(new RegExp(`\\\\${command}\\{([^}]*)\\}`));
  return match?.[1]?.trim() || '';
}

function parseSections(source) {
  const matches = [...source.matchAll(/^\\section\{([^}]*)\}\s*$/gm)];
  return matches.map((match, index) => {
    const next = matches[index + 1];
    const bodyStart = match.index + match[0].length;
    const bodyEnd = next ? next.index : source.length;
    return {
      id: `${match[1]}-${match.index}`,
      title: match[1].trim(),
      headingStart: match.index,
      bodyStart,
      bodyEnd,
      body: source.slice(bodyStart, bodyEnd).trim(),
    };
  });
}

function replaceSectionBody(source, section, replacement) {
  if (!section) return source;
  const prefix = source.slice(0, section.bodyStart);
  const suffix = source.slice(section.bodyEnd);
  return `${prefix}\n${replacement.trim()}\n\n${suffix.trimStart()}`;
}

function parsePreview(source) {
  if (!source.trim()) return EMPTY_PREVIEW;

  const blocks = [];
  const title = extractCommand(source, 'title');
  const author = extractCommand(source, 'author');
  const date = extractCommand(source, 'date');
  let inDocument = false;

  if (title) blocks.push({ type: 'title', text: title });
  if (author) blocks.push({ type: 'meta', text: author });
  if (date) blocks.push({ type: 'meta', text: date });

  source.split('\n').forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line || line.startsWith('\\documentclass') || line.startsWith('\\title') || line.startsWith('\\author') || line.startsWith('\\date')) return;
    if (line === '\\begin{document}') {
      inDocument = true;
      return;
    }
    if (line === '\\end{document}') {
      inDocument = false;
      return;
    }
    if (!inDocument || line === '\\maketitle') return;

    const section = line.match(/^\\section\{([^}]*)\}/);
    if (section) {
      blocks.push({ type: 'section', text: section[1] });
      return;
    }

    const subsection = line.match(/^\\subsection\{([^}]*)\}/);
    if (subsection) {
      blocks.push({ type: 'subsection', text: subsection[1] });
      return;
    }

    const item = line.match(/^\\item\s+(.+)/);
    if (item) {
      blocks.push({ type: 'list', text: item[1] });
      return;
    }

    if (line.startsWith('\\begin') || line.startsWith('\\end')) return;
    blocks.push({ type: /^\d+\.|^[A-Z]\./.test(line) ? 'list' : 'paragraph', text: line });
  });

  return blocks.length > 0 ? blocks : EMPTY_PREVIEW;
}

export default function DraftingPage({ onBack }) {
  const [initialDraftState] = useState(() => {
    const storedDrafts = listDrafts();
    return {
      drafts: storedDrafts,
      activeDraft: storedDrafts[0] || null,
      source: storedDrafts[0]?.source || '',
    };
  });
  const [drafts, setDrafts] = useState(initialDraftState.drafts);
  const [activeDraft, setActiveDraft] = useState(initialDraftState.activeDraft);
  const [source, setSource] = useState(initialDraftState.source);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [editMode, setEditMode] = useState('formalize');
  const [suggestion, setSuggestion] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [saveState, setSaveState] = useState('idle');
  const [copyState, setCopyState] = useState('Copy Draft');
  const [mobileTab, setMobileTab] = useState('source');
  const [viewMode, setViewMode] = useState('setup');
  const [setupTemplateId, setSetupTemplateId] = useState(draftingTemplates[0].id);
  const [setupTitle, setSetupTitle] = useState('');
  const [setupMatterType, setSetupMatterType] = useState(matterTypes[0]);
  const [setupUrgency, setSetupUrgency] = useState(urgencyLevels[0]);

  const sections = useMemo(() => parseSections(source), [source]);
  const previewBlocks = useMemo(() => parsePreview(source), [source]);
  const activeSection = useMemo(
    () => sections.find((section) => section.id === selectedSectionId) || sections[0] || null,
    [sections, selectedSectionId]
  );

  useEffect(() => {
    if (!activeDraft) return;
    const timeout = setTimeout(() => {
      const saved = saveDraft({ ...activeDraft, source });
      if (saved) {
        setActiveDraft(saved);
        setDrafts(listDrafts());
        setSaveState('saved');
      }
    }, 450);

    return () => clearTimeout(timeout);
  }, [activeDraft?.id, activeDraft?.title, source]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateDraft = useCallback((template) => {
    const draft = createDraftFromTemplate(template);
    setActiveDraft(draft);
    setSource(draft.source);
    setDrafts(listDrafts());
    setSuggestion(null);
    setSaveState('saved');
    setMobileTab('source');
    setViewMode('editor');
  }, []);

  const handleStartSetupDraft = useCallback(() => {
    const template = draftingTemplates.find((item) => item.id === setupTemplateId) || draftingTemplates[0];
    const draft = createDraft({
      title: setupTitle.trim() || template.name,
      templateId: template.id,
      templateName: template.name,
      matterType: setupMatterType,
      urgency: setupUrgency,
      source: template.source,
    });
    setActiveDraft(draft);
    setSource(draft.source);
    setDrafts(listDrafts());
    setSuggestion(null);
    setSaveState('saved');
    setMobileTab('source');
    setViewMode('editor');
  }, [setupMatterType, setupTemplateId, setupTitle, setupUrgency]);

  const handleOpenDraft = useCallback((draft) => {
    setActiveDraft(draft);
    setSource(draft.source);
    setSuggestion(null);
    setSaveState('saved');
    setMobileTab('source');
    setViewMode('editor');
  }, []);

  const handleDeleteDraft = useCallback((event, draftId) => {
    event.stopPropagation();
    deleteDraft(draftId);
    const nextDrafts = listDrafts();
    setDrafts(nextDrafts);
    if (activeDraft?.id === draftId) {
      const next = nextDrafts[0] || null;
      setActiveDraft(next);
      setSource(next?.source || '');
      setSuggestion(null);
    }
  }, [activeDraft?.id]);

  const handleCopy = useCallback(async () => {
    if (!source.trim()) return;
    try {
      await navigator.clipboard.writeText(source);
      setCopyState('Copied');
      setTimeout(() => setCopyState('Copy Draft'), 1600);
    } catch {
      setCopyState('Copy failed');
      setTimeout(() => setCopyState('Copy Draft'), 1600);
    }
  }, [source]);

  const handleAiEdit = useCallback(async () => {
    if (!activeSection || isAiLoading) return;
    setIsAiLoading(true);
    setSuggestion(null);
    const result = await rewriteDraftSection({
      fullDraft: source,
      sectionTitle: activeSection.title,
      sectionText: activeSection.body,
      editMode,
    });
    setSuggestion(result);
    setIsAiLoading(false);
    setMobileTab('ai');
  }, [activeSection, editMode, isAiLoading, source]);

  const handleApplySuggestion = useCallback(() => {
    if (!activeSection || !suggestion?.text) return;
    setSource((current) => replaceSectionBody(current, activeSection, suggestion.text));
    setSuggestion(null);
    setMobileTab('source');
  }, [activeSection, suggestion]);

  const currentTemplateName = activeDraft?.templateName || 'No template selected';
  const activePanelClass = (panel) => (mobileTab === panel ? 'drafting-page__pane--active' : '');

  if (viewMode === 'setup') {
    const selectedTemplate = draftingTemplates.find((template) => template.id === setupTemplateId) || draftingTemplates[0];

    return (
      <main className="drafting-page drafting-page--setup" id="drafting-page">
        <header className="drafting-page__setup-topbar">
          <button className="drafting-page__back" type="button" onClick={onBack}>
            Back Home
          </button>
          <div>
            <p className="drafting-page__setup-kicker">Drafting setup</p>
            <h1>Prepare a draft</h1>
          </div>
          {activeDraft && (
            <button className="drafting-page__copy" type="button" onClick={() => setViewMode('editor')}>
              Continue Editor
            </button>
          )}
        </header>

        <section className="drafting-page__setup-grid">
          <div className="drafting-page__setup-main">
            <section className="drafting-page__setup-section">
              <div className="drafting-page__setup-head">
                <span>1</span>
                <div>
                  <h2>Select document type</h2>
                  <p>Pick the structure you want to start from.</p>
                </div>
              </div>
              <div className="drafting-page__setup-templates">
                {draftingTemplates.map((template) => (
                  <button
                    key={template.id}
                    className={`drafting-page__setup-template ${setupTemplateId === template.id ? 'drafting-page__setup-template--active' : ''}`}
                    type="button"
                    onClick={() => {
                      setSetupTemplateId(template.id);
                      if (!setupTitle.trim()) setSetupTitle(template.name);
                    }}
                  >
                    <strong>{template.name}</strong>
                    <span>{template.description}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="drafting-page__setup-section">
              <div className="drafting-page__setup-head">
                <span>2</span>
                <div>
                  <h2>Save the matter context</h2>
                  <p>This keeps the draft identifiable in your recent work.</p>
                </div>
              </div>
              <div className="drafting-page__setup-form">
                <label>
                  <span>Draft name</span>
                  <input
                    value={setupTitle}
                    onChange={(event) => setSetupTitle(event.target.value)}
                    placeholder={selectedTemplate.name}
                  />
                </label>
                <label>
                  <span>Matter type</span>
                  <select value={setupMatterType} onChange={(event) => setSetupMatterType(event.target.value)}>
                    {matterTypes.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  <span>Priority</span>
                  <select value={setupUrgency} onChange={(event) => setSetupUrgency(event.target.value)}>
                    {urgencyLevels.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
              </div>
            </section>
          </div>

          <aside className="drafting-page__setup-side">
            <section className="drafting-page__setup-section drafting-page__setup-summary">
              <h2>Ready to create</h2>
              <dl>
                <div>
                  <dt>Template</dt>
                  <dd>{selectedTemplate.name}</dd>
                </div>
                <div>
                  <dt>Draft name</dt>
                  <dd>{setupTitle.trim() || selectedTemplate.name}</dd>
                </div>
                <div>
                  <dt>Context</dt>
                  <dd>{setupMatterType} | {setupUrgency}</dd>
                </div>
              </dl>
              <button className="drafting-page__setup-start" type="button" onClick={handleStartSetupDraft}>
                Create and Open Editor
              </button>
            </section>

            <section className="drafting-page__setup-section drafting-page__setup-recents">
              <h2>Recent drafts</h2>
              {drafts.length === 0 && <p className="drafting-page__empty">No saved drafts yet.</p>}
              {drafts.slice(0, 5).map((draft) => (
                <button key={draft.id} type="button" onClick={() => handleOpenDraft(draft)}>
                  <span>{draft.title}</span>
                  <small>{draft.templateName} | {formatTime(draft.updatedAt)}</small>
                </button>
              ))}
            </section>
          </aside>
        </section>
      </main>
    );
  }

  return (
    <main className="drafting-page" id="drafting-page">
      <header className="drafting-page__topbar">
        <button className="drafting-page__back" type="button" onClick={() => setViewMode('setup')}>
          Setup
        </button>
        <div className="drafting-page__title-block">
          <input
            className="drafting-page__title-input"
            value={activeDraft?.title || 'Untitled Draft'}
            onChange={(event) => {
              if (!activeDraft) return;
              setActiveDraft({ ...activeDraft, title: event.target.value });
              setSaveState('saving');
            }}
            disabled={!activeDraft}
            aria-label="Draft title"
          />
          <span className="drafting-page__meta">{currentTemplateName} | {saveState === 'saving' ? 'Saving...' : `Saved ${formatTime(activeDraft?.updatedAt)}`}</span>
        </div>
        <button className="drafting-page__copy" type="button" onClick={handleCopy} disabled={!source.trim()}>
          {copyState}
        </button>
      </header>

      <div className="drafting-page__mobile-tabs" role="tablist" aria-label="Drafting workspace panels">
        {['source', 'preview', 'ai'].map((tab) => (
          <button
            key={tab}
            className={`drafting-page__tab ${mobileTab === tab ? 'drafting-page__tab--active' : ''}`}
            type="button"
            onClick={() => setMobileTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <section className="drafting-page__workspace">
        <aside className="drafting-page__sidebar">
          <section className="drafting-page__panel">
            <div className="drafting-page__panel-head">
              <h2>New Draft</h2>
            </div>
            <div className="drafting-page__template-list">
              {draftingTemplates.map((template) => (
                <button
                  key={template.id}
                  className="drafting-page__template"
                  type="button"
                  onClick={() => handleCreateDraft(template)}
                >
                  <span>{template.name}</span>
                  <small>{template.description}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="drafting-page__panel">
            <div className="drafting-page__panel-head">
              <h2>Recent Drafts</h2>
            </div>
            <div className="drafting-page__draft-list">
              {drafts.length === 0 && <p className="drafting-page__empty">No drafts saved yet.</p>}
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className={`drafting-page__draft ${activeDraft?.id === draft.id ? 'drafting-page__draft--active' : ''}`}
                >
                  <button type="button" onClick={() => handleOpenDraft(draft)}>
                    <span>{draft.title}</span>
                    <small>{draft.templateName} | {formatTime(draft.updatedAt)}</small>
                  </button>
                  <button
                    className="drafting-page__delete"
                    type="button"
                    onClick={(event) => handleDeleteDraft(event, draft.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="drafting-page__panel">
            <div className="drafting-page__panel-head">
              <h2>Sections</h2>
            </div>
            <div className="drafting-page__section-list">
              {sections.length === 0 && <p className="drafting-page__empty">Add \section&#123;...&#125; headings to create editable sections.</p>}
              {sections.map((section) => (
                <button
                  key={section.id}
                  className={`drafting-page__section-btn ${activeSection?.id === section.id ? 'drafting-page__section-btn--active' : ''}`}
                  type="button"
                  onClick={() => {
                    setSelectedSectionId(section.id);
                    setMobileTab('ai');
                  }}
                >
                  {section.title}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className={`drafting-page__pane drafting-page__source-pane ${activePanelClass('source')}`}>
          <div className="drafting-page__panel-head">
            <h2>LaTeX Source</h2>
            <span>{source.length} chars</span>
          </div>
          <textarea
            className="drafting-page__source"
            value={source}
            onChange={(event) => {
              setSource(event.target.value);
              setSuggestion(null);
              setSaveState('saving');
            }}
            spellCheck="false"
            placeholder="Create a draft from a template to begin."
          />
        </section>

        <section className={`drafting-page__pane drafting-page__preview-pane ${activePanelClass('preview')}`}>
          <div className="drafting-page__panel-head">
            <h2>Preview</h2>
            <span>Rendered structure</span>
          </div>
          <article className="drafting-page__preview">
            {previewBlocks.map((block, index) => {
              if (block.type === 'title') return <h1 key={index}>{block.text}</h1>;
              if (block.type === 'meta') return <p key={index} className="drafting-page__preview-meta">{block.text}</p>;
              if (block.type === 'section') return <h2 key={index}>{block.text}</h2>;
              if (block.type === 'subsection') return <h3 key={index}>{block.text}</h3>;
              if (block.type === 'list') return <p key={index} className="drafting-page__preview-list">{block.text}</p>;
              return <p key={index}>{block.text}</p>;
            })}
          </article>
        </section>

        <aside className={`drafting-page__pane drafting-page__ai-pane ${activePanelClass('ai')}`}>
          <div className="drafting-page__panel-head">
            <h2>AI Section Edit</h2>
            <span>{suggestion?.source === 'fallback' ? 'Fallback' : 'NIM ready'}</span>
          </div>

          <label className="drafting-page__field">
            <span>Selected section</span>
            <select value={activeSection?.id || ''} onChange={(event) => setSelectedSectionId(event.target.value)}>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>{section.title}</option>
              ))}
            </select>
          </label>

          <label className="drafting-page__field">
            <span>Edit mode</span>
            <select value={editMode} onChange={(event) => setEditMode(event.target.value)}>
              {DRAFTING_EDIT_MODES.map((mode) => (
                <option key={mode.id} value={mode.id}>{mode.label}</option>
              ))}
            </select>
          </label>

          <button
            className="drafting-page__ai-run"
            type="button"
            onClick={handleAiEdit}
            disabled={!activeSection || isAiLoading}
          >
            {isAiLoading ? 'Rewriting...' : 'Rewrite Section'}
          </button>

          <div className="drafting-page__compare">
            <div>
              <h3>Original</h3>
              <pre>{activeSection?.body || 'No section selected.'}</pre>
            </div>
            <div>
              <h3>Suggested</h3>
              <pre>{suggestion?.text || 'Run an edit to review a replacement.'}</pre>
            </div>
          </div>

          {suggestion && (
            <div className="drafting-page__suggestion-actions">
              <button type="button" onClick={handleApplySuggestion}>Apply</button>
              <button type="button" onClick={() => setSuggestion(null)}>Discard</button>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
