// npm run manifest : thumbnails (from docs/stills) + manifest table into README.md
import { createRequire } from 'module';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stills = JSON.parse(readFileSync(path.join(root, 'src/data/stills.json'), 'utf8'));
const src = path.join(root, 'docs/stills'), out = path.join(root, 'docs/thumbs');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<canvas id=c width=160 height=100></canvas>');
let n = 0;
for (const s of stills) {
  const f = path.join(src, `${s.id}.png`);
  if (!existsSync(f)) continue;
  const b64 = readFileSync(f).toString('base64');
  const png = await page.evaluate(async (d) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + d; await img.decode();
    const c = document.getElementById('c'); const x = c.getContext('2d');
    x.imageSmoothingEnabled = false; x.drawImage(img, 0, 0, 160, 100);
    return c.toDataURL('image/png');
  }, b64);
  writeFileSync(path.join(out, `${s.id}.png`), Buffer.from(png.split(',')[1], 'base64'));
  n++;
}
await browser.close();
const actName = { 0: 'Title / intro', 1: 'Act I', 2: 'Act II', 3: 'Act III', 4: 'Endings', 9: 'Subliminal' };
const rows = stills.map((s) => {
  const thumb = existsSync(path.join(out, `${s.id}.png`)) ? `![${s.id}](docs/thumbs/${s.id}.png)` : '';
  const ts = [s.time, s.date].filter(Boolean).join(' ');
  return `| ${thumb} | \`${s.id}\` | ${actName[s.act] ?? s.act} | ${s.scene}/${s.variant || s.kind || '-'} | ${s.mode} | ${s.cam || s.style} | ${s.lut} | ${ts} |`;
});
const table = [`${stills.length} stills (${stills.filter((s) => s.variantOf).length} change-variants, ${stills.filter((s) => s.act === 9).length} subliminal inserts). Full-size renders in \`docs/stills/\`.`, '',
  '| | id | act | scene/variant | pass | camera | LUT | timestamp |', '|---|---|---|---|---|---|---|---|', ...rows].join('\n');
const readme = readFileSync(path.join(root, 'README.md'), 'utf8');
writeFileSync(path.join(root, 'README.md'), readme.replace(/<!-- STILLS:BEGIN -->[\s\S]*<!-- STILLS:END -->/, `<!-- STILLS:BEGIN -->\n${table}\n<!-- STILLS:END -->`));
console.log(`${n} thumbnails, ${stills.length} manifest rows`);
