// npm run stills [-- --ids a,b] : renders every still to docs/stills/*.png via headless Playwright.
import { createServer } from 'vite';
import { createRequire } from 'module';
import { mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const idsArg = process.argv.includes('--ids') ? process.argv[process.argv.indexOf('--ids') + 1] : '';
const res = process.argv.includes('--256') ? 256 : 320;
const out = path.join(root, 'docs', res === 256 ? 'stills256' : 'stills');
mkdirSync(out, { recursive: true });
const server = await createServer({ root, logLevel: 'error', server: { port: 5199, strictPort: false } });
await server.listen();
const port = server.config.server.port;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('[pageerror]', e.message));
await page.goto(`http://localhost:${port}/stills.html?w=${res}${idsArg ? `&ids=${idsArg}` : ''}`);
await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
const list = await page.evaluate(() => window.__list);
const meta = {};
let i = 0;
for (const id of list) {
  const r = await page.evaluate((x) => window.__render(x), id);
  writeFileSync(path.join(out, `${id}.png`), Buffer.from(r.png.split(',')[1], 'base64'));
  meta[id] = { ms: r.ms, hotspots: r.hotspots };
  process.stdout.write(`\r${++i}/${list.length} ${id}            `);
}
if (!idsArg) writeFileSync(path.join(out, 'index.json'), JSON.stringify(meta, null, 1));
console.log(`\nwrote ${list.length} stills to ${path.relative(root, out)}/`);
await browser.close();
await server.close();
