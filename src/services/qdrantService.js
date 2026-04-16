/**
 * qdrantService.js — Runtime Retrieval Service
 *
 * Browser-compatible service that embeds user arguments via NVIDIA API,
 * queries Qdrant for relevant legal context (precedents, counter-arguments,
 * constitutional articles), and formats the results for AI prompt injection.
 */

// ─── Configuration (reads from Vite env in browser) ──────────────────────────

function getConfig() {
  // In browser (Vite), use import.meta.env
  // Fallback for Node.js (testing) uses process.env
  const env = typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : (typeof process !== 'undefined' ? process.env : {});

  return {
    qdrantUrl: env.VITE_QDRANT_URL || '',
    qdrantApiKey: env.VITE_QDRANT_API_KEY || '',
    nvidiaApiKey: env.VITE_NVIDIA_API_KEY || '',
    collectionName: 'courtroom_cases',
    nvidiaEmbedUrl: 'https://integrate.api.nvidia.com/v1/embeddings',
    nvidiaModel: 'nvidia/nv-embed-v2',
  };
}

/**
 * Check if the Qdrant service is configured and available.
 */
export function isQdrantConfigured() {
  const config = getConfig();
  return (
    config.qdrantUrl &&
    !config.qdrantUrl.includes('your-cluster') &&
    config.qdrantApiKey &&
    config.qdrantApiKey !== 'your-qdrant-api-key' &&
    config.nvidiaApiKey &&
    config.nvidiaApiKey !== 'your-nvidia-api-key'
  );
}

// ─── NVIDIA Embedding ────────────────────────────────────────────────────────

/**
 * Generate an embedding vector for a given text using NVIDIA nv-embed-v2.
 * @param {string} text — The text to embed
 * @returns {Promise<number[]>} — 4096-dimensional embedding vector
 */
