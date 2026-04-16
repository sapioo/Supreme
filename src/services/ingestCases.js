/**
 * ingestCases.js — Standalone Data Ingestion Script
 * 
 * Fetches landmark Indian case judgments from Indian Kanoon API,
 * chunks them into semantic sections, generates NVIDIA embeddings,
 * and upserts into Qdrant Cloud.
 *
 * Usage:  node src/services/ingestCases.js
 */

import 'dotenv/config';

// ─── Configuration ───────────────────────────────────────────────────────────

const QDRANT_URL       = process.env.VITE_QDRANT_URL;
const QDRANT_API_KEY   = process.env.VITE_QDRANT_API_KEY;
const NVIDIA_API_KEY   = process.env.VITE_NVIDIA_API_KEY;
const IK_API_KEY       = process.env.VITE_INDIANKANOON_API_KEY;

const COLLECTION_NAME  = 'courtroom_cases';
const VECTOR_SIZE      = 4096; // nv-embed-v2 dimension
const NVIDIA_EMBED_URL = 'https://integrate.api.nvidia.com/v1/embeddings';
const NVIDIA_MODEL     = 'nvidia/nv-embed-v2';

const IK_SEARCH_URL    = 'https://api.indiankanoon.org/search/';
const IK_DOC_URL       = 'https://api.indiankanoon.org/doc/';

// Cases to ingest — mapped to search queries and metadata
const CASES_TO_INGEST = [
  {
    searchQuery: 'Ram Janmabhoomi Babri Masjid',
    caseId: 'ram-janmabhoomi',
    caseName: 'Ram Janmabhoomi vs Babri Masjid',
    year: 2019,
    court: 'Supreme Court of India',
  },
  {
    searchQuery: 'Kesavananda Bharati State of Kerala',
    caseId: 'kesavananda-bharati',
    caseName: 'Kesavananda Bharati vs State of Kerala',
    year: 1973,
    court: 'Supreme Court of India',
  },
  {
    searchQuery: 'Navtej Singh Johar Union of India Section 377',
    caseId: 'navtej-johar',
    caseName: 'Navtej Singh Johar vs Union of India',
    year: 2018,
    court: 'Supreme Court of India',
  },
  {
    searchQuery: 'K.S. Puttaswamy Union of India Right to Privacy',
    caseId: 'puttaswamy',
    caseName: 'K.S. Puttaswamy vs Union of India',
    year: 2017,
    court: 'Supreme Court of India',
  },
  {
    searchQuery: 'Vishaka State of Rajasthan sexual harassment',
    caseId: 'vishaka',
    caseName: 'Vishaka vs State of Rajasthan',
    year: 1997,
    court: 'Supreme Court of India',
  },
];

// ─── Utility Helpers ─────────────────────────────────────────────────────────

function log(msg) {
  console.log(`[Ingest] ${msg}`);
}

function logError(msg, err) {
  console.error(`[Ingest ERROR] ${msg}`, err?.message || err || '');
}

