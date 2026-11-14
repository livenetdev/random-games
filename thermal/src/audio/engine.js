// THERMAL — procedural Web Audio engine.
// Rural Oregon forest, November 1997. No assets: everything is synthesized.
// Nothing touches AudioContext at module load; every public method is a safe
// no-op until init() succeeds, and never throws.

let C = null;                       // AudioContext
let master = null, comp = null, bedBus = null, sfxBus = null;
let WHITE = null, BROWN = null;     // shared 2 s noise buffers
let vol = 0.8, muted = false, silenced = false, silenceTimer = 0;
let curScene = 'silent', itNear = 0, dread = 0;
let dreadNodes = null, charge = null, ticker = 0;
const beds = {};

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, Number.isFinite(+v) ? +v : lo));
const now = () => C.currentTime;

// ---------------------------------------------------------------- node helpers
const G = (v = 0) => { const g = C.createGain(); g.gain.value = v; return g; };
const F = (type, f, q = 1) => {
  const n = C.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; return n;
};
const O = (type, f) => { const o = C.createOscillator(); o.type = type; o.frequency.value = f; return o; };
const N = (buf = WHITE, loop = true) => {
  const s = C.createBufferSource(); s.buffer = buf; s.loop = loop; return s;
};
function chain(...nodes) {
  for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]);
  return nodes[nodes.length - 1];
}
// Continuous LFO (for looping beds; never stopped).
function lfo(freq, depth, param, type = 'sine') {
  const o = O(type, freq), g = G(depth);
  o.connect(g); g.connect(param); o.start();
  return o;
}
// Returns an input node that pans into dest (falls back to dest).
function panner(p, dest) {
  if (C.createStereoPanner && p) {
    const s = C.createStereoPanner(); s.pan.value = clamp(p, -1, 1); s.connect(dest); return s;
  }
  return dest;
}
function smooth(param, v, tc = 0.1, t = now()) {
  try { param.setTargetAtTime(v, t, tc); } catch (e) { /* ignore */ }
}
// attack -> hold -> exponential decay envelope
function env(p, t, a, peak, hold, dec) {
  const pk = Math.max(peak, 1e-4);
  p.setValueAtTime(0, t);
  p.linearRampToValueAtTime(pk, t + a);
  if (hold > 0) p.setValueAtTime(pk, t + a + hold);
  p.exponentialRampToValueAtTime(1e-4, t + a + hold + dec);
  p.linearRampToValueAtTime(0, t + a + hold + dec + 0.01);
}

function makeNoise(brown) {
  const len = Math.floor(C.sampleRate * 2);
  const b = C.createBuffer(1, len, C.sampleRate), d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
  }
  if (brown) { // remove drift so the loop point is seamless
    const k = d[len - 1] - d[0];
    for (let i = 0; i < len; i++) d[i] -= k * i / (len - 1);
  }
  return b;
}

// ---------------------------------------------------------------- one-shot primitives
// Filtered noise burst.
function burst(t, o = {}) {
  const { dur = 0.1, type = 'bandpass', f = 1000, q = 1, gain = 0.3, attack = 0.002, hold = 0,
    buf = WHITE, pan = 0, dest = sfxBus, f2 } = o;
  const s = N(buf, true), fl = F(type, f, q), g = G(0);
  chain(s, fl, g); g.connect(panner(pan, dest));
  const end = t + attack + hold + dur;
  if (f2) { fl.frequency.setValueAtTime(f, t); fl.frequency.exponentialRampToValueAtTime(f2, end); }
  env(g.gain, t, attack, gain, hold, dur);
  s.start(t, Math.random() * 1.5); s.stop(end + 0.05);
  return fl;
}
// Enveloped oscillator, optional pitch sweep and lowpass.
function tone(t, o = {}) {
  const { type = 'sine', f = 440, f2, dur = 0.2, gain = 0.2, attack = 0.003, hold = 0,
    pan = 0, dest = sfxBus, lp } = o;
  const osc = O(type, f), g = G(0);
  let n = osc;
  if (lp) { const fl = F('lowpass', lp, 0.7); osc.connect(fl); n = fl; }
  n.connect(g); g.connect(panner(pan, dest));
  const end = t + attack + hold + dur;
  if (f2) { osc.frequency.setValueAtTime(f, t); osc.frequency.exponentialRampToValueAtTime(f2, end); }
  env(g.gain, t, attack, gain, hold, dur);
  osc.start(t); osc.stop(end + 0.05);
  return osc;
}

