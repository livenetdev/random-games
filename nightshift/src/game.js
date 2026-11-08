'use strict';
const FS=__SHADER__;
const TAU=Math.PI*2,WT=.6,ZP=1.25,SPAWN=32,WL=16,OMEGA=5.2,FORG=.06,GRAZE=.25,TICK=1/60,DRIFT=.72,MAXW=28,MAXO=16;
const $=i=>document.getElementById(i);
const mod=(a,b)=>((a%b)+b)%b,clamp=(x,a,b)=>x<a?a:x>b?b:x;
const ROMAN=['I','II','III','IV','V','VI','VII','VIII','IX'];
const fmt=n=>Math.floor(n).toLocaleString('en-US');
function mulberry32(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const ri=(r,n)=>Math.floor(r()*n);
const full=n=>(1<<n)-1;
const rot=(m,k,n)=>{k=mod(k,n);return((m<<k)|(m>>(n-k)))&full(n)};
const angD=(a,b)=>{const d=mod(a-b,TAU);return Math.min(d,TAU-d)};
const vib=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}};

// ---------------------------------------------------------------- save
const SKEY='nightshift.v1';
const defSave=()=>({best:0,bestWard:0,runs:0,embers:0,xp:0,lvl:1,up:{mag:0,kin:0,sh:0,grz:0},col:0,owned:[0],missions:[],mtier:{},grazeTotal:0,streak:0,lastDay:'',startWard:0,mute:false,daily:{},beyond:false,pb:{},files:[],hairBest:9,ghosts:{},ach:[],hist:[],pbSeed:'',cutSeed:'',cond:[],vigil:{unb:0,s:0}});
let SV=defSave();
try{const j=JSON.parse(localStorage.getItem(SKEY));if(j&&typeof j==='object')SV=Object.assign(defSave(),j,{up:Object.assign(defSave().up,j.up||{})})}catch(e){}
const save=()=>{try{localStorage.setItem(SKEY,JSON.stringify(SV))}catch(e){}};
const dstr=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const today=()=>dstr(new Date());
const yesterday=()=>{const d=new Date();d.setDate(d.getDate()-1);return dstr(d)};
const dayNo=()=>Math.floor((new Date(today())-new Date('2026-01-01'))/864e5)+1;

// ---------------------------------------------------------------- content
//            name             sides speed spin tight hue
const WARDS=[['Admissions',     6, 8,   .35, 1.12,.58],
             ['The Long Hall',  6, 9,   .6,  .94, .62],
             ['Isolation',      8, 9.8, .75, .9,  .75],
             ['Boiler Room',    6, 10.8,1,   .86, .03],
             ['Chapel',         5, 11.6,.95, .82, .13],
             ['Morgue',         8, 12.4,1.2, .78, .5],
             ['Records',        6, 13.2,1.4, .75, .32],
             ['The Roof',       7, 14,  1.6, .72, .86],
             ['Ward Nine',      6, 15,  1.9, .7,  .97]];
function wardP(i){
  if(i<9){const w=WARDS[i];return{name:w[0],n:w[1],v:w[2],spin:w[3],tight:w[4],hue:w[5],num:ROMAN[i]}}
  const k=i-8;
  return{name:'Beyond · depth '+k,n:[6,8,5,7][k%4],v:15+.6*k,spin:Math.min(3.2,1.9+.12*k),tight:Math.max(.6,.7-.012*k),hue:mod(.97+k*.137,1),num:'∞'}
}
const PAT={
  gate:(n,r)=>[{dt:.85,m:full(n)&~(1<<ri(r,n))}],
  twin:(n,r)=>{const g=ri(r,n),h=(g+(n>>1))%n;return[{dt:.8,m:full(n)&~(1<<g)&~(1<<h)}]},
  pinch:(n,r)=>{const o=[];for(let i=2+ri(r,3);i--;)o.push({dt:.42,m:1<<ri(r,n)});return o},
  comb:(n,r)=>{let m=0;for(let i=0;i<n;i+=2)m|=1<<i;return[{dt:.75,m:rot(m,ri(r,n),n)}]},
  cage:(n,r)=>{let m=0;for(let i=0;i<n;i+=2)m|=1<<i;m=rot(m,ri(r,n),n);const o=[];for(let i=3+ri(r,3);i--;){o.push({dt:.42,m});m=full(n)&~m}return o},
  half:(n,r)=>{const h=Math.ceil(n/2);let b=ri(r,n);const o=[];for(let i=3+ri(r,3);i--;){o.push({dt:.55,m:rot(full(h),b,n)});b+=n>>1}return o},
  spiral:(n,r)=>{let g=ri(r,n);const d=r()<.5?1:-1,o=[];for(let i=5+ri(r,4);i--;){o.push({dt:.3,m:full(n)&~(1<<g)&~(1<<mod(g+d,n))});g=mod(g+d,n)}return o},
  rail:(n,r)=>{let g=ri(r,n);const o=[],c=4+ri(r,3),s=1+ri(r,c-1);for(let i=0;i<c;i++){if(i===s)g=mod(g+(r()<.5?1:-1),n);o.push({dt:.22,m:full(n)&~(1<<g)})}return o},
};
const POOL=[['gate','twin','pinch','gate'],['gate','twin','pinch','comb','half'],['gate','comb','half','spiral','twin','pinch'],
            ['gate','comb','half','spiral','rail','twin'],['comb','half','spiral','rail','cage','gate','twin']];
const FILES=[
'INTAKE 23:58. One porter on shift. One lamp signed out. Lamp not returned since.',
'Corridors were surveyed at 40 m. Night staff log 400. Nobody has walked back to check.',
'Embers are what is left when the lamp touches something it should not. Keep them. They remember warmth.',
'Hall lights fail in sequence, far end first. Staff call it "the walk". It is walking toward you.',
'Scorch marks on the panels at hip height. Same height as a lamp held low.',
'Memo: do not run. Running lengthens the hall. Walk at the speed of the music.',
'Eight-sided rooms leave no corner to hide in. That was the point. Whose point is unclear.',
'Patient 0819 asked for the lights on. Request logged. Request is still being processed.',
'The red lamp at the end of every hall is not an exit sign. Exit signs are green.',
'Pressure gauges read in years, not bar. Needle at 38.',
'Something down here feeds on spin. The walls turn faster when you look away.',
'Scratched into a pipe: "it cannot take the flame, only the hand holding it."',
'Five pews, five walls, five names on the board. Four crossed out in your handwriting.',
'The organ plays the same bassline as the corridor. It started first.',
'Votive candles here burn downward, into the floor.',
'Drawer tags list time of death as "during shift". Every one.',
'Cold air moves toward the lamp, not away. Moths do the same.',
'One drawer is warm. Do not file a report about the warm drawer.',
'Your personnel file is thicker than the building. Most pages are graze reports.',
'Shift length field: 16 s. Repeated on every page. "Typo," says a sticky note, in red.',
'Last page: "Retain porter. Porter does not know. Porter keeps coming back."',
'There is no sky. The roof continues down.',
'Seven antennas broadcast one word on a loop: again.',
'From up here the red lamp below looks exactly like yours.',
'Ward Nine has one bed, made, still warm. Name card blank.',
'The red lamp is carried by someone walking up. Same gait. Same shift.',
'Handover complete. Lamp signed back in. A new porter signs it out. 23:58.'];
const FCOND=[w=>'reach Ward '+w,w=>'graze 12 inside Ward '+w+' in one shift',w=>'catch a gold ember in Ward '+w];
function unlock(w,k){
  if(w>8||S.mode!=='play')return;const id=w*3+k;if(SV.files.includes(id))return;
  SV.files.push(id);save();S.newFiles.push(id);toast('▤ FILE '+ROMAN[w]+'-'+(k+1)+' recovered');AU.file();if(SV.files.length>=27)ach('files');
}
const enc=a=>{let s='';const b=new Uint8Array(a.buffer);for(let i=0;i<b.length;i+=8192)s+=String.fromCharCode.apply(null,b.subarray(i,i+8192));return btoa(s)};
const dec=t=>{const b=atob(t),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return new Uint16Array(u.buffer)};
const hex=n=>(n>>>0).toString(16).toUpperCase().padStart(8,'0');
const ACH=[['first','First light','Finish a shift',10],['w5','Chapel bells','Reach Ward V',40],['w9','Ward Nine','Reach Ward IX',80],
  ['beyond','Walked out','Survive Ward Nine',150],['hair','Hairline','Graze within 1.0°',30],['chain25','Chain 25','Build a 25 chain',40],
  ['x8','×8','Hit the ×8 multiplier',60],['turbo','White heat','Release a white-hot flare',20],['turbo3','Bonfire','3 white-hot flares in one shift',50],
  ['ghost','Ghostbuster','Outlast a ghost lantern',40],['miser','Miser','4K Cut: reach 60 s with 4,096+ ticks left',60],['gold5','Gold rush','5 gold embers in one shift',40],
  ['heat','Feverish','Finish a shift at +100% heat',60],['unbroken','Unbroken','Hold a vigil 120 s without a hit',50],['files','Archivist','Recover all 27 case files',100],['week','Regular','Play 7 days in a row',70],['rank17','Resident','Reach rank 17',60]];
