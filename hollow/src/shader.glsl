#version 300 es
precision highp float;
uniform vec4 u;          // look, time, its bearing, its distance (negative = torch off)
out vec4 O;
vec3 m;
float T,d,g,G;           // WebGL zero-initialises
float s(vec3 p){
  m=p;m.xz*=mat2(cos(u.z+vec4(0,11,33,0)));m.z-=abs(u.w);         // its frame, facing you
  return min(min(p.y+1.6,length(mod(p.xz,3.)-1.5+sin(floor(p.zx/3.)*9.)*.5)-.2), // floor, jittered trunks
    length(vec3(m.x,m.y*.12+.06,m.z))*.2-.024);                   // tall thin figure; scaled SDF = unlit + smoky aura
}
void main(){
  vec3 p,r=normalize(vec3(gl_FragCoord.xy/180.-vec2(1.78,1),1.4));
  float L=pow(dot(r,vec3(0,-.25,1)),8.)*step(0.,u.w);            // torch cone
  r.xz*=mat2(cos(u.x+vec4(0,11,33,0)));
  for(int i=0;i<90;i++)
    p=r*T,T+=d=s(p)*.8,
    g+=d*(1.+sin(p.x+sin(p.z+u.y))),                                   // drifting mist
    m=abs(m)-vec3(.04,.3,.08),G+=d/dot(m,m);                       // eyes (mirror copies hide inside it), glow integral
  O=vec4(mix(vec3(.03,.04,.06),L*s(p-r*.1)/T*vec3(20,16,12),exp(-T*.1))+g*L*.005+vec3(G*G*1e-4,0,0),1);
}
