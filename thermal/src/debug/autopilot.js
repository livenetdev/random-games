// ?autopilot=min|human : plays the game by itself and reports game-clock time.
// 'min' is the fastest the game allows (every hold, read and walk enforced).
// 'human' layers in think time, re-viewing, wrong turns and tool use.
import { shortestPath, NODES } from '../data/nodes.js';
import { REEL, PIN, CARDS } from '../game/acts/act1.js';
import { BY_ID } from '../render/stills.js';
import { mulberry32 } from '../core/rng.js';

export function installAutopilot(g, mode) {
  const human = mode === 'human';
  const R = mulberry32(42);
  const rr = (a, b) => a + (b - a) * R();
  let wait = 0, t0 = null, phase = {};
  const marks = {};
  const think = (a, b) => { if (human) wait = g.time + rr(a, b); };
  const ready = () => g.time >= wait;
  const markScene = (n) => { if (!marks[n]) marks[n] = +(g.time - (t0 ?? g.time)).toFixed(1); };

  const tick = () => {
    try { drive(); } catch (e) { console.error('[autopilot]', e); }
    setTimeout(tick, 16);
  };
  const drive = () => {
    const s = g.scene; if (!s || g.overlay) return;
    if (t0 != null) markScene(s.name);
    if (!ready()) return;
    switch (s.name) {
      case 'title':
        if (!g.bgDone || t0 != null) return;
        g.clearSave(); s.hasSave = false; t0 = g.time; s.act(s.items.indexOf('NEW GAME'));
        return;
      case 'intro': if (s.canSkip()) { s.next(); think(1, 3); } return;
      case 'act1': return act1(s);
      case 'act2': return act2(s);
      case 'act3': return act3(s);
      default:
        if (s.name?.startsWith('ending') && s.done && !phase.end) {
          phase.end = true;
          const total = g.time - t0;
          window.__speedrun = { mode, totalSec: +total.toFixed(1), totalMin: +(total / 60).toFixed(2), sceneStarts: marks, ending: g.state?.ending ?? s.type, film: g.state?.film };
          console.log('[autopilot] done', JSON.stringify(window.__speedrun));
        }
    }
  };

  const act1 = (s) => {
    const st = g.state, v = g.viewer;
    if (s.busy || !v.ready()) return;
    if (s.mode === 'pin') { if (human && !phase.pinWait) { phase.pinWait = true; think(8, 15); return; } s.pinDigit(PIN[s.pin.length]); think(0.4, 1); return; }
    if (human && !phase.cards) {
      // read Walt's cards first, sweeping the threshold over the faded ones
      if (s.mode !== 'cards') { s.openCards(); think(4, 6); return; }
      phase.ci = (phase.ci || 0) + 1;
      if (phase.ci <= CARDS.length) { s.showCard(phase.ci); v.tool.on = phase.ci === 3 || phase.ci === 4; v.tool.level = 0.69; think(6, 12); return; }
      v.tool.on = false; s.closeOverlayMode(); phase.cards = true; think(2, 3); return;
    }
    const def = v.def;
    const an = def?.anomaly;
    if (an && !st.evidence[an.slot]) {
      const hs = v.hotspotsNow().find((h) => h.tag === an.tag);
      if (hs) {
        if (human && phase.searched !== def.id) { phase.searched = def.id; phase.misses = 0; think(15, 40); return; }
        if (human && phase.misses < 1 && R() < 0.6) { phase.misses++; s.circled(10, 10, 40, 40); think(3, 6); return; }
        if (an.need === 'threshold') { s.ctl.toolOn = true; v.tool.on = true; v.tool.level = v.heatAt(hs.x + hs.w / 2, hs.y + hs.h / 2); }
        s.circled(hs.x - 3, hs.y - 3, hs.x + hs.w + 3, hs.y + hs.h + 3);
        s.ctl.toolOn = false; v.tool.on = false;
        think(3, 6);
        if (human && R() < 0.5) { phase.board = true; }
        return;
      }
    }
    if (human && phase.board) { phase.board = false; s.openBoard(); setTimeout(() => {}, 0); think(4, 8); phase.closeBoard = true; return; }
    if (phase.closeBoard) { phase.closeBoard = false; s.closeOverlayMode(); think(1, 2); return; }
    // go back for anything missed (e.g. a burst frame that flew past)
    const missed = REEL.findIndex((id, i) => i <= st.readIdx && BY_ID[id].anomaly && !st.evidence[BY_ID[id].anomaly.slot]);
    if (missed >= 0 && missed < st.reelIdx) { s.step(-1); think(1, 2); return; }
    if (st.reelIdx < REEL.length - 1) {
      if (human && st.reelIdx > 1 && R() < 0.12 && phase.back !== st.reelIdx) { phase.back = st.reelIdx; s.step(-1); think(5, 9); return; }
      s.step(1); think(6, 14);
    }
  };

  const act2 = (s) => {
    const st = g.state;
    if (s.busy) return;
    if (s.mode === 'pin') { s.pinDigit(PIN[s.pin.length]); think(0.5, 1.2); return; }
    if (s.mode === 'thermal') { s.toggleThermal(); think(1, 2); return; }
    if (s.mode === 'map') { s.mode = 'dark'; think(1, 2); return; }
    if (s.charging) {
      const need = human ? 2.6 : 1.55;
      if (g.time - s.chargeT0 >= need) s.release();
      return;
    }
    if (s.camHere()) { s.resetCam(); think(2, 4); return; }
    if (human && phase.lastNode !== st.node) {
      phase.lastNode = st.node; phase.moves = (phase.moves || 0) + 1;
      if (R() < 0.5 && st.battery > 20) { s.toggleThermal(); think(3, 6); return; }
      if (phase.moves % 5 === 0) { s.mode = 'map'; think(5, 8); return; }
      think(4, 9); return;
    }
    const order = ['cam2', 'cam1', 'cam3'];
    const camNode = { cam1: 'meadow', cam2: 'yard', cam3: 'drive' };
    const target = order.find((c) => !st.resets[c]);
    const goal = target ? camNode[target] : 'van';
    let path = shortestPath(st.node, goal, (a, b) => b === 'van' && goal !== 'van');
    if (!path || path.length < 2) return;
    let next = path[1];
    if (human && R() < 0.18) { const ex = Object.values(NODES[st.node].exits).filter((n) => n !== 'van'); next = ex[Math.floor(R() * ex.length)]; }
    const dir = Object.entries(s.exits()).find(([, n]) => n === next)?.[0];
    if (!dir) return;
    s.sel = dir; s.startCharge();
  };

  const act3 = (s) => {
    if (s.busy) return;
    if (s.pos < 3) {
      if (human && phase.a3 !== s.pos) { phase.a3 = s.pos; think(6, 12); if (s.pos >= 1 && g.state.film > 0 && R() < 0.5) s.flash(); return; }
      s.walk(); return;
    }
    if (human && !phase.close) { phase.close = 1; think(20, 35); return; }
    if (human && phase.close === 1 && g.state.film > 0) { phase.close = 2; s.flash(); think(4, 6); return; }
    if (human && phase.close === 2) { phase.close = 3; g.viewer.blink = true; think(6, 10); return; }
    g.viewer.blink = false;
    s.decide(human && R() < 0.3 ? 'it' : 'walt');
  };
  tick();
}
