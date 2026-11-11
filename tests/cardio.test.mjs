import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../src/cardio.js';
import * as D from '../src/domain.js';
import * as S from '../src/strength.js';
import {movementArt} from '../src/strength-art.js';
import {framesOf, bones, poseAt, phase} from '../src/figure.js';
const base=()=>{const s=D.blankState('2026-11-09');D.normalizeState(s);return s;};
test('running rank is monotonic, estimates only supported distances and does not invent body-size bonuses',()=>{assert.equal(C.runningRank(5,1800).name,'Guld');assert.ok(C.runningRank(5,1500).level>C.runningRank(5,2100).level);assert.equal(C.runningRank(.5,120).level,0);assert.equal(C.runningRank(42.2,10000).level,0);assert.equal(C.activities.filter(a=>a.ranked).length,1);});
test('cardio timer validates duration and single daily activity and preserves unranked sports',()=>{const s=base();C.start(s,'volleyball','2026-11-09',1000);assert.throws(()=>C.finish(s,0,1800,2000),/Kontrollera/);C.finish(s,0,1800,1801000);assert.equal(C.cardioXP(s),60);assert.equal(C.record(s).level,0);assert.throws(()=>C.start(s,'volleyball','2026-11-09'),/redan/);assert.equal(D.totalXP(s),60);});
test('cardio shares daily XP with strength habits and avoids rewarding the same time twice',()=>{const s=base();C.start(s,'run','2026-11-09',1000);C.finish(s,5,1800,1801000);const h=D.makeHabit(D.library[0],'2026-11-09');h.durationMinutes=30;s.habits.push(h);D.setProgress(s,h.id,1,'2026-11-09');assert.equal(C.cardioXP(s),0);assert.equal(D.totalXP(s),60);});
test('every catalog entry and sport produces valid animated art with its own accessible title',()=>{for(const e of [...S.lifts,...C.activities.map(a=>({...a,equipment:'Kroppsvikt',unit:'tid'}))]){const art=movementArt(e,true);assert.ok(art.includes(e.name));assert.doesNotMatch(art,/NaN|undefined/);assert.match(art,/data-figure=|<animate/,e.id+' moves or breathes');}});
test('exercise figure: rigid bones in every frame, planted feet, knees forward, elbows back', () => {
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  for (const e of [...S.lifts.filter(l => !l.skillTree), ...C.activities.map(a => ({...a, equipment: '', muscle: ''}))]) {
    const frames = framesOf(e);
    assert.ok(frames.length > 1, e.id + ' has a figure');
    for (const fr of frames) for (const L of Object.values(fr.limbs)) {
      assert.ok(Math.abs(dist(L.root, L.mid) - (L.leg ? bones.thigh : bones.uarm)) < .05, e.id + ': upper bone keeps its length');
      assert.ok(Math.abs(dist(L.mid, L.end) - (L.leg ? bones.shin : bones.farm)) < .05, e.id + ': lower bone keeps its length');
    }
  }
  const squat = framesOf(S.liftById.squat), bottom = squat.at(-1).limbs.ln;
  for (const fr of squat) assert.ok(dist(fr.limbs.ln.end, squat[0].limbs.ln.end) < .5, 'The feet stay planted through the squat');
  assert.ok(bottom.mid[0] > bottom.root[0] && bottom.mid[0] > bottom.end[0] - 4, 'Knees travel forward in the squat');
  assert.ok(squat.at(-1).P[1] - squat[0].P[1] > 30, 'The hips go down');
  const bench = framesOf(S.liftById.bench), press = bench.at(-1).limbs.an;
  assert.ok(press.mid[1] < bench[0].limbs.an.mid[1], 'The bar moves up in the bench press');
  assert.ok(bench[0].limbs.an.mid[1] > bench[0].limbs.an.end[1], 'Elbows point down under the bar');
});

