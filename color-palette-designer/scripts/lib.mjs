// color-palette-designer engine. Dependency-free ESM, runs in Node 18+ and (inlined) in the browser.
// Exact math: WCAG 2.x contrast, APCA-W3 (advisory), OKLab/OKLCH (Ottosson), Machado CVD simulation.

// ---------- sRGB helpers ----------
export const hexToRgb = (hex) => {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map((x) => x + x).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
export const toLin = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export const toGam8 = (c) => {
  c = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, c)) * 255);
};
export const rgbToHex = (rgb) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
export const normHex = (hex) => rgbToHex(hexToRgb(hex));

// ---------- WCAG 2.x ----------
export const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map(toLin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
// Grade a ratio. kind: 'text' | 'large' | 'ui'
export const grade = (ratio, kind = 'text') => {
  if (kind === 'ui') return ratio >= 3 ? 'AA' : 'FAIL';
  if (kind === 'large') return ratio >= 4.5 ? 'AAA' : ratio >= 3 ? 'AA' : 'FAIL';
  return ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'UI' : 'FAIL';
};

// ---------- APCA-W3 0.0.98G-4g (advisory only; WCAG 3 has not adopted an algorithm) ----------
export function apca(fgHex, bgHex) {
  const Y = (hex) => {
    const [r, g, b] = hexToRgb(hex).map((v) => (v / 255) ** 2.4);
    return 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  };
  const soft = (y) => (y < 0.022 ? y + (0.022 - y) ** 1.414 : y);
  const yt = soft(Y(fgHex));
  const yb = soft(Y(bgHex));
  if (Math.abs(yb - yt) < 0.0005) return 0;
  let out;
  if (yb > yt) {
    const s = (yb ** 0.56 - yt ** 0.57) * 1.14;
    out = s < 0.1 ? 0 : s - 0.027;
  } else {
    const s = (yb ** 0.65 - yt ** 0.62) * 1.14;
    out = s > -0.1 ? 0 : s + 0.027;
  }
  return out * 100;
}

// ---------- OKLab / OKLCH ----------
export function hexToOklab(hex) {
  const [r, g, b] = hexToRgb(hex).map(toLin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}
export function hexToOklch(hex) {
  const { L, a, b } = hexToOklab(hex);
  const c = Math.hypot(a, b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h: c < 1e-4 ? 0 : h };
}
export function oklchToLinear({ l, c, h }) {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}
const inGamut = (rgb) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);
// Gamut-map by reducing chroma (L and H fixed). CSS Color 4 does something similar; browsers' clipping is cruder.
export function oklchToHex(lch) {
  let { l, c, h } = lch;
  l = Math.min(1, Math.max(0, l));
  if (!inGamut(oklchToLinear({ l, c, h }))) {
    let lo = 0;
    let hi = c;
    for (let i = 0; i < 28; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinear({ l, c: mid, h }))) lo = mid;
      else hi = mid;
    }
    c = lo;
  }
  return rgbToHex(oklchToLinear({ l, c, h }).map(toGam8));
}
export const fmtOklch = ({ l, c, h }) => `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`;
export const oklchOf = (hex) => fmtOklch(hexToOklch(hex));

// ---------- Color-vision-deficiency simulation (Machado et al. 2009, severity 1.0, linear RGB) ----------
export const CVD = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
export function simulate(hex, type) {
  const lin = hexToRgb(hex).map(toLin);
  const M = CVD[type];
  return rgbToHex(M.map((row) => toGam8(row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2])));
}
export const deltaEOK = (a, b) => {
  const x = hexToOklab(a);
  const y = hexToOklab(b);
  return Math.hypot(x.L - y.L, x.a - y.a, x.b - y.b);
};