/**
 * Sleep for ms milliseconds — used for rate limiting
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with retry + exponential backoff for 429 rate limits
 */
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);

    if (res.status === 429) {
      const waitSec = Math.pow(2, attempt + 1); // 2s, 4s, 8s
      log(`Rate limited (429). Retrying in ${waitSec}s... (attempt ${attempt + 1}/${maxRetries})`);
      await sleep(waitSec * 1000);
      continue;
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${res.statusText} — ${body.slice(0, 300)}`);
    }

    return res;
  }
  throw new Error(`Failed after ${maxRetries} retries (rate limited).`);
}

/**
 * Strip HTML tags and decode common entities. Returns plain text.
 */
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Rough token count — ~4 characters per token for English legal text
 */
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

// ─── Section Classification ─────────────────────────────────────────────────

const SECTION_PATTERNS = {
  petitioner_argument: [
    /counsel\s+for\s+the\s+(petitioner|appellant|plaintiff)/i,
    /learned\s+(senior\s+)?counsel\s+(appearing\s+)?for\s+the\s+(petitioner|appellant)/i,
    /on\s+behalf\s+of\s+the\s+(petitioner|appellant)/i,
    /arguments?\s+(advanced|urged|made)\s+by\s+the\s+(petitioner|appellant)/i,
    /petitioner('s)?\s+(contention|submission|argument)/i,
    /mr\.?\s+\w+,?\s+learned\s+counsel\s+for\s+the\s+(petitioner|appellant)/i,
  ],
  respondent_argument: [
    /counsel\s+for\s+the\s+(respondent|state|union|defendant)/i,
    /learned\s+(senior\s+)?counsel\s+(appearing\s+)?for\s+the\s+(respondent|state|union)/i,
    /on\s+behalf\s+of\s+the\s+(respondent|state|union|defendant)/i,
    /arguments?\s+(advanced|urged|made)\s+by\s+the\s+(respondent|state|union)/i,
    /respondent('s)?\s+(contention|submission|argument)/i,
    /(attorney|solicitor)\s+general/i,
  ],
  court_reasoning: [
    /we\s+are\s+of\s+the\s+(view|opinion)/i,
    /this\s+court\s+(holds|observes|notes|finds)/i,
    /in\s+our\s+(opinion|view|considered\s+view)/i,
    /the\s+court\s+(is\s+of\s+the\s+view|holds|observes)/i,
    /we\s+(hold|find|observe|conclude)\s+that/i,
    /having\s+considered\s+the\s+(submissions|arguments|contentions)/i,
    /upon\s+careful\s+consideration/i,
    /the\s+question\s+(that\s+arises|before\s+us|for\s+consideration)/i,
  ],
  precedent: [
    /as\s+held\s+in/i,
    /relied\s+upon\s+the\s+decision/i,
    /the\s+ratio\s+(of|in)\s+/i,
    /this\s+court\s+in\s+.+\s+v\.?\s+/i,
    /\(\d{4}\)\s+\d+\s+SCC\b/i,
    /AIR\s+\d{4}\s+SC\b/i,
    /\[\d{4}\]\s+\d+\s+SCR\b/i,
    /the\s+decision\s+in\s+.+\s+v\.?\s+/i,
    /following\s+the\s+precedent/i,
    /the\s+principle\s+(laid\s+down|enunciated)\s+in/i,
  ],
  constitutional_article: [
    /article\s+\d+/i,
    /fundamental\s+right/i,
    /part\s+(III|IV|IVA)\s+of\s+the\s+constitution/i,
    /under\s+the\s+constitution/i,
    /constitutional\s+(provision|guarantee|protection|mandate)/i,
    /preamble\s+of\s+the\s+constitution/i,
    /directive\s+principles?\s+of\s+state\s+policy/i,
    /basic\s+structure\s+(doctrine|of\s+the\s+constitution)/i,
  ],
  final_order: [
    /the\s+(appeal|petition|writ)\s+(is\s+)?(allowed|dismissed|disposed)/i,
    /order\s+accordingly/i,
    /in\s+the\s+result/i,
    /we\s+(allow|dismiss|dispose)/i,
    /the\s+judgment\s+is\s+pronounced/i,
    /accordingly\s+(ordered|directed)/i,
    /writ\s+issued/i,
    /final\s+order/i,
  ],
};

/**
 * Classify a chunk of text into a section type based on pattern matching.
 * Returns the section_type with the most pattern matches, or 'court_reasoning' as fallback.
 */
function classifySection(text) {
  const scores = {};

  for (const [sectionType, patterns] of Object.entries(SECTION_PATTERNS)) {
    scores[sectionType] = 0;
    for (const pattern of patterns) {
      const matches = text.match(new RegExp(pattern, 'gi'));
      if (matches) {
        scores[sectionType] += matches.length;
      }
    }
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : 'court_reasoning';
}

/**
 * Determine the "side" based on section type.
 */
function determineSide(sectionType) {
  if (sectionType === 'petitioner_argument') return 'petitioner';
  if (sectionType === 'respondent_argument') return 'respondent';
  return 'neutral';
}

/**
 * Extract constitutional article references from text.
 */
function extractArticleReferences(text) {
  const matches = text.match(/article\s+\d+[a-zA-Z]?/gi) || [];
  const unique = [...new Set(matches.map((m) => m.replace(/article/i, 'Article').trim()))];
  return unique;
}

// ─── Text Chunking ───────────────────────────────────────────────────────────

const TARGET_TOKENS   = 650;  // Aim for middle of 500-800 range
const MAX_TOKENS      = 800;
const OVERLAP_TOKENS  = 100;

/**
 * Split judgment text into chunks of 500-800 tokens with 100 token overlap.
 * Attempts to split on paragraph/sentence boundaries.
 */
function chunkText(text) {
  if (!text || text.trim().length === 0) return [];

  // Split into paragraphs first
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const chunks = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    const combined = currentChunk ? currentChunk + '\n\n' + paragraph : paragraph;
    const combinedTokens = estimateTokens(combined);

    if (combinedTokens <= MAX_TOKENS) {
      currentChunk = combined;
    } else {
      // Current chunk is full — save it
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }

      // If the paragraph itself is too large, split it by sentences
      if (estimateTokens(paragraph) > MAX_TOKENS) {
        const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
        let sentChunk = '';

        for (const sentence of sentences) {
          const sentCombined = sentChunk ? sentChunk + ' ' + sentence : sentence;
          if (estimateTokens(sentCombined) <= MAX_TOKENS) {
            sentChunk = sentCombined;
          } else {
            if (sentChunk.trim()) chunks.push(sentChunk.trim());
            sentChunk = sentence;
          }
        }
        if (sentChunk.trim()) {
          currentChunk = sentChunk.trim();
        } else {
          currentChunk = '';
        }
      } else {
        // Start overlap: take the last ~100 tokens from previous chunk
        const overlapText = getOverlapText(currentChunk, OVERLAP_TOKENS);
        currentChunk = overlapText ? overlapText + '\n\n' + paragraph : paragraph;
      }
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((c) => estimateTokens(c) >= 50); // Skip tiny fragments
}

/**
 * Get the last ~N tokens of text for overlap.
 */
function getOverlapText(text, tokenCount) {
  const chars = tokenCount * 4;
  if (text.length <= chars) return text;
  const slice = text.slice(-chars);
  // Try to start at a sentence boundary
  const sentStart = slice.indexOf('. ');
  return sentStart > 0 ? slice.slice(sentStart + 2) : slice;
}

// ─── Qdrant Operations ──────────────────────────────────────────────────────

/**
 * Create or recreate the Qdrant collection with proper vector config.
 */
async function createCollection() {
  log('Creating Qdrant collection: ' + COLLECTION_NAME);

  // Delete existing collection (ignore 404)
  try {
    await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}`, {
      method: 'DELETE',
      headers: { 'api-key': QDRANT_API_KEY },
    });
    log('Deleted existing collection.');
  } catch {
    // Collection didn't exist — fine
  }

  await sleep(1000);

  // Create collection
  const res = await fetchWithRetry(`${QDRANT_URL}/collections/${COLLECTION_NAME}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'api-key': QDRANT_API_KEY,
    },
    body: JSON.stringify({
      vectors: {
        size: VECTOR_SIZE,
        distance: 'Cosine',
      },
    }),
  });

  const data = await res.json();
  log(`Collection created: ${JSON.stringify(data)}`);

  // Create payload indexes for filtering
  const indexFields = ['case_id', 'section_type', 'side'];
  for (const field of indexFields) {
    await fetchWithRetry(
      `${QDRANT_URL}/collections/${COLLECTION_NAME}/index`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'api-key': QDRANT_API_KEY,
        },
        body: JSON.stringify({
          field_name: field,
          field_schema: 'keyword',
        }),
      }
    );
    log(`Created index on field: ${field}`);
  }
}

/**
 * Upsert points into Qdrant.
 */
async function upsertPoints(points) {
  const res = await fetchWithRetry(
    `${QDRANT_URL}/collections/${COLLECTION_NAME}/points`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'api-key': QDRANT_API_KEY,
      },
      body: JSON.stringify({ points }),
    }
  );

  const data = await res.json();
  return data;
}

// ─── NVIDIA Embeddings ───────────────────────────────────────────────────────

/**
 * Generate embeddings for a batch of texts using NVIDIA API.
 * nv-embed-v2 supports batch input.
 */
async function generateEmbeddings(texts) {
  const res = await fetchWithRetry(NVIDIA_EMBED_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      input: texts,
      input_type: 'passage',
      encoding_format: 'float',
      truncate: 'END',
    }),
  });

  const data = await res.json();

  if (!data.data || !Array.isArray(data.data)) {
    throw new Error(`NVIDIA API unexpected response: ${JSON.stringify(data).slice(0, 300)}`);
  }

  return data.data.map((d) => d.embedding);
}

// ─── Indian Kanoon API ───────────────────────────────────────────────────────

/**
 * Search Indian Kanoon for a case and return the first result's doc ID.
 */
async function searchCase(query) {
  const url = `${IK_SEARCH_URL}?formInput=${encodeURIComponent(query)}&pagenum=0`;
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${IK_API_KEY}`,
    },
  });

  const data = await res.json();

  if (!data.docs || data.docs.length === 0) {
    throw new Error(`No results found for query: "${query}"`);
  }

  // Return the first matching doc
  const doc = data.docs[0];
  return {
    docId: doc.tid,
    title: doc.title || query,
  };
}

