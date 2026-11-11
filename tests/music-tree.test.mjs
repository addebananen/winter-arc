import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM, VirtualConsole} from 'jsdom';
import {build} from 'esbuild';
import * as T from '../src/music-theory.js';
import * as M from '../src/music-tree.js';
import * as D from '../src/domain.js';
import * as SK from '../src/skills.js';
import en from '../src/i18n-en.js';

const day = '2026-11-11';
const fresh = () => M.ensureMusicTree(D.normalizeState(D.blankState(day), '2026-11-07T12:00:00Z'));
const name = (n, iv) => T.nameOf(T.transpose(T.parseNote(n), iv));

test('notes are spelled by letter, so every chord and scale reads correctly', () => {
  assert.equal(name('E♭3', '3'), 'G');
  assert.equal(name('B3', 'b3'), 'D');
  assert.equal(name('F#3', '7'), 'E♯');
  assert.equal(name('A3', 'b2'), 'B♭');
  assert.deepEqual(T.chordNotes(T.parseNote('D3'), 'min').map(T.nameOf), ['D', 'F', 'A']);
  assert.deepEqual(T.chordNotes(T.parseNote('B♭2'), 'dom7').map(T.nameOf), ['B♭', 'D', 'F', 'A♭']);
  assert.deepEqual(T.SCALES.major.steps.map(s => name('E3', s)), ['E', 'F♯', 'G♯', 'A', 'B', 'C♯', 'D♯', 'E']);
  assert.equal(T.midiOf(T.parseNote('A4')), 69);
  assert.equal(Math.round(T.freqOf(57)), 220);
});

test('bass fretboard positions match standard EADG tuning', () => {
  assert.equal(T.fretMidi(0, 0), 28);
  assert.equal(T.fretMidi(1, 5), T.fretMidi(2, 0), 'A string fret 5 = open D');
  assert.deepEqual(T.positionsOf(T.midiOf(T.parseNote('C4')), [0, 5]), [[1, 3], [3, 5]]);
  const R = T.rng(3);
  for (let i = 0; i < 40; i++) {
    const q = T.fretQuestion(R, {strings: [0], frets: [0, 5]});
    assert.ok(q.answer.length > 0);
    for (const [s, f] of q.answer) { assert.equal(s, 0); assert.ok(f <= 5); assert.equal(T.pcOf(T.fretMidi(s, f)), q.pc); }
  }
});

test('ear questions always contain their answer among the options', () => {
  const R = T.rng(7);
  for (const node of M.NODES) for (const l of node.levels) {
    if (!M.QUIZ_TYPES.has(l.game.type) || l.game.type === 'fret') continue;
    for (let i = 0; i < 25; i++) {
      const q = {compare: T.compareQuestion, degree: T.degreeQuestion, interval: T.intervalQuestion, quality: T.qualityQuestion, chordtone: T.chordToneQuestion, progression: T.progressionQuestion, inversion: T.inversionQuestion}[l.game.type](R, l.game);
      assert.ok(q.options.some(o => o.id === q.answer), `${node.id} ${l.n}: ${q.answer}`);
      assert.ok(q.play.length && q.play.every(e => e.notes.every(n => n >= 16 && n <= 96)), 'Notes stay audible');
    }
  }
});

test('the chord-tone question names the role of the note above the bass', () => {
  const R = T.rng(11);
  for (let i = 0; i < 50; i++) {
    const q = T.chordToneQuestion(R, {chords: ['maj', 'min', 'dom7'], pool: ['1', '3', '5', '7']});
    const bass = q.play.find(e => e.inst === 'bass').notes[0], top = q.play[q.play.length - 1].notes[0];
    const iv = ((top - bass) % 12 + 12) % 12, want = {'1': [0], '3': [3, 4], '5': [7], '7': [10, 11]}[q.answer];
    assert.ok(want.includes(iv), `${q.prompt} ${q.answer} ${iv}`);
  }
});

