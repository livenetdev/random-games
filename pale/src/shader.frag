#version 300 es
precision highp float;
uniform float u[16];
// u: 0 time 1 yaw 2 pitch 3 px 4 pz 5 sx 6 sz 7 cx 8 cz 9 torch 10 fear 11 w 12 h 13 camy 14 state 15 lightning
out vec4 O;
float t,m,T,j;
vec2 f;
vec3 r,l,q,d;
float H(vec2 p){vec3 q=fract(p.xyx*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float N(vec2 p){vec2 i=floor(p),f=fract(p);f*=f*(3.-2.*f);return mix(mix(H(i),H(i+vec2(1,0)),f.x),mix(H(i+vec2(0,1)),H(i+1.),f.x),f.y);}
float L(vec3 p,vec3 a,vec3 b,float r){p-=a;b-=a;return length(p-b*clamp(dot(p,b)/dot(b,b),0.,1.))-r;}
// torch: cone with hotspot rings, inverse-square
float B(vec3 x){x-=l;float k=dot(normalize(x),q);return(smoothstep(.86,.95,k)*.4+smoothstep(.96,.99,k))*u[9]/(dot(x,x)+.5);}
// angular distance^2 of a point from the view ray; j = depth
float G(vec3 o){o-=r;j=dot(o,d);o-=d*j;return j>0.?dot(o,o)/j/j:9.;}
float M(vec3 p){
 // ground + litter
 float d=p.y+.25*N(p.xz*.7)+.04*N(p.xz*5.),e;m=0.;
 // trees: jittered grid, root flare, bark, skeletal branches
 vec2 c=floor(p.xz/4.),q=p.xz-c*4.-2.-(vec2(H(c),H(c+9.))-.5)*2.;
 float a=atan(q.y,q.x),b=H(c+floor(p.y/1.8))*6.3;
 e=length(q)-.25-.3*H(c+5.)-.4*exp(-p.y*3.)*(.6+.4*sin(a*5.+c.x*7.))-.04*N(vec2(a*5.,p.y*4.));
 vec2 v=vec2(cos(b),sin(b));float w=clamp(dot(q,v),0.,1.6);
 if(p.y>3.)e=min(e,length(vec3(q-v*w,fract(p.y/1.8)*1.8-.9-w*.4))-.07+w*.03);
 if(H(c+3.)<.2)e=9.;
 if(e<d)d=e,m=1.;
 // the pale one, always facing you: gaunt torso, long head, arms to the knees
 vec3 s=p-vec3(u[5],0,u[6]);
 s=vec3(abs(dot(s.xz,vec2(f.y,-f.x))),s.y,dot(s.xz,f));
 e=length(s.xz)-1.;
 if(e<.5)e=min(min(L(s,vec3(0,1,0),vec3(0,2.2,-.1),.1),length((s-vec3(0,2.6,.05))*vec3(1.2,.6,1))-.13),min(min(L(s,vec3(0,2.2,-.1),vec3(.4,1.3,.1),.04),L(s,vec3(.4,1.3,.1),vec3(.35,.1,.45),.03)),L(s,vec3(.1,1,0),vec3(.14,0,0),.05)));
 if(e<d)d=e,m=2.;
 // candle
 e=max(length(p.xz-vec2(u[7],u[8]))-.05,abs(p.y)-.25);
 if(e<d)d=e,m=3.;
 return d;
}
void main(){
 t=u[0];
 vec2 R=vec2(u[11],u[12]),v=(gl_FragCoord.xy*2.-R)/R.y;
 f=normalize(vec2(u[3]-u[5],u[4]-u[6]));
 float z=u[10],y=u[1],x=u[2],g,k,s=0.,fk=.8+.2*sin(t*17.)*sin(t*7.);T=0.;
 // vhs tear when it is near
 v.x+=(H(vec2(floor(v.y*50.),floor(t*30.)))-.5)*.05*z*z;
 vec3 w=vec3(sin(y)*cos(x),sin(x),cos(y)*cos(x)),i=normalize(vec3(w.z,0,-w.x)),o=cross(w,i),p,n,a=vec3(.006,.007,.014)*(1.+u[15]*20.),C=vec3(u[7],.4,u[8]),
  c=a*(2.+3.*pow(max(dot(d=normalize(w*1.6+i*v.x+o*v.y),vec3(.27,.45,.85)),0.),6.));
 r=vec3(u[3],u[13],u[4]);
 // torch held low-right, swaying
 l=r+i*.3-o*.3;
 q=normalize(r+w*9.+(i*sin(t*1.3)+o*sin(t*1.9))*.15-l);
 for(int i=0;i<99;i++){g=M(p=r+d*T);if(g<.002*T||T>40.)break;T+=g*.8;}
 if(T<40.){
  float e=m,h=N(p.xz*9.+p.y*3.);
  n=normalize(vec3(M(p+vec3(.005,0,0)),M(p+vec3(0,.005,0)),M(p+vec3(0,0,.005)))-M(p));
  vec3 b=e<.5?vec3(.2,.14,.08)*(h+.3)*N(p.xz*2.):e<1.5?vec3(.1,.09,.08)*(.3+h):e<2.5?vec3(.7,.64,.6)-h*.3:vec3(1,.8,.5),L=normalize(l-p);
  k=length(o=C-p);o/=k;g=B(p)*8.;
  c=mix(c,b*(g*max(dot(n,L),0.)+a*(n.y+1.)*2.+vec3(1,.45,.15)*fk*max(dot(n,o),0.)*1.5/(k*k+.2))
   +g*pow(max(dot(reflect(-L,n),-d),0.),20.)*.1+(e>2.5?vec3(.6,.3,.1):vec3(0)),exp(-T*.07));
 }
 // volumetric torch beam: drifting mist + falling dust specks
 k=min(T,30.)/24.;g=H(gl_FragCoord.xy+fract(t*7.)*99.);
 for(float i=0.;i<24.;i++)p=r+d*k*(i+g),s+=B(p)*(N(p.xz*.6+p.y*.5+t*.2)*exp(-max(p.y,0.)*.4)+step(.998,H(floor(p.xz*20.)+floor(p.y*20.+t*3.)*7.))*5.);
 c+=vec3(1,.85,.7)*s*k*.5;
 // candle flame + halo through fog
 g=G(C);c+=vec3(1,.5,.2)*fk*(2e-5/(g+2e-5)*step(j,T+.2)+.006/(g+.01));
 // eyes: dark sockets, red pinpoints (sized for both distance and close-up)
 for(float i=-1.;i<2.;i+=2.)g=G(vec3(u[5],2.62,u[6])+vec3(f.x,0,f.y)*.12+vec3(f.y,0,-f.x)*i*.05),k=1e-5+3e-4/j/j,c=c*(g+k)/(g+k*9.)+vec3(1,.1,.05)*k/(g+k)*step(j,T+.3);
 // grade: fear desaturates to sick red, crush, vignette, grain
 c=mix(c,vec3(dot(c,vec3(.3,.6,.1)))*vec3(1.4,.7,.6),z*.7);
 v=gl_FragCoord.xy/R-.5;
 c=smoothstep(0.,1.,pow(c/(1.+c),vec3(.45)))*(1.-dot(v,v)*1.2)+(H(gl_FragCoord.xy+fract(t)*500.)-.5)*.05;
 O=vec4(mix(c,u[14]>0.?vec3(1):c*vec3(1.6,.4,.3),abs(u[14])),1);
}
