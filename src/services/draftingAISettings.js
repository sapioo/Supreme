const DEFAULT_SETTINGS = {
  provider: 'gemini',
  apiKey: '',
  model: 'gemini-2.5-flash',
};

export function getDraftingAISettings() {
  return {
    provider: 'gemini',
    apiKey: String(import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.DRAFTING_GEMINI_KEY || '').trim(),
    model: String(import.meta.env.DRAFTING_GEMINI_MODEL || DEFAULT_SETTINGS.model).trim(),
  };
}
