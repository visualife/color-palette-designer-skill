---
name: color-palette-designer
description: Design, validate and ship color palettes for websites and UI. Builds role-based palettes (bg, surface, text, primary, accent, semantic) in OKLCH from a brief (brand color, mood, industry, light/dark), checks every pair against WCAG 2.2, adds APCA and color-blind checks, and outputs copy-ready CSS custom properties, Tailwind v4 @theme or DTCG tokens. Includes 15 verified palettes (wellness/organic, dark developer, SaaS, fintech, health, e-commerce, agency) and a live demo page. Use this whenever the user mentions color palette, color scheme, brand colors, color combination, which colors go together, dark mode colors, theme, design tokens, contrast, accessible colors, CTA color, "make it look less generic", or asks for a palette for a landing page, Shopify/WordPress theme, dashboard or portfolio, even if they never say "palette". Also use to audit or fix colors in an existing design or CSS.
---

# Color palette designer

Colors that look good and also pass contrast come from one process: pick hues for mood, then fix lightness with math. Harmony wheels, 60-30-10 and color-psychology charts are starting heuristics with no usability evidence behind them. Contrast, restraint (one action hue) and an accent that stands out from its surroundings are the parts that hold up. Build for those.

All numbers come from `scripts/palette.mjs` (dependency-free Node). Run it instead of estimating ratios or OKLCH values by hand; hand-computed contrast is wrong often enough to matter (the research this skill came from had several values off by 0.05 to 0.15).

```bash
S=<skill-dir>/scripts/palette.mjs
node $S contrast '#767676' '#ffffff'        # 4.54:1, grades, APCA Lc
node $S oklch '#3F6B4E'                     # exact OKLCH
node $S solve '#C0643F' '#FFFFFF' 4.5 darker   # nudge L only until it passes
node $S ramp 155 0.12                       # 50-950 OKLCH ramp
node $S generate --hue 155 --chroma 0.07 --neutral-hue 95 --accent-offset -110 --format report
node $S generate ... --format css           # also: css-light-dark | json | dtcg
node $S audit sage-wellness                 # a curated palette id, or any roles .json
node $S presets                             # area-split and state-mix presets
node $S ratio 70 25 5 --preset calm         # validate an area split (percent of visible area)
node $S states sage-wellness --css          # solved hover/active/disabled/tint mixes + checks
node $S dark midnight-terminal              # dark-mode rules D1-D11 (add --light <id|file>, --oled)
node $S cvd '#0072B2' '#D55E00' '#009E73'   # color-blind separation
```

`audit`, `generate`, `dark`, `states` and `ratio` exit non-zero on a failing pair or FAIL rule, so use them as the gate before showing anything to the user. For a dark mode, `generate` and `audit` run the dark rules automatically.

## Workflow: brief to validated palette

1. **Parse the brief.** Brand color(s), mood words, industry, audience (age, vision), modes (light, dark or both), conformance (AA by default; AAA body text for health, government, older audiences). If the user gave only a vibe, pick a hue from the decision table below and state the assumption in one line instead of asking.
2. **Pick a strategy.** Default is tinted neutral + one primary (+ optional one accent). Monochrome plus semantic colors is the safest. Use a complement only to make the CTA stand out (isolation effect). Triadic and tetradic belong in charts and illustration, rarely in UI chrome.
3. **Anchor hue and chroma.** With a brand hex, run `oklch` and keep its hue. Cap chroma around 0.12 for earthy/wellness, 0.20-0.26 for vibrant/tech. Without one, pick a hue distinct from the obvious competitors in the category.
4. **Generate.** `generate` builds neutral, primary, accent and semantic roles for each mode and solves lightness so contrast targets are met. For a hand-built palette, build ramps with `ramp` and map steps to roles (table below).
5. **Validate every pair** with `audit`. On failure, move **lightness only** (`solve`), never hue; reduce chroma if the color leaves sRGB. Every failure in the 15 curated palettes was a mid-lightness, high-chroma accent (OKLCH L about 0.60-0.77): too light for white text, too dark for dark text, too close to white for 3:1. Fix: darken to L <= 0.55 and use white text, lighten to L >= 0.72 and use dark text, or keep it decorative with a border.
6. **Color-blind check** with `cvd`. If primary, success and error collapse (dE_OK < 0.10 under any simulation), separate them by lightness and require an icon and label, because hue alone cannot carry meaning (WCAG 1.4.1).
7. **APCA is advisory.** WCAG 3 has not adopted a contrast algorithm (the September 2026 working draft says it is still to be determined), so WCAG 2.2 decides pass/fail. Report APCA Lc as a warning: body text below |Lc| 75 is thin (common in dark mode); below 15 is invisible.
8. **Define states with `states`, not by hand.** Hover and active percentages depend on the palette: flat preset percentages left at least one state step under dL 0.03 (barely visible) on 37 of 45 palette/preset combinations we measured, and the hover step alone on 26. `node $S states <palette> --preset standard --css` solves the mix percentage and direction (toward whichever of text/bg keeps on-primary readable), checks contrast of every state, and emits `color-mix(in oklab, ...)` variables; `generate --format css --states standard` adds them to every mode. Disabled: mixed toward bg plus a non-color cue. Focus: 2px ring, offset 2px, >= 3:1 against bg. Selected and visited need a non-color cue.
9. **Pick the proportions** (see "Percentage rules" below) and state the preset in the delivery notes.
10. **Emit** the role table (hex + exact OKLCH), the pass/fail table, CSS custom properties, and optionally Tailwind v4 `@theme` or DTCG JSON. Label rationale as convention or evidence (see `references/evidence-and-conventions.md`) so generated copy never repeats color-psychology folklore.
11. **Show it.** Offer or build the demo page (below) so the user judges the palette on a real layout, not a swatch grid.

