// In-game clock: Dana starts reading the card at 22:51:00 on 11/14/1997.
export class Clock {
  constructor(game) { this.g = game; this.base = 22 * 3600 + 51 * 60; }
  seconds() { return this.base + (this.g.state?.elapsed || 0); }
  fmt(s) {
    s = ((Math.floor(s) % 86400) + 86400) % 86400;
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`;
  }
  stamp(spec) {
    if (!spec) return '';
    if (!spec.startsWith('now')) return spec;
    let s = this.seconds();
    const m = spec.match(/now([+-])(\d+)(s?)/);
    if (m) s += (m[1] === '+' ? 1 : -1) * (+m[2]) * (m[3] ? 1 : 60);
    return this.fmt(s);
  }
}