// ---------- Ramps and contrast solving ----------
export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
export const L_TARGET = [0.985, 0.967, 0.928, 0.872, 0.707, 0.554, 0.446, 0.372, 0.279, 0.208, 0.129];
export const C_FACTOR = [0.1, 0.18, 0.35, 0.6, 0.9, 1.0, 0.95, 0.85, 0.7, 0.55, 0.4];
export function ramp(hue, cMax, { hueShiftLight = 0, hueShiftDark = 0 } = {}) {
  return Object.fromEntries(
    STEPS.map((s, i) => {
      const t = i / (STEPS.length - 1);
      const h = hue + hueShiftLight * (1 - t) + hueShiftDark * t;
      return [s, oklchToHex({ l: L_TARGET[i], c: cMax * C_FACTOR[i], h })];
    })
  );
}
// Walk lightness from `start` in `direction` until the colour reaches `target` against EVERY bg.
// Moves L only (hue kept, chroma gamut-mapped): the fix for every failing pair in the research.
export function solveL({ l, c, h }, bgHexes, target = 4.5, direction = 'darker', step = 0.004) {
  const bgs = Array.isArray(bgHexes) ? bgHexes : [bgHexes];
  const dir = direction === 'darker' ? -1 : 1;
  for (let L = l; L >= 0 && L <= 1; L += dir * step) {
    const hex = oklchToHex({ l: L, c, h });
    if (bgs.every((bg) => contrast(hex, bg) >= target)) return hex;
  }
  return null;
}

// ---------- Brief -> palette ----------
export const SEMANTIC_HUES = { success: 145, warning: 70, error: 27, info: 255 };

export function generate({
  hue,
  chroma = 0.12,
  neutralHue = hue,
  neutralChroma = 0.012,
  accentOffset = null, // degrees from hue; null = no accent role
  accentChroma = chroma,
  aaa = false,
  modes = ['light', 'dark'],
} = {}) {
  const T = aaa ? 7 : 4.5;
  const out = {};
  if (modes.includes('light')) {
    const n = (l, c = neutralChroma) => oklchToHex({ l, c, h: neutralHue });
    const WHITE = '#FFFFFF';
    const bg = n(0.985, neutralChroma * 0.6);
    const surface = WHITE;
    const surface2 = n(0.965);
    const surfaces = [bg, surface, surface2];
    const r = {
      bg,
      surface,
      'surface-2': surface2,
      border: n(0.9),
      'border-strong': solveL({ l: 0.7, c: neutralChroma, h: neutralHue }, [bg, surface], 3, 'darker'),
      text: solveL({ l: 0.27, c: neutralChroma * 1.5, h: neutralHue }, surfaces, 11, 'darker'),
      'text-muted': solveL({ l: 0.52, c: neutralChroma * 1.2, h: neutralHue }, surfaces, T, 'darker'),
      primary: solveL({ l: 0.62, c: chroma, h: hue }, [bg, WHITE], T, 'darker'),
      'on-primary': WHITE,
    };
    r.link = r.primary;
    r['focus-ring'] = r.primary;
    if (accentOffset !== null) {
      r.accent = solveL({ l: 0.65, c: accentChroma, h: hue + accentOffset }, [bg, WHITE], T, 'darker');
      r['on-accent'] = WHITE;
    }
    for (const [k, h] of Object.entries(SEMANTIC_HUES)) r[k] = solveL({ l: 0.62, c: 0.15, h }, [bg, WHITE], T, 'darker');
    out.light = r;
  }
  if (modes.includes('dark')) {
    const n = (l, c = neutralChroma) => oklchToHex({ l, c, h: neutralHue });
    const bg = n(0.19, neutralChroma);
    const surface = n(0.23);
    const surface2 = n(0.27);
    const surfaces = [bg, surface, surface2];
    const onPrimary = n(0.15, neutralChroma);
    const dc = chroma * 0.85; // desaturate accents in dark mode
    const r = {
      bg,
      surface,
      'surface-2': surface2,
      border: n(0.33),
      'border-strong': solveL({ l: 0.45, c: neutralChroma, h: neutralHue }, [bg, surface], 3, 'lighter'),
      text: solveL({ l: 0.9, c: neutralChroma, h: neutralHue }, surfaces, 11, 'lighter'),
      'text-muted': solveL({ l: 0.65, c: neutralChroma, h: neutralHue }, surfaces, Math.max(T, 6), 'lighter'),
      primary: solveL({ l: 0.74, c: dc, h: hue }, [surface2, onPrimary], T, 'lighter'),
      'on-primary': onPrimary,
    };
    r.link = r.primary;
    r['focus-ring'] = r.primary;
    if (accentOffset !== null) {
      r.accent = solveL({ l: 0.76, c: accentChroma * 0.85, h: hue + accentOffset }, [surface2, onPrimary], T, 'lighter');
      r['on-accent'] = onPrimary;
    }
    for (const [k, h] of Object.entries(SEMANTIC_HUES)) r[k] = solveL({ l: 0.74, c: 0.14, h }, surfaces, T, 'lighter');
    out.dark = r;
  }
  return out;
}

