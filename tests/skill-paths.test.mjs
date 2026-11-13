import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM, VirtualConsole} from 'jsdom';
import {build} from 'esbuild';
import * as P from '../src/skill-paths.js';
import * as SK from '../src/skills.js';
import * as S from '../src/strength.js';

const base = () => ({skills: {}, strength: {sessions: [], active: null}, training: {sessions: []}, expedition: {start: '2026-11-01'}, profile: {}});

test('the road to a goal lists every prerequisite level before the level that needs it', () => {
  for (const t of SK.trees) {
    const steps = P.road(t.id), seen = {};
    assert.equal(new Set(steps.map(x => x.id)).size, steps.length, t.id + ' has no duplicate steps');
    assert.equal(steps.at(-1).id, `sk-${t.id}-${t.levels.length}`, t.id + ' ends with the goal mastered');
    for (const x of steps) {
      const tree = SK.treeById[x.tree], reqs = [...(tree.requires || []), ...(tree.levels[x.n - 1].requires || [])];
      for (const [id, n] of reqs) assert.ok((seen[id] || 0) >= n, `${x.id} needs ${id} ${n} first`);
      assert.equal(x.n, (seen[x.tree] || 0) + 1, x.id + ' comes in level order');
      seen[x.tree] = x.n;
    }
  }
  const hs = P.road('handstand').map(x => x.id);
  assert.deepEqual(hs.slice(0, 9), ['sk-wrists-1', 'sk-wrists-2', 'sk-shoulder-flex-1', 'sk-shoulder-flex-2', 'sk-core-1', 'sk-core-2', 'sk-core-3', 'sk-push-1', 'sk-push-2']);
});

test('a beginner aiming for handstand gets the prerequisites as a ready workout', () => {
  const s = base(), p = P.pathOf(s, 'handstand');
  assert.equal(p.done, 0); assert.equal(p.total, 16); assert.equal(p.prereqLeft, 9);
  assert.equal(p.next.id, 'sk-wrists-1');
  const full = P.template(s, 'handstand', 'full', {day: '2026-11-13'});
  assert.deepEqual(full.ids, ['sk-wrists-1', 'sk-shoulder-flex-1', 'sk-core-1', 'sk-push-1']);
  assert.ok(full.items.every(x => x.role === 'Förkunskap'));
  const quick = P.template(s, 'handstand', 'quick', {day: '2026-11-13'});
  assert.equal(quick.ids.length, 3);
  assert.ok(quick.minutes < full.minutes);
});

test('with the prerequisites done the workout warms up, consolidates, trains the next step and adds support', () => {
  const s = base();
  for (const [id, n] of [['wrists', 4], ['shoulder-flex', 4], ['core', 3], ['push', 2], ['handstand', 2]]) SK.setLevel(s, id, n, '2026-11-01');
  const full = P.template(s, 'handstand', 'full', {day: '2026-11-13'});
  assert.deepEqual(full.items.map(x => [x.id, x.role]), [
    ['sk-wrists-4', 'Uppvärmning'], ['sk-shoulder-flex-4', 'Uppvärmning'], ['sk-handstand-2', 'Befäst'],
    ['sk-handstand-3', 'Huvudfokus'], ['sk-hspu-1', 'Stödstyrka'], ['sk-core-4', 'Stödstyrka']]);
  assert.ok(full.ids.every(id => { const e = SK.workoutById[id]; return SK.canTrain(s, e.skillTree, e.skillLevel); }));
  // Every template can be started as a real workout.
  S.startWorkout(s, '2026-11-13', full.ids);
  assert.deepEqual(s.strength.active.exercises.map(e => e.id), full.ids);
});

test('templates skip what is already saved today, already in the workout or not yet activated', () => {
  const s = base();
  s.strength.sessions.push({id: 'a', date: '2026-11-13', finishedAt: 1, exercises: [{id: 'sk-wrists-1', sets: [{kg: 0, reps: 10, done: true, quality: true}]}]});
  const t = P.template(s, 'handstand', 'full', {day: '2026-11-13', allowed: id => id !== 'sk-core-1'});
  assert.ok(!t.ids.includes('sk-wrists-1'));
  assert.ok(!t.ids.includes('sk-core-1'));
  S.startWorkout(s, '2026-11-13', ['sk-push-1']);
  assert.ok(!P.template(s, 'handstand', 'full', {day: '2026-11-13'}).ids.includes('sk-push-1'));
});

