// Inlines src/ into a single self-contained index.html.  node build.js
const fs=require('fs'),path=require('path');
const src=f=>fs.readFileSync(path.join(__dirname,'src',f),'utf8');
const shader=src('shader.glsl').trim();
const game=src('game.js').replace('__SHADER__',()=>JSON.stringify(shader));
const html=src('shell.html').replace('/*GAME*/',()=>game);
fs.writeFileSync(path.join(__dirname,'index.html'),html);
console.log('index.html',(Buffer.byteLength(html)/1024).toFixed(1)+' KB');
