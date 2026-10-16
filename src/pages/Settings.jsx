import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TEXT_SIZES, getSettings, saveSettings, applyTextSize } from '../utils/settings';

const Settings = () => {
  const [settings, setSettings] = useState(() => getSettings());

  const onGoodDay = (on) => setSettings(saveSettings({ goodDayNudge: on }));

  const onSize = (key) => {
    setSettings(saveSettings({ textSize: key }));
    applyTextSize(key);
  };

  return (
    <div className="flex flex-col gap-4 pb-6 animate-in fade-in duration-500">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-primary-700 font-medium w-fit">
        <ChevronLeft size={16} /> Home
      </Link>
      <h2 className="text-xl font-bold text-primary-800">Settings</h2>

      <section className="bg-white p-5 rounded-2xl shadow-sm border border-secondary-100">
        <h3 className="font-bold text-primary-900 mb-1">Text size</h3>
        <p className="text-sm text-secondary-600 mb-3">Make everything in the app easier to read.</p>
        <div role="radiogroup" aria-label="Text size" className="flex flex-wrap gap-2">
          {Object.entries(TEXT_SIZES).map(([key, cfg]) => (
            <button
              key={key}
              role="radio"
              aria-checked={settings.textSize === key}
              onClick={() => onSize(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium border ${
                settings.textSize === key ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-secondary-700 border-secondary-200'
              }`}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white p-5 rounded-2xl shadow-sm border border-secondary-100">
        <h3 className="font-bold text-primary-900 mb-1">Pacing and flares</h3>
        <label className="flex items-start justify-between gap-4 py-2">
          <span>
            <span className="block text-sm font-medium text-secondary-800">Good-day pacing reminders</span>
            <span className="block text-xs text-secondary-500 mt-0.5">
              After a low-pain check-in, a gentle reminder to bank some energy for tomorrow. At most once a day.
            </span>
          </span>
          <input
            type="checkbox"
            checked={settings.goodDayNudge === true}
            onChange={(e) => onGoodDay(e.target.checked)}
            className="w-5 h-5 mt-0.5 accent-primary-600 shrink-0"
          />
        </label>
        <Link to="/flare-messages" className="flex items-center justify-between py-2 border-t border-secondary-100 mt-1">
          <span>
            <span className="block text-sm font-medium text-secondary-800">Flare messages</span>
            <span className="block text-xs text-secondary-500 mt-0.5">Texts you can send in one tap from Flare Mode.</span>
          </span>
          <ChevronRight size={16} className="text-secondary-400 shrink-0" />
        </Link>
      </section>

      <section className="bg-white p-5 rounded-2xl shadow-sm border border-secondary-100">
        <h3 className="font-bold text-primary-900 mb-1">Backup and reminders</h3>
        <p className="text-sm text-secondary-600">
          Back up your workbook and health information, and set your daily reminder, from{' '}
          <Link to="/health-tools" className="text-primary-700 underline">My Health Tools</Link>.
        </p>
      </section>
    </div>
  );
};

export default Settings;
