// Free-preview limits for non-subscribers.
// Workbook Module 1 and a few AI chat messages are free so people (and App Review)
// can try the app before subscribing.
export const FREE_WORKBOOK_MODULE = 1;
export const FREE_CHAT_LIMIT = 3;

const CHAT_KEY = 'resilientPathFreeChatCount';

export function getFreeChatsUsed() {
  try {
    const n = parseInt(localStorage.getItem(CHAT_KEY) || '0', 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function recordFreeChat() {
  try {
    localStorage.setItem(CHAT_KEY, String(getFreeChatsUsed() + 1));
  } catch { /* storage unavailable */ }
}

export function freeChatsLeft() {
  return Math.max(0, FREE_CHAT_LIMIT - getFreeChatsUsed());
}
