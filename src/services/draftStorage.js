const STORAGE_KEY = 'supreme_drafts';

function safeRead() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function safeWrite(drafts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function listDrafts() {
  return safeRead().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export function createDraftFromTemplate(template) {
  const now = new Date().toISOString();
  const draft = {
    id: `draft-${Date.now()}`,
    title: template.name,
    templateId: template.id,
    templateName: template.name,
    source: template.source,
    createdAt: now,
    updatedAt: now,
  };

  safeWrite([draft, ...safeRead()]);
  return draft;
}

export function createDraft(draftInput) {
  const now = new Date().toISOString();
  const draft = {
    id: `draft-${Date.now()}`,
    title: draftInput.title || 'Untitled Draft',
    templateId: draftInput.templateId,
    templateName: draftInput.templateName || 'Custom Draft',
    source: draftInput.source || '',
    matterType: draftInput.matterType || '',
    urgency: draftInput.urgency || '',
    createdAt: now,
    updatedAt: now,
  };

  safeWrite([draft, ...safeRead()]);
  return draft;
}

export function saveDraft(draft) {
  if (!draft?.id) return null;
  const nextDraft = {
    ...draft,
    updatedAt: new Date().toISOString(),
  };
  const drafts = safeRead();
  const index = drafts.findIndex((item) => item.id === draft.id);

  if (index >= 0) {
    drafts[index] = nextDraft;
    safeWrite(drafts);
  } else {
    safeWrite([nextDraft, ...drafts]);
  }

  return nextDraft;
}

export function deleteDraft(draftId) {
  safeWrite(safeRead().filter((draft) => draft.id !== draftId));
}

export function getDraft(draftId) {
  return safeRead().find((draft) => draft.id === draftId) || null;
}