test('bass lines: rules grade the beats a teacher would mark', () => {
  const line = {key: 'C', root: T.parseNote('C2'), chords: ['I', 'vi', 'IV', 'V'].map(deg => { const d = T.diatonic(deg), r = T.transpose(T.parseNote('C2'), d.iv); return {deg, q: d.q, root: r, name: T.chordName(r, d.q)}; })};
  assert.equal(T.gradeBassLine(line, Array(16).fill('R'), 'root').score, 1);
  assert.equal(T.gradeBassLine(line, ['R', '5', 'R', '5', 'R', '5', 'R', '5', 'R', '5', 'R', '5', 'R', '5', 'R', '5'], 'root5').score, 1);
  const bad = T.gradeBassLine(line, ['5', '5', '5', '5', ...Array(12).fill('R')], 'root5');
  assert.equal(bad.flags[0], false, 'Beat 1 must be the root');
  const walk = ['R', '3', '5', 'a-', 'R', '3', '5', 'a-', 'R', '3', '5', 'a-', 'R', '3', '5', 'a-'];
  assert.equal(T.gradeBassLine(line, walk, 'approach').score, 1);
  // The example line the game plays for each rule must pass its own grading, in every key.
  const models = {root: ['R', 'R', 'R', 'R'], root5: ['R', 'R', '5', '5'], triad: ['R', '3', '5', '8'], approach: ['R', '3', '5', 'a-'], walk: ['R', '2', '3', 'a-']};
  const R2 = T.rng(11);
  for (let i = 0; i < 200; i++) {
    const l = T.bassChords(R2, i % 2 ? 'pop' : 'three');
    for (const [rule, pat] of Object.entries(models)) assert.equal(T.gradeBassLine(l, l.chords.flatMap(() => pat), rule).score, 1, `${rule} ${l.key} ${l.chords.map(c => c.name).join(' ')}`);
  }
  assert.deepEqual(T.voiceLine([38, 40, 42, 30, 31]), [38, 40, 42, 42, 31]);
  // C → Am: half step below A is G♯, spelled as the leading tone.
  const c = T.beatChoices(line, 0, 3).find(x => x.id === 'a-');
  assert.equal(c.label, 'G♯'); assert.equal(T.pcOf(c.midi), 8);
  // Scale tones come from the key: over Dm (ii) in C the 6th is B, not B♭.
  const ii = {...line, chords: [line.chords[0], {deg: 'ii', q: 'min', root: T.parseNote('D2'), name: 'Dm'}, line.chords[2], line.chords[3]]};
  assert.equal(T.beatChoices(ii, 1, 2).find(x => x.id === '6').label, 'B');
  for (const ch of T.beatChoices(line, 2, 3)) assert.ok(ch.midi >= 28 && ch.midi <= 52, 'Bass range');
});

test('rhythm taps are matched once per target, early and late both count within the window', () => {
  const beat = 600, targets = [0, 600, 1200, 1800];
  const r = T.gradeTaps([10, 590, 1290, 1800, 1805], targets, beat);
  assert.equal(r.hit, 4); assert.equal(r.extra, 1); assert.ok(r.score < 1 && r.score > .8);
  assert.equal(T.gradeTaps([300, 900], targets, beat).hit, 0);
});

test('pitch detection finds a sung fundamental and folds octaves', () => {
  const sr = 44100, buf = new Float32Array(2048);
  for (const f of [110, 196, 261.63, 440]) {
    for (let i = 0; i < buf.length; i++) buf[i] = .3 * Math.sin(2 * Math.PI * f * i / sr) + .12 * Math.sin(4 * Math.PI * f * i / sr) + .05 * Math.sin(6 * Math.PI * f * i / sr);
    const p = T.detectPitch(buf, sr);
    assert.ok(p && Math.abs(1200 * Math.log2(p.freq / f)) < 10, `${f} → ${p?.freq}`);
  }
  assert.equal(T.detectPitch(new Float32Array(2048), sr), null, 'Silence has no pitch');
  assert.ok(Math.abs(T.foldCents(110, 57 + 12)) < 1, 'An octave below still hits');
});

test('tree: unique ids, valid prerequisites, every level has a game', () => {
  assert.equal(new Set(M.NODES.map(n => n.id)).size, M.NODES.length);
  for (const n of M.NODES) {
    assert.ok(M.BRANCHES.some(b => b.id === n.branch));
    for (const [id, lvl] of n.requires) assert.ok(M.nodeById[id] && lvl <= M.nodeById[id].levels.length, `${n.id} → ${id}`);
    for (const l of n.levels) assert.ok(l.name && l.goal && l.game.type, `${n.id} ${l.n}`);
  }
  assert.ok(M.summary(fresh()).total >= 60);
});

