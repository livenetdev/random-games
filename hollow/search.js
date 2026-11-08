// node search.js [trials] -> names.json : random identifier renamings, keeps the one with the smallest page.
// Deflate output size (and how many bytes need escaping) shifts with the letters used.
const fs = require('fs'), zop = require(process.env.ZOPFLI || '@gfx/zopfli'), R = require('./rename.js');
const js = fs.readFileSync(__dirname + '/min.js', 'utf8'), out = __dirname + '/names.json';
const cost = b => { let e = 0; b.forEach((x, i) => { const n = b[i + 1]; e += x == 0 ? (n > 47 && n < 58 ? 3 : 1) : x == 13 || x == 92 || x == 96 || (x == 36 && n == 123) ? 1 : 0 }); return b.length + e };
const run = (s, it) => new Promise(r => zop.deflate(Buffer.from(s), { numiterations: it }, (e, b) => r(b)));
const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0;[a[i], a[j]] = [a[j], a[i]] } return a };
const POOL = 'abdfghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''); // not c e x y z w
(async () => {
  const cur = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out)) : null;
  let best = cost(await run(R.apply(js, cur), 1000)); console.log('current', best);
  for (let t = 0; t < (+process.argv[2] || 500); t++) {
    const map = { js: shuf(POOL).slice(0, R.JS.length), gl: shuf(POOL).slice(0, R.GL.length) }, s = R.apply(js, map);
    if (cost(await run(s, 30)) > best + 2) continue;
    const c = cost(await run(s, 1000));
    if (c < best) { best = c; fs.writeFileSync(out, JSON.stringify(map)); console.log(t, best, JSON.stringify(map)); }
  }
})();