function step(t, surface, pan = 0, g = 1, dest = sfxBus) {
  if (surface === 'leaves') {
    burst(t, { dur: 0.22, f: 1100, q: 0.6, attack: 0.025, gain: 0.5 * g, pan, dest });
    for (let i = 0; i < 6; i++) {
      burst(t + rnd(0, 0.2), { dur: rnd(0.02, 0.05), type: 'highpass', f: rnd(2500, 5000),
        gain: rnd(0.05, 0.14) * g, pan, dest });
    }
    burst(t, { dur: 0.08, type: 'lowpass', f: 250, gain: 0.6 * g, buf: BROWN, pan, dest });
  } else { // gravel: two crunchy grains (heel, toe)
    for (let k = 0; k < 2; k++) {
      const tt = t + k * rnd(0.07, 0.11);
      burst(tt, { dur: 0.05, type: 'lowpass', f: 300, gain: 0.8 * g, buf: BROWN, pan, dest });
      for (let i = 0; i < 7; i++) {
        burst(tt + rnd(0, 0.07), { dur: rnd(0.008, 0.022), f: rnd(1800, 4800), q: 1.5,
          gain: rnd(0.15, 0.45) * g * (k ? 0.75 : 1), pan, dest });
      }
    }
  }
}

// ---------------------------------------------------------------- bed components
function windComp(dest, level, lp) {
  const s = N(WHITE), bp = F('bandpass', 450, 1.1), l = F('lowpass', lp, 0.5);
  const gust = G(1), g = G(level);
  chain(s, bp, l, gust, g, dest);
  lfo(0.061, 220, bp.frequency); lfo(0.017, 140, bp.frequency);
  lfo(0.11, level * 0.55, g.gain); lfo(0.037, level * 0.4, g.gain);
  s.start(0, Math.random() * 1.9);
  return gust;
}
function hissComp(dest, level) {
  const s = N(WHITE), hp = F('highpass', 5200, 0.5), lp = F('lowpass', 12000, 0.5), g = G(level);
  chain(s, hp, lp, g, dest); s.start(0, Math.random() * 1.9);
}
function humComp(dest, level) {
  const out = G(1), lp = F('lowpass', 700, 0.6);
  out.connect(lp); lp.connect(dest);
  [[60, 1], [120, 0.7], [180, 0.4], [240, 0.15]].forEach(([f, a], i) => {
    const o = O(i === 2 ? 'triangle' : 'sine', f), g = G(level * a);
    o.connect(g); g.connect(out); o.start();
    lfo(0.21 + i * 0.07, 3 + i, o.detune);          // slight wobble
  });
  lfo(0.47, 0.12, out.gain);
  return out; // gain target: powerdown kills it, setScene('desk') restores it
}
function highwayComp(dest, level) {
  const swell = G(0.15), g = G(level);
  swell.connect(g); g.connect(dest);
  const b = N(BROWN), lp = F('lowpass', 160, 0.7);
  chain(b, lp, swell); b.start(0, Math.random() * 1.9);
  const w = N(WHITE), bp = F('bandpass', 1100, 0.5), lp2 = F('lowpass', 1500, 0.5), wg = G(0.04);
  chain(w, bp, lp2, wg, swell); w.start(0, Math.random() * 1.9); // faint tire hiss
  return swell;
}
function cricketComp(dest, level) {
  const g = G(level * (1 - itNear));
  g.connect(dest);
  const voices = [];
  for (let i = 0; i < 4; i++) {
    voices.push({ f: rnd(4300, 4800), out: panner(rnd(-0.85, 0.85), g), amp: rnd(0.35, 1),
      rate: rnd(0.45, 0.95), next: 0 });
  }
  return { g, level, voices };
}
function chirp(v, t) {
  const o = O('sine', v.f), g = G(0);
  o.connect(g); g.connect(v.out);
  const n = 3 + ((Math.random() * 3) | 0);
  for (let i = 0; i < n; i++) {
    const s = t + i * 0.032;
    g.gain.setValueAtTime(0, s);
    g.gain.linearRampToValueAtTime(v.amp, s + 0.006);
    g.gain.linearRampToValueAtTime(0, s + 0.02);
  }
  o.frequency.setValueAtTime(v.f, t);
  o.frequency.linearRampToValueAtTime(v.f * 0.985, t + n * 0.032);
  o.start(t); o.stop(t + n * 0.032 + 0.05);
}
function idleComp(dest, level) {
  const am = G(0.6), g = G(level), lp = F('lowpass', 120, 1.4);
  const o = O('sawtooth', 36), o2 = O('sine', 72), o2g = G(0.3);
  o.connect(lp); o2.connect(o2g); o2g.connect(lp);
  chain(lp, am, g, dest);
  const b = N(BROWN), blp = F('lowpass', 80, 0.7), bg = G(0.8);
  chain(b, blp, bg, am);
  lfo(6.2, 0.35, am.gain);           // lumpy firing pulse
  lfo(0.15, 1.5, o.frequency);       // rpm drift
  o.start(); o2.start(); b.start(0, Math.random() * 1.9);
}

