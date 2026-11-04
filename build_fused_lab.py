"""Fuse the Color Palette Lab and the Font Pairing Lab into one page with one shared preview.
Usage: python fuse.py <color_backup.html> <font_lab.html> <out.html>"""
import re, sys

cpath, fpath, opath = sys.argv[1:4]
C = open(cpath, encoding='utf-8').read()
F = open(fpath, encoding='utf-8').read()


def rep(s, a, b, n=1):
    c = s.count(a)
    assert c == n, (a[:80], c)
    return s.replace(a, b)


def between(s, a, b, inclusive=True):
    i = s.index(a); j = s.index(b, i) + (len(b) if inclusive else 0)
    return s[i:j]

# ---------------------------------------------------------------- head / SERP
TITLE = 'Color &amp; Type Lab: palettes and font pairings | Ailive.fr'
DESC = ('Build a contrast-solved OKLCH palette and a scored font pairing, then see both in one live UI preview. '
        'WCAG 2.2 + APCA audit, 133 pairings, copy-ready CSS.')
OGT = 'Color &amp; Type Lab: one live preview for your palette and fonts'
OGD = ('OKLCH palettes with a WCAG 2.2 + APCA audit and 133 scored font pairings, styled together on one live UI preview. '
       'Copy the CSS or hand the full spec to your AI.')
