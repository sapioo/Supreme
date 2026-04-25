import { useCallback, useEffect, useMemo, useState } from 'react';
import { draftingTemplates } from '../data/draftingTemplates';
import { createDraft, listDrafts, saveDraft } from '../services/draftStorage';
import { chatWithDraftingAI } from '../services/draftingAIService';
import {
  clearDraftingAISettings,
  getDraftingAISettings,
  saveDraftingAISettings,
} from '../services/draftingAISettings';
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
import SettingsDialog from '../components/drafting/SettingsDialog';

const EMPTY_PREVIEW = [{ type: 'paragraph', text: 'Create or open a draft to begin.' }];
const matterTypes = ['Civil', 'Criminal', 'Constitutional', 'Commercial', 'Advisory'];
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
  const [saveState, setSaveState] = useState('idle');
  const [copyState, setCopyState] = useState('Copy Draft');
  const [mobileTab, setMobileTab] = useState('source');
  const [viewMode, setViewMode] = useState('setup');
  const [setupTemplateId, setSetupTemplateId] = useState(draftingTemplates[0].id);
  const [setupTitle, setSetupTitle] = useState('');
  const [setupMatterType, setSetupMatterType] = useState(matterTypes[0]);
  const [setupUrgency, setSetupUrgency] = useState(urgencyLevels[0]);
  const [wizardStep, setWizardStep] = useState('template');
  const [showEditorDetails, setShowEditorDetails] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [aiSettings, setAiSettings] = useState(() => getDraftingAISettings());
  const [settingsForm, setSettingsForm] = useState(() => getDraftingAISettings());

  const previewBlocks = useMemo(() => parsePreview(source), [source]);
  const templateCatalog = useMemo(
    () => draftingTemplates.map((template) => ({ ...template, sectionTitles: extractSectionTitles(template.source) })),
    []
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
    setSaveState('saved');
    setMobileTab('source');
    setViewMode('editor');
    resetEditorAssistant();
  }, [resetEditorAssistant, setupMatterType, setupTemplateId, setupTitle, setupUrgency, templateCatalog]);

  const handleOpenDraft = useCallback((draft) => {
    setActiveDraft(draft);
    setSource(draft.source);
    setSaveState('saved');
    setMobileTab('source');
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

  const openSettings = useCallback(() => {
    const latestSettings = getDraftingAISettings();
    setAiSettings(latestSettings);
    setSettingsForm(latestSettings);
    setSettingsError('');
    setIsSettingsOpen(true);
  }, []);

  const handleSaveSettings = useCallback(() => {
    const apiKey = settingsForm.apiKey.trim();
    const model = settingsForm.model.trim();

    if (!apiKey || !model) {
      setSettingsError('API key and model are both required.');
      return;
    }

    const next = saveDraftingAISettings({ apiKey, model });
    setAiSettings(next);
    setSettingsForm(next);
    setSettingsError('');
    setIsSettingsOpen(false);
  }, [settingsForm.apiKey, settingsForm.model]);

  const handleClearSettings = useCallback(() => {
    const cleared = clearDraftingAISettings();
    setAiSettings(cleared);
    setSettingsForm(cleared);
    setSettingsError('');
  }, []);

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
    setSaveState('saving');
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

  const providerStatus = aiSettings.apiKey && aiSettings.model ? 'Ready' : 'Needs setup';

  if (viewMode === 'setup') {
    const selectedTemplate = templateCatalog.find((template) => template.id === setupTemplateId) || templateCatalog[0];
    const currentStepIndex = wizardSteps.findIndex((step) => step.id === wizardStep);
    const isFirstStep = currentStepIndex === 0;
    const isFinalStep = currentStepIndex === wizardSteps.length - 1;
    const goNextStep = () => setWizardStep(wizardSteps[Math.min(currentStepIndex + 1, wizardSteps.length - 1)].id);
    const goPreviousStep = () => setWizardStep(wizardSteps[Math.max(currentStepIndex - 1, 0)].id);

    return (
      <main className="drafting-page drafting-page--setup" id="drafting-page">
        <SetupHeader
          onBack={onBack}
          activeDraft={activeDraft}
          onContinueEditor={() => setViewMode('editor')}
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
    ? 'drafting-workspace drafting-workspace--with-ai'
    : 'drafting-workspace drafting-workspace--without-ai';

  return (
    <main className="drafting-page drafting-page--editor" id="drafting-page">
      <EditorChromeBar
        activeDraft={activeDraft}
        onTitleChange={(value) => {
          if (!activeDraft) return;
          setActiveDraft({ ...activeDraft, title: value });
          setSaveState('saving');
        }}
        aiSettings={aiSettings}
        saveState={saveState}
        showEditorDetails={showEditorDetails}
        onToggleDetails={() => setShowEditorDetails((c) => !c)}
        showRightSidebar={showRightSidebar}
        onToggleSidebar={() => setShowRightSidebar((c) => !c)}
        onOpenSettings={openSettings}
        onCopy={handleCopy}
        copyState={copyState}
        onBackToSetup={() => setViewMode('setup')}
      />

      <MobileTabs activeTab={mobileTab} onTabChange={setMobileTab} />

      <section className={workspaceClassName}>
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

        <div className={`drafting-pane-shell drafting-pane-shell--source ${mobileTab === 'source' ? 'drafting-pane-shell--active' : ''}`}>
          <SourcePane
            source={source}
            onChange={(value) => {
              setSource(value);
              setSaveState('saving');
            }}
          />
        </div>

        <div className={`drafting-pane-shell drafting-pane-shell--preview ${mobileTab === 'preview' ? 'drafting-pane-shell--active' : ''}`}>
          <PreviewPane previewBlocks={previewBlocks} />
        </div>
      </section>

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settingsForm={settingsForm}
        onFormChange={setSettingsForm}
        onSave={handleSaveSettings}
        onClear={handleClearSettings}
        error={settingsError}
      />
    </main>
  );
}
