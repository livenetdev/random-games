const KEY = 'thermal.save.v1';
export function newState(seed = (Math.random() * 1e9) | 0) {
  return {
    v: 1, act: 'intro', seed, walt: seed % 2 ? 'driver' : 'door',
    evidence: {}, reelIdx: 0, readIdx: 0, pinOK: false,
    film: 27, battery: 100, node: 'steps', itNode: 'powerline', visited: ['steps'], resets: {}, dread: 0,
    elapsed: 0, cardsSeen: [], ending: null,
  };
}
export function saveGame(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
}
export function loadGame() {
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); return s && s.v === 1 ? s : null; } catch { return null; }
}
export function clearSave() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }
