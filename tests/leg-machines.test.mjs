// More leg exercises in machines (migration 034) and cardio machines on the Cardio tab (035).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {legMachineLifts} from '../src/strength-catalog-legs.js';
import * as S from '../src/strength.js';
import * as C from '../src/cardio.js';
import {hasFigure} from '../src/figure.js';
import {workoutVersion} from '../src/skills.js';
import {translate} from '../src/i18n.js';

test('the leg machine exercises are in the catalog, animated and identical in migration 034', () => {
  const legs = S.lifts.filter(e => e.muscle === 'Ben' && e.equipment === 'Maskin');
  assert.ok(legs.length >= 18, String(legs.length));
  for (const name of ['Lying leg curl', 'Machine hip thrust', 'Abductor (hips out)', 'Adductor (hips in)', 'Standing machine calf raise', 'Seated calf raise', 'Belt squat'])
    assert.ok(legMachineLifts.some(e => translate(e.name, 'en') === name), name);
  for (const e of legMachineLifts) {
    assert.equal(S.liftById[e.id], e);
    assert.ok(hasFigure(e), e.id + ' has an animation');
    assert.equal(workoutVersion(e.id), 34, e.id + ' waits for migration 034');
  }
  const sql = readFileSync(new URL('../supabase/034_leg_machines.sql', import.meta.url), 'utf8');
  const json = JSON.parse(sql.match(/jsonb_array_elements\('(.*)'::jsonb\)/)[1].replaceAll("''", "'"));
  assert.deepEqual(json, legMachineLifts);
});

test('Cardio has gym machines with their own animations and names in migration 035', () => {
  const machines = C.conditioning.filter(a => a.machine);
  assert.deepEqual(machines.map(a => translate(a.name, 'en')), ['Treadmill', 'Cross trainer', 'Exercise bike', 'Rowing machine', 'Stair climber', 'SkiErg', 'Air bike']);
  for (const a of machines) assert.ok(hasFigure({...a, equipment: 'Kroppsvikt'}), a.id);
  const sql = readFileSync(new URL('../supabase/035_cardio_machines.sql', import.meta.url), 'utf8');
  for (const a of C.activities) assert.match(sql, new RegExp(`'${a.id}'`), a.id + ' accepted by the database');
  for (const a of machines) assert.match(sql, new RegExp(`when '${a.id}' then '${a.name}'`), a.id + ' named in the feed');
  const s = {profile: {}, expedition: {start: '2026-11-01'}, cardio: {active: null, sessions: []}};
  C.logPast(s, 'treadmill', '2026-11-19', 5, 1800, '2026-11-19');
  assert.equal(s.cardio.sessions[0].kind, 'treadmill');
});
