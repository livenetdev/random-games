precision highp float;
uniform vec3 U[10];
uniform sampler2D S;
float T,W;
vec2 P,M;
vec3 O,Y=vec3(1,.5,.2);
// smooth value noise: one bilinear fetch of the random texture. At integer p it returns the exact texel (the cell hash).
vec4 N(vec2 p){vec2 f=fract(p);return texture2D(S,(floor(p)+f*f*(3.-f-f)+.5)/256.);}
float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<6;i++)s+=a*N(p).x,p=mat2(1.6,1.2,-1.2,1.6)*p,a*=.5;return s;}
float sg(vec2 p,vec2 a,vec2 b){p-=a;b-=a;return length(p-b*clamp(dot(p,b)/dot(b,b),0.,1.));}
// obstacles: dead trees and ledger tombs, one per 2x2 cell, never crossing its border, so one cell lookup suffices. JS mirrors this for collision.
float map(vec2 p){vec2 q=floor(p*.5);vec4 h=N(q);vec2 l=p-(q+.3+.4*h.xy)*2.;O=vec3(h.z,l);
 return h.z<.45&&dot(q,q)>1.?h.z<.15?length(l)-.2-.15*h.x:max(abs(l.x)-.3,abs(l.y)-.55):9.;}
// dead branches seen from above: gnarled spokes tapering outward
float br(vec2 p){
 float b=0.,r,a;vec2 c=floor(p*.5),q,v;vec4 h;
 for(float i=0.;i<9.;i++){q=c+vec2(mod(i,3.),floor(i/3.))-1.;h=N(q);v=p-(q+.3+.4*h.xy)*2.;r=length(v);
  a=atan(v.y,v.x)+r*(.6*N(v*1.5+h.w*9.).x+.04*sin(T+h.w*9.));
  if(h.z<.15&&dot(q,q)>1.)b=max(b,smoothstep(.04,0.,abs(fract(a*1.6+h.w)-.5)*r/(2.-r)+.015*N(v*25.).x)*smoothstep(2.,1.2,r));}
 return b;}
float sh(vec2 p,vec2 l){
 vec2 r=normalize(l-p);float t=.03,s=1.,d;
 for(int i=0;i<32;i++){d=min(map(p+r*t),length(p+r*t-M)-.2);s=min(s,9.*d/t);t+=clamp(d,.03,.25);if(t>length(l-p)||s<.01)break;}
 return max(s,0.);}
