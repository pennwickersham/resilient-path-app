import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import {
  isReminderSupported, getReminderPref, enableReminder, disableReminder
} from '../services/reminders';

const pad = (n) => String(n).padStart(2, '0');

/**
 * Gentle daily check-in reminder toggle. Self-contained: loads and saves its
 * own preference, schedules/cancels the native notification. On plain web it
 * explains that reminders live in the mobile app.
 */
export default function ReminderCard() {
  const [loadingPref, setLoadingPref] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState('19:00');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      const pref = await getReminderPref();
      setEnabled(pref.enabled);
      setTime(`${pad(pref.hour)}:${pad(pref.minute)}`);
      setLoadingPref(false);
    })();
  }, []);

  const flash = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 4000);
  };

  const apply = async (nextEnabled, nextTime) => {
    const [h, m] = nextTime.split(':').map(v => parseInt(v, 10));
    if (nextEnabled) {
      const res = await enableReminder(h, m);
      if (res.ok) {
        setEnabled(true);
        flash(`Daily reminder set for ${nextTime}.`);
      } else if (res.reason === 'permission') {
        setEnabled(false);
        flash('Notifications are blocked for this app — you can allow them in your phone\u2019s Settings.');
      } else {
        setEnabled(false);
        flash('Couldn\u2019t set the reminder — please try again.');
      }
    } else {
      await disableReminder();
      setEnabled(false);
      flash('Reminder turned off.');
    }
  };

  if (loadingPref) return null;

  if (!isReminderSupported()) {
    return (
      <div className="bg-white rounded-xl border border-secondary-100 p-4 shadow-sm flex items-center gap-3">
        <Bell size={18} className="text-secondary-300 shrink-0" />
        <p className="text-xs text-secondary-500 leading-relaxed">
          Daily check-in reminders are available in the Resilient Path mobile app.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-secondary-100 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {enabled ? <Bell size={18} className="text-primary-600 shrink-0" /> : <BellOff size={18} className="text-secondary-300 shrink-0" />}
          <div className="min-w-0">
            <p className="text-sm font-bold text-secondary-900 leading-tight">Daily check-in reminder</p>
            <p className="text-[11px] text-secondary-500 leading-snug">A gentle nudge — never a guilt trip. Missed days are just days.</p>
          </div>
        </div>
        {/* Toggle */}
        <button
          role="switch"
          aria-checked={enabled}
          onClick={() => apply(!enabled, time)}
          className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${enabled ? 'bg-primary-600' : 'bg-secondary-200'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${enabled ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
      </div>
      {enabled && (
        <div className="flex items-center gap-2 mt-3">
          <label className="text-xs font-semibold text-secondary-500">Remind me at</label>
          <input
            type="time"
            value={time}
            onChange={(e) => {
              setTime(e.target.value);
              apply(true, e.target.value);
            }}
            className="text-sm border border-secondary-200 rounded-lg px-2 py-1 text-secondary-700 bg-white"
          />
        </div>
      )}
      {msg && <p className="text-xs font-semibold text-primary-700 mt-2">{msg}</p>}
    </div>
  );
}
