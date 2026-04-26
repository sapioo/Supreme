const STORAGE_KEY = 'supreme_drafting_ai_settings';

const DEFAULT_SETTINGS = {
  provider: 'openrouter',
  apiKey: '',
  model: '',
};

function safeRead() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function getDraftingAISettings() {
  return safeRead();
}

export function saveDraftingAISettings(settings) {
  const next = {
    provider: 'openrouter',
    apiKey: String(settings?.apiKey || '').trim(),
    model: String(settings?.model || '').trim(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearDraftingAISettings() {
  localStorage.removeItem(STORAGE_KEY);
  return { ...DEFAULT_SETTINGS };
}
