# Dark mode and token architecture

## Contents
1. Construction rules
2. Reference dark palettes
3. Primitive, semantic, component tokens
4. Export formats

## 1. Construction rules

1. **No pure black base.** Material's baseline is `#121212`. Real systems sit at OKLCH L 0.13-0.24: GitHub `#0d1117`, VS Code Dark Modern `#1f1f1f`, Vercel `#0a0a0a`. Pure `#000` is defensible for OLED or a "true black" design (Apple's dark `systemBackground` is `#000000`), but elevation must then come from lighter surfaces.
2. **Elevation through lightness.** Material M2 used white overlays from 0% (0dp) to 16% (24dp); M3 uses tonal surface containers. In OKLCH, step L up about 0.03-0.05 per level.
3. **No pure white text.** Use L 0.90-0.94. Material M2 emphasis was white at 87% / 60% / 38%.
4. **Desaturate and lighten accents.** Primary moves from L ~0.50-0.55 (light) to ~0.70-0.80 (dark) with chroma cut 10-30%; M3 does the same (tone 40 to tone 80).
5. **Flip `on-primary` when needed.** Sky-400 `#38BDF8` takes `#0F172A` text at 8.3:1; white on it is about 2.1:1.
6. **Slightly larger or heavier type** in dark mode: NN/g's review found light mode's advantage grows as font size shrinks.
7. **Offer both themes and follow the OS by default.** In an NN/g survey of 115 mobile users (Kohler and Zhang, 2023), roughly a third chose dark, a third light, a third a combination. Users think about dark mode at the OS level, not per app.
8. Evidence: for users with normal vision light mode gives better reading performance most of the time (Budiu, NN/g 2020, drawing on Piepenbrock et al. 2013); dark mode can help some low-vision users such as those with cataracts. The common claim that dark mode is better for everyone is not supported.

## 2. Reference dark palettes (extracted values)

| System | bg | surface | border | text | muted | accent | semantic |
|---|---|---|---|---|---|---|---|
| GitHub Primer dark | #0d1117 | #161b22 (inset #010409) | #30363d | #e6edf3 | #8b949e | link #58a6ff, button #1f6feb | #3fb950 / #d29922 / #f85149 |
| VS Code Dark Modern | #1F1F1F | #181818, inputs #313131 | #2B2B2B | #CCCCCC | ~#9D9D9D | #0078D4 | |
| VS Code Dark+ (classic) | #1E1E1E | #252526 | #474747 | #D4D4D4 | | #007ACC | |
| Vercel Geist dark | #0a0a0a | #171717 | #737373 (gray-400) | #EDEDED | #A0A0A0 | #0070F3 | #46A758 / #FFB224 / #E5484D |
| Apple iOS (UIKit) | #000000 | #1C1C1E, tertiary #2C2C2E | | | | systemBlue #0A84FF | |
| Notion dark | #191919 | #202020, popovers #252525 | | #F0EFED (older sources #D4D4D4) | #ADA9A3 | | |

Source quality: GitHub Primer (MIT-licensed primitives), VS Code `dark_modern.json` and Vercel Geist light are first-party. Vercel dark, Notion and Apple web values are third-party extractions and can drift. A reported 2025 change of Apple's dark systemBlue to `#0091FF` is unconfirmed. Primer has renamed tokens over time (`--color-canvas-default` to `--bgColor-default`).

Measured on GitHub dark: `#e6edf3` on `#0d1117` 16.0:1; `#8b949e` 6.15:1; `#58a6ff` 7.5:1; white on `#1f6feb` 4.6:1.

## 3. Primitive, semantic, component tokens

```css
/* 1. PRIMITIVES: raw ramps, no meaning */
:root {
  --gray-50: oklch(0.985 0.003 255);   /* ... */
  --gray-950: oklch(0.13 0.02 255);
  --brand-500: oklch(0.55 0.17 262);   /* ... full 50-950 */
}
/* 2. SEMANTIC: roles. Default output = plain vars + media query + data-theme override */
:root {
  color-scheme: light dark;
  --bg: var(--gray-50);  --surface: #fff;  --text: var(--gray-900);
  --text-muted: var(--gray-600);  --primary: var(--brand-600);
  --on-primary: #fff;  --border-strong: var(--gray-500);  --focus-ring: var(--brand-600);
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --bg: var(--gray-950);  --surface: var(--gray-900);  --text: var(--gray-100);
    --text-muted: var(--gray-400);  --primary: var(--brand-400);
    --on-primary: var(--gray-950);  --border-strong: var(--gray-500);  --focus-ring: var(--brand-300);
  }
}
:root[data-theme="dark"] { color-scheme: dark; /* same dark values */ }
/* 3. COMPONENT: consume semantics only */
.btn-primary { background: var(--primary); color: var(--on-primary); }
.btn-primary:hover  { background: color-mix(in oklab, var(--primary), var(--text) 12%); }
.btn-primary:active { background: color-mix(in oklab, var(--primary), var(--text) 20%); }
.btn-primary:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.btn-primary:disabled { background: color-mix(in oklab, var(--primary), var(--bg) 60%); color: var(--text-muted); cursor: not-allowed; }
```

Compact alternative: `--bg: light-dark(var(--gray-50), var(--gray-950));` with `color-scheme: light dark` and `[data-theme]` overrides (`node palette.mjs generate ... --format css-light-dark`). `light-dark()` has been Newly Available since May 2024 and reaches Widely Available on 13 November 2026; keep the media-query form for older engines.

Avoid theme flash: an inline `<head>` script reads `localStorage` and sets `data-theme` before first paint; add `<meta name="color-scheme" content="light dark">`.

## 4. Export formats

- CSS custom properties: `generate --format css`.
- Tailwind v4: map roles into `@theme { --color-bg: ...; }`. Tailwind v4's own palette is OKLCH (blue-500 `oklch(62.3% 0.214 259.815)`).
- DTCG design tokens (stable 2025.10, media type `application/design-tokens+json`, supported by Figma, Tokens Studio, Style Dictionary, Penpot): `generate --format dtcg` emits `{"$type":"color","$value":{"colorSpace":"srgb","components":[r,g,b],"hex":"#..."}}`. Aliases use `{color.brand.500}`; OKLCH and Display P3 color spaces are supported.