// ---------- Audit ----------
// [fg role, bg role, required ratio, kind, note]
export const PAIRS = [
  ['text', 'bg', 4.5, 'text'],
  ['text', 'surface', 4.5, 'text'],
  ['text', 'surface-2', 4.5, 'text'],
  ['text-muted', 'bg', 4.5, 'text'],
  ['text-muted', 'surface', 4.5, 'text'],
  ['text-muted', 'surface-2', 4.5, 'text'],
  ['on-primary', 'primary', 4.5, 'text'],
  ['on-accent', 'accent', 4.5, 'text'],
  ['link', 'bg', 4.5, 'text'],
  ['primary', 'bg', 3, 'ui'],
  ['accent', 'bg', 3, 'ui'],
  ['border-strong', 'bg', 3, 'ui'],
  ['focus-ring', 'bg', 3, 'ui'],
  ['success', 'bg', 4.5, 'text'],
  ['warning', 'bg', 4.5, 'text'],
  ['error', 'bg', 4.5, 'text'],
  ['info', 'bg', 4.5, 'text'],
];
export function audit(roles, { aaa = false } = {}) {
  const rows = [];
  for (const [fg, bg, req, kind] of PAIRS) {
    if (!roles[fg] || !roles[bg]) continue;
    const need = aaa && kind === 'text' ? 7 : req;
    const ratio = contrast(roles[fg], roles[bg]);
    rows.push({
      fg,
      bg,
      fgHex: roles[fg],
      bgHex: roles[bg],
      ratio,
      need,
      pass: ratio >= need,
      grade: grade(ratio, kind),
      lc: apca(roles[fg], roles[bg]),
    });
  }
  return rows;
}
export function cvdReport(roles, pairs = [['primary', 'error'], ['primary', 'success'], ['success', 'error'], ['accent', 'primary']]) {
  const rows = [];
  for (const [a, b] of pairs) {
    if (!roles[a] || !roles[b]) continue;
    const row = { a, b };
    for (const t of Object.keys(CVD)) row[t] = deltaEOK(simulate(roles[a], t), simulate(roles[b], t));
    row.min = Math.min(row.protan, row.deutan, row.tritan);
    row.collapsed = row.min < 0.1;
    rows.push(row);
  }
  return rows;
}