OGI = 'https://www.ailive.fr/color-palette-designer-skill/color-type-lab.jpg'
OGA = 'Color &amp; Type Lab by Ailive.fr: a live UI preview styled by a palette and a font pairing, next to the font library'
C = re.sub(r'<title>.*?</title>', f'<title>{TITLE}</title>', C, 1)
C = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{DESC}">', C, 1)
C = re.sub(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{OGT}">', C, 1)
C = re.sub(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{OGD}">', C, 1)
C = re.sub(r'<meta property="og:image" content="[^"]*">', f'<meta property="og:image" content="{OGI}">', C, 1)
C = re.sub(r'<meta property="og:image:alt" content="[^"]*">', f'<meta property="og:image:alt" content="{OGA}">', C, 1)
C = re.sub(r'<meta name="twitter:title" content="[^"]*">', f'<meta name="twitter:title" content="{OGT}">', C, 1)
C = re.sub(r'<meta name="twitter:description" content="[^"]*">', f'<meta name="twitter:description" content="{OGD}">', C, 1)
C = re.sub(r'<meta name="twitter:image" content="[^"]*">', f'<meta name="twitter:image" content="{OGI}">', C, 1)
C = rep(C, '<meta name="twitter:image"', f'<meta name="twitter:image:alt" content="{OGA}">\n<meta name="twitter:image"')

# ---------------------------------------------------------------- CSS
C = rep(C, '--sh-bg:#1a1a1a; --sh-panel:#262626; --sh-panel-2:#202020; --sh-border:#3d3d3d; --sh-border-soft:#2e2e2e;',
           '--sh-bg:#161616; --sh-panel:#222222; --sh-panel-2:#1b1b1b; --sh-border:#383838; --sh-border-soft:#2b2b2b;')
C = rep(C, '--sh-text:#b8b8b8; --sh-strong:#e6e6e6; --sh-mute:#9a9a9a; --sh-accent:#9aaabf; --sh-pressed:#3e444c;',
           '--sh-text:#b4b4b4; --sh-strong:#e6e6e6; --sh-mute:#8e8e8e; --sh-accent:#8fa6c4; --sh-pressed:#343a42;')

# the sample UI takes the body font from the type engine
ui_at = C.index('/* ============ Sample UI')
end_style = C.index('</style>')
C = C[:ui_at] + C[ui_at:end_style].replace('var(--sans)', 'var(--fb,var(--sans))') + C[end_style:]

font_css = '\n'.join(l for l in F[F.index('<style>'):F.index('</style>')].split('\n')
                     if re.match(r'^(\.lib|\.pick|\.score|\.grade|\.g-A|\.ic|details\.verdict|\.why|\.status)', l))

NEW_CSS = font_css + r'''
/* ============ fused shell: Color | Type ============ */
html{color-scheme:dark;scrollbar-color:#2c2c2c var(--sh-bg)}
aside,.lib,pre,.scroll,.hier-wrap,.typebar{scrollbar-width:thin;scrollbar-color:#2e2e2e transparent}
.app{grid-template-columns:var(--side,380px) 7px minmax(0,1fr)}
aside{border-right:0}
.grip{position:sticky;top:0;height:100vh;cursor:col-resize;border-left:1px solid var(--sh-border-soft);background:transparent;touch-action:none;transition:background .12s}
.grip:hover,.grip.drag,.grip:focus-visible{background:var(--sh-pressed);outline:none}
.app.collapsed{grid-template-columns:minmax(0,1fr)}
.app.collapsed>aside,.app.collapsed>.grip{display:none}
.app.collapsed>main{padding-left:66px}
.side-open{position:fixed;left:0;top:0;bottom:0;width:44px;z-index:40;background:var(--sh-panel-2);border:0;border-right:1px solid var(--sh-border-soft);color:var(--sh-mute);cursor:pointer;writing-mode:vertical-rl;font-size:12px;letter-spacing:.04em;display:flex;align-items:center;justify-content:center;gap:8px;padding:0}
.side-open:hover{color:var(--sh-strong);background:var(--sh-panel)}
.side-open[hidden]{display:none}
.side-head{display:flex;justify-content:space-between;align-items:center;gap:8px}
.icon-btn{background:transparent;border:1px solid var(--sh-border);border-radius:6px;color:var(--sh-mute);width:30px;height:28px;display:grid;place-items:center;cursor:pointer;padding:0;flex:none}
.icon-btn:hover{color:var(--sh-strong);border-color:var(--sh-accent)}
.modesw{display:grid;grid-template-columns:1fr 1fr;margin:16px 0 6px;border:1px solid var(--sh-border);border-radius:8px;overflow:hidden}
.modesw button{background:var(--sh-bg);border:0;padding:9px 8px;cursor:pointer;font-size:13px;font-weight:600;color:var(--sh-mute)}
.modesw button+button{border-left:1px solid var(--sh-border)}
.modesw button:hover{color:var(--sh-strong)}
.modesw button[aria-pressed=true]{background:var(--sh-pressed);color:#fff}
body[data-mode=color] .only-type,body[data-mode=type] .only-color{display:none!important}
input[type=search],input[type=text]{width:100%;background:var(--sh-panel);border:1px solid var(--sh-border);border-radius:6px;padding:7px 8px}
input[type=range].lr{--track:#4a4a4a}
.copyside{width:100%;margin-top:18px;padding:9px 10px;background:var(--sh-pressed);border-color:var(--sh-accent);color:#fff;font-size:13px;font-weight:600}
.side-foot{margin-top:24px;padding-top:12px;border-top:1px solid var(--sh-border-soft)}
@media (max-width:920px){
  .app{grid-template-columns:minmax(0,1fr)}
  .app>.grip{display:none}
  aside{position:static;height:auto;max-height:none}
  main{padding:16px 14px 48px}
  .app.collapsed>main{padding-left:58px}
}

/* type toolbar (pairing pickers + collapsed verdict) */
.typebar{container-type:inline-size;padding:12px 14px}
.typebar>header{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px;flex-wrap:wrap}
.typebar>header .acts{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
@container (max-width:900px){.pick{grid-template-columns:repeat(2,minmax(0,1fr))}}
@container (max-width:480px){.pick{grid-template-columns:minmax(0,1fr)}}

/* technical cards: closed by default, the preview stays in sight */
.tech{display:flex;flex-direction:column;gap:8px}
details.tech-card{padding:0 16px}
details.tech-card>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:8px 12px;flex-wrap:wrap;margin:0 -16px;padding:12px 16px;border-radius:10px;user-select:none}
details.tech-card>summary::-webkit-details-marker{display:none}
details.tech-card>summary::before{content:"\25B8";color:var(--sh-accent);transition:transform .12s;flex:none}
details.tech-card[open]>summary::before{transform:rotate(90deg)}
details.tech-card>summary:hover{background:#262626}
details.tech-card>summary h2{font-size:14px;margin-right:auto}
details.tech-card>summary h2 .note{font-weight:400}
details.tech-card[open]{padding-bottom:16px}
details.tech-card[open]>summary{margin-bottom:12px;border-bottom:1px solid var(--sh-border-soft);border-radius:10px 10px 0 0}
.frame-bar .pvn{color:var(--sh-text)}

/* ============ shared preview: layout + type binding ============ */
.pv{container-type:inline-size;font-weight:var(--bw,400);font-size:var(--s0,15px);line-height:var(--lhb,1.55)}
.pv .brand{font-family:var(--fh,var(--sans));font-weight:var(--hw,700);letter-spacing:var(--hls,-.01em);font-size:18px}
.pv .hero{padding:clamp(36px,6cqi,72px) clamp(22px,4cqi,48px) clamp(30px,5cqi,56px)}
.pv .hero-in{max-width:min(100%,820px)}
.pv h1{font-family:var(--fh,var(--sans));font-weight:var(--hw,700);letter-spacing:var(--hls,-.02em);line-height:var(--lh1,1.08);font-size:clamp(30px,min(var(--s5,40px),7.4cqi),104px);margin:0 0 .35em;max-width:16ch}
.pv .lead{font-size:clamp(15px,var(--s1,17px),22px);max-width:var(--ms,60ch)}
.pv .sec{padding:clamp(22px,3cqi,34px) clamp(22px,4cqi,48px)}
.pv .sec h2{font-family:var(--fh,var(--sans));font-weight:var(--hw,700);letter-spacing:var(--hls,0);text-transform:none;font-size:clamp(17px,var(--s1,18px),24px);line-height:1.2;color:var(--text);margin:0 0 14px}
.pv .sec .lead{font-size:15px}
.pv .cardu h3{font-family:var(--fh,var(--sans));font-weight:var(--hw,600);letter-spacing:var(--hls,0);font-size:clamp(16px,var(--s1,17px),21px)}
.pv .nav,.pv .foot{padding-left:clamp(22px,4cqi,48px);padding-right:clamp(22px,4cqi,48px)}
.pv .row2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);border-top:1px solid var(--border)}
.pv .row2>.sec{border-top:0}
.pv .row2>.sec+.sec{border-left:1px solid var(--border)}
@container (max-width:780px){.pv .row2{grid-template-columns:minmax(0,1fr)}.pv .row2>.sec+.sec{border-left:0;border-top:1px solid var(--border)}}
/* no stretched buttons */
.pv .grid-states{grid-template-columns:repeat(auto-fill,minmax(118px,1fr));max-width:none}
.pv .grid-states .b{width:auto;min-width:104px;justify-content:center}
.pv .hier{grid-template-columns:72px repeat(4,minmax(108px,160px));min-width:0;width:max-content;max-width:100%}
.pv .opts{max-width:380px}
.pv .bars{max-width:none}
/* type specimen */
.pv .spec .ey{font-size:12px;letter-spacing:var(--cap,.12em);text-transform:uppercase;color:var(--link);font-weight:600}
.pv .spec h3{font-family:var(--fh,var(--sans));font-weight:var(--hw,600);letter-spacing:var(--hls,0);font-size:clamp(22px,min(var(--s3,30px),4.6cqi),46px);line-height:var(--lh3,1.15);margin:8px 0 14px;color:var(--text);text-transform:none}
.pv .spec h3 em{font-family:var(--fa,var(--fh));font-weight:var(--aw,inherit);font-style:italic;color:var(--link)}
.pv .spec p{margin:0 0 12px;max-width:var(--ms,62ch)}
.pv .spec blockquote{margin:16px 0;padding-left:14px;border-left:2px solid var(--primary);font-family:var(--fh,var(--sans));font-weight:var(--hw,600);letter-spacing:var(--hls,0);font-size:clamp(17px,var(--s1,19px),24px);line-height:1.3;color:var(--text)}
.pv .spec table{font-variant-numeric:tabular-nums lining-nums;font-size:14px;max-width:420px;margin-top:6px}
.pv .spec th{color:var(--text-muted);border-bottom:1px solid var(--border-strong);letter-spacing:var(--cap,.08em);font-family:var(--fb,var(--sans));padding:6px 10px 6px 0}
.pv .spec td{border-bottom:1px solid var(--border);color:var(--text);padding:7px 10px 7px 0}
.pv .spec .n{text-align:right}
@container (max-width:640px){.pv .blob{width:180px;height:140px;opacity:.3;inset:auto -60px -60px auto}}
.pv .scalebox{margin-top:26px;padding-top:18px;border-top:1px solid var(--border)}
.pv .scalebox h2{font-family:var(--fb,var(--sans))!important;font-size:12px!important;color:var(--text-muted)!important;font-weight:600!important}
.pv .sc{margin:0 0 10px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pv .sc small{font:12px var(--mono);color:var(--text-muted);letter-spacing:0;margin-left:8px}
'''
C = rep(C, '</style>', NEW_CSS + '</style>')

# ---------------------------------------------------------------- aside
c_aside = between(C, '<aside>', '</aside>')
c_controls = c_aside[c_aside.index('</p>', c_aside.index('<p class="credit">')) + 4: c_aside.rindex('</aside>')]

f_aside = between(F, '<aside>', '</aside>')
t_controls = f_aside[f_aside.index('  <div class="field"><span class="lbl">Register'): f_aside.index('  <p class="credit">')]
t_controls = re.sub(r'\s*<div class="field"><span class="lbl">Preview background</span><div class="seg" id="bg"></div></div>', '', t_controls)
assert 'id="bg"' not in t_controls
t_controls = t_controls.replace('<input type="range" id=', '<input type="range" class="lr" id=')

CHEV_L = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M8.5 3 4.5 7l4 4M12 3 8 7l4 4"/></svg>'
CHEV_R = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M5.5 3l4 4-4 4M2 3l4 4-4 4"/></svg>'
new_aside = f'''<aside id="side" aria-label="Lab controls">
  <div class="side-head"><h1>Color &amp; Type Lab</h1><button class="icon-btn" id="side-close" type="button" aria-label="Hide controls" title="Hide controls">{CHEV_L}</button></div>
  <p class="note" style="margin:4px 0 0">One live preview for your palette and your font pairing. Switch panels to tune each.</p>
  <div class="modesw" role="group" aria-label="Lab panel"><button type="button" data-mode="color" aria-pressed="true">Color</button><button type="button" data-mode="type" aria-pressed="false">Typography</button></div>
  <div class="only-color">{c_controls}
  <button class="btn copyside" id="copy-color" type="button" title="Copy every color setting as a prompt for your AI">Copy all color settings</button></div>
  <div class="only-type">
{t_controls}  <button class="btn copyside" id="copy-type" type="button" title="Copy every typography setting as a prompt for your AI">Copy all typography settings</button></div>
  <p class="credit side-foot">Engines <code>scripts/palette.mjs</code> and <code>scripts/lib.mjs</code>, run in your browser. Created by <a href="https://www.ailive.fr" target="_blank" rel="noopener">Ailive.fr</a></p>
</aside>
<div class="grip" role="separator" aria-orientation="vertical" aria-label="Resize controls" aria-valuemin="280" aria-valuemax="620" tabindex="0" title="Drag to resize, double-click to reset"></div>
<button class="side-open" id="side-open" type="button" hidden aria-label="Show controls">{CHEV_R}<span>Controls</span></button>'''
C = C.replace(c_aside, new_aside, 1)

# ---------------------------------------------------------------- main
C = rep(C, '<div class="toolbar">', '<div class="toolbar only-color">')

f_pair = between(F, '  <section class="card" aria-labelledby="t-sel">', '</section>')
f_pair = f_pair.replace('<section class="card" aria-labelledby="t-sel">', '<section class="card typebar only-type" aria-labelledby="t-sel">', 1)
f_pair = rep(f_pair, '<span class="status" id="status"></span>',
             '<div class="acts"><span class="status" id="status"></span><button class="btn" id="copy-all-t" type="button" title="Palette and fonts as one prompt for your AI">Copy all</button></div>')
C = rep(C, '  <section class="frame">', f_pair + '\n\n  <section class="frame">')

C = rep(C, '<div class="frame-bar"><span id="fb-name"></span><span id="fb-note"></span></div>',
        '<div class="frame-bar"><span id="fb-name"></span><span class="pvn" id="pvnote"></span><span id="fb-note"></span></div>')

# preview: rebuild the sections into a 2-column flow
pv_start = C.index('<div class="pv" id="pv">'); pv_end = C.index('    </div></div>\n  </section>', pv_start)
pv = C[pv_start:pv_end]
parts = pv.split('\n      <div class="sec">')
assert len(parts) == 8, len(parts)
hero, cards, hier, states, inter, form, feed, chart = parts
chart, foot = chart.split('\n      <div class="foot">')
S = lambda body, cls='sec': f'\n      <div class="{cls}">' + body
states = rep(states, '<h2>Color in UI states (hover, press and tab to the real ones)</h2>', '<h2>UI states</h2>')
states = rep(states, 'what happens when someone touches or uses something.', 'what happens when someone touches or uses something. Hover, press and tab to the real ones.')
inter = rep(inter, '<h2>Interactive components (selected states use the solved tint)</h2>', '<h2>Interactive components</h2>')
form = rep(form, '<h2>Form with live validation (icon + text, not color alone)</h2>', '<h2>Form validation</h2>')
feed = rep(feed, '<span>Color in feedback states (dismissible)</span>', '<span>Feedback states</span>')
chart = rep(chart, '<h2>Chart with Okabe-Ito categorical set (direct labels)</h2>', '<h2>Chart colors</h2>')
HF = 'font-family:var(--fh);font-weight:var(--hw);letter-spacing:var(--hls)'
cut = chart.rindex('</div>'); chart = chart[:cut] + ('<div class="scalebox"><h2>Type scale</h2>'
  f'<div class="sc" style="font-size:clamp(28px,var(--s4,32px),52px);{HF};line-height:1.1">Display <small>s4</small></div>'
  f'<div class="sc" style="font-size:clamp(22px,var(--s3,26px),40px);{HF};line-height:1.15">Heading <small>s3</small></div>'
  f'<div class="sc" style="font-size:clamp(18px,var(--s2,20px),30px);{HF}">Subheading <small>s2</small></div>'
  '<div class="sc" style="font-size:var(--s1,17px)">Lead paragraph in the body face <small>s1</small></div>'
  '<div class="sc" style="font-size:var(--s0,16px)">Body text at its working size <small>s0</small></div>'
  '<div class="sc" style="font-size:var(--sn1,13px);color:var(--text-muted)">Caption and small print <small>s-1</small></div></div>') + chart[cut:]
spec = '<h2>Typography</h2><div id="tspec"></div></div>'
row = lambda a, b: '\n      <div class="row2">' + a.replace('\n      ', '\n        ') + b.replace('\n      ', '\n        ') + '</div>'
new_pv = (hero + S(cards)
          + row(S(spec, 'sec spec'), S(chart))
          + S(hier)
          + row(S(states), S(inter))
          + row(S(form), S(feed))
          + '\n      <div class="foot">' + foot)
C = C[:pv_start] + new_pv + C[pv_end:]

# technical cards -> closed <details>
t0 = C.index('  <section class="card"><header><h2>Roles'); t1 = C.index('  <footer class="site-credit">')
tech = C[t0:t1]
assert tech.count('<header>') == 8 and tech.count('</header>') == 8
tech = (tech.replace('<section class="card"', '<details class="card tech-card"').replace('</section>', '</details>')
            .replace('<header>', '<summary>').replace('</header>', '</summary>')
            .replace('<details class="card fold" id="css-card">', '<details class="card tech-card" id="css-card">'))
assert '<section' not in tech

f_tech = F[F.index('  <section class="card" aria-labelledby="t-sc">'):F.index('</main>')]
f_tech = (f_tech.replace('<section class="card"', '<details class="card tech-card"').replace('</section>', '</details>')
               .replace('<header>', '<summary>').replace('</header>', '</summary>')
               .replace('<details class="card">\n    <summary>CSS output</summary>', '<details class="card tech-card">\n    <summary><h2>CSS output</h2><span class="note">Google link, self-host, tokens, Tailwind v4</span></summary>')
               .replace('<details class="card">\n    <summary>Rules</summary>', '<details class="card tech-card">\n    <summary><h2>Type rules</h2></summary>')
               .replace('id="copy"', 'id="tcopy"'))
assert 'id="tcopy"' in f_tech and '<h2>Type rules</h2>' in f_tech
C = C[:t0] + '  <div class="tech only-color">\n' + tech + '  </div>\n  <div class="tech only-type">\n' + f_tech + '  </div>\n' + C[t1:]

# ---------------------------------------------------------------- color JS hooks
C = rep(C, "    history.replaceState(null,'','#'+p.toString());",
        "    const t0=new URLSearchParams(location.hash.slice(1)).get('t'); if(t0) p.set('t',t0);\n    history.replaceState(null,'','#'+p.toString());")
C = rep(C, 'I designed a UI color palette in the Color Palette Lab (Ailive.fr).',
        'I designed a UI color palette${window.__noType?"":" and a font pairing"} in the Color & Type Lab (Ailive.fr).')
C = rep(C, '\n## Link to this exact state\n${location.href}',
        "\n${window.__typeSpec && !window.__noType ? window.__typeSpec() + '\\n' : ''}## Link to this exact state\n${location.href}")

# ---------------------------------------------------------------- font JS (scoped)
scripts = re.findall(r'<script>\n?(.*?)</script>', F[F.index('</main>'):], re.S)
assert len(scripts) == 2
J = scripts[0] + '\n' + scripts[1]
J = rep(J, "seg('bg', BGS, 'bg');\n", '')
J = rep(J, "if (!hashLoad()) { S.cur = 'L1'; const p = pairingsAll().find((x) => x.id === 'L1');", "if (!hashLoad()) { S.cur = 'P18'; S.ratio = 1.25; S.ls = -0.02; S.cap = 0.12; S.lh = 1.6; const p = pairingsAll().find((x) => x.id === 'P18');")
J = rep(J, ", ['bg', 'bg']]) [", "]) [")
J = rep(J, "const pv = $('pv'); pv.className = S.bg;", "const pv = $('pv');")
a = J.index('  pv.innerHTML = `'); b = J.index('<footer>${T.foot}</footer>`;', a) + len('<footer>${T.foot}</footer>`;')
J = J[:a] + ("  $('tspec').innerHTML = `<div class=\"ey\">${T.eyebrow}</div><h3>${T.h2}</h3><p>${T.p[0]}</p><blockquote>${T.q}</blockquote>"
             "<table><thead><tr><th>${T.thead[0]}</th><th class=\"n\">${T.thead[1]}</th><th class=\"n\">${T.thead[2]}</th></tr></thead>"
             "<tbody>${T.rows.map((r) => `<tr><td>${r[0]}</td><td class=\"n\">${r[1]}</td><td class=\"n\">${r[2]}</td></tr>`).join('')}</tbody></table>`;") + J[b:]
J = J.replace("$('copy')", "$('tcopy')")
J = rep(J, 'function render() {', "function outs() { const o = { base: S.base + 'px', lh: (+S.lh).toFixed(2), ls: (+S.ls).toFixed(3) + 'em', ms: S.ms + 'ch', cap: (+S.cap).toFixed(2) + 'em' }; for (const k in o) { const e = $('o-' + k); if (e) e.textContent = o[k]; } } function render() { outs();")
J = rep(J, "$('scoreTxt').textContent = `${r.score} / 100 · ${r.heading} + ${r.body}`;",
        "$('scoreTxt').textContent = `${r.score} / 100 · ${r.heading} + ${r.body}`; typeScore = `${r.score}/100, grade ${r.grade}`;")
J = rep(J, "  $('out').textContent = map[S.tab];", "  $('out').textContent = map[S.tab]; typeAll = map.all;")
# hash: keep the type state inside one `t` key so the palette keys survive
hs = J.index('function hashSave() {'); he = J.index('function hashLoad() {')
J = J[:hs] + '''function hashSave() {
  const p = new URLSearchParams({ h: S.h.join(':'), b: S.b.join(':'), lang: S.lang, base: S.base, ratio: S.ratio, lh: S.lh, ls: S.ls, ms: S.ms, cap: S.cap });
  if (S.m) p.set('m', S.m); if (S.a) p.set('a', S.a); if (S.cur) p.set('p', S.cur);
  try { const all = new URLSearchParams(location.hash.slice(1)); all.set('t', p.toString()); history.replaceState(null, '', '#' + all.toString()); } catch (e) {}
}
''' + J[he:]
J = rep(J, "  const p = new URLSearchParams(location.hash.slice(1)); if (![...p.keys()].length) return false;",
        "  const p = new URLSearchParams(new URLSearchParams(location.hash.slice(1)).get('t') || ''); if (![...p.keys()].length) return false;")
J = rep(J, "$('share').onclick", "$('copy-all-t').onclick = () => $('copy-all').click();\n$('share').onclick")
type_js = ('(function () {\nlet typeScore = \'\', typeAll = \'\';\n' + J +
           '''
$('copy-type').onclick = async () => {
  const text = `I chose a font pairing in the Color & Type Lab (Ailive.fr). Use the settings below to write clear, step-by-step instructions for implementing this typography in my project: font loading (Google link or self-host), CSS custom properties, type scale, fallbacks and usage rules.

${window.__typeSpec()}
## Link to this exact state
${location.href}
`;
  let ok = true; try { await navigator.clipboard.writeText(text); } catch (e) { ok = false; }
  const b = $('copy-type'), t0 = 'Copy all typography settings'; b.textContent = ok ? 'Copied: paste it into your AI' : 'Copy failed'; setTimeout(() => (b.textContent = t0), 1600);
};
window.__typeSpec = () => `## Typography
Heading: ${S.h[0]} ${S.h[1]}
Body: ${S.b[0]} ${S.b[1]}${S.m ? '\\nMono: ' + S.m : ''}${S.a ? '\\nAccent: ' + S.a : ''}
Pairing: ${S.cur || 'custom'} (check ${typeScore})
Scale: base ${S.base}px, ratio ${S.ratio}; body line-height ${S.lh}; heading tracking ${S.ls}em; measure ${S.ms}ch; caps tracking ${S.cap}em

${typeAll}
`;
})();''')
assert "$('bg')" not in type_js and 'S.bg;' not in type_js.replace('S.bg = p.get', '')

SHELL_JS = r'''(function () {
  const app = document.querySelector('.app'), grip = document.querySelector('.grip'), open = document.getElementById('side-open'), close = document.getElementById('side-close');
  const LS = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const btns = [...document.querySelectorAll('.modesw button')];
  function setMode(m) { document.body.dataset.mode = m; btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m))); LS.set('lab.mode', m); }
  btns.forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
  const qm = new URLSearchParams(location.search).get('lab');
  document.getElementById('copy-color').addEventListener('click', () => { window.__noType = true; try { document.getElementById('copy-all').click(); } finally { window.__noType = false; } });
  setMode(qm === 'type' || qm === 'color' ? qm : LS.get('lab.mode') === 'type' ? 'type' : 'color');
  const DEF = 380, clamp = (w) => Math.max(280, Math.min(620, Math.round(w)));
  let W = clamp(+LS.get('lab.w') || DEF);
  function setW(w) { W = clamp(w); app.style.setProperty('--side', W + 'px'); grip.setAttribute('aria-valuenow', W); LS.set('lab.w', W); }
  setW(W);
  grip.addEventListener('pointerdown', (e) => {
    e.preventDefault(); grip.setPointerCapture(e.pointerId); grip.classList.add('drag'); document.body.style.userSelect = 'none';
    const x0 = e.clientX, w0 = W, mv = (ev) => setW(w0 + ev.clientX - x0);
    const up = () => { grip.classList.remove('drag'); document.body.style.userSelect = ''; grip.removeEventListener('pointermove', mv); grip.removeEventListener('pointerup', up); grip.removeEventListener('pointercancel', up); };
    grip.addEventListener('pointermove', mv); grip.addEventListener('pointerup', up); grip.addEventListener('pointercancel', up);
  });
  grip.addEventListener('dblclick', () => setW(DEF));
  grip.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); setW(W + (e.key === 'ArrowRight' ? 20 : -20)); } });
  function setCollapsed(c, focus) { app.classList.toggle('collapsed', c); open.hidden = !c; if (focus) LS.set('lab.c', c ? '1' : '0'); if (focus) (c ? open : close).focus(); }
  close.addEventListener('click', () => setCollapsed(true, true));
  open.addEventListener('click', () => setCollapsed(false, true));
  const sc = LS.get('lab.c'); setCollapsed(sc === '1' || sc === '0' ? sc === '1' : innerWidth < 920, false);
})();'''

C = rep(C, '</body>', '<script>\n' + type_js + '\n</script>\n<script>\n' + SHELL_JS + '\n</script>\n</body>')
C = rep(C, '<body>', '<body data-mode="color">')

open(opath, 'w', encoding='utf-8').write(C)
print('wrote', opath, len(C))
