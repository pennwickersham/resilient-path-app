/**
 * dates.js — Local calendar-date helpers
 *
 * Saved entries are keyed by 'YYYY-MM-DD' on the device's LOCAL calendar,
 * so an evening check-in lands on today, not tomorrow (which is what
 * toISOString() — a UTC date — produced in the Americas).
 *
 * Never Date.parse() a date key: 'YYYY-MM-DD' parses as UTC midnight, which
 * is the previous local day west of Greenwich. Use parseDateKey(), which
 * anchors at local noon so ±24h arithmetic is safe across DST changes.
 */

export const DAY_MS = 86400000;

const pad = (n) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' for a Date (default: now) on the local calendar. */
export const localDateStr = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Local-noon Date for a 'YYYY-MM-DD' key; Invalid Date if malformed. */
export const parseDateKey = (key) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ''));
  if (!m) return new Date(NaN);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
};

/** Timestamp (ms) of a date key at local noon; NaN if malformed. */
export const dateKeyTs = (key) => parseDateKey(key).getTime();

/** Shift a date key by n calendar days (negative = earlier). */
export const addDays = (key, n) => {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + n);
  return localDateStr(d);
};

/** Today's key shifted back n calendar days. */
export const daysAgoStr = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDateStr(d);
};

/** Whole calendar days from key to today (0 = today, negative = future); NaN if malformed. */
export const daysAgo = (key, now = Date.now()) => {
  const ts = dateKeyTs(key);
  if (!Number.isFinite(ts)) return NaN;
  return Math.round((dateKeyTs(localDateStr(new Date(now))) - ts) / DAY_MS);
};
