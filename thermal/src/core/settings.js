const KEY = 'thermal.settings.v1';
const DEFAULTS = { volume: 0.8, muted: false, reduceFlashes: false, hardMode: false, captions: true, patterns: false, res: 320 };
export const settings = { ...DEFAULTS };
try { Object.assign(settings, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { /* ignore */ }
export function saveSettings() {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* ignore */ }
}
