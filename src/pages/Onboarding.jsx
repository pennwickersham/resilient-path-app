/**
 * Onboarding — a 60-second guided start.
 *
 * New users currently land on a paywall and a module list. This flow
 * gives day one a shape: who you are, what you want, when to check in.
 * Three steps, every one skippable, nothing gated behind it.
 *
 * Answers land in STORAGE_KEYS.PROFILE:
 *   { onboarded: true, condition, goal, completedAt }
 * The condition/goal feed the chatbot's personal context (with consent)
 * and let the app speak to the user's actual situation.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Check, Bell, Heart, Target, Loader2 } from 'lucide-react';
import storage, { STORAGE_KEYS } from '../services/storage';
import { enableReminder, isReminderSupported } from '../services/reminders';

const CONDITIONS = [
  'Fibromyalgia', 'Arthritis / joint pain', 'Back or neck pain', 'Autoimmune condition',
  'Migraine / headache', 'Nerve pain', 'Multiple conditions', 'Something else',
];

const GOALS = [
  { id: 'impact', label: 'Reduce pain\u2019s grip on my life' },
  { id: 'patterns', label: 'Understand my patterns and triggers' },
  { id: 'sleep', label: 'Sleep better' },
  { id: 'appointments', label: 'Get more out of my doctor visits' },
  { id: 'emotional', label: 'Cope better emotionally' },
];

const Dots = ({ step }) => (
  <div className="flex justify-center gap-1.5 mb-6">
    {[0, 1, 2].map(i => (
      <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary-600' : 'w-1.5 bg-secondary-200'}`} />
    ))}
  </div>
);

const Chip = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all text-left ${
      active
        ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
        : 'bg-white text-secondary-700 border-secondary-200 hover:border-primary-300'
    }`}
  >
    {active && <Check size={13} className="inline mr-1.5 -mt-0.5" />}
    {children}
  </button>
);

const HOURS = [
  { label: 'Morning (8:00 AM)', hour: 8 },
  { label: 'Midday (12:00 PM)', hour: 12 },
  { label: 'Evening (7:00 PM)', hour: 19 },
  { label: 'Night (9:00 PM)', hour: 21 },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [condition, setCondition] = useState('');
  const [goal, setGoal] = useState('');
  const [reminderHour, setReminderHour] = useState(19);
  const [wantsReminder, setWantsReminder] = useState(true);
  const [saving, setSaving] = useState(false);

  const finish = async ({ skipped = false } = {}) => {
    setSaving(true);
    try {
      await storage.set(STORAGE_KEYS.PROFILE, {
        onboarded: true,
        skipped,
        condition: condition || null,
        goal: goal || null,
        completedAt: new Date().toISOString(),
      });
      if (!skipped && wantsReminder && isReminderSupported()) {
        // Permission prompt appears here, attached to a choice the user
        // just made — the moment it's most likely to be granted.
        await enableReminder(reminderHour, 0);
      }
    } catch (e) {
      console.error('Onboarding save failed', e);
    }
    navigate('/', { replace: true });
  };


  return (
    <div className="min-h-screen bg-secondary-50 flex flex-col max-w-3xl mx-auto">
      <div
        className="flex-1 flex flex-col p-6 pb-8"
        style={{ paddingTop: 'calc(2rem + env(safe-area-inset-top))' }}
      >
        <Dots step={step} />

        {/* ── Step 1: condition ── */}
        {step === 0 && (
          <div className="flex-1 flex flex-col animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
              <Heart size={28} />
            </div>
            <h2 className="text-2xl font-black text-primary-900 leading-tight mb-2">
              Welcome to your Resilient Path
            </h2>
            <p className="text-secondary-600 text-sm leading-relaxed mb-6">
              A minute of setup makes everything here fit you better. What brings you to the program?
            </p>
            <div className="flex flex-col gap-2">
              {CONDITIONS.map(c => (
                <Chip key={c} active={condition === c} onClick={() => setCondition(c)}>{c}</Chip>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: goal ── */}
        {step === 1 && (
          <div className="flex-1 flex flex-col animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
              <Target size={28} />
            </div>
            <h2 className="text-2xl font-black text-primary-900 leading-tight mb-2">
              What matters most right now?
            </h2>
            <p className="text-secondary-600 text-sm leading-relaxed mb-6">
              The whole program is yours — this just helps the app point you at the right starting places.
            </p>
            <div className="flex flex-col gap-2">
              {GOALS.map(g => (
                <Chip key={g.id} active={goal === g.id} onClick={() => setGoal(g.id)}>{g.label}</Chip>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: reminder ── */}
        {step === 2 && (
          <div className="flex-1 flex flex-col animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
              <Bell size={28} />
            </div>
            <h2 className="text-2xl font-black text-primary-900 leading-tight mb-2">
              A daily 30-second check-in
            </h2>
            <p className="text-secondary-600 text-sm leading-relaxed mb-6">
              Tracking is what turns this app into evidence — patterns, triggers, and proof of what helps.
              A gentle daily nudge makes it stick. No streak guilt, ever.
            </p>
            <div className="flex flex-col gap-2 mb-4">
              {HOURS.map(h => (
                <Chip
                  key={h.hour}
                  active={wantsReminder && reminderHour === h.hour}
                  onClick={() => { setWantsReminder(true); setReminderHour(h.hour); }}
                >
                  {h.label}
                </Chip>
              ))}
              <Chip active={!wantsReminder} onClick={() => setWantsReminder(false)}>
                No reminder for now
              </Chip>
            </div>
            {!isReminderSupported() && wantsReminder && (
              <p className="text-[11px] text-secondary-400 leading-snug">
                Reminders work in the mobile app — your choice is saved for when you&apos;re there.
              </p>
            )}
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="mt-6 flex flex-col gap-2">
          <button
            disabled={saving}
            onClick={() => (step < 2 ? setStep(step + 1) : finish())}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-base transition-colors shadow-md disabled:opacity-60"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : step < 2 ? (<>Continue <ChevronRight size={18} /></>) : 'Start My Path'}
          </button>
          <button
            disabled={saving}
            onClick={() => finish({ skipped: true })}
            className="w-full py-2 text-sm font-semibold text-secondary-400 hover:text-secondary-600 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
