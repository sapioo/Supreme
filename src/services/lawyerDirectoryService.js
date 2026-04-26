import pdfWorkerSrc from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';

const AOR_DIRECTORY_PDF_URL = 'https://cdnbbsr.s3waas.gov.in/s3ec0490f1f4972d133619a60c30f3559e/uploads/2026/04/2026041558.pdf';
const AOR_DIRECTORY_SOURCE = {
  label: 'Supreme Court of India Advocate-on-Record Directory',
  type: 'official_pdf',
  url: AOR_DIRECTORY_PDF_URL,
  asOf: '2026-04-13',
};

let directoryCachePromise = null;

function isDateToken(value) {
  return /^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(value.trim());
}

function parseDateToken(value) {
  if (!isDateToken(value)) return null;
  const [day, month, year] = value.split(/[/-]/).map((part) => Number(part));
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function inferCity(address) {
  const source = address.toLowerCase();
  if (source.includes('new delhi') || source.includes('delhi')) return 'Delhi';
  if (source.includes('mumbai') || source.includes('bombay')) return 'Mumbai';
  if (source.includes('bengaluru') || source.includes('bangalore')) return 'Bengaluru';
  if (source.includes('chennai') || source.includes('madras')) return 'Chennai';
  if (source.includes('kolkata') || source.includes('calcutta')) return 'Kolkata';
  if (source.includes('hyderabad')) return 'Hyderabad';
  if (source.includes('pune')) return 'Pune';
  if (source.includes('gurugram') || source.includes('gurgaon')) return 'Gurugram';
  if (source.includes('noida')) return 'Noida';
  return '';
}

function buildDesignation(remarks) {
  if (/senior advocate|sr\.\s*advocate/i.test(remarks)) {
    return 'Senior Advocate / Advocate-on-Record / Supreme Court of India';
  }
  return 'Advocate-on-Record / Supreme Court of India';
}

function extractPageTokens(items) {
  const ignoredTokens = new Set([
    'Sl. No.',
    'Name & Address',
    'Date of',
    'registration',
    'as an AOR',
    'File No./',
    'Reg.No.',
    'Remarks',
    'CC. Code',
  ]);

  return items
    .map((item) => (item?.str || '').trim())
    .filter((token) => {
      if (!token) return false;
      if (ignoredTokens.has(token)) return false;
      if (/^SUPREME COURT OF INDIA$/i.test(token)) return false;
      if (/^\(\s*Record Room\s*\)$/i.test(token)) return false;
      if (/^List of Advocates-on-Record$/i.test(token)) return false;
      if (/^\(as on \d{2}\.\d{2}\.\d{4}\)$/i.test(token)) return false;
      if (/^M P a g e$/i.test(token)) return false;
      if (token === '|') return false;
      return true;
    });
}

function splitRecordsFromTokens(tokens) {
  const records = [];
  let current = [];
  const rolePattern = /\(.*?(?:Advocate|Attorney).*?\)/i;
  const titlePattern = /^(Sh|Ms|Miss|Mr|Mrs|Smt|Dr)\.?$/i;

  const isRecordStart = (index) => {
    if (!/^\d+$/.test(tokens[index] || '')) return false;
    if (!titlePattern.test(tokens[index + 1] || '')) return false;
    const preview = tokens.slice(index + 1, index + 7).join(' ');
    return rolePattern.test(preview);
  };

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (isRecordStart(index)) {
      if (current.length > 0) records.push(current);
      current = [token];
      continue;
    }

    if (current.length > 0) {
      current.push(token);
    }
  }

  if (current.length > 0) {
    records.push(current);
  }

  return records;
}

