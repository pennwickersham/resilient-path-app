/**
 * FlareMessageList — the "let someone know" buttons in Flare Mode.
 *
 * Each saved message is one tap: it opens Messages or Mail with the text
 * ready (or the share sheet when no number/email was saved). With nothing
 * saved yet, it points to the setup page instead of showing an empty list.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, ChevronRight } from 'lucide-react';
import { getFlareMessages, sendHref, shareText } from '../services/flareMessages';

const FlareMessageList = ({ compact = false }) => {
  const [messages, setMessages] = useState(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    getFlareMessages().then(setMessages).catch(() => setMessages([]));
  }, []);

  if (messages === null) return null;

  if (messages.length === 0) {
    return (
      <div className="text-sm text-secondary-600 leading-relaxed">
        {!compact && <p className="mb-2">No messages set up yet. On a better day, write two or three short texts so letting someone know takes one tap.</p>}
        <Link to="/flare-messages" className="text-xs font-bold text-primary-700 inline-flex items-center gap-0.5">
          Set up flare messages <ChevronRight size={13} />
        </Link>
      </div>
    );
  }

  const onShare = async (text) => {
    const r = await shareText(text);
    if (r === 'copied') setNote('Message copied. Paste it into any app.');
  };

  return (
    <div className="space-y-2">
      {messages.map(m => {
        const href = sendHref(m);
        const inner = (
          <>
            <div className="min-w-0 text-left">
              <p className="text-sm font-bold text-primary-900 truncate">{m.to || 'Message'}</p>
              <p className="text-[11px] text-secondary-500 truncate">{m.text}</p>
            </div>
            <span className="flex items-center gap-1.5 text-primary-700 font-bold text-xs shrink-0 ml-3">
              <Send size={14} /> Send
            </span>
          </>
        );
        const cls = 'w-full flex items-center justify-between bg-primary-50 border border-primary-100 rounded-xl px-4 py-3 hover:bg-primary-100 transition';
        return href
          ? <a key={m.id} href={href} className={cls}>{inner}</a>
          : <button key={m.id} type="button" onClick={() => onShare(m.text)} className={cls}>{inner}</button>;
      })}
      {note && <p className="text-[11px] text-emerald-700 font-semibold">{note}</p>}
      <Link to="/flare-messages" className="text-xs font-bold text-primary-700 inline-flex items-center gap-0.5 mt-1">
        Edit messages <ChevronRight size={13} />
      </Link>
    </div>
  );
};

export default FlareMessageList;
