// node build.js -> ward4k/index.html : one file, JS+GLSL deflated (zopfli), 7-bit packed, self-unpacked
// needs: npm i terser @gfx/zopfli  (or set TERSER / ZOPFLI to their paths)
const fs = require('fs'), z = require('zlib'), path = require('path');
const T = process.env.TERSER || 'terser';
const zop = (buf, cb) => require(process.env.ZOPFLI || '@gfx/zopfli').deflate(buf, { numiterations: 100 }, cb);
const src = f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
let glsl = src('shader.glsl').replace(/\/\/.*$/gm, '').split('\n').map(l => l.trim()).filter(Boolean)
  .map(l => l.startsWith('#') ? '\n' + l + '\n' : l.replace(/\s*([{}()\[\];,=+\-*\/<>!?:&|])\s*/g, '$1')).join('').replace(/\n+/g, '\n').trim();
// shorten our own GLSL identifiers
const ids = 'c3 oc lc al ao rg dd lp o2 o3 dn g2 pc e2'.split(' ');
const used = new Set(glsl.match(/\b[A-Za-z_]\w*\b/g));
const pool = []; for (const a of 'abcdfghijklmnpqrsuvwxyzBCFIJKLOUVWXYZ') pool.push(a); for (const a of 'abcdfghjklmnpqrsuvwxyz') for (const b of 'abcdfghjklmnpqrsuvwxyz0123456789') pool.push(a + b);
const free = pool.filter(n => !used.has(n));
ids.forEach((id, i) => { glsl = glsl.replace(new RegExp('\\b' + id + '\\b', 'g'), free[i]); });
require(T).minify(src('game.js'), { toplevel: true, compress: { passes: 3, unsafe: true, unsafe_arrows: true }, mangle: true }).then(r => {
  const js = r.code.replace(/(["'])__Z__\1/, JSON.stringify(glsl));
  if (process.env.SHOW) console.log(glsl);
  if (process.env.PARTS) console.log('glsl-z', z.deflateRawSync(glsl,{level:9}).length, 'js-z', z.deflateRawSync(r.code,{level:9}).length);
  zop(Buffer.from(js), (e, bin) => {
    if (process.env.CHECK) require('assert').equal(z.inflateRawSync(bin).toString(), js);
    // base-122-style packing: 7-bit chunks in a String.raw literal; an illegal chunk is folded with the next chunk into one 2-byte char
    const U = [0, 13, 36, 60, 92, 96], ch = []; let acc = 0, n = 0, out = '';
    for (const by of bin) { acc = (acc << 8) | by; n += 8; while (n >= 7) { n -= 7; ch.push((acc >> n) & 127); } acc &= (1 << n) - 1; }
    // final partial chunk: pick padding bits that avoid an escaped value; aligned tail: pair an escaped value with a dummy chunk
    if (n) { const v = (acc << (7 - n)) & 127; ch.push(U.includes(v) ? [...Array(1 << (7 - n)).keys()].map(p => v | p).find(x => !U.includes(x)) : v); }
    else if (U.includes(ch.at(-1))) ch.push(0);
    for (let i = 0; i < ch.length; i++) { const k = U.indexOf(ch[i]); if (k < 0) out += String.fromCharCode(ch[i]); else { if (i == ch.length - 1) throw 'tail'; out += String.fromCharCode(160 + (k << 7 | ch[++i])); } }
    const boot = `A=N=0,B=[];for(Z of String.raw\`${out}\`)for(Z=Z.charCodeAt(),D=Z>127?[[0,13,36,60,92,96][(Z-=160)>>7],Z&127]:[Z];D.length;)A=(A<<7|D.shift())&32767,(N+=7)>7&&B.push(A>>(N-=8)&255);new Response(new Response(new Uint8Array(B)).body.pipeThrough(new DecompressionStream("deflate-raw"))).text().then(eval)`;
    if (process.env.CHECK) { let A = 0, N = 0; const B = []; for (let Z of out) for (Z = Z.charCodeAt(), D = Z > 127 ? [U[(Z -= 160) >> 7], Z & 127] : [Z]; D.length;) A = A << 7 | D.shift(), (N += 7) > 7 && B.push(A >> (N -= 8) & 255); require('assert').deepEqual(Buffer.from(B), bin); }
    const html = src('shell.html').replace(/\n/g, '').replace('__JS__', () => boot);
    fs.writeFileSync(path.join(__dirname, 'index.html'), html);
    console.log('glsl', glsl.length, 'js', js.length - glsl.length, 'deflated', bin.length, 'TOTAL', Buffer.byteLength(html));
  });
});
