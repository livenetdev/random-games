// PALE. Implicit globals + with(Math) on purpose: bytes.
with(Math){
document.body.innerHTML='<canvas id=V style=position:fixed;inset:0;width:100%;height:100%></canvas><center id=J style="position:fixed;bottom:5%;width:100%;color:#a99;font:italic 3vh serif">';
g=(V.width=innerWidth/2,V.height=innerHeight/2,V).getContext('webgl2');
P=g.createProgram();
for(s of[[35633,'#version 300 es\nvoid main(){gl_Position=vec4(vec2(gl_VertexID%2,gl_VertexID/2)*4.-1.,0,1);}'],[35632,FS]])S=g.createShader(s[0]),g.shaderSource(S,s[1]),g.compileShader(S),g.attachShader(P,S);
g.linkProgram(P);g.useProgram(P);
U=g.getUniformLocation(P,'u');
K=Array(99).fill(0);onkeydown=e=>K[e.keyCode]=1;onkeyup=e=>K[e.keyCode]=0;
onmousemove=e=>{yw+=e.movementX*.003;pt=min(1.2,max(-1.2,pt-e.movementY*.003))};
// hash identical to shader H() (coords stay positive, so %1 == fract)
Hs=(x,y,d)=>(x=x*.1031%1,y=y*.1031%1,d=x*(y+33.33)+y*(x+33.33)+x*(x+33.33),(x+y+2*d)*(x+d)%1);
// trunk distance at chest height: [dist, dx, dz]
D=(x,z,i=floor(x/4),j=floor(z/4),a=x-i*4-2-(Hs(i,j)-.5)*2,b=z-j*4-2-(Hs(i+9,j+9)-.5)*2)=>[Hs(i+3,j+3)<.2?9:hypot(a,b)-.25-.3*Hs(i+5,j+5),a,b];
// sound: freq, end freq, dur, vol, noise?
Z=(f,e,d,v,y,o,q,k)=>{if(A){k=A.currentTime;o=y?Nz():A.createOscillator();q=A.createBiquadFilter();q.frequency.value=y?f:9e3;y||(o.frequency.setValueAtTime(f,k),o.frequency.exponentialRampToValueAtTime(e,k+d));G=A.createGain();G.gain.setValueAtTime(v,k);G.gain.exponentialRampToValueAtTime(1e-4,k+d);o.connect(q).connect(G).connect(A.destination);o.start(k);o.stop(k+d)}};
Nz=(s=A.createBufferSource())=>(s.buffer=Bf,s.loop=1,s);
A=l=lt=0;
// spawn on a grid corner (always clear of trunks); candles too
R=_=>{px=round(random()*999)*4;pz=4e3;yw=pt=n=bo=fs=sv=hb=st=0;sx=px;sz=pz-30;B=1;C();J.innerHTML='0 / 7'};
C=_=>{a=random()*7;r=16+n*3;cx=round((px+sin(a)*r)/4)*4;cz=round((pz+cos(a)*r)/4)*4};
R();st=2;J.innerHTML='PALE<p>light seven candles. it moves only in the dark.<p>click';
onclick=_=>{V.requestPointerLock();
 if(!A){A=new AudioContext;Bf=A.createBuffer(1,3e5,44100);for(d=Bf.getChannelData(i=0);i<3e5;)d[i++]=random()*2-1;
  // wind
  w=Nz();Q=A.createBiquadFilter();G=A.createGain();G.gain.value=.2;w.connect(Q).connect(G).connect(A.destination);w.start();
  // dread cluster, swells as it nears
  W=A.createGain();W.connect(A.destination);
  for(F of[523,554,587])o=A.createOscillator(),o.frequency.value=F,o.connect(W),o.start()}
 if(st&&sv*sv>.99||st>1)R()};
f=T=>{dt=min((T-l)/1e3,.1);l=T;t=T/1e3;
 lf=min(1,B*3)*(B<.3&&random()<.15?.2:1);
 dx=sx-px;dz=sz-pz;ds=hypot(dx,dz);fe=max(0,1-ds/14);
 if(!st){
  v=K[87]-K[83];m=K[68]-K[65];
  px+=(sin(yw)*v+cos(yw)*m)*2.4*dt;pz+=(cos(yw)*v-sin(yw)*m)*2.4*dt;
  [r,a,b]=D(px,pz);if(r<.4)k=(.4-r)/hypot(a,b),px+=a*k,pz+=b*k;
  if(v|m){bo+=dt*9;if((k=floor(bo/PI))-fs)fs=k,Z(500,0,.15,.3,1)}
  B=max(0,B-dt/80);
  // it freezes in the beam (and the beam drains)
  if(lf>.3&&(sin(yw)*dx+cos(yw)*dz)/ds>.92&&ds<22)B-=dt/40;else k=(.9+n*.25)*dt/ds,sx-=dx*k,sz-=dz*k;
  if(ds>32)sx=px-sin(yw)*20,sz=pz-cos(yw)*20;
  if(t>hb)hb=t+1.2-fe*.8,Z(90,30,.25,.3+fe),setTimeout(_=>Z(80,30,.2,.2+fe),180);
  if(random()<dt/20)lt=1,setTimeout(_=>Z(90,0,4,.6,1),900+random()*2e3);
  if(hypot(px-cx,pz-cz)<1)n++,B=1,Z(880,870,3,.2),J.innerHTML=n+' / 7',n>6?(st=1,J.innerHTML='dawn.<p>click'):C();
  if(ds<1)st=-1,Z(3e3,0,2,1,1),Z(700,50,2,.6),J.innerHTML='it found you<p>'+n+' / 7';
 }
 if(st<0)yw=atan2(dx,dz),pt=.6,sx=px+sin(yw)*1.3,sz=pz+cos(yw)*1.3,fe=.4,lf=1;
 if(st>1)yw=sin(t*.1)*.6;
 if(st&&st<2)sv+=(st-sv)*dt*.7;
 lt*=.93;
 A&&(W.gain.value=fe*fe*.02,Q.frequency.value=300+200*sin(t*.3));
 g.uniform1fv(U,[t,yw,pt,px,pz,sx,sz,cx,cz,lf,fe,V.width,V.height,1.55+abs(sin(bo))*.06,sv,lt*(random()>.4)]);
 g.drawArrays(4,0,3);requestAnimationFrame(f)};
f(0)}
