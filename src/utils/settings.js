// Small per-device display preferences (kept in localStorage; not health data).
const KEY = 'resilientPathSettings';

export const TEXT_SIZES = {
  normal: { label: 'Normal', px: 16 },
  large: { label: 'Large', px: 18 },
  xlarge: { label: 'Extra large', px: 20 },
};

export function getSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { textSize: TEXT_SIZES[s.textSize] ? s.textSize : 'normal' };
  } catch {
    return { textSize: 'normal' };
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
