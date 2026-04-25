import { useCallback, useEffect, useMemo, useState } from 'react';
import { draftingTemplates } from '../data/draftingTemplates';
import { createDraft, createDraftFromTemplate, deleteDraft, listDrafts, saveDraft } from '../services/draftStorage';
import { DRAFTING_EDIT_MODES, rewriteDraftSection } from '../services/draftingAIService';
import './DraftingPage.css';

const EMPTY_PREVIEW = [{ type: 'paragraph', text: 'Create or open a draft to begin.' }];
const matterTypes = ['Civil', 'Criminal', 'Constitutional', 'Commercial', 'Advisory'];
const urgencyLevels = ['Standard', 'Due this week', 'Urgent filing', 'Review only'];
const wizardSteps = [
  { id: 'template', label: 'Template' },
  { id: 'context', label: 'Matter' },
  { id: 'review', label: 'Review' },
];

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

function extractSectionTitles(source) {
  return [...source.matchAll(/^\\section\{([^}]*)\}\s*$/gm)].map((match) => match[1].trim());
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

function ChromeIcon({ type }) {
  if (type === 'sections') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 6.75h14M5 12h14M5 17.25h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="7" cy="6.75" r="1" fill="currentColor" />
        <circle cx="7" cy="12" r="1" fill="currentColor" />
        <circle cx="7" cy="17.25" r="1" fill="currentColor" />
      </svg>
    );
  }

  if (type === 'details') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4.5" y="5" width="15" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 9.25h8M8 12.5h5.5M8 15.75h7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7.5a2.5 2.5 0 0 1 2.5-2.5h9A2.5 2.5 0 0 1 19 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 16.5z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15.5 5v14" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
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
  const [wizardStep, setWizardStep] = useState('template');
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showEditorHeader, setShowEditorHeader] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);

  const sections = useMemo(() => parseSections(source), [source]);
  const previewBlocks = useMemo(() => parsePreview(source), [source]);
  const templateCatalog = useMemo(
    () => draftingTemplates.map((template) => ({ ...template, sectionTitles: extractSectionTitles(template.source) })),
    []
  );
  const resolvedSectionId = sections.some((section) => section.id === selectedSectionId) ? selectedSectionId : sections[0]?.id || '';
  const activeSection = useMemo(
    () => sections.find((section) => section.id === resolvedSectionId) || null,
    [resolvedSectionId, sections]
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
    const template = templateCatalog.find((item) => item.id === setupTemplateId) || templateCatalog[0];
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
  }, [setupMatterType, setupTemplateId, setupTitle, setupUrgency, templateCatalog]);

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
  const editorLayoutClass = showLeftSidebar && showRightSidebar
    ? 'drafting-page--layout-default'
    : showLeftSidebar
      ? 'drafting-page--layout-right-hidden'
      : showRightSidebar
        ? 'drafting-page--layout-left-hidden'
        : 'drafting-page--layout-dual-hidden';

  if (viewMode === 'setup') {
    const selectedTemplate = templateCatalog.find((template) => template.id === setupTemplateId) || templateCatalog[0];
    const currentStepIndex = wizardSteps.findIndex((step) => step.id === wizardStep);
    const isFirstStep = currentStepIndex === 0;
    const isFinalStep = currentStepIndex === wizardSteps.length - 1;
    const goNextStep = () => setWizardStep(wizardSteps[Math.min(currentStepIndex + 1, wizardSteps.length - 1)].id);
    const goPreviousStep = () => setWizardStep(wizardSteps[Math.max(currentStepIndex - 1, 0)].id);

    return (
      <main className="drafting-page drafting-page--setup" id="drafting-page">
        <header className="drafting-page__setup-shell">
          <button className="drafting-page__back" type="button" onClick={onBack}>
            Back Home
          </button>
          <div className="drafting-page__setup-title">
            <p className="drafting-page__setup-kicker">Drafting setup</p>
            <h1>Prepare a draft</h1>
            <p>Set the document type, matter context, and save it before opening the editor.</p>
          </div>
          {activeDraft && (
            <button className="drafting-page__copy" type="button" onClick={() => setViewMode('editor')}>
              Continue Editor
            </button>
          )}
        </header>

        <section className="drafting-page__wizard-layout">
          <aside className="drafting-page__wizard-rail" aria-label="Draft setup steps">
            <div className="drafting-page__wizard-progress">
              {wizardSteps.map((step, index) => (
                <button
                  key={step.id}
                  className={`drafting-page__wizard-step ${wizardStep === step.id ? 'drafting-page__wizard-step--active' : ''} ${index < currentStepIndex ? 'drafting-page__wizard-step--done' : ''}`}
                  type="button"
                  onClick={() => setWizardStep(step.id)}
                >
                  <span>{index + 1}</span>
                  <strong>{step.label}</strong>
                </button>
              ))}
            </div>

            <div className="drafting-page__wizard-recents">
              <div className="drafting-page__panel-head">
                <h2>Recent drafts</h2>
                <span>{drafts.length}</span>
              </div>
              {drafts.length === 0 && <p className="drafting-page__empty">No saved drafts yet.</p>}
              {drafts.slice(0, 5).map((draft) => (
                <button key={draft.id} type="button" onClick={() => handleOpenDraft(draft)}>
                  <span>{draft.title}</span>
                  <small>{draft.templateName} | {formatTime(draft.updatedAt)}</small>
                </button>
              ))}
            </div>
          </aside>

          <section className="drafting-page__wizard-card">
            {wizardStep === 'template' && (
              <div className="drafting-page__wizard-panel">
                <div className="drafting-page__wizard-head">
                  <p>Step 1 of 3</p>
                  <h2>Select the document type</h2>
                  <span>Choose from a larger drafting library and start from a more specific legal structure.</span>
                </div>
                <div className="drafting-page__wizard-templates">
                  {templateCatalog.map((template) => (
                    <button
                      key={template.id}
                      className={`drafting-page__wizard-template ${setupTemplateId === template.id ? 'drafting-page__wizard-template--active' : ''}`}
                      type="button"
                      onClick={() => {
                        setSetupTemplateId(template.id);
                        if (!setupTitle.trim()) setSetupTitle(template.name);
                      }}
                    >
                      <div className="drafting-page__wizard-template-topline">
                        <strong>{template.name}</strong>
                        <small>{template.category}</small>
                      </div>
                      <span>{template.description}</span>
                      <div className="drafting-page__wizard-template-meta">
                        <small>{template.sectionTitles.length} sections</small>
                        <small>{template.shortName}</small>
                      </div>
                      <p>{template.sectionTitles.slice(0, 3).join(' • ')}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {wizardStep === 'context' && (
              <div className="drafting-page__wizard-panel">
                <div className="drafting-page__wizard-head">
                  <p>Step 2 of 3</p>
                  <h2>Save the matter context</h2>
                  <span>Name the work and tag the matter so it is easy to reopen later.</span>
                </div>
                <div className="drafting-page__wizard-form">
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
              </div>
            )}

            {wizardStep === 'review' && (
              <div className="drafting-page__wizard-panel">
                <div className="drafting-page__wizard-head">
                  <p>Step 3 of 3</p>
                  <h2>Review and create</h2>
                  <span>Confirm the setup before opening the LaTeX-style drafting editor.</span>
                </div>
                <div className="drafting-page__wizard-review">
                  <div>
                    <span>Template</span>
                    <strong>{selectedTemplate.name}</strong>
                  </div>
                  <div>
                    <span>Draft name</span>
                    <strong>{setupTitle.trim() || selectedTemplate.name}</strong>
                  </div>
                  <div>
                    <span>Matter</span>
                    <strong>{setupMatterType}</strong>
                  </div>
                  <div>
                    <span>Priority</span>
                    <strong>{setupUrgency}</strong>
                  </div>
                </div>
              </div>
            )}

            <footer className="drafting-page__wizard-actions">
              <button type="button" onClick={goPreviousStep} disabled={isFirstStep}>
                Back
              </button>
              {isFinalStep ? (
                <button type="button" onClick={handleStartSetupDraft}>
                  Create and Open Editor
                </button>
              ) : (
                <button type="button" onClick={goNextStep}>
                  Continue
                </button>
              )}
            </footer>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className={`drafting-page drafting-page--editor ${editorLayoutClass}`} id="drafting-page">
      <header className="drafting-page__chrome-bar">
        <button className="drafting-page__back" type="button" onClick={() => setViewMode('setup')}>
          Setup
        </button>
        <div className="drafting-page__chrome-main">
          <div className="drafting-page__chrome-title">
            <span>Draft Workspace</span>
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
          </div>
          {showEditorHeader && (
            <div className="drafting-page__chrome-meta">
              <div className="drafting-page__chrome-chip">
                <span>Template</span>
                <strong>{currentTemplateName}</strong>
              </div>
              <div className="drafting-page__chrome-chip">
                <span>Status</span>
                <strong>{saveState === 'saving' ? 'Saving...' : `Saved ${formatTime(activeDraft?.updatedAt)}`}</strong>
              </div>
            </div>
          )}
        </div>
        <div className="drafting-page__chrome-actions">
          <button
            className={`drafting-page__mode-btn drafting-page__icon-btn ${showLeftSidebar ? 'drafting-page__icon-btn--active' : ''}`}
            type="button"
            onClick={() => setShowLeftSidebar((current) => !current)}
            aria-label={showLeftSidebar ? 'Hide sections rail' : 'Show sections rail'}
            title={showLeftSidebar ? 'Hide sections rail' : 'Show sections rail'}
          >
            <ChromeIcon type="sections" />
          </button>
          <button
            className={`drafting-page__mode-btn drafting-page__icon-btn ${showEditorHeader ? 'drafting-page__icon-btn--active' : ''}`}
            type="button"
            onClick={() => setShowEditorHeader((current) => !current)}
            aria-label={showEditorHeader ? 'Hide draft details' : 'Show draft details'}
            title={showEditorHeader ? 'Hide draft details' : 'Show draft details'}
          >
            <ChromeIcon type="details" />
          </button>
          <button
            className={`drafting-page__mode-btn drafting-page__icon-btn ${showRightSidebar ? 'drafting-page__icon-btn--active' : ''}`}
            type="button"
            onClick={() => setShowRightSidebar((current) => !current)}
            aria-label={showRightSidebar ? 'Hide AI rail' : 'Show AI rail'}
            title={showRightSidebar ? 'Hide AI rail' : 'Show AI rail'}
          >
            <ChromeIcon type="ai" />
          </button>
          <button className="drafting-page__copy" type="button" onClick={handleCopy} disabled={!source.trim()}>
            {copyState}
          </button>
        </div>
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
        {showLeftSidebar && (
          <aside className="drafting-page__sidebar">
            <section className="drafting-page__panel">
              <div className="drafting-page__panel-head">
                <h2>Sections</h2>
                <span>{sections.length}</span>
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
        )}

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

        {showRightSidebar && (
          <aside className={`drafting-page__pane drafting-page__ai-pane ${activePanelClass('ai')}`}>
            <div className="drafting-page__panel-head">
              <h2>AI Section Edit</h2>
              <span>{suggestion?.source === 'fallback' ? 'Fallback' : 'NIM ready'}</span>
            </div>

            <label className="drafting-page__field">
              <span>Selected section</span>
              <select value={resolvedSectionId} onChange={(event) => setSelectedSectionId(event.target.value)}>
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
        )}
      </section>
    </main>
  );
}