// ---------- CSS emit ----------
const block = (roles) => Object.entries(roles).map(([k, v]) => `  --${k}: ${v};`).join('\n');
export function toCss({ light, dark }, { selector = ':root', style = 'plain', states = null } = {}) {
  const extra = (r) => (states && r ? '\n' + stateCss(r, states) : '');
  if (style === 'light-dark' && light && dark) {
    const lines = Object.keys(light).map((k) => `  --${k}: light-dark(${light[k]}, ${dark[k] ?? light[k]});`);
    if (states) {
      const a = stateVars(light, states);
      const b = stateVars(dark, states);
      for (const k of Object.keys(a)) lines.push(`  --${k}: ${a[k] === b[k] ? a[k] : `light-dark(${a[k]}, ${b[k]})`};`);
    }
    return `${selector} {\n  color-scheme: light dark;\n${lines.join('\n')}\n}\n[data-theme="light"] { color-scheme: light; }\n[data-theme="dark"] { color-scheme: dark; }\n`;
  }
  let css = `${selector} {\n  color-scheme: ${dark ? 'light dark' : 'light'};\n${block(light ?? dark)}${extra(light ?? dark)}\n}\n`;
  if (light && dark) {
    css += `@media (prefers-color-scheme: dark) {\n  ${selector}:not([data-theme="light"]) {\n    color-scheme: dark;\n${(block(dark) + extra(dark)).replace(/^/gm, '  ')}\n  }\n}\n`;
    css += `${selector}[data-theme="dark"] {\n  color-scheme: dark;\n${block(dark)}${extra(dark)}\n}\n`;
  }
  return css;
}
// DTCG 2025.10 colour value: object with colorSpace + components (0-1) + hex fallback.
export const toDtcg = (roles) => ({
  color: Object.fromEntries(
    Object.entries(roles).map(([k, v]) => [
      k,
      { $type: 'color', $value: { colorSpace: 'srgb', components: hexToRgb(v).map((x) => +(x / 255).toFixed(4)), hex: v } },
    ])
  ),
});

