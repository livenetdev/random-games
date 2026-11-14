// Dev helper: node scripts/shot.mjs "<query>" out.png
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [, , query = '', out = 'shot.png', port = '5173'] = process.argv;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 980, height: 640 } });
page.on('console', (m) => console.log('[console]', m.text()));
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`http://localhost:${port}/${process.env.PAGE || "test.html"}?${query}`);
await page.waitForFunction(() => window.__done, null, { timeout: 120000 });
console.log(await page.textContent('#log'));
await page.locator('canvas').screenshot({ path: out });
await browser.close();
