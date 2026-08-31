import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Check, ChevronRight, BookOpen, Sparkles, Flame } from 'lucide-react';
import { computeStreak } from '../services/streaks';
import {
  computeDashboard, analyzeFoodTriggers, analyzePractices, getSuggestions, statusFromWellness, toNum
} from '../services/symptomAnalysis';

/* Tone → Tailwind colors (default palette; teal is the app primary) */
const TONES = {
  good: { text: 'text-emerald-600', ring: '#059669', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  mid: { text: 'text-amber-600', ring: '#d97706', bg: 'bg-amber-50', border: 'border-amber-200' },
  hard: { text: 'text-red-600', ring: '#dc2626', bg: 'bg-red-50', border: 'border-red-200' },
};

const METRICS = [
  { key: 'pain', label: 'Pain', stroke: '#dc2626', betterWhen: 'down' },
  { key: 'fatigue', label: 'Fatigue', stroke: '#d97706', betterWhen: 'down' },
  { key: 'sleep', label: 'Sleep', stroke: '#059669', betterWhen: 'up' },
];

const todayStr = () => new Date().toISOString().split('T')[0];

const friendlyDate = (iso) => {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const y = new Date(t); y.setDate(y.getDate() - 1);
  if (iso === t.toISOString().split('T')[0]) return 'Today';
  if (iso === y.toISOString().split('T')[0]) return 'Yesterday';
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

function StatusRing({ pct, color, size = 140 }) {
  const stroke = 11;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = c * (Math.max(0, Math.min(100, pct)) / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${filled} ${c - filled}`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </svg>
  );
}

/** Multi-metric trend chart over the last 30 valid entries (inline SVG). */
function TrendChart({ entries, medications = [] }) {
  const points = entries
    .map(e => ({ ts: Date.parse(e.date), pain: toNum(e.pain), fatigue: toNum(e.fatigue), sleep: toNum(e.sleep) }))
    .filter(p => Number.isFinite(p.ts))
    .sort((a, b) => a.ts - b.ts)
    .slice(-30);

  if (points.length < 2) {
    return (
      <p className="text-xs text-secondary-500">
        Log a few more days to unlock your trend chart.
      </p>
    );
  }

  const W = 320, H = 120, PAD = 8;
  const t0 = points[0].ts, t1 = points[points.length - 1].ts;
  const x = (ts) => PAD + ((ts - t0) / Math.max(1, t1 - t0)) * (W - 2 * PAD);
  const y = (v) => H - PAD - (v / 10) * (H - 2 * PAD);

  const path = (key) => {
    const pts = points.filter(p => p[key] !== null);
    if (pts.length < 2) return null;
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.ts).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ');
  };

  const fmtDate = (ts) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <div>
      <div className="flex items-center justify-end gap-2 mb-1">
        {METRICS.map(m => (
          <span key={m.key} className="flex items-center gap-1 text-[10px] font-semibold text-secondary-500">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: m.stroke }} /> {m.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Symptom trends chart">
        {[0, 5, 10].map(v => (
          <g key={v}>
            <line x1={PAD} x2={W - PAD} y1={y(v)} y2={y(v)} stroke="#e2e8f0" strokeWidth="1" />
            <text x={W - PAD} y={y(v) - 2} fontSize="7" fill="#94a3b8" textAnchor="end">{v}</text>
          </g>
        ))}
        {METRICS.map(m => {
          const d = path(m.key);
          return d ? <path key={m.key} d={d} fill="none" stroke={m.stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" /> : null;
        })}
        {/* Medication start markers — links treatment changes to what the
            symptoms did next, which is the question every follow-up visit
            is actually about. */}
        {medications
          .filter(m => m.name && m.startDate && /^\d{4}-\d{2}-\d{2}$/.test(m.startDate))
          .map(m => ({ name: m.name, ts: Date.parse(m.startDate) }))
          .filter(m => Number.isFinite(m.ts) && m.ts >= t0 && m.ts <= t1)
          .map((m, i) => (
            <g key={`${m.name}-${i}`}>
              <line x1={x(m.ts)} x2={x(m.ts)} y1={PAD} y2={H - PAD} stroke="#0d9488" strokeWidth="1" strokeDasharray="3,2" />
              <text
                x={Math.min(x(m.ts) + 2, W - 40)} y={PAD + 7 + (i % 2) * 8}
                fontSize="6.5" fill="#0d9488" fontWeight="bold"
              >
                {m.name.slice(0, 14)} ▸
              </text>
            </g>
          ))}
      </svg>
      <div className="flex justify-between text-[9px] text-secondary-400 px-1">
        <span>{fmtDate(t0)}</span><span>{fmtDate(t1)}</span>
      </div>
    </div>
  );
}

/** "Pain avg 5.2 (down 0.8 vs prior week)" — the payoff that makes logging worth it. */
function WeeklySummary({ entries }) {
  // Reference timestamp captured once per mount (purity rule: no Date.now() in render)
  const [now] = useState(() => Date.now());
  const { items, count } = useMemo(() => {
    const DAY = 86400000;
    const parsed = entries
      .map(e => ({ ...e, ts: Date.parse(e.date) }))
      .filter(e => Number.isFinite(e.ts));
    const thisWeek = parsed.filter(e => now - e.ts <= 7 * DAY);
    const lastWeek = parsed.filter(e => now - e.ts > 7 * DAY && now - e.ts <= 14 * DAY);
    if (thisWeek.length === 0) return { items: [], count: 0 };

    const avgOf = (list, key) => {
      const xs = list.map(e => toNum(e[key])).filter(v => v !== null);
      return xs.length ? xs.reduce((a, v) => a + v, 0) / xs.length : null;
    };

    const its = METRICS.map(m => {
      const cur = avgOf(thisWeek, m.key);
      if (cur === null) return null;
      const prev = avgOf(lastWeek, m.key);
      let delta = null, improving = false;
      if (prev !== null && Math.abs(cur - prev) >= 0.3) {
        delta = cur - prev;
        improving = (delta < 0 && m.betterWhen === 'down') || (delta > 0 && m.betterWhen === 'up');
      }
      return { ...m, cur, delta, improving };
    }).filter(Boolean);

    return { items: its, count: thisWeek.length };
  }, [entries, now]);

  if (!items.length) return null;

  return (
    <div className="bg-primary-50 rounded-xl border border-primary-100 p-3">
      <p className="text-xs font-bold text-primary-800 mb-1.5">This week ({count} {count === 1 ? 'entry' : 'entries'})</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {items.map(it => (
          <span key={it.key} className="text-xs text-primary-900">
            <span className="font-semibold">{it.label}:</span> {it.cur.toFixed(1)}
            {it.delta !== null && (
              <span className={`ml-1 font-semibold ${it.improving ? 'text-emerald-700' : 'text-secondary-500'}`}>
                ({it.delta > 0 ? '+' : ''}{it.delta.toFixed(1)} vs last week{it.improving ? ' ✓' : ''})
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Flare-tolerant streak — momentum without guilt. Grace days and logged
    flares keep the streak alive; only the truly abandoned streak resets. */
function StreakCard({ entries, flares }) {
  const streak = useMemo(() => computeStreak(entries, flares), [entries, flares]);
  if (streak.current < 2 && streak.best < 3) return null; // earn its place first
  return (
    <div className="bg-white rounded-xl border border-secondary-100 p-4 shadow-sm flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
        <Flame size={24} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold text-secondary-900 leading-tight">
          {streak.current}-day check-in streak
          {streak.best > streak.current && <span className="text-secondary-400 font-semibold"> · best {streak.best}</span>}
        </p>
        <p className="text-[11px] text-secondary-500 leading-snug mt-0.5">
          {streak.graceUsed > 0
            ? 'Grace days covered the gaps — flare days never break your streak.'
            : streak.activeToday
              ? 'Logged today. Every entry sharpens your patterns.'
              : 'Still alive — a check-in today keeps it going, but a missed day or two won\u2019t end it.'}
        </p>
      </div>
    </div>
  );
}

function SuggestedForYou({ entries }) {
  const navigate = useNavigate();
  const suggestions = useMemo(() => getSuggestions(entries), [entries]);
  if (!suggestions.length) return null;
  return (
    <div className="bg-white rounded-xl border border-secondary-100 p-4 shadow-sm">
      <p className="text-xs font-bold text-secondary-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <BookOpen size={13} className="text-primary-600" /> Suggested for You
      </p>
      <div className="space-y-2">
        {suggestions.map(s => (
          <button
            key={s.key}
            onClick={() => navigate(s.to)}
            className="w-full text-left p-3 rounded-xl bg-primary-50 border border-primary-100 hover:border-primary-300 transition-colors"
          >
            <p className="text-sm font-bold text-primary-800 leading-tight mb-0.5">{s.title}</p>
            <p className="text-xs text-secondary-600 leading-relaxed mb-1.5">{s.desc}</p>
            <span className="text-xs font-bold text-primary-700 inline-flex items-center gap-0.5">
              {s.cta} <ChevronRight size={13} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function WhatsHelping({ entries }) {
  const analysis = useMemo(() => analyzePractices(entries), [entries]);
  return (
    <div className="bg-white rounded-xl border border-secondary-100 p-4 shadow-sm">
      <p className="text-xs font-bold text-secondary-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <Sparkles size={13} className="text-emerald-600" /> What&apos;s Helping
      </p>
      {!analysis.ready ? (
        <p className="text-xs text-secondary-500 leading-relaxed">
          Tag the skills you practice in your daily check-in (pacing, breathing, stretching...) and this card will show which ones line up with better days — your own evidence for what works.
          {analysis.daysLogged > 0 && (
            <span className="text-secondary-400"> Practices logged on {analysis.daysLogged} day{analysis.daysLogged === 1 ? '' : 's'} so far — patterns appear after 4+.</span>
          )}
        </p>
      ) : (() => {
        const helpers = analysis.results.filter(r => r.benefit >= 1);
        return helpers.length === 0 ? (
          <p className="text-xs text-secondary-500 leading-relaxed">
            No clear winner yet — keep tagging your practices. Even mixed results are useful information for you and your care team.
          </p>
        ) : (
          <div>
            <p className="text-xs text-secondary-500 mb-2">Your better days line up with these practices:</p>
            {helpers.slice(0, 4).map(r => (
              <div key={r.practice} className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 mb-2">
                <CheckCircle size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-emerald-700 leading-tight">{r.practice}</p>
                  <p className="text-xs text-secondary-600 leading-relaxed">
                    Symptom burden averaged <b>{r.benefit.toFixed(1)} points lower</b> ({r.window}) on days you practiced this · {r.timesDone} logged days
                  </p>
                </div>
              </div>
            ))}
            <p className="text-[10px] text-secondary-400 leading-relaxed mt-1">
              Patterns from your own logs — encouraging, but keep doing what your care team recommends.
            </p>
          </div>
        );
      })()}
    </div>
  );
}

function FoodPatterns({ entries, onLogToday }) {
  const analysis = useMemo(() => analyzeFoodTriggers(entries), [entries]);

  return (
    <div className="bg-white rounded-xl border border-secondary-100 p-4 shadow-sm">
      <p className="text-xs font-bold text-secondary-700 uppercase tracking-wide mb-2">Food &amp; Flare Patterns</p>
      {!analysis.ready ? (
        <div>
          <p className="text-xs text-secondary-500 leading-relaxed mb-2">
            Add the foods you eat to your daily check-in and this card will compare your symptoms on days you ate each food (and the day after) against days you didn't — flagging possible flare triggers.
          </p>
          <p className="text-xs text-secondary-400 mb-3">
            {analysis.daysLogged === 0
              ? 'No foods logged yet.'
              : `Foods logged on ${analysis.daysLogged} day${analysis.daysLogged === 1 ? '' : 's'} so far — patterns appear after 4+ days of food logging.`}
          </p>
          <button
            onClick={onLogToday}
            className="w-full py-2.5 rounded-xl border border-primary-200 text-primary-700 bg-primary-50 hover:bg-primary-100 font-semibold text-sm transition-colors"
          >
            Start Your Food Diary
          </button>
        </div>
      ) : (() => {
        const suspects = analysis.results.filter(r => r.delta >= 1);
        const cleared = analysis.results.filter(r => r.delta <= -1);
        return (
          <div>
            {suspects.length === 0 ? (
              <p className="text-xs text-secondary-500 leading-relaxed">
                No food stands out as a flare trigger yet. Keep logging — patterns get clearer with more days of data.
              </p>
            ) : (
              <>
                <p className="text-xs text-secondary-500 mb-2">Your symptoms tend to run higher around these foods:</p>
                {suspects.slice(0, 4).map(r => (
                  <div key={r.food} className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 mb-2">
                    <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-amber-700 leading-tight">{r.food}</p>
                      <p className="text-xs text-secondary-600 leading-relaxed">
                        Symptom burden averaged <b>{r.expAvg.toFixed(1)}</b> the {r.window} vs <b>{r.nonAvg.toFixed(1)}</b> otherwise · eaten on {r.timesEaten} logged days
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}
            {cleared.length > 0 && (
              <p className="text-xs text-secondary-600 mt-1 flex items-start gap-1">
                <CheckCircle size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><b className="text-emerald-700">Looking fine so far:</b> {cleared.slice(0, 4).map(r => r.food).join(', ')}</span>
              </p>
            )}
            <p className="text-[10px] text-secondary-400 leading-relaxed mt-3">
              These are patterns in your own logs, not proof of cause. Discuss any suspected food triggers with your doctor or a dietitian before changing your diet.
            </p>
          </div>
        );
      })()}
    </div>
  );
}

/**
 * Dashboard-first view for the Symptom Tracker.
 * Props:
 *   entries      — raw symptoms array from HealthTools state
 *   onLogToday   — switch to the check-in sub-view
 *   onViewHistory — switch to the history sub-view
 */
export default function SymptomDashboard({ entries, medications = [], flares = [], onLogToday, onViewHistory }) {
  const dash = useMemo(() => computeDashboard(entries), [entries]);

  /* First-use onboarding */
  if (!dash) {
    return (
      <div className="bg-white rounded-xl border border-secondary-100 p-5 shadow-sm">
        <div className="text-center mb-4">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center">
            <Activity size={28} />
          </div>
          <h4 className="text-base font-bold text-secondary-900 mb-1">Welcome to your Tracker</h4>
          <p className="text-xs text-secondary-500">Here's how it works:</p>
        </div>
        {[
          ['1', 'Do a daily check-in', 'Tap your pain, fatigue, and sleep scores, and jot down what you ate — it takes under a minute. The check-in captures how you feel at a moment in time.'],
          ['2', 'Watch this Dashboard come to life', 'After a few entries, this screen shows your current status, weekly trends, and food-flare patterns — how you are doing over time.'],
          ['3', 'Share with your care team', 'Use the Share button any time to send your recent history to your doctor.'],
        ].map(([n, t, d]) => (
          <div key={n} className="flex items-start gap-3 mb-4">
            <div className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-extrabold shrink-0">{n}</div>
            <div>
              <p className="text-sm font-bold text-secondary-900 leading-tight mb-0.5">{t}</p>
              <p className="text-xs text-secondary-500 leading-relaxed">{d}</p>
            </div>
          </div>
        ))}
        <button
          onClick={onLogToday}
          className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition-colors shadow-sm"
        >
          Do Your First Check-in
        </button>
      </div>
    );
  }

  const status = statusFromWellness(dash.wellness);
  const tone = TONES[status.tone];
  const loggedToday = dash.sorted.some(e => e.date === todayStr());
  const improving = dash.weekDelta !== null && dash.weekDelta >= 0.5;
  const worsening = dash.weekDelta !== null && dash.weekDelta <= -0.5;

  return (
    <div className="space-y-4">
      {/* Current status ring */}
      <div className="bg-white rounded-xl border border-secondary-100 p-5 shadow-sm text-center">
        <p className="text-xs font-bold text-secondary-500 uppercase tracking-wide mb-3">
          Current Status · {friendlyDate(dash.latest.date)}
        </p>
        <div className="relative w-[140px] h-[140px] mx-auto mb-3">
          <StatusRing pct={dash.wellness} color={tone.ring} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-extrabold leading-none ${tone.text}`}>{dash.wellness}</span>
            <span className="text-[10px] font-semibold text-secondary-400">/ 100</span>
          </div>
        </div>
        <p className={`text-lg font-extrabold ${tone.text} mb-0.5`}>{status.label}</p>
        <p className="text-xs text-secondary-500 mb-2">{status.desc}</p>
        {dash.weekDelta !== null && (
          <p className={`text-xs font-bold inline-flex items-center gap-1 ${improving ? 'text-emerald-600' : worsening ? 'text-red-600' : 'text-secondary-400'}`}>
            {improving ? <TrendingUp size={13} /> : worsening ? <TrendingDown size={13} /> : null}
            {improving ? 'Improving vs last week' : worsening ? 'Harder than last week' : '— Steady vs last week'}
          </p>
        )}
        {!loggedToday && (
          <button
            onClick={onLogToday}
            className="mt-4 w-full py-2.5 rounded-xl border border-primary-200 text-primary-700 bg-primary-50 hover:bg-primary-100 font-semibold text-sm transition-colors"
          >
            You haven't checked in today — tap to log
          </button>
        )}
      </div>

      {/* Streak — flare-tolerant by design */}
      <StreakCard entries={entries} flares={flares} />

      {/* Book & tool suggestions matched to today's state */}
      <SuggestedForYou entries={entries} />

      {/* Weekly numeric summary */}
      <WeeklySummary entries={dash.sorted} />

      {/* Logging consistency */}
      <div className="bg-white rounded-xl border border-secondary-100 p-4 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-secondary-700 uppercase tracking-wide">This Week's Check-ins</span>
          <span className="text-xs font-extrabold text-primary-700">{dash.loggedCount}/7 days</span>
        </div>
        <div className="flex justify-between">
          {dash.weekDots.map(d => (
            <div key={d.key} className="text-center">
              <div className={`w-7 h-7 rounded-full mx-auto mb-1 flex items-center justify-center ${d.logged ? 'bg-primary-600' : 'bg-secondary-100'}`}>
                {d.logged && <Check size={14} className="text-white" />}
              </div>
              <span className="text-[9px] font-bold text-secondary-400 uppercase">
                {new Date(d.key + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'narrow' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Trend chart */}
      <div className="bg-white rounded-xl border border-secondary-100 p-4 shadow-sm">
        <p className="text-xs font-bold text-secondary-700 uppercase tracking-wide mb-2">Trends</p>
        <TrendChart entries={dash.sorted} medications={medications} />
      </div>

      {/* Food & flare patterns */}
      <FoodPatterns entries={entries} onLogToday={onLogToday} />

      {/* What's helping — the encouraging mirror image of triggers */}
      <WhatsHelping entries={entries} />

      {/* Latest check-in snapshot */}
      <div className="bg-white rounded-xl border border-secondary-100 p-4 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-secondary-700 uppercase tracking-wide">
            Latest Check-in · {friendlyDate(dash.latest.date)}
          </span>
          <button onClick={onViewHistory} className="text-xs font-bold text-primary-700 inline-flex items-center gap-0.5">
            Edit <ChevronRight size={13} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {METRICS.map(m => {
            const v = toNum(dash.latest[m.key]);
            if (v === null) return null;
            return (
              <div key={m.key} className="bg-secondary-50 border border-secondary-100 rounded-lg px-3 py-1.5 text-center min-w-[62px]">
                <p className="text-[10px] font-bold text-secondary-400 uppercase">{m.label}</p>
                <p className="text-base font-extrabold" style={{ color: m.stroke }}>{v}</p>
              </div>
            );
          })}
        </div>
        {dash.latest.foods && dash.latest.foods.length > 0 && (
          <p className="text-xs text-secondary-600 mb-1"><b className="text-secondary-900">Foods:</b> {dash.latest.foods.join(', ')}</p>
        )}
        {dash.latest.practices && dash.latest.practices.length > 0 && (
          <p className="text-xs text-secondary-600 mb-1"><b className="text-secondary-900">Practiced:</b> {dash.latest.practices.join(', ')}</p>
        )}
        {dash.latest.mood && (
          <p className="text-xs text-secondary-600 mb-1"><b className="text-secondary-900">Mood:</b> {dash.latest.mood}</p>
        )}
        {dash.latest.triggers && (
          <p className="text-xs text-secondary-600 mb-1"><b className="text-secondary-900">Triggers:</b> {dash.latest.triggers}</p>
        )}
        {dash.latest.notes && (
          <p className="text-xs text-secondary-600 bg-secondary-50 border-l-2 border-primary-500 rounded-r-lg px-3 py-2 mt-2 leading-relaxed">
            {dash.latest.notes}
          </p>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        <button
          onClick={onLogToday}
          className="flex-1 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition-colors shadow-sm"
        >
          {loggedToday ? "Update Today's Check-in" : "Do Today's Check-in"}
        </button>
        <button
          onClick={onViewHistory}
          className="flex-1 py-3 rounded-xl border border-secondary-200 text-secondary-700 bg-white hover:bg-secondary-50 font-bold text-sm transition-colors"
        >
          View History
        </button>
      </div>
    </div>
  );
}