// ---------- Dark-mode rules (measurable subset; see references/dark-mode-rules.md) ----------
const hueDiff = (a, b) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};
// status: 'pass' | 'warn' | 'fail'. Only 'fail' should block shipping; 'warn' needs a stated reason.
export function darkCheck(dark, light = null, { oled = false } = {}) {
  const rows = [];
  const add = (id, rule, status, detail) => rows.push({ id, rule, status, detail });
  const ok = (cond, warnCond) => (cond ? 'pass' : warnCond ? 'warn' : 'fail');
  const lch = (k) => hexToOklch(dark[k]);
  const f3 = (n) => n.toFixed(3);
  const top = dark['surface-2'] ?? dark.surface ?? dark.bg;

  // D1 base is not pure black, L 0.13-0.24
  const bg = lch('bg');
  if (dark.bg.toUpperCase() === '#000000' && !oled) add('D1', 'Base is not pure black (L 0.13-0.24)', 'fail', '#000000 with no OLED opt-in; use L about 0.13-0.24');
  else if (oled && dark.bg.toUpperCase() === '#000000') add('D1', 'Base is not pure black (L 0.13-0.24)', 'pass', 'true black accepted (oled=true); elevation must come from lighter surfaces');
  else add('D1', 'Base is not pure black (L 0.13-0.24)', bg.l >= 0.13 && bg.l <= 0.24 ? 'pass' : 'warn', `bg L ${f3(bg.l)}`);

  // D2 text is not pure white, L 0.88-0.95
  const tx = lch('text');
  add('D2', 'Body text is not pure white (L 0.88-0.95)', dark.text.toUpperCase() === '#FFFFFF' || tx.l > 0.96 ? 'fail' : tx.l >= 0.86 && tx.l <= 0.96 ? 'pass' : 'warn', `text L ${f3(tx.l)}`);

  // D3 text/bg ratio not extreme (halation)
  const r3 = contrast(dark.text, dark.bg);
  add('D3', 'Text/bg ratio not extreme (<= 17:1)', r3 <= 17 ? 'pass' : 'warn', `${r3.toFixed(1)}:1`);

  // D4 elevation by lightness: bg < surface < surface-2, steps 0.02-0.08
  const ladder = ['bg', 'surface', 'surface-2'].filter((k) => dark[k]);
  if (ladder.length > 1) {
    const Ls = ladder.map((k) => lch(k).l);
    const steps = Ls.slice(1).map((v, i) => v - Ls[i]);
    const detail = ladder.map((k, i) => `${k} ${f3(Ls[i])}`).join(' < ');
    if (steps.some((s) => s < 0)) add('D4', 'Elevation = lighter surfaces (step 0.02-0.08)', 'warn', `recessed layout (${detail}); acceptable only if consistent and separated by a border`);
    else if (steps.some((s) => s < 0.015)) add('D4', 'Elevation = lighter surfaces (step 0.02-0.08)', 'fail', `levels indistinguishable (${detail})`);
    else add('D4', 'Elevation = lighter surfaces (step 0.02-0.08)', steps.every((s) => s >= 0.02 && s <= 0.09) ? 'pass' : 'warn', detail);
  }

  // D5 neutral chroma
  add('D5', 'Neutrals tinted, not saturated (bg chroma <= 0.045)', bg.c <= 0.045 ? 'pass' : 'warn', `bg C ${f3(bg.c)}`);

  // D6 primary pairing works and avoids the dead zone
  if (dark.primary && dark['on-primary']) {
    const p = lch('primary');
    const rf = contrast(dark['on-primary'], dark.primary);
    const btnSurf = [dark.bg, dark.surface ?? dark.bg];
    const ru = Math.min(...btnSurf.map((b) => contrast(dark.primary, b)));
    const dead = p.l > 0.58 && p.l < 0.68;
    add('D6', 'Primary: fill pairs with on-primary (4.5:1), reads on bg and surface (3:1), avoids L 0.58-0.68', rf >= 4.5 && ru >= 3 ? (dead ? 'warn' : 'pass') : 'fail', `on-primary ${rf.toFixed(2)}:1, primary/bg+surface ${ru.toFixed(2)}:1, primary L ${f3(p.l)}`);
  }

  // D7 light/dark pair consistency
  if (light && light.primary && dark.primary) {
    const a = hexToOklch(light.primary);
    const b = lch('primary');
    const hd = hueDiff(a.h, b.h);
    const bits = [];
    if (b.l <= a.l) bits.push('dark primary should be lighter than light primary');
    if (b.c > a.c + 0.005) bits.push(`dark chroma ${f3(b.c)} > light ${f3(a.c)} (desaturate 10-30%)`);
    if (hd > 10) bits.push(`hue drifted ${hd.toFixed(0)} deg`);
    add('D7', 'Mode pair: dark primary lighter, chroma not higher, hue within 10 deg', bits.length ? 'warn' : 'pass', bits.join('; ') || `L ${f3(a.l)} -> ${f3(b.l)}, C ${f3(a.c)} -> ${f3(b.c)}, hue drift ${hd.toFixed(0)} deg`);
  }

  // D8 semantic colors on the raised surface
  const sem = ['success', 'warning', 'error', 'info'].filter((k) => dark[k]);
  if (sem.length) {
    const bad = sem.filter((k) => contrast(dark[k], dark.bg) < 4.5 || contrast(dark[k], top) < 4.5);
    add('D8', 'Semantic colors reach 4.5:1 on bg AND the raised surface', bad.length ? 'fail' : 'pass', bad.length ? `failing: ${bad.join(', ')}` : sem.map((k) => `${k} ${contrast(dark[k], top).toFixed(1)}`).join(', '));
  }

  // D9 border-strong 3:1 and decorative border visible
  if (dark['border-strong']) {
    const surf = dark.surface ?? dark.bg;
    const r = Math.min(contrast(dark['border-strong'], dark.bg), contrast(dark['border-strong'], surf));
    add('D9', 'border-strong >= 3:1 on bg and surface', r >= 3 ? 'pass' : 'fail', `${r.toFixed(2)}:1`);
  }
  if (dark.border) {
    const surf = dark.surface ?? dark.bg;
    const dl = Math.abs(hexToOklch(dark.border).l - hexToOklch(surf).l);
    add('D9b', 'Decorative border visible (dL >= 0.05 vs surface)', dl >= 0.05 ? 'pass' : 'warn', `dL ${f3(dl)}`);
  }

  // D10 APCA, advisory
  const lcT = Math.abs(apca(dark.text, dark.bg));
  const lcM = Math.abs(apca(dark['text-muted'], dark.bg));
  add('D10', 'APCA advisory: text >= 75, muted >= 45, aim 60 (|Lc|)', lcT >= 75 && lcM >= 45 ? 'pass' : 'warn', `text ${lcT.toFixed(0)}, muted ${lcM.toFixed(0)}`);

  // D11 focus ring
  if (dark['focus-ring']) {
    const r = Math.min(contrast(dark['focus-ring'], dark.bg), contrast(dark['focus-ring'], top));
    add('D11', 'Focus ring >= 3:1 on bg and raised surface', r >= 3 ? 'pass' : 'fail', `${r.toFixed(2)}:1`);
  }
  return rows;
}

