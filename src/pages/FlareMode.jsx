/**
 * FlareMode — the screen for the moment users need the app most.
 *
 * One tap from Home does three things:
 *   1. Logs a flare event for today (deduped; undo offered) so flares
 *      become data — they excuse streak gaps and appear in visit prep.
 *   2. Surfaces the user's OWN flare plan — the Module 25 answers they
 *      wrote on a good day, read back to them on a bad one.
 *   3. Puts every relevant tool one tap away: breathing, pacing, their
 *      doctors' phone numbers, and the when-to-seek-care criteria.
 *
 * If Module 25 hasn't been filled in, the page becomes the reason to:
 * a clear CTA to build the plan now, plus sensible generic steps so the
 * user is never met with an empty screen mid-flare.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame, Wind, BookOpen, PhoneCall, Check, Undo2, HeartPulse,
  AlertCircle, ClipboardList, ChevronRight, Stethoscope
} from 'lucide-react';
import storage, { STORAGE_KEYS } from '../services/storage';

const todayStr = () => new Date().toISOString().split('T')[0];

/* Module 25 field map — labels shortened for a screen read under stress. */
const PLAN_FIELDS = [
  { id: 'm25_s1_q2', label: 'Your calming phrase', highlight: true },
  { id: 'm25_s1_q3', label: 'Your comfort tool kit' },
  { id: 'm25_s1_q4', label: 'Your pacing plan' },
  { id: 'm25_s1_q5', label: 'Contact your doctor if' },
  { id: 'm25_s1_q6', label: 'Your support system' },
];

