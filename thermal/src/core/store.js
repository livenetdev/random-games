// IndexedDB cache for rendered heat buffers (quantised to Uint16).
const DB = 'thermal-stills', STORE = 'stills';
let dbp = null;
function db() {
  if (dbp) return dbp;
  dbp = new Promise((res) => {
    try {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => res(r.result);
      r.onerror = () => res(null);
    } catch { res(null); }
  });
  return dbp;
}
const LO = -0.5, HI = 3.5;
export function pack(still) {
  const q = new Uint16Array(still.heat.length);
  const k = 65535 / (HI - LO);
  for (let i = 0; i < q.length; i++) q[i] = Math.max(0, Math.min(65535, Math.round((still.heat[i] - LO) * k)));
  return { w: still.w, h: still.h, q, hotspots: still.hotspots };
}
export function unpack(rec) {
  const heat = new Float32Array(rec.q.length);
  const k = (HI - LO) / 65535;
  for (let i = 0; i < heat.length; i++) heat[i] = rec.q[i] * k + LO;
  return { w: rec.w, h: rec.h, heat, hotspots: rec.hotspots };
}
export async function getCached(key) {
  const d = await db(); if (!d) return null;
  return new Promise((res) => {
    try {
      const tx = d.transaction(STORE, 'readonly');
      const rq = tx.objectStore(STORE).get(key);
      rq.onsuccess = () => res(rq.result ? unpack(rq.result) : null);
      rq.onerror = () => res(null);
    } catch { res(null); }
  });
}
export async function putCached(key, still) {
  const d = await db(); if (!d) return;
  try { d.transaction(STORE, 'readwrite').objectStore(STORE).put(pack(still), key); } catch { /* quota etc */ }
}
export async function clearCache() {
  const d = await db(); if (!d) return;
  try { d.transaction(STORE, 'readwrite').objectStore(STORE).clear(); } catch { /* ignore */ }
}
