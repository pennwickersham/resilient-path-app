/**
 * build-chunks.mjs — Split the book & workbook into retrieval chunks.
 *
 * The chatbot previously sent only the first 30,000 characters of the book
 * (~1.4% of it) as context. This script splits the full text into
 * heading-aware chunks so the app can retrieve only the sections relevant
 * to each question (see src/services/retrieval.js).
 *
 * Run whenever book-utf8.md or workbook.md changes:
 *   node scripts/build-chunks.mjs
 *
 * Output: public/data/chunks.json
 *   [{ id, source: 'book'|'workbook', heading, text }]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const SOURCES = [
  { source: 'book', path: resolve(root, 'public/data/book-utf8.md') },
  { source: 'workbook', path: resolve(root, 'public/data/workbook.md') },
];

const TARGET_CHARS = 4500;  // ~1000 tokens per chunk
const MIN_CHARS = 400;      // merge tiny fragments into neighbors

/** Repair Windows-conversion mojibake so users and the AI see clean text. */
function fixMojibake(t) {
  return t
    .replace(/ΓÇ£/g, '\u201C').replace(/ΓÇ¥/g, '\u201D')
    .replace(/ΓÇÖ/g, '\u2019').replace(/ΓÇÿ/g, '\u2018')
    .replace(/ΓÇö/g, '\u2014').replace(/ΓÇô/g, '\u2013')
    .replace(/ΓÇª/g, '\u2026').replace(/ΓÇó/g, '\u2022')
    .replace(/┬á/g, ' ').replace(/┬⌐/g, '\u00A9').replace(/┬«/g, '\u00AE')
    .replace(/┬░/g, '\u00B0').replace(/┬╜/g, '\u00BD').replace(/┬╝/g, '\u00BC')
    .replace(/\\([.\-()'"!?])/g, '$1'); // unescape pandoc-style backslashes
}

/** Split markdown into (heading, body) sections, then pack into chunks. */
function chunkMarkdown(text, source) {
  // Normalize: strip base64 images and excessive whitespace (the converted
  // manuscript embeds images as data URIs, which are useless for retrieval
  // and enormous).
  const clean = fixMojibake(text)
    .replace(/!\[[^\]]*\]\(data:[^)]*\)/g, '')
    .replace(/data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n');

  const lines = clean.split('\n');
  const sections = [];
  let heading = 'Introduction';
  let buf = [];

  const flush = () => {
    const body = buf.join('\n').trim();
    if (body) sections.push({ heading, body });
    buf = [];
  };

  const headingRes = [
    /^(#{1,4})\s+(.+)/,                                        // markdown headings
    /^\s*_{0,2}(Chapter\s+\d+\s*:.{0,140}?)_{0,2}\s*$/i,        // "__Chapter 12: ...__"
    /^\s*_{0,2}(Module\s+\d+\s*:.{0,140}?)_{0,2}\s*$/i,         // workbook modules
    /^\s*_{0,2}(Part\s+\d+\s*:.{0,140}?)_{0,2}\s*$/i,           // "__Part 2: ...__"
    /^\s*_{0,2}((?:Foreword|Preface|Introduction|Conclusion|Epilogue|Glossary|Appendix\b.{0,100}|About the Author).{0,40}?)_{0,2}\s*$/i,
  ];

  for (const line of lines) {
    let h = null;
    for (const re of headingRes) {
      const m = line.match(re);
      if (m) { h = (m[2] || m[1]); break; }
    }
    if (h) {
      flush();
      heading = h.replace(/[#*_]+/g, '').trim().slice(0, 160) || heading;
    } else {
      buf.push(line);
    }
  }
  flush();

  // Pack sections into chunks near TARGET_CHARS, splitting long sections
  // on paragraph boundaries and merging tiny ones forward.
  const chunks = [];
  for (const { heading, body } of sections) {
    if (body.length <= TARGET_CHARS) {
      chunks.push({ heading, text: body });
      continue;
    }
    const paras = body.split(/\n\n+/);
    let cur = '';
    for (const p of paras) {
      if (cur && (cur.length + p.length + 2) > TARGET_CHARS) {
        chunks.push({ heading, text: cur.trim() });
        cur = '';
      }
      cur += (cur ? '\n\n' : '') + p;
    }
    if (cur.trim()) chunks.push({ heading, text: cur.trim() });
  }

  // Merge undersized chunks into the previous one (same flow of text).
  const merged = [];
  for (const c of chunks) {
    const prev = merged[merged.length - 1];
    if (prev && c.text.length < MIN_CHARS && (prev.text.length + c.text.length) < TARGET_CHARS * 1.4) {
      prev.text += '\n\n' + c.text;
    } else {
      merged.push({ ...c });
    }
  }

  return merged.map((c, i) => ({
    id: `${source}-${i}`,
    source,
    heading: c.heading,
    text: c.text,
  }));
}

const all = [];
for (const { source, path } of SOURCES) {
  const raw = readFileSync(path, 'utf8');
  const chunks = chunkMarkdown(raw, source);
  console.log(`${source}: ${raw.length.toLocaleString()} chars -> ${chunks.length} chunks`);
  all.push(...chunks);
}

const out = resolve(root, 'public/data/chunks.json');
writeFileSync(out, JSON.stringify(all));
console.log(`Wrote ${all.length} chunks to ${out} (${(JSON.stringify(all).length / 1024).toFixed(0)} KB)`);
