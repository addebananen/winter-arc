import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {themes, recolor, themeCss} from '../src/themes.js';

test('every theme has a name, a hint and a swatch', () => {
  assert.deepEqual(Object.keys(themes), ['aurora', 'frost', 'midnight', 'beyond']);
  for (const t of Object.values(themes)) { assert.ok(t.name && t.hint); assert.equal(t.swatch.length, 3); }
});

test('themes recolour the cool palette and keep warm accents', () => {
  assert.equal(recolor('#c6e7df', 'aurora'), '#c6e7df', 'The default theme is the original CSS');
  assert.notEqual(recolor('#c6e7df', 'frost'), '#c6e7df');
  assert.match(recolor('rgb(16, 23, 25)', 'midnight'), /^rgb\(/);
  for (const warm of ['#e0c799', '#ff6b5b', '#ffca84']) for (const id of ['frost', 'midnight', 'beyond']) {
    assert.equal(recolor(warm, id).replace(/\s/g, ''), `rgb(${[1, 3, 5].map(i => parseInt(warm.slice(i, i + 2), 16)).join(',')})`, `${warm} stays in ${id}`);
  }
  const [r, g, b] = recolor('#1e292b', 'beyond').match(/\d+/g).map(Number);
  assert.ok(r === g && g === b, 'Beyond Self is neutral black and white');
  assert.match(recolor('#c6e7df0e', 'frost'), /^rgba\(.+, 0\.055\)$/, 'Alpha is kept');
  assert.equal(recolor('linear-gradient(#101719, #ffca84)', 'beyond').includes('rgb(255, 202, 132)'), true);
});

test('the override stylesheet is built from the loaded CSS, including media queries', () => {
  const dom = new JSDOM('<style>.card{background:#182124;color:#e0c799}@media (max-width:700px){.tabbar{border-color:#2a3739}}</style><body></body>');
  const css = themeCss('frost', dom.window.document);
  assert.match(css, /\.card\{background-color:rgb/);
  assert.doesNotMatch(css, /color:rgb\(224, 199, 153\)/, 'Unchanged warm colours are not repeated');
  assert.match(css, /@media \(max-width: ?700px\)\{\.tabbar\{/);
  assert.equal(themeCss('aurora', dom.window.document), '');
  assert.match(themeCss('beyond', dom.window.document), /--mint:#ff4545/);
});
