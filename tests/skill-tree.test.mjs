import test from 'node:test';
import assert from 'node:assert/strict';
import {createSkillTreeUI, skillCategories} from '../src/skill-tree-ui.js';

const I = n => `<i data-icon="${n}"></i>`;
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

test('category registry has unique ids and the required fields', () => {
  const ids = skillCategories.map(c => c.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const c of skillCategories) for (const k of ['id', 'name', 'icon', 'color', 'tagline']) assert.ok(c[k], `${c.id} saknar ${k}`);
  assert.ok(skillCategories.some(c => c.id === 'calisthenics' && !c.soon));
});

test('only categories with a view can be chosen; soon ones are listed but locked', () => {
  let renders = 0;
  const ui = createSkillTreeUI({I, esc, render: () => renders++, categories: {calisthenics: {view: () => '<p>cali</p>', progress: () => ({done: 3, total: 10})}}});
  const html = ui.view();
  assert.match(html, /<p>cali<\/p>/);
  assert.match(html, /3\/10 nivåer/);
  assert.match(html, /data-action="skt:cat:calisthenics"/);
  assert.doesNotMatch(html, /data-action="skt:cat:music"/);
  assert.match(html, /Kommer snart/);
  assert.throws(() => ui.action(['cat', 'music']), /inte öppen/);
  assert.throws(() => ui.action(['cat', 'nope']), /inte öppen/);
  assert.equal(ui.action(['cat', 'calisthenics']), true);
  assert.equal(renders, 1);
  assert.equal(ui.action(['other']), false);
});

test('adding a category is one registry entry plus one view', () => {
  const list = [...skillCategories.map(c => c.id === 'music' ? {...c, soon: false} : c), {id: 'running', name: 'Löpning', icon: 'flame', color: '#f00', tagline: 'Fart', soon: true}];
  const ui = createSkillTreeUI({I, esc, render: () => {}, list, categories: {
    calisthenics: {view: () => 'cali'},
    music: {view: () => 'musik-vy', progress: () => ({done: 1, total: 4})},
  }});
  assert.match(ui.view(), /cali/);
  ui.action(['cat', 'music']);
  assert.equal(ui.current(), 'music');
  const html = ui.view();
  assert.match(html, /musik-vy/);
  assert.match(html, /<strong>Musik<\/strong>/);
  assert.match(html, /1\/4 nivåer/);
  assert.match(html, /Löpning/);
  assert.match(html, /2 av 3 öppna/);
});

test('a missing view never breaks the page', () => {
  const ui = createSkillTreeUI({I, esc, render: () => {}, categories: {}});
  assert.match(ui.view(), /Inga skill-träd/);
});
