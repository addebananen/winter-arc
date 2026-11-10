import test from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../src/domain.js';
import * as S from '../src/strength.js';
import * as C from '../src/cardio.js';
import {XP_RULES_START, rulesDayXP, xpActivities} from '../src/xp-rules.js';

const before = '2026-11-09', after = XP_RULES_START;
const habit = name => D.makeHabit(D.library.find(h => h[0] === name), before);
// A fresh account whose expedition started the day before the new XP rules.
function mixedState() {
  const s = D.normalizeState(D.blankState(before), '2026-11-07T12:00:00Z');
  const own = {id: D.uid(), name: 'Gitarr', category: 'music', target: 1, unit: 'gång', cue: '', days: [0, 1, 2, 3, 4, 5, 6], start: before, xp: 15, archived: false};
  s.habits = [habit('Läs en bok'), habit('Promenad'), habit('Kall avslutning på duschen'), habit('Rörlighet'), habit('Styrketräning'), own];
  return {s, own};
}
const complete = (s, day) => { for (const h of s.habits) D.setProgress(s, h.id, h.target, day); };
const workout = (s, day, minutes, t0) => { S.startWorkout(s, day, ['bench'], t0); s.strength.active.exercises[0].sets = Array.from({length: 4}, () => ({kg: 40, reps: 8, done: true})); S.finishWorkout(s, t0 + minutes * 60000); };

test('XP earned before the new rules is kept; from the start date only the five activities give XP', () => {
  const {s, own} = mixedState();
  complete(s, before);
  const legacy = D.totalXP(s);
  assert.ok(legacy > 100, 'The old day still gives its XP, own habits and combo included');
  complete(s, after);
  const day = rulesDayXP(s, after);
  assert.deepEqual(day.parts, {strength: 40, read: 25, stretch: 20, cold: 15}, 'Promenad and own habits give no XP');
  assert.equal(D.totalXP(s), legacy + 100);
  assert.equal(D.dayTotalXP(s, after), 100);
  assert.ok(D.stats(s).Music > 0, 'Own habits still count in their category');
  assert.ok(s.history[after].entries[own.id].value >= 1);
});

test('a strength workout gives the same XP whatever its length, once per day, and the habit does not add to it', () => {
  const short = mixedState().s, long = mixedState().s;
  workout(short, after, 30, 1000);
  workout(long, after, 90, 1000);
  assert.equal(D.totalXP(short), 40);
  assert.equal(D.totalXP(long), 40);
  D.setProgress(long, long.habits.find(h => h.name === 'Styrketräning').id, 1, after);
  assert.equal(D.totalXP(long), 40, 'Workout and the strength habit count once');
});

test('running gives XP from a run session; other cardio, quests, combos and the skill tree do not', () => {
  const {s} = mixedState();
  C.start(s, 'walk', after, 1000); C.finish(s, 3, 1800, 1000 + 1800000);
  assert.equal(D.totalXP(s), 0, 'A walk gives no XP');
  C.start(s, 'run', after, 2000000); C.finish(s, 5, 1800, 2000000 + 1800000);
  assert.equal(D.totalXP(s), 35);
  for (const name of ['Läs en bok', 'Kall avslutning på duschen', 'Rörlighet']) D.setProgress(s, s.habits.find(h => h.name === name).id, s.habits.find(h => h.name === name).target, after);
  const quest = D.quests(s, after).find(q => q.id === 'three:' + after);
  D.claimQuest(s, quest.id, after);
  assert.equal(D.totalXP(s), 35 + 25 + 15 + 20, 'No quest bonus and no combo multiplier');
});

test('a lower goal gives proportionally less, and XP values match the agreed list', () => {
  assert.deepEqual(xpActivities.map(a => [a.habitName, a.xp]), [['Styrketräning', 40], ['Löpning', 35], ['Läs en bok', 25], ['Rörlighet', 20], ['Kall avslutning på duschen', 15]]);
  for (const a of xpActivities) assert.equal(D.library[a.habit][0], a.habitName, 'Library index ' + a.habit);
  const {s} = mixedState(), read = s.habits.find(h => h.name === 'Läs en bok');
  read.target = 5; D.setProgress(s, read.id, 5, after);
  assert.equal(rulesDayXP(s, after).parts.read, 13);
});
