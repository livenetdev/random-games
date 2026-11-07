#version 300 es
precision highp float;
uniform vec3 P,Q[3];uniform vec2 G;
uniform vec2 R,A,E;
uniform float T;
out vec4 o;
vec3 C;float K;
float h(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.3);return fract((q.x+q.y)*q.z);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f*=f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
float b(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++)s+=a*n(p),p*=2.1,a*=.5;return s;}
// integer-hash binary-tree maze, mirrored in JS
float k(vec2 c){return c.y<2.?0.:c.x>18.?1.:step(mod(c.x*c.x*7.+c.y*c.y*3.+c.x*c.y,17.),7.5);}
float w(vec2 c){vec2 m=mod(c,2.);return c.x<1.||c.y<1.||c.x>19.||c.y>19.||m.x+m.y<1.?1.:m.x*m.y>0.||mod(c.x*5.+c.y*11.,13.)<2.?0.:m.y>0.?k(c-vec2(1,0)):1.-k(c+vec2(0,1));}
float F(vec2 c){float k=h(c*3.7);return k>.4?0.:step(.3+.6*smoothstep(8.,2.,length((c+.5)*3.-E)),n(vec2(T*9.,k*99.)));}
vec3 B(vec3 n,vec3 l,vec3 d,vec3 a,float r){return(a+pow(max(dot(n,normalize(l-d)),0.),40.)*(1.-r))*max(dot(n,l),0.);}
float e(vec3 p){
  p.xz-=E;
  float y=p.y,d=max(length(p.xz)-mix(.4,.11,y/1.7),abs(y-.85)-.85)*.7;
  vec3 q=p-vec3(0,1.95,0);
  d=min(d,length(q*vec3(1,.7,1))-.11);
  q=vec3(abs(p.x),p.yz)-vec3(.22,1.6,0);vec3 a=vec3(.07,-1.1,0);
  return min(d,length(q-a*clamp(dot(q,a)/dot(a,a),0.,1.))-.03);
}
float s(vec2 q,int t){
  float f=b(q*2.),z=t==0&&q.y<1.2?.15:t==2?.6:.3;
  vec2 c=floor(q/z),u=abs(fract(q/z)-.5);
  float g=step(.46,max(u.x,u.y)),p=step(.58,b(q*1.3+5.));
  K=mix(.2,.9,g);
  C=mix(vec3(.4,.37,.3),vec3(.03),mod(c.x+c.y,2.))*(.8+.3*h(c));
  if(t==0){
    C=q.y<1.2?vec3(.15,.26,.2)*(.8+.4*h(c)):mix(vec3(.36,.42,.36),vec3(.28,.25,.2)*(.7+f),p);
    if(q.y>1.2)g=0.,K=.7;
    C*=smoothstep(-.3,.7,q.y);
  }
  if(t==1)f=smoothstep(.62,.66,b(q*.4)),C*=1.-.6*f,K=mix(K,.03,f);
  if(t>1)C=vec3(.4-.3*f),K=.9;
  C*=1.-.9*g;
  return 1.-g+f*.3-p*.4;
}
void main(){
  vec2 u=(gl_FragCoord.xy*2.-R)/R.y,q=P.xz/3.,c=floor(q),m,oc=E-P.xz,Z;
  vec3 f=vec3(cos(A.y)*sin(A.x),sin(A.y),cos(A.y)*cos(A.x)),r=normalize(vec3(-f.z,0,f.x)),v=cross(r,f),
       d=normalize(f+(u.x*r+u.y*v)*.62),L=P+r*.2-v*.2,N,x,c3,al=vec3(.015);
  vec2 g=sign(d.xz),k=abs(1./d.xz),S=(g*(c-q)+g*.5+.5)*k;
  int Y=0;float t=99.,a,z,rg=.9,ao=1.;
  for(int i=0;i<64;i++){m=step(S,S.yx);S+=m*k;c+=m*g;if(w(c)>.5){t=dot(S-k,m)*3.;break;}}
  N=vec3(-m*g,0).xzy;
  z=d.y<0.?-P.y/d.y:(3.-P.y)/d.y;
  if(z<t)t=z,Y=d.y<0.?1:2,N=vec3(0,-sign(d.y),0);
  z=dot(oc,d.xz)/dot(d.xz,d.xz);a=max(z-1.,0.);
  if(length(oc-d.xz*z)<.7)for(int i=0;i<60;i++){float j=e(P+d*a);if(a>t||a>z+1.)break;if(j<.002){t=a;Y=3;break;}a+=j;}
  x=P+d*t;
  Z=Y==0?vec2(dot(x.xz,N.zx*vec2(-1,1)),x.y):x.xz;q=floor((x.xz+N.xz*.01)/3.);
  vec3 U=Y==0?vec3(-N.z,0,N.x):vec3(1,0,0),W=Y==0?vec3(0,1,0):vec3(0,0,1);
  if(Y>2){vec2 j=vec2(.002,0);N=normalize(vec3(e(x+j.xyy),e(x+j.yxy),e(x+j.yyx))-e(x));if(x.y>1.82)al+=.4;}
  else{
    a=s(Z,Y);al=C;rg=K;
    N=normalize(N-((s(Z+vec2(.005,0),Y)-a)*U+(s(Z+vec2(0,.005),Y)-a)*W)*.5);
    u=fract(x.xz/3.)*3.;
    u-=1.5;ao=Y==0?1.-.6*exp(-x.y/.3):(1.-.5*w(q+vec2(sign(u.x),0))*exp((abs(u.x)-1.5)/.3))*(1.-.5*w(q+vec2(0,sign(u.y)))*exp((abs(u.y)-1.5)/.3));
  }
  vec3 l=L-x;z=length(l);l/=z;
  c3=vec3(1,.9,.7)*smoothstep(.86,.97,dot(-l,f))*G.x*9./(z*z+.1)*B(N,l,d,al,rg);
  l=vec3(q.x*3.+1.5,2.9,q.y*3.+1.5)-x;z=length(l);
  c3+=vec3(.9,1,.8)*F(q)*3./(z*z+.4)*B(N,l/z,d,al,rg);
  if(Y==2&&F(q)>0.&&max(abs(Z.x-q.x*3.-1.5)*4.,abs(Z.y-q.y*3.-1.5))<.6)c3=vec3(9);
  c3=c3*ao+al*.004;
  for(int i=0;i<3;i++){l=vec3(Q[i].x,1.3,Q[i].y)-P;z=dot(l,d);if(z>0.&&z<t)c3+=vec3(1,.3,.1)*Q[i].z*.003/(dot(l-d*z,l-d*z)+.001);}
  z=min(t,16.)/12.;a=h(gl_FragCoord.xy+T);
  for(int i=0;i<12;i++){vec3 p=P+d*(float(i)+a)*z,j=p-L;float g2=length(j);
    c3+=vec3(1,.9,.7)*G.x*smoothstep(.86,.97,dot(j/g2,f))*.1/(g2*g2+.6)*z;}
  c3*=exp(-t*.035)*2.;
  c3=pow(c3/(1.+c3),vec3(.45));
  u=gl_FragCoord.xy/R-.5;
  c3=c3*(1.-1.3*dot(u,u));
  o=vec4(c3*(1.-G.y*vec3(0,.4,.4)),1);
}
