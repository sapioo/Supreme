const DEFAULT_SETTINGS = {
  provider: 'openrouter',
  apiKey: '',
  model: '',
};

export function getDraftingAISettings() {
  return {
    provider: 'openrouter',
    apiKey: String(import.meta.env.DRAFTING_OPENROUTER_KEY || '').trim(),
    model: String(import.meta.env.DRAFTING_OPENROUTER_MODEL || '').trim(),
  };
}
