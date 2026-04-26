/**
 * nimService.js — LLM Service (Gemini)
 *
 * Text generation/scoring are routed to Gemini via the OpenAI-compatible API.
 * Embeddings stay in qdrantService.js (NVIDIA), unchanged.
 */

import { searchSupremeCourtLawyers } from './lawyerDirectoryService';

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

function buildFallbackLawyerList(caseSummary, filters = {}) {
  const names = [
    'Harish Salve',
    'Mukul Rohatgi',
    'Kapil Sibal',
    'Indira Jaising',
    'Abhishek Manu Singhvi',
    'Menaka Guruswamy',
    'Gopal Sankaranarayanan',
    'Arvind Datar',
    'K. V. Viswanathan',
    'Sajan Poovayya',
    'Anitha Shenoy',
    'Rebecca John',
    'Karuna Nundy',
    'Arundhati Katju',
    'Zia Mody',
  ];

  const specialties = [
    ['Constitutional Law', 'Civil Appeals'],
    ['Constitutional Law', 'Regulatory Litigation'],
    ['Constitutional Law', 'Public Law'],
    ['Fundamental Rights', 'Constitutional Litigation'],
    ['Constitutional Law', 'Commercial Litigation'],
    ['Constitutional Law', 'Civil Liberties'],
    ['Constitutional Law', 'Appellate Advocacy'],
    ['Tax Law', 'Commercial Appeals'],
    ['Constitutional Law', 'Public Law'],
    ['Technology Law', 'Commercial Litigation'],
    ['Commercial Litigation', 'Arbitration'],
    ['Criminal Law', 'White-Collar Defence'],
    ['Civil Liberties', 'Constitutional Litigation'],
    ['Criminal Law', 'Gender Justice'],
    ['Corporate Law', 'M&A'],
  ];

  const shortCase = caseSummary.trim().slice(0, 140);

  return names.map((name, i) => ({
    rank: i + 1,
    name,
    designation: 'Senior Advocate / Supreme Court of India',
    specialties: specialties[i],
    court: 'Supreme Court of India',
    fitHighlights: [
      filters.matterType || 'Complex legal dispute',
      filters.courtLevel || 'Appellate advocacy',
      filters.mustHaveExpertise || 'High-stakes argument strategy',
    ].filter(Boolean).slice(0, 3),
    rationale: `Strong courtroom track record for issues aligned with: "${shortCase}${caseSummary.length > 140 ? '...' : ''}".`,
  }));
}

function ensureLawyerListCoverage(lawyers, caseSummary, filters = {}, resultCount = 6) {
  const safeResultCount = Math.min(20, Math.max(1, Number(resultCount) || 6));
  const normalizedLawyers = Array.isArray(lawyers) ? lawyers.filter(Boolean) : [];
  const seenNames = new Set(
    normalizedLawyers
      .map((lawyer) => lawyer?.name?.toString().trim().toLowerCase())
      .filter(Boolean)
  );

  if (normalizedLawyers.length >= safeResultCount) {
    return normalizedLawyers
      .slice(0, safeResultCount)
      .map((lawyer, index) => ({ ...lawyer, rank: index + 1 }));
  }

  const fallbackPool = buildFallbackLawyerList(caseSummary, filters).filter((lawyer) => {
    const normalizedName = lawyer.name.toLowerCase();
    if (seenNames.has(normalizedName)) return false;
    seenNames.add(normalizedName);
    return true;
  });

  return [...normalizedLawyers, ...fallbackPool]
    .slice(0, safeResultCount)
    .map((lawyer, index) => ({ ...lawyer, rank: index + 1 }));
}

function buildHeuristicFitHighlights(candidate, filters = {}) {
  const highlights = [];

  if (candidate.isSeniorAdvocate) highlights.push('Senior advocate');
  if (candidate.city) highlights.push(`${candidate.city}-based`);
  if (candidate.experienceYears) highlights.push(`${candidate.experienceYears}+ years since AOR registration`);
  if (filters.courtLevel) highlights.push(filters.courtLevel);
  if (filters.mustHaveExpertise) highlights.push(filters.mustHaveExpertise);

  return highlights.slice(0, 4);
}

function buildHeuristicRationale(candidate, caseSummary, filters = {}) {
  const reasons = [];
  if (candidate.isSeniorAdvocate) reasons.push('has been designated as a senior advocate');
  if (candidate.experienceYears) reasons.push(`has ${candidate.experienceYears}+ years of Supreme Court AOR experience`);
  if (filters.city && candidate.address.toLowerCase().includes(filters.city.toLowerCase())) {
    reasons.push(`matches the preferred city filter for ${filters.city}`);
  }
  if (filters.courtLevel) reasons.push(`fits a ${filters.courtLevel} forum requirement from the official AOR list`);

  const joinedReasons = reasons.length > 0 ? reasons.join(', ') : 'appears in the official Supreme Court AOR directory';
  const shortCase = caseSummary.trim().slice(0, 120);
  return `Sourced from the official Supreme Court Advocate-on-Record directory and ${joinedReasons}. Use this as a vetted candidate list for the matter: "${shortCase}${caseSummary.length > 120 ? '...' : ''}".`;
}