function ach(id){if(SV.ach.includes(id))return;const a=ACH.find(x=>x[0]===id);if(!a)return;SV.ach.push(id);SV.embers+=a[3];save();toast('★ '+a[1]+' · +'+a[3]+' ✦');AU.mission()}
const CONDS=[['brittle','Brittle','Side contact kills. No sliding along walls.',.25],['dark','Blackout','Fog closes in; the lantern reaches half as far.',.2],
  ['vert','Vertigo','The tunnel spins 1.6× faster.',.2],['fast','Overtime','Everything moves 15% faster.',.3],['mirror','Mirror','Left and right are swapped.',.15],
  ['tight','Short fuse','Walls arrive closer together.',.3],['barren','Barren','No embers spawn.',.4]];
const condBits=ids=>CONDS.reduce((b,c,i)=>b|(ids.includes(c[0])?1<<i:0),0);
const bitsCond=b=>CONDS.filter((c,i)=>b&(1<<i)).map(c=>c[0]);
const heatOf=ids=>CONDS.reduce((h,c)=>h+(ids.includes(c[0])?c[3]:0),0);
const codeOf=(seed,bits)=>'NS-'+hex(seed)+'-'+bits.toString(36).toUpperCase();
function parseCode(t){const m=/^\s*NS-([0-9A-F]{8})-([0-9A-Z]{1,2})\s*$/i.exec(t||'');if(!m)return null;const b=parseInt(m[2],36);return b<128?{seed:parseInt(m[1],16)>>>0,bits:b}:null}
function WP(i,C){C=C||S.C||{};const P=wardP(i);return Object.assign({},P,{v:P.v*(C.fast?1.15:1),spin:P.spin*(C.vert?1.6:1),tight:P.tight*(C.tight?.82:1)})}
const addScore=x=>{S.score+=x*S.hm};
const pbKey=()=>S.vigil?'v':S.cut?'c':S.daily?'d'+today():'n'+(S.bits?'-'+S.bits:'');
const bestFor=()=>S.vigil?(SV.vigil.s||0):S.cut?((SV.pb.c&&SV.pb.c.s)||0):S.daily?(SV.daily[today()]||0):SV.best;
const sgn=d=>(d>=0?'+':'−')+fmt(Math.abs(d));
const RANKS=['Visitor','Patient','Orderly','Nurse','Resident','Surgeon','Chief','Night Warden','The Ninth'];
const rankName=l=>RANKS[Math.min(RANKS.length-1,Math.floor((l-1)/4))];
const xpNeed=l=>Math.floor(900*Math.pow(l,1.35));
const SHOP=[{id:'mag',name:'Moth Lure',desc:'Wider ember pickup',cost:[40,100,200]},
            {id:'kin',name:'Kindling',desc:'+25% embers per pickup',cost:[60,140,260,420]},
            {id:'grz',name:'Steady Hand',desc:'Combo lasts longer',cost:[50,120,240]},
            {id:'sh',name:'Last Light',desc:'Survive one hit per shift',cost:[300,900]}];
const COLORS=[['Candle',[1,.7,.35],0],['Ether',[.45,.85,1],50],['Phosphor',[.45,1,.5],90],['Ichor',[1,.25,.35],140],
              ['Violet',[.75,.45,1],200],['Bone',[1,1,.95],280],['Gold',[1,.82,.2],420]];
const MT={
  graze:{run:1,t:n=>`Graze ${n} walls in one shift`,st:'grazes',v:[6,12,20,30,45,65,90]},
  ember:{run:1,t:n=>`Collect ${n} embers in one shift`,st:'embers',v:[6,12,20,30,45,65,90]},
  ward:{run:1,t:n=>`Reach Ward ${ROMAN[n-1]||'∞'}`,st:'ward',v:[2,3,4,5,6,7,8,9,10]},
  score:{run:1,t:n=>`Score ${fmt(n)} in one shift`,st:'score',v:[1500,3000,5000,8000,12000,18000,26000,40000]},
  mult:{run:1,t:n=>`Reach a ×${n} multiplier`,st:'maxMult',v:[2,3,4,5,6,7,8]},
  time:{run:1,t:n=>`Survive ${n}s in one shift`,st:'time',v:[20,30,45,60,80,100,130]},
  runs:{run:0,t:n=>`Play ${n} shifts`,st:'runs',v:[3,5,8,12]},
  gtot:{run:0,t:n=>`Graze ${n} walls in total`,st:'grazes',v:[25,50,90,140,200,300]},
};
function newMission(){
  const have=SV.missions.map(m=>m.id);
  const ids=Object.keys(MT).filter(k=>!have.includes(k));
  const id=ids[Math.floor(Math.random()*ids.length)],T=MT[id],tier=SV.mtier[id]||0;
  const n=tier<T.v.length?T.v[tier]:Math.round(T.v[T.v.length-1]*(1+.5*(tier-T.v.length+1)));
  return{id,n:id==='ward'?Math.min(n,10):n,p:0,r:Math.min(150,20+tier*12),done:false};
}
function ensureMissions(){
  SV.missions=SV.missions.filter(m=>!m.claimed&&MT[m.id]);
  while(SV.missions.length<3)SV.missions.push(newMission());
}
ensureMissions();

// ---------------------------------------------------------------- audio
const AU={c:null,on:!SV.mute,nb:0,beat:0,bq:[],
  init(){
    if(this.c){if(this.c.state==='suspended')this.c.resume();return}
    try{this.c=new(window.AudioContext||window.webkitAudioContext)()}catch(e){return}
    const c=this.c;
    this.m=c.createGain();this.m.gain.value=this.on?.7:0;
    const comp=c.createDynamicsCompressor();this.m.connect(comp);comp.connect(c.destination);
    this.dl=c.createDelay(1);this.dl.delayTime.value=.27;
    const fb=c.createGain();fb.gain.value=.36;const lp=c.createBiquadFilter();lp.frequency.value=2000;
    this.dl.connect(lp);lp.connect(fb);fb.connect(this.dl);lp.connect(this.m);
    this.send=c.createGain();this.send.gain.value=.45;this.send.connect(this.dl);
    const b=c.createBuffer(1,c.sampleRate,c.sampleRate),d=b.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;this.nz=b;
    this.dg=c.createGain();this.dg.gain.value=0;
    const df=c.createBiquadFilter();df.type='lowpass';df.frequency.value=420;df.Q.value=5;
    this.dos=[0,7.02,-12].map((s,i)=>{const o=c.createOscillator();o.type=i===2?'sine':'sawtooth';o.frequency.value=55*Math.pow(2,s/12);o.detune.value=i?7:-7;o.connect(df);o.start();return o});
    df.connect(this.dg);this.dg.connect(this.m);
    const lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=.11;lg.gain.value=180;lfo.connect(lg);lg.connect(df.frequency);lfo.start();
    this.nb=c.currentTime+.1;
    setInterval(()=>this.tick(),25);
  },
  mute(v){this.on=!v;if(this.c)this.m.gain.setTargetAtTime(this.on?.7:0,this.c.currentTime,.05)},
  drone(vol,semi){if(!this.c)return;const t=this.c.currentTime;this.dg.gain.setTargetAtTime(vol,t,.4);
    if(semi!=null)this.dos.forEach((o,i)=>o.frequency.setTargetAtTime(55*Math.pow(2,(semi+[0,7.02,-12][i])/12),t,.3))},
  env(g,t,a,d,v){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d)},
  tone(f,d,type,v,t,f2,send){const c=this.c;if(!c||!this.on)return;t=t||c.currentTime;
    const o=c.createOscillator(),g=c.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);
    if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);this.env(g,t,.004,d,v);
    o.connect(g);g.connect(this.m);if(send)g.connect(this.send);o.start(t);o.stop(t+d+.05)},
  noise(d,v,t,type,f,q,send){const c=this.c;if(!c||!this.on)return;t=t||c.currentTime;
    const s=c.createBufferSource();s.buffer=this.nz;const fl=c.createBiquadFilter();fl.type=type||'highpass';fl.frequency.value=f||1000;fl.Q.value=q||.7;
    const g=c.createGain();this.env(g,t,.002,d,v);s.connect(fl);fl.connect(g);g.connect(this.m);if(send)g.connect(this.send);
    s.start(t,Math.random()*.5);s.stop(t+d+.05)},
  tick(){
    const c=this.c;if(!c)return;
    if(S.mode!=='play'||S.paused){this.nb=c.currentTime+.06;return}
    const w=S.ward,bl=60/(S.vigil?Math.min(130,92+w*4):Math.min(172,112+w*6)),root=55*Math.pow(2,WROOT[w%9]/12);
    while(this.nb<c.currentTime+.12){
      const t=this.nb,b=this.beat;
      this.tone(150,.22,'sine',S.vigil?.22:.5,t,38);
      this.bq.push(t);
      this.noise(.03,.05,t+bl/2,'highpass',7500);
      if(w>=2)this.noise(.02,.03,t+bl*.75,'highpass',9000);
      if(w>=1&&b%2===1&&!S.vigil)this.noise(.12,.11,t,'bandpass',1700,1.2);
      const bn=[0,0,12,0,7,0,10,3][b%8];
      this.tone(root*2*Math.pow(2,bn/12),.2,'triangle',.14,t+bl/2);
      if(w>=4&&b%4===3)this.tone(root*8*Math.pow(2,[0,3,7,10][(b>>2)%4]/12),.25,'square',.025,t,0,1);
      this.beat++;this.nb+=bl;
    }
  },
  graze(cmb){const sc=[0,2,4,7,9],n=sc[cmb%5]+12*Math.min(2,Math.floor(cmb/5));this.tone(523.25*Math.pow(2,n/12),.14,'triangle',.16,0,0,1)},
  ember(g){const f=g?1046.5:784;this.tone(f,.12,'sine',.14,0,0,1);if(this.c)this.tone(f*1.5,.18,'sine',.1,this.c.currentTime+.06,0,1)},
  mult(m){if(!this.c)return;const t=this.c.currentTime;[0,4,7,12].forEach((s,i)=>this.tone(392*Math.pow(2,(s+m)/12),.15,'square',.05,t+i*.045,0,1))},
  record(){if(!this.c)return;const t=this.c.currentTime;[0,4,7,12,16].forEach((s,i)=>this.tone(523*Math.pow(2,s/12),.3,'triangle',.12,t+i*.07,0,1))},
  ward(){if(!this.c)return;const t=this.c.currentTime;[0,3,7,10].forEach(s=>this.tone(110*Math.pow(2,s/12),1.4,'sawtooth',.05,t,0,1));this.noise(1,.12,t,'bandpass',600,2,1);this.tone(60,.8,'sine',.5,t,30)},
  death(){if(!this.c)return;const t=this.c.currentTime;this.noise(.7,.5,t,'lowpass',1400);this.tone(220,.9,'sawtooth',.18,t,30);this.tone(80,.6,'sine',.6,t,25)},
  shield(){this.noise(.4,.3,0,'highpass',3000,1,1);this.tone(1400,.4,'sine',.1,0,300,1)},
  mission(){if(!this.c)return;const t=this.c.currentTime;this.tone(880,.12,'square',.05,t,0,1);this.tone(1318,.25,'square',.05,t+.09,0,1)},
  file(){if(!this.c)return;const t=this.c.currentTime;this.tone(220,1.2,'sine',.12,t,0,1);this.tone(233,1.2,'sine',.08,t,0,1);this.noise(.8,.05,t,'bandpass',900,6,1)},
  charge(l){this.tone(l>1?1568:1175,.09,'square',.04,0,0,1)},
  turbo(l){if(!this.c)return;const t=this.c.currentTime;this.noise(.35,.18,t,'bandpass',l>1?2600:1800,1.5,1);this.tone(l>1?330:260,.35,'sawtooth',.07,t,l>1?990:700,1)},
  click(){this.tone(1200,.03,'square',.03)},
};
const WROOT=[0,3,-2,5,1,7,-4,2,6];

