// Small per-device display preferences (kept in localStorage; not health data).
const KEY = 'resilientPathSettings';

export const TEXT_SIZES = {
  normal: { label: 'Normal', px: 16 },
  large: { label: 'Large', px: 18 },
  xlarge: { label: 'Extra large', px: 20 },
};

// goodDayNudge: null until the person is asked, then true/false (opt-in).
export function getSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      textSize: TEXT_SIZES[s.textSize] ? s.textSize : 'normal',
      goodDayNudge: typeof s.goodDayNudge === 'boolean' ? s.goodDayNudge : null,
    };
  } catch {
    return { textSize: 'normal', goodDayNudge: null };
  }
}

export function saveSettings(patch) {
  const next = { ...getSettings(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
  return next;
}

export function applyTextSize(key = getSettings().textSize) {
  document.documentElement.style.fontSize = `${TEXT_SIZES[key].px}px`;
}
