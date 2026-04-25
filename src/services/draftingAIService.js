import { getDraftingAISettings } from './draftingAISettings';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const APP_TITLE = 'SUPREME Drafting Editor';

function cleanModelOutput(text) {
  return String(text || '')
    .replace(/^```(?:json|latex|text)?/i, '')
    .replace(/```$/i, '')
    .trim();
}

function getWindowOrigin() {
  if (typeof window === 'undefined') return 'http://localhost';
  return window.location.origin;
}

function normalizeAssistantContent(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.type === 'text') return item.text || '';
        return '';
      })
      .join('\n')
      .trim();
  }

  return '';
}

function parseStructuredResponse(rawContent) {
  const cleaned = cleanModelOutput(rawContent);
  if (!cleaned) {
    return {
      message: 'The assistant returned an empty response.',
      proposedSource: null,
    };
  }

  try {
    const parsed = JSON.parse(cleaned);
    return {
      message: String(parsed?.message || '').trim() || 'The assistant returned no explanation.',
      proposedSource: typeof parsed?.proposedSource === 'string' && parsed.proposedSource.trim()
        ? parsed.proposedSource.trim()
        : null,
    };
  } catch {
    return {
      message: cleaned,
      proposedSource: null,
    };
  }
}

function buildSystemPrompt() {
  return `You are a senior Indian legal drafting assistant working inside a LaTeX drafting editor.
You help revise, explain, and improve legal drafts while preserving valid LaTeX structure.
When the user asks for edits or rewriting, you may return a full revised LaTeX document.
When the user asks only a question, explanation, or drafting advice, do not propose a rewrite.

Always return valid JSON with this exact shape:
{
  "message": "string",
  "proposedSource": "string or null"
}

Rules:
- "message" must always be present and should be concise, practical, and drafting-focused.
- "proposedSource" must be null unless you are intentionally proposing a full-document rewrite.
- If you set "proposedSource", it must contain the complete revised LaTeX source, not a fragment or diff.
- Never wrap JSON in markdown fences.
- Never include commentary outside the JSON object.
- Preserve placeholders like [CLIENT NAME] or [DATE] unless the user explicitly supplies replacements.
- Keep the tone suitable for Indian litigation, transactional, advisory, and compliance drafting.`;
}

function buildUserPrompt({ source, messages }) {
  const history = messages
    .slice(-8)
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join('\n\n');

  return `Current LaTeX source:
${source.slice(0, 18000)}

Conversation:
${history}`;
}

export async function chatWithDraftingAI({ source, messages }) {
  const settings = getDraftingAISettings();
  if (!settings.apiKey || !settings.model) {
    return {
      source: 'config-missing',
      message: 'OpenRouter is not configured yet. Add your API key and model in Settings to use AI chat.',
      proposedSource: null,
    };
  }

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`,
        'HTTP-Referer': getWindowOrigin(),
        'X-Title': APP_TITLE,
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: buildUserPrompt({ source, messages }) },
        ],
        temperature: 0.35,
        top_p: 0.9,
        max_tokens: 1400,
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errorText.slice(0, 240)}`);
    }

    const data = await response.json();
    const content = normalizeAssistantContent(data?.choices?.[0]?.message?.content);
    const parsed = parseStructuredResponse(content);

    return {
      source: 'openrouter',
      message: parsed.message,
      proposedSource: parsed.proposedSource,
    };
  } catch (error) {
    console.warn('[DraftingAI] OpenRouter request failed:', error.message);
    return {
      source: 'error',
      message: `OpenRouter request failed. ${error.message}`,
      proposedSource: null,
    };
  }
}