const BED_DEFS = {
  title(g) {
    const d = O('sine', 41), dg = G(0.07);
    d.connect(dg); dg.connect(g); d.start(); lfo(0.05, 0.6, d.frequency);
    hissComp(g, 0.016);
    return { gust: windComp(g, 0.8, 1200) };
  },
  desk(g) {
    hissComp(g, 0.012);
    return { hum: humComp(g, 0.05), gust: windComp(g, 0.9, 320) };
  },
  outdoor(g) {
    return { gust: windComp(g, 1.0, 1600), swell: highwayComp(g, 1.0), crickets: cricketComp(g, 0.08) };
  },
  van(g) {
    idleComp(g, 0.25);
    return { gust: windComp(g, 0.45, 900), swell: highwayComp(g, 0.8), crickets: cricketComp(g, 0.065) };
  },
};

function getBed(name) {
  if (!beds[name] && BED_DEFS[name]) {
    const g = G(0); g.connect(bedBus);
    beds[name] = { g, ...BED_DEFS[name](g) };
  }
  return beds[name];
}
function applyScene() {
  getBed(curScene);
  const t = now();
  for (const k in beds) {
    const b = beds[k], on = k === curScene;
    b.g.gain.cancelScheduledValues(t);
    b.g.gain.setTargetAtTime(on ? 1 : 0, t, 0.4); // ~1.5 s crossfade
    if (on && b.hum) smooth(b.hum.gain, 1, 0.3, t);
  }
}
function applyItNear() {
  for (const k in beds) {
    const c = beds[k].crickets;
    if (c) smooth(c.g.gain, c.level * (1 - itNear), 0.4);
  }
}

// ---------------------------------------------------------------- dread layer
function buildDread() {
  const out = G(1), lp = F('lowpass', 260, 0.5);
  out.connect(lp); lp.connect(master);
  const sub = O('sine', 44), subG = G(0);
  sub.connect(subG); subG.connect(out); sub.start();
  lfo(0.013, 1.0, sub.frequency);
  const pairs = [[55, 55.7], [82, 82.9]].map(([a, b]) => {
    const pg = G(0); pg.connect(out);
    const oscs = [a, b].map((f) => {
      const o = O('sine', f), og = G(0.5);
      o.connect(og); og.connect(pg); o.start();
      return o;
    });
    return { pg, hi: oscs[1], base: b };
  });
  dreadNodes = { sub, subG, pairs };
}
function applyDread() {
  if (!dreadNodes) return;
  const d = dread, t = now();
  smooth(dreadNodes.sub.frequency, 44 - 8 * d, 2.5, t);           // drifts down 44 -> 36
  smooth(dreadNodes.subG.gain, 0.012 + 0.3 * Math.pow(d, 1.2), 0.8, t);
  const [p0, p1] = dreadNodes.pairs;
  smooth(p0.pg.gain, 0.003 + 0.16 * d, 0.8, t);
  smooth(p1.pg.gain, 0.001 + 0.13 * Math.pow(d, 1.5), 0.8, t);
  smooth(p0.hi.frequency, p0.base + 0.8 * d, 2, t);                // faster beating with dread
  smooth(p1.hi.frequency, p1.base + 1.1 * d, 2, t);
}

