/**
 * daily.js — the 10-second daily habits: energy check-in and tiny wins.
 *
 * Shape (STORAGE_KEYS.DAILY):
 *   {
 *     days: { 'YYYY-MM-DD': { energy: 'low'|'steady'|'high', wins: ['connect', ...] } },
 *     customWins: [{ id, label }],
 *     lastGoodDayNudge: 'YYYY-MM-DD',
 *   }
 *
 * Dates are LOCAL calendar days: wins logged at 9pm belong to today, not
 * to tomorrow's UTC date.
 */

import storage, { STORAGE_KEYS } from './storage';
import { localDateStr } from '../utils/dates';

/* Pacing templates — Module 17's principles (stop before the limit, the
   80% baseline, proactive rest) turned into one screen per energy level. */
export const ENERGY_LEVELS = {
  low: {
    label: 'Low',
    title: 'A low-battery day',
    steps: [
      'Pick one must-do. Everything else can wait, or be asked for.',
      'Rest before you feel tired: a short break every 20–30 minutes.',
      'Gentle counts: a little movement, warmth, something comforting.',
    ],
  },
  steady: {
    label: 'Steady',
    title: 'A steady day',
    steps: [
      'Pick one priority task and one restorative activity.',
      'Stop at about 80% of what you could do before pain increases. That is your baseline.',
      'Schedule your rest breaks now, not when you need them.',
    ],
  },
  high: {
    label: 'High',
    title: 'A clearer day',
    steps: [
      'Enjoy it, and protect tomorrow: bank about 20% of today’s energy.',
      'Do what you planned, not the whole backlog.',
      'Stop while you still feel good. That is how good days lead to more good days.',
    ],
  },
};

/* Values-based actions (ACT, Module 14): progress is living closer to what
   matters, even with pain. */
export const DEFAULT_WINS = [
  { id: 'connect', label: 'Connected with someone' },
  { id: 'outside', label: 'Spent a few minutes outside' },
  { id: 'limit', label: 'Respected my body’s limit without guilt' },
  { id: 'rest', label: 'Rested before I needed to' },
  { id: 'move', label: 'Moved gently' },
  { id: 'enjoy', label: 'Did something I enjoy' },
  { id: 'kind', label: 'Was kind to myself' },
];

function normalize(raw) {
  const d = raw && typeof raw === 'object' ? raw : {};
  return {
    days: d.days && typeof d.days === 'object' ? d.days : {},
    customWins: Array.isArray(d.customWins) ? d.customWins : [],
    lastGoodDayNudge: d.lastGoodDayNudge || null,
  };
}

export async function getDaily() {
  return normalize(await storage.get(STORAGE_KEYS.DAILY));
}

// Writes run one at a time so quick taps on two chips can't overwrite each other.
let queue = Promise.resolve();
function update(fn) {
  const run = queue.then(async () => {
    const next = fn(await getDaily());
    await storage.set(STORAGE_KEYS.DAILY, next);
    return next;
  });
  queue = run.catch(() => {});
  return run;
}

const withDay = (d, date, patch) => ({
  ...d,
  days: { ...d.days, [date]: { wins: [], ...d.days[date], ...patch } },
});

export const setEnergy = (date, energy) => update(d => withDay(d, date, { energy }));

export const toggleWin = (date, id) => update(d => {
  const wins = d.days[date]?.wins || [];
  return withDay(d, date, { wins: wins.includes(id) ? wins.filter(w => w !== id) : [...wins, id] });
});

export const addCustomWin = (label) => update(d => ({
  ...d,
  customWins: [...d.customWins, { id: `c${Date.now()}`, label }],
}));

export const removeCustomWin = (id) => update(d => ({
  ...d,
  customWins: d.customWins.filter(w => w.id !== id),
}));

export const markGoodDayNudge = (date) => update(d => ({ ...d, lastGoodDayNudge: date }));

/** Total wins checked over the last 7 days, including today. */
export function winsThisWeek(daily, today = new Date()) {
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    total += (daily.days[localDateStr(d)]?.wins || []).length;
  }
  return total;
}

/**
 * A "good day" worth a pacing reminder: low pain in absolute terms, or
 * clearly below this person's own recent average (a 5 can be a great day
 * for someone who usually lives at 7). High fatigue rules it out.
 */
const score = (v) => (v === '' || v == null ? NaN : Number(v));

export function isGoodDay(entry, recentEntries = []) {
  const pain = score(entry?.pain);
  if (!Number.isFinite(pain)) return false;
  const fatigue = score(entry.fatigue);
  if (Number.isFinite(fatigue) && fatigue > 6) return false;
  if (pain <= 3) return true;
  const prior = recentEntries
    .filter(e => e.date !== entry.date)
    .map(e => score(e.pain))
    .filter(Number.isFinite);
  if (prior.length < 5) return false;
  const avg = prior.reduce((a, b) => a + b, 0) / prior.length;
  return pain <= avg - 2;
}
