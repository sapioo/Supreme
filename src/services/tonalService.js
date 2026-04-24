/**
 * tonalService.js — Tonal analysis of user arguments
 *
 * Provider: 'nim' (swap to 'gemini' when ready — see bottom of file)
 * Returns a structured tone profile for a given argument text.
 */

const PROVIDER = 'nim';

// ── NIM setup (reuses same proxy config as nimService.js) ──────────────────
const NIM_BASE_URL = import.meta.env.DEV
    ? '/api/nvidia/v1'
    : 'https://integrate.api.nvidia.com/v1';
const NIM_MODEL = 'meta/llama-3.3-70b-instruct';

function getNvidiaKey() {
    return import.meta.env.VITE_NVIDIA_API_KEY || '';
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

// ── NIM call ────────────────────────────────────────────────────────────────
async function callNIM(text, side, round) {
    const apiKey = getNvidiaKey();
    if (!apiKey) return null;

    const res = await fetch(`${NIM_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: NIM_MODEL,
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

// ── Gemini stub (uncomment and fill when switching) ─────────────────────────
// async function callGemini(text, side, round) {
//   const { GoogleGenerativeAI } = await import('@google/generative-ai');
//   const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
//   const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
//   const result = await model.generateContent(buildPrompt(text, side, round));
//   const raw = result.response.text().replace(/```json|```/g, '').trim();
//   return JSON.parse(raw);
// }

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
        const caller = PROVIDER === 'nim' ? callNIM : null; // swap when Gemini ready
        if (!caller) return null;
        const result = await caller(text, side, round);
        if (!result || typeof result.dominant !== 'string') return null;
        return { ...result, side, round };
    } catch (err) {
        console.warn('[TonalAnalysis] Failed gracefully:', err.message);
        return null;
    }
}