function buildLawyerCardFromCandidate(candidate, rank, caseSummary, filters = {}, overrides = {}) {
  return {
    rank,
    name: candidate.name,
    designation: candidate.designation,
    specialties: overrides.specialties?.length > 0
      ? overrides.specialties
      : ['Supreme Court Practice', 'Appellate Advocacy'].slice(0, 4),
    court: candidate.court,
    fitHighlights: overrides.fitHighlights?.length > 0
      ? overrides.fitHighlights
      : buildHeuristicFitHighlights(candidate, filters),
    rationale: overrides.rationale || buildHeuristicRationale(candidate, caseSummary, filters),
    sourceRecord: candidate,
  };
}

function rankDirectoryLawyersHeuristically(candidates, caseSummary, filters = {}, resultCount = 6) {
  return candidates
    .slice(0, resultCount)
    .map((candidate, index) => buildLawyerCardFromCandidate(candidate, index + 1, caseSummary, filters));
}

function normalizeDirectoryRankings(payload, candidatesById, caseSummary, filters = {}, resultCount = 6) {
  const coerceList = (value) => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return Object.values(value);
    return [];
  };

  const rawList = Array.isArray(payload)
    ? payload
    : coerceList(payload?.lawyers).length > 0
      ? coerceList(payload?.lawyers)
      : coerceList(payload?.recommendations).length > 0
        ? coerceList(payload?.recommendations)
        : coerceList(payload?.results).length > 0
          ? coerceList(payload?.results)
          : [];

  const normalized = rawList
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      const candidateId = String(
        item.candidateId || item.candidateID || item.id || item.lawyerId || item.directoryId || ''
      ).trim();
      const candidate = candidatesById.get(candidateId);
      if (!candidate) return null;

      const fitHighlights = Array.isArray(item.fitHighlights)
        ? item.fitHighlights
        : Array.isArray(item.fit_highlights)
          ? item.fit_highlights
          : [];

      const specialties = Array.isArray(item.specialties)
        ? item.specialties
        : Array.isArray(item.specialty)
          ? item.specialty
          : item.specialty
            ? [item.specialty]
            : [];

      return buildLawyerCardFromCandidate(candidate, Number(item.rank) || index + 1, caseSummary, filters, {
        specialties: specialties.map((value) => String(value).trim()).filter(Boolean).slice(0, 4),
        fitHighlights: fitHighlights.map((value) => String(value).trim()).filter(Boolean).slice(0, 4),
        rationale: String(item.rationale || item.reason || item.explanation || '').trim(),
      });
    })
    .filter(Boolean)
    .sort((a, b) => a.rank - b.rank);

  return ensureLawyerListCoverage(normalized, caseSummary, filters, resultCount);
}

async function rankDirectoryLawyersWithAI({ caseSummary, filters, candidates, resultCount }) {
  if (!getGeminiKey()) {
    return rankDirectoryLawyersHeuristically(candidates, caseSummary, filters, resultCount);
  }

  const candidateCatalog = candidates
    .map((candidate) => [
      `candidateId: ${candidate.id}`,
      `name: ${candidate.name}`,
      `designation: ${candidate.designation}`,
      `court: ${candidate.court}`,
      `city: ${candidate.city || 'Unknown'}`,
      `address: ${candidate.address || 'Not listed'}`,
      `registrationDate: ${candidate.registrationDate || 'Unknown'}`,
      `remarks: ${candidate.remarks || 'None'}`,
    ].join(' | '))
    .join('\n');

  const activeFilterLines = [
    ['Matter type', filters.matterType],
    ['Preferred forum', filters.courtLevel],
    ['Preferred city', filters.city],
    ['Case stage', filters.caseStage],
    ['Budget band', filters.budgetBand],
    ['Counsel style', filters.counselStyle],
    ['Must-have expertise', filters.mustHaveExpertise],
  ].filter(([, value]) => value);

  const systemPrompt = `You are a senior Indian legal directory analyst. You must rank advocates from an official Supreme Court Advocate-on-Record candidate list.

Rules:
- Use ONLY candidates from the provided list
- Return exactly ${resultCount} lawyers
- Preserve each candidateId exactly as given
- Prefer candidates whose official record best fits the case profile and filters
- Do not invent names, courts, or credentials
- If the case is high-stakes or appellate, weigh seniority and Supreme Court experience more heavily

Respond ONLY with valid JSON in this exact shape:
{
  "lawyers": [
    {
      "rank": 1,
      "candidateId": "sci-aor-123",
      "specialties": ["Appellate Advocacy", "Constitutional Law"],
      "fitHighlights": ["Senior advocate", "Delhi-based", "Supreme Court specialist"],
      "rationale": "2-3 sentences explaining why this official directory candidate fits the case and filters."
    }
  ]
}`;

  const userPrompt = [
    `Requested result count: ${resultCount}`,
    `Case description:\n${caseSummary}`,
    activeFilterLines.length > 0
      ? `Structured filters:\n${activeFilterLines.map(([label, value]) => `- ${label}: ${value}`).join('\n')}`
      : 'Structured filters:\n- None provided',
    `Official candidate list:\n${candidateCatalog}`,
  ].join('\n\n');

  const data = await geminiChat({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.4,
    maxTokens: 2200,
    timeoutMs: 45000,
    responseFormat: { type: 'json_object' },
  });

  const content = extractContent(data);
  const payload = extractStructuredPayload(data) || parseJsonFromText(content);
  const candidatesById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  let lawyers = normalizeDirectoryRankings(payload, candidatesById, caseSummary, filters, resultCount);

  if (lawyers.length === 0 && content) {
    try {
      const repairedPayload = await repairDirectoryRankingPayloadFromText(content);
      lawyers = normalizeDirectoryRankings(repairedPayload, candidatesById, caseSummary, filters, resultCount);
    } catch {
      // ignore repair failure
    }
  }

  if (lawyers.length === 0) {
    return rankDirectoryLawyersHeuristically(candidates, caseSummary, filters, resultCount);
  }

  return lawyers;
}