function parseRecordTokens(tokens) {
  if (!Array.isArray(tokens) || tokens.length === 0) return null;

  const serial = Number(tokens[0]);
  if (!serial) return null;

  let index = 1;
  const nameTokens = [];
  while (index < tokens.length) {
    nameTokens.push(tokens[index]);
    if (/\(.*?(?:Advocate|Attorney).*?\)/i.test(tokens[index])) break;
    index += 1;
  }

  if (index >= tokens.length) return null;

  const nameWithRole = normalizeWhitespace(nameTokens.join(' '));
  const role = /attorney/i.test(nameWithRole) ? 'Attorney' : 'Advocate';
  const name = normalizeWhitespace(nameWithRole.replace(/\(.*?(?:Advocate|Attorney).*?\)\s*$/i, ''));
  const rawTokens = tokens.slice(index + 1);
  const dateIndex = rawTokens.findIndex(isDateToken);
  const detailTokens = dateIndex === -1 ? rawTokens : rawTokens.slice(0, dateIndex);
  const registrationDateRaw = dateIndex === -1 ? '' : rawTokens[dateIndex];
  const afterDate = dateIndex === -1 ? [] : rawTokens.slice(dateIndex + 1);
  const rawCcCodeIndex = afterDate.length > 1
    ? afterDate.findLastIndex((token) => /^\d+$/.test(token.replace(/\s+/g, '')))
    : -1;
  const ccCodeIndex = rawCcCodeIndex > 0 ? rawCcCodeIndex : -1;

  const fileNumber = afterDate[0] ? normalizeWhitespace(afterDate[0]) : '';
  const remarksTokens = afterDate.slice(1, ccCodeIndex === -1 ? undefined : ccCodeIndex);
  const remarks = normalizeWhitespace(remarksTokens.join(' '));
  const ccCode = ccCodeIndex === -1 ? '' : afterDate[ccCodeIndex].replace(/\s+/g, '');
  const emails = detailTokens.flatMap((token) => token.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []);
  const phones = detailTokens
    .map((token) => token.replace(/[^\d]/g, ''))
    .filter((token) => token.length >= 10 && token.length <= 12);
  const address = normalizeWhitespace(
    detailTokens
      .filter((token) => !emails.includes(token) && !phones.includes(token.replace(/[^\d]/g, '')))
      .join(', ')
      .replace(/\s+,/g, ',')
      .replace(/,\s*,/g, ', ')
  );
  const registrationDate = parseDateToken(registrationDateRaw);
  const city = inferCity(address);
  const isActive = role === 'Advocate' && !/expired|removed/i.test(remarks);
  const isSeniorAdvocate = /senior advocate|sr\.\s*advocate/i.test(remarks);
  const experienceYears = registrationDate
    ? Math.max(0, new Date().getUTCFullYear() - registrationDate.getUTCFullYear())
    : null;

  return {
    id: `sci-aor-${serial}`,
    serial,
    name,
    role,
    designation: buildDesignation(remarks),
    court: 'Supreme Court of India',
    address,
    city,
    emails,
    phones,
    registrationDate: registrationDate ? registrationDate.toISOString().slice(0, 10) : '',
    fileNumber,
    ccCode,
    remarks,
    isActive,
    isSeniorAdvocate,
    experienceYears,
    source: AOR_DIRECTORY_SOURCE,
  };
}

async function loadDirectoryRecords() {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
  const response = await fetch(AOR_DIRECTORY_PDF_URL);
  if (!response.ok) {
    throw new Error(`Directory fetch failed (${response.status}).`);
  }

  const pdfBytes = await response.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;
  const records = [];

  for (let pageNumber = 2; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const tokens = extractPageTokens(textContent.items);
    if (tokens[tokens.length - 1] === String(pageNumber)) {
      tokens.pop();
    }
    const pageRecords = splitRecordsFromTokens(tokens)
      .map(parseRecordTokens)
      .filter(Boolean);
    records.push(...pageRecords);
  }

  return records;
}

export async function getSupremeCourtLawyerDirectory() {
  if (!directoryCachePromise) {
    directoryCachePromise = loadDirectoryRecords().catch((error) => {
      directoryCachePromise = null;
      throw error;
    });
  }

  const records = await directoryCachePromise;
  return {
    source: AOR_DIRECTORY_SOURCE,
    lawyers: records,
  };
}

function computeDirectoryScore(record, filters = {}) {
  let score = 0;

  if (record.isActive) score += 25;
  if (record.isSeniorAdvocate) score += 10;
  if ((record.experienceYears || 0) > 25) score += 8;
  else if ((record.experienceYears || 0) > 10) score += 5;

  if (filters.city && record.address.toLowerCase().includes(filters.city.toLowerCase())) {
    score += 12;
  }

  if (filters.courtLevel && /supreme/i.test(filters.courtLevel)) {
    score += 8;
  }

  if (filters.budgetBand === 'Premium / senior counsel' && record.isSeniorAdvocate) {
    score += 8;
  }

  if (filters.budgetBand === 'Value-conscious but strong' && !record.isSeniorAdvocate) {
    score += 4;
  }

  if (filters.caseStage === 'Final arguments' && record.isSeniorAdvocate) {
    score += 4;
  }

  if (filters.caseStage === 'Appeal') {
    score += 3;
  }

  if (record.address.toLowerCase().includes('supreme court')) {
    score += 2;
  }

  return score;
}

export async function searchSupremeCourtLawyers({ filters = {}, limit = 24 } = {}) {
  const { lawyers, source } = await getSupremeCourtLawyerDirectory();
  const safeLimit = Math.min(60, Math.max(1, Number(limit) || 24));

  const ranked = lawyers
    .filter((record) => record.isActive)
    .map((record) => ({ ...record, directoryScore: computeDirectoryScore(record, filters) }))
    .sort((a, b) => {
      if (b.directoryScore !== a.directoryScore) return b.directoryScore - a.directoryScore;
      return (b.experienceYears || 0) - (a.experienceYears || 0);
    })
    .slice(0, safeLimit);

  return { lawyers: ranked, source };
}

export { AOR_DIRECTORY_SOURCE };
