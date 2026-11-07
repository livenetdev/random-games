// node build.js -> ward9/index.html : one file, JS+GLSL deflated (zopfli), 7-bit packed, self-unpacked
// needs: npm i terser @gfx/zopfli  (or set TERSER / ZOPFLI to their paths)
const fs = require('fs'), z = require('zlib'), path = require('path');
const T = process.env.TERSER || 'terser';
const zop = (buf, cb) => require(process.env.ZOPFLI || '@gfx/zopfli').deflate(buf, { numiterations: 100 }, cb);
const src = f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
let glsl = src('shader.glsl').replace(/\/\/.*$/gm, '').split('\n').map(l => l.trim()).filter(Boolean)
  .map(l => l.startsWith('#') ? '\n' + l + '\n' : l.replace(/\s*([{}()\[\];,=+\-*\/<>!?:&|])\s*/g, '$1')).join('').replace(/\n+/g, '\n').trim();
// shorten our own GLSL identifiers
const ids = 'ent te esh lamp LC hw hf hc bump mat brdf shade aoc ALB RG EMI TL em h1 ns fb wl rot cap sm near tm ss fg den lu vq fr cone dd li ll tq cp sp sw oc tp te0 nb fd fu tg tu tv ty rb bd hp hd sk ap sg sv e0 w0 ar ag pe pl gr wet pud dirt bl rr lv ck'.split(' ');
const used = new Set(glsl.match(/\b[A-Za-z_]\w*\b/g));
const pool = []; for (const a of 'abcdfghijklmnpqrsuvwxyzBCFIJKLOUVWXYZ') pool.push(a); for (const a of 'abcdfghjklmnpqrsuvwxyz') for (const b of 'abcdfghjklmnpqrsuvwxyz0123456789') pool.push(a + b);
const free = pool.filter(n => !used.has(n));
ids.forEach((id, i) => { glsl = glsl.replace(new RegExp('\\b' + id + '\\b', 'g'), free[i]); });
require(T).minify(src('game.js'), { toplevel: true, compress: { passes: 3, unsafe: true, unsafe_arrows: true }, mangle: true }).then(r => {
  const js = r.code.replace(/(["'])__Z__\1/, JSON.stringify(glsl));
  zop(Buffer.from(js), (e, bin) => {
    if (process.env.CHECK) require('assert').equal(z.inflateRawSync(bin).toString(), js);
    // 7-bit packing into a String.raw template: 8 bits -> 7, unsafe code units moved to U+00A0..
    const U = [0, 13, 36, 60, 92, 96]; let acc = 0, n = 0, out = '';
    const put = v => { const k = U.indexOf(v); out += String.fromCharCode(k < 0 ? v : 160 + k); };
    for (const by of bin) { acc = (acc << 8) | by; n += 8; while (n >= 7) { n -= 7; put((acc >> n) & 127); } acc &= (1 << n) - 1; }
    if (n) put((acc << (7 - n)) & 127);
    const boot = `a=n=0,b=[];for(c of String.raw\`${out}\`)c=c.charCodeAt(),a=(a<<7|(c>127?[0,13,36,60,92,96][c-160]:c))&32767,(n+=7)>7&&b.push(a>>(n-=8)&255);new Response(new Blob([new Uint8Array(b)]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text().then(eval)`;
    const html = src('shell.html').replace(/\n/g, '').replace('__JS__', () => boot);
    fs.writeFileSync(path.join(__dirname, 'index.html'), html);
    console.log('glsl', glsl.length, 'js', js.length - glsl.length, 'deflated', bin.length, 'TOTAL', Buffer.byteLength(html));
  });
});
