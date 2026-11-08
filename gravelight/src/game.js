M=Math;document.body.innerHTML='<canvas id=c style=position:fixed;inset:0;width:100%;height:100%></canvas><p id=t style="position:fixed;inset:20% 0;text-align:center;color:#c43;font:5vh serif">';
B=new Uint8Array(1<<18).map(_=>M.random()*256);
c.width=innerWidth/2;c.height=innerHeight/2;g=c.getContext('webgl');for(k in g)g[k[0]+k[5]+k[9]]=g[k];
p=g.ceg();
['attribute vec4 a;void main(){gl_Position=a;}',"__Z__"].map((s,i)=>{x=g.ced(35633-i);g.srr(x,s);g.cla(x);g.ahd(p,x)});
g.lra(p);g.uom(p);
g.bur(34962,g.cef());g.bra(34962,new Float32Array([-1,3,-1,-1,3,-1]),35044);
g.eet(0);g.vxr(0,2,5126,0,0,0);
g.ber(3553,g.cet());g.taD(3553,0,6408,256,256,0,6408,5121,B);g.trt(3553,10241,9729);
L=g.gim(p,'U');
// collision: the shader's map() over the same texture bytes
D=(x,y,q=M.floor(x/2),r=M.floor(y/2),k=(q&255|(r&255)<<8)*4,u=x-(q+.3+.4*B[k]/255)*2,v=y-(r+.3+.4*B[k+1]/255)*2)=>B[k+2]<115&&q*q+r*r>1?B[k+2]<39?M.hypot(u,v)-.2-.15*B[k]/255:M.max(M.abs(u)-.3,M.abs(v)-.55):9;
Z=(f,v,d,t=au.currentTime,b=au.createBufferSource(),q=au.createBiquadFilter(),o=au.createGain())=>{b.buffer=nb;b.loop=1;q.frequency.value=f;b.connect(q).connect(o).connect(au.destination);o.gain.setValueAtTime(v,t);o.gain.exponentialRampToValueAtTime(1e-4,t+d);b.start(t);b.stop(t+d)};
R=_=>{X=Y=n=F=z=hb=0;m=[0,-14];ol=1;S=1;C=[];t.innerHTML='';
 for(i=0;i<5;i++)a=M.random()*7,r=5+i*2.5,C.push(M.cos(a)*r,M.sin(a)*r,1)};
R();S=A=lt=fe=T0=0;
t.innerHTML='GRAVE LIGHT<br><small>take 5 candles. WASD, mouse<br>it moves in the dark';
K=new Int8Array(99);onkeydown=onkeyup=e=>K[e.keyCode]=e.type<'keyu';
onmousemove=e=>A=M.atan2(innerHeight/2-e.clientY,e.clientX-innerWidth/2);
onclick=_=>{self.au||(au=new AudioContext,nb=au.createBuffer(1,1<<17,44100),nb.getChannelData(0).forEach((_,i,a)=>a[i]=M.random()*2-1),Z(1500,.12,1e4));S-1&&R()};
f=T=>{T/=1e3;dt=M.min(T-T0,.05);T0=T;
 if(S==1){
  s=dt*2.2;u=K[68]-K[65];v=K[87]-K[83];l=M.hypot(u,v)||1;u*=s/l;v*=s/l;
  D(X+u,Y)>.13&&(X+=u);D(X,Y+v)>.13&&(Y+=v);
  u=X-m[0];v=Y-m[1];d=M.hypot(u,v);
  lt=ol>0&&d<7&&-(u*M.cos(A)+v*M.sin(A))/d>.8;
  e=lt?0:dt*(.8+n*.15)/d;m[0]+=u*e;m[1]+=v*e;
  ol=M.max(ol-dt*(lt?.07:.022),0);
  d>12&&(m=[X-M.cos(A)*9,Y-M.sin(A)*9]);
  fe=M.max(0,1-d/7);
  d<.35&&(S=2,Z(3e3,.6,2),t.innerHTML='IT FOUND YOU');
  for(i=0;i<15;i+=3)C[i+2]&&M.hypot(X-C[i],Y-C[i+1])<.6&&(C[i+2]=0,ol=M.min(ol+.5,1),++n>4&&(S=3,t.innerHTML='DAWN'));
  (hb-=dt)<0&&fe>.1&&(Z(70,9,.3),hb=1.2-fe*.8);
  M.random()<dt*.06&&(F=1,setTimeout(_=>Z(200,3,4),900))
 }
 S>1&&(z=M.min(z+dt*.5,1));F=M.max(F-dt*1.5,0);
 g.uniform3fv(L,[c.width,c.height,T,X,Y,A,...m,!lt,ol,fe,F*M.random(),S==2&&z,S==3&&z,n,...C]);
 g.drs(4,0,3);requestAnimationFrame(f)};
f(0);
