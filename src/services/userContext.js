/**
 * userContext.js — Optional personalization context for the AI chat.
 *
 * PRIVACY: This module is only invoked when the user has explicitly turned
 * ON "Personalize with my data" in the chat screen (stored under
 * STORAGE_KEYS.PERSONALIZATION, default OFF). The app's AI consent notice
 * tells users health data is not sent to Google unless they enable this,
 * so never call these functions on any other path.
 *
 * We send a compact, derived SUMMARY (trends and short excerpts), not the
 * raw records, to keep the prompt small and minimize data shared.
 */

import storage, { STORAGE_KEYS } from './storage';
import { workbookData } from '../data/workbookForms';
import { getProgress, summarizeProgress } from './progress';
import { getSuggestions } from './symptomAnalysis';

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(10, n)) : null;
};

const avg = (arr) => {
  const xs = arr.filter(x => x !== null);
  return xs.length ? xs.reduce((a, x) => a + x, 0) / xs.length : null;
};

const fmt = (x) => (x === null ? 'n/a' : x.toFixed(1));

/** Summarize recent symptom entries: last-14-day averages + trend vs. prior period. */
export async function buildSymptomSummary() {
  const data = await storage.get(STORAGE_KEYS.HEALTH_TOOLS);
  const entries = (data?.symptoms || [])
    .filter(e => e.date && (num(e.pain) !== null || num(e.fatigue) !== null || num(e.sleep) !== null))
    .map(e => ({ ...e, ts: Date.parse(e.date) }))
    .filter(e => Number.isFinite(e.ts))
    .sort((a, b) => a.ts - b.ts);

  if (entries.length === 0) return null;

  const now = Date.now();
  const DAY = 86400000;
  const recent = entries.filter(e => now - e.ts <= 14 * DAY);
  const prior = entries.filter(e => now - e.ts > 14 * DAY && now - e.ts <= 28 * DAY);
  const scope = recent.length ? recent : entries.slice(-10);

  const metric = (list, k) => avg(list.map(e => num(e[k])));
  const lines = [`Symptom log summary (${scope.length} recent entries):`];
  for (const [key, label, goodDir] of [['pain', 'Pain', 'down'], ['fatigue', 'Fatigue', 'down'], ['sleep', 'Sleep quality', 'up']]) {
    const cur = metric(scope, key);
    if (cur === null) continue;
    const prev = prior.length >= 2 ? metric(prior, key) : null;
    let trend = '';
    if (prev !== null) {
      const d = cur - prev;
      if (Math.abs(d) >= 0.5) {
        const dir = d > 0 ? 'up' : 'down';
        trend = ` (${dir} ${Math.abs(d).toFixed(1)} vs prior two weeks${dir === goodDir ? ' — improving' : ''})`;
      } else trend = ' (stable)';
    }
    lines.push(`- ${label}: avg ${fmt(cur)}/10${trend}`);
  }

  const moods = scope.map(e => (e.mood || '').trim()).filter(Boolean).slice(-5);
  if (moods.length) lines.push(`- Recent moods: ${moods.join(', ')}`);
  const triggers = scope.map(e => (e.triggers || '').trim()).filter(Boolean).slice(-5);
  if (triggers.length) lines.push(`- Reported triggers: ${triggers.join('; ')}`);
  const lastNote = [...scope].reverse().find(e => (e.notes || '').trim());
  if (lastNote) lines.push(`- Latest note (${lastNote.date}): ${lastNote.notes.trim().slice(0, 200)}`);

  return lines.join('\n');
}

/** Short excerpts from the user's workbook answers (most recently touched modules). */
export async function buildWorkbookSummary({ maxChars = 1500 } = {}) {
  const answers = await storage.get(STORAGE_KEYS.WORKBOOK);
  if (!answers || typeof answers !== 'object') return null;

  const parts = [];
  for (const module of workbookData) {
    const answered = [];
    for (const sec of module.sections) {
      for (const field of sec.fields) {
        const v = answers[field.id];
        if (v === undefined || v === '' || v === false) continue;
        if (field.type === 'checkbox') answered.push(`- Checked: ${field.label.slice(0, 90)}`);
        else answered.push(`- Q: ${field.label.slice(0, 90)}\n  A: ${String(v).trim().slice(0, 180)}`);
      }
    }
    if (answered.length) {
      parts.push(`${module.title} (${answered.length} answers):\n${answered.slice(0, 4).join('\n')}`);
    }
  }
  if (!parts.length) return null;

  let out = 'Workbook progress summary:\n';
  for (const p of parts) {
    if (out.length + p.length > maxChars) break;
    out += p + '\n\n';
  }
  return out.trim();
}

/** Profile, program progress, recent flares, and a data-matched module
 *  suggestion — lets the guide say "your fatigue has been climbing; Module 17
 *  on pacing may help" and mean it. */
export async function buildProgramSummary() {
  const lines = [];
  try {
    const profile = await storage.get(STORAGE_KEYS.PROFILE);
    if (profile?.condition) lines.push(`- Condition (self-described): ${profile.condition}`);
    if (profile?.goal) {
      const goals = {
        impact: 'reduce pain\u2019s impact on daily life',
        patterns: 'understand symptom patterns and triggers',
        sleep: 'sleep better',
        appointments: 'get more out of doctor visits',
        emotional: 'cope better emotionally',
      };
      lines.push(`- Stated goal: ${goals[profile.goal] || profile.goal}`);
    }

    const prog = summarizeProgress(await getProgress());
    if (prog.done > 0) {
      lines.push(`- Program progress: ${prog.done}/${prog.total} modules marked complete${prog.resume ? `; currently around Module ${prog.resume}` : ''}`);
    }

    const flares = await storage.get(STORAGE_KEYS.FLARES);
    if (Array.isArray(flares)) {
      const recent = flares.filter(f => Number.isFinite(Date.parse(f.date)) && Date.now() - Date.parse(f.date) <= 30 * 86400000);
      if (recent.length) lines.push(`- Flare days logged in last 30 days: ${recent.length} (most recent ${recent[0].date})`);
    }

    const health = await storage.get(STORAGE_KEYS.HEALTH_TOOLS);
    const suggestions = getSuggestions(health?.symptoms || []);
    if (suggestions.length) {
      lines.push(`- Modules matched to their current data (suggest these naturally when relevant, by number and name): ${suggestions.map(s => `${s.title} \u2192 ${s.to}`).join('; ')}`);
    }
  } catch (e) {
    console.error('Program summary failed', e);
  }
  return lines.length ? `Program context:\n${lines.join('\n')}` : null;
}

/** Combined block for the system prompt, or null if nothing to share. */
export async function buildPersonalContext() {
  const [symptoms, workbook, program] = await Promise.all([
    buildSymptomSummary(), buildWorkbookSummary(), buildProgramSummary(),
  ]);
  if (!symptoms && !workbook && !program) return null;
  return [
    'PRIVATE USER CONTEXT (shared with the user\u2019s explicit consent \u2014 use it to personalize guidance, reference it naturally, and never repeat it back verbatim as a list):',
    program,
    symptoms,
    workbook,
  ].filter(Boolean).join('\n\n');
}