## Role contract

Every palette defines these roles for every supported mode. Components consume roles, never raw hex.

| Role | Purpose | Minimum |
|---|---|---|
| `bg`, `surface`, `surface-2` | canvas, cards, raised panels | distinguishable (OKLCH dL >= ~0.03) |
| `border` | decorative dividers | none |
| `border-strong` | input outlines, controls | **3:1** on bg (SC 1.4.11) |
| `text` | body | **4.5:1** on bg and surfaces (aim 7+) |
| `text-muted` | secondary text | **4.5:1** on bg and surfaces |
| `primary` / `on-primary` | main action fill / text on it | fill 3:1 on bg, link text 4.5:1; text on fill 4.5:1 |
| `accent` / `on-accent` | optional second hue | same as primary if it carries meaning |
| `success` `warning` `error` `info` | status text and icons | 4.5:1 on bg; never color-only |
| `focus-ring` | keyboard focus | 3:1 vs adjacent colors |

Ramp to role mapping (50-950 scale): light bg 50 or white, surface white/50, surface-2 100, border 200, border-strong 500, text 900-950, text-muted 600, primary 600-700, on-primary white, focus primary-600. Dark: bg 950 (or 900), surface 900, surface-2 800, border 800, border-strong 600, text 50-100, text-muted 400, primary 300-400, on-primary 950, focus primary-300. Treat the mapping as a first guess and let `audit` decide.

## Hard rules (WCAG 2.2 AA unless AAA requested)

- Text 4.5:1; large text (>= 24px, or >= 18.66px bold) 3:1; UI components and meaningful graphics 3:1 (SC 1.4.11); AAA is 7:1 text, 4.5:1 large.
- Decorative borders can be faint, but an input outline that is the only cue for the field must hit 3:1. A 1.3:1 "elegant" input border is a failure.
- Color never carries meaning alone. Underline body links or give them 3:1 against surrounding text plus a hover/focus cue; errors get an icon and message; chart series get direct labels or shapes.
- Tinted backgrounds change the math. Semantic colors tuned for white drop to about 4.4:1 on a warm paper bg; run `audit` on the real bg, not on white.
- Contrast on gradients and photos must hold at the worst point (lightest and darkest region), or add a scrim.

Details, formulas, color-blind-safe sets (Okabe-Ito) and APCA thresholds: `references/accessibility.md`.

## Working in OKLCH

- Use `oklch(L C H)` as the source of truth. `L` is perceived lightness (0-1), so equal-L colors really look equally light; in HSL a 50% yellow and 50% blue are wildly different. Rotating hue in OKLCH keeps lightness, which is why harmony offsets work there and not in HSL.
- Tint neutrals with the brand hue at very low chroma: about 0.005-0.015 near white, 0.01-0.045 in darks. Warm neutrals (hue 60-100) suit wellness, food, editorial; cool (240-270) suit SaaS, finance, dev tools. Avoid stray pure grays next to tinted ones.
- Ramp targets: L 0.985, 0.967, 0.928, 0.872, 0.707, 0.554, 0.446, 0.372, 0.279, 0.208, 0.129 for steps 50-950, chroma tapering at both ends. Gamut-map by reducing chroma, not by clipping; browsers clip crudely.
- Gradients: interpolate `in oklab` or `in oklch` to avoid gray muddy midpoints; avoid near-zero-chroma full-viewport dark gradients (banding) or add subtle noise.
- Support (late 2026): `oklch()` Baseline since 2023; `color-mix()` Widely Available since Nov 2025; relative color syntax in Chrome 122+, Firefox 128+, Safari 18+; `light-dark()` reaches Widely Available 13 Nov 2026. Ship plain custom properties with a `prefers-color-scheme` plus `[data-theme]` override as the default output; offer `light-dark()` as the compact alternative. In relative color syntax `l` is 0-1.

