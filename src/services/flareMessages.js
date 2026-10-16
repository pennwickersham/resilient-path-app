/**
 * flareMessages.js — texts written on a good day, sent in one tap on a bad one.
 *
 * Shape (STORAGE_KEYS.FLARE_MESSAGES): [{ id, to, phone, email, text }]
 * Sending never happens in the app: it opens the person's own Messages or
 * Mail app (or the share sheet) with the text ready, and they press send.
 */

import { Share } from '@capacitor/share';
import storage, { STORAGE_KEYS } from './storage';

export const MAX_FLARE_MESSAGES = 3;

// Starting points the person edits; [brackets] are theirs to fill in.
export const STARTER_MESSAGES = [
  {
    to: 'Partner or family',
    text: 'I’m having a pain flare today. I’m following my flare plan and resting. It would be really helpful if you could [take over dinner / pick up the kids] today. I’ll let you know when I’m feeling better.',
  },
  {
    to: 'Work',
    text: 'I’m dealing with a flare of my health condition today and need to [work from home / take a sick day / move today’s meeting]. I’ll keep you posted and pick up [task] as soon as I can.',
  },
  {
    to: 'Friend',
    text: 'I have to cancel today. My pain is flaring and I need to rest. I’m really sorry to miss it, and it isn’t about you. Can we find another time soon?',
  },
];

const newId = () => `m${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

export const blankMessage = (seed = {}) => ({ id: newId(), to: '', phone: '', email: '', text: '', ...seed });

export async function getFlareMessages() {
  const v = await storage.get(STORAGE_KEYS.FLARE_MESSAGES);
  return Array.isArray(v) ? v : [];
}

export async function saveFlareMessages(list) {
  const clean = list
    .map(m => ({ ...m, to: (m.to || '').trim(), phone: (m.phone || '').trim(), email: (m.email || '').trim() }))
    .filter(m => (m.text || '').trim())
    .slice(0, MAX_FLARE_MESSAGES);
  await storage.set(STORAGE_KEYS.FLARE_MESSAGES, clean);
  return clean;
}

/** Adds one message if there is room. Returns false when already full. */
export async function addFlareMessage(seed) {
  const list = await getFlareMessages();
  if (list.length >= MAX_FLARE_MESSAGES) return false;
  await saveFlareMessages([...list, blankMessage(seed)]);
  return true;
}

/** A link that opens Messages/Mail with the text filled in, or null. */
export function sendHref(m) {
  const body = encodeURIComponent(m.text || '');
  const phone = (m.phone || '').replace(/[^\d+]/g, '');
  // `?&body=` is the form both iOS and Android Messages accept.
  if (phone) return `sms:${phone}?&body=${body}`;
  if (m.email) return `mailto:${encodeURI(m.email.replace(/\s/g, ''))}?subject=${encodeURIComponent('Flare day')}&body=${body}`;
  return null;
}

/** No phone or email saved: hand the text to the share sheet instead. */
export async function shareText(text) {
  try {
    await Share.share({ text, dialogTitle: 'Send your message' });
    return 'shared';
  } catch (e) {
    if (/cancel/i.test(e?.message || '')) return 'cancelled';
    try {
      await navigator.clipboard.writeText(text);
      return 'copied';
    } catch {
      return 'failed';
    }
  }
}
