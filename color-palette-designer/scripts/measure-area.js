// Measures the share of visible area painted by each role colour. Self-contained: paste into the DevTools
// console or run via Playwright page.evaluate. Samples a grid with elementFromPoint, so it counts what a
// visitor sees (backgrounds only; text ink is not counted).
//   measureArea({bg:'#F7F5EF', surface:'#FFFFFF', text:'#2B3A2F', primary:'#3F6B4E', ...}, document.body)
// Returns {neutral, secondary, accent, semantic, gradient, other} in percent, plus perRole.
// 'gradient' = background-image areas (gradients/photos): count saturated ones toward accent by judgment.
function measureArea(roles, root = document.body, step = 10) {
  const group = { bg: 'neutral', surface: 'neutral', 'surface-2': 'secondary', border: 'secondary', 'border-strong': 'secondary', text: 'secondary', 'text-muted': 'secondary', 'on-primary': 'secondary', 'on-accent': 'secondary', primary: 'accent', accent: 'accent', link: 'accent', 'focus-ring': 'accent', success: 'semantic', warning: 'semantic', error: 'semantic', info: 'semantic' };
  const lin = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const lab = ([r, g, b]) => {
    [r, g, b] = [r, g, b].map(lin);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
  };
  const known = Object.entries(roles).filter(([k]) => group[k]).map(([k, hex]) => [k, lab([1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)))]);
  const nearest = (rgb) => {
    const p = lab(rgb);
    let best = null;
    let bd = 1e9;
    for (const [k, q] of known) {
      const d = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
      if (d < bd) { bd = d; best = k; }
    }
    return bd < 0.05 ? best : null;
  };
  const paint = (el) => {
    for (; el && el !== document.documentElement.parentElement; el = el.parentElement) {
      const cs = getComputedStyle(el);
      if (cs.backgroundImage !== 'none') return 'gradient';
      const m = cs.backgroundColor.match(/[\d.]+/g)?.map(Number);
      if (m && (m.length < 4 || m[3] > 0.99)) return nearest(m.slice(0, 3)) ?? 'other';
    }
    return 'other';
  };
  const r = root.getBoundingClientRect();
  const top = r.top + scrollY, bottom = top + r.height, left = r.left + scrollX, right = left + r.width;
  const saved = [scrollX, scrollY];
  const counts = {};
  let total = 0;
  for (let y0 = top; y0 < bottom; y0 += innerHeight) {
    scrollTo(0, y0);
    for (let y = 0; y < innerHeight && y + y0 < bottom; y += step) {
      for (let x = Math.max(0, left - scrollX); x < Math.min(innerWidth, right - scrollX); x += step) {
        const el = document.elementFromPoint(x, y);
        if (!el || !root.contains(el)) continue;
        const k = paint(el);
        counts[k] = (counts[k] || 0) + 1;
        total++;
      }
    }
  }
  scrollTo(...saved);
  const pct = (n) => Math.round((n / total) * 1000) / 10;
  const out = { neutral: 0, secondary: 0, accent: 0, semantic: 0, gradient: 0, other: 0, perRole: {} };
  for (const [k, n] of Object.entries(counts)) {
    out[group[k] ?? k] += pct(n);
    out.perRole[k] = pct(n);
  }
  for (const k of ['neutral', 'secondary', 'accent', 'semantic', 'gradient', 'other']) out[k] = Math.round(out[k] * 10) / 10;
  return out;
}
if (typeof module !== 'undefined') module.exports = measureArea;
