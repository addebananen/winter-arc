import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../src/cardio.js';
import * as D from '../src/domain.js';
import * as S from '../src/strength.js';
import {movementArt} from '../src/strength-art.js';
const base=()=>{const s=D.blankState('2026-11-09');D.normalizeState(s);return s;};
test('running rank is monotonic, estimates only supported distances and does not invent body-size bonuses',()=>{assert.equal(C.runningRank(5,1800).name,'Guld');assert.ok(C.runningRank(5,1500).level>C.runningRank(5,2100).level);assert.equal(C.runningRank(.5,120).level,0);assert.equal(C.runningRank(42.2,10000).level,0);assert.equal(C.activities.filter(a=>a.ranked).length,1);});
test('cardio timer validates duration and single daily activity and preserves unranked sports',()=>{const s=base();C.start(s,'volleyball','2026-11-09',1000);assert.throws(()=>C.finish(s,0,1800,2000),/Kontrollera/);C.finish(s,0,1800,1801000);assert.equal(C.cardioXP(s),60);assert.equal(C.record(s).level,0);assert.throws(()=>C.start(s,'volleyball','2026-11-09'),/redan/);assert.equal(D.totalXP(s),60);});
test('cardio shares daily XP with strength habits and avoids rewarding the same time twice',()=>{const s=base();C.start(s,'run','2026-11-09',1000);C.finish(s,5,1800,1801000);const h=D.makeHabit(D.library[0],'2026-11-09');h.durationMinutes=30;s.habits.push(h);D.setProgress(s,h.id,1,'2026-11-09');assert.equal(C.cardioXP(s),0);assert.equal(D.totalXP(s),60);});
test('every catalog entry and sport produces valid animated art with its own accessible title',()=>{for(const e of [...S.lifts,...C.activities.map(a=>({...a,equipment:'Kroppsvikt',unit:'tid'}))]){const art=movementArt(e,true);assert.ok(art.includes(e.name));assert.doesNotMatch(art,/NaN|undefined/);assert.match(art,/<animate/);}});
test('exercise art: seated chest press, separate dumbbells, barbell plates and a muscular figure', () => {
  const art = id => movementArt(S.liftById[id], true);
  const chest = art('machine-chest');
  assert.match(chest, /<polygon points="[^"]*"/, 'Torso is a shaped body, not a line');
  assert.ok(chest.includes('M74 54L78 110'), 'The chest press has a seat with a backrest');
  assert.doesNotMatch(chest, /M48 112H125/, 'The chest press is not a lying bench press');
  for (const id of ['db-curl', 'lateral', 'seated-db-press', 'lunge']) {
    const svg = art(id);
    assert.equal((svg.match(/<rect x="-11"/g) || []).length, 2, id + ': one dumbbell in each hand');
    assert.doesNotMatch(svg, /stroke="#a8bbc4" stroke-width="4" stroke-linecap="round"/, id + ': no long bar between the hands');
  }
  assert.match(art('squat'), /height="28"/, 'A barbell has plates');
  assert.match(art('bench'), /<circle r="13"/, 'Seen from the side, a barbell is a plate');
  assert.match(art('db-curl'), /stroke-width="12"/, 'Thick upper arms');
});