/**
 * Fetch the full judgment text for a given doc ID.
 */
async function fetchJudgment(docId) {
  const url = `${IK_DOC_URL}${docId}/`;
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${IK_API_KEY}`,
    },
  });

  const data = await res.json();
  const rawText = data.doc || data.text || '';
  return stripHtml(rawText);
}

// ─── Main Ingestion Pipeline ─────────────────────────────────────────────────

async function processCase(caseConfig, startPointId) {
  const { searchQuery, caseId, caseName, year, court } = caseConfig;
  log(`\n${'═'.repeat(60)}`);
  log(`Processing: ${caseName}`);
  log(`${'═'.repeat(60)}`);

  // Step 1: Search for the case on Indian Kanoon
  log('Step 1: Searching Indian Kanoon...');
  let docId, title;
  try {
    const result = await searchCase(searchQuery);
    docId = result.docId;
    title = result.title;
    log(`Found: "${title}" (Doc ID: ${docId})`);
  } catch (err) {
    logError(`Failed to search for "${caseName}". Skipping.`, err);
    return { pointId: startPointId, chunksIngested: 0 };
  }

  await sleep(1500); // Rate limit courtesy

  // Step 2: Fetch full judgment
  log('Step 2: Fetching full judgment text...');
  let judgmentText;
  try {
    judgmentText = await fetchJudgment(docId);
    log(`Fetched ${judgmentText.length} characters (${estimateTokens(judgmentText)} est. tokens)`);
  } catch (err) {
    logError(`Failed to fetch judgment for "${caseName}". Skipping.`, err);
    return { pointId: startPointId, chunksIngested: 0 };
  }

  if (judgmentText.length < 200) {
    log(`Judgment text too short (${judgmentText.length} chars). Skipping.`);
    return { pointId: startPointId, chunksIngested: 0 };
  }

  // Step 3: Chunk the judgment
  log('Step 3: Chunking judgment text...');
  const chunks = chunkText(judgmentText);
  log(`Created ${chunks.length} chunks`);

  if (chunks.length === 0) {
    log('No valid chunks created. Skipping.');
    return { pointId: startPointId, chunksIngested: 0 };
  }

  // Step 4: Classify chunks and build metadata
  log('Step 4: Classifying chunks...');
  const classifiedChunks = chunks.map((text, i) => {
    const sectionType = classifySection(text);
    const side = determineSide(sectionType);
    const articleRefs = extractArticleReferences(text);

    return {
      text,
      sectionType,
      side,
      articleReferences: articleRefs,
      chunkIndex: i,
    };
  });

  // Log classification summary
  const typeSummary = {};
  classifiedChunks.forEach((c) => {
    typeSummary[c.sectionType] = (typeSummary[c.sectionType] || 0) + 1;
  });
  log(`Classification summary: ${JSON.stringify(typeSummary)}`);

  // Step 5: Generate embeddings in batches
  log('Step 5: Generating NVIDIA embeddings...');
  const BATCH_SIZE = 5;
  const allEmbeddings = [];

  for (let i = 0; i < classifiedChunks.length; i += BATCH_SIZE) {
    const batch = classifiedChunks.slice(i, i + BATCH_SIZE);
    const batchTexts = batch.map((c) => c.text);

    try {
      const embeddings = await generateEmbeddings(batchTexts);
      allEmbeddings.push(...embeddings);
      log(`  Embedded batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(classifiedChunks.length / BATCH_SIZE)} (${embeddings.length} vectors)`);
    } catch (err) {
      logError(`Failed to embed batch starting at chunk ${i}. Skipping batch.`, err);
      // Push null placeholders for failed batch
      for (let j = 0; j < batch.length; j++) {
        allEmbeddings.push(null);
      }
    }

    await sleep(2000); // Rate limit between batches
  }

  // Step 6: Upsert into Qdrant
  log('Step 6: Upserting into Qdrant...');
  let pointId = startPointId;
  const points = [];

  for (let i = 0; i < classifiedChunks.length; i++) {
    if (!allEmbeddings[i]) continue; // Skip chunks that failed embedding

    const chunk = classifiedChunks[i];
    points.push({
      id: pointId,
      vector: allEmbeddings[i],
      payload: {
        case_id: caseId,
        case_name: caseName,
        year: year,
        court: court,
        section_type: chunk.sectionType,
        side: chunk.side,
        text: chunk.text,
        article_references: chunk.articleReferences,
        chunk_index: chunk.chunkIndex,
      },
    });
    pointId++;
  }

  if (points.length > 0) {
    // Upsert in batches of 50
    const UPSERT_BATCH = 50;
    for (let i = 0; i < points.length; i += UPSERT_BATCH) {
      const batch = points.slice(i, i + UPSERT_BATCH);
      try {
        await upsertPoints(batch);
        log(`  Upserted ${batch.length} points (${i + 1}-${i + batch.length})`);
      } catch (err) {
        logError(`Failed to upsert batch starting at point ${i}`, err);
      }
      await sleep(500);
    }
  }

  log(`✓ Completed "${caseName}": ${points.length} chunks ingested`);
  return { pointId, chunksIngested: points.length };
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '═'.repeat(70));
  console.log('  CourtRoom AI — Data Ingestion Pipeline');
  console.log('  Qdrant + NVIDIA Embeddings + Indian Kanoon');
  console.log('═'.repeat(70) + '\n');

  // Validate environment variables
  const missing = [];
  if (!QDRANT_URL || QDRANT_URL.includes('your-cluster')) missing.push('VITE_QDRANT_URL');
  if (!QDRANT_API_KEY || QDRANT_API_KEY === 'your-qdrant-api-key') missing.push('VITE_QDRANT_API_KEY');
  if (!NVIDIA_API_KEY || NVIDIA_API_KEY === 'your-nvidia-api-key') missing.push('VITE_NVIDIA_API_KEY');
  if (!IK_API_KEY || IK_API_KEY === 'your-indiankanoon-api-key') missing.push('VITE_INDIANKANOON_API_KEY');

  if (missing.length > 0) {
    console.error(`\n❌ Missing required environment variables in .env:\n`);
    missing.forEach((v) => console.error(`   • ${v}`));
    console.error(`\nPlease set these values in your .env file and try again.\n`);
    process.exit(1);
  }

  log(`Qdrant URL: ${QDRANT_URL}`);
  log(`Collection: ${COLLECTION_NAME}`);
  log(`Vector Size: ${VECTOR_SIZE}`);
  log(`Cases to ingest: ${CASES_TO_INGEST.length}\n`);

  // Step 1: Create/recreate the collection
  try {
    await createCollection();
  } catch (err) {
    logError('Failed to create Qdrant collection. Aborting.', err);
    process.exit(1);
  }

  await sleep(2000);

  // Step 2: Process each case
  let totalChunks = 0;
  let pointIdCounter = 1;

  for (const caseConfig of CASES_TO_INGEST) {
    try {
      const result = await processCase(caseConfig, pointIdCounter);
      pointIdCounter = result.pointId;
      totalChunks += result.chunksIngested;
    } catch (err) {
      logError(`Unexpected error processing "${caseConfig.caseName}"`, err);
    }

    await sleep(3000); // Courtesy delay between cases
  }

  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log(`  ✅ Ingestion Complete!`);
  console.log(`  Total chunks ingested: ${totalChunks}`);
  console.log(`  Collection: ${COLLECTION_NAME}`);
  console.log('═'.repeat(70) + '\n');
}

main().catch((err) => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
