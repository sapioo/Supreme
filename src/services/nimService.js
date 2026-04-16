/**
 * nimService.js — NVIDIA NIM LLM Service
 *
 * Uses NVIDIA's NIM API (OpenAI-compatible) to generate real AI legal arguments
 * in response to the user's submissions. Replaces the static mockAI responses
 * for text mode.
 */

// In dev, use the Vite proxy to avoid CORS. In production, call directly.
const NIM_BASE_URL = import.meta.env.DEV
  ? '/api/nvidia/v1'
  : 'https://integrate.api.nvidia.com/v1';
const NIM_MODEL = 'meta/llama-3.3-70b-instruct';

function getNvidiaKey() {
  return import.meta.env.VITE_NVIDIA_API_KEY || '';
}

/**
 * Quick connectivity check — call this once to verify NIM is reachable.
 * Returns true if the API responds, false otherwise.
 */
export async function checkNIMConnectivity() {
  const apiKey = getNvidiaKey();
  if (!apiKey) return false;
  try {
    const res = await fetch(`${NIM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: NIM_MODEL,
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 5,
        stream: false,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      console.log('[NIM] ✓ Connected to NVIDIA NIM');
      return true;
    }
    const err = await res.text().catch(() => '');
    console.warn('[NIM] API responded with', res.status, err.slice(0, 100));
    return false;
  } catch (e) {
    console.warn('[NIM] Not reachable:', e.message);
    return false;
  }
}

/**
 * Generate an AI legal argument using NVIDIA NIM.
 *
 * @param {Object} params
 * @param {string} params.userArgument - The user's submitted argument text
 * @param {string} params.caseData - The case object from cases.js
 * @param {string} params.aiSide - 'petitioner' | 'respondent'
 * @param {number} params.currentRound - Current round number
 * @param {number} params.totalRounds - Total rounds
 * @param {string} [params.caseContext] - Optional Qdrant-retrieved context
 * @param {string} [params.conversationHistory] - Prior arguments for context
 * @returns {Promise<string>} - The AI's argument text
 */
// Maps difficulty to max_tokens for AI responses
const DIFFICULTY_TOKENS = {
  easy:   60,    // 1-2 short sentences
  medium: 100,   // 2-3 sentences max
  hard:   180,   // short paragraph with one citation
};

export async function generateAIArgument({
  userArgument,
  caseData,
  aiSide,
  currentRound,
  totalRounds,
  difficulty = 'medium',
  caseContext = '',
  conversationHistory = [],
}) {
  const apiKey = getNvidiaKey();
  if (!apiKey) {
    throw new Error('[NIM] NVIDIA API key not configured.');
  }

  const aiParty = caseData[aiSide];
  const userSide = aiSide === 'petitioner' ? 'respondent' : 'petitioner';
  const userParty = caseData[userSide];

  const maxTokens = DIFFICULTY_TOKENS[difficulty] ?? DIFFICULTY_TOKENS.medium;

  // Difficulty-specific instruction
  const lengthInstruction = {
    easy:   'Respond in exactly 1-2 short sentences. Stop after the second sentence. End on a complete sentence.',
    medium: 'Respond in exactly 2-3 short sentences. Stop after the third sentence. End on a complete sentence.',
    hard:   'Respond in 3-4 sentences with one constitutional article cited. End on a complete sentence.',
  }[difficulty] ?? 'Respond in exactly 2-3 short sentences. End on a complete sentence.';

  // Build the system prompt
  let systemPrompt = `You are ${aiParty.name}, arguing as the ${aiSide} in the landmark Indian Supreme Court case "${caseData.shortName}" (${caseData.year}).

Your position: ${aiParty.position}
${aiParty.description}

Key arguments you should draw from:
${aiParty.keyArgs.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Relevant constitutional articles: ${caseData.articles.join(', ')}

You are in a live courtroom debate simulation. The opposing counsel (${userParty.name}) has just made an argument. Respond as a skilled Indian Supreme Court advocate would.

STRICT RULES:
- Address the bench as "My Lords" or "Your Lordships"
- ${lengthInstruction}
- Be formal, authoritative, and precise
- Directly counter the opponent's specific points
- Cite constitutional articles and legal principles by name
- Do NOT use bullet points or numbered lists — write in flowing legal prose
- Do NOT break character or acknowledge this is a simulation
- This is Round ${currentRound} of ${totalRounds}${currentRound === totalRounds ? ' — this is your closing submission, make it count' : ''}`;

  if (caseContext) {
    systemPrompt += `\n\nRELEVANT CASE KNOWLEDGE (from actual judgment):\n${caseContext}`;
  }

  // Build conversation messages
  const messages = [{ role: 'system', content: systemPrompt }];

  // Add prior rounds as context (last 4 exchanges max to stay within token limits)
  const recentHistory = conversationHistory.slice(-4);
  for (const entry of recentHistory) {
    messages.push({
      role: entry.side === 'user' ? 'user' : 'assistant',
      content: entry.text,
    });
  }

  // Add the current user argument
  messages.push({
    role: 'user',
    content: userArgument,
  });

  const response = await fetch(`${NIM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: NIM_MODEL,
      messages,
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: maxTokens,
      stop: ['\n\n', '---'],   // stop at paragraph break
      stream: false,
    }),
    signal: AbortSignal.timeout(30000), // 30s timeout
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`NIM API error (${response.status}): ${errBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('[NIM] Empty response from API.');
  }

  return content.trim();
}

/**
 * Score a user's argument using NIM — returns structured scores.
 * Falls back to keyword scoring if the API call fails.
 *
 * @param {Object} params
 * @param {string} params.userArgument
 * @param {Object} params.caseData
 * @param {string} params.side
 * @param {number} params.round
 * @returns {Promise<Object>} - { legalReasoning, useOfPrecedent, persuasiveness, constitutionalValidity }
 */
export async function scoreArgumentWithAI({ userArgument, caseData, side, round }) {
  const apiKey = getNvidiaKey();
  if (!apiKey) return null;

  const systemPrompt = `You are a Supreme Court judge evaluating a legal argument in a courtroom simulation. 
Score the following argument on four dimensions, each from 0 to 100.
Respond ONLY with a valid JSON object in this exact format, no other text:
{"legalReasoning": <number>, "useOfPrecedent": <number>, "persuasiveness": <number>, "constitutionalValidity": <number>}

Scoring guidelines:
- legalReasoning: Quality of legal logic, structure, and reasoning (0-100)
- useOfPrecedent: Whether cases, judgments, or legal authorities are cited (0-100)  
- persuasiveness: How compelling and rhetorically effective the argument is (0-100)
- constitutionalValidity: Whether constitutional articles and principles are correctly invoked (0-100)

Be fair but critical. A short generic argument should score 20-40. A detailed argument with specific citations should score 60-85. An exceptional argument with precise case law and constitutional analysis can score 85-100.`;

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
          { role: 'user', content: `Case: ${caseData.shortName}\nSide: ${side}\nRound: ${round}\n\nArgument to score:\n${userArgument}` },
        ],
        temperature: 0.3,
        max_tokens: 100,
        stream: false,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    // Extract JSON from response (sometimes model adds extra text)
    const jsonMatch = content.match(/\{[^}]+\}/);
    if (!jsonMatch) return null;

    const scores = JSON.parse(jsonMatch[0]);

    // Validate all keys exist and are numbers
    const keys = ['legalReasoning', 'useOfPrecedent', 'persuasiveness', 'constitutionalValidity'];
    for (const key of keys) {
      if (typeof scores[key] !== 'number') return null;
      scores[key] = Math.min(100, Math.max(0, Math.round(scores[key])));
    }

    return scores;
  } catch {
    return null;
  }
}

export default { generateAIArgument, scoreArgumentWithAI };
