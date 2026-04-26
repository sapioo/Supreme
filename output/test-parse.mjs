function buildTemplate({ title, author, sections }) {
  const formattedSections = sections
    .map(({ heading, body }) => `\\section{${heading}}\n${body.trim()}\n`)
    .join('\n');
  return `\\documentclass[12pt]{article}\n\\title{${title}}\n\\author{${author}}\n\\date{[DATE]}\n\n\\begin{document}\n\\maketitle\n\n${formattedSections}\\end{document}`;
}

const source = buildTemplate({
  title: 'LEGAL MEMORANDUM',
  author: 'Prepared for: [CLIENT / PARTNER / TEAM]',
  sections: [
    { heading: 'Question Presented', body: '[STATE THE QUESTION ARISING UNDER INDIAN LAW.]' },
    { heading: 'Short Answer', body: '[STATE THE PRACTICAL CONCLUSION.]' },
    { heading: 'Relevant Facts', body: '[SUMMARISE ONLY THE FACTS.]' },
    { heading: 'Applicable Indian Law', body: '[IDENTIFY PROVISIONS.]' },
    { heading: 'Analysis', body: '[APPLY THE LAW TO THE FACTS.]' },
    { heading: 'Risk Matrix', body: '1. Merits risk: [LOW / MEDIUM / HIGH].\n2. Procedural risk: [LOW / MEDIUM / HIGH].' },
    { heading: 'Recommendation', body: '[STATE THE PREFERRED COURSE OF ACTION.]' },
  ],
});

function extractCommand(src, command) {
  const match = src.match(new RegExp(`\\\\${command}\\{([^}]*)\\}`));
  return match?.[1]?.trim() || '';
}

function parsePreview(src) {
  if (!src.trim()) return [];
  const blocks = [];
  const title = extractCommand(src, 'title');
  const author = extractCommand(src, 'author');
  const date = extractCommand(src, 'date');
  let inDocument = false;

  if (title) blocks.push({ type: 'title', text: title });
  if (author) blocks.push({ type: 'meta', text: author });
  if (date) blocks.push({ type: 'meta', text: date });

  src.split('\n').forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line || line.startsWith('\\documentclass') || line.startsWith('\\title') || line.startsWith('\\author') || line.startsWith('\\date')) return;
    if (line === '\\begin{document}') { inDocument = true; return; }
    if (line === '\\end{document}') { inDocument = false; return; }
    if (!inDocument || line === '\\maketitle') return;

    const section = line.match(/^\\section\{([^}]*)\}/);
    if (section) { blocks.push({ type: 'section', text: section[1] }); return; }

    const subsection = line.match(/^\\subsection\{([^}]*)\}/);
    if (subsection) { blocks.push({ type: 'subsection', text: subsection[1] }); return; }

    const item = line.match(/^\\item\s+(.+)/);
    if (item) { blocks.push({ type: 'list', text: item[1] }); return; }

    if (line.startsWith('\\begin') || line.startsWith('\\end')) return;
    blocks.push({ type: /^\d+\.|^[A-Z]\./.test(line) ? 'list' : 'paragraph', text: line });
  });

  return blocks;
}

const blocks = parsePreview(source);
console.log('Source length:', source.length);
console.log('Blocks count:', blocks.length);
console.log('Blocks:', JSON.stringify(blocks, null, 2));
