/**
 * tonalService.js — Tonal analysis of user arguments
 *
 * Provider: Gemini (OpenAI-compatible endpoint)
 * Returns a structured tone profile for a given argument text.
 */

const GEMINI_BASE_URL = import.meta.env.DEV
    ? '/api/gemini/v1beta/openai'
    : 'https://generativelanguage.googleapis.com/v1beta/openai';
const GEMINI_MODEL = 'gemini-1.5-flash';

function getGeminiKey() {
    return import.meta.env.VITE_GEMINI_API_KEY || '';
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
            max_tokens: 150,
            temperature: 0.3,
            stream: false,
        }),
        signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content ?? '';

    // Strip any accidental markdown fences
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
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
