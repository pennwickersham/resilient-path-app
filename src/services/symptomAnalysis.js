/**
 * symptomAnalysis.js — Dashboard math for the Symptom Tracker
 *
 * All functions work on the existing symptom entry shape stored under
 * STORAGE_KEYS.HEALTH_TOOLS.symptoms:
 *   { date: 'YYYY-MM-DD', pain: '', fatigue: '', sleep: '', mood, triggers, notes, foods: [] }
 * Values may be strings (legacy) — everything is normalized via toNum.
 *
 * "Burden" is the average of what's present: pain, fatigue, and inverted
 * sleep quality (10 - sleep), each 0–10 where higher = worse. Wellness is
 * (10 - burden) × 10, a 0–100 score where higher = better.
 *
 * When wearable sync is added later, merge readings into the same daily
 * entries (e.g. entry.hrv, entry.steps) and extend burden/trends here.
 */

export const toNum = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(10, n)) : null;
};

export function entryBurden(e) {
  const vals = [];
  const p = toNum(e.pain);
  const f = toNum(e.fatigue);
  const s = toNum(e.sleep);
  if (p !== null) vals.push(p);
  if (f !== null) vals.push(f);
  if (s !== null) vals.push(10 - s);
  if (!vals.length) return null;
  return vals.reduce((a, v) => a + v, 0) / vals.length;
}

export function validEntries(entries) {
  return (entries || [])
    .filter(e => e.date && /^\d{4}-\d{2}-\d{2}$/.test(e.date) && entryBurden(e) !== null)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function wellnessFromBurden(burden) {
  return Math.round((10 - burden) * 10);
}

export function statusFromWellness(w) {
  if (w >= 70) return { label: 'Doing Well', tone: 'good', desc: 'Your symptoms appear well managed right now.' };
  if (w >= 40) return { label: 'Moderate Day', tone: 'mid', desc: 'Some symptom activity — pace yourself and use your coping tools.' };
  return { label: 'Tough Stretch', tone: 'hard', desc: 'High symptom burden. Be gentle with yourself, and reach out to your care team if this persists.' };
}

const isoDaysAgo = (n) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

const avg = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);

export function computeDashboard(entries) {
  const sorted = validEntries(entries);
  if (!sorted.length) return null;

  const latest = sorted[sorted.length - 1];
  const burdenNow = entryBurden(latest);
  const wellness = wellnessFromBurden(burdenNow);

  const last7Start = isoDaysAgo(6);
  const prior7Start = isoDaysAgo(13);
  const last7 = sorted.filter(e => e.date >= last7Start);
  const prior7 = sorted.filter(e => e.date >= prior7Start && e.date < last7Start);

  const a7 = avg(last7.map(entryBurden));
  const p7 = avg(prior7.map(entryBurden));
  const weekDelta = a7 !== null && p7 !== null ? p7 - a7 : null; // positive = improving

  const weekDots = [];
  for (let i = 6; i >= 0; i--) {
    const k = isoDaysAgo(i);
    weekDots.push({ key: k, logged: sorted.some(e => e.date === k) });
  }
  const loggedCount = weekDots.filter(d => d.logged).length;

  return { sorted, latest, burdenNow, wellness, weekDelta, weekDots, loggedCount };
}

/* ============================================================
   Food Diary — trigger pattern analysis
   Compares average symptom burden on days a food was eaten —
   and the day after — against days it wasn't. Foods eaten on
   3+ logged days with a meaningfully higher burden are flagged
   as possible triggers. Pattern detection, not proof of cause.
   ============================================================ */

export const STARTER_FOODS = [
  'Red meat', 'Dairy', 'Gluten', 'Alcohol', 'Sugar / sweets',
  'Processed food', 'Caffeine', 'Fried food', 'Nightshades', 'Artificial sweeteners'
];

/* Coping/self-management practices offered as one-tap chips in the check-in.
   Aligned with book modules so "what helps" findings map back to chapters. */
export const PRACTICES = [
  'Pacing', 'Breathing exercise', 'Stretching', 'Walking',
  'Meditation / relaxation', 'Heat or ice', 'Workbook exercise', 'Gentle exercise'
];

export function getRecentFoods(entries, limit = 12) {
  const seen = new Set();
  const out = [];
  (entries || [])
    .filter(e => e.date)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach(e => {
      (e.foods || []).forEach(f => {
        const key = String(f).trim().toLowerCase();
        if (key && !seen.has(key)) {
          seen.add(key);
          out.push(String(f).trim());
        }
      });
    });
  return out.slice(0, limit);
}

/**
 * Generic factor-impact engine shared by the food diary (looking for factors
 * that make symptoms WORSE) and practice tracking (factors that make them
 * BETTER). For each factor present on 3+ logged days, compares average burden
 * on exposure days — and the day after — against the rest, and keeps the
 * stronger window.
 */
