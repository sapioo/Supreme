import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { draftingTemplates } from '../data/draftingTemplates';
import { createDraft, listDrafts, saveDraft } from '../services/draftStorage';
import { chatWithDraftingAI } from '../services/draftingAIService';
import { getDraftingAISettings } from '../services/draftingAISettings';
import '../tailwind.css';
import './DraftingPage.css';

import SetupHeader from '../components/drafting/SetupHeader';
import WizardRail from '../components/drafting/WizardRail';
import WizardStepTemplate from '../components/drafting/WizardStepTemplate';
import WizardStepContext from '../components/drafting/WizardStepContext';
import WizardStepReview from '../components/drafting/WizardStepReview';
import WizardFooter from '../components/drafting/WizardFooter';
import EditorChromeBar from '../components/drafting/EditorChromeBar';
import MobileTabs from '../components/drafting/MobileTabs';
import SourcePane from '../components/drafting/SourcePane';
import PreviewPane from '../components/drafting/PreviewPane';
import AIChatPane from '../components/drafting/AIChatPane';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../components/ui/breadcrumb';

const EMPTY_PREVIEW = [{ type: 'paragraph', text: 'Create or open a draft to begin.' }];
const matterTypes = [
  'Constitutional',
  'Civil',
  'Criminal',
  'Consumer',
  'Family',
  'Property',
  'Arbitration',
  'Corporate',
  'Contracts',
  'Employment',
  'Advisory',
];
const urgencyLevels = ['Standard', 'Due this week', 'Urgent filing', 'Review only'];
const wizardSteps = [
  { id: 'template', label: 'Template' },
  { id: 'context', label: 'Matter' },
  { id: 'review', label: 'Review' },
];


function createLocalId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function extractCommand(source, command) {
  const match = source.match(new RegExp(`\\\\${command}\\{([^}]*)\\}`));
  return match?.[1]?.trim() || '';
}

