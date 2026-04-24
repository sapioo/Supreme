const NIM_BASE_URL = import.meta.env.DEV
  ? '/api/nvidia/v1'
  : 'https://integrate.api.nvidia.com/v1';
const NIM_MODEL = 'meta/llama-3.3-70b-instruct';

export const DRAFTING_EDIT_MODES = [
  { id: 'formalize', label: 'Formalize' },
  { id: 'shorten', label: 'Shorten' },
  { id: 'strengthen', label: 'Strengthen Legal Tone' },
  { id: 'notes', label: 'Convert Notes to Draft' },
];

function getNvidiaKey() {
  return import.meta.env.VITE_NVIDIA_API_KEY || '';
}

function cleanModelOutput(text) {
  return String(text || '')
    .replace(/^```(?:latex|text)?/i, '')
    .replace(/```$/i, '')
    .trim();
}

function fallbackRewrite({ sectionTitle, sectionText, editMode }) {
  const text = String(sectionText || '').trim();
  if (!text) {
    return `The ${sectionTitle} section should set out the relevant material in clear legal prose, replacing placeholders with client-specific facts and relief.`;
  }

  if (editMode === 'shorten') {
    return text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 3)
      .join('\n');
  }

  if (editMode === 'notes') {
    return `It is submitted that ${text
      .replace(/^[-*\d.\s]+/gm, '')
      .replace(/\n+/g, ' ')
      .trim()} The same is material for adjudication and may be relied upon in support of the present draft.`;
  }

  if (editMode === 'strengthen') {
    return `${text}\n\nIt is further submitted that the above facts establish a clear legal basis for relief, and any contrary position would cause prejudice, uncertainty, and avoidable multiplicity of proceedings.`;
  }

  return `It is respectfully submitted that ${text
    .replace(/\n+/g, ' ')
    .trim()} The same is stated for the proper consideration of the competent forum.`;
}

export async function rewriteDraftSection({
  fullDraft,
  sectionTitle,
  sectionText,
  editMode,
}) {
  const apiKey = getNvidiaKey();
  if (!apiKey) {
    return {
      source: 'fallback',
      text: fallbackRewrite({ sectionTitle, sectionText, editMode }),
    };
  }

  const modeLabel = DRAFTING_EDIT_MODES.find((mode) => mode.id === editMode)?.label || 'Formalize';
  const systemPrompt = `You are a senior Indian legal drafting assistant.
Rewrite only the selected section of a legal draft.
Return replacement text for the selected section body only.
Do not include a section heading, markdown fence, explanation, or commentary.
Preserve legal placeholders such as [CLIENT NAME] when facts are missing.
Use precise legal prose suitable for Indian litigation and advisory drafting.`;

  const userPrompt = `Edit mode: ${modeLabel}
Selected section: ${sectionTitle}

Selected section body:
${sectionText}

Full draft context:
${fullDraft.slice(0, 7000)}`;

  try {
    const response = await fetch(`${NIM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: NIM_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.35,
        top_p: 0.9,
        max_tokens: 650,
        stream: false,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`NIM API error ${response.status}`);
    }

    const data = await response.json();
    const text = cleanModelOutput(data.choices?.[0]?.message?.content);
    if (!text) throw new Error('NIM returned empty draft section.');

    return { source: 'nim', text };
  } catch (err) {
    console.warn('[DraftingAI] Falling back:', err.message);
    return {
      source: 'fallback',
      text: fallbackRewrite({ sectionTitle, sectionText, editMode }),
    };
  }
}
