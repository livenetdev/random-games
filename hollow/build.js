// node build.js -> index.html   (needs: npm i @gfx/zopfli, or ZOPFLI=path/to/it)
// 1. GLSL: strip comments/whitespace, inline into game.js -> min.js, then rename identifiers (names.json)
// 2. zopfli deflate-raw min.js
// 3. Put the raw bytes in a JS template literal on an ISO-8859-15 page (<meta charset=l9>).
//    Every byte decodes to the same code point except 8 in 0xA4-0xBE (€ Š š Ž ž Œ œ Ÿ),
//    so a lookup string made of the raw bytes 0xA4-0xBE maps chars back to bytes.
//    Bytes that would break the literal get JS escapes: NUL->\0 CR->\r \->\\ `->\` ${->\${
// 4. DecompressionStream inflates it, eval runs it.
const fs = require('fs'), zlib = require('zlib'), r = f => fs.readFileSync(__dirname + '/src/' + f, 'utf8');
const glsl = r('shader.glsl').replace(/\/\/.*$/gm, '').split('\n').map(l => l.trim()).filter(Boolean)
  .map(l => l[0] == '#' ? l + '\n' : l.replace(/\s+/g, ' ').replace(/ ?([{}()\[\];,=+\-*\/<>!?:&|.]) ?/g, '$1')).join('');
const src = r('game.js').replace(/\n(?!void)/g, '').replace('__Z__', '`' + glsl + '`');
fs.writeFileSync(__dirname + '/min.js', src);
// identifier letters picked by search.js for the smallest output (names.json); readable names stay in src/
const names = fs.existsSync(__dirname + '/names.json') ? JSON.parse(fs.readFileSync(__dirname + '/names.json')) : null;
const js = require('./rename.js').apply(src, names);
require(process.env.ZOPFLI || '@gfx/zopfli').deflate(Buffer.from(js), { numiterations: +(process.env.IT || 500) }, (e, bin) => {
  if (zlib.inflateRawSync(bin).toString() !== js) throw 'deflate mismatch';
  let lit = '';
  bin.forEach((b, i) => {
    const n = bin[i + 1];
    lit += b == 0 ? (n > 47 && n < 58 ? '\\x00' : '\\0') : b == 13 ? '\\r' : b == 92 ? '\\\\' : b == 96 ? '\\`'
      : b == 36 && n == 123 ? '\\$' : String.fromCharCode(b);
  });
  const T = '\x01'.repeat(27); // placeholder for the 0xA4..0xBE lookup bytes
  const page = `<meta charset=l9><script>new Response(new Response(Uint8Array.from(\`${lit}\`,c=>~(i="${T}".indexOf(c))?i+164:c.charCodeAt())).body.pipeThrough(new DecompressionStream("deflate-raw"))).text().then(eval)</script>`;
  const out = Buffer.from(page, 'latin1'), at = out.indexOf(Buffer.from(T, 'latin1'));
  for (let k = 0; k < 27; k++) out[at + k] = 164 + k;
  if (/<\/script|<!--/i.test(out.toString('latin1').slice(25, -9))) throw 'HTML-unsafe sequence in data; tweak the source';
  fs.writeFileSync(__dirname + '/index.html', out);
  console.log('glsl', glsl.length, 'js', js.length, 'deflated', bin.length, 'escapes', lit.length - bin.length, 'TOTAL', out.length);
});