// ---------------------------------------------------------------- master / scheduler
function applyMaster(tc = 0.05) {
  if (!master) return;
  const t = now(), target = muted || silenced ? 0 : vol;
  master.gain.cancelScheduledValues(t);
  master.gain.setTargetAtTime(target, t, tc);
}

function tick() {
  try {
    if (!C || C.state !== 'running') return;
    const t = now();
    const b = beds[curScene];
    if (!b) return;
    if (b.gust && t > (b.nextGust || 0)) {
      b.gust.gain.setTargetAtTime(rnd(0.5, 1.7), t, rnd(0.8, 2.5));
      b.nextGust = t + rnd(2, 7);
    }
    if (b.swell && t > (b.nextSwell || 0)) {
      b.swell.gain.setTargetAtTime(rnd(0.04, 0.32), t, rnd(2, 5));
      b.nextSwell = t + rnd(3, 9);
    }
    if (b.crickets && itNear < 0.97) {
      for (const v of b.crickets.voices) {
        if (v.next < t) v.next = t + rnd(0.05, 1.2);
        while (v.next < t + 0.35) {
          chirp(v, v.next);
          v.next += Math.random() < 0.08 ? rnd(2, 7) : v.rate * rnd(0.92, 1.08);
        }
      }
    }
  } catch (e) { /* ignore */ }
}

