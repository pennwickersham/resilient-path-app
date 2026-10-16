/**
 * GoodDayNudge — the boom-bust guardrail after a good check-in.
 *
 * People rarely crash because of bad days; they crash after overdoing a
 * good one. Opt-in: the first good day asks whether they want these
 * reminders at all; after that it shows at most once a day, and can be
 * turned off here or in Settings.
 */

import { useEffect, useRef, useState } from 'react';
import { Sun, X } from 'lucide-react';
import { getSettings, saveSettings } from '../utils/settings';
import { getDaily, markGoodDayNudge, localDateStr } from '../services/daily';

const GoodDayNudge = ({ onClose }) => {
  const [pref, setPref] = useState(() => getSettings().goodDayNudge);
  const [visible, setVisible] = useState(false);
  const checkedRef = useRef(false); // StrictMode runs effects twice in dev

  useEffect(() => {
    if (pref === false || checkedRef.current) return;
    checkedRef.current = true;
    const today = localDateStr();
    getDaily().then(d => {
      if (d.lastGoodDayNudge === today) { onClose(); return; }
      setVisible(true);
      markGoodDayNudge(today);
    }).catch(() => setVisible(true));
    // Runs once per appearance; onClose identity doesn't matter here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (pref === false || !visible) return null;

  const choose = (on) => {
    saveSettings({ goodDayNudge: on });
    setPref(on);
    if (!on) onClose();
  };

  return (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
      <Sun size={20} className="text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-amber-900 leading-tight">You&apos;re having a clearer day</p>
        <p className="text-xs text-amber-900/80 leading-snug mt-1">
          Enjoy it, and protect tomorrow by banking about 20% of today&apos;s energy. Stopping while you
          still feel good is how good days lead to more good days.
        </p>
        {pref === null ? (
          <div className="mt-2">
            <p className="text-xs font-semibold text-amber-900 mb-1.5">Want a reminder like this on good days?</p>
            <div className="flex gap-2">
              <button onClick={() => choose(true)} className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold">Yes, remind me</button>
              <button onClick={() => choose(false)} className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-800 text-xs font-bold">No thanks</button>
            </div>
          </div>
        ) : (
          <button onClick={() => choose(false)} className="text-[11px] font-semibold text-amber-800 underline mt-1.5">
            Turn off these reminders
          </button>
        )}
      </div>
      <button onClick={onClose} aria-label="Dismiss" className="text-amber-500 hover:text-amber-700">
        <X size={16} />
      </button>
    </div>
  );
};

export default GoodDayNudge;
