let M=Math,S=M.sin,W=320,H=180,C=c.getContext('2d'),I=C.createImageData(W,H),D=I.data,
p=0,v=1,L=1,F=0,Q=0,t=0,h=-300,e=0,et=0,tt=0,ti=0,k={},A,g,f,g2,E=1,hn=700,
tx=[[0,"Mother's house. The night of her funeral.<br><small>&rarr; walk &middot; &darr; hide the flame</small>"],
[160,'She kept the hall dark. "It follows warm things."'],
[320,'When the house goes quiet, hide the flame.'],
[1000,'Don\'t look back. Her only rule.'],
[1600,'Footsteps behind mine. Closer each time.'],
[2300,'Her door stands open. They nailed it shut.']],
say=s=>{T.innerHTML=s;T.style.opacity=1;tt=t},
Z=(u,w,s,k=-w/s)=>u*u+(w+s*.87)**2<s*s*.0072||k>0&&(M.abs(u)<s*(.035+.17*k*k)*M.min(1,(.8-k)*14)||k>.2&&k<.72&&M.abs(M.abs(u)-s*(.1+.06*(.72-k)))<s*.022)&&(k>.38||M.abs(u)>s*.012),
R=_=>{
t++;
let m=0,u=t-et,cu=k[40]|k[83]|k[32];
if(--hn<-200)hn=400+M.random()*600;
if(!e){
 m=(k[39]|k[68])-(k[37]|k[65]);
 if(m)v=m;
 p=M.max(0,p+m*(cu?.3:.9));
 L=M.max(0,L-1/6e3);
 if(v<0)h+=1.6;
 if(hn<0)h+=cu?m?.8:-1:3.2;
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
if(A)g.gain.value=.08+Q*1.5,f.frequency.value=200+Q*900,g2.gain.value=hn<70?0:M.min(.5,20/(p-h+1)),g.gain.value*=hn<70?.2:1;
if(t-tt>300)T.style.opacity=0;
let fl=L*(hn<70?.4+M.random()*.6:.85+.15*S(t*.3)*S(t*.71)+M.random()*.08)*(cu?60:700),SL=0,
 bob=m?M.abs(S(t*.15))*2:0,cx=160+7*v,cy=100+bob,hx=h-p+160,
 so=(p-M.round((p-201)/480)*480-201)*.4,
 fin=e==1&&u>145,sn=e>1&&u>100,sw=S(t*.02)*1.5+S(t*.053)*.7;
for(let y=0,i=0;y<H;y++){
 let j=sw+((e>1||p-h<90)&&M.random()<.04||y>173||M.abs(y-t*.7%400)<3?M.random()*14-4:0);
 for(let x=0;x<W;x++,i+=4){
  let w=x+j-160+p,a=(w%240+240)%240,n=M.floor(w/240),r=0,o=0,ew=0,ec=0,sh=1,
   q=((w-201)%480+720)%480,dx=x-cx,dy=y-cy;
  if(w>2720||w<-60);
  else if(y<18)r=y>14?.25:.04;
  else if(y<128){
   r=(.2+.07*(S(w*.3+S(y*.3)*2)*S(y*.3)>.3)+.02*S(w*1.5));
   let hu=a-90,hw=y-60-n*7%30;
   if(n>5&&(hu*hu+hw*hw<14||hw<-2&&hw>-11&&hu*hu<14&&S(hu*1.7)>-.2||hw>0&&hw<30&&hu*hu<9*S(hw/9+n)))o=1,r*=.3;
   if(y>98)o=1,r=a%40<3||y<101||y>124?.1:.2+.03*S(y*.5+S(w*.08)*6);
   if(a>20&&a<64&&y>38){
    o=1;r=a<24||a>60||y<42?.28:.14+.03*S(w*.7+S(y*.05)*3);
    if((a-57)**2+(y-88)**2<3)r=.7;
    if((n%3==1||n==11)&&a>(n>10?28:54))r=0
   }
   if(a>118&&a<162&&y>34&&y<88){
    o=1;r=.45+.1*S(a+y);
    if(a>122&&a<158&&y>38&&y<84){
     let ox=0,fy=y-58;
     o=0;r=.06+.02*S(a*.3)*S(y*.4);
     if((a-140-ox/2)**2/40+fy*fy/90<1)r=n>6&&S(a*2+y*3)*S(a-y)>.1?.07:.26-fy*.004;
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
  }
  if(Z(x-hx,y-152,84))r=ew=ec=sh=0;
  if(hn<70&&(M.abs(x-hx-1)-2)**2+(y-80)**2<.6)ec=.6;
  if(Z(x-160,y-150-bob,66)||y>107+bob&&y<111+bob&&dx*v<0&&dx*v>-8)r=ew=ec=0;
  if(M.abs(dx)<1.5&&dy>1&&dy<9)r=.9,o=0;
  if((dx+(hn<70)*v*2)**2*1.5+(dy+3+S(t*.5))**2*.4<6*L)ew=cu?.3:3;
  let lc=fl/(fl+dx*dx+dy*dy)*M.min(1,M.max(.25,.6+dx*v/50)),
   X=cx+dx/1.4,Y=cy+dy/1.4,
   lf=F*(.2+.8*M.max(0,1-(240-M.abs(q-240))/260))*sh;
  if(y<128&&(Z(X-160,Y-150-bob,66)||Z(X-hx,Y-152,84)))lc*=.2;
  if(M.random()<lc*.004)ew=.4;
  if(sn)lc=lf=ew=r=0,ec=M.random()*.5;
  if(fin)lc=lf=ew=0,ec=Z(x-160,y-200,190)||M.abs(x-160)>70?0:F*(.5+.4*(M.abs(x-160)<40&&y<99)),(M.abs(M.abs(x-160)-6)-1)**2+(y-37)**2<1.5&&(ec=.7);
  let vg=(1-((x-160)**2+(y-90)**2)/38e3)*E*((y+t)&1?.8:1),
   bd=(((x^y)&1)*8+(y&1)*4+((x^y)&2)+(y>>1&1))/16,
   P=z=>(M.sqrt(z*vg)+(M.random()-.5)*.05*E)*31+bd<<3,
   G=r*(o?.7:.92)*(lc*.6+lf*.65+.016)+ew*.7+ec*.75+lc*.035;
  SL+=G;
  D[i-8]=P(r*(lc+lf*.5+.012)+ew+ec*.6+lc*.07);
  D[i+1]=P(G);
  D[i+2]=P(r*(o?.5:.85)*(lc*.3+lf*.9+.028)+ew*.4+ec+lc*.015)
 }
}
E+=(M.max(.7,M.min(4,1.8e3/(SL+50)))-E)*.04;
C.putImageData(I,0,0);
C.fillText('PLAY \u25B6 0:0'+(t/3600|0)+':'+(1e2+t/60%60+'').slice(1,3),12,20);
requestAnimationFrame(R)
};
c.width=W;c.height=H;D.fill(255);C.font='8px monospace';C.fillStyle='#ccc';
onkeydown=E=>{
 k[E.keyCode]=1;
 if(e&&t-et>400)location.reload();
 if(!A){
  A=new AudioContext;
  let b=A.createBuffer(1,1e5,22050),d=b.getChannelData(0),s=A.createBufferSource(),o;
  for(let i=1e5;i--;)d[i]=M.random()*2-1;
  s.buffer=b;s.loop=1;f=A.createBiquadFilter();g=A.createGain();g2=A.createGain();o=A.createOscillator();
  s.connect(f).connect(g).connect(A.destination);
  o.type='sawtooth';o.frequency.value=55;o.connect(g2).connect(f);
  s.start();o.start()
 }
};
onkeyup=E=>k[E.keyCode]=0;
ontouchstart=E=>onkeydown({keyCode:E.touches[0].clientX<innerWidth/3?40:39});
ontouchend=_=>k[40]=k[39]=0;
R()
