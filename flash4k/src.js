let M=Math,S=M.sin,Q=M.cos,W=320,H=180,C=c.getContext('2d'),I=C.createImageData(W,H),D=I.data,
PH=new Float32Array(W*H*3),
X=0,Y=0,a=-1.97,fx=-14,fy=16,fz=0,gx=22,gy=-50,
t=0,fd=9,fa=0,tf=-999,film=12,e=0,et=0,tt=0,ti=0,fl=0,hz=90,wk=0,k={},A,nb,
tx=[[99,"Mara ran into the pines at dusk. Her camera has twelve flashes.<br><small>&larr; &rarr; turn &middot; &uarr; walk &middot; SPACE flash</small>"],
[46,'Her flashlight, blinking in the trees.'],
[36,'It walks when I walk. It stops when the flash fires.'],
[22,'It poses for every picture.'],
[9,'Mara?']],
say=s=>{T.innerHTML=s;T.style.opacity=1;tt=t},
Z=(u,w,s,k=-w/s)=>u*u+(w+s*.87)**2<s*s*.0072||k>0&&(M.abs(u)<s*(.035+.17*k*k)*M.min(1,(.8-k)*14)||k>.2&&k<.72&&M.abs(M.abs(u)-s*(.1+.06*(.72-k)))<s*.022)&&(k>.38||M.abs(u)>s*.012),
TR=(x,y,i=M.floor(x/4),j=M.floor(y/4),h=M.abs(S(i*127.1+j*311.7)*43758.5%1))=>h>.35&&i*i+j*j>1&&i*9+j!=32&&[i*4+2+S(h*99)*1.3,j*4+2+S(h*71)*1.3,.15+h*.45,h],
B=(v,p,d,r)=>{if(A){let s=A.createBufferSource(),g=A.createGain(),n=A.currentTime,P=A.createStereoPanner();s.buffer=nb;s.playbackRate.value=r;g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.001,n+d);P.pan.value=p;s.connect(g).connect(P).connect(A.destination);s.start(0,M.random()*2)}},
O=[],
Rn=ph=>{
 let fdx=fx-X,fdy=fy-Y,fd=M.hypot(fdx,fdy),fa=(M.atan2(fdy,fdx)-a+9.42)%6.28-3.14,fsx=(fa+.5)*W,
  gd=M.hypot(gx-X,gy-Y),ga=(M.atan2(gy-Y,gx-X)-a+9.42)%6.28-3.14,gsx=(ga+.5)*W,gsy=hz+1.4*W/gd,
  bl=S(t*.05)>-.7&&M.random()>.06,fd2=M.exp((tf-t)/50);
 for(let x=0;x<W;x++){
  let ca=x/W-.5,dx=Q(a+ca),dy=S(a+ca),cs=Q(ca),d=.2,q,hx,hy,lam=0,u=0;
  for(;d<22;d+=ph?.04:.15)if(hx=X+dx*d,hy=Y+dy*d,(q=TR(hx,hy))&&(hx-q[0])**2+(hy-q[1])**2<q[2]*q[2])break;
  if(d<22)hx=(hx-q[0])/q[2],hy=(hy-q[1])/q[2],lam=-hx*dx-hy*dy,u=M.atan2(hy,hx);
  let tb=hz+1.6*W/(d*cs),fi=fd<d&&M.abs(x-fsx)*fd<.5*W,uu=(x-fsx)*fd/W;
  for(let y=0,i=x*3,j=x*4;y<H;y++,i+=W*3,j+=W*4){
   let hf=1.6+(hz-y)*fd/W,inF=fi&&Z(uu,-hf,2.3),r=0,g=0,b=0;
   if(ph){
    let L,hg,al,o=.05*M.exp(-((x-160)**2+(y-90)**2)/5e3);
    if(inF){
     L=40/(fd*fd+.4);o+=(uu/.08)**2+((hf-2)/.12)**2;r=g=b=(o<1?.4-o*.3:.005)*L;o=0;
     if((M.abs(uu)-.055)**2+(hf-2.02)**2<.0003+(fd/W)**2)r=g=b=fd<3?0:6
    }else if(y<tb&&d<22){
     hg=1.6+(hz-y)*d*cs/W;L=40/(d*d+.4)*lam;
     al=(.3+.15*S(u*14+S(hg*2)*.6+q[3]*9)+.08*S(hg*9+S(u*7)*2)*S(u*31))*M.min(1,hg*3+.1);
     r=al*L;g=r*.86;b=r*.72;
    }else if(y>hz){
     hg=1.6*W/((y-hz)*cs);hx=X+dx*hg;hy=Y+dy*hg;
     al=M.abs(S(M.floor(hx*7)*91.3+M.floor(hy*7)*47.7)*9e3%1);
     L=90/(hg*hg+2.6)/M.hypot(hg,1.6)*(.15+.3*al);
     if(S(hx*5+S(hy*3)*3)*S(hy*4-hx)>.85)L*=.3;
     r=L;g=L*(.5+.25*al);b=L*.3
    }
    for(let[p,s,z]of O)if((L=M.hypot(x-p,y-s)/z)<1)o+=.1*L*L;
    PH[i]=r+o;PH[i+1]=g+o;PH[i+2]=b+o*1.15
   }else{
    let s=!inF&&d>=22&&y<hz?.03+.02*S(x*.02+y*.05+t*.003)*S(x*.007-y*.03):0,
     bc=gd<d&&bl?.5/(1+((x-gsx)**2+(y-gsy)**2)*gd*.05):0,
     vg=1-((x-160)**2+(y-90)**2)/45e3,n=(M.random()-.5)*12,
     P=v=>(1-M.exp(-v*vg))*270+n;
    D[j]=P(PH[i]*fd2+s*.6+bc);D[j+1]=P(PH[i+1]*fd2+s*.75+bc*.75);D[j+2]=P(PH[i+2]*fd2+s+bc*.4)
   }
  }
 }
},
snap=_=>{
 if(t-tf<40)return;
 tf=t;O=[];for(let n=6;n--;)O.push([M.random()*W,M.random()*H,2+M.random()*7]);
 Rn(1);B(.6,0,.08,2);
 if(A){let o=A.createOscillator(),g=A.createGain(),n=A.currentTime;o.frequency.setValueAtTime(900,n);o.frequency.exponentialRampToValueAtTime(5e3,n+1.2);g.gain.setValueAtTime(.02,n);g.gain.linearRampToValueAtTime(0,n+1.3);o.connect(g).connect(A.destination);o.start();o.stop(n+1.3)}
},
R=_=>{
 t++;
 let u=t-et,gd=M.hypot(gx-X,gy-Y);fd=M.hypot(fx-X,fy-Y);fa=(M.atan2(fy-Y,fx-X)-a+9.42)%6.28-3.14;
 if(!e){
  a+=((k[39]|k[68])-(k[37]|k[65]))*.045;
  let m=(k[38]|k[87])-(k[40]|k[83]),nx=X+Q(a)*m*.05,ny=Y+S(a)*m*.05,q=TR(nx,ny);
  if(m)q&&(nx-q[0])**2+(ny-q[1])**2<(q[2]+.3)**2?t%30||B(.5,0,.2,.2):(X=nx,Y=ny,++wk%26||B(.25,0,.15,.4));
  hz=90+(m?S(wk*.24)*1.5:0);
  if(fz>0)fz--;else fx+=(X-fx)/fd*(.04+fd*.003),fy+=(Y-fy)/fd*(.04+fd*.003),M.random()<.006+.04/fd&&B(M.min(1,3/fd),S(fa),.05,1);
  if(ti<tx.length&&gd<tx[ti][0])say(tx[ti++][1]);
  if(fd<1.1)e=2,et=t,fx=X+Q(a)*1.3,fy=Y+S(a)*1.3,hz=200,snap(),say('The camera fired on its own.');
  if(gd<1.6)e=1,et=t,say('Her flashlight. Still warm.')
 }else{
  if(u==220)say(e>1?'Police developed the roll. Twelve exposures. Thirteen photos.':'Behind me, a flash begins to charge.');
  if(e<2&&u==340)tf=t,PH.fill(4)
 }
 if(t-tt>360)T.style.opacity=0;
 Rn(0);
 C.putImageData(I,0,0);
 let f=M.exp((tf-t)/50);
 C.fillStyle='#f82';C.globalAlpha=f;C.fillText("'98 10 31",262,168);
 C.globalAlpha=.5;C.fillStyle='#999';C.fillText(film,10,168);C.globalAlpha=1;
 requestAnimationFrame(R)
};
c.width=W;c.height=H;D.fill(255);C.font='8px monospace';
onkeydown=E=>{
 k[E.keyCode]=1;
 if(e&&t-et>420)location.reload();
 if(!A){
  A=new AudioContext;nb=A.createBuffer(1,1e5,22050);
  let d=nb.getChannelData(0),s=A.createBufferSource(),f=A.createBiquadFilter(),g=A.createGain();
  for(let i=1e5;i--;)d[i]=M.random()*2-1;
  s.buffer=nb;s.loop=1;f.frequency.value=300;g.gain.value=.3;s.connect(f).connect(g).connect(A.destination);s.start()
 }
 if(E.keyCode==32&&!E.repeat&&!e&&film>0){
  film--;snap();
  if(M.abs(fa)<.55&&fd<16)fz=180,fd<6&&(fl++||say('It flinches from the light.'),fx=X-Q(a)*22,fy=Y-S(a)*22);
  film||say('No more film.')
 }
};
onkeyup=E=>k[E.keyCode]=0;
ontouchstart=E=>{let x=E.touches[0].clientX/innerWidth;E.touches.length>1?onkeydown({keyCode:32}):onkeydown({keyCode:x<.3?37:x>.7?39:38})};
ontouchend=_=>k[37]=k[38]=k[39]=0;
R()