function analyzeFactorImpact(entries, listKey) {
  const sorted = validEntries(entries);
  const withFactor = sorted.filter(e => Array.isArray(e[listKey]) && e[listKey].length > 0);
  const daysLogged = withFactor.length;

  if (daysLogged < 4 || sorted.length < 6) {
    return { ready: false, daysLogged, results: [] };
  }

  const byDate = new Map(sorted.map(e => [e.date, e]));
  const allDates = sorted.map(e => e.date);

  const prevKey = (iso) => {
    const d = new Date(iso + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const factors = new Map();
  withFactor.forEach(e => {
    e[listKey].forEach(raw => {
      const key = String(raw).trim().toLowerCase();
      if (!key) return;
      if (!factors.has(key)) factors.set(key, { display: String(raw).trim(), dates: new Set() });
      factors.get(key).dates.add(e.date);
    });
  });

  const results = [];
  factors.forEach((info) => {
    if (info.dates.size < 3) return;

    const expSame = [], nonSame = [];
    allDates.forEach(d => {
      (info.dates.has(d) ? expSame : nonSame).push(entryBurden(byDate.get(d)));
    });

    const expNext = [], nonNext = [];
    allDates.forEach(d => {
      (info.dates.has(prevKey(d)) ? expNext : nonNext).push(entryBurden(byDate.get(d)));
    });

    const evalWindow = (exp, non) => {
      const ea = avg(exp), na = avg(non);
      if (ea === null || na === null || exp.length < 3 || non.length < 2) return null;
      return { delta: ea - na, expAvg: ea, nonAvg: na };
    };

    const same = evalWindow(expSame, nonSame);
    const next = evalWindow(expNext, nonNext);
    if (!same && !next) return;

    // Keep the window with the larger absolute effect, so both harmful
    // (positive delta) and helpful (negative delta) signals surface.
    let best = same, windowLabel = 'same day';
    if (next && (!same || Math.abs(next.delta) > Math.abs(same.delta))) {
      best = next; windowLabel = 'day after';
    }

    results.push({
      name: info.display,
      timesDone: info.dates.size,
      window: windowLabel,
      delta: best.delta,
      expAvg: best.expAvg,
      nonAvg: best.nonAvg,
    });
  });

  return { ready: true, daysLogged, results };
}

export function analyzeFoodTriggers(entries) {
  const out = analyzeFactorImpact(entries, 'foods');
  // Sorted worst-first; delta > 0 means burden higher around this food.
  const results = out.results
    .map(r => ({ food: r.name, timesEaten: r.timesDone, window: r.window, delta: r.delta, expAvg: r.expAvg, nonAvg: r.nonAvg }))
    .sort((a, b) => b.delta - a.delta);
  return { ...out, results };
}

export function analyzePractices(entries) {
  const out = analyzeFactorImpact(entries, 'practices');
  // benefit > 0 means burden was LOWER around this practice (it seems to help).
  const results = out.results
    .map(r => ({ practice: r.name, timesDone: r.timesDone, window: r.window, benefit: -r.delta, expAvg: r.expAvg, nonAvg: r.nonAvg }))
    .sort((a, b) => b.benefit - a.benefit);
  return { ...out, results };
}

/* ============================================================
   "Suggested for You" — connects today's state to the book.
   Each suggestion links a dashboard signal to the matching
   workbook module or in-app coping tool, making the app the
   book's practice companion.
   ============================================================ */

const NEGATIVE_MOOD_HINTS = [
  'sad', 'anxious', 'anxiety', 'frustrat', 'depress', 'down', 'angry',
  'hopeless', 'overwhelm', 'stress', 'worried', 'scared', 'irritab', 'low', 'tearful'
];

export function getSuggestions(entries) {
  const dash = computeDashboard(entries);
  if (!dash) return [];
  const { latest } = dash;
  const pain = toNum(latest.pain);
  const fatigue = toNum(latest.fatigue);
  const sleep = toNum(latest.sleep);
  const mood = String(latest.mood || '').toLowerCase();
  const moodLow = NEGATIVE_MOOD_HINTS.some(h => mood.includes(h));

  const s = [];

  if (pain !== null && pain >= 6) {
    s.push({
      key: 'breathe',
      title: 'Calm your nervous system',
      desc: `Pain is running high (${pain}/10). A few minutes of guided breathing can turn down the alarm.`,
      to: '/coping-tools?tool=breathing',
      cta: 'Open Breathing Tool'
    });
    s.push({
      key: 'flare',
      title: 'Your Flare-Up Plan',
      desc: 'Module 25 walks you through the plan you built for days like this.',
      to: '/workbook?module=25',
      cta: 'Open Module 25'
    });
  }
  if (fatigue !== null && fatigue >= 6) {
    s.push({
      key: 'pacing',
      title: 'Pace, don\u2019t push',
      desc: `Fatigue is heavy today (${fatigue}/10). Module 17, The Art of Pacing and Planning, is built for this.`,
      to: '/workbook?module=17',
      cta: 'Open Module 17'
    });
  }
  if (sleep !== null && sleep <= 4) {
    s.push({
      key: 'sleep',
      title: 'Reclaim your nights',
      desc: `Sleep quality was ${sleep}/10. Module 15 covers rebuilding restorative sleep.`,
      to: '/workbook?module=15',
      cta: 'Open Module 15'
    });
  }
  if (moodLow) {
    s.push({
      key: 'mind',
      title: 'Steady your thoughts',
      desc: 'A tough emotional day. Module 14, Harnessing Your Mind\u2019s Power, has reframing tools that help.',
      to: '/workbook?module=14',
      cta: 'Open Module 14'
    });
  }

  const fa = analyzeFoodTriggers(entries);
  if (fa.ready && fa.results.some(r => r.delta >= 1)) {
    s.push({
      key: 'food',
      title: 'Food patterns spotted',
      desc: 'Your food diary is flagging possible triggers. Module 13, Fueling Your Body for Resilience, pairs well with it.',
      to: '/workbook?module=13',
      cta: 'Open Module 13'
    });
  }

  if (s.length === 0) {
    s.push({
      key: 'momentum',
      title: 'Keep the momentum',
      desc: 'A steadier stretch is the best time to build capacity. Module 12, Movement as Your Medicine, meets you where you are.',
      to: '/workbook?module=12',
      cta: 'Open Module 12'
    });
  }

  return s.slice(0, 3);
}
