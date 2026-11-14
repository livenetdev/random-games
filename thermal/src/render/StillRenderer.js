import {
  WebGLRenderer, WebGLRenderTarget, FloatType, NearestFilter, RGBAFormat, Scene, Mesh, PlaneGeometry,
  OrthographicCamera, ShaderMaterial, Box3, Vector3, CanvasTexture, LinearFilter, ColorManagement,
} from 'three';
import { sharedUniforms } from './heatMaterial.js';
import { RNG, hashStr } from '../core/rng.js';
import { SCENES } from '../scenes/index.js';

ColorManagement.enabled = false;

const FS_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const BLUR_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tSrc; uniform vec2 uTexel; uniform vec2 uDir; uniform float uSigma;
varying vec2 vUv;
void main(){
  if (uSigma < 0.3) { gl_FragColor = texture2D(tSrc, vUv); return; }
  float s = 0.0; vec4 acc = vec4(0.0);
  int R = int(ceil(uSigma*2.5));
  for (int i=-40;i<=40;i++){
    if (i < -R || i > R) continue;
    float w = exp(-float(i*i)/(2.0*uSigma*uSigma));
    acc += w*texture2D(tSrc, vUv + uDir*uTexel*float(i));
    s += w;
  }
  gl_FragColor = acc/s;
}`;

// Collect "hot" energy at 1/8 resolution for the radial heat bleed.
const HOTDOWN_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tSrc; uniform vec2 uSrcTexel; uniform float uTh; uniform float uK;
varying vec2 vUv;
void main(){
  float acc = 0.0;
  for (int y=0;y<4;y++) for (int x=0;x<4;x++){
    vec2 o = (vec2(float(x), float(y)) - 1.5) * 2.0 * uSrcTexel;
    float h = texture2D(tSrc, vUv + o).r;
    acc += max(0.0, h - uTh);
  }
  gl_FragColor = vec4(acc/16.0*uK, 0.0, 0.0, 1.0);
}`;

