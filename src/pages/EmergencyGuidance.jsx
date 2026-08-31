/**
 * EmergencyGuidance — now personal.
 *
 * The generic crisis resources stay, but the page also pulls the user's
 * own care team from Health Tools as tap-to-call buttons and lets them
 * save a personal crisis contact (stored in PROFILE). In a bad moment,
 * "call Dr. Nguyen" beats "find your doctor's number" every time.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PhoneCall, AlertCircle, HeartPulse, Stethoscope, UserPlus, Check, Pencil, Flame, ChevronRight } from 'lucide-react';
import storage, { STORAGE_KEYS } from '../services/storage';

const telHref = (phone) => `tel:${String(phone).replace(/[^\d+]/g, '')}`;

const EmergencyGuidance = () => {
  const [doctors, setDoctors] = useState([]);
  const [crisisContact, setCrisisContact] = useState(null); // { name, phone }
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: '', phone: '' });

  useEffect(() => {
    (async () => {
      try {
        const [health, profile] = await Promise.all([
          storage.get(STORAGE_KEYS.HEALTH_TOOLS),
          storage.get(STORAGE_KEYS.PROFILE),
        ]);
        setDoctors((health?.doctors || []).filter(d => d.name && d.phone));
        if (profile?.crisisContact?.phone) {
          setCrisisContact(profile.crisisContact);
          setDraft(profile.crisisContact);
        }
      } catch (e) {
        console.error('Emergency page load failed', e);
      }
    })();
  }, []);

  const saveCrisisContact = async () => {
    const name = draft.name.trim();
    const phone = draft.phone.trim();
    if (!phone) { setEditing(false); return; }
    const profile = (await storage.get(STORAGE_KEYS.PROFILE)) || {};
    const next = { ...profile, crisisContact: { name: name || 'My person', phone } };
    await storage.set(STORAGE_KEYS.PROFILE, next);
    setCrisisContact(next.crisisContact);
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-24">
      <h2 className="text-2xl font-bold text-purple-700 flex items-center gap-2">
        <AlertCircle className="text-purple-600" size={28} />
        Emergency Help
      </h2>

      <div className="bg-purple-50 p-5 rounded-2xl border border-purple-200">
        <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
          <HeartPulse size={20} />
          In Crisis or Feeling Suicidal?
        </h3>
        <p className="text-purple-800 text-sm mb-4">
          You are not alone. Please reach out immediately. Help is available 24/7.
        </p>
        <a href="tel:988" className="bg-red-600 text-white flex items-center justify-center gap-2 py-3 rounded-xl font-bold shadow-md hover:bg-red-700 transition">
          <PhoneCall size={20} />
          Call or Text 988
        </a>
      </div>

      {/* Personal crisis contact — the one person to reach on the worst day */}
      <div className="bg-white p-5 rounded-2xl border border-secondary-200 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-secondary-900 flex items-center gap-2">
            <UserPlus size={18} className="text-primary-600" />
            My Crisis Contact
          </h3>
          {crisisContact && !editing && (
            <button onClick={() => setEditing(true)} className="text-secondary-400 hover:text-secondary-600" aria-label="Edit crisis contact">
              <Pencil size={14} />
            </button>
          )}
        </div>
        {editing || !crisisContact ? (
          <div className="space-y-2">
            <p className="text-xs text-secondary-500 leading-snug">
              Choose one trusted person now, on a calm day. This page will offer their number when things are hard.
            </p>
            <input
              type="text" placeholder="Name"
              className="w-full border border-secondary-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              value={draft.name}
              onChange={(e) => setDraft(prev => ({ ...prev, name: e.target.value }))}
            />
            <input
              type="tel" placeholder="Phone number"
              className="w-full border border-secondary-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              value={draft.phone}
              onChange={(e) => setDraft(prev => ({ ...prev, phone: e.target.value }))}
            />
            <button
              onClick={saveCrisisContact}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition-colors"
            >
              <Check size={15} /> Save Contact
            </button>
          </div>
        ) : (
          <a
            href={telHref(crisisContact.phone)}
            className="flex items-center justify-between bg-primary-50 border border-primary-100 rounded-xl px-4 py-3 hover:bg-primary-100 transition"
          >
            <div className="min-w-0">
              <p className="text-sm font-bold text-primary-900 truncate">{crisisContact.name}</p>
              <p className="text-[11px] text-secondary-500">{crisisContact.phone}</p>
            </div>
            <span className="flex items-center gap-1.5 text-primary-700 font-bold text-xs shrink-0 ml-3">
              <PhoneCall size={14} /> Call
            </span>
          </a>
        )}
      </div>

      {/* The user's own care team — from Health Tools, zero extra typing */}
      {doctors.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-secondary-200 shadow-sm">
          <h3 className="font-bold text-secondary-900 mb-3 flex items-center gap-2">
            <Stethoscope size={18} className="text-primary-600" />
            Call My Care Team
          </h3>
          <div className="space-y-2">
            {doctors.map((d, i) => (
              <a
                key={i}
                href={telHref(d.phone)}
                className="flex items-center justify-between bg-secondary-50 border border-secondary-100 rounded-xl px-4 py-3 hover:bg-secondary-100 transition"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-secondary-900 truncate">{d.name}</p>
                  {d.specialty && <p className="text-[11px] text-secondary-500">{d.specialty}</p>}
                </div>
                <span className="flex items-center gap-1.5 text-primary-700 font-bold text-xs shrink-0 ml-3">
                  <PhoneCall size={14} /> Call
                </span>
              </a>
            ))}
          </div>
          <p className="text-[10px] text-secondary-400 mt-2 leading-snug">
            Numbers come from your Health Tools provider list — keep it current there.
          </p>
        </div>
      )}

      <div className="bg-white p-5 rounded-2xl border border-secondary-200 shadow-sm">
        <h3 className="font-bold text-secondary-900 mb-2">When to Call Your Doctor</h3>
        <ul className="list-disc pl-5 text-sm text-secondary-700 space-y-2">
          <li>New or worsening pain that is significantly different from your baseline.</li>
          <li>Side effects from medications that are concerning but not life-threatening.</li>
          <li>Questions about your treatment plan or workbook exercises.</li>
        </ul>
      </div>

      <div className="bg-purple-50/60 p-5 rounded-2xl border border-purple-200 shadow-sm">
        <h3 className="font-bold text-purple-900 mb-2">Urgent vs Emergent Care</h3>
        <div className="space-y-4 text-sm text-purple-900">
          <div>
            <strong className="block mb-1 text-purple-950">Go to the Emergency Room (Emergent) if:</strong>
            <ul className="list-disc pl-5 space-y-1">
              <li>Sudden loss of bowel or bladder control.</li>
              <li>Sudden onset of severe weakness or numbness in arms or legs.</li>
              <li>Chest pain, difficulty breathing, or signs of a stroke.</li>
            </ul>
          </div>
          <div>
            <strong className="block mb-1 text-purple-950">Go to Urgent Care if:</strong>
            <ul className="list-disc pl-5 space-y-1">
              <li>Severe pain flare-up that cannot be managed at home but does not include emergency symptoms.</li>
              <li>Minor injuries or infections.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Not an emergency, just a hard day → Flare Mode */}
      <Link
        to="/flare"
        className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex items-center gap-3 hover:bg-amber-100 transition shadow-sm"
      >
        <Flame size={20} className="text-amber-600 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-amber-900 leading-tight">Bad flare, not an emergency?</p>
          <p className="text-[11px] text-amber-700 leading-snug">Flare Mode has your plan and tools.</p>
        </div>
        <ChevronRight size={16} className="text-amber-500 shrink-0" />
      </Link>
    </div>
  );
};

export default EmergencyGuidance;