## Decision table: brief to strategy

| Brief signal | Neutral | Primary | Accent | Mode | Target |
|---|---|---|---|---|---|
| Wellness, organic, spa, tea | warm, H 70-100, C 0.008-0.02 | sage/moss/teal, C 0.05-0.10, L ~0.50 | analogous or earthy complement (terracotta, clay) | light | AA, body 7:1 preferred |
| E-commerce | neutral/warm, C <= 0.01 | brand | isolated CTA hue used nowhere else | light | AA |
| SaaS / B2B | cool, H 250-270, C 0.01-0.04 | blue/indigo/violet | monochrome + semantic | light + dark | AA |
| Dev tool | cool or pure gray | blue/violet/green, dark L 0.70-0.80 | mono; syntax colors only in code | dark first + light | AA, check APCA |
| Agency / portfolio | off-white paper or near-black | black/white | one electric accent, with borders if it fails 3:1 | either | AA |
| Finance | cool navy | navy/blue | gain/loss with +/- and arrows | light (+ dark) | AA, AAA for figures |
| Health | cool neutral | teal/blue | calm green | light | **AAA body** |
| Kids / creator | warm cream | saturated violet/blue | triadic, each <= 10% area | light | AA |

Starting points: `references/palettes.md` (15 verified palettes with CSS, OKLCH and pass/fail tables). Pick the nearest one, adapt hue and chroma, re-run `audit`.

## Percentage rules and presets

Area splits are an area budget, not a law: 60-30-10 is an interior-design convention with no usability study behind the exact numbers, but a small accent share protects the one research-backed effect here (a CTA stands out only if its hue is rare). Shares are percent of visible background area (text ink is not counted). Check a split with `ratio`; measure a real page with `scripts/measure-area.js` instead of guessing.

| Preset | Split n-s-a | Use for |
|---|---|---|
| `classic` | 60-30-10 | e-commerce and SaaS marketing, general default |
| `calm` | 70-25-5 | wellness, health, finance, editorial |
| `dense-app` | 80-17-3 | dashboards, admin, dev tools (light or dark) |
| `product-first` | 80-15-5 | catalogs where photos carry color; one isolated CTA hue |
| `editorial` | 70-27-3 | brutalist/editorial: borders and ink do the work |
| `dark-showcase` | 70-22-8 | dark portfolio/agency with one vivid accent |
| `bold-brand` | 50-30-20 | creator, campaign, kids: accent may lead |

Rules: shares sum to 100 (FAIL); neutral is the largest share, >= 45; accent stays inside the preset's range (saturated gradients and brand overlays count as accent); primary holds >= 70% of the accent area so one action hue leads; semantic colors <= 2% at rest; dark themes keep neutral >= 70. State presets (`subtle` 8/14/50, `standard` 12/20/60, `strong` 16/26/70 as floor percentages for hover/active/disabled, tints 8/10/14) are raised per palette by `states` until the step is visible. Ranges, rules A1-A7 and S1-S6, direction logic and the measuring snippet: `references/proportions-and-states.md`.

## Dark mode

A dark theme is a second palette, never an inversion. The engine enforces the measurable rules (`node $S dark ...`, also run by `generate` and `audit`); the rest are implementation rules to apply by hand. Full table with thresholds and fixes: `references/dark-mode-rules.md`.

Measured (FAIL blocks; WARN needs a stated reason):
- **D1** bg is not pure black: OKLCH L 0.13-0.24 (true `#000` only for a declared OLED variant).
- **D2** text is not pure white: L 0.88-0.95. **D3** text/bg <= 17:1.
- **D4** elevation by lightness: bg < surface < surface-2, about +0.04 L per step; shadows do not elevate on dark.
- **D5** neutrals tinted, bg chroma <= 0.045.
- **D6** primary is either a light fill (L >= 0.70) with dark on-primary, or a deep fill (L <= 0.58) with white on-primary; the 0.58-0.68 band is a dead zone. Fill needs 3:1 on bg and surface.
- **D7** against the light theme: same hue (within 10 degrees), lighter, chroma not higher (cut 10-30%).
- **D8** status colors re-tuned for dark: 4.5:1 on bg and on the raised surface, with icon and text.
- **D9** border-strong 3:1; decorative borders still visible (dL >= 0.05). **D11** focus ring 3:1.
- **D10** APCA advisory: text |Lc| >= 75, muted >= 45 (aim 60); dark polarity exposes thin text that WCAG 2 passes.

