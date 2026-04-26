/**
 * nimService.js — LLM Service (Gemini)
 *
 * Text generation/scoring are routed to Gemini via the OpenAI-compatible API.
 * Embeddings stay in qdrantService.js (NVIDIA), unchanged.
 */

// In dev, use the Vite proxy to avoid CORS. In production, call Gemini directly.
const GEMINI_BASE_URL = import.meta.env.DEV
  ? '/api/gemini/v1beta/openai'
  : 'https://generativelanguage.googleapis.com/v1beta/openai';
const GEMINI_MODEL = 'gemini-2.5-flash';

function getGeminiKey() {
  return import.meta.env.VITE_GEMINI_API_KEY || '';
}

function extractContent(data) {
  const message = data?.choices?.[0]?.message;
  if (!message) return '';

  const content = message.content;
  if (typeof content === 'string') return content.trim();

  if (Array.isArray(content)) {
    const joined = content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (!part || typeof part !== 'object') return '';
        return part.text || part.content || part.value || '';
      })
      .filter(Boolean)
      .join(' ')
      .trim();
    if (joined) return joined;
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

function extractStructuredPayload(data) {
  const message = data?.choices?.[0]?.message;
  if (!message) return null;

  if (message.parsed && typeof message.parsed === 'object') {
    return message.parsed;
  }

  const toolArgs = message?.tool_calls?.[0]?.function?.arguments;
  if (typeof toolArgs === 'string') {
    const parsedArgs = parseJsonFromText(toolArgs);
    if (parsedArgs) return parsedArgs;
  }

  const content = message.content;
  if (content && typeof content === 'object' && !Array.isArray(content)) {
    return content;
  }

  if (Array.isArray(content)) {
    for (const part of content) {
      if (!part || typeof part !== 'object') continue;
      if (part.json && typeof part.json === 'object') return part.json;
      if (typeof part.text === 'string') {
        const parsed = parseJsonFromText(part.text);
        if (parsed) return parsed;
      }
    }
  }

  return null;
}

function parseJsonFromText(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const clean = raw.replace(/```json|```/gi, '').trim();

  try {
    return JSON.parse(clean);
  } catch {
    // Continue to bracket matching fallback below.
  }

  const objectMatch = clean.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch {
      // Ignore and continue.
    }
  }

  const arrayMatch = clean.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch {
      // Ignore.
    }
  }

  // Last-resort balanced JSON extraction for chatty model outputs.
  const extractBalanced = (text, startIndex) => {
    const startChar = text[startIndex];
    const endChar = startChar === '{' ? '}' : ']';
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = startIndex; i < text.length; i += 1) {
      const ch = text[i];

      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (ch === startChar) depth += 1;
      if (ch === endChar) depth -= 1;

      if (depth === 0) {
        return text.slice(startIndex, i + 1);
      }
    }

    return null;
  };

  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    if (ch !== '{' && ch !== '[') continue;
    const candidate = extractBalanced(clean, i);
    if (!candidate) continue;
    try {
      return JSON.parse(candidate);
    } catch {
      // Keep scanning.
    }
  }

  return null;
}

function normalizeLawyerList(payload) {
  const coerceList = (value) => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return Object.values(value);
    return [];
  };

  const rawList = Array.isArray(payload)
    ? payload
    : coerceList(payload?.lawyers).length > 0
      ? coerceList(payload?.lawyers)
      : coerceList(payload?.advocates).length > 0
        ? coerceList(payload?.advocates)
        : coerceList(payload?.recommendations).length > 0
          ? coerceList(payload?.recommendations)
          : coerceList(payload?.rankings).length > 0
            ? coerceList(payload?.rankings)
            : coerceList(payload?.results).length > 0
              ? coerceList(payload?.results)
              : coerceList(payload?.candidates).length > 0
                ? coerceList(payload?.candidates)
                : [];

  const normalized = rawList
    .map((item, idx) => {
      if (!item || typeof item !== 'object') return null;
      const name = (item.name || item.fullName || item.full_name || item.lawyer || item.advocate || item.advocate_name || item.counsel || '').toString().trim();
      if (!name) return null;

      const specialties = Array.isArray(item.specialties)
        ? item.specialties
        : Array.isArray(item.specialty)
          ? item.specialty
          : item.specialty
            ? [item.specialty]
            : [];

      return {
        rank: Number(item.rank || item.position || item.order) || idx + 1,
        name,
        designation: (item.designation || item.title || item.role || item.positionTitle || 'Senior Advocate').toString().trim(),
        specialties: specialties
          .map((s) => (s == null ? '' : String(s).trim()))
          .filter(Boolean)
          .slice(0, 4),
        court: (item.court || item.courts || item.forum || 'Supreme Court of India').toString().trim(),
        rationale: (item.rationale || item.reason || item.why || item.explanation || '').toString().trim(),
      };
    })
    .filter(Boolean);

  return normalized
    .sort((a, b) => a.rank - b.rank)
    .map((item, idx) => ({ ...item, rank: idx + 1 }))
    .slice(0, 6);
}