const FlareMode = () => {
  const [flares, setFlares] = useState(null);        // null = loading
  const [plan, setPlan] = useState({});
  const [doctors, setDoctors] = useState([]);
  const [loggedNow, setLoggedNow] = useState(false); // this visit created today's entry

  useEffect(() => {
    (async () => {
      try {
        const [flareLog, workbook, health] = await Promise.all([
          storage.get(STORAGE_KEYS.FLARES),
          storage.get(STORAGE_KEYS.WORKBOOK),
          storage.get(STORAGE_KEYS.HEALTH_TOOLS),
        ]);

        const list = Array.isArray(flareLog) ? flareLog : [];
        // Auto-log today's flare on arrival — this page IS the flare button.
        if (!list.some(f => f.date === todayStr())) {
          const next = [{ date: todayStr(), ts: Date.now() }, ...list];
          await storage.set(STORAGE_KEYS.FLARES, next);
          setFlares(next);
          setLoggedNow(true);
        } else {
          setFlares(list);
        }

        if (workbook && typeof workbook === 'object') setPlan(workbook);
        setDoctors((health?.doctors || []).filter(d => d.name && d.phone));
      } catch (e) {
        console.error('Flare Mode load failed', e);
        setFlares([]);
      }
    })();
  }, []);

  const undoToday = async () => {
    const next = (flares || []).filter(f => f.date !== todayStr());
    await storage.set(STORAGE_KEYS.FLARES, next);
    setFlares(next);
    setLoggedNow(false);
  };

  // Captured once per mount — purity rule: no Date.now() during render.
  const [now] = useState(() => Date.now());

  const hasPlan = PLAN_FIELDS.some(f => (plan[f.id] || '').trim());
  const calmingPhrase = (plan['m25_s1_q2'] || '').trim();
  const recentFlareCount = (flares || []).filter(f => {
    const ts = Date.parse(f.date);
    return Number.isFinite(ts) && now - ts <= 30 * 86400000;
  }).length;

  if (flares === null) return null;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300 pb-12">
      {/* Header + logged confirmation */}
      <div className="bg-gradient-to-br from-primary-700 to-primary-900 text-white p-5 rounded-2xl shadow-md">
        <div className="flex items-center gap-2 mb-1">
          <Flame size={22} className="text-amber-300" />
          <h2 className="text-xl font-bold">Flare Mode</h2>
        </div>
        <p className="text-white/85 text-sm leading-relaxed">
          Rough stretch. That&apos;s okay — this is what you planned for. One step at a time.
        </p>
        <div className="mt-3 flex items-center justify-between bg-white/10 rounded-xl px-3 py-2">
          <span className="text-xs font-semibold flex items-center gap-1.5">
            <Check size={14} className="text-emerald-300" />
            {loggedNow ? 'Flare logged for today' : 'Today\u2019s flare already logged'}
          </span>
          <button
            onClick={undoToday}
            className="text-[11px] font-bold text-white/80 hover:text-white flex items-center gap-1"
          >
            <Undo2 size={12} /> Undo
          </button>
        </div>
      </div>

      {/* Calming phrase — the first thing they see, in their own words */}
      {calmingPhrase && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-2">You wrote this for today</p>
          <p className="text-lg font-bold text-amber-900 leading-snug">&ldquo;{calmingPhrase}&rdquo;</p>
        </div>
      )}

      {/* Immediate tools */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/coping-tools?tool=breathing"
          className="bg-white p-4 rounded-2xl border border-primary-100 flex flex-col items-center text-center shadow-sm hover:bg-primary-50 transition"
        >
          <Wind className="text-primary-600 mb-2" size={26} />
          <span className="text-sm font-bold text-primary-900">Breathe First</span>
          <span className="text-[11px] text-secondary-500 mt-0.5">2 minutes turns down the alarm</span>
        </Link>
        <Link
          to="/workbook?module=17"
          className="bg-white p-4 rounded-2xl border border-primary-100 flex flex-col items-center text-center shadow-sm hover:bg-primary-50 transition"
        >
          <BookOpen className="text-primary-600 mb-2" size={26} />
          <span className="text-sm font-bold text-primary-900">Pace, Don&apos;t Push</span>
          <span className="text-[11px] text-secondary-500 mt-0.5">Module 17 pacing guide</span>
        </Link>
      </div>

      {/* The user's own plan */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-secondary-100">
        <h3 className="font-bold text-secondary-900 mb-3 flex items-center gap-2">
          <ClipboardList size={18} className="text-primary-600" />
          Your Flare-Up Plan
        </h3>
        {hasPlan ? (
          <div className="space-y-3">
            {PLAN_FIELDS.filter(f => !f.highlight).map(f => {
              const v = (plan[f.id] || '').trim();
              if (!v) return null;
              return (
                <div key={f.id} className="bg-secondary-50 rounded-xl p-3 border border-secondary-100">
                  <p className="text-[10px] font-bold text-primary-700 uppercase tracking-wide mb-1">{f.label}</p>
                  <p className="text-sm text-secondary-800 whitespace-pre-wrap leading-relaxed">{v}</p>
                </div>
              );
            })}
            <Link
              to="/workbook?module=25"
              className="text-xs font-bold text-primary-700 inline-flex items-center gap-0.5 mt-1"
            >
              Edit your plan in Module 25 <ChevronRight size={13} />
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-sm text-secondary-600 leading-relaxed mb-3">
              You haven&apos;t built your personal flare plan yet. On a better day, Module 25 walks you
              through it — then this screen reads it back to you when you need it. For right now:
            </p>
            <ul className="text-sm text-secondary-700 space-y-2 list-disc pl-5 mb-4">
              <li>Slow your breathing — the tool above guides you.</li>
              <li>Drop non-essential plans for today without guilt. Rest is the treatment.</li>
              <li>Use what usually comforts you: heat, ice, gentle position changes.</li>
              <li>Tell one person you trust that today is a flare day.</li>
            </ul>
            <Link
              to="/workbook?module=25"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition-colors"
            >
              Build My Flare Plan (Module 25)
            </Link>
          </div>
        )}
      </div>

      {/* Call your doctor — pulled from Health Tools */}
      {doctors.length > 0 && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-secondary-100">
          <h3 className="font-bold text-secondary-900 mb-3 flex items-center gap-2">
            <Stethoscope size={18} className="text-primary-600" />
            Call Your Care Team
          </h3>
          <div className="space-y-2">
            {doctors.map((d, i) => (
              <a
                key={i}
                href={`tel:${d.phone.replace(/[^\d+]/g, '')}`}
                className="flex items-center justify-between bg-primary-50 border border-primary-100 rounded-xl px-4 py-3 hover:bg-primary-100 transition"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-primary-900 truncate">{d.name}</p>
                  {d.specialty && <p className="text-[11px] text-secondary-500">{d.specialty}</p>}
                </div>
                <span className="flex items-center gap-1.5 text-primary-700 font-bold text-xs shrink-0 ml-3">
                  <PhoneCall size={14} /> Call
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* When to seek care */}
      <div className="bg-purple-50/60 p-5 rounded-2xl border border-purple-200 shadow-sm">
        <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
          <AlertCircle size={18} />
          Is This More Than a Flare?
        </h3>
        <div className="space-y-3 text-sm text-purple-900">
          <div>
            <strong className="block mb-1 text-purple-950">Call 911 / go to the ER if:</strong>
            <ul className="list-disc pl-5 space-y-1">
              <li>Sudden loss of bowel or bladder control.</li>
              <li>Sudden severe weakness or numbness in arms or legs.</li>
              <li>Chest pain, difficulty breathing, or signs of a stroke.</li>
            </ul>
          </div>
          <div>
            <strong className="block mb-1 text-purple-950">Call your doctor today if:</strong>
            <ul className="list-disc pl-5 space-y-1">
              <li>This flare feels significantly different from your usual pattern.</li>
              <li>Any red flag you listed in your own plan above has appeared.</li>
            </ul>
          </div>
        </div>
        <Link to="/emergency" className="text-xs font-bold text-purple-700 inline-flex items-center gap-0.5 mt-3">
          Full emergency guidance <ChevronRight size={13} />
        </Link>
      </div>

      {/* Gentle context — flares as data, not failure */}
      <div className="bg-white p-4 rounded-2xl border border-secondary-100 shadow-sm flex items-start gap-3">
        <HeartPulse size={18} className="text-primary-600 shrink-0 mt-0.5" />
        <p className="text-xs text-secondary-600 leading-relaxed">
          {recentFlareCount <= 1
            ? 'This flare is now part of your record — it will show in your visit prep and never counts against your check-in streak.'
            : `${recentFlareCount} flare days logged in the last 30 days. That pattern is exactly what your doctor needs to see — it\u2019s in your visit prep automatically.`}
        </p>
      </div>
    </div>
  );
};

export default FlareMode;
