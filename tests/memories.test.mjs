import test from 'node:test';
import assert from 'node:assert/strict';
import {memoriesByDay, streakRuns} from '../src/memories-ui.js';

const strength = (id, date, sets = 3) => ({id, date, startedAt: 0, finishedAt: 45 * 60000, pausedMs: 0, exercises: [{id: 'bench', sets: Array.from({length: sets}, () => ({done: true, kg: 50, reps: 8}))}]});

test('memories gather strength, programs, cardio and sports by day', () => {
  const s = {
    strength: {sessions: [strength('a', '2026-11-20'), {...strength('b', '2026-11-21'), finishedAt: null}]},
    training: {sessions: [{id: 't', date: '2026-11-20', title: 'Första steget', startedAt: 0, finishedAt: 600000}]},
    cardio: {sessions: [{id: 'c', kind: 'treadmill', date: '2026-11-22', seconds: 1800, km: 5}, {id: 'p', kind: 'padel', date: '2026-11-22', seconds: 3600, km: 0}]},
  };
  const m = memoriesByDay(s);
  assert.deepEqual(m['2026-11-20'].map(x => x.kind), ['strength', 'training']);
  assert.match(m['2026-11-20'][0].detail, /3 set · 45 min/);
  assert.deepEqual(m['2026-11-20'][0].names, ['Bänkpress']);
  assert.equal(m['2026-11-21'], undefined, 'an unfinished workout is not a memory');
  assert.deepEqual(m['2026-11-22'].map(x => [x.kind, x.title]), [['cardio', 'Löpband'], ['sport', 'Padel']]);
  assert.match(m['2026-11-22'][0].detail, /30 min · 5 km/);
});

test('streak runs allow one rest day and break after two', () => {
  const s = {strength: {sessions: ['2026-11-01', '2026-11-03', '2026-11-04', '2026-11-08', '2026-11-09', '2026-11-11'].map((d, i) => strength('s' + i, d))}};
  assert.deepEqual(streakRuns(s, '2026-11-12').map(r => [r.start, r.end, r.days]), [['2026-11-01', '2026-11-04', 3], ['2026-11-08', '2026-11-11', 3]]);
});