test('a mastered goal gives a maintenance workout and the goal is stored in the save', () => {
  const s = base();
  for (const t of SK.trees) SK.setLevel(s, t.id, t.levels.length, '2026-11-01');
  const p = P.pathOf(s, 'l-sit');
  assert.ok(p.mastered); assert.equal(p.ratio, 1);
  assert.ok(P.template(s, 'l-sit', 'full', {day: '2026-11-13'}).ids.includes('sk-l-sit-' + SK.treeById['l-sit'].levels.length));
  P.setGoal(s, 'planche'); assert.equal(P.goalOf(s), 'planche');
  assert.throws(() => P.setGoal(s, 'nope'));
  P.setGoal(s, null); assert.equal(P.goalOf(s), null); assert.ok(!('skillGoal' in s));
});

test('goal progress counts only clean sets that reach the goal', () => {
  const meta = SK.workoutById['sk-handstand-1'];
  const g = P.goalProgress({sets: [{reps: 30, done: true, quality: true}, {reps: 20, done: true, quality: true}, {reps: 40, done: true, quality: false}]}, meta);
  assert.deepEqual([g.hit, g.need, g.complete], [1, 3, false]);
  assert.equal(P.goalProgress({sets: []}, S.liftById.bench), null);
});

test('in the app: choose a goal, start its workout in one tap, log suggested sets and see the summary', async () => {
  const bundled = await build({entryPoints: ['src/app.js'], bundle: true, write: false, format: 'iife', target: 'es2022', plugins: [{name: 'demo', setup(b) { b.onLoad({filter: /[\\/]config\.js$/}, () => ({contents: "export const config={supabaseUrl:'',supabaseKey:'',googleEnabled:false,developmentModes:true}", loader: 'js'})); }}]});
  const errors = [], vc = new VirtualConsole(); vc.on('jsdomError', e => { if (!/navigation/.test(e.message)) errors.push(e); });
  const dom = new JSDOM('<div id="app"></div><div id="modal-root"></div><div id="toast"></div>', {url: 'https://winter.example/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc});
  const w = dom.window; w.scrollTo = () => {}; w.structuredClone = structuredClone;
  w.localStorage.setItem('arc-mode', 'demo'); w.localStorage.setItem('arc-lang', 'sv'); w.eval(bundled.outputFiles[0].text);
  const sleep = ms => new Promise(r => setTimeout(r, ms)), q = s => w.document.querySelector(s), data = () => JSON.parse(w.localStorage.getItem('arc-state-demo'));
  const click = async a => { const el = q(`[data-action="${a}"]`); assert.ok(el, 'Missing action ' + a); el.click ? el.click() : el.dispatchEvent(new w.MouseEvent('click', {bubbles: true})); await sleep(60); };
  await sleep(150);
  await click('nav:skills'); await sleep(300);
  assert.match(q('.sp-pick').textContent, /Vad vill du kunna\?/);
  await click('fit:sk:goal:handstand');
  assert.equal(data().skillGoal, 'handstand');
  assert.match(q('.sp-goal').textContent, /MITT MÅL/);
  assert.match(q('.sp-goal').textContent, /0\/16/);
  await click('fit:sk:road:handstand');
  assert.equal(w.document.querySelectorAll('.sp-step').length, 16);
  assert.ok(q('[data-action="hub:skill-add:wrists:1"]'), 'Ready steps can be added straight from the road');
  await click('close');
  await click('hub:template:handstand:full');
  const ids = data().strength.active.exercises.map(e => e.id);
  assert.deepEqual(ids.slice(0, 2), ['sk-wrists-1', 'sk-shoulder-flex-1']);
  assert.match(q('.sp-goal-chip').textContent, /2 × 10 reps/);
  // An empty set logs the grey suggestion (the skill goal) once clean form is confirmed.
  let f = q('#hub-set-sk-wrists-1-0'); assert.equal(f.elements.namedItem('reps').placeholder, '10');
  f.elements.namedItem('quality').checked = true;
  f.dispatchEvent(new w.Event('submit', {bubbles: true, cancelable: true})); await sleep(80);
  assert.deepEqual(data().strength.active.exercises[0].sets[0], {kg: 0, reps: 10, done: true, quality: true});
  assert.ok(q('.sp-timer'), 'A rest timer starts after a set');
  f = q('#hub-set-sk-wrists-1-1'); assert.equal(f.elements.namedItem('quality').checked, true, 'Clean-form box is pre-ticked after the first set');
  f.dispatchEvent(new w.Event('submit', {bubbles: true, cancelable: true})); await sleep(80);
  assert.match(q('.sp-goal-chip').textContent, /låses upp/);
  await click('hub:rest:skip'); assert.equal(q('.sp-timer'), null);
  await click('hub:finish'); await click('hub:save'); await sleep(80);
  assert.equal(q('#modal-title').textContent, 'Passet är sparat');
  assert.match(q('.sp-sum-unlock').textContent, /Handledsrörlighet/);
  assert.match(q('.sp-sum').textContent, /1\/16/);
  assert.equal(data().strength.active, null);
  assert.deepEqual(errors, []);
  w.close();
});
