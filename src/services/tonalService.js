/**
 * tonalService.js — Tonal analysis of user arguments
 *
 * Provider: Gemini (OpenAI-compatible endpoint)
 * Returns a structured tone profile for a given argument text.
 */

const GEMINI_BASE_URL = import.meta.env.DEV
    ? '/api/gemini/v1beta/openai'
    : 'https://generativelanguage.googleapis.com/v1beta/openai';
const GEMINI_MODEL = 'gemini-2.5-flash';

function getGeminiKey() {
    return import.meta.env.VITE_GEMINI_API_KEY || '';
}

function extractMessageContent(data) {
    const message = data?.choices?.[0]?.message;
    if (!message) return '';

    const content = message.content;
    if (typeof content === 'string') return content.trim();

    if (Array.isArray(content)) {
        return content
            .map((part) => {
                if (typeof part === 'string') return part;
                if (!part || typeof part !== 'object') return '';
                return part.text || part.content || part.value || '';
            })
            .filter(Boolean)
            .join(' ')
            .trim();
    }

    if (content && typeof content === 'object') {
        if (typeof content.text === 'string') return content.text.trim();
        try {
            return JSON.stringify(content);
        } catch {
            return '';
        }
    }

    return '';
}

function parseJsonFromText(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const clean = raw.replace(/```json|```/gi, '').trim();

    try {
        return JSON.parse(clean);
    } catch {
        // Continue to fallback extraction.
    }

    const objectMatch = clean.match(/\{[\s\S]*\}/);
    if (!objectMatch) return null;

    try {
        return JSON.parse(objectMatch[0]);
    } catch {
        return null;
    }
}

function normalizeTonePayload(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;

    const allowedDominants = [
        'Assertive',
        'Measured',
        'Aggressive',
        'Defensive',
        'Persuasive',
        'Conciliatory',
        'Analytical',
        'Emotional',
    ];

    const dominant = String(payload.dominant || payload.tone || 'Analytical').trim();
    const safeDominant = allowedDominants.includes(dominant) ? dominant : 'Analytical';

    const toInt = (value, fallback = 50) => {
        const n = Number(value);
        if (!Number.isFinite(n)) return fallback;
        return Math.max(0, Math.min(100, Math.round(n)));
    };

    const rawTags = Array.isArray(payload.tags)
        ? payload.tags
        : Array.isArray(payload.keywords)
            ? payload.keywords
            : payload.tags
                ? [payload.tags]
                : [];

    const tags = rawTags
        .map((tag) => String(tag || '').trim())
        .filter(Boolean)
        .slice(0, 3);

    return {
        dominant: safeDominant,
        confidence: toInt(payload.confidence, 55),
        formality: toInt(payload.formality, 60),
        emotionality: toInt(payload.emotionality, 35),
        tags,
        tip: String(payload.tip || payload.suggestion || '').trim() || 'Support each claim with one precise constitutional citation.',
    };
}

// ── prompt ─────────────────────────────────────────────────────────────────
function buildPrompt(text, side, round) {
    return `You are a professional legal rhetoric analyst. Analyse the tone of this courtroom argument.

Side: ${side}
Round: ${round}
Argument:
"""
${text}
"""

Return ONLY valid JSON (no markdown, no explanation) with exactly these keys:
{
  "dominant": "<one of: Assertive | Measured | Aggressive | Defensive | Persuasive | Conciliatory | Analytical | Emotional>",
  "confidence": <integer 0-100>,
  "formality": <integer 0-100>,
  "emotionality": <integer 0-100>,
  "tags": ["<2-3 short descriptors>"],
  "tip": "<one concrete suggestion to improve tone for the next argument, max 12 words>"
}`;
}

// ── Gemini call ─────────────────────────────────────────────────────────────
async function callGemini(text, side, round) {
    const apiKey = getGeminiKey();
    if (!apiKey) return null;

    const res = await fetch(`${GEMINI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: GEMINI_MODEL,
            messages: [{ role: 'user', content: buildPrompt(text, side, round) }],
            response_format: { type: 'json_object' },
            max_tokens: 150,
            temperature: 0.3,
            stream: false,
        }),
        signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const raw = extractMessageContent(data);
    const parsed = parseJsonFromText(raw);
    return normalizeTonePayload(parsed);
}

// ── Public API ──────────────────────────────────────────────────────────────
/**
 * Analyse the tone of a user argument.
 * Fire-and-forget friendly — always resolves (never throws).
 *
 * @param {{ text: string, side: string, round: number }} params
 * @returns {Promise<object|null>}
 */
export async function analyzeTone({ text, side, round }) {
    if (!text || text.trim().length < 10) return null;
    try {
        const result = await callGemini(text, side, round);
        if (!result || typeof result.dominant !== 'string') return null;
        return { ...result, side, round };
    } catch (err) {
        console.warn('[TonalAnalysis] Failed gracefully:', err.message);
        return null;
    }
}