// ---------------------------------------------------------------- sfx
const SFX = {
  trailclick(t, o, g, pan) {
    burst(t, { dur: 0.02, type: 'highpass', f: 1800, gain: 0.45 * g, pan });
    tone(t + 0.003, { f: 3800, dur: 0.018, gain: 0.12 * g, pan });           // resonant tick
    burst(t + 0.004, { dur: 0.04, f: 4200, q: 18, gain: 0.6 * g, pan });
    burst(t + 0.07, { dur: 0.015, type: 'highpass', f: 2500, gain: 0.18 * g, pan });
  },
  wind(t, o, g, pan) { // film advance thumb-wheel
    for (let i = 0; i < 8; i++) {
      const tt = t + i * 0.05 + rnd(0, 0.012);
      burst(tt, { dur: 0.01, f: rnd(2600, 4200), q: 5, gain: 0.35 * g, pan });
      tone(tt, { f: rnd(5000, 6000), dur: 0.008, gain: 0.02 * g, pan });
    }
    burst(t, { dur: 0.3, attack: 0.05, f: 1800, q: 0.8, gain: 0.04 * g, pan });
    burst(t + 0.42, { dur: 0.015, f: 3000, q: 3, gain: 0.5 * g, pan });
  },
  shutter(t, o, g, pan) {
    burst(t, { dur: 0.015, type: 'highpass', f: 1500, gain: 0.6 * g, pan });
    tone(t + 0.002, { type: 'triangle', f: 2900, dur: 0.03, gain: 0.12 * g, pan });
    burst(t + 0.018, { dur: 0.025, f: 2200, q: 6, gain: 0.35 * g, pan });
    burst(t, { dur: 0.04, type: 'lowpass', f: 400, buf: BROWN, gain: 0.6 * g, pan });
    if (o.flash) {
      const f = t + 0.01;
      burst(f, { dur: 0.18, type: 'highpass', f: 3000, gain: 0.5 * g, attack: 0.001, pan });
      burst(f, { dur: 0.06, f: 6000, q: 0.7, gain: 0.3 * g, pan });
      tone(f, { f: 180, f2: 60, dur: 0.08, gain: 0.3 * g, pan });
    }
  },
  'step-gravel'(t, o, g, pan) { step(t, 'gravel', pan, g); },
  'step-leaves'(t, o, g, pan) { step(t, 'leaves', pan, g); },
  walk(t, o, g, pan) {
    const s = o.surface === 'leaves' ? 'leaves' : 'gravel';
    for (let i = 0; i < 4; i++) {
      step(t + i * 0.52 + rnd(-0.04, 0.04), s, clamp(pan + (i % 2 ? 0.08 : -0.08), -1, 1), g * rnd(0.8, 1));
    }
  },
  creak(t, o, g, pan) { // stick-slip pulse train through resonances
    const dur = 1.2, src = O('sawtooth', 45), b1 = F('bandpass', 700, 9), b2 = F('bandpass', 1650, 7);
    const e = G(0);
    src.connect(b1); src.connect(b2); b1.connect(e); b2.connect(e); e.connect(panner(pan, sfxBus));
    const fr = src.frequency;
    fr.setValueAtTime(rnd(35, 50), t);
    e.gain.setValueAtTime(0, t);
    e.gain.linearRampToValueAtTime(0.5 * g, t + 0.12);
    for (let i = 1; i <= 8; i++) {
      fr.linearRampToValueAtTime(rnd(28, 95), t + (i * dur) / 8);
      if (i < 8) e.gain.linearRampToValueAtTime(rnd(0.25, 0.6) * g, t + 0.12 + (i * (dur - 0.3)) / 8);
    }
    e.gain.linearRampToValueAtTime(0, t + dur);
    b1.frequency.setValueAtTime(700, t); b1.frequency.linearRampToValueAtTime(rnd(850, 1000), t + dur);
    src.start(t); src.stop(t + dur + 0.05);
  },
  stinger(t, o, g, pan) {
    tone(t, { f: 90, f2: 38, dur: 1.4, gain: 0.7 * g, attack: 0.004 });
    burst(t, { dur: 1.2, type: 'lowpass', f: 5000, f2: 300, q: 0.7, gain: 0.45 * g, attack: 0.003 });
    burst(t, { dur: 0.5, type: 'lowpass', f: 200, buf: BROWN, gain: 0.7 * g });
    [233, 247, 349, 370, 494, 523].forEach((f) =>
      tone(t, { type: 'sawtooth', f, f2: f * 0.94, dur: 1.5, gain: 0.07 * g, attack: 0.01, lp: 2200 }));
    tone(t, { type: 'square', f: 1975, f2: 1760, dur: 0.6, gain: 0.025 * g, lp: 5000 });
  },
  thump(t, o, g, pan) {
    tone(t, { f: 75, f2: 35, dur: 0.5, gain: 0.7 * g, pan });
    burst(t, { dur: 0.12, type: 'lowpass', f: 180, buf: BROWN, gain: 1.0 * g, pan });
  },
  beep(t, o, g, pan) {
    tone(t, { type: 'square', f: 1800, dur: 0.02, hold: 0.1, gain: 0.06 * g, lp: 6000, pan });
  },
  read(t, o, g, pan) {
    for (let tt = t; tt < t + 0.6; tt += rnd(0.008, 0.035)) {
      burst(tt, { dur: rnd(0.004, 0.012), f: rnd(1200, 3800), q: 3, gain: rnd(0.15, 0.4) * g, pan });
    }
    tone(t, { type: 'triangle', f: 110, f2: 120, dur: 0.1, hold: 0.5, attack: 0.03, gain: 0.03 * g, pan });
  },
  static(t, o, g, pan) {
    burst(t, { dur: 0.06, hold: 0.33, type: 'highpass', f: 200, q: 0.5, gain: 0.22 * g, attack: 0.005, pan });
    for (let i = 0; i < 6; i++) {
      burst(t + rnd(0, 0.38), { dur: 0.006, type: 'highpass', f: 1000, gain: rnd(0.2, 0.4) * g, pan });
    }
  },
  powerdown(t, o, g, pan) {
    for (const k in beds) if (beds[k].hum) smooth(beds[k].hum.gain, 0, 0.03, t);
    [[60, 'sawtooth', 0.08], [120, 'sine', 0.05], [180, 'sine', 0.025]].forEach(([f, type, a]) =>
      tone(t, { type, f, f2: f * 0.35, hold: 0.6, dur: 0.9, gain: a * g, attack: 0.005, lp: 500, pan }));
    const c = t + 1.55;   // relay clunk
    burst(c, { dur: 0.08, type: 'lowpass', f: 500, buf: BROWN, gain: 1.0 * g, pan });
    burst(c, { dur: 0.012, type: 'highpass', f: 2000, gain: 0.4 * g, pan });
    burst(c + 0.03, { dur: 0.01, f: 3000, q: 4, gain: 0.2 * g, pan });
  },
  engine(t, o, g, pan) {
    const out = panner(pan, sfxBus);
    // starter whirr, chugging
    const st = O('sawtooth', 140), bp = F('bandpass', 700, 1.5), am = G(0.5), sg = G(0);
    const ch = O('square', 8.5), chg = G(0.5);
    chain(st, bp, am, sg, out); ch.connect(chg); chg.connect(am.gain);
    st.frequency.setValueAtTime(140, t); st.frequency.linearRampToValueAtTime(190, t + 1);
    sg.gain.setValueAtTime(0, t); sg.gain.linearRampToValueAtTime(0.25 * g, t + 0.05);
    sg.gain.setValueAtTime(0.25 * g, t + 0.95); sg.gain.linearRampToValueAtTime(0, t + 1.1);
    st.start(t); ch.start(t); st.stop(t + 1.15); ch.stop(t + 1.15);
    // catches: rumble swell then settles and fades
    const c = t + 1.0, r = O('sawtooth', 30), lp = F('lowpass', 600, 1), rg = G(0);
    chain(r, lp, rg, out);
    r.frequency.setValueAtTime(30, c); r.frequency.linearRampToValueAtTime(75, c + 0.4);
    r.frequency.linearRampToValueAtTime(38, c + 1.8);
    lp.frequency.setValueAtTime(600, c); lp.frequency.linearRampToValueAtTime(140, c + 2);
    rg.gain.setValueAtTime(0, c); rg.gain.linearRampToValueAtTime(0.45 * g, c + 0.25);
    rg.gain.setTargetAtTime(0.12 * g, c + 0.5, 0.6); rg.gain.setTargetAtTime(0, c + 3, 0.4);
    r.start(c); r.stop(c + 4.5);
    burst(c, { dur: 1.5, type: 'lowpass', f: 120, buf: BROWN, gain: 0.8 * g, attack: 0.1, pan });
  },
  breath(t, o, g, pan) {
    const s = N(WHITE), bp = F('bandpass', 1600, 0.8), lp = F('lowpass', 3000, 0.5), e = G(0);
    chain(s, bp, lp, e); e.connect(panner(pan, sfxBus));
    const p = 0.035 * g;
    e.gain.setValueAtTime(0, t);
    e.gain.linearRampToValueAtTime(p, t + 0.8);            // inhale
    e.gain.linearRampToValueAtTime(p * 0.2, t + 1.0);
    e.gain.linearRampToValueAtTime(p * 1.1, t + 1.4);      // exhale
    e.gain.linearRampToValueAtTime(0, t + 2.1);
    bp.frequency.setValueAtTime(1600, t); bp.frequency.linearRampToValueAtTime(1300, t + 0.8);
    bp.frequency.linearRampToValueAtTime(700, t + 1.1); bp.frequency.linearRampToValueAtTime(600, t + 2.1);
    s.start(t, rnd(0, 1)); s.stop(t + 2.2);
  },
  knock(t, o, g, pan) {
    [0, 0.3, 0.58].forEach((d) => {
      const k = t + d, a = g * rnd(0.85, 1);
      tone(k, { f: 190, f2: 120, dur: 0.12, gain: 0.45 * a, pan });
      burst(k, { dur: 0.03, f: 1000, q: 3, gain: 0.5 * a, pan });
      burst(k, { dur: 0.06, type: 'lowpass', f: 300, buf: BROWN, gain: 0.9 * a, pan });
    });
  },
  tick(t, o, g, pan) {
    tone(t, { type: 'square', f: 2600, dur: 0.012, gain: 0.025 * g, lp: 5000, pan });
  },
  battery(t, o, g, pan) {
    [0, 0.16].forEach((d) =>
      tone(t + d, { type: 'square', f: 3300, attack: 0.002, hold: 0.05, dur: 0.02, gain: 0.035 * g, lp: 7000, pan }));
  },
  tape(t, o, g, pan) {
    const fl = burst(t, { dur: 0.3, attack: 0.08, hold: 0.05, f: 400, q: 1.2, gain: 0.18 * g, pan });
    fl.frequency.setValueAtTime(400, t);
    fl.frequency.exponentialRampToValueAtTime(2400, t + 0.18);
    fl.frequency.exponentialRampToValueAtTime(500, t + 0.45);
    const w = tone(t, { f: 520, f2: 380, dur: 0.35, attack: 0.05, gain: 0.03 * g, pan });
    const l = O('sine', 7), lg = G(25);
    l.connect(lg); lg.connect(w.frequency); l.start(t); l.stop(t + 0.5);
  },
};

