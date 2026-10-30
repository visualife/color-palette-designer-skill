#!/usr/bin/env node
// color-palette-designer CLI. Usage: node palette.mjs <command> [args]   (run with no args for help)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as C from './lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const PALETTES = join(here, '..', 'references', 'palettes.json');

const HELP = `color-palette-designer
  contrast <fg> <bg>                      WCAG ratio, grade, APCA Lc
  oklch <hex>                             exact OKLCH
  ramp <hue> <cMax>                       50-950 ramp (OKLCH L/C targets, gamut-mapped)
  solve <hex> <bg> [target=4.5] [darker|lighter]
                                          nudge L only until target ratio is met
  generate --hue H [--chroma .12] [--neutral-hue H] [--neutral-chroma .012]
           [--accent-offset 180] [--accent-chroma .12] [--aaa] [--modes light,dark]
           [--format report|json|css|css-light-dark|dtcg] [--states subtle|standard|strong]
  audit <file.json | palette-id> [--aaa] [--mode light|dark]
                                          validate every role pair (exit 1 on failure)
  presets                                 list area-split presets and state-mix presets
  ratio <neutral> <secondary> <accent> [--preset id] [--kind marketing|app|brand] [--primary-share 100] [--semantic 0]
                                          validate an area split (percent of visible area) against a preset
  states <palette-id | file.json> [--preset subtle|standard|strong] [--css]
                                          solved hover/active/disabled/tint mixes, contrast checks, CSS vars
  dark <palette-id | file.json> [--light <id | file.json>] [--oled]
                                          dark-mode rules D1-D11 (exit 1 on any FAIL; WARN needs a stated reason)
  cvd <hex> <hex> [...]                   pairwise dE_OK under protan/deutan/tritan
  docs                                    regenerate references/palettes.md from palettes.json
`;