// ---------------------------------------------------------------- gl
const cv=$('gl'),gl=cv.getContext('webgl2',{antialias:false,alpha:false,powerPreference:'high-performance'});
let U={},RS=Math.min(1.5,window.devicePixelRatio||1),W=0,H=0;
const DPR=Math.min(2,window.devicePixelRatio||1);
function glInit(){
  if(!gl)return false;
  const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw gl.getShaderInfoLog(o);return o};
  const p=gl.createProgram();
  gl.attachShader(p,sh(gl.VERTEX_SHADER,'#version 300 es\nin vec2 P;void main(){gl_Position=vec4(P,0,1);}'));
  gl.attachShader(p,sh(gl.FRAGMENT_SHADER,FS));
  gl.bindAttribLocation(p,0,'P');gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw gl.getProgramInfoLog(p);
  gl.useProgram(p);
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  'R uShk T uSpin uPA uSides uTrav uPulse uFlash uDeath uAb uHue uShield uGrz uDim uInv uPC uW uWN uO uON uGA uGV uFog'.split(' ').forEach(n=>U[n]=gl.getUniformLocation(p,n));
  return true;
}
const fxc=$('fx'),cx=fxc.getContext('2d');
function resize(){
  W=innerWidth;H=innerHeight;
  cv.width=Math.max(1,W*RS|0);cv.height=Math.max(1,H*RS|0);
  fxc.width=W*DPR|0;fxc.height=H*DPR|0;
  if(gl)gl.viewport(0,0,cv.width,cv.height);
}
addEventListener('resize',resize);
const WA=new Float32Array(MAXW*4),OA=new Float32Array(MAXO*4);

// ---------------------------------------------------------------- state
let S={mode:'menu',ward:0,walls:[],orbs:[],t:0,spin:0,th:-Math.PI/2,travel:0,sides:6,hue:.58,pulse:0,flash:0,shake:0,grz:0,death:0,dim:.55,ab:0,inv:0,shield:0,v:3};
const K={l:0,r:0,d:0},ptr=new Map();

function startRun(o){
  o=o||{};AU.init();ensureMissions();
  const daily=!!o.daily,cut=!!o.cut,vigil=!!o.vigil;
  const cond=o.cond||(daily||cut||vigil?[]:SV.cond.slice()),C={};cond.forEach(c=>C[c]=1);
  const sw=daily||cut||vigil||o.fresh?0:Math.min(SV.startWard,SV.bestWard);
  const seed=o.seed!=null?o.seed:daily?parseInt(today().replace(/-/g,''),10):(Math.random()*4294967296>>>0);
  const P=WP(sw,C);
  S={mode:'play',daily,cut,vigil,C,cond,bits:condBits(cond),hm:1+heatOf(cond),hits:0,unb:0,bestUnb:0,seed,sw,budget:4096,earned:0,rec:[],ga:0,gv:0,ghostOut:false,drift:0,dch:0,dlv:0,turbos:[0,0,0],golds:0,rotTot:0,passed:0,hair:9,hiT:0,curve:[0],splits:{[sw]:0},wg:{},newFiles:[],genR:mulberry32(seed),spinR:mulberry32(seed^0x5bd1e995),
    t:sw*WL,t0:sw*WL,ward:sw,maxWard:sw,genWard:sw,genP:P,v:P.v,q:[],prev:null,lastZ:13,
    walls:[],orbs:[],th:-Math.PI/2,spin:0,spinV:0,spinDir:1,spinFlip:3,travel:S.travel||0,
    score:0,combo:0,comboT:0,mult:1,maxMult:1,grazes:0,emb:0,embF:0,shield:cut?0:SV.up.sh,inv:0,revives:0,
    sides:P.n,sidesT:P.n,hue:S.hue,pulse:0,flash:.6,shake:0,grz:0,death:0,dim:1,ab:0,recorded:false,deathT:0,ts:1,beatT:0,
    liveDone:{},hudScore:-1,hudEmb:-1};
  K.l=K.r=K.d=0;ptr.clear();
  AU.beat=0;AU.bq=[];if(AU.c)AU.nb=AU.c.currentTime+.05;
  AU.drone(.1,WROOT[sw%9]);
  const pb=SV.pb[pbKey()];S.pb=sw===0&&pb&&pb.c?pb:null;
  S.gk=S.daily?'d'+today():(cut?'c':'n')+hex(seed)+(S.bits?'-'+S.bits:'');
  const g=sw===0&&!vigil&&SV.ghosts[S.gk];S.ghost=g?{a:dec(g.d),s:g.s}:null;acc=0;
  show('hud');
  if(cut)banner('4K CUT','4,096 ticks of steering · grazes refund',P.hue,1);
  else if(vigil)banner('VIGIL','no death · stay unbroken · E ends',P.hue,1);
  else banner('WARD '+P.num,P.name+(S.bits?'  ·  heat +'+Math.round((S.hm-1)*100)+'%':''),P.hue);
  hudStatic();unlock(sw,0);
}