// ground height: mud, grass grain, flat puddles
float H(vec2 p){float b=fb(p*.8);W=smoothstep(.4,.38,b);return max(b,.39)+(1.-W)*.02*N(p*30.).x;}
void main(){
 vec2 R=U[0].xy,u=(gl_FragCoord.xy*2.-R)/R.y,p,l,v,q,a=vec2(cos(U[1].z),sin(U[1].z));
 T=U[0].z;P=U[1].xy;M=U[2].xy;
 float f=U[3].y,F=U[3].z,o=min(U[3].x*3.,1.)*(.9+.1*N(vec2(T*13.)).x),d,h,w,s,k,b,m,t;
 p=P+u*(4.+.2*dot(u,u));
 l=P+a*.2;
 d=map(p);vec3 g=O,n,c,L,al;
 h=H(p);w=W;n=normalize(vec3(h-H(p+vec2(.01,0)),h-H(p+vec2(0,.01)),.006));
 al=mix(vec3(.12,.09,.06),vec3(.05,.09,.035),smoothstep(.35,.65,N(p*.6).x))*(.4+h*1.2);
 al=mix(al,vec3(.01,.015,.02),w);k=.04+w;
 // blood pentagram under each candle
 for(int i=5;i<10;i++){v=p-U[i].xy;m=abs(length(v)-.5);
  for(float j=0.;j<13.;j+=2.513)m=min(m,sg(v,sin(vec2(j,j+1.571))*.5,sin(vec2(j,j+1.571)+2.513)*.5));
  al=mix(al,vec3(.2,.015,.01),smoothstep(.02,0.,m)*(.5+N(v*20.).x));}
 // tomb tops: weathered stone, moss, engraved cross, bevelled edges
 if(d<0.){
  n=normalize(vec3((vec2(map(p+vec2(.01,0)),map(p+vec2(0,.01)))-d)*smoothstep(-.06,0.,d)*150.,1));
  q=g.yz;k=.15;
  al=g.x<.15?vec3(.03,.02,.01):mix(vec3(.17,.17,.16)*(.5+fb(q*3.+g.x*99.)),vec3(.03,.05,.02),smoothstep(.55,.75,N(q*5.+g.x*77.).x))
   *(.3+.7*smoothstep(-.005,.005,min(max(abs(q.x)-.025,abs(q.y-.1)-.3),max(abs(q.x)-.15,abs(q.y-.22)-.025))));
 }
 // the thing: pale crawler, limbs splayed toward you, hair dragging ahead
 v=p-M;q=normalize(P-M);q=vec2(dot(v,q),dot(v,vec2(-q.y,q.x)))/1.6;
 t=sin(T*10.+sign(q.y)*1.6)*.07*U[2].z;q.y=abs(q.y);
 m=min(sg(q,vec2(-.14,0),vec2(.1,0))-.075,length(q-vec2(.2,0))-.07);
 v=vec2(.18+t,.24);m=min(m,min(sg(q,vec2(.06,.05),v),sg(q,v,vec2(.4+t,.15)))-.02);
 v=vec2(-.24-t,.24);m=min(m,min(sg(q,vec2(-.12,.04),v),sg(q,v,vec2(-.46-t,.19)))-.02);
 v=q-vec2(.26,0);b=smoothstep(.17,.08,length(v))*N(vec2(atan(v.y,abs(v.x))*40.,length(v)*4.)).x*2.;
 if(m<0.)al=vec3(.45,.45,.4)*(.6+.4*N(q*30.).x),n=vec3(0,0,1),k=.3,d=-1.;
 al=mix(al,vec3(.004),min(b,1.));
 // lantern cone + halo with soft shadows; moon/lightning shadowed by branches overhead
 L=vec3(l-p,.4);t=length(L);L/=t;
 b=o*(smoothstep(.7,.9,dot(normalize(p-l),a))*1.8+.3*exp(-t*2.))/(1.+t*t*.2);
 if(d>0.&&b>.002)b*=sh(p,l);
 v=vec2(.8,.6);s=(1.-.85*br(P+(p+v*.5-P)*.72))*(F>.01&&d>0.?sh(p,p+v*30.):1.);
 c=al*(b*max(dot(n,L),0.)*Y*2.5+vec3(.5,.6,1)*(.04+F+U[4].y)*s*dot(n,vec3(v,1)))+b*k*Y*pow(max(dot(n,normalize(L+vec3(0,0,1))),0.),50.)*3.;
 // candles, lantern flame, its eyes
 for(int i=5;i<10;i++){vec3 z=U[i];v=p-z.xy;t=dot(v,v);m=z.z*(.8+.2*N(vec2(T*9.,z.x)).x);
  c+=al*Y*m/(1.+t*8.)+Y*m*(.004/(t+.003)+.01/(1.+t));}
 c+=Y*o*.0015/(dot(p-l,p-l)+.0015);
 v=q-vec2(.27,.035);c+=vec3(1,.05,0)*.0002/(dot(v,v)+.0002)*f;
 // ground fog lit by the shadowed lantern
 c=mix(c,vec3(.02,.025,.035)+Y*b*.4,fb(p*.3+T*vec2(.05,.02))*.5);
 // branch layer overhead, parallax, lit from below
 v=P+(p-P)*.72;t=dot(v-l,v-l);
 c=mix(c,vec3(.002)+Y*o*.02/(1.+t),br(v)*smoothstep(.3,1.,length(p-P)));
 c=1.-exp(-c*2.);
 c*=1.-dot(u,u)*(.18+f*.3*(.5+.5*sin(T*(5.+f*5.))));
 c=mix(c,vec3(.25,0,0),U[4].x);
 gl_FragColor=vec4(sqrt(max(c,0.))+(N(gl_FragCoord.xy+T*vec2(997,661)).x-.5)*.04,1);
}