function buildFallbackLawyerList(caseSummary) {
  const names = [
    'Harish Salve',
    'Mukul Rohatgi',
    'Kapil Sibal',
    'Indira Jaising',
    'Abhishek Manu Singhvi',
    'Menaka Guruswamy',
  ];

  const specialties = [
    ['Constitutional Law', 'Civil Appeals'],
    ['Constitutional Law', 'Regulatory Litigation'],
    ['Constitutional Law', 'Public Law'],
    ['Fundamental Rights', 'Constitutional Litigation'],
    ['Constitutional Law', 'Commercial Litigation'],
    ['Constitutional Law', 'Civil Liberties'],
  ];

  const shortCase = caseSummary.trim().slice(0, 140);

  return names.map((name, i) => ({
    rank: i + 1,
    name,
    designation: 'Senior Advocate / Supreme Court of India',
    specialties: specialties[i],
    court: 'Supreme Court of India',
    rationale: `Strong courtroom track record for issues aligned with: "${shortCase}${caseSummary.length > 140 ? '...' : ''}".`,
  }));
}

async function repairLawyerPayloadFromText(rawContent) {
  if (!rawContent || !rawContent.trim()) return null;

  const repairPrompt = `Convert the following content into valid JSON with this exact shape:
{
  "lawyers": [
    {
      "rank": 1,
      "name": "Full Name",
      "designation": "Senior Advocate / Supreme Court of India",
      "specialties": ["Constitutional Law", "Criminal Law"],
      "court": "Supreme Court of India",
      "rationale": "2-3 sentence rationale"
    }
  ]
}

Input content:
${rawContent}`;

  const repaired = await geminiChat({
    messages: [{ role: 'user', content: repairPrompt }],
    temperature: 0,
    maxTokens: 1200,
    timeoutMs: 30000,
    responseFormat: { type: 'json_object' },
  });

  const repairedContent = extractContent(repaired);
  return extractStructuredPayload(repaired) || parseJsonFromText(repairedContent);
}

