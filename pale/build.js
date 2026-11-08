// npm i && npm run build -> index.html (exit 1 if > 4096 bytes)
// pipeline: GLSL whitespace strip -> terser -> roadroller (patched: base-126 ANS digits, read from a raw <plaintext> tail)
const fs=require('fs'),{execSync}=require('child_process'),d=__dirname,RR=process.env.RR||d+'/rr126',T=process.env.TERSER||d+'/node_modules/.bin/terser',tmp=process.env.TMP||require('os').tmpdir();
let fsrc=fs.readFileSync(d+'/src/shader.frag','utf8')
 .replace(/\/\/.*$/gm,'').replace(/\s+/g,' ')
 .replace(/ ?([{}()\[\];,=+\-*\/<>?:&|!]) ?/g,'$1')
 .replace('#version 300 es','#version 300 es\n').trim();
let js=fs.readFileSync(d+'/src/game.js','utf8').replace('FS','`'+fsrc+'`');
fs.writeFileSync(tmp+'/pale.in.js',js);
execSync(`${T} ${tmp}/pale.in.js -c passes=3,unsafe=true -o ${tmp}/pale.min.js`);
execSync(`node ${RR}/cli.mjs ${tmp}/pale.min.js -O${process.env.O||1} ${process.env.RRF??'-D'} -q -o ${tmp}/pale.rr.js`,{stdio:'inherit'});
const rr=fs.readFileSync(tmp+'/pale.rr.js','utf8').trim().replace(/\[0(,0)+\]/,m=>`Array(${m.length>>1}).fill(0)`).replace('eval(r=a=','eval('),data=fs.readFileSync(tmp+'/pale.rr.js.data','latin1');
if(/[\0\r\x80-\uffff]/.test(data))throw 'bad data char';
let html=fs.readFileSync(d+'/src/shell.html','utf8').trim().replace('JS',()=>rr).replace('DATA',()=>data);
fs.writeFileSync(d+'/index.html',html,'latin1');
const n=fs.statSync(d+'/index.html').size;
console.log('shader',fsrc.length,'| js',fs.statSync(tmp+'/pale.min.js').size,'| decoder',rr.length,'| data',data.length,'| html',n,n>4096?'OVER by '+(n-4096):'OK, '+(4096-n)+' spare');
if(n>4096)process.exit(1);
