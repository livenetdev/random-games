import { ShaderMaterial, DoubleSide, FrontSide, Vector3 } from 'three';

// Every object carries a scalar "temperature" instead of a colour. The same
// program also renders the flash pass (albedo x inverse-square falloff from
// a light at the lens), so a scene can be photographed both ways.
const VERT = /* glsl */ `
varying vec3 vW;
varying vec3 vN;
varying float vD;
varying float vCos;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 mv = viewMatrix * w;
  vD = -mv.z;
  vCos = vD / max(length(mv.xyz), 1e-4);
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */ `
precision highp float;
uniform float uMode;      // 0 heat, 1 flash
uniform float uTemp, uRim, uNoise, uNScale, uGradY, uGradBase;
uniform float uAlb, uSpec, uEmit, uFlashFall, uSeed, uFog, uAmb, uFlashGain;
uniform float uHotAdd, uHotR, uGlow;
uniform vec3 uHotPt;
varying vec3 vW;
varying vec3 vN;
varying float vD;
varying float vCos;
float h31(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vnoise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(h31(i), h31(i+vec3(1,0,0)), f.x), mix(h31(i+vec3(0,1,0)), h31(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i+vec3(0,0,1)), h31(i+vec3(1,0,1)), f.x), mix(h31(i+vec3(0,1,1)), h31(i+vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p){ float a = 0.5, s = 0.0; for(int i=0;i<4;i++){ s += a*vnoise(p); p *= 2.03; a *= 0.5; } return s; }
void main(){
  vec3 N = normalize(vN);
  if(!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vW);
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  float n = fbm(vW*uNScale + vec3(uSeed));
  float v;
  if (uMode < 0.5) {
    v = uTemp + uGradY*(vW.y - uGradBase) + uRim*pow(1.0-ndv, 2.0) + uNoise*(n-0.5)*2.0;
    v += uGlow*pow(ndv, 3.0);
    v += uHotAdd * (1.0 - smoothstep(0.0, uHotR, distance(vW, uHotPt)));
    v = mix(v, uAmb, 1.0 - exp(-vD*uFog));
  } else {
    float lam = 0.5 + 0.5*ndv;
    float cone = pow(clamp(vCos, 0.0, 1.0), 3.0);
    v = uFlashGain*cone*uAlb*lam*(1.0 + uNoise*(n-0.5)*1.5) / (1.0 + uFlashFall*vD*vD);
    v += uSpec*pow(ndv, 18.0) / (1.0 + 0.015*vD*vD);
    v += uEmit;
  }
  gl_FragColor = vec4(v, vD, 0.0, 1.0);
}`;

const DEFAULTS = {
  t: 0.1, rim: 0, noise: 0.03, nscale: 1.3, grad: 0, gradBase: 0,
  alb: 0.5, spec: 0, emit: 0, glow: 0, hot: null, hotAdd: 0, hotR: 0.5, side: 'front',
};

const cache = new Map();
export const sharedUniforms = {
  uMode: { value: 0 },
  uSeed: { value: 0 },
  uFog: { value: 0.03 },
  uAmb: { value: 0.0 },
  uFlashFall: { value: 0.02 },
  uFlashGain: { value: 4.0 },
};

// heat(t, opts) -> material. opts: rim, noise, nscale, grad, gradBase, alb, spec, emit, glow, hot:[x,y,z], hotAdd, hotR
export function heat(t, opts = {}) {
  const o = { ...DEFAULTS, ...opts, t };
  const key = JSON.stringify(o);
  if (cache.has(key)) return cache.get(key);
  const m = new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    side: o.side === 'double' ? DoubleSide : FrontSide,
    uniforms: {
      ...sharedUniforms,
      uTemp: { value: o.t }, uRim: { value: o.rim }, uNoise: { value: o.noise }, uNScale: { value: o.nscale },
      uGradY: { value: o.grad }, uGradBase: { value: o.gradBase }, uAlb: { value: o.alb }, uSpec: { value: o.spec },
      uEmit: { value: o.emit }, uGlow: { value: o.glow },
      uHotAdd: { value: o.hotAdd }, uHotR: { value: o.hotR }, uHotPt: { value: new Vector3(...(o.hot || [0, -999, 0])) },
    },
  });
  m.userData.heat = o;
  cache.set(key, m);
  return m;
}

export function clearMaterialCache() {
  for (const m of cache.values()) m.dispose();
  cache.clear();
}
