#version 300 es
precision highp float;
precision highp int;
uniform vec2 R,uShk;
uniform float uFog,uGA,uGV,T,uSpin,uPA,uSides,uTrav,uPulse,uFlash,uDeath,uAb,uHue,uShield,uGrz,uDim,uInv;
uniform vec3 uPC;
uniform vec4 uW[28];
uniform int uWN;
uniform vec4 uO[16];
uniform int uON;
out vec4 O;
#define TAU 6.2831853
#define ZP 1.25
#define WT .6
#define HB .36

vec3 pal(float h){return .5+.5*cos(TAU*(h+vec3(0.,.33,.67)));}
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}

vec3 scene(vec2 p){
  float px=2./min(R.x,R.y);
  p*=1.+.025*uPulse;
  float r0=max(length(p),1e-4);
  float a=mod(atan(p.y,p.x)-uSpin,TAU);
  float seg=TAU/uSides;
  float loc=mod(a,seg)-.5*seg;
  float rho=max(r0*cos(loc),1e-4);
  float dF=1./rho,dT=(1.-HB)/rho;
  float d=dF,wz=0.,fq=0.,sg=1.,rz=0.;
  int k=0;
  for(int i=0;i<28;i++){
    if(i>=uWN)break;
    vec4 w=uW[i];
    float g=TAU/w.z,q=a/g;
    int s=min(int(q),int(w.z)-1);
    if(((int(w.y)>>s)&1)==0)continue;
    float z=rho*w.x;
    if(z>1.-HB&&z<1.&&w.x<d){d=w.x;k=1;wz=w.x;fq=q;sg=g;rz=z;}
    else if(dT>w.x&&dT<w.x+WT&&dT<d){d=dT;k=2;wz=w.x;fq=q;sg=g;}
  }
  vec3 base=pal(uHue);
  float fl=.92+.08*sin(T*31.)*sin(T*7.3);
  float da=abs(mod(a-uPA+TAU*.5,TAU)-TAU*.5);
  float L=fl*1.7/(1.+1.6*uFog*uFog*(d-ZP)*(d-ZP))*(.3+.7*exp(-da*da*1.1));
  float amb=.05+.06*uPulse;
  vec3 c;
  if(k==0){
    float zF=d+uTrav,q=a/seg;
    float qe=min(fract(q),1.-fract(q))*seg*r0/px;
    float fz=fract(zF*.5);
    float ze=min(fz,1.-fz)*2.*rho*rho/px;
    float ln=max(1.-smoothstep(0.,1.6,qe),1.-smoothstep(0.,1.6,ze));
    vec2 id=vec2(floor(q),floor(zF*.5));
    float n=h21(id),n2=h21(floor(vec2(q*4.,zF*2.)));
    c=base*(.22+.25*n)*(.8+.2*n2)+base*ln*.5;
    c*=(amb+L)*mix(.35,1.,smoothstep(.75,ZP+.2,d));
    c+=vec3(1.,.08,.04)*step(.982,n)*(.55+.45*sin(T*5.+n*70.))*(1.-ln)*smoothstep(1.5,3.,d);
    c*=exp(-.09*uFog*d);
  }else{
    float es=min(fract(fq),1.-fract(fq))*sg*r0/px,e;
    vec3 wc=mix(base,vec3(1.),.3);
    float near=exp(-max(wz-ZP,0.)*.25);
    if(k==1){
      e=min(es,min((rz-(1.-HB))/wz/px,(1.-rz)/wz/px));
      c=wc*(.28+.5*near+L*1.1);
    }else{
      e=min(es,(d-wz)*rho*rho/(1.-HB)/px);
      c=wc*(.12+.25*near+L*.6);
    }
    float eg=1.-smoothstep(0.,2.2,e);
    c+=mix(base,vec3(1.),.5)*eg*(1.2+L+near);
    c*=exp(-.05*uFog*uFog*d);
  }
  c+=vec3(.6,.02,.03)*exp(-r0*r0*140.)*(.6+.4*sin(T*1.3));
  for(int i=0;i<16;i++){
    if(i>=uON)break;
    vec4 o=uO[i];
    float lo=mod(o.y,seg)-.5*seg;
    float rr=.84/(o.x*cos(lo));
    vec2 op=rr*vec2(cos(o.y+uSpin),sin(o.y+uSpin));
    float s=.03/o.x,dd=length(p-op);
    vec3 oc=o.z>.5?vec3(1.,.85,.3):vec3(1.,.45,.12);
    float b=.85+.15*sin(T*12.+o.y*9.);
    c+=oc*o.w*b*(smoothstep(s,s*.25,dd)*1.6+s*s*.08/(dd*dd+s*s*.15))*exp(-.04*uFog*o.x);
  }
  float lp=mod(uPA,seg)-.5*seg;
  vec2 dir=vec2(cos(uPA+uSpin),sin(uPA+uSpin));
  vec2 pp=dir*.965/(ZP*cos(lp));
  vec2 dv=p-pp;
  float pd=length(dv);
  float al=dot(dv,-dir),pe=dot(dv,vec2(dir.y,-dir.x));
  float fd=length(vec2(pe*1.25,al*(al>0.?.5:1.3)));
  float fk=1.+.15*sin(T*40.)+.08*sin(T*17.);
  float vis=(1.-uDeath)*(uInv>0.?.55+.45*sin(T*45.):1.);
  c+=uPC*(smoothstep(.034*fk,0.,fd)*2.2+.0022/(pd*pd+.0011)*.45)*vis;
  c+=vec3(1.)*smoothstep(.013,0.,fd)*vis;
  if(uShield>0.)c+=uPC*.7*smoothstep(.007,0.,abs(pd-.06))*(.6+.4*sin(T*5.))*vis;
  c+=vec3(1.,.95,.85)*uGrz*.5*exp(-pd*pd*60.);
  if(uGV>.01){
    float lg=mod(uGA,seg)-.5*seg;vec2 gd=vec2(cos(uGA+uSpin),sin(uGA+uSpin));
    vec2 gp=gd*.965/(ZP*cos(lg)),gv=p-gp;float ga=dot(gv,-gd),ge=dot(gv,vec2(gd.y,-gd.x));
    float gf=length(vec2(ge*1.25,ga*(ga>0.?.5:1.3)));
    c+=vec3(.55,.75,1.)*uGV*(smoothstep(.03,0.,gf)*.9+.0012/(dot(gv,gv)+.0016)*.35)*(.75+.25*sin(T*9.));
  }
  return c;
}

void main(){
  vec2 p=(gl_FragCoord.xy-.5*R)/(.5*min(R.x,R.y))+uShk;
  vec3 c;
  if(uAb>.001){vec2 o=p*uAb;c=vec3(scene(p+o).r,scene(p).g,scene(p-o).b);}
  else c=scene(p);
  c*=1.-.3*dot(p*.55,p*.55);
  float l=dot(c,vec3(.3,.59,.11));
  c=mix(c,vec3(l*1.3,l*.25,l*.2),uDeath);
  c+=uFlash*vec3(1.,.92,.85);
  c=1.-exp(-c*1.35);
  c*=uDim;
  c+=(h21(gl_FragCoord.xy+fract(T*7.)*317.)-.5)*.045;
  O=vec4(max(c,0.),1.);
}
