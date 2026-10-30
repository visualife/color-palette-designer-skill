# Percentage rules and presets

Two kinds of percentages, both checked by the engine:

1. **Area splits**: how much of the visible screen each color group may cover (60-30-10 and its siblings).
2. **State mixes**: how far hover, active, disabled, tinted backgrounds move from the base color (`color-mix(... 12%)`).

Evidence status, so rationale stays honest: area splits are category conventions (60-30-10 comes from interior design; no usability study validates the exact numbers). They are an area *budget* that protects one thing that is research-backed, the isolation effect: a CTA only stands out if the hue is rare. State percentages are not conventions, they are checkable: the engine measures contrast and lightness steps on the actual colors.

## 1. Area splits

Shares are percent of **visible area, backgrounds only** (text ink is about 5-12% of a page and is not counted).

| Group | Roles | Counts |
|---|---|---|
| neutral | bg, surface | the field |
| secondary | surface-2, borders, large ink areas | structure |
| accent | primary, accent, focus ring, and saturated gradients/images | action and brand |
| semantic | success, warning, error, info | status |

### Presets

| id | split (n-s-a) | ranges (n, s, a) | Use for |
|---|---|---|---|
| `classic` | 60-30-10 | 55-65, 25-35, 7-12 | e-commerce and SaaS marketing pages, general default |
| `calm` | 70-25-5 | 65-75, 20-30, 3-7 | wellness, health, finance, editorial: restraint reads as trust |
| `dense-app` | 80-17-3 | 75-85, 12-22, 1-5 | dashboards, admin, dev tools (light or dark): accent only on actions and selection |
| `product-first` | 80-15-5 | 75-85, 12-20, 3-6 | catalogs: photos carry the color, one isolated CTA hue |
| `editorial` | 70-27-3 | 65-75, 22-32, 2-5 | brutalist/editorial: paper, hard borders and ink; one electric accent |
| `dark-showcase` | 70-22-8 | 65-78, 18-28, 5-10 | dark portfolio/agency: near-black field, one warm or vivid accent |
| `bold-brand` | 50-30-20 | 45-55, 25-35, 15-25 | creator, campaign, kids: the accent may lead; other hues stay <= 10% |

Pick by brief: wellness/organic, health, finance to `calm`; e-commerce marketing and SaaS landing to `classic`; catalog and product pages to `product-first`; apps and dev tools to `dense-app`; dark agency/portfolio to `dark-showcase`; editorial or brutalist to `editorial`; creator/kids to `bold-brand`.

### Rules (A1-A7, `node scripts/palette.mjs ratio n s a --preset id`)

| ID | Rule | Level |
|---|---|---|
| A1 | Shares sum to 100 (+-1) | FAIL |
| A2 | Neutral is the largest share and >= 45 | WARN |
| A3 | Accent within the preset's budget (no preset: marketing <= 10, app <= 5, brand <= 20) | WARN |
| A4 | Each share inside the preset range | WARN |
| A5 | Accent is smaller than secondary | WARN |
| A6 | Primary holds >= 70% of the accent area (one action hue leads; the secondary accent never outweighs it) | WARN |
| A7 | Semantic colors <= 2% at rest; status shows up only when it means something | WARN |

Accent counts saturated hero gradients, brand photography overlays and large colored sections, not only buttons. A single hero block may exceed the budget on a brand page if the rest of the page stays inside it; say so in the delivery notes.

Dark themes: dark ink areas read as larger than their pixel share, so keep neutral >= 70 and apps at the `dense-app` accent cap.

### Measuring a real page

Do not eyeball percentages. `scripts/measure-area.js` samples the page with `elementFromPoint` (it counts what a visitor sees, scrolls through the page, buckets each point to the nearest role color):

```js
// DevTools console, or Playwright page.evaluate with the file's text prepended
measureArea({bg:'#F7F5EF', surface:'#FFFFFF', text:'#2B3A2F', primary:'#3F6B4E', accent:'#A9532F'}, document.body)
// -> { neutral: 71.2, secondary: 22.9, accent: 4.6, semantic: 0, gradient: 1.3, other: 0, perRole: {...} }
```

Feed the result to `ratio` (`ratio 71 23 6 --preset calm`). `gradient` is background-image area; count the saturated part toward accent. A large `other` means off-palette colors crept in (images excluded), which is itself a finding.

## 2. State mixes

Presets give **floor** percentages. The engine raises hover and active per palette until the lightness step is visible, because a flat percentage is not reliable: with the flat preset percentages applied as-is, at least one step (default to hover, or hover to active) stayed under dL 0.03 (barely visible) on 37 of 45 combinations across the 15 curated palettes and 3 presets, and the hover step alone on 26. How far a mix moves depends on how close the fill is in lightness to the mix target; across the curated palettes the solved standard hover ranges from 12% to 24% and active from 20% to 48%.

| id | hover floor | active floor | disabled | tint | min dL hover / active | Use for |
|---|---|---|---|---|---|---|
| `subtle` | 8% | 14% | 50% | 8% | 0.03 / 0.06 | quiet, editorial, wellness |
| `standard` | 12% | 20% | 60% | 10% | 0.04 / 0.08 | default |
| `strong` | 16% | 26% | 70% | 14% | 0.06 / 0.12 | kids/creator, touch-first, low-vision audiences, health |

### Rules (S1-S6, `node scripts/palette.mjs states <palette> --preset standard --css`)

| ID | Rule | Level |
|---|---|---|
| S1 | Hover fill keeps on-primary >= 4.5:1 | FAIL |
| S2 | Active fill keeps on-primary >= 4.5:1 | FAIL |
| S3 | Hover and active reach the preset's minimum lightness step | WARN |
| S4 | Disabled fill still separates from bg (>= 1.3:1); label is exempt from SC 1.4.3 but add `cursor: not-allowed` and a non-color cue | WARN |
| S5 | Semantic tint (alert background): body text >= 4.5:1, icon/border color >= 3:1 | FAIL |
| S6 | Selected row (primary tint): text >= 4.5:1 | FAIL |

Direction: mix toward whichever of `text` or `bg` has more contrast with `on-primary`, so a state never lowers the label's contrast. In light mode with white labels that means toward the dark text; in dark mode with a light fill and dark label, toward the light text; in dark mode with a deep fill and white label (GitHub-style blue button), toward `bg`. When the target role is too close in lightness to move the fill (the solver would need more than 50%), the engine switches the target to pure black or white. `--css` emits the result as `color-mix(in oklab, ...)` custom properties, and `generate --format css --states standard` adds them to every mode.

Tint rule: color the icon and the left border with the semantic color, keep body text and the label in `text`. A semantic color used as label text on its own tint loses contrast (success `#15803D` drops from 5.0:1 on white to 4.4:1 on a 10% tint).

Other percentages worth fixing in tokens (conventions, not measured): scrim behind modals 40-60% black (check text over the scrim's worst point), white overlay hover on dark surfaces 4-8% alpha, focus ring 2px with 2px offset.
