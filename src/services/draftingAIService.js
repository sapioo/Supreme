import { getDraftingAISettings } from './draftingAISettings';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const APP_TITLE = 'SUPREME Drafting Editor';
const TRUNCATED_RESPONSE_MESSAGE =
  'The model response was cut off before it produced a complete draft. Please retry or ask for a shorter edit.';
const MALFORMED_RESPONSE_MESSAGE =
  'The model returned malformed JSON, so I could not safely apply its draft. Please retry.';

function cleanModelOutput(text) {
  let cleaned = String(text || '').trim();

  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  // Handle fences with or without newlines, at any position
  cleaned = cleaned.replace(/^```[\w]*\s*/i, '').replace(/\s*```\s*$/i, '');

  // Some models wrap in single backticks
  cleaned = cleaned.replace(/^`\s*/, '').replace(/\s*`$/, '');

  return cleaned.trim();
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

function decodeJsonString(value) {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .trim();
}

function isCompleteLatexDocument(source) {
  const trimmed = String(source || '').trim();
  return trimmed.startsWith('\\documentclass') && trimmed.includes('\\begin{document}') && trimmed.includes('\\end{document}');
}

function getLikelyTruncationReason({ cleaned, finishReason }) {
  if (finishReason === 'length') return 'finish_reason_length';
  if (cleaned.startsWith('{') && !cleaned.endsWith('}')) return 'unterminated_json_object';
  return null;
}

function normalizeParsedPayload(parsed) {
  let message = typeof parsed?.message === 'string'
    ? parsed.message.trim()
    : '';

  // Strip leading colons/dashes that some models prefix
  message = message.replace(/^[:\-–—]\s*/, '').trim();

  const proposedSource = typeof parsed?.proposedSource === 'string' && parsed.proposedSource.trim()
    ? parsed.proposedSource.trim()
    : null;

  return {
    message: message || 'The assistant returned no explanation.',
    proposedSource,
    rejectedProposedSource: null,
  };
}

function parseStructuredResponse(rawContent, { finishReason } = {}) {
  const cleaned = cleanModelOutput(rawContent);
  if (!cleaned) {
    return {
      message: 'The assistant returned an empty response.',
      proposedSource: null,
      parseStrategy: 'empty',
      parseOk: false,
      malformed: true,
      truncated: finishReason === 'length',
      truncationReason: finishReason === 'length' ? 'finish_reason_length' : null,
    };
  }

  // Attempt 1: direct JSON.parse
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed.message === 'string') {
      const normalized = normalizeParsedPayload(parsed);
      const truncationReason = getLikelyTruncationReason({
        cleaned,
        finishReason,
      });

      if (truncationReason) {
        return {
          message: TRUNCATED_RESPONSE_MESSAGE,
          proposedSource: null,
          parseStrategy: 'json',
          parseOk: false,
          malformed: false,
          truncated: true,
          truncationReason,
        };
      }

      return {
        message: normalized.message,
        proposedSource: normalized.proposedSource,
        parseStrategy: 'json',
        parseOk: true,
        malformed: false,
        truncated: false,
        truncationReason: null,
      };
    }
  } catch {
    // Fall through to regex extraction
  }

  // Attempt 2: extract JSON object from within the text (model may have added preamble/postamble)
  const jsonMatch = cleaned.match(/\{[\s\S]*"message"\s*:\s*"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed && typeof parsed.message === 'string') {
        const normalized = normalizeParsedPayload(parsed);
        const truncationReason = getLikelyTruncationReason({
          cleaned,
          finishReason,
        });

        if (truncationReason) {
          return {
            message: TRUNCATED_RESPONSE_MESSAGE,
            proposedSource: null,
            parseStrategy: 'embedded-json',
            parseOk: false,
            malformed: false,
            truncated: true,
            truncationReason,
          };
        }

        return {
          message: normalized.message,
          proposedSource: normalized.proposedSource,
          parseStrategy: 'embedded-json',
          parseOk: true,
          malformed: false,
          truncated: false,
          truncationReason: null,
        };
      }
    } catch {
      // Fall through to regex field extraction
    }
  }

  // Attempt 3: regex-extract individual fields when JSON is malformed
  // (common when proposedSource contains unescaped newlines or special chars)
  const messageMatch = cleaned.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  const sourceMatch = cleaned.match(/"proposedSource"\s*:\s*"([\s\S]*?)(?:"\s*\}?\s*$)/);

  if (messageMatch) {
    const message = decodeJsonString(messageMatch[1]).replace(/^[:\-–—]\s*/, '');

    let proposedSource = null;
    if (sourceMatch && sourceMatch[1].trim() && sourceMatch[1].trim() !== 'null') {
      proposedSource = decodeJsonString(sourceMatch[1]);
    }

    const truncationReason = getLikelyTruncationReason({
      cleaned,
      finishReason,
    });

    if (truncationReason) {
      return {
        message: TRUNCATED_RESPONSE_MESSAGE,
        proposedSource: null,
        parseStrategy: 'regex-fields',
        parseOk: false,
        malformed: true,
        truncated: true,
        truncationReason,
      };
    }

    return {
      message: message || 'The assistant returned no explanation.',
      proposedSource: proposedSource || null,
      parseStrategy: 'regex-fields',
      parseOk: true,
      malformed: true,
      truncated: false,
      truncationReason: null,
    };
  }

  // Attempt 4: never show raw broken JSON in chat. Keep it in console diagnostics instead.
  if (cleaned.startsWith('{') && cleaned.includes('"message"')) {
    const truncationReason = getLikelyTruncationReason({ cleaned, finishReason });
    return {
      message: truncationReason ? TRUNCATED_RESPONSE_MESSAGE : MALFORMED_RESPONSE_MESSAGE,
      proposedSource: null,
      parseStrategy: 'malformed-json',
      parseOk: false,
      malformed: true,
      truncated: Boolean(truncationReason),
      truncationReason,
    };
  }

  if (finishReason === 'length') {
    return {
      message: TRUNCATED_RESPONSE_MESSAGE,
      proposedSource: null,
      parseStrategy: 'plain-text-truncated',
      parseOk: false,
      malformed: false,
      truncated: true,
      truncationReason: 'finish_reason_length',
    };
  }

  // Final fallback: non-JSON plain text is usable as a message, but never as an editable proposal.
  return {
    message: cleaned,
    proposedSource: null,
    parseStrategy: 'plain-text',
    parseOk: true,
    malformed: false,
    truncated: false,
    truncationReason: null,
  };
}