// ---------- Percentage rules: state mixes ----------
// color-mix(in oklab, a, b pct%) equivalent: pct of b.
export function mixOklab(a, b, pct) {
  const x = hexToOklab(a);
  const y = hexToOklab(b);
  const t = pct / 100;
  const L = x.L + (y.L - x.L) * t;
  const A = x.a + (y.a - x.a) * t;
  const B = x.b + (y.b - x.b) * t;
  const c = Math.hypot(A, B);
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  return oklchToHex({ l: L, c, h });
}
// hover/active/disabled are FLOOR percentages; the engine raises hover/active per palette until the lightness step
// reaches dL (applied flat, at least one step fell under dL 0.03 on 37 of 45 palette/preset pairs we measured).
// tint = % of a semantic/primary colour mixed into a surface (alerts, selected rows).
export const STATE_PRESETS = {
  subtle: { hover: 8, active: 14, disabled: 50, tint: 8, dL: [0.03, 0.06], note: 'quiet, editorial; small but still visible steps' },
  standard: { hover: 12, active: 20, disabled: 60, tint: 10, dL: [0.04, 0.08], note: 'default' },
  strong: { hover: 16, active: 26, disabled: 70, tint: 14, dL: [0.06, 0.12], note: 'high feedback: kids/creator, touch-first, low-vision audiences' },
};
// Mix TOWARD whichever of text/bg has more contrast with on-primary, so hover/active never reduce the fill's text contrast.
export const stateTarget = (roles) =>
  contrast(roles['on-primary'], roles.text) >= contrast(roles['on-primary'], roles.bg) ? 'text' : 'bg';
