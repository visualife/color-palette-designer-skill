# Accessibility reference

## Contents
1. WCAG 2.2 requirements
2. Formula
3. APCA / WCAG 3 status and thresholds
4. Color-vision deficiency
5. Verification checklist
6. Testing tools

## 1. WCAG 2.2 requirements

| SC | Level | Requirement |
|---|---|---|
| 1.4.3 Contrast (Minimum) | AA | Text 4.5:1. Large text (>= 18pt / 24px, or >= 14pt / 18.66px bold) 3:1. Inactive and decorative exempt. |
| 1.4.6 Contrast (Enhanced) | AAA | 7:1; large text 4.5:1. |
| 1.4.11 Non-text Contrast | AA | UI boundaries, states and meaningful graphics 3:1 against adjacent colors. Inactive exempt. |
| 1.4.1 Use of Color | A | Color must not be the only means of conveying information. |
| 2.4.7 Focus Visible (AA), 2.4.13 Focus Appearance (AAA) | | Visible focus; AAA wants a sizable indicator with a 3:1 change. |

Legal baseline today is WCAG 2.1/2.2 AA. US ADA Title II deadlines for large entities were extended to 26 April 2027 (WCAG 2.1 AA).
## 2. Formula (normative)

- `contrast = (L1 + 0.05) / (L2 + 0.05)`, L1 the lighter.
- `L = 0.2126 R + 0.7152 G + 0.0722 B` on linearized channels; `c <= 0.04045 ? c/12.92 : ((c+0.055)/1.055)^2.4`.
- The ratio is symmetric. `#767676` on white is the classic minimum gray at 4.54:1.
- Implemented in `scripts/lib.mjs` as `contrast()`. Hex quantization matters: always evaluate contrast on the final hex, not on the pre-rounding OKLCH value (the solver does this).
- Near-threshold pairs deserve a second look: white on `#0078D4` is 4.53:1; white on `#2F855A` is 4.54:1.

## 3. APCA / WCAG 3

- WCAG 3 has had many Working Drafts since January 2021; the latest (10 September 2026) says the contrast algorithm "is yet to be determined". The visual-contrast work was pulled from the draft in July 2023. APCA (`apca-w3` on npm) is a public beta. Treat APCA as advisory and never as pass/fail.
- Lc is signed and polarity-sensitive: gray `#8C8C8C` text on black is 6.25:1 under WCAG 2 but only about Lc -40.6, so a pair that "passes" WCAG 2 can still be weak in dark mode.
- Myndex "Bronze Simple Mode" guidance (sizes assume the 0.52 x-height ratio), abridged:

| |Lc| | Guidance | Rough WCAG 2 analogue |
|---|---|---|
| 90 | preferred for fluent body text; suggested maximum for very large bold text | 7:1 |
| 75 | minimum for columns of body text (24px/300, 18px/400, 16px/500, 14px/700) | 4.5:1 |
| 60 | minimum for content text that is not body text | 3:1 |
| 45 | minimum for headlines (36px normal / 24px bold) and detailed pictograms | |
| 30 | absolute minimum for any text, including placeholder and disabled | |
| 15 | non-semantic non-text such as dividers; anything lower is effectively invisible | |

Policy in this skill: WCAG 2.2 decides pass/fail; report APCA Lc as a warning, especially for thin or small light-on-dark text.

## 4. Color-vision deficiency (CVD)

- Prevalence: as many as 8% of men and 0.5% of women of Northern European ancestry have the common red-green form (Wong, Nature Methods 8:441, 2011). Tritan is rare.
- Okabe-Ito categorical set: `#0072B2` blue, `#E69F00` orange, `#009E73` bluish green, `#CC79A7` reddish purple, `#56B4E9` sky blue, `#D55E00` vermilion, `#F0E442` yellow, `#000000`. Use in that order; for two categories, blue + orange is the most robust. Even this set has near-collisions under specific simulations (run `cvd`): for example blue vs bluish green is about 0.08 dE_OK under tritan.
- Avoid red vs green at similar lightness (use blue vs orange, or add icon + label + at least 0.15 OKLCH L difference), green vs brown/olive, blue vs purple under protan, and light green vs yellow under tritan.
- In practice: underline body links; give errors an icon and message, not only a red border; label chart series directly.
- `scripts/lib.mjs` simulates protan, deutan and tritan (Machado 2009, severity 1.0, linear RGB) and measures separation as dE_OK (Euclidean distance in OKLab). Below about 0.10 a pair is treated as collapsing. This is a screening heuristic; confirm with Chrome DevTools, Polypane or Stark.

## 5. Verification checklist

| Pair | Minimum |
|---|---|
| `text`, `text-muted` on `bg`, `surface`, `surface-2` | 4.5:1 |
| `on-primary` on `primary` (including hover and active) | 4.5:1 |
| `primary` as link text on `bg` | 4.5:1 |
| `border-strong`, `focus-ring`, `primary` fill on `bg` | 3:1 |
| each semantic fg on its bg | 4.5:1 |
| semantic solid fill on bg | 3:1 |
| categorical chart colors | distinguishable under deutan/protan (dE_OK >= ~0.1) |

## 6. Testing tools

Chrome DevTools: color picker shows WCAG and APCA; Rendering tab "Emulate vision deficiencies". WebAIM Contrast Checker for quick checks. Polypane and Stark for audits and CVD simulation. Grayscale test: if the CTA vanishes in grayscale, its contrast is insufficient.