function logDraftingAIResponse({ data, content, parsed, elapsedMs }) {
  const choice = data?.choices?.[0] || {};
  const diagnostics = {
    id: data?.id || null,
    model: data?.model || null,
    finishReason: choice.finish_reason || null,
    usage: data?.usage || null,
    elapsedMs,
    rawContentLength: content.length,
    parseStrategy: parsed.parseStrategy,
    parseOk: parsed.parseOk,
    malformed: parsed.malformed,
    truncated: parsed.truncated,
    truncationReason: parsed.truncationReason,
    hasProposedSource: Boolean(parsed.proposedSource),
  };

  if (parsed.parseOk && !parsed.malformed && !parsed.truncated) {
    console.groupCollapsed('[DraftingAI] OpenRouter response');
    console.info(diagnostics);
    console.groupEnd();
    return;
  }

  console.warn('[DraftingAI] malformed response', {
    ...diagnostics,
    rawContent: content,
  });
}

function buildSystemPrompt() {
  return `You are a senior Indian legal drafting assistant embedded in a LaTeX-based document editor called SUPREME.
Your role is to help lawyers draft, revise, explain, and improve legal documents while preserving valid LaTeX structure.

## LaTeX Formatting Rules

The editor uses a simplified LaTeX subset. Every document MUST follow this structure:

\\documentclass[12pt]{article}
\\title{DOCUMENT TITLE IN CAPS}
\\author{[PARTY / FIRM NAME]}
\\date{[DATE]}

\\begin{document}
\\maketitle

\\section{Section Name}
Content here.

\\end{document}

Strict rules:
- Always use \\documentclass[12pt]{article} as the document class.
- Always include \\title{}, \\author{}, \\date{}, \\begin{document}, \\maketitle, and \\end{document}.
- Use \\section{} for major headings and \\subsection{} for sub-headings.
- Use plain numbered lists (1. 2. 3.) or lettered lists (A. B. C.) as text — do NOT use \\begin{enumerate} or \\begin{itemize} environments.
- Do NOT use \\usepackage{} commands — the preview engine does not support packages.
- Do NOT use \\tableofcontents, \\newpage, \\textbf{}, \\textit{}, \\footnote{}, or any advanced LaTeX commands.
- Do NOT use \\item — write list items as plain numbered text lines.
- Keep all content between \\begin{document} and \\end{document}.
- Preserve placeholder brackets like [CLIENT NAME], [DATE], [COURT], etc. unless the user explicitly provides replacements.
- When proposing a rewrite, return the COMPLETE document from \\documentclass to \\end{document} — never a fragment.

## Indian Legal Drafting Conventions

All documents must follow Indian legal practice:
- Use "Hon'ble Court" (not "Honorable Court") when referring to courts.
- Use Indian court hierarchy: Supreme Court of India, High Court of [State], District Court, Tribunal names.
- Reference Indian statutes properly: "Section 138 of the Negotiable Instruments Act, 1881", "Article 21 of the Constitution of India".
- Use Indian legal terminology: "cause of action", "maintainability", "locus standi", "prayer", "reliefs", "Hon'ble", "learned counsel".
- Follow Indian date format: day month year (e.g., 15 January 2025).
- Use Indian address format with PIN codes where applicable.
- For litigation documents, follow CPC/CrPC conventions as appropriate.
- Use "Petitioner" / "Respondent" for writ petitions, "Plaintiff" / "Defendant" for civil suits, "Complainant" / "Accused" for criminal matters.
- Include proper verification clauses in affidavits and pleadings.
- Reference Indian case law in standard format: Party v. Party, (Year) Volume Reporter Page.
- Currency references should use INR / Rs. / Rupees.
- Governing law clauses should default to Indian law and Indian jurisdiction unless specified otherwise.

## Document Types You Handle

You assist with all Indian legal document types including:
- Pre-litigation notices (legal notices, reply notices, demand notices)
- Litigation pleadings (petitions, written statements, applications, affidavits)
- Criminal applications (bail, anticipatory bail, quashing)
- Advisory documents (legal memos, opinion letters, review notes)
- Contracts and agreements (service agreements, NDAs, employment contracts)
- Corporate documents (board resolutions, shareholder agreements)
- Written submissions and briefs for courts and tribunals

## Response Format

Always return valid JSON with this exact shape:
{
  "message": "string",
  "proposedSource": "string or null"
}

Rules:
- "message" must always be present — keep it concise, practical, and drafting-focused.
- Keep "message" under 200 characters when you also provide proposedSource.
- ALWAYS include "proposedSource" with the complete revised LaTeX when the user asks for ANY change, edit, addition, fill, rewrite, or modification to the document. Do not just describe the changes — actually make them.
- Only set "proposedSource" to null when the user asks a pure question, requests explanation, or gives feedback that does not require document changes.
- If you set "proposedSource", it MUST contain the complete document from \\documentclass to \\end{document}.
- When the user says "fill", "add", "replace", "change", "update", "remove", "rewrite", or similar action words — you MUST return the modified document in "proposedSource". Never just describe what you would do.
- Never wrap JSON in markdown fences or code blocks.
- Never include commentary outside the JSON object.
- Keep the tone professional, precise, and suitable for Indian legal practice.`;
}

function buildUserPrompt({ source, messages }) {
  const history = messages
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join('\n\n');

  return `Current LaTeX source:
${source}

Conversation:
${history}`;
}

export async function chatWithDraftingAI({ source, messages }) {
  const settings = getDraftingAISettings();
  if (!settings.apiKey || !settings.model) {
    return {
      source: 'config-missing',
      message: 'OpenRouter is not configured. Set DRAFTING_OPENROUTER_KEY and DRAFTING_OPENROUTER_MODEL in your .env file.',
      proposedSource: null,
    };
  }

  const startedAt = performance.now();

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
        max_tokens: 16000,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errorText.slice(0, 240)}`);
    }

    const data = await response.json();
    const choice = data?.choices?.[0] || {};
    const content = normalizeAssistantContent(choice.message?.content);
    const parsed = parseStructuredResponse(content, {
      finishReason: choice.finish_reason,
    });

    logDraftingAIResponse({
      data,
      content,
      parsed,
      elapsedMs: Math.round(performance.now() - startedAt),
    });

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