const dLof = (a, b) => Math.abs(hexToOklch(a).l - hexToOklch(b).l);
function solvePct(fill, target, floor, dLmin) {
  const d = dLof(fill, target);
  return d < 1e-6 ? 100 : Math.max(floor, Math.ceil((dLmin / d) * 100));
}
// Returns the mixes to use: target role (or white/black when the role target is too close in lightness), pct for hover/active.
export function stateMixes(roles, preset = 'standard') {
  const P = STATE_PRESETS[preset];
  if (!P) throw new Error('unknown state preset: ' + preset);
  const fill = roles.primary;
  let name = stateTarget(roles);
  let hex = roles[name];
  let hover = solvePct(fill, hex, P.hover, P.dL[0]);
  let active = solvePct(fill, hex, P.active, P.dL[1]);
  if (active > 50) {
    const lighter = hexToOklch(hex).l > hexToOklch(fill).l;
    name = lighter ? 'white' : 'black';
    hex = lighter ? '#FFFFFF' : '#000000';
    hover = solvePct(fill, hex, P.hover, P.dL[0]);
    active = solvePct(fill, hex, P.active, P.dL[1]);
  }
  return { name, hex, hover, active, disabled: P.disabled, tint: P.tint };
}
export function stateReport(roles, preset = 'standard') {
  const P = STATE_PRESETS[preset];
  const M = stateMixes(roles, preset);
  const rows = [];
  const add = (id, rule, status, detail) => rows.push({ id, rule, status, detail });
  const fill = roles.primary;
  const on = roles['on-primary'];
  const surf = roles.surface ?? roles.bg;
  const hover = mixOklab(fill, M.hex, M.hover);
  const active = mixOklab(fill, M.hex, M.active);
  const disabled = mixOklab(fill, roles.bg, M.disabled);
  const out = { hover, active, disabled, mixes: M, tints: {} };
  const rh = contrast(on, hover);
  const ra = contrast(on, active);
  add('S1', `Hover (${M.hover}% toward ${M.name}): on-primary stays >= 4.5:1`, rh >= 4.5 ? 'pass' : 'fail', `${hover} ${rh.toFixed(2)}:1`);
  add('S2', `Active (${M.active}% toward ${M.name}): on-primary stays >= 4.5:1`, ra >= 4.5 ? 'pass' : 'fail', `${active} ${ra.toFixed(2)}:1`);
  const d1 = dLof(fill, hover);
  const d2 = dLof(fill, active);
  add('S3', `Visible steps: hover dL >= ${P.dL[0]}, active dL >= ${P.dL[1]} from default`, d1 >= P.dL[0] - 0.002 && d2 >= P.dL[1] - 0.002 ? 'pass' : 'warn', `hover dL ${d1.toFixed(3)}, active dL ${d2.toFixed(3)}`);
  const rd = contrast(roles['text-muted'] ?? roles.text, disabled);
  const sep = contrast(disabled, roles.bg);
  add('S4', `Disabled (${M.disabled}% toward bg) still reads as a control (>= 1.3:1 vs bg; text exempt from SC 1.4.3)`, sep >= 1.3 ? 'pass' : 'warn', `${disabled} vs bg ${sep.toFixed(2)}:1, label ${rd.toFixed(2)}:1; add cursor:not-allowed and a non-color cue`);
  for (const k of ['success', 'warning', 'error', 'info']) {
    if (!roles[k]) continue;
    const tint = mixOklab(surf, roles[k], M.tint);
    out.tints[k] = tint;
    const rt = contrast(roles.text, tint);
    const ri = contrast(roles[k], tint);
    add('S5', `${k} tint (${M.tint}% on surface): text >= 4.5:1, icon/border >= 3:1`, rt >= 4.5 && ri >= 3 ? 'pass' : 'fail', `${tint} text ${rt.toFixed(2)}:1, ${k} ${ri.toFixed(2)}:1`);
  }
  const sel = mixOklab(surf, fill, M.tint);
  out.selected = sel;
  const rs = contrast(roles.text, sel);
  add('S6', `Selected row (${M.tint}% primary on surface): text >= 4.5:1`, rs >= 4.5 ? 'pass' : 'fail', `${sel} ${rs.toFixed(2)}:1`);
  return { rows, ...out };
}
export function stateVars(roles, preset = 'standard') {
  const M = stateMixes(roles, preset);
  const t = M.name === 'white' || M.name === 'black' ? M.name : `var(--${M.name})`;
  const v = {
    'primary-hover': `color-mix(in oklab, var(--primary), ${t} ${M.hover}%)`,
    'primary-active': `color-mix(in oklab, var(--primary), ${t} ${M.active}%)`,
    'primary-disabled': `color-mix(in oklab, var(--primary), var(--bg) ${M.disabled}%)`,
    selected: `color-mix(in oklab, var(--surface), var(--primary) ${M.tint}%)`,
  };
  for (const k of ['success', 'warning', 'error', 'info']) if (roles[k]) v[`${k}-tint`] = `color-mix(in oklab, var(--surface), var(--${k}) ${M.tint}%)`;
  return v;
}
export const stateCss = (roles, preset = 'standard') => Object.entries(stateVars(roles, preset)).map(([k, v]) => `  --${k}: ${v};`).join('\n');

