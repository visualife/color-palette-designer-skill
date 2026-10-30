# Evidence, conventions and trends

Read before writing any rationale, copy or client-facing explanation about color. Separate what is research-backed from what is convention.

## 1. Evidence grades

| Claim | Grade | Notes |
|---|---|---|
| Brand color shapes perceived personality; color-personality fit predicts preference | Moderate (experimental) | Labrecque and Milne, "Exciting red and competent blue", J. Acad. Marketing Sci. 40(5):711-727, four studies: red exciting, blue competent, white/yellow sincere, black/purple/pink sophisticated, brown rugged. Saturation and value matter too. |
| "62-90% of a product judgment is based on color" | Weak / misquoted | Comes from Singh (2006, Management Decision 44(6):783-789), a literature review, not an experiment. |
| "85% of shoppers buy because of color" | Folklore | No traceable study. |
| A specific hue gives a specific emotion, universally | Weak | Context- and culture-dependent (red is danger in the West, prosperity in China); Elliot and Maier (2014, Annual Review of Psychology) call for replication. |
| Red vs green CTA "winner" | Confounded | Performable test via HubSpot (2,000+ visits): red beat green by 21%, but green was already in the site's color scheme, so red probably just contrasted. CXL: button color alone has little to no effect. |
| Isolation (Von Restorff) effect | Strong (cognitive psychology) | The real mechanism behind CTA "color wins": the element that differs from its surroundings gets noticed. |
| Light mode better for reading with normal vision | Moderate-strong | See dark-mode-and-tokens.md. |

Do not cite an "89-store red vs green replication"; it could not be traced to a primary dataset.

Harmony models and 60-30-10 are aesthetic conventions with no usability validation. Use them to generate candidates, not to justify or validate a palette.

## 2. Industry conventions (conventions, not laws)

| Industry | Convention | Why it persists |
|---|---|---|
| Wellness / natural / organic | sage, moss, olive, clay, oat, sand; warm off-white; chroma 0.03-0.10 | nature association, category norm; avoid neon |
| E-commerce | neutral canvas, one high-contrast CTA, clear sale/semantic colors | product photos need neutral surroundings; isolation |
| SaaS / dev tools | near-monochrome cool grays, one blue/indigo/violet accent, first-class dark mode | category convention (Linear, Vercel, GitHub) |
| Agency / portfolio | stark mono plus one electric accent, or rich dark plus warm accent | differentiation; the work supplies the color, so keep UI neutral |
| Finance | navy/deep blue, white, green gain / red loss | blue reads as competence; always add +/- and arrows |
| Health / medical | clean whites, teal/blue, calm green | clinical association; older audiences, so target AAA body text |

## 3. Trends 2025-2026 (observational, from design-system docs and sites)

1. Perceptual color infrastructure: OKLCH is default in Tailwind v4, Vercel's CSS, DTCG 2025.10 and Linear's LCH generator. The most durable trend.
2. Restraint: Linear's redesign limited how much chroma entered its theme calculations for a neutral, timeless look, then softened borders for calm.
3. Tinted neutrals: warm off-whites (Apple `#f5f5f7`, Notion text `#37352F`), cool slate (GitHub, Tailwind), near-black brand fill (Shopify Polaris `#303030` on `#F1F1F1`).
4. Vibrant accents on near-black (`#0a0a0a`-`#0d1117` base, one accent at L 0.70-0.80).
5. Mesh gradients in hero areas only (Vercel: cyan-blue-pink-amber mesh over a strict gray system); interpolate in oklab/oklch and dither against banding.
6. Earthy/natural palettes for wellness, food, sustainability (low chroma, hue 40-130).
7. Brutalist/editorial: off-white paper, near-black text, one electric accent, hard 2px borders doing the 3:1 work.
8. Pitfall: low-contrast gray-on-gray "minimal" text routinely fails 4.5:1. It is a defect, not a style.

## 4. Extracted brand palettes (with source quality)

| Brand | Values | Source quality |
|---|---|---|
| Stripe | blurple `#635BFF`, navy text `#0A2540`, light bg `#F6F9FC` | third-party (Brandfetch, Mobbin); Stripe's system is private |
| Vercel Geist light | primary `#171717`, secondary `#4d4d4d`, tertiary `#006bff`, bg-100 `#ffffff`, bg-200 `#fafafa`, gray-100 `#f2f2f2` | official (vercel.com design.md) |
| GitHub Primer light | fg `#1F2328`, muted `#656d76`, canvas `#fff`, subtle `#f6f8fa`, border `#d0d7de`, accent `#0969da`, success `#1a7f37`, attention `#9a6700`, danger `#d1242f` | official, MIT |
| Notion | light text `#37352F`, bg `#FFFFFF` | third-party; light text may be dated |
| Apple.com | text `#1d1d1f`, bg `#fff` / alt `#f5f5f7`, link `#0066cc` (`#2997ff` dark), button `#0071e3`, secondary `#6e6e73` | third-party extraction, consistent across sources |
| Shopify Polaris (tokens 9.4.2) | bg `#F1F1F1`, surface `#FFFFFF`, text `#303030`, secondary `#616161`, link `#005BD3`, critical `#C70A24`, success `#047B5D`, warning `#FFB800`, border `#E3E3E3` | third-party conversion of `@shopify/polaris-tokens` |

Treat third-party extractions as inspiration, re-verify before using as ground truth, and do not copy a brand's identity for a different client.
