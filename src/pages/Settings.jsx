import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { TEXT_SIZES, getSettings, saveSettings, applyTextSize } from '../utils/settings';

const Settings = () => {
  const [settings, setSettings] = useState(() => getSettings());

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
