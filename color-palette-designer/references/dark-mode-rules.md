# Dark-mode rules

Two groups. **D1-D11 are measured** by `node scripts/palette.mjs dark <palette-id|file.json> [--light <id|file>] [--oled]`, and automatically by `generate` and `audit` for the dark mode. **N1-N12 are implementation rules** the engine cannot see; check them by hand before shipping.

Status meaning: FAIL blocks shipping. WARN is allowed only with a stated reason in the delivery notes (for example, "recessed sidebar is deliberate, separated by a border").

Why dark mode needs its own rules: lightness steps that look fine on white invert in meaning on dark (elevation, emphasis, hover), saturated colors vibrate on dark surfaces, and WCAG 2 ratios hide polarity problems that APCA exposes. A dark theme is a second palette, never an inversion.

## D. Measured rules

| ID | Rule | Threshold | Level | If it fails |
|---|---|---|---|---|
| D1 | Base is not pure black | bg OKLCH L 0.13-0.24. `#000000` fails unless `--oled` (then elevation must come from lighter surfaces) | FAIL at `#000`, WARN outside range | Raise bg to L ~0.19; GitHub `#0d1117` L 0.18, Material `#121212` L 0.18 |
| D2 | Body text is not pure white | text L 0.88-0.95; `#FFFFFF` or L > 0.96 fails | FAIL / WARN | Use L ~0.90-0.94 (`#E6EDF3`, `#E2E8F0`) |
| D3 | Text/bg ratio not extreme | <= 17:1 (halation: bright text on dark blooms) | WARN | Lower text L a notch; GitHub is 16.0:1 |
| D4 | Elevation = lighter surfaces | bg < surface < surface-2, steps 0.02-0.08 L. Steps under 0.015 fail; a darker surface than bg is a WARN ("recessed") | FAIL / WARN | Step L up ~0.04 per level. Shadows vanish on dark, so lightness is the elevation cue |
| D5 | Neutrals tinted, not saturated | bg chroma <= 0.045 | WARN | Cap neutral chroma; tint with the brand hue, 0.01-0.03 |
| D6 | Primary works as fill and as ink | on-primary/primary >= 4.5; primary vs bg and surface >= 3; primary L not in 0.58-0.68 | FAIL / WARN | Two valid designs: **light fill (L >= 0.70) + dark on-primary**, or **deep fill (L <= 0.58) + white on-primary**. The 0.58-0.68 band is the dead zone: too light for white text, too dark for dark text |
| D7 | Mode pair stays consistent (needs `--light`) | dark primary lighter than light primary, chroma not higher (cut 10-30%), hue within 10 degrees | WARN | Re-derive the dark accent from the light one: same hue, L +0.15-0.25, C x0.7-0.9 |
| D8 | Semantic colors on dark | success/warning/error/info >= 4.5:1 on bg and on the raised surface | FAIL | Light-mode status colors fail on dark; use L ~0.70-0.78 versions and keep icon + text |
| D9 | Borders | border-strong >= 3:1 on bg and surface (inputs, controls); decorative border dL >= 0.05 vs surface | FAIL / WARN | Faint `#2B2B2B`-style borders are decoration only; the input outline needs border-strong |
| D10 | APCA advisory | text |Lc| >= 75; muted |Lc| >= 45, aim 60 | WARN | APCA is not a standard (WCAG 3 has no algorithm yet), but it catches thin light-on-dark text that passes WCAG 2. Raise muted L or increase weight/size |
| D11 | Focus ring | >= 3:1 on bg and raised surface | FAIL | Use primary-300/400 for the ring on dark |

## N. Implementation rules (manual)

| ID | Rule | How |
|---|---|---|
| N1 | Never invert | Do not use `filter: invert()` or auto-flip lightness. Author a separate mapping per role. |
| N2 | Shadows do not elevate | Black shadows disappear on dark. Use lighter surfaces plus a 1px border (`dL >= 0.05`) or a faint top highlight, `box-shadow: inset 0 1px 0 rgb(255 255 255 / .05)`. |
| N3 | States move the right way | Light fills with dark labels lighten toward the text color; deep fills with white labels (GitHub-style blue) darken toward bg. `node scripts/palette.mjs states <palette> --css` picks the direction and percentage and checks the pair stays >= 4.5:1 (see proportions-and-states.md). Overlays: white at 4-8% alpha on surfaces. |
| N4 | No alpha for text | `opacity` or translucent text composites unpredictably over images and gradients. Use solid role colors for muted text; if alpha is unavoidable, audit the composited result. |
| N5 | Images | Dim bright photography slightly (`filter: brightness(.9)`), never invert photos. Provide light/mono logo variants (`<picture>` with `prefers-color-scheme`); dark logos on dark bg and transparent PNGs with dark text disappear. Icons use `currentColor`. |
| N6 | Type | Light mode's readability advantage grows as text gets smaller (NN/g review), so avoid small thin text: weight >= 400 below 18px, body >= 16px, and check muted text with D10. |
| N7 | Gradients | Interpolate `in oklab`/`in oklch`. Low-chroma dark gradients band at 8-bit: keep stops few or add subtle noise; never a full-viewport near-zero-chroma gradient. Check text contrast at the lightest point of the gradient. |
| N8 | Tell the browser | `color-scheme: light dark` on `:root` (native scrollbars, form controls, caret) and `<meta name="color-scheme" content="light dark">`. Per-scheme `<meta name="theme-color" media="(prefers-color-scheme: dark)" content="BG">`. |
| N9 | No flash, user override | Follow the OS by default; toggle is tri-state (system / light / dark) and persists. An inline `<head>` script sets `data-theme` before first paint. Wrap storage access in try/catch. |
| N10 | Data viz | Re-check chart colors on the dark surface. The Okabe-Ito set on `#121212`: blue `#0072B2` 3.6:1 (graphics only, never text), orange 8.3, bluish green 5.5, reddish purple 6.1, sky blue 8.1, vermilion 4.8, yellow 14.2. Lighten the blue for text or labels; keep direct labels. |
| N11 | Code and syntax | Syntax colors need L >= 0.70 on the code background and must pass 4.5:1; re-run `cvd` on the set. |
| N12 | Test it | DevTools Rendering: emulate `prefers-color-scheme: dark`, vision deficiencies, and `forced-colors`. View at low brightness and in grayscale (does the CTA still read?). Check every state: hover, active, focus-visible, disabled, selected, visited. |

## Reference points

Real systems pass most of D1-D11 and show the typical WARNs: GitHub Primer dark has muted text at |Lc| 44 (D10 WARN); VS Code Dark Modern uses recessed sidebars (D4 WARN) and a dimmer `#CCCCCC` text (D2 WARN, 10.3:1). Treat WARNs as questions to answer, not as defects to hide.

Palettes with dark mode and their verified rule tables are in `palettes.md`.