// ---------------------------------------------------------------- public API
function build() {
  WHITE = makeNoise(false); BROWN = makeNoise(true);
  master = G(muted ? 0 : vol);
  comp = C.createDynamicsCompressor();
  comp.threshold.value = -10; comp.knee.value = 6; comp.ratio.value = 12;
  comp.attack.value = 0.003; comp.release.value = 0.25;
  master.connect(comp); comp.connect(C.destination);
  bedBus = G(1); bedBus.connect(master);
  sfxBus = G(1); sfxBus.connect(master);
  buildDread();
}

export const audio = {
  init() {
    try {
      if (C) {
        if (C.state !== 'running') { const p = C.resume(); if (p && p.catch) p.catch(() => {}); }
        return;
      }
      const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
      if (!AC) return;
      const ctx = new AC();
      C = ctx;
      try { build(); } catch (e) {
        C = null; master = null;
        try { ctx.close(); } catch (e2) { /* ignore */ }
        return;
      }
      if (C.state !== 'running') { const p = C.resume(); if (p && p.catch) p.catch(() => {}); }
      applyDread(); applyScene(); applyItNear();
      ticker = setInterval(tick, 150);
    } catch (e) { /* ignore */ }
  },
  setVolume(v) { try { vol = clamp(v); if (C) applyMaster(0.05); } catch (e) { /* ignore */ } },
  setMuted(b) { try { muted = !!b; if (C) applyMaster(0.03); } catch (e) { /* ignore */ } },
  setScene(name) {
    try {
      if (!['title', 'desk', 'outdoor', 'van', 'silent'].includes(name)) return;
      curScene = name;
      if (C) applyScene();
    } catch (e) { /* ignore */ }
  },
  setItNear(x) { try { itNear = clamp(x); if (C) applyItNear(); } catch (e) { /* ignore */ } },
  setDread(d) { try { dread = clamp(d); if (C) applyDread(); } catch (e) { /* ignore */ } },
  sfx(name, opts = {}) {
    try {
      if (!C || !SFX[name]) return;
      const o = opts || {};
      const g = o.gain == null ? 1 : clamp(o.gain, 0, 2);
      const pan = o.pan == null ? 0 : clamp(o.pan, -1, 1);
      SFX[name](now() + 0.01 + (o.delay > 0 ? +o.delay : 0), o, g, pan);
    } catch (e) { /* ignore */ }
  },
  chargeStart() {
    try {
      if (!C) return;
      audio.chargeStop();
      const t = now(), o = O('sine', 2000), g = G(0);
      o.connect(g); g.connect(sfxBus);
      o.frequency.setValueAtTime(2000, t);
      o.frequency.exponentialRampToValueAtTime(8000, t + 2.5); // then sustains at top
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.022, t + 0.15);
      o.start(t);
      charge = { o, g };
    } catch (e) { /* ignore */ }
  },
  chargeStop() {
    try {
      if (!C || !charge) return;
      const { o, g } = charge, t = now();
      charge = null;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.setTargetAtTime(0, t, 0.004);
      o.stop(t + 0.04);
    } catch (e) { /* ignore */ }
  },
  silence(ms = 1200) {
    try {
      if (!C || !master) return;
      silenced = true;
      clearTimeout(silenceTimer);
      const t = now();
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(0, t);
      silenceTimer = setTimeout(() => {
        try { silenced = false; applyMaster(0.008); } catch (e) { /* ignore */ }
      }, Math.max(0, +ms || 0));
    } catch (e) { /* ignore */ }
  },
  echoStep(surface, delayMs) {
    try {
      if (!C) return;
      const t = now() + 0.01 + Math.max(0, +delayMs || 0) / 1000;
      const side = Math.random() < 0.5 ? -1 : 1;
      const dull = F('lowpass', 2400, 0.6); // slightly muffled: behind you
      dull.connect(sfxBus);
      step(t, surface === 'leaves' ? 'leaves' : 'gravel', side * rnd(0.45, 0.8), 0.6, dull);
    } catch (e) { /* ignore */ }
  },
  get ctx() { return C; },
};

export default audio;