function fillQ(){
  const r=S.genR,P=S.genP,pool=POOL[Math.min(S.genWard,4)];
  S.q.push(...PAT[pool[ri(r,pool.length)]](P.n,r));
}
function gaps(m,n){const g=[];for(let i=0;i<n;i++)if(!((m>>i)&1))g.push((i+.5)*TAU/n);return g}
function needed(pw,m,n,v,w){
  if(!pw)return 0;
  const pg=gaps(pw.m,pw.n),cg=gaps(m,n);let worst=0;
  for(const a of pg){let b=1e9;for(const c of cg)b=Math.min(b,angD(a,c));worst=Math.max(worst,b)}
  return WT/v+worst/OMEGA*1.12+Math.max(.14,.32-.03*w);
}
function spawn(){
  while(S.lastZ<SPAWN&&S.walls.length<MAXW-1){
    const arrive=S.t+(S.lastZ-ZP)/S.v,wi=Math.floor(arrive/WL);
    if(wi>S.genWard){S.genWard=wi;S.genP=WP(wi);S.q=[];S.prev=null;S.lastZ+=S.v*1.2;continue}
    if(!S.q.length)fillQ();
    const P=S.genP,w=S.q.shift();
    let m=w.m;if(m===full(P.n))m&=~(1<<ri(S.genR,P.n));
    const tf=Math.max(w.dt*P.tight+WT/P.v,needed(S.prev,m,P.n,P.v,S.genWard));
    const gap=tf*P.v;
    const z=S.prev?S.lastZ+gap:S.lastZ;
    const wall={z,m,n:P.n,minD:9,passed:false};
    S.walls.push(wall);
    if(S.prev&&S.orbs.length<MAXO&&S.genR()<.42&&!S.C.barren){
      const g=gaps(m,P.n),seg=TAU/P.n,gold=S.genR()<.12;
      let a=g[ri(S.genR,g.length)];
      if(gold)a+=(S.genR()<.5?-1:1)*seg*.36;
      S.orbs.push({z:z-gap*.5,a,gold,alpha:1,done:false});
    }
    S.prev={m,n:P.n};S.lastZ=z;
  }
}
const filled=(w,a)=>{const s=Math.min(w.n-1,Math.floor(mod(a,TAU)/(TAU/w.n)));return(w.m>>s)&1};
const hitAt=(w,a)=>filled(w,a)&&filled(w,a+FORG)&&filled(w,a-FORG);
function edgeD(w,a){
  const seg=TAU/w.n,x=mod(a,TAU)/seg,s=Math.min(w.n-1,Math.floor(x));
  if((w.m>>s)&1)return 0;
  const f=x-s;let d=9;
  if((w.m>>mod(s-1,w.n))&1)d=f*seg;
  if((w.m>>mod(s+1,w.n))&1)d=Math.min(d,(1-f)*seg);
  return d;
}
const overl=w=>w.z<=ZP&&w.z+WT>=ZP;

let acc=0;
function tick(){
  update(TICK);
  S.rec.push(Math.round(mod(S.th,TAU)*1e4));
  if(S.ghost){const i=S.rec.length-1;
    if(i<S.ghost.a.length){S.ga=S.ghost.a[i]/1e4;S.gv=1}
    else if(!S.ghostOut&&S.mode==='play'){S.ghostOut=true;toast('Ghost lantern out · you outlasted it');ach('ghost')}}
}
function update(dt){
  const P=WP(S.ward);
  S.t+=dt;
  const wi=Math.floor(S.t/WL);
  if(wi>S.ward){S.ward=wi;onWard()}
  S.v+=(WP(S.ward).v-S.v)*Math.min(1,dt*1.5);
  S.spinFlip-=dt;
  if(S.spinFlip<=0){S.spinDir*=-1;S.spinFlip=2+S.spinR()*3.5;if(S.ward>=3&&S.spinR()<.3)S.spinV=-S.spinV*1.7}
  S.spinV+=(S.spinDir*P.spin-S.spinV)*Math.min(1,dt*1.2);
  S.spin+=S.spinV*dt;
  S.sides+=(S.sidesT-S.sides)*Math.min(1,dt*6);if(Math.abs(S.sides-S.sidesT)<.01)S.sides=S.sidesT;
  const dz=S.v*dt;S.travel+=dz;S.lastZ-=dz;
  for(const w of S.walls)w.z-=dz;
  for(const o of S.orbs)o.z-=dz;
  spawn();
  // steering, blocked sideways by walls beside you
  const p0=ptr.size?ptr.values().next().value:0;
  const inp=((K.r||p0>0?1:0)-(K.l||p0<0?1:0))*(S.C.mirror?-1:1);
  const drift=K.d||ptr.size>1;
  if(drift&&inp){
    S.dch+=dt*(1+1.5*Math.max(0,1-nearEdge()/.35));
    const lv=S.dch>=1.1?2:S.dch>=.55?1:0;
    if(lv>S.dlv){S.dlv=lv;AU.charge(lv)}
    if(lv&&Math.random()<.6){const p=proj(ZP,S.th,.03);burst(p[0],p[1],1,lv>1?'#ffffff':'#ffc861',160,.25,2.5)}
  }
  if(!drift&&S.dch>0){turbo(S.dlv);S.dch=0;S.dlv=0}
  if(inp&&(!S.cut||S.budget>0)){
    const nt=S.th-inp*OMEGA*(drift?DRIFT:1)*dt;let ok=true;
    for(const w of S.walls)if(overl(w)&&filled(w,nt)&&!filled(w,S.th)){ok=false;break}
    if(!ok&&S.C.brittle&&S.inv<=0&&!S.vigil){die();return}
    if(ok){S.th=nt;S.rotTot+=OMEGA*dt;if(S.cut)S.budget=Math.max(0,S.budget-dt*120)}
  }
  S.inv-=dt;
  for(let i=0;i<S.walls.length;i++){
    const w=S.walls[i];
    if(overl(w)){
      if(S.inv<=0&&hitAt(w,S.th)){
        if(S.shield>0){S.shield--;S.inv=1.2;S.walls.splice(i,1);i--;shieldBreak();continue}
        if(S.vigil){S.walls.splice(i,1);i--;gutter();continue}
        die();return;
      }
      if(S.inv<=0)w.minD=Math.min(w.minD,edgeD(w,S.th)||.004);
    }else if(!w.passed&&w.z+WT<ZP){w.passed=true;S.passed++;if(w.minD<GRAZE){S.hair=Math.min(S.hair,w.minD);if(w.minD<.01745)ach('hair');graze()}}
  }
  S.walls=S.walls.filter(w=>w.z+WT>.25);
  const pr=.28+.1*SV.up.mag;
  for(const o of S.orbs){
    if(!o.done&&o.z<=1.1){o.done=true;if(angD(o.a,S.th)<pr){o.got=true;collect(o)}}
    if(o.done&&!o.got)o.alpha=Math.max(0,o.alpha-dt*3);
  }
  S.orbs=S.orbs.filter(o=>!o.got&&o.z>.35);
  S.comboT-=dt;
  if(S.comboT<=0&&S.combo>0){S.combo=0;setMult()}
  addScore(S.v*dt*5*S.mult);
  if(S.mult>=3)S.hiT+=dt;
  if(S.vigil){S.unb+=dt;if(S.unb>=120)ach('unbroken')}
  if(S.cut&&S.t-S.t0>=60&&S.budget>=4096)ach('miser');
  while(S.curve.length<=Math.floor(S.t-S.t0))S.curve.push(Math.floor(S.score));
  if(!S.recorded&&bestFor()>0&&S.score>bestFor()){S.recorded=true;banner('NEW RECORD','keep going',.12,1);AU.record();vib(30)}
  liveMissions();
}
function nearEdge(){let d=9;for(const w of S.walls)if(w.z<ZP+4&&w.z+WT>=ZP)d=Math.min(d,edgeD(w,S.th));return d}
function turbo(l){
  if(!l)return;S.turbos[l]++;
  S.combo+=l*2;S.comboT=comboMax();setMult();addScore((l>1?150:60)*S.mult);S.flash=Math.max(S.flash,.25);
  AU.turbo(l);vib(l>1?20:10);
  const p=proj(ZP,S.th,.05),c=l>1?'#ffffff':'#ffc861';burst(p[0],p[1],l>1?40:20,c,420,.5,3);ftext(p[0],p[1]-40,l>1?'WHITE FLARE':'flare',c,l>1?20:15);
  if(l>1){ach('turbo');if(S.turbos[2]>=3)ach('turbo3')}
}
function gutter(){
  S.hits++;S.bestUnb=Math.max(S.bestUnb,S.unb);S.unb=0;S.inv=1.4;S.combo=0;setMult();S.flash=.5;S.shake=.6;S.ab=.03;
  AU.noise(.4,.25,0,'lowpass',900);AU.tone(180,.5,'sine',.3,0,60);vib(30);
  const p=proj(ZP,S.th,.05);burst(p[0],p[1],30,cssCol(),300,.6,3);ftext(p[0],p[1]-40,'guttered','#ff6b6b',16);
}
const comboMax=()=>2.6+.5*SV.up.grz;
function setMult(){
  const m=Math.min(8,1+Math.floor(S.combo/5));
  if(m>S.mult){AU.mult(m);const e=$('mult');e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop');
    if(m>=3){const p=proj(ZP,S.th,.05);ftext(p[0],p[1]-36,'×'+m,'#ffb35c',26)}}
  S.mult=m;S.maxMult=Math.max(S.maxMult,m);if(m>=8)ach('x8');if(S.combo>=25)ach('chain25');
}
function graze(){
  S.grazes++;S.combo++;S.comboT=comboMax();setMult();
  addScore(25*S.mult);S.grz=1;
  S.wg[S.ward]=(S.wg[S.ward]||0)+1;if(S.wg[S.ward]>=12)unlock(S.ward,1);
  if(S.cut){S.budget+=48;S.earned+=48}
  AU.graze(S.combo);vib(6);
  const p=proj(ZP,S.th,.05);burst(p[0],p[1],10,'#fff1d0',260,.35,2.5);
  ftext(p[0]+(Math.random()-.5)*30,p[1]-22,'+'+25*S.mult,'#fff1d0',13);
}
function collect(o){
  const v=(o.gold?5:1)*(1+.25*SV.up.kin);
  S.embF+=v;S.emb=Math.floor(S.embF);
  S.combo++;S.comboT=comboMax();setMult();
  addScore((o.gold?60:12)*S.mult);
  if(S.cut){const b=o.gold?256:64;S.budget+=b;S.earned+=b}
  if(o.gold){unlock(S.ward,2);if(++S.golds>=5)ach('gold5')}
  AU.ember(o.gold);vib(o.gold?18:8);
  const p=proj(o.z,o.a,.16);burst(p[0],p[1],o.gold?26:12,o.gold?'#ffd86a':'#ff8a2a',o.gold?380:220,.5,3);
  if(o.gold)ftext(p[0],p[1]-26,'+5 ✦','#ffd86a',18);
}
function shieldBreak(){
  S.flash=.8;S.shake=.7;S.ab=.03;AU.shield();vib([20,30,20]);
  const p=proj(ZP,S.th,.05);burst(p[0],p[1],40,'#ffffff',520,.7,3);
  banner('LAST LIGHT','the flame holds',S.hue,1);
}
function die(){
  S.mode='dying';S.deathT=0;S.flash=1;S.shake=1.2;S.ab=.06;
  AU.death();AU.drone(.03);vib([40,30,90]);
  const p=proj(ZP,S.th,.05);
  burst(p[0],p[1],70,cssCol(),600,1.1,3.5);burst(p[0],p[1],30,'#ffffff',300,.6,2);
}
function onWard(){
  const P=wardP(S.ward);
  S.maxWard=Math.max(S.maxWard,S.ward);S.sidesT=P.n;
  const sp=Math.floor(S.score);S.splits[S.ward]=sp;
  const ref=S.pb&&S.pb.sp&&S.pb.sp[S.ward],dl=ref!=null?'  ·  '+sgn(sp-ref)+' vs PB':'';
  unlock(S.ward,0);if(S.ward>=4)ach('w5');if(S.ward>=8)ach('w9');if(S.ward>=9)ach('beyond');S.flash=.45;S.pulse=1.5;
  AU.ward();AU.drone(.1,WROOT[S.ward%9]);vib(25);
  if(S.ward===9){
    banner('SHIFT SURVIVED','you walked out of Ward Nine'+dl,.13);
    if(!SV.beyond){SV.beyond=true;SV.embers+=150;save();toast('Escaped Ward Nine · +150 ✦')}
  }else banner('WARD '+P.num,P.name+dl,P.hue);
  hudStatic();
}
function stats(){
  return{grazes:S.grazes,embers:S.emb,ward:S.maxWard>S.sw?S.maxWard+1:0,score:Math.floor(S.score),maxMult:S.maxMult,time:Math.floor(S.t-S.t0),runs:1};
}
function liveMissions(){
  const st=stats();
  for(const m of SV.missions){
    if(m.done||!MT[m.id].run||S.liveDone[m.id])continue;
    if(st[MT[m.id].st]>=m.n){S.liveDone[m.id]=1;toast('✓ '+MT[m.id].t(m.n)+'  +'+m.r+' ✦');AU.mission()}
  }
}

