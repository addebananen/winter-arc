import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM, VirtualConsole} from 'jsdom';
import {build} from 'esbuild';
import en from '../src/i18n-en.js';
import sv from '../src/i18n-sv.js';
import {translate} from '../src/i18n.js';
import * as S from '../src/strength.js';
import * as F from '../src/fitness.js';
import {coreLifts} from '../src/strength-catalog-core.js';

const swedish = /[åäöÅÄÖ]|\b(och|att|med|för|på|av|till|inte|eller|utan|mot|över|efter|från|logga|håll|sänk|lyft|dra|ligg|sitt)\b/i;
const sleep = ms => new Promise(r => setTimeout(r, ms));

test('dictionaries keep numbers and never translate their own output again', () => {
  const count = s => (s.match(/\{#\}/g) || []).length;
  for (const [dict, to] of [[en, 'en'], [sv, 'sv']]) for (const [k, v] of Object.entries(dict)) {
    assert.equal(count(k), count(v), k);
    const text = k.replace(/\{#\}/g, '7'), once = translate(text, to);
    assert.equal(translate(once, to), once, 'Stable: ' + k);
  }
});

test('numbers, sentences, " · " parts, verbs, dates and names are translated', () => {
  assert.equal(translate('12 dagar', 'en'), '12 days');
  assert.equal(translate('Välj övningar. Logga dina set.', 'en'), 'Choose exercises. Log your sets.');
  assert.equal(translate('Träning · Strength', 'en'), 'Training · Strength');
  assert.equal(translate('Redigera Läs en bok', 'en'), 'Edit Read a book');
  assert.equal(translate('lördag 9 november', 'en'), 'Saturday 9 November');
  assert.equal(translate('Välkommen tillbaka, Tim. Varje litet steg räknas.', 'en'), 'Welcome back, Tim. Every small step counts.');
  assert.equal(translate('Dagens pass är sparat. Nästa pass senast på onsdag.', 'en'), "Today's workout is saved. Next workout by Wednesday.");
  assert.equal(translate('Text som inte finns i ordlistan', 'en'), 'Text som inte finns i ordlistan');
});

test('every exercise reads in one language: English by default, Swedish names when Swedish is chosen', () => {
  for (const e of [...S.lifts, ...F.exercises]) for (const field of ['name', 'muscle', 'equipment', 'cue']) {
    if (!e[field]) continue;
    assert.doesNotMatch(translate(e[field], 'en'), swedish, `${e.id}.${field}: ${e[field]}`);
  }
  assert.equal(translate('Hack Squat', 'sv'), 'Hackböj');
  assert.equal(translate('Incline Dumbbell Press', 'sv'), 'Hantelpress på lutande bänk');
  assert.equal(translate('Bänkpress', 'sv'), 'Bänkpress');
});

test('abs and mobility exercises: the requested ones exist with their own muscle groups', () => {
  const byName = Object.fromEntries(coreLifts.map(e => [translate(e.name, 'en'), e]));
  for (const name of ['Leg raise', "Captain's chair leg raise", 'Sit-ups', 'Crunches', 'Hanging leg raise', 'Ab wheel rollout']) assert.ok(byName[name], name);
  assert.ok(coreLifts.filter(e => e.muscle === 'Mage').length >= 10);
  assert.ok(coreLifts.filter(e => e.muscle === 'Rörlighet').length >= 10);
  assert.equal(translate('Mage', 'en'), 'Abs');
  for (const e of coreLifts) assert.ok(S.liftById[e.id], e.id);
  assert.ok(coreLifts.every(e => e.family !== 'mobility' || !['push', 'pull', 'legs', 'core'].includes(e.family)));
});

test('the app opens in English by default and switches to Swedish from settings', async () => {
  const bundled = await build({entryPoints: ['src/app.js'], bundle: true, write: false, format: 'iife', target: 'es2022', plugins: [{name: 'demo', setup(b) { b.onLoad({filter: /[\\/]config\.js$/}, () => ({contents: "export const config={supabaseUrl:'',supabaseKey:'',googleEnabled:false,developmentModes:true}", loader: 'js'})); }}]});
  const vc = new VirtualConsole();
  const dom = new JSDOM('<title>Beyond Self — Din expedition</title><div id="app"></div><div id="modal-root"></div><div id="toast"></div>', {url: 'https://beyond.example/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc});
  const w = dom.window; w.scrollTo = () => {}; w.structuredClone = structuredClone; w.localStorage.setItem('arc-mode', 'demo');
  w.eval(bundled.outputFiles[0].text); await sleep(150);
  const q = s => w.document.querySelector(s), click = async a => { q(`[data-action="${a}"]`).click(); await sleep(40); };
  assert.equal(w.document.documentElement.lang, 'en');
  assert.equal(w.document.title, 'Beyond Self — Your expedition');
  assert.deepEqual([...w.document.querySelectorAll('.tabbar button')].map(b => b.textContent), ['Today', 'Training', 'Skill tree', 'Squad']);
  assert.equal(q('.page-head h1').textContent, 'One step forward.');
  await click('nav:training'); await click('fit:section:strength'); await click('hub:catalog');
  assert.match(q('#view').textContent, /Exercise library/);
  assert.match(q('#view').textContent, /Bench press/);
  assert.doesNotMatch(q('#view').textContent, /Bänkpress/);
  await click('hub:filter:muscle');
  const groups = [...w.document.querySelectorAll('.filter-grid button')].map(b => b.textContent);
  assert.ok(groups.includes('Abs') && groups.includes('Mobility'), groups.join(', '));
  await click('hub:choose:muscle:Mage');
  assert.match(q('#view').textContent, /Captain's chair leg raise/);
  assert.match(q('#view').textContent, /Sit-ups/);
  await click('hub:tracker'); await click('hub:start'); await click('hub:pick'); await click('hub:add:captains-chair');
  assert.equal(JSON.parse(w.localStorage.getItem('arc-state-demo')).strength.active.exercises[0].id, 'captains-chair');
  assert.match(q('.lift-log').textContent, /Captain's chair leg raise/);
  await click('hub:cancel'); await click('hub:discard');
  for (const r of ['today', 'habits', 'squad', 'training']) { await click('nav:' + r); assert.ok(q('.page-head [data-action="settings"]'), 'Settings reachable on ' + r); }
  await click('quick'); await click('quick:settings');
  assert.match(q('.modal').textContent, /Language/); await click('close');
  await click('nav:profile');
  assert.match(q('.profile-lang').textContent, /Language/);
  assert.ok(q('.profile-lang [data-action="lang:sv"]'));
  await click('settings');
  assert.match(q('.modal').textContent, /Language/);
  assert.equal(q('[data-action="lang:en"]').getAttribute('aria-pressed'), 'true');
  assert.equal(q('[data-action="lang:sv"]').textContent, 'Svenska');
  await click('lang:sv');
  assert.equal(w.localStorage.getItem('arc-lang'), 'sv');
  w.close();
});
