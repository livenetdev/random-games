#version 300 es
precision highp float;
uniform vec2 R;
uniform float T;
uniform vec3 P;
uniform vec3 D;
uniform vec2 A;
uniform vec4 E;
uniform vec3 G;
uniform vec4 Q[4];
uniform sampler2D M;
uniform float N;
out vec4 o;
#define S 3.
#define H 3.2
// torch light origin, entity material flag
vec3 TL;
float em;
float h1(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float ns(vec2 p){vec2 i=floor(p),f=fract(p);f*=f*(3.-2.*f);return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+1.),f.x),f.y);}
float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*ns(p);p=p*2.07+3.7;a*=.5;}return s;}
float wl(vec2 c){return texture(M,(c+.5)/N).r;}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float cap(vec3 p,vec3 a,vec3 b,float r){vec3 pa=p-a,ba=b-a;return length(pa-ba*clamp(dot(pa,ba)/dot(ba,ba),0.,1.))-r;}
float sm(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
// ---------------------------------------------------------------- the nurse
float ent(vec3 p){
  p.xz-=E.xy;p.xz*=rot(E.z);
  float ag=E.w;
  p.x+=ag*.025*sin(T*70.+p.y*11.);
  float y=p.y,a=atan(p.z,p.x);
  float rb=length(p.xz)-mix(.42,.12,clamp(y/1.72,0.,1.))-.025*sin(a*9.+y*4.+sin(T)*.5)-.07*smoothstep(.7,0.,y)*ns(vec2(a*4.,T*.6));
  rb=max(rb*.7,max(y-1.72,.22*ns(vec2(a*7.,3.))-y));
  float bd=sm(rb,cap(p,vec3(-.2,1.66,0),vec3(.2,1.66,0),.07),.1);
  vec3 hp=p-vec3(.04,2.03,.04);hp.xy*=rot(.4+ag*.5*sin(T*31.));hp.yz*=rot(-.25);
  float hd=(length(hp/vec3(.1,.155,.115))-1.)*.1;
  vec3 q=hp;q.x=abs(q.x);
  hd=max(hd,.034-length(q-vec3(.042,.025,.1)));
  hd=max(hd,(1.-length((hp-vec3(0,-.075,.105))/vec3(.028,.065,.05)))*.028);
  float sk=min(hd,cap(p,vec3(0,1.62,0),vec3(.03,1.95,.04),.042));
  vec3 ap=p;float sg=sign(ap.x);ap.x=abs(ap.x);
  float sv=sin(T*1.7+sg)*.04+ag*.06*sin(T*43.+sg);
  vec3 e0=vec3(.31,1.1,.09+sv),w0=vec3(.29,.48,.16+sv*2.);
  float ar=min(cap(ap,vec3(.23,1.64,0),e0,.042),cap(ap,e0,w0,.028));
  for(int i=0;i<4;i++){float f=float(i)-1.5;ar=sm(ar,cap(ap,w0,w0+vec3(f*.025,-.3+abs(f)*.05,.05+sv),.008),.02);}
  sk=min(sk,ar);
  em=step(sk,bd);
  return sm(bd,sk,.04);
}
float te(vec3 ro,vec3 rd,float tm){
  vec2 oc=ro.xz-E.xy;float a=dot(rd.xz,rd.xz),b=dot(oc,rd.xz),c=dot(oc,oc)-.6,d=b*b-a*c;
  if(d<0.)return 1e9;d=sqrt(d);
  float t=max((-b-d)/a,0.),t1=min((-b+d)/a,tm);
  for(int i=0;i<56;i++){if(t>t1)break;float s=ent(ro+rd*t);if(s<.002)return t;t+=s;}
  return 1e9;
}
float esh(vec3 p,vec3 l){
  if(length(p.xz-E.xy)>9.)return 1.;
  vec3 rd=l-p;float tl=length(rd);rd/=tl;
  float r=1.,t=.06;
  for(int i=0;i<22;i++){float d=ent(p+rd*t);r=min(r,10.*d/t);t+=clamp(d,.04,.5);if(t>tl||r<.01)break;}
  return clamp(r,0.,1.);
}
// ---------------------------------------------------------------- lamps
float lamp(vec2 c){
  if(wl(c)>.5)return 0.;
  float k=h1(c*3.7+.5);
  if(k>.42)return 0.;
  vec2 lp=(c+.5)*S;
  float near=smoothstep(7.,2.,length(lp-E.xy));
  float f=step(.25+.5*near,ns(vec2(T*(3.+k*40.),k*99.)));
  f=mix(f,1.,step(.2,k)*(1.-near));
  return f*(k<.06?.15:1.);
}
vec3 LC(vec2 c){return vec3((c.x+.5)*S,H-.12,(c.y+.5)*S);}
// ---------------------------------------------------------------- surfaces
// height fields (mm-ish), used for bump + albedo masks
float hw(vec2 q,float fd){
  float v=q.y,fu=mod(q.x,S);
  float h=fb(q*2.)*.4;
  if(fd<.3&&abs(fu-1.5)<.62&&v<2.25){
    float x=abs(fu-1.5),fr=step(.52,x)+step(2.15,v);
    vec2 pq=vec2(x,mod(v-.12,1.03));
    return fr*1.5+(1.-fr)*(smoothstep(.0,.05,min(.45-x,min(pq.y,.92-pq.y)))*.8+fb(vec2(q.x*3.,v*50.))*.15);
  }
  if(v<.14)return 1.2;
  if(v<1.25){vec2 t=fract(q/.15);vec2 e=min(t,1.-t);float g=smoothstep(0.,.05,min(e.x,e.y));
    return g*1.+h*.2-step(.985,h1(floor(q/.15)+3.))*1.5;}
  if(v<1.33)return 1.6;
  float pe=fb(q*1.3+5.)+.12*smoothstep(2.,3.2,v);
  return h+(1.-smoothstep(.58,.6,pe))*.6+exp(-abs(pe-.59)*200.)*.4;
}
float hf(vec2 q){
  vec2 t=fract(q/.3),e=min(t,1.-t);
  return smoothstep(0.,.02,min(e.x,e.y))*.4+fb(q*3.)*.3-smoothstep(.72,.75,fb(q*.4+9.))*.3;
}
float hc(vec2 q){
  vec2 t=fract(q/.6),e=min(t,1.-t);float m=min(e.x,e.y);
  return m<.02?1.:fb(q*14.)*.3-step(.93,h1(floor(q/.6)))*3.;
}
vec3 bump(vec3 n,vec3 tu,vec3 tv,vec2 q,int ty,float fd){
  vec2 e=vec2(.004,0);
  float h0,hu,hv;
  if(ty==0){h0=hw(q,fd);hu=hw(q+e,fd);hv=hw(q+e.yx,fd);}
  else if(ty==1){h0=hf(q);hu=hf(q+e);hv=hf(q+e.yx);}
  else{h0=hc(q);hu=hc(q+e);hv=hc(q+e.yx);}
  return normalize(n-((hu-h0)*tu+(hv-h0)*tv)*.6);
}
vec3 ALB;float RG;vec3 EMI;
void mat(vec3 p,vec2 q,int ty,float fd,vec2 fc,vec3 n){
  EMI=vec3(0);RG=.8;
  float st=fb(vec2(q.x*2.5,q.y*.25)+fd*9.);
  if(ty==0){
    float v=q.y,fu=mod(q.x,S);
    float pe=fb(q*1.3+5.)+.12*smoothstep(2.,3.2,v);
    vec3 pl=vec3(.32,.29,.25)*(.7+.5*fb(q*4.));
    ALB=mix(vec3(.36,.42,.36),pl,smoothstep(.58,.6,pe));RG=.7;
    if(v<1.33){vec2 c=floor(q/.15),t=fract(q/.15),e=min(t,1.-t);float g=1.-smoothstep(0.,.05,min(e.x,e.y));
      ALB=mix(vec3(.16,.27,.22)*(.8+.4*h1(c)),vec3(.12,.11,.09),g);RG=mix(.12,.9,g);
      if(h1(c+3.)>.985){ALB=pl*.6;RG=.9;}
      if(v>1.25){ALB=vec3(.05,.1,.08);RG=.2;}}
    if(v<.14){ALB=vec3(.05,.035,.025);RG=.4;}
    if(fd<.3&&abs(fu-1.5)<.62&&v<2.25){
      float x=abs(fu-1.5),gr=fb(vec2(q.x*3.,v*50.));
      ALB=vec3(.14,.075,.04)*(.6+.8*gr)*(step(.52,x)*.6+.7);RG=.35+.3*gr;
      vec2 k=vec2(fu-1.5-.42*sign(fd-.15),v-1.05);
      if(length(k)<.04){ALB=vec3(.5,.35,.12);RG=.15;}
      if(abs(fu-1.5)<.1&&abs(v-1.7)<.05)ALB=vec3(.35,.3,.2);
    }
    if(fd>.82){float w=step(.62,ns(q*vec2(26.,7.)))*step(abs(v-1.55),.28)*step(abs(fu-1.5),1.1);
      float hand=smoothstep(.55,.6,fb(q*3.+fd*40.))*step(v,1.9)*step(.8,v);
      ALB=mix(ALB,vec3(.09,.008,.005),max(w,hand)*.9);RG=mix(RG,.25,max(w,hand));}
    float wet=smoothstep(.5,.75,st)*smoothstep(.6,3.,v+st);
    ALB*=mix(vec3(1),vec3(.62,.48,.3),wet*.8);
    ALB*=1.-.65*smoothstep(.6,0.,v+fb(q*3.)*.3);
    ALB*=1.-.4*smoothstep(2.3,3.2,v);
    float cr=1.-smoothstep(.0,.012,abs(fb(q*1.7+2.)-.5));ALB*=1.-cr*.7*step(.55,fb(q*.5));
  }else if(ty==1){
    vec2 c=floor(q/.3),t=fract(q/.3),e=min(t,1.-t);
    float ck=mod(c.x+c.y,2.),g=1.-smoothstep(0.,.02,min(e.x,e.y));
    ALB=mix(vec3(.42,.39,.32),vec3(.03),ck)*(.8+.35*h1(c));
    ALB=mix(ALB,vec3(.05,.045,.035),g);
    float dirt=smoothstep(.35,.85,fb(q*.8+2.));
    ALB=mix(ALB,vec3(.1,.085,.06),dirt*.7);RG=.45+.5*dirt;
    float pud=smoothstep(.66,.69,fb(q*.35+7.));
    ALB*=1.-pud*.6;RG=mix(RG,.03,pud);
    float bl=smoothstep(.7,.72,fb(q*vec2(.5,3.)+fd*3.))*step(.7,h1(fc*1.3));
    ALB=mix(ALB,vec3(.07,.005,.003),bl);RG=mix(RG,.2,bl);
  }else{
    vec2 c=floor(q/.6),t=fract(q/.6),e=min(t,1.-t);
    ALB=vec3(.42,.4,.36)*(.75+.4*h1(c))*(1.-.3*fb(q*14.));
    if(min(e.x,e.y)<.02){ALB=vec3(.25);RG=.4;}
    if(h1(c)>.93)ALB=vec3(.004);
    float rr=fb(q*.9+4.);ALB*=mix(vec3(1),vec3(.55,.4,.22),smoothstep(.55,.62,rr));
    ALB*=1.-.6*exp(-abs(rr-.62)*40.);
    float lv=lamp(fc);vec2 l=abs(q-(fc+.5)*S);
    if(h1(fc*3.7+.5)<.42&&l.x<.18&&l.y<.65){ALB=vec3(.6);EMI=vec3(1.,.95,.8)*lv*14.*(1.-smoothstep(.1,.18,l.x));}
  }
}
vec3 brdf(vec3 n,vec3 l,vec3 v){
  float nl=max(dot(n,l),0.);
  float sp=pow(max(dot(n,normalize(l+v)),0.),mix(6.,300.,(1.-RG)*(1.-RG)))*(1.-RG)*(1.-RG)*2.;
  return (ALB+sp)*nl;
}
vec3 shade(vec3 p,vec3 n,vec3 v,vec2 fc,float ao){
  vec3 c=vec3(0);
  vec3 l=TL-p;float d=length(l);l/=d;
  float cs=dot(-l,D);
  float cone=(smoothstep(.86,.975,cs)*(.92+.08*sin(acos(min(cs,1.))*90.))+smoothstep(.6,.86,cs)*.06)*(.85+.15*fb(-l.xy*40.));
  if(cone>0.)c+=vec3(1.,.9,.72)*G.x*cone*esh(p,TL)*9./(d*d+.1)*brdf(n,l,v);
  for(int i=0;i<5;i++){
    vec2 o2=i==0?vec2(0):i==1?vec2(1,0):i==2?vec2(-1,0):i==3?vec2(0,1):vec2(0,-1);
    vec2 lc=fc+o2;float li=lamp(lc);
    if(li>0.){vec3 L=LC(lc),ll=L-p;float dd=length(ll);ll/=dd;
      c+=vec3(.9,1.,.82)*li*2.6/(dd*dd+.4)*brdf(n,ll,v)*(i==0?esh(p,L):1.)*(i==0?1.:.55);}
  }
  for(int i=0;i<4;i++)if(Q[i].w>0.){vec3 ll=Q[i].xyz-p;float dd=length(ll);if(dd<5.)c+=vec3(1.,.25,.08)*(.6+.4*sin(T*3.+float(i)))*1.2/(dd*dd+.3)*brdf(n,ll/dd,v);}
  return c*ao+ALB*vec3(.006,.008,.01)*ao+EMI;
}
// fake AO: distance to neighbouring wall blocks inside a cell
float aoc(vec3 p,vec2 c){
  vec2 l=p.xz-c*S;float a=1.;
  if(wl(c+vec2(-1,0))>.5)a*=1.-.55*exp(-l.x/.35);
  if(wl(c+vec2(1,0))>.5)a*=1.-.55*exp(-(S-l.x)/.35);
  if(wl(c+vec2(0,-1))>.5)a*=1.-.55*exp(-l.y/.35);
  if(wl(c+vec2(0,1))>.5)a*=1.-.55*exp(-(S-l.y)/.35);
  return a;
}
void main(){
  vec2 uv=(gl_FragCoord.xy*2.-R)/R.y;
  float fr=G.y;
  uv+=fr*.012*vec2(sin(uv.y*9.+T*7.),cos(uv.x*7.+T*5.));
  uv.x+=fr*.05*step(.992,h1(vec2(floor(uv.y*40.),floor(T*24.))))*(h1(vec2(T))-.5);
  vec3 f=vec3(cos(A.y)*sin(A.x),sin(A.y),cos(A.y)*cos(A.x));
  vec3 r=normalize(vec3(-f.z,0,f.x)),u=cross(r,f);
  vec3 rd=normalize(f+(uv.x*r+uv.y*u)*.62),ro=P;
  TL=P+r*.22-u*.22+f*.1;
  // DDA through the block grid
  vec2 p0=ro.xz/S,c=floor(p0),sg=sign(rd.xz),dt=abs(1./rd.xz),sd=(sg*(c-p0)+sg*.5+.5)*dt,mk=vec2(0);
  float t=1e9;
  for(int i=0;i<72;i++){mk=step(sd,sd.yx);sd+=mk*dt;c+=mk*sg;if(wl(c)>.5){t=dot(sd-dt,mk)*S;break;}}
  vec3 n=vec3(-mk.x*sg.x,0,-mk.y*sg.y);int ty=0;
  float tp=rd.y<0.?-ro.y/rd.y:(H-ro.y)/rd.y;
  if(tp<t){t=tp;ty=rd.y<0.?1:2;n=vec3(0,-sign(rd.y),0);}
  vec3 p=ro+rd*t;
  vec2 fc=floor((p.xz-n.xz*.01)/S);
  vec3 col;
  float te0=te(ro,rd,t);
  if(te0<t){
    t=te0;p=ro+rd*t;
    vec2 e=vec2(.002,0);
    n=normalize(vec3(ent(p+e.xyy)-ent(p-e.xyy),ent(p+e.yxy)-ent(p-e.yxy),ent(p+e.yyx)-ent(p-e.yyx)));
    ent(p);
    ALB=em>.5?vec3(.42,.42,.43):vec3(.012,.011,.01);RG=em>.5?.45:.9;EMI=vec3(0);
    fc=floor(p.xz/S);
    col=shade(p,n,-rd,fc,1.);
    col+=ALB*pow(1.-max(dot(n,-rd),0.),3.)*.15*G.x;
  }else{
    vec2 q;vec3 tu,tv;float fd=0.;
    if(ty==0){vec3 tg=vec3(-n.z,0,n.x);q=vec2(dot(p,tg),p.y);tu=tg;tv=vec3(0,1,0);fd=h1(c*7.1+n.xz*3.3);}
    else{q=p.xz;tu=vec3(1,0,0);tv=vec3(0,0,1);fd=h1(fc);}
    mat(p,q,ty,fd,fc,n);
    vec3 nb=bump(n,tu,tv,q,ty,fd);
    float ao=1.;
    if(ty==0){
      float v=p.y,fu=mod(q.x,S);vec2 F=c+n.xz,tg=vec2(-n.z,n.x);
      ao=(1.-.6*exp(-v/.3))*(1.-.45*exp(-(H-v)/.35));
      if(wl(F-tg)>.5)ao*=1.-.55*exp(-fu/.35);
      if(wl(F+tg)>.5)ao*=1.-.55*exp(-(S-fu)/.35);
      if(fd<.3&&abs(fu-1.5)<.62&&v<2.25)ao*=.6+.4*smoothstep(.5,.6,abs(fu-1.5));
    }else ao=aoc(p,fc);
    col=shade(p+n*.01,nb,-rd,fc,ao);
  }
  // sigils
  for(int i=0;i<4;i++)if(Q[i].w>0.){
    vec3 oc=ro-Q[i].xyz;float b=dot(oc,rd),cc=dot(oc,oc)-.04,dd=b*b-cc;
    float tq=-b;vec3 cp=oc+rd*tq;
    if(tq>0.&&tq<t){float g=length(cp);col+=vec3(1.,.3,.1)*(.02/(g*g+.002))*.05*(.7+.3*sin(T*4.+float(i)));
      if(dd>0.){vec3 sp=oc+rd*(-b-sqrt(dd));float sw=sin(atan(sp.z,sp.x)*6.+sp.y*30.-T*4.);col+=vec3(1.,.35,.12)*(3.+2.*sw)*(1.-abs(dot(normalize(sp),rd)))*2.;}}
  }
  // volumetric haze: torch cone + lamp glow
  float tm=min(t,18.),ss=tm/14.,j=h1(gl_FragCoord.xy+fract(T*7.)*91.);
  vec3 fg=vec3(0);
  for(int i=0;i<14;i++){
    vec3 q=ro+rd*(float(i)+j)*ss,l=q-TL;float d=length(l),cs=dot(l/d,D);
    float den=.4+.8*ns(q.xz*.6+q.y*.5+vec2(T*.07,-T*.05));
    fg+=vec3(1.,.9,.72)*G.x*smoothstep(.86,.975,cs)*9./(d*d+.6)*den;
    vec2 qc=floor(q.xz/S);float li=lamp(qc);
    if(li>0.){vec3 L=LC(qc);fg+=vec3(.9,1.,.82)*li*3./(dot(q-L,q-L)+.15)*den;}
  }
  col+=fg*ss*.012;
  col*=exp(-t*.035);
  // post: film tone, grade, vignette, grain, dread
  col*=1.8;
  col=(col*(2.51*col+.03))/(col*(2.43*col+.59)+.14);
  col=pow(clamp(col,0.,1.),vec3(.4545));
  float lu=dot(col,vec3(.3,.59,.11));
  col=mix(vec3(lu),col,.75)*vec3(.96,1.02,1.)+vec3(-.006,.004,.012)*(1.-lu);
  vec2 vq=gl_FragCoord.xy/R-.5;
  col*=1.-1.3*dot(vq,vq);
  col+=(h1(gl_FragCoord.xy+fract(T*13.)*517.)-.5)*(.05+fr*.06);
  col*=.97+.03*sin(gl_FragCoord.y*1.7+T*30.)*fr;
  col=mix(col,col*vec3(1.25,.55,.5),fr*.45*(.5+.5*sin(T*6.)));
  col=mix(col,vec3(.5,.0,.0)*(.5+h1(uv+T)),G.z);
  o=vec4(col,1);
}