test('progress: levels unlock in order, stars only grow, data is sanitised and kept', () => {
  const s = fresh();
  assert.equal(M.canPlay(s, 'degrees', 1), true);
  assert.equal(M.canPlay(s, 'degrees', 2), false);
  assert.equal(M.canPlay(s, 'intervals', 1), false, 'Needs degrees level 1');
  assert.throws(() => M.record(s, 'intervals', 1, 1, day), /Klara nivån/);
  let r = M.record(s, 'degrees', 1, .7, day);
  assert.equal(r.cleared, false); assert.equal(M.levelOf(s, 'degrees'), 0);
  r = M.record(s, 'degrees', 1, .9, day);
  assert.deepEqual([r.cleared, r.stars, r.newDay], [true, 2, true]);
  r = M.record(s, 'degrees', 1, .8, day);
  assert.equal(r.improved, false); assert.equal(M.starsOf(s, 'degrees', 1), 2);
  assert.equal(M.canPlay(s, 'intervals', 1), true);
  assert.equal(M.streak(s, day), 1);
  assert.equal(M.streak(s, '2026-11-12'), 1, 'Yesterday keeps the streak');
  assert.equal(M.streak(s, '2026-11-13'), 0);
  const copy = M.ensureMusicTree(JSON.parse(JSON.stringify({...s, musicTree: {...s.musicTree, nodes: {...s.musicTree.nodes, hack: {level: 99}, degrees: {level: 50, stars: [9, 'x']}}, days: ['nope', day], voice: 'xx'}})));
  assert.equal(copy.musicTree.nodes.hack, undefined);
  assert.equal(M.levelOf(copy, 'degrees'), 5);
  assert.deepEqual(copy.musicTree.nodes.degrees.stars, [3, 0]);
  assert.deepEqual(copy.musicTree.days, [day]);
  assert.equal(copy.musicTree.voice, 'mid');
});

test('music levels shape the Music stat only, never XP', () => {
  const s = fresh(), xp = D.totalXP(s);
  M.record(s, 'degrees', 1, 1, day); M.record(s, 'fretboard', 1, .85, day);
  assert.equal(M.musicStats(s).Music, M.levelPoints(1, 3) + M.levelPoints(1, 1));
  assert.equal(D.totalXP(s), xp);
  assert.equal(SK.characterStats(D.stats(s), s, D.categories).Music, D.stats(s).Music, 'Calisthenics stats are unchanged');
});

test('daily mix interleaves only cleared quiz levels', () => {
  const s = fresh();
  assert.equal(M.mixPool(s, day).length, 0);
  M.record(s, 'degrees', 1, 1, day); M.record(s, 'breath', 1, 1, day); M.record(s, 'fretboard', 1, .9, day);
  const pool = M.mixPool(s, day);
  assert.deepEqual(pool.map(p => p.node.id).sort(), ['degrees', 'fretboard']);
  assert.ok(pool.find(p => p.node.id === 'fretboard').weight > pool.find(p => p.node.id === 'degrees').weight, 'Fewer stars → more review');
  assert.equal(M.recordMix(s, .6, day).ok, false);
  assert.equal(M.recordMix(s, .8, day).ok, true);
});

test('every music text has an English translation', () => {
  const texts = [];
  for (const b of M.BRANCHES) texts.push(b.name === 'Sång' ? null : b.name, b.tagline);
  for (const n of M.NODES) { texts.push(n.name, n.short, n.learn); texts.push(...(n.listen || [])); for (const l of n.levels) texts.push(l.name, l.goal, l.tip); }
  texts.push(...Object.values(T.DEGREE_FEEL));
  { const R = T.rng(5); for (const mode of ['direction', 'same', 'step', 'home']) for (let i = 0; i < 40; i++) { const q = T.compareQuestion(R, {mode}); texts.push(q.prompt, q.why, ...q.options.flatMap(o => [o.label, o.sub]), ...q.facts.map(f => f[0])); } }
  for (const c of Object.values(T.CHORDS)) texts.push(c.name);
  for (const sc of Object.values(T.SCALES)) texts.push(sc.name);
  for (const r of Object.values(T.BASS_RULES)) texts.push(r.name, r.text);
  for (const r of Object.values(T.RHYTHMS)) texts.push(r.name);
  for (const v of Object.values(T.VOICES)) texts.push(v.name);
  texts.push(...Object.values(T.intervalNames), ...Object.values(T.intervalSongs), ...new Set(Object.values(T.toneLabel)));
  const neutral = new Set(['1 – 3 – 5 – 8.', '1 – ♭3 – 5 – 8.', 'Sus4', 'Maj7', 'Somewhere Over the Rainbow', 'Smoke on the Water', 'The Simpsons']);
  const missing = texts.filter(t => t && !neutral.has(t) && en[t] === undefined);
  assert.deepEqual(missing, []);
});