test('exercise figure: seated chest press, separate dumbbells, barbell plates and the worked muscle highlighted', () => {
  const chest = framesOf(S.liftById['machine-chest']);
  assert.ok(Math.abs(chest[0].P[1] - chest[0].S[1]) > 35 && chest[0].P[1] > 100, 'Chest press sits upright on a seat');
  assert.ok(chest.at(-1).limbs.an.end[0] - chest[0].limbs.an.end[0] > 20, 'and pushes the handles forward');
  const still = id => movementArt(S.liftById[id], false);
  assert.equal((still('db-curl').match(/a8 8 0 1 0 16 0/g) || []).length, 2, 'One dumbbell in each hand');
  assert.equal((still('lateral').match(/fill="#1f2a30"/g) || []).length, 4, 'Two dumbbells with two plates each in front view');
  assert.match(still('bench'), /a16 16 0 1 0 32 0/, 'A barbell seen from the side is a plate');
  assert.match(still('bench'), /fill="#ff7a59"/, 'The chest is highlighted for bench press');
  assert.match(still('plank'), /movement-art/);
  assert.match(movementArt(S.liftById.plank, true), /animateTransform/, 'A hold breathes');
  const live = movementArt(S.liftById.squat, true);
  assert.match(live, /data-figure="squat\|/, 'Moves are posed live on every frame');
  assert.doesNotMatch(live, /<animate attributeName="d"/, 'No shape morphing (it flattened limbs on iPhone)');
});

test('exercise figure: hands close around what they hold, rest flat on the floor and open when reaching', () => {
  const bench = framesOf(S.liftById.bench)[0].limbs.an.hand;
  assert.equal(bench.style, 'fist');
  assert.equal(bench.curl, 1, 'A fist around the bar');
  const push = framesOf(S.liftById.pushup)[0].limbs.an;
  assert.equal(push.hand.style, 'flat');
  assert.deepEqual(push.hand.d.map(v => Math.round(v * 100) / 100), [1, 0], 'Fingers point forward along the floor');
  assert.equal(framesOf(S.liftById.situp)[0].limbs.an.hand.style, 'open');
  const svg = movementArt(S.liftById.bench, false);
  assert.match(svg, /stroke-width=".7"/, 'Knuckle creases are drawn');
  assert.ok(svg.indexOf('a16 16 0 1 0 32 0') > svg.lastIndexOf('stroke-width=".7"'), 'Seen from the side, the plate is in front of the hand and hides it');
  const curl = movementArt(S.liftById['db-curl'], false), discs = [...curl.matchAll(/a8 8 0 1 0 16 0/g)].map(m => m.index), hand = curl.lastIndexOf('stroke-width=".7"');
  assert.ok(discs[0] < hand && discs[1] > hand, 'The far dumbbell is behind the body, the near one in front of the hand');
  const front = movementArt(S.liftById.lateral, false);
  assert.ok(front.indexOf('fill="#1f2a30"') < front.lastIndexOf('stroke-width=".7"'), 'From the front, the fingers wrap in front of the dumbbell');
});

test('exercise figure: no elbow or knee switches side during a movement, and live frames redraw every shape', () => {
  const turn = L => Math.sign((L.end[0] - L.root[0]) * (L.mid[1] - L.root[1]) - (L.end[1] - L.root[1]) * (L.mid[0] - L.root[0]));
  const bent = L => Math.hypot(L.root[0] - L.mid[0], L.root[1] - L.mid[1]) + Math.hypot(L.mid[0] - L.end[0], L.mid[1] - L.end[1]) - Math.hypot(L.root[0] - L.end[0], L.root[1] - L.end[1]) > .5;
  for (const e of [...S.lifts.filter(l => !l.skillTree), ...C.activities.map(a => ({...a, equipment: '', muscle: ''}))]) {
    const frames = framesOf(e);
    for (const key of Object.keys(frames[0].limbs)) {
      const sides = new Set(frames.map(f => f.limbs[key]).filter(bent).map(turn));
      assert.ok(sides.size <= 1, e.id + ' ' + key + ' keeps its bend direction');
    }
  }
  assert.equal(phase(0, 3.2), 0, 'Holds at the start');
  assert.equal(phase(1.6, 3.2), 1, 'Holds at the end');
  assert.ok(phase(.8, 3.2) > 0 && phase(.8, 3.2) < 1);
  const html = movementArt(S.liftById['db-row'], true), paths = [...html.matchAll(/<path data-i="(\d+)" d="([^"]+)"/g)].map(m => ({dataset: {i: m[1]}, d: m[2], getAttribute() { return this.d; }, setAttribute(_, v) { this.d = v; }}));
  const before = paths.map(p => p.d), svg = {querySelectorAll: () => paths}, memo = {};
  for (let k = 0; k <= 1; k += .05) poseAt(svg, S.liftById['db-row'], k, memo);
  assert.ok(paths.some((p, i) => p.d !== before[i]), 'The pose changes');
  assert.ok(Object.keys(memo).length > 10, 'Shapes remember their side between frames');
});
