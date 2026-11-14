// 320x200 (or 256x192) internal frame, integer-scaled, letterboxed in black.
export class Display {
  constructor(w, h) {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'screen';
    document.getElementById('stage').appendChild(this.canvas);
    this.setSize(w, h);
    window.addEventListener('resize', () => this.fit());
  }
  setSize(w, h) {
    this.w = w; this.h = h;
    this.canvas.width = w; this.canvas.height = h;
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.img = this.ctx.createImageData(w, h);
    this.buf = new Uint32Array(this.img.data.buffer);
    this.fit();
  }
  fit() {
    const s = Math.max(1, Math.floor(Math.min(window.innerWidth / this.w, window.innerHeight / this.h)));
    // fall back to fractional scale on very small screens (phones)
    const scale = Math.min(window.innerWidth / this.w, window.innerHeight / this.h) < 1 ? Math.min(window.innerWidth / this.w, window.innerHeight / this.h) : s;
    this.scale = scale;
    this.canvas.style.width = `${this.w * scale}px`;
    this.canvas.style.height = `${this.h * scale}px`;
  }
  present() { this.ctx.putImageData(this.img, 0, 0); }
  toInternal(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * this.w, y: ((clientY - r.top) / r.height) * this.h };
  }
  setCursor(c) { if (this.canvas.style.cursor !== c) this.canvas.style.cursor = c; }
}