// ---------------------------------------------------------------- end of run
let OV={};
const reviveCost=()=>25+8*S.ward;
function endRun(){
  S.mode='over';
  const sc=Math.floor(S.score),prev=bestFor();
  OV={sc,prev,newBest:sc>prev,final:false,lock:performance.now()+450};
  show('over');
  if(S.vigil)S.bestUnb=Math.max(S.bestUnb,S.unb);
  $('oTitle').textContent=S.vigil?'vigil ended':(S.cut?'4k cut · ':S.daily?'daily #'+dayNo()+' · ':'')+(S.bits?'heat +'+Math.round((S.hm-1)*100)+'% · ':'')+'the light goes out';
  $('oCard').innerHTML=cardHTML(sc,prev);
  $('oFiles').innerHTML=S.newFiles.map(id=>`<div class="f nw"><span>${ROMAN[id/3|0]}-${id%3+1}</span>${FILES[id]}</div>`).join('');
  countUp($('oScore'),sc);
  const ob=$('oBest');
  if(OV.newBest&&prev>0){ob.textContent='new best · +'+fmt(sc-prev);ob.className='obest nb'}
  else if(OV.newBest){ob.textContent='first record set';ob.className='obest nb'}
  else{ob.textContent='best '+fmt(prev);ob.className='obest'}
  const near=[],tn=WL-mod(S.t,WL),st=stats();
  if(!OV.newBest&&prev>0&&sc>=prev*.75)near.push(fmt(prev-sc)+' from your best');
  if(tn<4&&S.ward<9)near.push(tn.toFixed(1)+'s from Ward '+(wardP(S.ward+1).num));
  for(const m of SV.missions){if(m.done)continue;const T=MT[m.id],v=T.run?st[T.st]:m.p+st[T.st];
    if(v<m.n&&v>=m.n*.7){near.push('almost: '+T.t(m.n).toLowerCase()+' ('+Math.floor(v)+'/'+m.n+')');break}}
  $('oNear').innerHTML=near.slice(0,2).map(t=>'<div>'+t+'</div>').join('');
  const can=!S.daily&&!S.cut&&!S.vigil&&S.revives<1&&SV.embers+S.emb>=reviveCost()&&(sc>=prev*.5||S.ward>=SV.bestWard);
  $('oPost').classList.add('hide');
  if(can){
    $('rev').classList.remove('hide');$('bRev').textContent='Keep the light · '+reviveCost()+' ✦';
    const cd=$('revCd');cd.style.transition='none';cd.style.transform='scaleX(1)';void cd.offsetWidth;
    cd.style.transition='transform 4s linear';cd.style.transform='scaleX(0)';
    OV.revT=setTimeout(finalize,4000);
  }else{$('rev').classList.add('hide');finalize()}
}
function revive(){
  if(OV.final||S.mode!=='over')return;
  clearTimeout(OV.revT);
  let c=reviveCost();const fromRun=Math.min(S.emb,c);S.emb-=fromRun;S.embF-=fromRun;SV.embers-=c-fromRun;save();
  S.revives++;S.mode='play';S.death=0;S.dim=1;S.inv=2;S.walls=S.walls.filter(w=>w.z>ZP+7);S.flash=.8;
  AU.drone(.1,WROOT[S.ward%9]);AU.shield();show('hud');banner('THE LIGHT RETURNS','',S.hue,1);
}
function finalize(){
  if(OV.final)return;OV.final=true;clearTimeout(OV.revT);
  $('rev').classList.add('hide');$('oPost').classList.remove('hide');
  const st=stats(),rew=[];
  SV.runs++;SV.grazeTotal+=S.grazes;
  if(OV.newBest){
    if(S.daily)SV.daily[today()]=OV.sc;else if(!S.cut&&!S.vigil)SV.best=OV.sc;
    if(S.sw===0||S.cut)SV.pb[pbKey()]={s:OV.sc,c:S.curve,sp:S.splits};
    else if(S.cut)SV.pb.c={s:OV.sc};
  }
  for(const k in SV.pb)if(k[0]==='d'&&k!=='d'+today())delete SV.pb[k];
  if(S.hair<SV.hairBest)SV.hairBest=S.hair;
  SV.bestWard=Math.max(SV.bestWard,Math.min(S.maxWard,9));
  if(S.sw===0&&S.rec.length>120&&!S.revives&&!S.vigil){const old=SV.ghosts[S.gk];
    if(!old||OV.sc>old.s){SV.ghosts[S.gk]={s:OV.sc,d:enc(Uint16Array.from(S.rec)),t:Date.now(),seed:S.seed,cut:S.cut?1:0};if(old)rew.push('ghost beaten · new ghost saved')}
    if(OV.newBest&&!S.daily)S.cut?SV.cutSeed=S.gk:SV.pbSeed=S.gk;}
  {const keep=new Set(['d'+today(),SV.pbSeed,SV.cutSeed]);const ks=Object.keys(SV.ghosts).filter(k=>!keep.has(k)).sort((a,b)=>SV.ghosts[b].t-SV.ghosts[a].t);
   ks.slice(4).forEach(k=>delete SV.ghosts[k]);Object.keys(SV.ghosts).forEach(k=>{if(k[0]==='d'&&k!=='d'+today())delete SV.ghosts[k]})}
  if(S.vigil){SV.vigil.unb=Math.max(SV.vigil.unb||0,S.bestUnb);if(OV.newBest)SV.vigil.s=OV.sc}
  if(S.hm>=2)ach('heat');
  SV.hist.unshift({c:S.bits,m:S.vigil?'v':S.cut?'c':S.daily?'d':'n',s:OV.sc,w:S.maxWard,t:Math.round((S.t-S.t0)*10)/10,g:S.grazes,seed:S.seed,sw:S.sw,at:Date.now()});SV.hist.length=Math.min(SV.hist.length,25);
  ach('first');
  if(S.emb)rew.push('+'+S.emb+' ✦ embers');
  let earned=S.emb;
  const td=today();
  if(SV.lastDay!==td){SV.streak=SV.lastDay===yesterday()?SV.streak+1:1;SV.lastDay=td;const b=Math.min(70,10*SV.streak);earned+=b;rew.push('day '+SV.streak+' streak · +'+b+' ✦')}
  for(const m of SV.missions){
    if(m.done)continue;const T=MT[m.id];
    m.p=T.run?Math.max(m.p,st[T.st]):m.p+st[T.st];
    if(m.p>=m.n){m.done=true;m.claimed=true;earned+=m.r;SV.mtier[m.id]=(SV.mtier[m.id]||0)+1;rew.push('mission · +'+m.r+' ✦')}
  }
  const l0=SV.lvl,x0=SV.xp/xpNeed(l0);
  SV.xp+=OV.sc;
  while(SV.xp>=xpNeed(SV.lvl)){SV.xp-=xpNeed(SV.lvl);SV.lvl++;const b=20+5*SV.lvl;earned+=b;rew.push('rank '+SV.lvl+' · +'+b+' ✦')}
  SV.embers+=earned;
  if(SV.streak>=7)ach('week');if(SV.lvl>=17)ach('rank17');
  save();
  $('oRew').innerHTML=rew.map(r=>'<span>'+r+'</span>').join('');
  rankHTML($('oRank'),SV.lvl>l0?0:x0);
  missionsHTML($('oMis'));
  if(OV.newBest)setTimeout(()=>AU.record(),300);
}
function retry(same){if(S.mode!=='over'||performance.now()<OV.lock)return;finalize();startRun({daily:S.daily,cut:S.cut,vigil:S.vigil,cond:S.cond,seed:same?S.seed:null})}
function cardHTML(sc,prev){
  const rt=Math.max(.1,S.t-S.t0),deg=r=>(r*180/Math.PI).toFixed(1)+'°';
  const c=[['time',rt.toFixed(1)+'s'],['pts/s',fmt(sc/rt)],['grazes',S.grazes+' · '+Math.round(S.grazes/rt*60)+'/m'],['embers',S.emb],
    ...(S.vigil?[['hits',S.hits],['unbroken',S.bestUnb.toFixed(1)+'s'+(S.bestUnb>(SV.vigil.unb||0)?' <em class="up">PB</em>':'')]]:S.cut?[['ticks left',Math.floor(S.budget)],['ticks earned','+'+S.earned]]:[['max mult','×'+S.maxMult],['×3+ uptime',Math.round(S.hiT/rt*100)+'%']]),['turn/wall',S.passed?Math.round(S.rotTot/S.passed*180/Math.PI)+'°':'—'],
    ['hairline',S.hair<9?deg(S.hair)+(S.hair<SV.hairBest?' <em class="up">PB</em>':''):'—']];
  let h='<div class="card">'+c.map(x=>`<div><i>${x[0]}</i><b>${x[1]}</b></div>`).join('')+'</div>';
  const ws=Object.keys(S.splits).map(Number).sort((a,b)=>a-b);
  if(ws.length>1||S.pb){const ps=S.pb&&S.pb.sp||{};
    h+='<div class="spl">'+ws.map(w=>{const r=ps[w];return`<span>${w>8?'∞':ROMAN[w]} <b>${fmt(S.splits[w])}</b>${r!=null&&w!==S.sw?` <em class="${S.splits[w]>=r?'up':'dn'}">${sgn(S.splits[w]-r)}</em>`:''}</span>`}).join('')
      +`<span>end <b>${fmt(sc)}</b>${prev?` <em class="${sc>=prev?'up':'dn'}">${sgn(sc-prev)}</em>`:''}</span></div>`}
  h+=`<div class="spl"><span>${S.daily?'daily <b>#'+dayNo()+'</b>':'code <b>'+codeOf(S.seed,S.bits)+'</b> <button id="bCopy" class="mini">copy</button>'}</span></div>`;
  return h;
}
function toMenu(){if(S.mode==='over')finalize();PS=[];FT=[];$('banner').classList.remove('on');S.mode='menu';S.walls=[];S.orbs=[];S.death=0;S.dim=.55;AU.drone(.05);menuHTML();show('menu')}