const swedish = /[åäöÅÄÖ]|\b(och|att|med|för|på|av|till|inte|eller|utan|mot|över|efter|från|nivå|nivåer|spela|tonen|toner|lyssna|sjung|ackord|grundton|ters|kvint)\b/i;
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function app(lang = 'en') {
  const bundled = await build({entryPoints: ['src/app.js'], bundle: true, write: false, format: 'iife', target: 'es2022', plugins: [{name: 'demo', setup(b) { b.onLoad({filter: /[\\/]config\.js$/}, () => ({contents: "export const config={supabaseUrl:'',supabaseKey:'',googleEnabled:false,developmentModes:true}", loader: 'js'})); }}]});
  const dom = new JSDOM('<title>Beyond Self — Din expedition</title><div id="app"></div><div id="modal-root"></div><div id="toast"></div>', {url: 'https://beyond.example/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: new VirtualConsole()});
  const w = dom.window; w.scrollTo = () => {}; w.structuredClone = structuredClone;
  w.localStorage.setItem('arc-mode', 'demo'); w.localStorage.setItem('arc-lang', lang); w.localStorage.setItem('arc-skill-category', 'music');
  w.eval(bundled.outputFiles[0].text); await sleep(150);
  const q = s => w.document.querySelector(s), click = async a => { const el = q(`[data-action="${a}"]`) || q(`[data-mg="${a}"]`); assert.ok(el, a); el.click(); await sleep(60); };
  return {w, q, click};
}
const visible = el => [...el.querySelectorAll('*')].flatMap(n => [...n.childNodes].filter(c => c.nodeType === 3).map(c => c.nodeValue.trim())).filter(Boolean);

test('music tree in the app: opens, plays a round and reads fully in English', async t => {
  const {w, q, click} = await app('en');
  t.after(() => w.close());
  await click('nav:skills');
  assert.equal(q('.skt-body').dataset.skillCategory, 'music');
  const leftovers = texts => texts.filter(t => swedish.test(t));
  assert.deepEqual(leftovers(visible(q('.skt-body'))), [], 'Tree view');
  assert.match(q('.skt-body').textContent, /From your first note to your own bass line/);
  for (const id of M.NODES.map(n => n.id)) {
    await click('mt:node:' + id);
    assert.deepEqual(leftovers(visible(q('.modal'))), [], 'Sheet ' + id);
    await click('close');
  }
  // A full ear round: the overlay survives app re-renders and ends on a result screen.
  await click('mt:node:degrees');
  await click('mt:play:degrees:1');
  assert.equal(q('#modal-root').children.length, 0, 'The sheet closes when a game starts');
  assert.ok(q('.mg .mg-listen'));
  assert.deepEqual(leftovers(visible(q('.mg'))), [], 'Quiz screen');
  for (let i = 0; i < 10; i++) {
    q('.mg-opt').click(); await sleep(10);
    assert.deepEqual(leftovers(visible(q('.mg'))), [], 'Reveal');
    q('[data-mg="next"]').click(); await sleep(20);
  }
  await sleep(80);
  assert.ok(q('.mg-end'), 'Result screen');
  assert.deepEqual(leftovers(visible(q('.mg'))), [], 'Result');
  await click('close');
  assert.equal(q('.mg'), null);
  // Other game screens render in English too.
  for (const [id, n] of [['fretboard', 1], ['groove', 1], ['breath', 1]]) {
    await click('mt:node:' + id);
    await click(`mt:play:${id}:${n}`);
    assert.ok(q('.mg'), id);
    assert.deepEqual(leftovers(visible(q('.mg'))), [], 'Game ' + id);
    await click('close');
  }
  w.close();
});

test('music settings are saved in the account data without touching other data', async t => {
  const {w, q, click} = await app('sv');
  t.after(() => w.close());
  await click('nav:skills');
  const before = JSON.parse(w.localStorage.getItem('arc-state-demo') || 'null');
  await click('mt:node:pitch');
  await click('mt:voice:low:pitch');
  const saved = JSON.parse(w.localStorage.getItem('arc-state-demo'));
  assert.equal(saved.musicTree.voice, 'low');
  if (before) assert.deepEqual(saved.history, before.history, 'History is untouched');
  assert.equal(q('[data-action="mt:voice:low:pitch"]').getAttribute('aria-pressed'), 'true', 'The sheet reopens with the choice');
  w.close();
});

test('every recorded piano and bass note the audio engine asks for is shipped', async () => {
  const {soundFiles} = await import('../src/music-audio.js');
  const {existsSync, readFileSync} = await import('node:fs');
  const files = soundFiles();
  assert.equal(files.length, 28);
  for (const f of files) assert.ok(existsSync(new URL('../src/' + f.slice(2), import.meta.url)), f);
  assert.match(readFileSync(new URL('../scripts/build.mjs', import.meta.url), 'utf8'), /src\/sounds/);
});
