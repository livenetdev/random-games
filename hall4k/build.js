// node build.js -> index.html. terser (minify) + roadroller (context-mixing packer). Budget: 4096 bytes.
const fs=require('fs'),R=process.env.NODE_MODS||'',{minify}=require(R+'terser'),P=import(R+'roadroller/index.mjs');
(async()=>{
 const js=(await minify(fs.readFileSync(__dirname+'/src.js','utf8'),{toplevel:true,compress:{passes:3,unsafe:true,unsafe_math:true}})).code;
 const {Packer}=await P,pk=new Packer([{data:js,type:'js',action:'eval'}],{});
 await pk.optimize(2);
 const {firstLine,secondLine}=pk.makeDecoder();
 const html=`<body style=margin:0;background:#000><canvas id=c style=width:100vw;height:100vh;object-fit:contain;image-rendering:pixelated></canvas><p id=T style="position:fixed;bottom:6%;width:100%;text-align:center;color:#a98;font:italic 3.2vh serif;letter-spacing:.08em;transition:opacity 2s;opacity:0"></p><script>${firstLine+secondLine}</script>`;
 fs.writeFileSync(__dirname+'/index.html',html);
 console.log('min '+js.length+' -> html '+Buffer.byteLength(html)+' bytes');
})();