const COMPOSITE_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tBlur; uniform sampler2D tSharp; uniform sampler2D tBleed;
uniform vec2 uBleedSize; uniform vec2 uOut; uniform float uSS;
uniform float uSharpMix, uBleed, uGrain, uGrainAdd, uVig, uBlock, uSeed, uFloor;
varying vec2 vUv;
float hh(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33 + uSeed); return fract((p3.x + p3.y) * p3.z); }
vec4 bil(sampler2D t, vec2 uv, vec2 size){
  vec2 p = uv*size - 0.5; vec2 i = floor(p); vec2 f = p - i;
  vec4 a = texture2D(t, (i+vec2(0.5,0.5))/size), b = texture2D(t, (i+vec2(1.5,0.5))/size);
  vec4 c = texture2D(t, (i+vec2(0.5,1.5))/size), d = texture2D(t, (i+vec2(1.5,1.5))/size);
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
void main(){
  float h = mix(texture2D(tBlur, vUv).r, texture2D(tSharp, vUv).r, uSharpMix);
  h += uBleed * bil(tBleed, vUv, uBleedSize).r;
  // output-pixel coordinates (grain lives at sensor resolution so it survives the downsample)
  vec2 op = floor(vUv * uOut);
  float g = hh(op) - 0.5;
  float g2 = hh(gl_FragCoord.xy + 17.0) - 0.5;
  h *= 1.0 + uGrain*(g*2.0 + g2*0.6);
  h += uGrainAdd*(g*2.0);
  // vignette
  vec2 c = vUv - 0.5; c.x *= uOut.x/uOut.y;
  float r2 = dot(c, c);
  float vg = smoothstep(0.16, 0.7, r2);
  h = h*(1.0 - uVig*vg) - uVig*vg*0.05;
  // JPEG-ish 8x8 blocks: DC offset + one random cosine basis per block
  vec2 blk = floor(op / 8.0);
  vec2 bp = mod(op, 8.0);
  float bdc = hh(blk*7.13 + 3.1) - 0.5;
  float u = floor(hh(blk + 11.7)*3.0), v = floor(hh(blk + 5.3)*3.0);
  float basis = cos(3.14159*(2.0*bp.x+1.0)*u/16.0)*cos(3.14159*(2.0*bp.y+1.0)*v/16.0);
  float act = smoothstep(0.05, 0.25, h);
  h += uBlock*(bdc*1.4 + basis*(hh(blk+1.9)-0.5)*1.8*act);
  h = max(h, uFloor);
  gl_FragColor = vec4(h, 0.0, 0.0, 1.0);
}`;

const DOWN_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tSrc; uniform vec2 uSrcTexel; uniform float uSS;
varying vec2 vUv;
void main(){
  float acc = 0.0;
  for (int y=0;y<8;y++) for (int x=0;x<8;x++){
    if (float(x) >= uSS || float(y) >= uSS) continue;
    vec2 o = (vec2(float(x), float(y)) - (uSS-1.0)*0.5) * uSrcTexel;
    acc += texture2D(tSrc, vUv + o).r;
  }
  gl_FragColor = vec4(acc/(uSS*uSS), 0.0, 0.0, 1.0);
}`;

const SOURCE_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tSrc; uniform float uLo, uHi;
varying vec2 vUv;
void main(){
  vec3 c = texture2D(tSrc, vec2(vUv.x, vUv.y)).rgb;
  float l = dot(c, vec3(0.3, 0.55, 0.15));
  gl_FragColor = vec4(mix(uLo, uHi, l), 1.0, 0.0, 1.0);
}`;

export const DEFAULT_FX = {
  blur: 0.55,      // sensor bloom sigma, in output pixels
  sharp: 0.25,     // how much of the unblurred signal survives
  bleed: 0.9,      // radial heat bleed around hot sources
  bleedTh: 0.6,
  bleedSigma: 2.2, // in 1/8-res pixels
  grain: 0.07,
  grainAdd: 0.006,
  vignette: 0.32,
  block: 0.014,
  floor: -0.05,
};

export class StillRenderer {
  constructor({ w = 320, h = 200, ss = 4, canvas = null } = {}) {
    this.w = w; this.h = h; this.ss = ss;
    this.canvas = canvas || document.createElement('canvas');
    this.renderer = new WebGLRenderer({ canvas: this.canvas, antialias: false, alpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
    this.renderer.autoClear = true;
    const gl = this.renderer.getContext();
    this.floatOK = !!gl.getExtension('EXT_color_buffer_float');
    if (!this.floatOK) console.warn('[thermal] EXT_color_buffer_float missing; output may be clamped');
    this._allocTargets(w, h, ss);
    this.fsScene = new Scene();
    this.fsCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.fsMesh = new Mesh(new PlaneGeometry(2, 2));
    this.fsScene.add(this.fsMesh);
    this.mats = {
      blur: this._fs(BLUR_FRAG, { tSrc: { value: null }, uTexel: { value: [0, 0] }, uDir: { value: [1, 0] }, uSigma: { value: 1 } }),
      hot: this._fs(HOTDOWN_FRAG, { tSrc: { value: null }, uSrcTexel: { value: [0, 0] }, uTh: { value: 0.6 }, uK: { value: 1 } }),
      comp: this._fs(COMPOSITE_FRAG, {
        tBlur: { value: null }, tSharp: { value: null }, tBleed: { value: null }, uBleedSize: { value: [1, 1] }, uOut: { value: [w, h] }, uSS: { value: ss },
        uSharpMix: { value: 0 }, uBleed: { value: 0 }, uGrain: { value: 0 }, uGrainAdd: { value: 0 }, uVig: { value: 0 }, uBlock: { value: 0 }, uSeed: { value: 0 }, uFloor: { value: -1 },
      }),
      down: this._fs(DOWN_FRAG, { tSrc: { value: null }, uSrcTexel: { value: [0, 0] }, uSS: { value: ss } }),
      source: this._fs(SOURCE_FRAG, { tSrc: { value: null }, uLo: { value: 0 }, uHi: { value: 1 } }),
    };
    this.readBuf = new Float32Array(w * h * 4);
  }

  _fs(frag, uniforms) {
    return new ShaderMaterial({ vertexShader: FS_VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false });
  }

  _rt(w, h, depth = false) {
    return new WebGLRenderTarget(w, h, { type: FloatType, format: RGBAFormat, minFilter: NearestFilter, magFilter: NearestFilter, depthBuffer: depth, generateMipmaps: false });
  }

  _allocTargets(w, h, ss) {
    const W = w * ss, H = h * ss;
    this.W = W; this.H = H;
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(W, H, false);
    this.rtScene = this._rt(W, H, true);
    this.rtA = this._rt(W, H);
    this.rtB = this._rt(W, H);
    const bw = Math.ceil(W / 8), bh = Math.ceil(H / 8);
    this.bw = bw; this.bh = bh;
    this.rtS1 = this._rt(bw, bh);
    this.rtS2 = this._rt(bw, bh);
    this.rtOut = this._rt(w, h);
  }

  resize(w, h) {
    if (w === this.w && h === this.h) return;
    for (const k of ['rtScene', 'rtA', 'rtB', 'rtS1', 'rtS2', 'rtOut']) this[k].dispose();
    this.w = w; this.h = h;
    this._allocTargets(w, h, this.ss);
    this.readBuf = new Float32Array(w * h * 4);
    this.mats.comp.uniforms.uOut.value = [w, h];
  }

  _pass(mat, target) {
    this.fsMesh.material = mat;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.fsScene, this.fsCam);
  }

  _blur(src, tmp, dst, w, h, sigma) {
    const m = this.mats.blur;
    m.uniforms.tSrc.value = src.texture; m.uniforms.uTexel.value = [1 / w, 1 / h]; m.uniforms.uDir.value = [1, 0]; m.uniforms.uSigma.value = sigma;
    this._pass(m, tmp);
    m.uniforms.tSrc.value = tmp.texture; m.uniforms.uDir.value = [0, 1];
    this._pass(m, dst);
  }

  // Run degradation + downsample on whatever is in rtScene. Returns Float32Array(w*h) of heat.
  _post(fx, seed, zoom = 1) {
    const { W, H, w, h, ss } = this;
    const f = { ...DEFAULT_FX, ...fx };
    // 1. sensor bloom (gets wider when zoomed: detail never improves)
    this._blur(this.rtScene, this.rtA, this.rtB, W, H, f.blur * ss * zoom);
    // 2. heat bleed
    const hm = this.mats.hot;
    hm.uniforms.tSrc.value = this.rtScene.texture; hm.uniforms.uSrcTexel.value = [1 / W, 1 / H]; hm.uniforms.uTh.value = f.bleedTh; hm.uniforms.uK.value = 1;
    this._pass(hm, this.rtS1);
    this._blur(this.rtS1, this.rtS2, this.rtS1, this.bw, this.bh, f.bleedSigma * Math.sqrt(zoom));
    // 3. composite: grain, vignette, blocks
    const cm = this.mats.comp.uniforms;
    cm.tBlur.value = this.rtB.texture; cm.tSharp.value = this.rtScene.texture; cm.tBleed.value = this.rtS1.texture;
    cm.uBleedSize.value = [this.bw, this.bh];
    cm.uSharpMix.value = f.sharp / zoom; cm.uBleed.value = f.bleed; cm.uGrain.value = f.grain * (1 + 0.7 * (zoom - 1));
    cm.uGrainAdd.value = f.grainAdd * zoom; cm.uVig.value = f.vignette; cm.uBlock.value = f.block * (1 + 0.5 * (zoom - 1));
    cm.uSeed.value = (seed % 1000) / 10; cm.uFloor.value = f.floor;
    this._pass(this.mats.comp, this.rtA);
    // 4. box downsample to internal resolution
    const dm = this.mats.down;
    dm.uniforms.tSrc.value = this.rtA.texture; dm.uniforms.uSrcTexel.value = [1 / W, 1 / H]; dm.uniforms.uSS.value = ss;
    this._pass(dm, this.rtOut);
    this.renderer.readRenderTargetPixels(this.rtOut, 0, 0, w, h, this.readBuf);
    this.renderer.setRenderTarget(null);
    const out = new Float32Array(w * h);
    const rb = this.readBuf;
    for (let y = 0; y < h; y++) {
      const sy = h - 1 - y;
      for (let x = 0; x < w; x++) out[y * w + x] = rb[(sy * w + x) * 4];
    }
    return out;
  }

  // def: manifest entry { id, scene, variant, seed, mode, fx, params }
  // opts.zoom: { cx, cy, z } re-render a region (cx, cy in output px) at z x magnification
  render(def, opts = {}) {
    const seed = (def.seed ?? hashStr(def.id)) >>> 0;
    const rng = new RNG(seed);
    const builder = SCENES[def.scene];
    if (!builder) throw new Error('unknown scene ' + def.scene);
    const built = builder.build(rng, def.variant || 'default', { ...(def.params || {}), mode: def.mode || 'heat', w: this.w, h: this.h });
    const mode = def.mode || 'heat';
    const { scene, camera } = built;
    camera.aspect = this.w / this.h;
    const zoom = opts.zoom ? opts.zoom.z : 1;
    if (opts.zoom) {
      const zw = this.w / zoom, zh = this.h / zoom;
      const zx = Math.max(0, Math.min(this.w - zw, opts.zoom.cx - zw / 2));
      const zy = Math.max(0, Math.min(this.h - zh, opts.zoom.cy - zh / 2));
      camera.setViewOffset(this.w, this.h, zx, zy, zw, zh);
      opts.zoom.rect = [zx, zy, zw, zh];
    } else {
      camera.clearViewOffset();
    }
    camera.updateProjectionMatrix();
    scene.updateMatrixWorld(true);
    if (mode === 'flash') scene.traverse((o) => { if (o.userData.noFlash) o.visible = false; });
    else scene.traverse((o) => { if (o.userData.flashOnly) o.visible = false; });
    sharedUniforms.uMode.value = mode === 'flash' ? 1 : 0;
    sharedUniforms.uSeed.value = (seed % 997) * 0.37 + (opts.zoom ? 13.1 : 0);
    sharedUniforms.uFog.value = built.fog ?? 0.035;
    sharedUniforms.uAmb.value = built.ambient ?? 0.0;
    sharedUniforms.uFlashFall.value = built.flashFall ?? 0.02;
    this.renderer.setRenderTarget(this.rtScene);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.clear(true, true, true);
    this.renderer.render(scene, camera);
    const fx = { ...(built.fx || {}), ...(mode === 'flash' ? { bleed: 0.25, bleedTh: 0.9, grain: 0.09 } : {}), ...(def.fx || {}) };
    const heat = this._post(fx, seed + (opts.zoom ? 777 : 0), zoom);
    const hotspots = this._project(scene, camera);
    disposeScene(scene);
    return { id: def.id, w: this.w, h: this.h, heat, hotspots };
  }

  // Render a 2D canvas (index cards, corkboard) through the same degradation.
  renderSource(srcCanvas, def) {
    const seed = (def.seed ?? hashStr(def.id)) >>> 0;
    const tex = new CanvasTexture(srcCanvas);
    tex.minFilter = LinearFilter; tex.magFilter = LinearFilter; tex.flipY = true;
    const m = this.mats.source;
    m.uniforms.tSrc.value = tex; m.uniforms.uLo.value = def.lo ?? 0; m.uniforms.uHi.value = def.hi ?? 1;
    this._pass(m, this.rtScene);
    const heat = this._post({ bleed: 0, vignette: 0.25, grain: 0.035, grainAdd: 0.004, blur: 0.45, sharp: 0.4, block: 0.01, ...(def.fx || {}) }, seed);
    tex.dispose();
    return { id: def.id, w: this.w, h: this.h, heat, hotspots: def.hotspots || [] };
  }

  _project(scene, camera) {
    const out = [];
    const box = new Box3();
    const v = new Vector3();
    scene.traverse((o) => {
      if (!o.userData.tag || !o.visible) return;
      box.setFromObject(o);
      if (box.isEmpty()) return;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, behind = 0;
      for (let i = 0; i < 8; i++) {
        v.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z);
        v.project(camera);
        if (v.z > 1) { behind++; continue; }
        const px = (v.x + 1) / 2 * this.w, py = (1 - v.y) / 2 * this.h;
        x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py);
      }
      if (behind === 8) return;
      x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(this.w, x1); y1 = Math.min(this.h, y1);
      if (x1 - x0 < 1 || y1 - y0 < 1) return;
      const c = box.getCenter(new Vector3());
      const dist = c.distanceTo(camera.position);
      out.push({ tag: o.userData.tag, x: Math.round(x0), y: Math.round(y0), w: Math.round(x1 - x0), h: Math.round(y1 - y0), d: +dist.toFixed(1) });
    });
    return out;
  }
}

export function disposeScene(scene) {
  scene.traverse((o) => { if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose(); });
}