// ---------------------------------------------------------------- ui
const panels=['menu','over','shop','hud','files','recs','conds'];
function show(id){for(const p of panels)$(p).classList.toggle('hide',p!==id);$('pause').classList.add('hide')}
function banner(a,b,h,small){
  const e=$('banner');e.querySelector('.b1').textContent=a;e.querySelector('.b2').textContent=b||'';
  const c=pal(h==null?S.hue:h);e.querySelector('.b1').style.color=`rgb(${c.map(v=>Math.round(140+v*115)).join(',')})`;
  e.querySelector('.b1').style.fontSize=small?'clamp(22px,6vw,36px)':'';
  e.classList.remove('on');void e.offsetWidth;e.classList.add('on');
}
function toast(t){const d=document.createElement('div');d.className='t';d.textContent=t;$('toast').appendChild(d);setTimeout(()=>d.remove(),2700)}
function pal(h){return[0,.33,.67].map(o=>.5+.5*Math.cos(TAU*(h+o)))}
const cssCol=()=>{const c=COLORS[SV.col][1];return`rgb(${c.map(v=>v*255|0).join(',')})`};
function countUp(el,v){const t0=performance.now(),d=Math.min(900,300+v/20);const f=()=>{const k=Math.min(1,(performance.now()-t0)/d);el.textContent=fmt(v*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(f)};f()}
function rankHTML(el,from){
  const k=SV.xp/xpNeed(SV.lvl);
  el.innerHTML=`<div class="rank">RANK <b>${SV.lvl}</b> · ${rankName(SV.lvl)} <span style="float:right">${fmt(SV.xp)} / ${fmt(xpNeed(SV.lvl))}</span></div><div class="xp"><i style="width:${(from==null?k:from)*100}%"></i></div>`;
  if(from!=null)requestAnimationFrame(()=>requestAnimationFrame(()=>{const i=el.querySelector('i');if(i)i.style.width=k*100+'%'}));
}
function missionsHTML(el){
  el.innerHTML='<div class="mh">missions</div>'+SV.missions.map(m=>{const T=MT[m.id],p=m.done?1:Math.min(1,m.p/m.n);
    return`<div class="m${m.done?' done':''}"><span class="r">+${m.r} ✦</span>${T.t(m.n)}<div class="pb"><i style="width:${p*100}%"></i></div></div>`}).join('');
}
function menuHTML(){
  ensureMissions();
  rankHTML($('mRank'));
  const sw=Math.min(SV.startWard,SV.bestWard);
  $('bWard').textContent='Start ▸ '+ROMAN[sw];$('bWard').disabled=SV.bestWard<1;
  const db=SV.daily[today()];
  $('bDaily').textContent='Daily #'+dayNo()+(db?' · '+fmt(db):'');
  $('mStats').innerHTML=`<span>best <b>${fmt(SV.best)}</b></span><span>deepest <b>Ward ${SV.bestWard>=9&&SV.beyond?'∞':ROMAN[Math.min(8,SV.bestWard)]}</b></span><span class="e">✦ ${fmt(SV.embers)}</span>${SV.streak?`<span>streak <b>${SV.streak}d</b></span>`:''}`;
  missionsHTML($('mList'));
  const cb=SV.pb.c&&SV.pb.c.s;$('b4k').textContent='4K Cut'+(cb?' · '+fmt(cb):'');
  $('bFiles').textContent='Files '+SV.files.length+'/27';
  const hc=heatOf(SV.cond);$('bConds').textContent='Conditions'+(hc?' · +'+Math.round(hc*100)+'%':'');
  $('bVigil').textContent='Vigil'+(SV.vigil.unb?' · '+SV.vigil.unb.toFixed(0)+'s':'');
  $('bRecs').textContent='Records '+SV.ach.length+'/'+ACH.length;
  const pg=SV.ghosts[SV.pbSeed];$('bGhost').classList.toggle('hide',!pg);if(pg)$('bGhost').textContent='Race PB ghost · '+fmt(pg.s);
  $('bMute').textContent='sound: '+(AU.on?'on':'off')+' [m]';
}
function shopHTML(){
  $('sEmb').textContent='✦ '+fmt(SV.embers);
  $('sList').innerHTML=SHOP.map(it=>{const l=SV.up[it.id],mx=it.cost.length,c=it.cost[l];
    return`<div class="it"><div class="d"><div class="n">${it.name}</div><div class="s">${it.desc}</div><div class="pips">${'◆'.repeat(l)}${'◇'.repeat(mx-l)}</div></div>${l<mx?`<button data-up="${it.id}" ${SV.embers<c?'disabled':''}>${c} ✦</button>`:'<button disabled>max</button>'}</div>`}).join('');
  $('cList').innerHTML=COLORS.map((c,i)=>{const own=SV.owned.includes(i),col=`rgb(${c[1].map(v=>v*255|0).join(',')})`;
    return`<div class="sw${SV.col===i?' eq':''}${own?'':' lk'}" data-col="${i}" title="${c[0]}" style="background:radial-gradient(circle,#fff 0 18%,${col} 45%,#000 100%);color:${col}">${own?'':`<span style="color:#fff">${c[2]}</span>`}</div>`}).join('');
}
$('sList').addEventListener('click',e=>{const id=e.target.dataset&&e.target.dataset.up;if(!id)return;const it=SHOP.find(s=>s.id===id),l=SV.up[id];
  if(l<it.cost.length&&SV.embers>=it.cost[l]){SV.embers-=it.cost[l];SV.up[id]++;save();AU.init();AU.record();shopHTML()}});
$('cList').addEventListener('click',e=>{const el=e.target.closest('[data-col]');if(!el)return;const i=+el.dataset.col,c=COLORS[i];
  if(SV.owned.includes(i))SV.col=i;else if(SV.embers>=c[2]){SV.embers-=c[2];SV.owned.push(i);SV.col=i;AU.init();AU.record()}else return;save();AU.click();shopHTML()});
let shopFrom='menu';
function openShop(from){shopFrom=from;if(from==='over')finalize();shopHTML();show('shop')}
$('bPlay').onclick=()=>startRun();
$('bDaily').onclick=()=>startRun({daily:1});
$('b4k').onclick=()=>startRun({cut:1});
$('bSeed').onclick=()=>{OV.lock=0;retry(1)};
$('bFiles').onclick=()=>{filesHTML();show('files')};
$('bGhost').onclick=()=>{const g=SV.ghosts[SV.pbSeed];if(g)startRun({seed:g.seed,fresh:1})};
$('bVigil').onclick=()=>startRun({vigil:1});
$('bEndV').onclick=endVigil;
$('bConds').onclick=()=>{condsHTML();show('conds')};
$('bCBack').onclick=()=>{menuHTML();show('menu')};
$('bCPlay').onclick=()=>startRun();
function condsHTML(){
  const h=heatOf(SV.cond);
  $('cHeat').innerHTML=`heat <b>+${Math.round(h*100)}%</b> · score ×${(1+h).toFixed(2)}`;
  $('cList2').innerHTML=CONDS.map(c=>{const on=SV.cond.includes(c[0]);return`<button class="cd${on?' on':''}" data-c="${c[0]}" aria-pressed="${on}"><b>${c[1]}</b><span>${c[2]}</span><em>+${Math.round(c[3]*100)}%</em></button>`}).join('');
}
$('cList2').addEventListener('click',e=>{const b=e.target.closest('[data-c]');if(!b)return;const id=b.dataset.c,i=SV.cond.indexOf(id);if(i<0)SV.cond.push(id);else SV.cond.splice(i,1);save();AU.init();AU.click();condsHTML()});
$('bCode').onclick=()=>{const c=parseCode($('codeIn').value);if(!c){$('codeMsg').textContent='Codes look like NS-1A2B3C4D-0';return}startRun({seed:c.seed,cond:bitsCond(c.bits),fresh:1})};
$('over').addEventListener('click',e=>{if(e.target.id!=='bCopy')return;const t=codeOf(S.seed,S.bits);
  const ok=()=>{e.target.textContent='copied'},no=()=>{const r=document.createRange();r.selectNodeContents(e.target.previousElementSibling);const sel=getSelection();sel.removeAllRanges();sel.addRange(r);e.target.textContent='selected'};
  try{navigator.clipboard.writeText(t).then(ok,no)}catch(_){no()}});
$('bRecs').onclick=()=>{recsHTML();show('recs')};
$('bRBack').onclick=()=>{menuHTML();show('menu')};
const MODE={n:'shift',d:'daily',c:'4K cut',v:'vigil'};
function recsHTML(){
  const tot=SV.hist.reduce((a,h)=>a+h.t,0);
  $('rLife').innerHTML=`<span>shifts <b>${fmt(SV.runs)}</b></span><span>grazes <b>${fmt(SV.grazeTotal)}</b></span><span>best <b>${fmt(SV.best)}</b></span><span>hairline <b>${SV.hairBest<9?(SV.hairBest*180/Math.PI).toFixed(1)+'°':'—'}</b></span><span>ghosts <b>${Object.keys(SV.ghosts).length}</b></span>`;
  $('rAch').innerHTML=ACH.map(a=>{const on=SV.ach.includes(a[0]);return`<div class="ac${on?' on':''}"><b>${on?'★':'☆'} ${a[1]}</b><span>${a[2]}</span><em>+${a[3]}</em></div>`}).join('');
  $('rHist').innerHTML=SV.hist.length?`<table><tr><th>mode</th><th>score</th><th>ward</th><th>time</th><th>grz</th><th>code</th><th></th></tr>`+SV.hist.map((h,i)=>`<tr><td>${MODE[h.m]}</td><td>${fmt(h.s)}</td><td>${h.w>8?'∞':ROMAN[h.w]}</td><td>${h.t}s</td><td>${h.g}</td><td>${codeOf(h.seed,h.c||0)}</td><td><button data-h="${i}" title="Replay this seed">▶</button></td></tr>`).join('')+'</table>':'<div class="help">No shifts yet.</div>';
}
$('rHist').addEventListener('click',e=>{const i=e.target.dataset&&e.target.dataset.h;if(i==null)return;const h=SV.hist[+i];startRun({seed:h.seed,cut:h.m==='c',vigil:h.m==='v',cond:bitsCond(h.c||0),fresh:1})});
$('bFBack').onclick=()=>{menuHTML();show('menu')};
function filesHTML(){$('fCount').textContent=SV.files.length+' / 27 recovered';
  $('fList').innerHTML=WARDS.map((w,i)=>`<div class="mh">Ward ${ROMAN[i]} · ${w[0]}</div>`+[0,1,2].map(k=>{const id=i*3+k,on=SV.files.includes(id);
    return`<div class="f${on?'':' lk'}"><span>${ROMAN[i]}-${k+1}</span>${on?FILES[id]:'▒▒▒ '+FCOND[k](ROMAN[i])}</div>`}).join('')).join('')}
$('bShop').onclick=()=>openShop('menu');
$('bShop2').onclick=()=>openShop('over');
$('bBack').onclick=()=>{if(shopFrom==='over'){show('over');missionsHTML($('oMis'))}else{menuHTML();show('menu')}};
$('bWard').onclick=()=>{SV.startWard=(Math.min(SV.startWard,SV.bestWard)+1)%(Math.min(8,SV.bestWard)+1);save();AU.init();AU.click();menuHTML()};
$('bMute').onclick=()=>{SV.mute=AU.on;AU.mute(SV.mute);save();menuHTML()};
$('bRetry').onclick=()=>{OV.lock=0;retry(0)};
$('bMenu').onclick=toMenu;
$('bRev').onclick=revive;
$('over').addEventListener('pointerdown',e=>{if(e.target===$('over')||e.target.closest('.oscore,.obest,.near,#oPost'))retry()});
function hudStatic(){const P=wardP(S.ward);$('wname').textContent='Ward '+P.num+' · '+P.name;$('bbar').style.display=bestFor()>0?'':'none'}
function hud(){
  const sc=Math.floor(S.score);
  if(sc!==S.hudScore){S.hudScore=sc;$('score').textContent=fmt(sc)}
  $('mult').textContent='×'+S.mult+(S.combo?' · chain '+S.combo:'');
  $('cbar').firstChild.style.width=(S.combo?clamp(S.comboT/comboMax(),0,1)*100:0)+'%';
  $('wbar').firstChild.style.width=(S.ward>=9?100:mod(S.t,WL)/WL*100)+'%';
  const best=bestFor();
  const de=$('dlt');
  if(S.pb){const i=Math.floor(S.t-S.t0),ref=i<S.pb.c.length?S.pb.c[i]:S.pb.s,d=sc-ref;de.textContent=sgn(d);de.className=d>=0?'up':'dn'}else de.textContent='';
  if(best)$('bbar').firstChild.style.width=Math.min(1,sc/best)*100+'%';
  if(S.emb!==S.hudEmb){S.hudEmb=S.emb;$('emb').textContent='✦ '+S.emb}
  $('shd').textContent=S.vigil?'unbroken '+S.unb.toFixed(1)+'s · '+S.hits+' hit'+(S.hits===1?'':'s'):S.cut?(S.budget>0?Math.floor(S.budget)+' ticks':'BUDGET SPENT'):S.shield>0?'◈'.repeat(S.shield)+' last light':'';
  $('shd').className=S.cut&&S.budget<512?'dn':'';
}

// ---------------------------------------------------------------- fx overlay
let PS=[],FT=[];
function proj(z,a,h){
  const seg=TAU/S.sides,loc=mod(a,seg)-seg/2,r=(1-h)/(z*Math.cos(loc))/(1+.025*S.pulse),sa=a+S.spin,hm=.5*Math.min(W,H),sh=S.shk||[0,0];
  return[W/2+(Math.cos(sa)*r-sh[0])*hm,H/2-(Math.sin(sa)*r-sh[1])*hm];
}
function burst(x,y,n,c,sp,l,s){for(let i=0;i<n;i++){const a=Math.random()*TAU,v=sp*(.2+Math.random()*.8);PS.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:l*(.4+Math.random()*.6),m:l,c,s})}}
function ftext(x,y,t,c,s){FT.push({x,y,t,c,s:s||14,l:.9,m:.9})}
function drawFx(dt){
  cx.setTransform(DPR,0,0,DPR,0,0);cx.clearRect(0,0,W,H);
  cx.globalCompositeOperation='lighter';
  const damp=Math.pow(.04,dt);
  for(const p of PS){p.l-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=damp;p.vy*=damp;cx.globalAlpha=Math.max(0,p.l/p.m);cx.fillStyle=p.c;cx.fillRect(p.x-p.s/2,p.y-p.s/2,p.s,p.s)}
  PS=PS.filter(p=>p.l>0);
  cx.globalCompositeOperation='source-over';cx.textAlign='center';
  for(const f of FT){f.l-=dt;f.y-=40*dt;cx.globalAlpha=Math.max(0,Math.min(1,f.l/f.m*2));cx.fillStyle=f.c;cx.font=`700 ${f.s}px ui-monospace,Menlo,monospace`;cx.fillText(f.t,f.x,f.y)}
  FT=FT.filter(f=>f.l>0);cx.globalAlpha=1;
}

