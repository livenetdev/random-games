let M=Math,S=M.sin,W=320,H=180,C=c.getContext('2d'),I=C.createImageData(W,H),D=I.data,
p=0,v=1,L=1,F=0,Q=0,t=0,h=-300,e=0,et=0,tt=0,ti=0,k={},A,g,f,g2,g3,sg,
tx=[[0,"Mother's house. The night of her funeral.<br><small>&rarr;</small>"],
[160,'She kept the hall dark. "It follows warm things," she said.'],
[460,'The portraits turn toward the flame.'],
[760,'Footsteps behind me. They stop when I stop.'],
[1060,'Don\'t look back. That was her only rule.'],
[1400,'The wax is nearly gone.'],
[1800,'Breath on my neck. Cold. Patient.'],
[2300,'Her door stands open. They nailed it shut.']],
say=s=>{T.innerHTML=s;T.style.opacity=1;tt=t},
Z=(u,w,s,k=-w/s)=>u*u+(w+s*.87)**2<s*s*.0072||k>0&&(M.abs(u)<s*(.035+.17*k*k)*M.min(1,(.8-k)*14)||k>.2&&k<.72&&M.abs(M.abs(u)-s*(.1+.06*(.72-k)))<s*.022)&&(k>.38||M.abs(u)>s*.012),
R=_=>{
t++;
let m=0,u=t-et;
if(!e){
 m=(k[39]|k[68])-(k[37]|k[65]);
 if(m&&(v=m,A&&t%24<1)){let n=A.currentTime;sg.gain.setValueAtTime(.7,n);sg.gain.exponentialRampToValueAtTime(.01,n+.15)}
 p=M.max(0,p+m*.8);
 L=M.max(0,L-1/7e3);
 if(v<0)h+=1.6;
 h=M.max(h,p-30-280*L);
 if(ti<tx.length&&p>=tx[ti][0])say(tx[ti++][1]);
 if(p-h<22)e=2,et=t,say('A cold hand closes over mine.');
 if(p>2670)e=1,et=t,say('The flame dies on her threshold.')
}else{
 L=M.max(0,L-.01);
 if(u==220)say(e<2?'"Thank you for the light," it says, in her voice.':'"Warm," it whispers.')
}
F*=.88;
if(M.random()<.003||e==1&&(u==150||u==158))F=1;
Q+=(F-Q)*.03;
if(A)g.gain.value=.08+Q*1.5,f.frequency.value=200+Q*900,g3.gain.value=g2.gain.value=M.min(.5,20/(p-h+1));
if(t-tt>300)T.style.opacity=0;
let fl=L*(.85+.15*S(t*.3)*S(t*.71)+M.random()*.08)*700,
 bob=m?M.abs(S(t*.15))*2:0,cx=160+7*v,cy=100+bob,hx=h-p+160,
 so=(p-M.round((p-201)/480)*480-201)*.4,
 fin=e==1&&u>145;
for(let y=0,i=0;y<H;y++){
 let j=(e>1||p-h<90)&&M.random()<.04?M.random()*12-6:0;
 for(let x=0;x<W;x++,i+=4){
  let w=x+j-160+p,a=(w%240+240)%240,n=M.floor(w/240),r=0,o=0,ew=0,ec=0,sh=1,
   q=((w-201)%480+720)%480,dx=x-cx,dy=y-cy;
  if(w>2720||w<-60);
  else if(y<18)r=y>14?.25:.04;
  else if(y<128){
   r=(.2+.07*(S(w*.3+S(y*.3)*2)*S(y*.3)>.3)+.02*S(w*1.5))*(1-.6*M.max(0,S(w*.011+S(y*.05))*S(y*.023-w*.006)));
   if(y>98)o=1,r=a%40<3||y<101||y>124?.1:.2+.03*S(y*.5+S(w*.08)*6);
   if(a>20&&a<64&&y>38){
    o=1;r=a<24||a>60||y<42?.28:.14+.03*S(w*.7+S(y*.05)*3);
    if((a-57)**2+(y-88)**2<3)r=.7;
    if((n%3==1||n==11)&&a>(n>10?28:54))r=0
   }
   if(a>118&&a<162&&y>34&&y<88){
    o=1;r=.45+.1*S(a+y);
    if(a>122&&a<158&&y>38&&y<84){
     let ox=M.max(-2,M.min(2,(p-n*240-140)/60)),fy=y-58;
     o=0;r=.06+.02*S(a*.3)*S(y*.4);
     if((a-140-ox/2)**2/40+fy*fy/90<1)r=.26-fy*.004;
     if((M.abs(a-140-ox)-4)**2+(y-56)**2<2.5)r=.02
    }
   }
   if(n%2==0&&a>180&&a<222&&y>30&&y<92){
    r=a<183||a>219||y<33||y>89||a>199&&a<203||y>59&&y<62?.2:0;
    if(!r&&S(a*.3+S(y*.2)*3)*S(y*.11-a*.05)<.5)ec=.03+F+(S(a*1.3)*S(y*.4-t*.8+a*a)>.97)*.06
   }
   if(Z(x-160-so,y-128,110)||p-h<200&&Z(x-hx-so*1.2,y-128,130))sh=.1
  }else{
   let s=(y-90)/38,fx=p+(x+j-160)/s,fd=12/s;
   o=1;r=.1+.03*S(fx*.15+S(fd*40)*4);
   if(fd%1<.1||M.abs((fx+M.floor(fd)*71)%130)<1.5)r=.04;
   let b=((fx-201)%480+720)%480;
   ec=(F*.4+.015)*M.max(0,1-M.abs(b-240)/26)*M.max(0,1-(y-128)/40)
  }
  if(Z(x-hx,y-152,84))r=ew=ec=sh=0;
  if((M.abs(x-hx-1)-2)**2+(y-80)**2<.6)ec=.5;
  if(Z(x-160,y-150-bob,66)||y>107+bob&&y<111+bob&&dx*v<0&&dx*v>-8)r=ew=ec=0;
  if(M.abs(dx)<1.5&&dy>1&&dy<9)r=.9,o=0;
  if(dx*dx*1.5+(dy+3+S(t*.5))**2*.4<6*L)ew=3;
  let lc=fl/(fl+dx*dx+dy*dy)*M.min(1,M.max(.25,.6+dx*v/50)),
   lf=F*(.2+.8*M.max(0,1-(240-M.abs(q-240))/260))*sh;
  if(M.random()<lc*.004)ew=.4;
  if(fin)lc=lf=ew=0,ec=Z(x-160,y-200,190)||M.abs(x-160)>70?0:F*(.5+.4*(M.abs(x-160)<40&&y<99)),(M.abs(M.abs(x-160)-6)-1)**2+(y-37)**2<1.5&&(ec=.7);
  let vg=1-((x-160)**2+(y-90)**2)/38e3,nz=M.random()*.05,
   bd=(((x^y)&1)*8+(y&1)*4+((x^y)&2)+(y>>1&1))/16,
   P=z=>(M.sqrt(z*vg)+nz)*31+bd<<3;
  D[i]=P(r*(lc+lf*.5+.012)+ew+ec*.6+lc*.07);
  D[i+1]=P(r*(o?.7:.92)*(lc*.6+lf*.65+.016)+ew*.7+ec*.75+lc*.035);
  D[i+2]=P(r*(o?.5:.85)*(lc*.3+lf*.9+.028)+ew*.4+ec+lc*.015)
 }
}
C.putImageData(I,0,0);
requestAnimationFrame(R)
};
c.width=W;c.height=H;D.fill(255);
onkeydown=E=>{
 k[E.keyCode]=1;
 if(e&&t-et>400)location.reload();
 if(!A){
  A=new AudioContext;
  let b=A.createBuffer(1,1e5,22050),d=b.getChannelData(0),s=A.createBufferSource(),o;
  for(let i=1e5;i--;)d[i]=M.random()*2-1;
  s.buffer=b;s.loop=1;f=A.createBiquadFilter();g=A.createGain();g2=A.createGain();g3=A.createGain();sg=A.createGain();sg.gain.value=0;f.connect(sg).connect(A.destination);o=A.createDelay();o.delayTime.value=.35;sg.connect(o).connect(g3).connect(A.destination);o=A.createOscillator();
  s.connect(f).connect(g).connect(A.destination);
  o.type='sawtooth';o.frequency.value=55;o.connect(g2).connect(f);
  s.start();o.start()
 }
};
onkeyup=E=>k[E.keyCode]=0;
ontouchstart=E=>onkeydown({keyCode:E.touches[0].clientX<innerWidth/3?37:39});
ontouchend=_=>k[37]=k[39]=0;
R()