By hand: never use `filter: invert` (N1); lighten on hover instead of darkening (N3); no alpha text (N4); dim bright photos and ship light/mono logo variants (N5); avoid small thin type (N6); set `color-scheme` and per-scheme `theme-color` (N8); follow the OS with a tri-state toggle and no flash (N9); re-check chart colors on the dark surface (N10). Light mode reads better for most users with normal vision and dark helps some low-vision users, so offer both. Reference dark palettes and token architecture: `references/dark-mode-and-tokens.md`.

## Anti-patterns to catch

Three or more saturated hues in chrome; the CTA hue reused for headings, icons and badges; saturated complements at equal L (edges vibrate); gray text on colored backgrounds (use the bg's hue at adjusted L); light-gray-on-off-white "minimal" text under 4.5:1; mid-L accent with white text; `outline: none` with no replacement; hover and active states that differ by a tiny hue shift (change L by 0.05-0.10); disabled that looks enabled; same saturated brand color reused unchanged in dark mode; sRGB gradients between complements; text over a gradient checked at one point.

## Definition of done

- [ ] All roles defined for every mode; all pairs in `audit` pass (7:1 body if AAA), including hover and active.
- [ ] Semantic colors pass in both modes and ship with icon and text.
- [ ] `cvd` run; no critical pair collapses without an icon or label.
- [ ] Exactly one action hue; accent area <= ~10% of a typical screen.
- [ ] Dark mode: `dark` reports no FAIL; every WARN has a stated reason; N1-N12 applied or marked not applicable.
- [ ] All colors inside sRGB (or P3 with an sRGB fallback in `@media (color-gamut: p3)`).
- [ ] Area split validated with `ratio` against a named preset (measured with `measure-area.js` when a page exists); `states` reports no FAIL, and its CSS is in the output.
- [ ] States defined: hover, active, focus-visible, disabled, selected, visited.
- [ ] Output includes CSS custom properties with dark override; DTCG or Tailwind on request.
- [ ] Any psychology or industry rationale is labeled convention vs evidence.

## The demo page

`assets/demo.html` is a single file with no dependencies: pick any of the 15 palettes (Palette, Conformance and State mixes sit in one toolbar above the preview), toggle light/dark, see a sample UI (nav, hero with an OKLCH gradient, cards, buttons with all states, form with an error, alerts, chart legend), Interactive: edit any role color live (audit, states, CSS and URL hash update), contrast checker with a nudge-to-pass button, working tabs/switch/radio/alerts/form validation in the sample UI, CSS and DTCG downloads, shareable link. Rule tables (dark, area, state) and the CSS block are collapsed by default. It also has a live contrast audit with exact OKLCH, APCA Lc and AA/AAA/UI/FAIL badges, plus the dark-mode rule table (D1-D11) when the theme is dark, an area-split panel (presets, live validation, "measure this preview") and a state-mix panel (solved percentages applied to the sample buttons and alerts). The page carries a "Created by Ailive.fr" credit. Toggles preview protan/deutan/tritan and grayscale, compare HSL against OKLCH ramps, and replay the deliberate failures. To ship a custom palette in the demo: write its roles JSON, then `node scripts/build_demo.mjs --palette my.json --out demo-custom.html`. The demo's engine is inlined from `scripts/lib.mjs`, so it computes the same numbers as the CLI.

## References (read when needed)

- `references/palettes.md`: 15 verified palettes. Read when the user wants a starting point or an example of a role-mapped palette.
- `references/accessibility.md`: formulas, APCA thresholds, color-blind-safe sets, testing tools. Read for AAA work, charts, or any disputed contrast.
- `references/proportions-and-states.md`: area-split presets, state-mix presets, rules A1-A7 and S1-S6, how to measure a real page. Read when choosing proportions or emitting state tokens.
- `references/dark-mode-rules.md`: every dark rule (D1-D11 measured, N1-N12 manual) with thresholds, rationale and fixes. Read for any dark-mode work.
- `references/dark-mode-and-tokens.md`: dark construction, primitive/semantic/component tokens, reference dark palettes, DTCG export. Read when building a theme system.
- `references/evidence-and-conventions.md`: what color psychology and CTA research actually supports, industry conventions, 2025-2026 trends, extracted brand palettes with source quality. Read before writing rationale or copy about color.
- `references/tools.md`: libraries and web tools for generating and checking palettes.
