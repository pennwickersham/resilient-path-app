/**
 * FlareMessages — write the texts now, send them in one tap mid-flare.
 *
 * Deliberately its own page (not part of /flare): visiting Flare Mode logs
 * a flare, and setting up messages on a good day shouldn't.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, Check, MessageSquareHeart } from 'lucide-react';
import VoiceInputButton from '../components/VoiceInputButton';
import {
  getFlareMessages, saveFlareMessages, blankMessage, STARTER_MESSAGES, MAX_FLARE_MESSAGES,
} from '../services/flareMessages';

const inputCls = 'w-full border border-secondary-200 rounded-xl p-2.5 text-sm text-secondary-800 outline-none focus:ring-2 focus:ring-primary-500 bg-white';

const FlareMessages = () => {
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getFlareMessages()
      .then(existing => setList(existing.length ? existing : STARTER_MESSAGES.map(s => blankMessage(s))))
      .catch(() => setList(STARTER_MESSAGES.map(s => blankMessage(s))));
  }, []);

  if (list === null) return null;

  const edit = (id, patch) => {
    setSaved(false);
    setList(prev => prev.map(m => (m.id === id ? { ...m, ...patch } : m)));
  };

  const remove = (id) => {
    setSaved(false);
    setList(prev => prev.filter(m => m.id !== id));
  };

  const onSave = async () => {
    setList(await saveFlareMessages(list));
    setSaved(true);
  };

  return (
    <div className="flex flex-col gap-4 pb-6 animate-in fade-in duration-500">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-primary-700 font-medium w-fit">
        <ChevronLeft size={16} /> Back
      </button>

      <section className="bg-white p-5 rounded-2xl shadow-sm border border-secondary-100">
        <h2 className="text-xl font-bold text-primary-800 mb-1 flex items-center gap-2">
          <MessageSquareHeart size={22} className="text-primary-600" /> Flare Messages
        </h2>
        <p className="text-secondary-600 text-sm leading-relaxed">
          Write these on a good day. During a flare, Flare Mode opens your Messages or Mail app with
          the text ready. You still press send yourself. Replace anything in [brackets] with your own words.
        </p>
        <p className="text-[11px] text-secondary-400 mt-2">Saved only on this device.</p>
      </section>

      {list.map((m, i) => (
        <section key={m.id} className="bg-white p-4 rounded-2xl shadow-sm border border-secondary-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary-700 uppercase tracking-wide">Message {i + 1}</span>
            <button onClick={() => remove(m.id)} aria-label="Delete message" className="text-secondary-400 hover:text-red-600">
              <Trash2 size={16} />
            </button>
          </div>
          <input className={inputCls} placeholder="Who is it for? (e.g. Sam, my manager)" value={m.to} onChange={e => edit(m.id, { to: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input className={inputCls} type="tel" inputMode="tel" placeholder="Phone (for a text)" value={m.phone} onChange={e => edit(m.id, { phone: e.target.value })} />
            <input className={inputCls} type="email" inputMode="email" placeholder="Or email" value={m.email} onChange={e => edit(m.id, { email: e.target.value })} />
          </div>
          <div className="flex gap-2 items-start">
            <textarea
              className={`${inputCls} min-h-[110px]`}
              placeholder="Your message"
              value={m.text}
              onChange={e => edit(m.id, { text: e.target.value })}
            />
            <VoiceInputButton onText={(t) => edit(m.id, { text: m.text ? `${m.text.replace(/\s+$/, '')} ${t}` : t })} />
          </div>
          {!m.phone && !m.email && (
            <p className="text-[11px] text-secondary-400">No phone or email: you&apos;ll pick who to send it to when you tap Send.</p>
          )}
        </section>
      ))}

      {list.length < MAX_FLARE_MESSAGES && (
        <button
          onClick={() => setList(prev => [...prev, blankMessage()])}
          className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-primary-300 text-primary-700 font-bold text-sm bg-white hover:bg-primary-50"
        >
          <Plus size={16} /> Add a message
        </button>
      )}

      <button
        onClick={onSave}
        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-sm"
      >
        {saved ? <><Check size={16} /> Saved</> : 'Save messages'}
      </button>
    </div>
  );
};

export default FlareMessages;
