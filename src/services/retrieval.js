/**
 * retrieval.js — Grounds the chatbot in the ENTIRE book, not the first 30KB.
 *
 * Loads public/data/chunks.json (built by scripts/build-chunks.mjs) and
 * scores chunks against the user's question with BM25 lexical ranking.
 * The top-scoring chunks are sent to Gemini as context, so answers are
 * grounded in the actual relevant chapters and can cite them by name.
 *
 * Runs entirely on-device: no embeddings API, no vector database, works
 * offline once chunks.json is cached, and adds nothing to the worker.
 */

const STOPWORDS = new Set(('a an and are as at be but by for from has have how i if in into is it its me my of on or ' +
  'so that the their them then there these they this to was we what when where which who why will with you your').split(' '));

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019']/g, '')
    .split(/[^a-z0-9]+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t));
}

let indexPromise = null;

async function buildIndex() {
  const res = await fetch('/data/chunks.json');
  if (!res.ok) throw new Error(`Failed to load chunks.json (${res.status})`);
  const chunks = await res.json();

  const docs = chunks.map(c => {
    const tokens = tokenize(c.heading + ' ' + c.heading + ' ' + c.text); // heading counted twice: cheap boost
    const tf = new Map();
    for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
    return { chunk: c, tf, len: tokens.length };
  });

  const df = new Map();
  for (const d of docs) for (const term of d.tf.keys()) df.set(term, (df.get(term) || 0) + 1);
  const avgLen = docs.reduce((a, d) => a + d.len, 0) / docs.length;

  return { docs, df, avgLen, N: docs.length };
}

/** Idempotent, lazy. Call early (e.g., on Chatbot mount) to warm the index. */
export function warmRetrievalIndex() {
  if (!indexPromise) {
    indexPromise = buildIndex().catch(err => {
      indexPromise = null; // allow retry on next call
      throw err;
    });
  }
  return indexPromise;
}

/**
 * Return the top-K most relevant chunks for a query.
 * Recent conversation turns can be appended to the query so follow-ups
 * like "tell me more about that" still retrieve sensible sections.
 */
export async function retrieveChunks(query, { topK = 8, maxChars = 36000 } = {}) {
  const { docs, df, avgLen, N } = await warmRetrievalIndex();
  const qTerms = [...new Set(tokenize(query))];
  if (qTerms.length === 0) return [];

  const k1 = 1.4, b = 0.75;
  const scored = [];
  for (const d of docs) {
    let score = 0;
    for (const term of qTerms) {
      const f = d.tf.get(term);
      if (!f) continue;
      const n = df.get(term) || 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      score += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * (d.len / avgLen)));
    }
    if (score > 0) scored.push({ score, chunk: d.chunk });
  }
  scored.sort((a, b2) => b2.score - a.score);

  const picked = [];
  let chars = 0;
  for (const { chunk } of scored) {
    if (picked.length >= topK) break;
    if (chars + chunk.text.length > maxChars && picked.length > 0) continue;
    picked.push(chunk);
    chars += chunk.text.length;
  }
  return picked;
}

/** Format retrieved chunks for the system prompt. */
export function formatChunksForPrompt(chunks) {
  if (!chunks.length) return 'No specific sections retrieved for this question.';
  return chunks
    .map(c => `[${c.source === 'book' ? 'BOOK' : 'WORKBOOK'} — ${c.heading}]\n${c.text}`)
    .join('\n\n---\n\n');
}