const args = process.argv.slice(2);
const cmd = args.shift();
const flag = (name, def) => {
  const i = args.indexOf('--' + name);
  if (i < 0) return def;
  const v = args[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
};
const pos = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--') && !['aaa'].includes(args[i - 1].slice(2))));

const f2 = (n) => n.toFixed(2);
const verdict = (r) => (r.pass ? 'pass' : 'FAIL');
function auditTable(roles, opts = {}) {
  const rows = C.audit(roles, opts);
  const lines = ['| pair (fg on bg) | ratio | need | grade | APCA Lc | result |', '|---|---|---|---|---|---|'];
  for (const r of rows) lines.push(`| ${r.fg} ${r.fgHex} on ${r.bg} ${r.bgHex} | ${f2(r.ratio)} | ${r.need} | ${r.grade} | ${r.lc.toFixed(0)} | ${verdict(r)} |`);
  return { rows, text: lines.join('\n') };
}
const stateTable = (rows) => darkTable(rows);
const ICON = { pass: 'pass', warn: 'WARN', fail: 'FAIL' };
function darkTable(rows) {
  const lines = ['| rule | status | detail |', '|---|---|---|'];
  for (const r of rows) lines.push(`| ${r.id} ${r.rule} | ${ICON[r.status]} | ${r.detail} |`);
  return lines.join('\n');
}
function loadPalettes() {
  const j = JSON.parse(readFileSync(PALETTES, 'utf8'));
  return j.palettes.map((p) => ({ ...p, full: { ...j._meta.semantic[p.mode], ...p.roles } }));
}
function rolesFrom(input) {
  let j;
  if (/^#?[\w-]+$/.test(input) && !input.endsWith('.json')) {
    const p = loadPalettes().find((x) => x.id === input);
    if (!p) throw new Error(`unknown palette id: ${input}`);
    return { [p.mode]: p.full };
  }
  j = JSON.parse(readFileSync(input, 'utf8'));
  if (j.light || j.dark) return j;
  return { palette: j.roles ?? j };
}

switch (cmd) {
  case 'contrast': {
    const [fg, bg] = pos;
    const r = C.contrast(fg, bg);
    console.log(`${f2(r)}:1  text=${C.grade(r, 'text')}  large=${C.grade(r, 'large')}  ui=${C.grade(r, 'ui')}  APCA Lc ${C.apca(fg, bg).toFixed(1)}`);
    break;
  }
  case 'oklch':
    console.log(C.oklchOf(pos[0]));
    break;
  case 'ramp': {
    const r = C.ramp(+pos[0], +pos[1]);
    for (const [k, v] of Object.entries(r)) console.log(`${k}\t${v}\t${C.oklchOf(v)}`);
    break;
  }
  case 'solve': {
    const [hex, bg, target = '4.5', dir = 'darker'] = pos;
    const o = C.hexToOklch(hex);
    const out = C.solveL(o, bg, +target, dir);
    console.log(out ? `${out}  ${C.oklchOf(out)}  ratio ${f2(C.contrast(out, bg))}` : 'no solution in range');
    break;
  }
  case 'generate': {
    const hue = +flag('hue');
    if (Number.isNaN(hue)) throw new Error('--hue required');
    const offset = flag('accent-offset', null);
    const pal = C.generate({
      hue,
      chroma: +flag('chroma', 0.12),
      neutralHue: flag('neutral-hue', null) === null ? hue : +flag('neutral-hue'),
      neutralChroma: +flag('neutral-chroma', 0.012),
      accentOffset: offset === null ? null : +offset,
      accentChroma: +flag('accent-chroma', flag('chroma', 0.12)),
      aaa: !!flag('aaa', false),
      modes: String(flag('modes', 'light,dark')).split(','),
    });
    const fmt = flag('format', 'report');
    if (fmt === 'json') console.log(JSON.stringify(pal, null, 2));
    else if (fmt === 'css') console.log(C.toCss(pal, { states: flag('states', null) === true ? 'standard' : flag('states', null) }));
    else if (fmt === 'css-light-dark') console.log(C.toCss(pal, { style: 'light-dark', states: flag('states', null) === true ? 'standard' : flag('states', null) }));
    else if (fmt === 'dtcg') console.log(JSON.stringify({ light: C.toDtcg(pal.light ?? {}), dark: C.toDtcg(pal.dark ?? {}) }, null, 2));
    else {
      let bad = 0;
      for (const [mode, roles] of Object.entries(pal)) {
        const { rows, text } = auditTable(roles, { aaa: !!flag('aaa', false) });
        bad += rows.filter((r) => !r.pass).length;
        console.log(`## ${mode}\n\n| role | hex | OKLCH |\n|---|---|---|`);
        for (const [k, v] of Object.entries(roles)) console.log(`| ${k} | ${v} | ${C.oklchOf(v)} |`);
        console.log(`\n${text}\n`);
        if (mode === 'dark') {
          const dr = C.darkCheck(roles, pal.light ?? null);
          bad += dr.filter((r) => r.status === 'fail').length;
          console.log(`Dark-mode rules:\n\n${darkTable(dr)}\n`);
        }
        {
          const sr = C.stateReport(roles, flag('state-preset', 'standard'));
          bad += sr.rows.filter((r) => r.status === 'fail').length;
          console.log(`State mixes (${flag('state-preset', 'standard')}; hover/active percentages solved for a visible step):\n\n${stateTable(sr.rows)}\n`);
        }
        const cv = C.cvdReport(roles);
        if (cv.length) {
          console.log('CVD (dE_OK, <0.10 = pair collapses; add icon/label):');
          for (const r of cv) console.log(`  ${r.a} vs ${r.b}: protan ${f2(r.protan)} deutan ${f2(r.deutan)} tritan ${f2(r.tritan)}${r.collapsed ? '  COLLAPSES' : ''}`);
          console.log();
        }
      }
      console.log(bad ? `${bad} failing pair(s)` : 'all pairs pass');
      process.exitCode = bad ? 1 : 0;
    }
    break;
  }
  case 'audit': {
    const src = rolesFrom(pos[0]);
    const only = flag('mode', null);
    let bad = 0;
    for (const [mode, roles] of Object.entries(src)) {
      if (only && mode !== only) continue;
      const { rows, text } = auditTable(roles, { aaa: !!flag('aaa', false) });
      bad += rows.filter((r) => !r.pass).length;
      console.log(`## ${mode}\n\n${text}\n`);
      if (mode === 'dark') {
        const dr = C.darkCheck(roles, src.light ?? null);
        bad += dr.filter((r) => r.status === 'fail').length;
        console.log(`Dark-mode rules:\n\n${darkTable(dr)}\n`);
      }
    }
    console.log(bad ? `${bad} failing pair(s)` : 'all pairs pass');
    process.exitCode = bad ? 1 : 0;
    break;
  }
  case 'presets': {
    console.log('AREA SPLITS (percent of visible area: neutral / secondary / accent)\n');
    console.log('| id | split | ranges (n, s, a) | use for |\n|---|---|---|---|');
    for (const [id, p] of Object.entries(C.AREA_PRESETS)) console.log(`| ${id} | ${p.split.join('-')} | ${p.range.n.join('-')}, ${p.range.s.join('-')}, ${p.range.a.join('-')} | ${p.for} |`);
    console.log('\nSTATE MIXES (floor percentages; hover/active are raised per palette to reach the minimum lightness step dL)\n');
    console.log('| id | hover | active | disabled | tint | min dL hover/active | use for |\n|---|---|---|---|---|---|---|');
    for (const [id, p] of Object.entries(C.STATE_PRESETS)) console.log(`| ${id} | ${p.hover}% | ${p.active}% | ${p.disabled}% | ${p.tint}% | ${p.dL.join('/')} | ${p.note} |`);
    break;
  }
  case 'ratio': {
    const [n, s2, a] = pos.map(Number);
    if ([n, s2, a].some(Number.isNaN)) throw new Error('usage: ratio <neutral> <secondary> <accent>');
    const rows = C.areaCheck(n, s2, a, { preset: flag('preset', null), kind: flag('kind', null), primaryShare: +flag('primary-share', 100), semantic: +flag('semantic', 0) });
    console.log(stateTable(rows));
    const bad = rows.filter((r) => r.status === 'fail').length;
    console.log(bad ? `\n${bad} failing rule(s)` : `\nno failing rules (${rows.filter((r) => r.status === 'warn').length} warning(s))`);
    process.exitCode = bad ? 1 : 0;
    break;
  }
  case 'states': {
    const src = rolesFrom(pos[0]);
    const preset = flag('preset', 'standard');
    let bad = 0;
    for (const [mode, roles0] of Object.entries(src)) {
      const roles = { ...roles0, surface: roles0.surface ?? roles0.bg };
      const sr = C.stateReport(roles, preset);
      bad += sr.rows.filter((r) => r.status === 'fail').length;
      console.log(`## ${mode} (${preset}: target ${sr.mixes.name}, hover ${sr.mixes.hover}%, active ${sr.mixes.active}%)\n\n${stateTable(sr.rows)}\n`);
      if (flag('css', false)) console.log(`.${mode} {\n${C.stateCss(roles, preset)}\n}\n`);
    }
    process.exitCode = bad ? 1 : 0;
    break;
  }
  case 'dark': {
    const d = rolesFrom(pos[0]);
    const darkRoles = d.dark ?? Object.values(d)[0];
    const lf = flag('light', null);
    const l = lf ? rolesFrom(lf) : null;
    const rows = C.darkCheck(darkRoles, l ? (l.light ?? Object.values(l)[0]) : (d.light ?? null), { oled: !!flag('oled', false) });
    console.log(darkTable(rows));
    const bad = rows.filter((r) => r.status === 'fail').length;
    console.log(bad ? `\n${bad} failing rule(s)` : `\nno failing rules (${rows.filter((r) => r.status === 'warn').length} warning(s))`);
    process.exitCode = bad ? 1 : 0;
    break;
  }
  case 'cvd': {
    for (let i = 0; i < pos.length; i++)
      for (let j = i + 1; j < pos.length; j++) {
        const d = ['protan', 'deutan', 'tritan'].map((t) => C.deltaEOK(C.simulate(pos[i], t), C.simulate(pos[j], t)));
        console.log(`${pos[i]} vs ${pos[j]}: protan ${f2(d[0])} deutan ${f2(d[1])} tritan ${f2(d[2])}${Math.min(...d) < 0.1 ? '  COLLAPSES' : ''}`);
      }
    break;
  }
  case 'docs': {
    const out = ['# Curated palettes (verified)', '', 'Generated by `node scripts/palette.mjs docs` from `palettes.json`. Hex is the source of truth; OKLCH and ratios are recomputed, not hand-typed. `need` = 4.5 for text pairs, 3 for UI/graphics pairs. Pairs marked FAIL are documented in the palette note and are either deliberate teaching cases or require the stated mitigation.', ''];
    for (const group of ['natural', 'dev-dark', 'product', 'agency']) {
      out.push(`## ${{ natural: 'Natural / wellness / organic', 'dev-dark': 'Dark developer-style', product: 'Light product / industry', agency: 'Agency / portfolio / playful' }[group]}`, '');
      for (const p of loadPalettes().filter((x) => x.group === group)) {
        const { rows } = { rows: C.audit(p.full) };
        out.push(`### ${p.name} (\`${p.id}\`, ${p.mode})`, '', `Tags: ${p.tags.join(', ')}. ${p.note}`, '');
        out.push('```css', `.p-${p.id} {`);
        for (const [k, v] of Object.entries(p.roles)) out.push(`  --${k}: ${v}; /* ${C.oklchOf(v)} */`);
        out.push('}', '```', '', '| pair | ratio | need | result |', '|---|---|---|---|');
        for (const r of rows) out.push(`| ${r.fg} on ${r.bg} | ${f2(r.ratio)} | ${r.need} | ${r.pass ? 'pass' : '**FAIL**'} |`);
        if (p.mode === 'dark') {
          out.push('', 'Dark-mode rules (WARN = needs a stated reason, FAIL = blocks):', '', '| rule | status | detail |', '|---|---|---|');
          for (const r of C.darkCheck(p.full)) out.push(`| ${r.id} ${r.rule} | ${ICON[r.status]} | ${r.detail} |`);
        }
        if (p.failcase) {
          const f = C.contrast('#FFFFFF', p.roles.primary);
          out.push('', `Failure case: swapping on-primary to white gives ${f2(f)}:1.`);
        }
        out.push('');
      }
    }
    out.push('Shared semantic colors (merged into every palette above for audit): see `_meta.semantic` in `palettes.json`.', '');
    writeFileSync(join(here, '..', 'references', 'palettes.md'), out.join('\n'));
    console.log('wrote references/palettes.md');
    break;
  }
  default:
    console.log(HELP);
}
