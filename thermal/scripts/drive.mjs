// Dev driver: node scripts/drive.mjs '<js steps>' — runs the game in headless Chromium.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const url = process.env.URL || 'http://localhost:5173/?skipwarn=1';
const outDir = process.env.OUT || '.';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 960, height: 600 } });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !m.text().includes('GPU stall')) { errors.push(m.text()); console.log('[console]', m.type(), m.text()); } });
page.on('pageerror', (e) => { errors.push(e.message); console.log('[pageerror]', e.message, e.stack); });
await page.goto(url);
const api = {
  page,
  wait: (ms) => page.waitForTimeout(ms),
  scene: () => page.evaluate(() => window.__game.scene?.name),
  until: async (fn, timeout = 600000) => page.waitForFunction(fn, null, { timeout, polling: 250 }),
  key: async (k, hold = 60) => { await page.keyboard.down(k); await page.waitForTimeout(hold); await page.keyboard.up(k); },
  shot: async (name) => { await page.locator('#screen').screenshot({ path: `${outDir}/${name}.png` }); console.log('shot', name); },
  ev: (fn, arg) => page.evaluate(fn, arg),
};
const steps = (await import(process.argv[2])).default;
try { await steps(api); } catch (e) { console.log('STEP ERROR', e.message); }
console.log('errors:', errors.length);
await browser.close();
