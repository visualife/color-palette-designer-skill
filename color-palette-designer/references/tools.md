# Tools and systems

## Libraries

| Tool | Use |
|---|---|
| Culori (JS) | OKLCH conversion, `clampChroma`, `wcagContrast`; good engine for build scripts |
| colorjs.io (JS) / Coloraide (Python) | spec-accurate CSS Color 4 gamut mapping; WCAG and APCA contrast |
| chroma.js | scales, mixing, `chroma.contrast` |
| apca-w3 | APCA Lc (beta, advisory) |
| @adobe/leonardo-contrast-colors | generates colors at target contrast ratios (powers Adobe Spectrum) |
| @material/material-color-utilities | HCT tonal palettes, dynamic schemes |

`scripts/lib.mjs` in this skill is dependency-free and sufficient for generate/validate; reach for Culori or colorjs.io when a project already depends on them or needs exact CSS Color 4 gamut mapping.

## Web tools

Radix custom palette (12-step light + dark from a brand color), oklch.com and Huetone (OKLCH picking and ramp tuning with contrast overlays), Coolors and Huemint (fast exploration, ML palettes in role context; not accessibility-aware), Realtime Colors (preview on a live layout, export CSS/Tailwind), Stark and Polypane (contrast audits, CVD simulation), Chrome DevTools and WebAIM Contrast Checker.

## Palette systems compared

| System | Model | Scale | Contrast approach | Best for |
|---|---|---|---|---|
| Material 3 (HCT) | CAM16 hue/chroma + CIELAB L* tone | tones 0-100 | tone difference 40 gives >= 3:1, 50 gives >= 4.5:1; primary T40 light / T80 dark | seed-driven themes |
| Radix Colors | hand-tuned light/dark/alpha/P3 | 12 steps: 1-2 bg, 3-5 component bg, 6-8 borders, 9-10 solid, 11-12 text | steps 11/12 guarantee Lc 60/Lc 90 on step 2 | role-per-step model |
| Tailwind v4 | OKLCH | 50-950, 22 families | none built in | good default ramps |
| Adobe Leonardo | contrast-ratio-first | target ratios, e.g. [1, 2, 3, 4.5, 8, 12] | generates colors at those ratios | accessibility-first |
| Open Color | hand-tuned sRGB | 0-9 per hue | none | quick palettes |
| Refactoring UI | manual, HSB-based | 9-10 shades | manual | tinted-gray mental model |
| Linear | CIE LCH | 3 inputs (base, accent, contrast) replaced 98 variables | `contrast` input gives high-contrast themes | proof that 3-input generation scales |

This skill combines Tailwind-style OKLCH lightness targets, Radix-style jobs per step, and a Leonardo-style contrast solver (`solveL`) for text roles.