async function repairDirectoryRankingPayloadFromText(rawContent) {
  if (!rawContent || !rawContent.trim()) return null;

  const repairPrompt = `Convert the following content into valid JSON with this exact shape:
{
  "lawyers": [
    {
      "rank": 1,
      "candidateId": "sci-aor-123",
      "specialties": ["Constitutional Law", "Criminal Law"],
      "fitHighlights": ["Senior advocate", "Delhi-based"],
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
  responseMode = 'direct-reply',
}) {
  const aiParty = caseData[aiSide];

  const maxTokens = DIFFICULTY_TOKENS[difficulty] ?? DIFFICULTY_TOKENS.medium;

  // Difficulty-specific instruction
  const lengthInstruction = {
    easy: 'Respond in exactly 1-2 short sentences. Stop after the second sentence. End on a complete sentence.',
    medium: 'Respond in exactly 2-3 short sentences. Stop after the third sentence. End on a complete sentence.',
    hard: 'Respond in 3-4 sentences with one constitutional article cited. End on a complete sentence.',
  }[difficulty] ?? 'Respond in exactly 2-3 short sentences. End on a complete sentence.';

  // Build the system prompt
  const roundInstruction = responseMode === 'opening-statement'
    ? 'You are delivering your own opening submission. Do not directly rebut the opponent’s current statement in this round.'
    : responseMode === 'delayed-rebuttal'
      ? 'You are responding to the opponent’s previous-round argument, not the statement they just made in the current round.'
      : 'The opposing counsel has just made an argument. Respond as a skilled Indian Supreme Court advocate would.';

  let systemPrompt = `You are ${aiParty.name}, arguing as the ${aiSide} in the landmark Indian Supreme Court case "${caseData.shortName}" (${caseData.year}).

Your position: ${aiParty.position}
${aiParty.description}

Key arguments you should draw from:
${aiParty.keyArgs.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Relevant constitutional articles: ${caseData.articles.join(', ')}

You are in a live courtroom debate simulation. ${roundInstruction}

STRICT RULES:
- Address the bench as "My Lords" or "Your Lordships"
- ${lengthInstruction}
- Be formal, authoritative, and precise
- Present exactly one main argument for this round
- In Round 1, give an opening submission only
- In later rounds, rebut only the previous round's argument when relevant
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
export async function rankLawyersForCase(input) {
  const caseSummary = typeof input === 'string'
    ? input
    : (input?.caseSummary || '').toString().trim();
  const resultCount = input && typeof input === 'object' && !Array.isArray(input)
    ? Math.min(20, Math.max(1, Number(input.resultCount) || 6))
    : 6;
  const filters = input && typeof input === 'object' && !Array.isArray(input)
    ? {
      matterType: (input.filters?.matterType || '').toString().trim(),
      courtLevel: (input.filters?.courtLevel || '').toString().trim(),
      city: (input.filters?.city || '').toString().trim(),
      caseStage: (input.filters?.caseStage || '').toString().trim(),
      budgetBand: (input.filters?.budgetBand || '').toString().trim(),
      counselStyle: (input.filters?.counselStyle || '').toString().trim(),
      mustHaveExpertise: (input.filters?.mustHaveExpertise || '').toString().trim(),
    }
    : {};

  if (!caseSummary) {
    throw new Error('Case description is required.');
  }
  const directoryCandidatesTarget = Math.max(resultCount * 3, 24);
  const { lawyers: candidates, source } = await searchSupremeCourtLawyers({
    filters,
    limit: directoryCandidatesTarget,
  });

  if (candidates.length === 0) {
    return {
      lawyers: ensureLawyerListCoverage(buildFallbackLawyerList(caseSummary, filters), caseSummary, filters, resultCount),
      source: {
        label: 'Fallback advocate list',
        type: 'fallback',
        url: '',
        asOf: '',
      },
    };
  }

  const rankedLawyers = await rankDirectoryLawyersWithAI({
    caseSummary,
    filters,
    candidates,
    resultCount,
  });

  return {
    lawyers: rankedLawyers,
    source,
  };
}

export default { generateAIArgument, scoreArgumentWithAI, rankLawyersForCase };