// ---------------------------------------------------------------- input
const LK=['ArrowLeft','KeyA'],RK=['ArrowRight','KeyD'],DK=['ShiftLeft','ShiftRight','Space'];
addEventListener('keydown',e=>{
  if(e.target&&e.target.tagName==='INPUT'){if(e.code==='Enter')$('bCode').click();return}
  if(LK.includes(e.code))K.l=1;else if(RK.includes(e.code))K.r=1;else if(DK.includes(e.code))K.d=1;
  if(e.repeat)return;
  if(S.paused&&S.mode==='play'){unpause();return}
  if(e.code==='KeyM'){SV.mute=AU.on;AU.mute(SV.mute);save();if(S.mode==='menu')menuHTML();return}
  const go=e.code==='Space'||e.code==='Enter';
  if(S.mode==='menu'&&!$('menu').classList.contains('hide')&&go){e.preventDefault();startRun()}
  else if(S.mode==='over'&&go){e.preventDefault();if(!OV.final&&e.code==='Enter'&&!$('rev').classList.contains('hide'))revive();else{OV.lock=0;retry(0)}}
  else if(S.mode==='over'&&e.code==='KeyR'){OV.lock=0;retry(1)}
  else if(S.mode==='play'&&e.code==='KeyR'&&!S.paused)startRun({daily:S.daily,cut:S.cut,vigil:S.vigil,cond:S.cond});
  else if(S.mode==='play'&&e.code==='KeyE'&&S.vigil)endVigil();
  else if(S.mode==='over'&&e.code==='Escape')toMenu();
  else if(S.mode==='play'&&(e.code==='Escape'||e.code==='KeyP'))pause();
  if(e.code.startsWith('Arrow')||e.code==='Space')e.preventDefault();
});
addEventListener('keyup',e=>{if(LK.includes(e.code))K.l=0;else if(RK.includes(e.code))K.r=0;else if(DK.includes(e.code))K.d=0});
addEventListener('pointerdown',e=>{if(S.mode!=='play'||e.target.id==='bEndV')return;if(S.paused){unpause();return}ptr.set(e.pointerId,e.clientX<W/2?-1:1)});
addEventListener('pointermove',e=>{if(ptr.has(e.pointerId))ptr.set(e.pointerId,e.clientX<W/2?-1:1)});
['pointerup','pointercancel','pointerleave'].forEach(t=>addEventListener(t,e=>ptr.delete(e.pointerId)));
addEventListener('blur',()=>{K.l=K.r=K.d=0;ptr.clear();pause()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
addEventListener('contextmenu',e=>e.preventDefault());
function pause(){if(S.mode==='play'&&!S.paused){S.paused=true;$('pause').classList.remove('hide');$('bEndV').classList.toggle('hide',!S.vigil)}}
function endVigil(){if(!S.vigil||S.mode!=='play')return;unpause();S.mode='dying';S.deathT=.5;AU.drone(.03)}
function unpause(){S.paused=false;$('pause').classList.add('hide');last=performance.now()}

// ---------------------------------------------------------------- loop
let last=performance.now(),slow=0,frames=0;
function frame(now){
  requestAnimationFrame(frame);
  let rdt=Math.min(.05,(now-last)/1000);last=now;
  frames++;if(rdt>.024)slow++;
  if(frames>=90){if(slow>45&&RS>.5){RS=Math.max(.5,RS*.8);resize()}frames=slow=0}
  const dt=Math.min(rdt,1/30);
  if(S.mode==='play'&&!S.paused){acc+=rdt;let k=0;while(acc>=TICK&&k<6&&S.mode==='play'){tick();acc-=TICK;k++}if(k>=6)acc=0;if(S.mode==='play')hud()}
  if(S.ghostOut)S.gv*=Math.exp(-rdt*3);
  if(S.mode==='dying'){
    S.deathT+=rdt;S.ts=Math.max(0,1-S.deathT*2.2);
    const d=dt*S.ts*.4;for(const w of S.walls)w.z-=S.v*d;S.travel+=S.v*d;
    S.death=Math.min(1,S.deathT*1.6);S.dim=1-S.death*.35;
    if(S.deathT>.85)endRun();
  }else if(S.mode==='menu'||S.mode==='over'){S.travel+=(S.mode==='menu'?3:1)*rdt;S.spin+=.12*rdt}
  // beat pulse
  if(AU.c&&S.mode==='play'){while(AU.bq.length&&AU.bq[0]<=AU.c.currentTime){AU.bq.shift();S.pulse=Math.max(S.pulse,1)}}
  else if(S.mode==='play'&&!S.paused){S.beatT+=dt;const bl=60/(112+S.ward*6);if(S.beatT>bl){S.beatT-=bl;S.pulse=1}}
  const ex=Math.exp(-rdt*7);
  S.pulse*=Math.exp(-rdt*6);S.flash*=Math.exp(-rdt*5);S.shake*=Math.exp(-rdt*6);S.grz*=Math.exp(-rdt*9);S.ab*=ex;
  const th=wardP(S.ward).hue;S.hue+=(mod(th-S.hue+.5,1)-.5)*Math.min(1,rdt*1.5);
  const sk=S.shake*S.shake*.04;S.shk=[(Math.random()-.5)*sk,(Math.random()-.5)*sk];
  render(now/1000);drawFx(rdt);
}
function render(t){
  if(!gl)return;
  let n=0;
  for(const w of S.walls){if(n>=MAXW)break;WA[n*4]=w.z;WA[n*4+1]=w.m;WA[n*4+2]=w.n;WA[n*4+3]=0;n++}
  let m=0;
  for(const o of S.orbs){if(m>=MAXO||o.z<.4)continue;OA[m*4]=o.z;OA[m*4+1]=o.a;OA[m*4+2]=o.gold?1:0;OA[m*4+3]=o.alpha*Math.min(1,(SPAWN-o.z)/4);m++}
  gl.uniform2f(U.R,cv.width,cv.height);gl.uniform2f(U.uShk,S.shk[0],S.shk[1]);
  gl.uniform1f(U.T,t);gl.uniform1f(U.uSpin,S.spin);gl.uniform1f(U.uPA,mod(S.th,TAU));gl.uniform1f(U.uSides,S.sides);
  gl.uniform1f(U.uTrav,S.travel%2000);gl.uniform1f(U.uPulse,S.pulse);gl.uniform1f(U.uFlash,S.flash*.5);
  gl.uniform1f(U.uDeath,S.death);gl.uniform1f(U.uAb,S.ab);gl.uniform1f(U.uHue,S.hue);gl.uniform1f(U.uShield,S.mode==='play'&&S.shield>0?1:0);
  gl.uniform1f(U.uGrz,S.grz);gl.uniform1f(U.uDim,S.dim);gl.uniform1f(U.uInv,S.inv>0?1:0);
  gl.uniform3fv(U.uPC,COLORS[SV.col][1]);gl.uniform1f(U.uGA,S.ga||0);gl.uniform1f(U.uFog,S.C&&S.C.dark&&S.mode!=='menu'?2:1);gl.uniform1f(U.uGV,(S.mode==='play'||S.mode==='dying')&&S.ghost?S.gv||0:0);
  gl.uniform4fv(U.uW,WA);gl.uniform1i(U.uWN,n);gl.uniform4fv(U.uO,OA);gl.uniform1i(U.uON,m);
  gl.drawArrays(gl.TRIANGLES,0,3);
}

// ---------------------------------------------------------------- boot
try{if(!glInit())throw'WebGL2 unavailable'}catch(e){document.body.insertAdjacentHTML('beforeend','<div id="err">This shift needs WebGL2.<br><small>'+String(e).slice(0,200)+'</small></div>');console.error(e)}
resize();menuHTML();
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("button");if(b)b.blur()});
requestAnimationFrame(frame);
