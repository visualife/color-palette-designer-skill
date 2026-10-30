#!/usr/bin/env node
// Builds a single-file demo: inlines lib.mjs (browser-safe) and palettes.json into assets/demo.src.html.
//   node build_demo.mjs                              -> assets/demo.html
//   node build_demo.mjs --palette my.json --out x.html   adds a custom palette ("Custom") and selects it
// my.json: {"name":"...","mode":"light|dark","roles":{...}}  or  {"light":{...},"dark":{...}}
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const argv = process.argv.slice(2);
const arg = (n) => {
  const i = argv.indexOf('--' + n);
  return i < 0 ? null : argv[i + 1];
};

const engine = readFileSync(join(here, 'lib.mjs'), 'utf8').replace(/^export /gm, '');
const measure = readFileSync(join(here, 'measure-area.js'), 'utf8');
const data = JSON.parse(readFileSync(join(root, 'references', 'palettes.json'), 'utf8'));

const custom = arg('palette');
let selected = 'sage-wellness';
if (custom) {
  const j = JSON.parse(readFileSync(resolve(custom), 'utf8'));
  const base = { id: 'custom', name: j.name ?? 'Custom', group: 'custom', tags: ['custom'], note: 'Loaded from ' + custom };
  if (j.light && j.dark) {
    data.palettes.unshift({ ...base, id: 'custom-light', name: base.name + ' (light)', mode: 'light', roles: j.light });
    data.palettes.unshift({ ...base, id: 'custom-dark', name: base.name + ' (dark)', mode: 'dark', roles: j.dark });
    selected = 'custom-light';
  } else {
    data.palettes.unshift({ ...base, mode: j.mode ?? 'light', roles: j.roles ?? j });
    selected = 'custom';
  }
}

let html = readFileSync(join(root, 'assets', 'demo.src.html'), 'utf8');
html = html
  .replace('/*@@ENGINE@@*/', () => engine)
  .replace('/*@@MEASURE@@*/', () => measure)
  .replace('/*@@PALETTES@@*/', () => `const DATA = ${JSON.stringify(data)};\nconst DEFAULT_PALETTE = ${JSON.stringify(selected)};`);
const out = resolve(arg('out') ?? join(root, 'assets', 'demo.html'));
writeFileSync(out, html);
console.log('wrote', out, `(${(html.length / 1024).toFixed(0)} KB)`);
