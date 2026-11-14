// npm run speedrun : plays the whole game twice in headless Chromium.
//   min   = fastest possible route (every enforced hold, read and walk)
//   human = a realistic first playthrough model (think time, tools, wrong turns)
// Game time is measured on the game clock (runs accelerated via ?timescale).
import { createServer } from 'vite';
import { createRequire } from 'module';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const profile = path.join(root, 'node_modules', '.thermal-profile');
mkdirSync(profile, { recursive: true });
const server = await createServer({ root, logLevel: 'error', server: { port: 5198, strictPort: false } });
await server.listen();
const port = server.config.server.port;
const args = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'];
const ctx = await chromium.launchPersistentContext(profile, { args, viewport: { width: 640, height: 400 } });
const results = {};
for (const mode of (process.argv[2] ? [process.argv[2]] : ['min', 'human'])) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const ts = +(process.env.TS || 6);
  await page.goto(`http://localhost:${port}/?skipwarn=1&autopilot=${mode}&timescale=${ts}&seed=1103`);
  const t0 = Date.now();
  while (!(await page.evaluate(() => !!window.__speedrun))) {
    await page.waitForTimeout(15000);
    const p = await page.evaluate(() => { const g = window.__game; const s = g.state; return `${g.scene?.name} t=${g.time.toFixed(0)} loaded=${g.bank.mem.size} bg=${!!g.bgDone} ${s ? `reel=${s.reelIdx} ev=${Object.keys(s.evidence).length} node=${s.node} film=${s.film} resets=${Object.keys(s.resets)}` : ''} busy=${!!g.scene?.busy} mode=${g.scene?.mode}`; });
    console.log(`[${mode} ${((Date.now() - t0) / 1000) | 0}s] ${p}`, errors.slice(-2).join(' | '));
    if (Date.now() - t0 > 3600000) throw new Error('timeout');
  }
  results[mode] = { ...(await page.evaluate(() => window.__speedrun)), errors };
  console.log(mode, JSON.stringify(results[mode]));
  await page.close();
}
writeFileSync(path.join(root, 'docs', 'speedrun.json'), JSON.stringify(results, null, 1));
const ok = (results.min?.totalMin ?? 99) >= 8 && (results.human?.totalMin ?? 99) >= 12;
console.log(ok ? 'PACING OK (min >= 8, realistic >= 12)' : 'PACING CHECK FAILED');
await ctx.close();
await server.close();
