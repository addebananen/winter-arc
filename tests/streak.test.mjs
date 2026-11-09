import test from 'node:test';
import assert from 'node:assert/strict';
import {trainingStreak} from '../src/strength.js';
import {streakStatus, streakCard} from '../src/streak-ui.js';

const T = '2026-11-20';
const mk = days => ({strength: {sessions: days.map((date, i) => ({id: 'w' + i, date, finishedAt: 1}))}});

test('one flame per workout day, one rest day allowed, two in a row resets', () => {
  assert.equal(trainingStreak(mk([]), T).days, 0);
  assert.equal(trainingStreak(mk(['2026-11-20']), T).days, 1);
  assert.equal(trainingStreak(mk(['2026-11-19']), T).days, 1, 'yesterday still counts');
  assert.equal(trainingStreak(mk(['2026-11-18']), T).days, 1, 'one rest day keeps it alive');
  assert.equal(trainingStreak(mk(['2026-11-17']), T).days, 0, 'two rest days in a row reset it');
  assert.equal(trainingStreak(mk(['2026-11-14', '2026-11-16', '2026-11-18', '2026-11-20']), T).days, 4, 'every other day keeps building');
  assert.equal(trainingStreak(mk(['2026-11-19', '2026-11-19', '2026-11-20']), T).days, 2, 'several workouts on one day give one flame');
  const broken = trainingStreak(mk(['2026-11-12', '2026-11-15', '2026-11-16', '2026-11-17']), T);
  assert.equal(broken.days, 0);
  assert.equal(broken.best, 3);
});

test('only finished Styrkehub workouts count', () => {
  const s = mk(['2026-11-20']);
  s.strength.sessions[0].finishedAt = null;
  s.training = {sessions: [{date: T, finishedAt: 1}]};
  s.cardio = {sessions: [{date: T, finishedAt: 1}]};
  assert.equal(trainingStreak(s, T).days, 0);
  assert.equal(trainingStreak(mk(['2026-11-21']), T).days, 0, 'future dates are ignored');
});

test('status tells you what to do next', () => {
  assert.equal(streakStatus(mk([]), T).title, 'Tänd din första flamma');
  const lit = streakStatus(mk(['2026-11-18', '2026-11-20']), T);
  assert.equal(lit.tone, 'lit');
  assert.match(lit.text, /senast på söndag/);
  assert.equal(streakStatus(mk(['2026-11-19']), T).tone, 'rest');
  assert.match(streakStatus(mk(['2026-11-19']), T).text, /senast imorgon/);
  const risk = streakStatus(mk(['2026-11-18']), T);
  assert.equal(risk.tone, 'risk');
  assert.equal(risk.atRisk, true);
  assert.match(streakStatus(mk(['2026-11-10', '2026-11-11']), T).text, /längsta streak är 2/);
});

test('card shows the last seven days and a start button until you have trained', () => {
  const I = n => `<i data-icon="${n}"></i>`, button = (l, a, c) => `<button data-action="${a}" class="${c}">${l}</button>`;
  const html = streakCard({I, button}, mk(['2026-11-14', '2026-11-18']), T);
  assert.equal((html.match(/streak-day /g) || []).length, 7);
  assert.equal((html.match(/streak-day on/g) || []).length, 2);
  assert.match(html, /data-action="quick:workout"/);
  assert.doesNotMatch(streakCard({I, button}, mk([T]), T), /quick:workout/);
  assert.doesNotMatch(streakCard({I, button}, mk([]), T, {cta: false}), /quick:workout/);
});