async function geminiChat({ messages, temperature = 0.7, maxTokens = 256, timeoutMs = 30000, responseFormat }) {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error('[Gemini] API key not configured.');

  const payload = {
    model: GEMINI_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
  };

  if (responseFormat) {
    payload.response_format = responseFormat;
  }

  const response = await fetch(`${GEMINI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`Gemini API error (${response.status}): ${errBody.slice(0, 300)}`);
  }

  return response.json();
}

/**
 * Quick connectivity check — call this once to verify Gemini is reachable.
 * Returns true if the API responds, false otherwise.
 */
export async function checkNIMConnectivity() {
  try {
    const data = await geminiChat({
      messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
      temperature: 0,
      maxTokens: 8,
      timeoutMs: 10000,
    });
    const text = extractContent(data);
    const ok = text.length > 0;
    if (ok) console.log('[Gemini] Connected:', GEMINI_MODEL);
    return ok;
  } catch (e) {
    console.warn('[Gemini] Not reachable:', e.message);
    return false;
  }
}

/**
 * Generate an AI legal argument using Gemini.
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
  easy: 60,    // 1-2 short sentences
  medium: 100,   // 2-3 sentences max
  hard: 180,   // short paragraph with one citation
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
  const aiParty = caseData[aiSide];
  const userSide = aiSide === 'petitioner' ? 'respondent' : 'petitioner';
  const userParty = caseData[userSide];

  const maxTokens = DIFFICULTY_TOKENS[difficulty] ?? DIFFICULTY_TOKENS.medium;

  // Difficulty-specific instruction
  const lengthInstruction = {
    easy: 'Respond in exactly 1-2 short sentences. Stop after the second sentence. End on a complete sentence.',
    medium: 'Respond in exactly 2-3 short sentences. Stop after the third sentence. End on a complete sentence.',
    hard: 'Respond in 3-4 sentences with one constitutional article cited. End on a complete sentence.',
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

  const data = await geminiChat({
    messages,
    temperature: 0.7,
    maxTokens,
    timeoutMs: 30000,
  });
  const content = extractContent(data);

  if (!content) {
    throw new Error('[Gemini] Empty response from API.');
  }

  return content.trim();
}

/**
 * Score a user's argument using Gemini — returns structured scores.
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
  if (!getGeminiKey()) return null;

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
    const data = await geminiChat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Case: ${caseData.shortName}\nSide: ${side}\nRound: ${round}\n\nArgument to score:\n${userArgument}` },
      ],
      temperature: 0.2,
      maxTokens: 180,
      timeoutMs: 20000,
      responseFormat: { type: 'json_object' },
    });
    const content = extractContent(data);
    if (!content) return null;

    const scores = parseJsonFromText(content);
    if (!scores || typeof scores !== 'object' || Array.isArray(scores)) return null;

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

/**
 * Rank the top 6 Indian lawyers/advocates best suited for a described legal case.
 *
 * @param {string} caseSummary - User's description of the case
 * @returns {Promise<Array>} - Array of 6 { rank, name, specialty, court, rationale }
 */
export async function rankLawyersForCase(caseSummary) {
  if (!getGeminiKey()) throw new Error('[Gemini] API key not configured.');

  const systemPrompt = `You are a senior Indian legal directory expert. Given a case description, identify the 6 best Indian advocates or senior counsels (real or realistic archetypes) most suited to argue this case.

Respond ONLY with a valid JSON object (no markdown, no prose) in this exact shape:
{
  "lawyers": [
    {
      "rank": 1,
      "name": "Full Name",
      "designation": "Senior Advocate / Supreme Court of India",
      "specialties": ["Constitutional Law", "Criminal Law"],
      "court": "Supreme Court of India",
      "rationale": "2-3 sentence explanation of why this lawyer is the best fit for this case, referencing their expertise and past landmark cases."
    }
  ]
}

Guidelines:
- Rank 1 is the most recommended
- Use well-known real Indian advocates as inspiration (e.g. Harish Salve, Mukul Rohatgi, Kapil Sibal, Indira Jaising, Menaka Guruswamy, Abhishek Manu Singhvi, etc.) or realistic archetypes
- Specialties should be 2-4 specific legal domains relevant to the case
- Rationale must directly reference how their expertise fits the described case
- Courts: Supreme Court of India, High Courts, National Company Law Tribunal, etc.
- Be specific, credible, and directly relevant to the case summary provided`;

  const data = await geminiChat({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Case description:\n${caseSummary}` },
    ],
    temperature: 0.6,
    maxTokens: 1400,
    timeoutMs: 45000,
    responseFormat: { type: 'json_object' },
  });

  const content = extractContent(data);
  const payload = extractStructuredPayload(data) || parseJsonFromText(content);
  let lawyers = normalizeLawyerList(payload);

  if (lawyers.length === 0 && content) {
    try {
      const repairedPayload = await repairLawyerPayloadFromText(content);
      lawyers = normalizeLawyerList(repairedPayload);
    } catch {
      // ignore repair failure
    }
  }

  if (lawyers.length === 0) {
    console.warn('[Gemini] Falling back to curated lawyer list due to format mismatch.');
    lawyers = buildFallbackLawyerList(caseSummary);
  }

  return lawyers.slice(0, 6);
}

export default { generateAIArgument, scoreArgumentWithAI, rankLawyersForCase };