// ---------- Percentage rules: area budget ----------
// Shares of visible screen area (backgrounds only; text ink is ~5-12% and not counted).
// neutral = bg + surface; secondary = surface-2, borders, large text/ink areas; accent = primary + accent (+ saturated gradients/images).
// These are category conventions, not empirical findings (60-30-10 comes from interior design).
export const AREA_PRESETS = {
  classic: { name: 'Classic 60-30-10', split: [60, 30, 10], range: { n: [55, 65], s: [25, 35], a: [7, 12] }, for: 'e-commerce and SaaS marketing pages, general-purpose default' },
  calm: { name: 'Calm 70-25-5', split: [70, 25, 5], range: { n: [65, 75], s: [20, 30], a: [3, 7] }, for: 'wellness, health, finance, editorial; restraint reads as trust' },
  'dense-app': { name: 'Dense app 80-17-3', split: [80, 17, 3], range: { n: [75, 85], s: [12, 22], a: [1, 5] }, for: 'dashboards, admin, dev tools (light or dark); accent only on actions and selection' },
  'product-first': { name: 'Product-first 80-15-5', split: [80, 15, 5], range: { n: [75, 85], s: [12, 20], a: [3, 6] }, for: 'e-commerce catalogs: photos carry color, one isolated CTA hue' },
  editorial: { name: 'Editorial 70-27-3', split: [70, 27, 3], range: { n: [65, 75], s: [22, 32], a: [2, 5] }, for: 'brutalist/editorial: paper, hard borders and ink do the work, one electric accent' },
  'dark-showcase': { name: 'Dark showcase 70-22-8', split: [70, 22, 8], range: { n: [65, 78], s: [18, 28], a: [5, 10] }, for: 'dark portfolio/agency: near-black field with one warm or vivid accent' },
  'bold-brand': { name: 'Bold brand 50-30-20', split: [50, 30, 20], range: { n: [45, 55], s: [25, 35], a: [15, 25] }, for: 'creator, campaign and kids brands; accent is allowed to lead, other hues stay <= 10%' },
};
export function areaCheck(n, s, a, { preset = null, primaryShare = 100, semantic = 0, kind = null } = {}) {
  const rows = [];
  const add = (id, rule, status, detail) => rows.push({ id, rule, status, detail });
  const P = preset ? AREA_PRESETS[preset] : null;
  if (preset && !P) throw new Error('unknown area preset: ' + preset);
  const sum = n + s + a;
  add('A1', 'Shares sum to 100 (+-1)', Math.abs(sum - 100) <= 1 ? 'pass' : 'fail', `${n} + ${s} + ${a} = ${sum}`);
  add('A2', 'Neutral field is the largest share (>= 45)', n >= 45 && n >= s && n >= a ? 'pass' : 'warn', `neutral ${n}`);
  const cap = P ? P.range.a[1] : { marketing: 10, app: 5, brand: 20 }[kind] ?? 12;
  add('A3', `Accent within budget (<= ${cap}${P ? `, preset ${preset}` : kind ? `, ${kind}` : ''})`, a <= cap ? 'pass' : 'warn', `accent ${a}`);
  if (P) {
    for (const [key, label, v] of [['n', 'neutral', n], ['s', 'secondary', s], ['a', 'accent', a]]) {
      const [lo, hi] = P.range[key];
      add('A4', `${label} inside ${preset} range ${lo}-${hi}`, v >= lo && v <= hi ? 'pass' : 'warn', `${label} ${v}`);
    }
  }
  add('A5', 'Accent is the smallest chromatic share, below secondary', a < s ? 'pass' : 'warn', `accent ${a} vs secondary ${s}`);
  add('A6', 'Primary leads inside the accent budget (>= 70% of accent area)', primaryShare >= 70 ? 'pass' : 'warn', `primary share ${primaryShare}%`);
  add('A7', 'Semantic colors <= 2% at rest (status appears only when meaningful)', semantic <= 2 ? 'pass' : 'warn', `semantic ${semantic}%`);
  return rows;
}
