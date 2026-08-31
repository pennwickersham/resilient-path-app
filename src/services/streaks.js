/**
 * streaks.js — Flare-tolerant check-in streaks
 *
 * A streak system for people whose condition guarantees bad days.
 * Rules, deliberately gentle:
 *   - A day counts if a symptom entry exists for it.
 *   - Each rolling 7 days earns up to 2 grace days: gaps of 1–2 days do
 *     NOT break the streak (a flare is not a moral failure).
 *   - A logged flare event on a missed day always converts it to grace,
 *     regardless of the weekly budget — the app never punishes the user
 *     for being too unwell to log.
 *   - The streak counts LOGGED days only; grace days keep it alive but
 *     don't inflate the number.
 */

import { validEntries } from './symptomAnalysis';

const DAY = 86400000;

const isoOf = (ts) => new Date(ts).toISOString().split('T')[0];

/**
 * @param entries  symptoms array (HealthTools shape)
 * @param flares   flare event array [{ date: 'YYYY-MM-DD', ... }]
 * @returns { current, best, graceUsed, activeToday }
 */
export function computeStreak(entries, flares = []) {
  const logged = new Set(validEntries(entries).map(e => e.date));
  const flareDays = new Set((flares || []).map(f => f.date).filter(Boolean));
  if (logged.size === 0) return { current: 0, best: 0, graceUsed: 0, activeToday: false };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayIso = isoOf(today.getTime());

  // Walk backward from today (or yesterday, if today isn't logged yet —
  // an unfinished today never breaks a streak).
  let cursor = today.getTime();
  if (!logged.has(todayIso)) cursor -= DAY;

  let current = 0;
  let graceUsed = 0;
  let consecutiveMisses = 0;
  let pendingGrace = 0;    // grace only counts once a logged day follows it
  const graceSpent = [];   // timestamps of non-flare grace, for the 7-day budget

  for (let guard = 0; guard < 3660; guard++) {
    const iso = isoOf(cursor);
    if (logged.has(iso)) {
      current++;
      consecutiveMisses = 0;
      graceUsed += pendingGrace; // grace that bridged to this day is committed
      pendingGrace = 0;
    } else {
      const excusedByFlare = flareDays.has(iso);
      // Budget: at most 2 non-flare grace days per rolling 7 days. We walk
      // backward, so previously spent grace lies AFTER the cursor in time.
      const budgetLeft = graceSpent.filter(t => t - cursor < 7 * DAY).length < 2;
      if (excusedByFlare || (consecutiveMisses < 2 && budgetLeft)) {
        consecutiveMisses++;
        pendingGrace++;
        if (!excusedByFlare) graceSpent.push(cursor);
      } else {
        break; // streak ends; trailing pendingGrace is discarded
      }
    }
    cursor -= DAY;
  }

  // Best streak: same walk over the full history, segment by segment.
  const allDates = [...logged].sort();
  let best = 0;
  if (allDates.length) {
    let run = 1;
    for (let i = 1; i < allDates.length; i++) {
      const gap = Math.round((Date.parse(allDates[i]) - Date.parse(allDates[i - 1])) / DAY);
      // Gaps of up to 3 calendar days (2 missed days) survive, matching the
      // grace rule; flare-excused gaps of any length survive too.
      const gapDays = [];
      for (let g = 1; g < gap; g++) gapDays.push(isoOf(Date.parse(allDates[i - 1]) + g * DAY));
      const excused = gap <= 3 || gapDays.every(d => flareDays.has(d));
      if (excused) run++;
      else { best = Math.max(best, run); run = 1; }
    }
    best = Math.max(best, run);
  }

  return { current, best: Math.max(best, current), graceUsed, activeToday: logged.has(todayIso) };
}
