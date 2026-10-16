/**
 * DailyCheckin — the two 10-second habits on Home.
 *
 *   1. Energy check-in: "What's your battery today?" Low / Steady / High,
 *      answered with that day's pacing template plus the person's own
 *      Module 17 baseline and weekday plan when they've written them.
 *      A High day carries the boom-bust guardrail: bank 20% for tomorrow.
 *   2. Tiny wins: one-tap, values-based actions (ACT). Progress measured
 *      by living well with pain, not by pain scores.
 *
 * Free for everyone and stored only on the device.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BatteryLow, BatteryMedium, BatteryFull, Sparkles, Plus, X, ChevronRight, Flame } from 'lucide-react';
import storage, { STORAGE_KEYS } from '../services/storage';
import {
  getDaily, setEnergy, toggleWin, addCustomWin, removeCustomWin, winsThisWeek,
  localDateStr, ENERGY_LEVELS, DEFAULT_WINS,
} from '../services/daily';

const ENERGY_ICONS = { low: BatteryLow, steady: BatteryMedium, high: BatteryFull };

// Module 17 weekday plan fields: m17_w1 = Monday … m17_w7 = Sunday.
const weekdayField = (d) => `m17_w${d.getDay() === 0 ? 7 : d.getDay()}`;

const DailyCheckin = () => {
  const [today] = useState(() => localDateStr());
  const [daily, setDaily] = useState(null);
  const [workbook, setWorkbook] = useState({});
  const [changing, setChanging] = useState(false);
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    Promise.all([getDaily(), storage.get(STORAGE_KEYS.WORKBOOK)])
      .then(([d, wb]) => {
        setDaily(d);
        if (wb && typeof wb === 'object') setWorkbook(wb);
      })
      .catch(() => setDaily({ days: {}, customWins: [], lastGoodDayNudge: null }));
  }, []);

  if (!daily) return null;

  const day = daily.days[today] || {};
  const energy = changing ? null : day.energy;
  const level = energy ? ENERGY_LEVELS[energy] : null;
  const wins = day.wins || [];
  const allWins = [...DEFAULT_WINS, ...daily.customWins.map(w => ({ ...w, custom: true }))];
  const weekCount = winsThisWeek(daily);

  const baseline = (workbook.m17_s1_q3 || '').trim();
  const baselineActivity = (workbook.m17_s1_q1 || '').trim();
  const todaysPlan = (workbook[weekdayField(new Date())] || '').trim();

  const chooseEnergy = async (id) => {
    setChanging(false);
    setDaily(await setEnergy(today, id));
  };

  const onToggleWin = async (id) => setDaily(await toggleWin(today, id));

  const onAddWin = async () => {
    const label = draft.trim();
    if (!label) return;
    setDraft('');
    setAdding(false);
    setDaily(await addCustomWin(label));
  };

  return (
    <>
      {/* ── Energy check-in ── */}
      <section className="bg-white p-5 rounded-2xl shadow-sm border border-secondary-100">
        {!level ? (
          <>
            <h3 className="font-bold text-primary-900 text-base mb-1">What&apos;s your battery today?</h3>
            <p className="text-xs text-secondary-500 mb-3">One tap. You&apos;ll get a pacing plan for today.</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(ENERGY_LEVELS).map(([id, l]) => {
                const Icon = ENERGY_ICONS[id];
                return (
                  <button
                    key={id}
                    onClick={() => chooseEnergy(id)}
                    className="flex flex-col items-center gap-1 py-3 rounded-xl border border-primary-100 bg-primary-50 hover:bg-primary-100 transition text-primary-800"
                  >
                    <Icon size={24} />
                    <span className="text-sm font-bold">{l.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-bold text-primary-900 text-base flex items-center gap-2">
                {(() => { const Icon = ENERGY_ICONS[energy]; return <Icon size={20} className="text-primary-600" />; })()}
                {level.title}
              </h3>
              <button onClick={() => setChanging(true)} className="text-xs font-bold text-primary-700 shrink-0">Change</button>
            </div>
            <ul className="space-y-1.5 text-sm text-secondary-700 list-disc pl-5">
              {level.steps.map(s => <li key={s}>{s}</li>)}
            </ul>
            {(baseline || todaysPlan) && (
              <div className="mt-3 bg-primary-50 border border-primary-100 rounded-xl p-3 space-y-1.5">
                <p className="text-[10px] font-bold text-primary-700 uppercase tracking-wide">From your pacing plan</p>
                {baseline && (
                  <p className="text-sm text-secondary-800">
                    Your baseline{baselineActivity ? ` for ${baselineActivity}` : ''}: <span className="font-semibold">{baseline}</span>
                  </p>
                )}
                {todaysPlan && <p className="text-sm text-secondary-800 whitespace-pre-wrap">Today: {todaysPlan}</p>}
              </div>
            )}
            {energy === 'low' && (
              <Link to="/flare" className="mt-3 text-xs font-bold text-orange-700 inline-flex items-center gap-1">
                <Flame size={13} /> Feels like a flare? Open Flare Mode <ChevronRight size={13} />
              </Link>
            )}
            {!baseline && !todaysPlan && (
              <Link to="/workbook?module=17" className="mt-3 text-xs font-bold text-primary-700 inline-flex items-center gap-0.5">
                Find your own baseline in Module 17 <ChevronRight size={13} />
              </Link>
            )}
          </>
        )}
      </section>

      {/* ── Tiny wins ── */}
      <section className="bg-white p-5 rounded-2xl shadow-sm border border-secondary-100">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="font-bold text-primary-900 text-base flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" /> Tiny wins today
          </h3>
          {weekCount > 0 && (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5 shrink-0">
              {weekCount} this week
            </span>
          )}
        </div>
        <p className="text-xs text-secondary-500 mb-3">Small steps toward what matters to you, even with pain.</p>
        <div className="flex flex-wrap gap-2">
          {allWins.map(w => {
            const on = wins.includes(w.id);
            const { custom } = w;
            return (
              <span key={w.id} className="inline-flex">
                <button
                  onClick={() => onToggleWin(w.id)}
                  aria-pressed={on}
                  className={`px-3 py-1.5 text-xs font-semibold border transition-colors ${custom ? 'rounded-l-full' : 'rounded-full'} ${
                    on ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-secondary-200 text-secondary-700 hover:border-primary-300'
                  }`}
                >
                  {on ? '✓ ' : ''}{w.label}
                </button>
                {custom && (
                  <button
                    onClick={async () => setDaily(await removeCustomWin(w.id))}
                    aria-label={`Remove ${w.label}`}
                    className={`px-2 rounded-r-full border border-l-0 ${on ? 'bg-emerald-600 border-emerald-600 text-white/80' : 'bg-white border-secondary-200 text-secondary-400'}`}
                  >
                    <X size={12} />
                  </button>
                )}
              </span>
            );
          })}
          {adding ? (
            <span className="inline-flex gap-1">
              <input
                autoFocus
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') onAddWin(); }}
                placeholder="e.g. Called my sister"
                maxLength={60}
                className="border border-secondary-200 rounded-full px-3 py-1 text-xs outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button onClick={onAddWin} className="px-3 py-1 rounded-full bg-primary-600 text-white text-xs font-bold">Add</button>
            </span>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border border-dashed border-primary-300 text-primary-700 inline-flex items-center gap-1"
            >
              <Plus size={12} /> Your own
            </button>
          )}
        </div>
      </section>
    </>
  );
};

export default DailyCheckin;