export async function embedText(text) {
  const config = getConfig();

  if (!config.nvidiaApiKey) {
    throw new Error('[QdrantService] NVIDIA API key not configured.');
  }

  const res = await fetch(config.nvidiaEmbedUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.nvidiaApiKey}`,
    },
    body: JSON.stringify({
      model: config.nvidiaModel,
      input: [text],
      input_type: 'query',
      encoding_format: 'float',
      truncate: 'END',
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(`NVIDIA embedding failed (${res.status}): ${errorBody.slice(0, 200)}`);
  }

  const data = await res.json();

  if (!data.data || !data.data[0] || !data.data[0].embedding) {
    throw new Error(`NVIDIA API unexpected response format.`);
  }

  return data.data[0].embedding;
}

// ─── Qdrant Vector Search ────────────────────────────────────────────────────

/**
 * Search Qdrant for vectors similar to the given embedding, filtered by case and section types.
 *
 * @param {Object} params
 * @param {number[]} params.vector — The query embedding vector
 * @param {string} params.caseId — Filter by case_id
 * @param {string[]} params.sectionTypes — Filter by section_type values
 * @param {number} [params.limit=5] — Number of results to return
 * @returns {Promise<Array>} — Array of { id, score, payload } objects
 */
async function searchQdrant({ vector, caseId, sectionTypes, limit = 5 }) {
  const config = getConfig();

  const filterConditions = [
    {
      key: 'case_id',
      match: { value: caseId },
    },
  ];

  if (sectionTypes && sectionTypes.length > 0) {
    filterConditions.push({
      key: 'section_type',
      match: { any: sectionTypes },
    });
  }

  const res = await fetch(
    `${config.qdrantUrl}/collections/${config.collectionName}/points/search`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.qdrantApiKey,
      },
      body: JSON.stringify({
        vector,
        filter: {
          must: filterConditions,
        },
        limit,
        with_payload: true,
      }),
    }
  );

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(`Qdrant search failed (${res.status}): ${errorBody.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.result || [];
}

// ─── High-Level Retrieval Functions ──────────────────────────────────────────

/**
 * Main retrieval function: embeds the user's argument and finds relevant
 * counter-arguments, precedents, and constitutional articles from Qdrant.
 *
 * @param {Object} params
 * @param {string} params.queryText — The user's argument text
 * @param {string} params.caseId — Current case ID (e.g., 'ram-janmabhoomi')
 * @param {string} params.aiSide — The AI's side ('petitioner' | 'respondent')
 * @param {number} [params.limit=5] — Number of results
 * @returns {Promise<Object>} — { results: [...], formatted: "..." }
 */
export async function searchRelevantContext({ queryText, caseId, aiSide, limit = 5 }) {
  if (!isQdrantConfigured()) {
    console.warn('[QdrantService] Not configured. Returning empty context.');
    return { results: [], formatted: '' };
  }

  try {
    // Step 1: Embed the user's argument
    const vector = await embedText(queryText);

    // Step 2: Determine which section types to search for
    // AI needs: its own side's arguments + precedents + constitutional articles
    const aiSideArg = aiSide === 'petitioner' ? 'petitioner_argument' : 'respondent_argument';
    const sectionTypes = [aiSideArg, 'precedent', 'constitutional_article', 'court_reasoning'];

    // Step 3: Search Qdrant
    const results = await searchQdrant({
      vector,
      caseId,
      sectionTypes,
      limit,
    });

    // Step 4: Format for prompt injection
    const formatted = formatContextForPrompt(results);

    return { results, formatted };
  } catch (err) {
    console.error('[QdrantService] searchRelevantContext failed:', err.message);
    return { results: [], formatted: '' };
  }
}

/**
 * Fetch broad case overview context for the initial system prompt.
 * Gets precedents and constitutional articles for the case (no user query needed).
 *
 * @param {string} caseId — The case ID
 * @returns {Promise<Object>} — { results: [...], formatted: "..." }
 */
export async function getCaseOverview(caseId) {
  if (!isQdrantConfigured()) {
    console.warn('[QdrantService] Not configured. Returning empty overview.');
    return { results: [], formatted: '' };
  }

  try {
    const config = getConfig();

    // Use a general query about the case to get broad context
    const overviewQuery = `landmark Indian Supreme Court case legal judgment constitutional law`;
    const vector = await embedText(overviewQuery);

    // Fetch precedents and constitutional articles
    const results = await searchQdrant({
      vector,
      caseId,
      sectionTypes: ['precedent', 'constitutional_article', 'final_order'],
      limit: 5,
    });

    const formatted = formatContextForPrompt(results);
    return { results, formatted };
  } catch (err) {
    console.error('[QdrantService] getCaseOverview failed:', err.message);
    return { results: [], formatted: '' };
  }
}

/**
 * Format retrieved Qdrant results into structured text for the AI system prompt.
 *
 * @param {Array} results — Array of Qdrant search results with payloads
 * @returns {string} — Formatted context string
 */
export function formatContextForPrompt(results) {
  if (!results || results.length === 0) return '';

  const sections = {
    precedent: [],
    petitioner_argument: [],
    respondent_argument: [],
    constitutional_article: [],
    court_reasoning: [],
    final_order: [],
  };

  // Group results by section type
  for (const result of results) {
    const payload = result.payload;
    if (!payload) continue;

    const type = payload.section_type || 'court_reasoning';
    if (!sections[type]) sections[type] = [];

    sections[type].push({
      text: payload.text,
      score: result.score,
      articles: payload.article_references || [],
      caseName: payload.case_name,
    });
  }

  let formatted = '\n─── RETRIEVED CASE KNOWLEDGE ───\n\n';

  // Precedents
  if (sections.precedent.length > 0) {
    formatted += '📜 RELEVANT PRECEDENTS:\n';
    sections.precedent.forEach((p, i) => {
      formatted += `[${i + 1}] ${p.text.slice(0, 500)}...\n`;
      if (p.articles.length > 0) {
        formatted += `   Referenced: ${p.articles.join(', ')}\n`;
      }
      formatted += '\n';
    });
  }

  // Constitutional Articles
  if (sections.constitutional_article.length > 0) {
    formatted += '⚖️ CONSTITUTIONAL PROVISIONS:\n';
    sections.constitutional_article.forEach((c, i) => {
      formatted += `[${i + 1}] ${c.text.slice(0, 500)}...\n`;
      if (c.articles.length > 0) {
        formatted += `   Articles: ${c.articles.join(', ')}\n`;
      }
      formatted += '\n';
    });
  }

  // Arguments from AI's side
  const aiArgs = [...sections.petitioner_argument, ...sections.respondent_argument];
  if (aiArgs.length > 0) {
    formatted += '💬 SUPPORTING ARGUMENTS FROM JUDGMENT:\n';
    aiArgs.forEach((a, i) => {
      formatted += `[${i + 1}] ${a.text.slice(0, 500)}...\n\n`;
    });
  }

  // Court reasoning
  if (sections.court_reasoning.length > 0) {
    formatted += '🏛️ COURT REASONING:\n';
    sections.court_reasoning.forEach((r, i) => {
      formatted += `[${i + 1}] ${r.text.slice(0, 400)}...\n\n`;
    });
  }

  // Final order
  if (sections.final_order.length > 0) {
    formatted += '📋 COURT ORDER:\n';
    sections.final_order.forEach((o, i) => {
      formatted += `[${i + 1}] ${o.text.slice(0, 300)}...\n\n`;
    });
  }

  formatted += '─── END OF RETRIEVED CONTEXT ───\n';

  return formatted;
}

export default {
  isQdrantConfigured,
  embedText,
  searchRelevantContext,
  getCaseOverview,
  formatContextForPrompt,
};
