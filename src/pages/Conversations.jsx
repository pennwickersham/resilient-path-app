/**
 * Conversations — the Hard Conversations script builder.
 *
 * Pick who you need to talk to and what you need; get a starting script
 * from the book's frameworks (or your own Module 20 words for doctors),
 * make it yours, hear it read back to rehearse, then share it, save it, or
 * keep it as a one-tap flare message. Everything stays on the device.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessagesSquare, Share2, Bookmark, Trash2, Check, ChevronRight, MessageSquareHeart } from 'lucide-react';
import storage, { STORAGE_KEYS } from '../services/storage';
import { shareText, addFlareMessage } from '../services/flareMessages';
import { AUDIENCES, SCRIPTS, SCRIPT_SHAPE } from '../data/conversationScripts';
import VoiceInputButton from '../components/VoiceInputButton';
import ReadAloudButton from '../components/ReadAloudButton';

const newScript = (fields) => ({ id: `s${Date.now()}`, savedAt: Date.now(), ...fields });
const touch = (s, text) => ({ ...s, text, savedAt: Date.now() });

const audienceLabel = (id) => AUDIENCES.find(a => a.id === id)?.label || '';

const chip = (active) =>
  `px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
    active ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-secondary-700 border-secondary-200 hover:border-primary-300'
  }`;

const Conversations = () => {
  const [workbook, setWorkbook] = useState({});
  const [saved, setSaved] = useState([]);
  const [audience, setAudience] = useState(null);
  const [need, setNeed] = useState(null);
  const [text, setText] = useState('');
  const [fromWorkbook, setFromWorkbook] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    Promise.all([storage.get(STORAGE_KEYS.WORKBOOK), storage.get(STORAGE_KEYS.SCRIPTS)])
      .then(([wb, sc]) => {
        if (wb && typeof wb === 'object') setWorkbook(wb);
        if (Array.isArray(sc)) setSaved(sc);
      })
      .catch(() => {});
  }, []);

  const script = audience && need ? SCRIPTS[audience].find(s => s.need === need) : null;

  const pickAudience = (id) => {
    setAudience(id);
    setNeed(null);
    setText('');
    setEditingId(null);
    setNotice('');
  };

  const pickNeed = (s) => {
    const own = s.workbookField ? (workbook[s.workbookField] || '').trim() : '';
    setNeed(s.need);
    setText(own || s.text);
    setFromWorkbook(!!own);
    setEditingId(null);
    setNotice('');
  };

  const openSaved = (s) => {
    setAudience(s.audience);
    setNeed(s.need);
    setText(s.text);
    setFromWorkbook(false);
    setEditingId(s.id);
    setNotice('');
  };

  const persist = async (list) => {
    setSaved(list);
    await storage.set(STORAGE_KEYS.SCRIPTS, list);
  };

  const onSave = async () => {
    if (!text.trim()) return;
    if (editingId) {
      await persist(saved.map(s => (s.id === editingId ? touch(s, text) : s)));
    } else {
      const created = newScript({ audience, need, label: script?.label || '', text });
      await persist([created, ...saved]);
      setEditingId(created.id);
    }
    setNotice('Saved to My Scripts.');
  };

  const onShare = async () => {
    const r = await shareText(text);
    if (r === 'copied') setNotice('Copied. Paste it into any app.');
  };

  const onFlareMessage = async () => {
    const ok = await addFlareMessage({ to: audienceLabel(audience), text });
    setNotice(ok ? 'Added to your flare messages.' : 'You already have 3 flare messages. Edit them in Settings.');
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500 pb-6">
      <section className="bg-white p-5 rounded-2xl shadow-sm border border-secondary-100">
        <h2 className="text-xl font-bold text-primary-800 mb-1 flex items-center gap-2">
          <MessagesSquare size={22} className="text-primary-600" /> Hard Conversations
        </h2>
        <p className="text-secondary-600 text-sm leading-relaxed">
          The conversations nobody prepares you for, with family, work, and doctors. Pick who and what,
          make the words your own, and rehearse before the real thing.
        </p>
      </section>

      {saved.length > 0 && (
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-secondary-100">
          <h3 className="font-bold text-primary-900 mb-2 flex items-center gap-2">
            <Bookmark size={16} className="text-primary-600" /> My Scripts
          </h3>
          <div className="space-y-2">
            {saved.map(s => (
              <div key={s.id} className="flex items-center gap-2">
                <button
                  onClick={() => openSaved(s)}
                  className={`flex-1 min-w-0 text-left rounded-xl px-3 py-2 border ${editingId === s.id ? 'border-primary-300 bg-primary-50' : 'border-secondary-100 bg-secondary-50 hover:bg-primary-50'}`}
                >
                  <p className="text-[10px] font-bold text-primary-700 uppercase tracking-wide">{audienceLabel(s.audience)} · {s.label}</p>
                  <p className="text-xs text-secondary-700 truncate">{s.text}</p>
                </button>
                <button
                  onClick={() => { persist(saved.filter(x => x.id !== s.id)); if (editingId === s.id) setEditingId(null); }}
                  aria-label="Delete script"
                  className="text-secondary-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-white p-5 rounded-2xl shadow-sm border border-secondary-100 space-y-4">
        <div>
          <p className="text-xs font-bold text-secondary-500 uppercase tracking-wide mb-2">1. Who are you talking to?</p>
          <div className="flex flex-wrap gap-2">
            {AUDIENCES.map(a => (
              <button key={a.id} onClick={() => pickAudience(a.id)} className={chip(audience === a.id)}>{a.label}</button>
            ))}
          </div>
        </div>

        {audience && (
          <div>
            <p className="text-xs font-bold text-secondary-500 uppercase tracking-wide mb-2">2. What do you need?</p>
            <div className="flex flex-wrap gap-2">
              {SCRIPTS[audience].map(s => (
                <button key={s.need} onClick={() => pickNeed(s)} className={chip(need === s.need)}>{s.label}</button>
              ))}
            </div>
          </div>
        )}
      </section>

      {script && (
        <section className="bg-white p-5 rounded-2xl shadow-sm border-2 border-primary-200 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-secondary-500 uppercase tracking-wide">3. Make it yours</p>
            {fromWorkbook && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 rounded-full px-2 py-0.5">Your Module 20 words</span>
            )}
          </div>
          <div className="flex gap-2 items-start">
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setNotice(''); }}
              className="w-full min-h-[150px] border border-secondary-200 rounded-xl p-3 text-sm text-secondary-800 leading-relaxed outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            />
            <VoiceInputButton onText={(t) => setText(prev => (prev ? `${prev.replace(/\s+$/, '')} ${t}` : t))} />
          </div>
          {text.includes('[') && (
            <p className="text-[11px] text-secondary-500">Replace anything in [brackets] with your own words.</p>
          )}

          <div className="bg-secondary-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-primary-700 uppercase tracking-wide mb-1">The shape of it</p>
            <ol className="text-xs text-secondary-700 list-decimal pl-4 space-y-0.5">
              {SCRIPT_SHAPE.map(s => <li key={s}>{s}</li>)}
            </ol>
            {script.tips && (
              <ul className="text-xs text-secondary-700 list-disc pl-4 space-y-0.5 mt-2">
                {script.tips.map(t => <li key={t}>{t}</li>)}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <ReadAloudButton text={text} label="Hear it" />
            <button onClick={onShare} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary-200 bg-white text-primary-700 font-bold text-xs">
              <Share2 size={14} /> Share or copy
            </button>
            <button onClick={onSave} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-600 text-white font-bold text-xs">
              <Bookmark size={14} /> {editingId ? 'Update script' : 'Save script'}
            </button>
            {audience !== 'doctor' && (
              <button onClick={onFlareMessage} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-orange-200 bg-orange-50 text-orange-800 font-bold text-xs">
                <MessageSquareHeart size={14} /> Use as flare message
              </button>
            )}
          </div>
          {notice && (
            <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1"><Check size={14} /> {notice}</p>
          )}
          <p className="text-[11px] text-secondary-500 leading-relaxed">
            Say it out loud once before the real conversation, even just to yourself. It makes the words easier to find when it counts.
          </p>
        </section>
      )}

      <Link
        to={`/workbook?module=${audience === 'doctor' ? 20 : 19}`}
        className="text-sm font-bold text-primary-700 inline-flex items-center gap-0.5 self-center"
      >
        {audience === 'doctor' ? 'Build more in Module 20: Self-Advocacy' : 'Map your support in Module 19'} <ChevronRight size={14} />
      </Link>
    </div>
  );
};

export default Conversations;