function extractSectionTitles(source) {
  return [...source.matchAll(/^\\section\{([^}]*)\}\s*$/gm)].map((match) => match[1].trim());
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
  const [copyState, setCopyState] = useState('Copy Draft');
  const [mobileTab, setMobileTab] = useState('source');
  const [viewMode, setViewMode] = useState('setup');
  const [editorLayout, setEditorLayout] = useState('split');
  const [setupTemplateId, setSetupTemplateId] = useState(draftingTemplates[0].id);
  const [setupTitle, setSetupTitle] = useState('');
  const [setupMatterType, setSetupMatterType] = useState(matterTypes[0]);
  const [setupUrgency, setSetupUrgency] = useState(urgencyLevels[0]);
  const [wizardStep, setWizardStep] = useState('template');
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [exportState, setExportState] = useState('Export PDF');
  const aiSettings = getDraftingAISettings();
  const workspaceRef = useRef(null);
  const resizeStateRef = useRef(null);
  const [aiPaneWidth, setAiPaneWidth] = useState(320);

  const previewBlocks = useMemo(() => parsePreview(source), [source]);
  const templateCatalog = useMemo(
    () => draftingTemplates.map((template) => ({ ...template, sectionTitles: extractSectionTitles(template.source) })),
    []
  );
  const currentWizardLabel =
    wizardSteps.find((step) => step.id === wizardStep)?.label || 'Setup';
  const currentDraftName = activeDraft?.title || setupTitle.trim() || 'Drafting';

  useEffect(() => {
    if (!activeDraft) return;
    const timeout = setTimeout(() => {
      const saved = saveDraft({ ...activeDraft, source });
      if (saved) {
        setActiveDraft(saved);
        setDrafts(listDrafts());
      }
    }, 450);

    return () => clearTimeout(timeout);
  }, [activeDraft?.id, activeDraft?.title, source]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handlePointerMove = (event) => {
      const state = resizeStateRef.current;
      if (!state || !workspaceRef.current) return;

      const nextWidth = state.startWidth + (event.clientX - state.startX);
      const workspaceWidth = workspaceRef.current.getBoundingClientRect().width;
      const maxWidth = Math.min(520, Math.max(320, workspaceWidth * 0.45));
      const clampedWidth = Math.max(260, Math.min(maxWidth, nextWidth));
      setAiPaneWidth(clampedWidth);
    };

    const stopResize = () => {
      if (!resizeStateRef.current) return;
      resizeStateRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopResize);
    window.addEventListener('pointercancel', stopResize);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopResize);
      window.removeEventListener('pointercancel', stopResize);
    };
  }, []);

  const resetEditorAssistant = useCallback(() => {
    setChatMessages([]);
    setChatInput('');
    setIsChatLoading(false);
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
    setMobileTab('source');
    setEditorLayout('split');
    setViewMode('editor');
    resetEditorAssistant();
  }, [resetEditorAssistant, setupMatterType, setupTemplateId, setupTitle, setupUrgency, templateCatalog]);

  const handleOpenDraft = useCallback((draft) => {
    setActiveDraft(draft);
    setSource(draft.source);
    setMobileTab('source');
    setEditorLayout('split');
    setViewMode('editor');
    resetEditorAssistant();
  }, [resetEditorAssistant]);

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

  useEffect(() => {
    return () => {
      document.body.classList.remove('drafting-print-mode');
    };
  }, []);

  const handleExportPdf = useCallback(async () => {
    if (!source.trim()) return;

    setMobileTab('preview');
    setEditorLayout('preview');
    setShowRightSidebar(false);
    setExportState('Generating PDF...');

    // Small delay to let the preview pane render/settle
    await new Promise((r) => setTimeout(r, 200));

    try {
      const html2pdf = (await import('html2pdf.js')).default;

      // Grab the pagedjs-rendered pages container
      const pagesEl = document.querySelector('.drafting-preview-pages .pagedjs_pages')
        || document.querySelector('.drafting-preview-pages');

      if (!pagesEl) {
        setExportState('Export failed');
        window.setTimeout(() => setExportState('Export PDF'), 1800);
        return;
      }

      // Build a filename from the first title block or fall back to generic name
      const titleEl = pagesEl.querySelector('.drafting-preview__title');
      const baseName = titleEl?.textContent?.trim().replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 60) || 'draft';
      const fileName = `${baseName}.pdf`;

      await html2pdf()
        .set({
          margin: [0, 0, 0, 0],
          filename: fileName,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            scrollY: 0,
            scrollX: 0,
            windowWidth: pagesEl.scrollWidth,
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'], avoid: '.drafting-preview-keep' },
        })
        .from(pagesEl)
        .save();

      setExportState('Downloaded');
      window.setTimeout(() => setExportState('Export PDF'), 1600);
    } catch (err) {
      console.error('[DraftingPage] PDF export error:', err);
      setExportState('Export failed');
      window.setTimeout(() => setExportState('Export PDF'), 1800);
    }
  }, [source]);

  const handleSendChat = useCallback(async () => {
    const prompt = chatInput.trim();
    if (!prompt || isChatLoading) return;

    const userMessage = {
      id: createLocalId('user'),
      role: 'user',
      content: prompt,
      proposedSource: null,
      proposalState: null,
      source: null,
    };
    const nextConversation = [...chatMessages, userMessage].map((message) => ({
      role: message.role,
      content: message.content,
    }));

    setChatMessages((current) => [...current, userMessage]);
    setChatInput('');
    setIsChatLoading(true);
    setShowRightSidebar(true);
    setMobileTab('ai');

    const result = await chatWithDraftingAI({
      source,
      messages: nextConversation,
    });

    const assistantMessage = {
      id: createLocalId('assistant'),
      role: 'assistant',
      content: result.message,
      proposedSource: result.proposedSource,
      proposalState: result.proposedSource ? 'pending' : null,
      source: result.source,
    };

    setChatMessages((current) => [...current, assistantMessage]);
    setIsChatLoading(false);
  }, [chatInput, chatMessages, isChatLoading, source]);

  const handleApplyProposal = useCallback((messageId) => {
    const target = chatMessages.find((message) => message.id === messageId);
    if (!target?.proposedSource) return;

    setSource(target.proposedSource);
    setChatMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? { ...message, proposalState: 'applied' }
          : message
      )
    );
    setMobileTab('source');
  }, [chatMessages]);

  const handleDiscardProposal = useCallback((messageId) => {
    setChatMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? { ...message, proposalState: 'discarded' }
          : message
      )
    );
  }, []);

  const handleResizeStart = useCallback((event) => {
    if (event.button !== 0) return;
    resizeStateRef.current = {
      startX: event.clientX,
      startWidth: aiPaneWidth,
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    event.preventDefault();
  }, [aiPaneWidth]);

  const providerStatus = aiSettings.apiKey && aiSettings.model ? 'Ready' : 'Env missing';

  const breadcrumb = (
    <Breadcrumb className="drafting-page__breadcrumb">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink onClick={onBack}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          {viewMode === 'editor' ? (
            <BreadcrumbLink onClick={() => setViewMode('setup')}>Drafting</BreadcrumbLink>
          ) : (
            <BreadcrumbPage>Drafting</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>
            {viewMode === 'editor' ? currentDraftName : currentWizardLabel}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  if (viewMode === 'setup') {
    const selectedTemplate = templateCatalog.find((template) => template.id === setupTemplateId) || templateCatalog[0];
    const currentStepIndex = wizardSteps.findIndex((step) => step.id === wizardStep);
    const isFirstStep = currentStepIndex === 0;
    const isFinalStep = currentStepIndex === wizardSteps.length - 1;
    const goNextStep = () => setWizardStep(wizardSteps[Math.min(currentStepIndex + 1, wizardSteps.length - 1)].id);
    const goPreviousStep = () => setWizardStep(wizardSteps[Math.max(currentStepIndex - 1, 0)].id);

    return (
      <main className="drafting-page drafting-page--setup" id="drafting-page">
        {breadcrumb}
        <SetupHeader
        />

        <section className="drafting-setup-layout">
          <WizardRail
            wizardSteps={wizardSteps}
            currentStep={wizardStep}
            onStepClick={setWizardStep}
            drafts={drafts}
            onOpenDraft={handleOpenDraft}
          />

          <section className="drafting-wizard-card">
            {wizardStep === 'template' && (
              <WizardStepTemplate
                templates={templateCatalog}
                selectedId={setupTemplateId}
                onSelect={setSetupTemplateId}
                setupTitle={setupTitle}
                onTitleChange={setSetupTitle}
              />
            )}

            {wizardStep === 'context' && (
              <WizardStepContext
                setupTitle={setupTitle}
                onTitleChange={setSetupTitle}
                matterType={setupMatterType}
                onMatterTypeChange={setSetupMatterType}
                urgency={setupUrgency}
                onUrgencyChange={setSetupUrgency}
                templateName={selectedTemplate.name}
              />
            )}

            {wizardStep === 'review' && (
              <WizardStepReview
                templateName={selectedTemplate.name}
                draftName={setupTitle}
                matterType={setupMatterType}
                urgency={setupUrgency}
              />
            )}

            <WizardFooter
              isFirstStep={isFirstStep}
              isFinalStep={isFinalStep}
              onBack={goPreviousStep}
              onNext={goNextStep}
              onCreate={handleStartSetupDraft}
            />
          </section>
        </section>
      </main>
    );
  }

  const workspaceClassName = showRightSidebar
    ? `drafting-workspace drafting-workspace--with-ai drafting-workspace--layout-${editorLayout}`
    : `drafting-workspace drafting-workspace--without-ai drafting-workspace--layout-${editorLayout}`;
  const workspaceStyle = showRightSidebar
    ? { '--drafting-ai-width': `${aiPaneWidth}px` }
    : undefined;

  const showSinglePaneSwitcher = editorLayout !== 'split';
  const hideSourceOnDesktop = editorLayout === 'preview';
  const hidePreviewOnDesktop = editorLayout === 'source';

  return (
    <main className="drafting-page drafting-page--editor" id="drafting-page">
      <EditorChromeBar
        breadcrumb={breadcrumb}
        showRightSidebar={showRightSidebar}
        onToggleSidebar={() => setShowRightSidebar((c) => !c)}
        onCopy={handleCopy}
        copyState={copyState}
        onExportPdf={handleExportPdf}
        exportState={exportState}
        isExportDisabled={!source.trim()}
        editorLayout={editorLayout}
        onEditorLayoutChange={setEditorLayout}
      />

      <MobileTabs activeTab={mobileTab} onTabChange={setMobileTab} />

      <section className={workspaceClassName} ref={workspaceRef} style={workspaceStyle}>
        {showRightSidebar && (
          <div className={`drafting-pane-shell drafting-pane-shell--ai ${mobileTab === 'ai' ? 'drafting-pane-shell--active' : ''}`}>
            <AIChatPane
              providerStatus={providerStatus}
              chatMessages={chatMessages}
              isChatLoading={isChatLoading}
              chatInput={chatInput}
              onChatInputChange={setChatInput}
              onSendChat={handleSendChat}
              onApplyProposal={handleApplyProposal}
              onDiscardProposal={handleDiscardProposal}
            />
          </div>
        )}

        {showRightSidebar && (
          <div
            className="drafting-pane-resizer"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize AI chat panel"
            onPointerDown={handleResizeStart}
          />
        )}

        <div
          className={`drafting-pane-shell drafting-pane-shell--source ${mobileTab === 'source' ? 'drafting-pane-shell--active' : ''} ${hideSourceOnDesktop ? 'drafting-pane-shell--desktop-hidden' : ''}`}
        >
          <SourcePane
            source={source}
            onChange={(value) => {
              setSource(value);
            }}
            showViewSwitcher={showSinglePaneSwitcher}
            activeView={editorLayout === 'preview' ? 'preview' : 'source'}
            onViewChange={setEditorLayout}
          />
        </div>

        <div
          className={`drafting-pane-shell drafting-pane-shell--preview ${mobileTab === 'preview' ? 'drafting-pane-shell--active' : ''} ${hidePreviewOnDesktop ? 'drafting-pane-shell--desktop-hidden' : ''}`}
        >
          <PreviewPane
            previewBlocks={previewBlocks}
            showViewSwitcher={showSinglePaneSwitcher}
            activeView={editorLayout === 'preview' ? 'preview' : 'source'}
            onViewChange={setEditorLayout}
          />
        </div>
      </section>
    </main>
  );
}
