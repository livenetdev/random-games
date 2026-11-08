// Copies node_modules/roadroller -> rr126/ and patches it:
// ANS output in base 126 (chars 0x01-0x7F minus CR), read from a raw <plaintext> tail
// instead of a 6-bit JS string literal (~14% smaller), and size estimate = raw bytes.
const fs=require('fs'),d=__dirname,src=d+'/node_modules/roadroller',dst=d+'/rr126';
fs.cpSync(src,dst,{recursive:true});
let s=fs.readFileSync(dst+'/index.mjs','utf8');
const rep=(a,b)=>{if(!s.includes(a))throw 'patch miss: '+a.slice(0,60);s=s.replace(a,b)};
rep('const outBits = 6;','const outBits = -126;');
const i=s.indexOf('const sixBit = c =>'),j=s.indexOf("firstLine += `'`;")+17;
s=s.slice(0,i)+`const enc = c => c < 114 ? c + 14 : c - 113;
        const stateBytes = []; let st = state;
        while (st > 0) { stateBytes.unshift(st % 126); st = Math.floor(st / 126); }
        let DATA = ''; for (const c of [...stateBytes, ...buf]) DATA += String.fromCharCode(enc(c));
        let firstLine = 'ι=z.textContent';`+s.slice(j);
rep("`τ<${pow2(28 - outBits)}`","`τ<${pow2(21)}`");
rep("`τ=τ*${1<<outBits}|ι.charCodeAt(ρ++)&${(1 << outBits) - 1}`","`τ=τ*126+(ι.charCodeAt(ρ++)+113)%127`");
rep('firstLineLengthInBytes: bufLengthInBytes,','firstLineLengthInBytes: bufLengthInBytes, data: DATA,');
rep('constructor({ firstLine, firstLineLengthInBytes, secondLine, freeVars }) {','constructor({ firstLine, firstLineLengthInBytes, secondLine, freeVars, data }) {\n        this.data = data;');
rep('estimateLength() {','estimateLength() {\n        return this.data.length + this.firstLine.length + this.secondLine.length;');
rep('const maxState = size * outSymbols << stateShift;','const maxState = size * outSymbols << stateShift; if (!(maxState > 0) || stateShift < 0) throw new Error("bad");');
rep('const result = Packer.doPack(preparedText, preparedJs, mainInputAction, options);\n            if (maxAbbreviations','let result; try { result = Packer.doPack(preparedText, preparedJs, mainInputAction, options); } catch (e) { return 1e9; }\n            if (maxAbbreviations');
fs.writeFileSync(dst+'/index.mjs',s);
let c=fs.readFileSync(dst+'/cli.mjs','utf8');
c=c.replace("fs.writeFileSync(outputPath, output, { encoding: 'utf-8' });","fs.writeFileSync(outputPath, output, { encoding: 'utf-8' }); fs.writeFileSync(outputPath + '.data', packed.data, 'latin1');");
fs.writeFileSync(dst+'/cli.mjs',c);
console.log('rr126 ready');
