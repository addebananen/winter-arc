import test from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../src/domain.js';
import * as F from '../src/fitness.js';
import {musicLessons,musicHabits,musicSources,musicProgress} from '../src/music.js';
const day='2026-11-09',fresh=()=>D.normalizeState(D.blankState(day),'2026-11-07T12:00:00Z');
test('music curriculum has ten levels, three tracks, instructions and verified-source links',()=>{
 assert.equal(musicLessons.length,30);assert.equal(new Set(musicLessons.map(l=>l.id)).size,30);
 for(let n=1;n<=10;n++){const group=musicLessons.filter(l=>l.difficulty===n);assert.deepEqual(group.map(l=>l.track),['theory','ear','voice']);for(const l of group){assert.equal(l.steps.length,3);assert.ok(l.checkpoint);for(const k of l.sources)assert.ok(new URL(musicSources[k][1]).protocol==='https:');}}
 assert.equal(musicHabits.length,8);assert.equal(D.library[60][0],'Gehörträning');assert.equal(D.library[0][0],'Styrketräning');
});
test('music course rewards Music once per lesson/day and preserves course progress across normalization',()=>{
 const s=fresh();F.saveChallenge(s,'music-ear-1',day,'20 minuter, 7 av 10 rätt.');assert.equal(D.stats(s).Music,30);assert.equal(D.totalXP(s),30);assert.throws(()=>F.saveChallenge(s,'music-ear-1',day,'igen'),/redan/);
 const restored=D.normalizeState(JSON.parse(JSON.stringify(s)));assert.equal(musicProgress(restored).count,1);assert.equal(D.stats(restored).Music,30);assert.equal(D.stats(restored).Wisdom,0);
});
test('music habits and lessons share base rewards in either logging order',()=>{
 for(const first of ['habit','course']){const s=fresh();s.habits=[D.makeHabit(D.library[60],day)];const h=()=>D.setProgress(s,s.habits[0].id,20,day),c=()=>F.saveChallenge(s,'music-ear-1',day,'20 min');if(first==='habit'){h();c();}else{c();h();}assert.equal(D.totalXP(s),30);assert.equal(D.stats(s).Music,30);F.saveChallenge(s,'music-theory-1',day,'15 min');assert.equal(D.totalXP(s),55);D.setProgress(s,s.habits[0].id,0,day);assert.equal(D.totalXP(s),55);}
});
test('course rewards respect the shared challenge cap and no pre-season credit',()=>{
 const s=fresh();for(const l of musicLessons)F.saveChallenge(s,l.id,day,'Övat och reflekterat');assert.equal(D.totalXP(s),100);assert.equal(D.stats(s).Music,100);assert.equal(musicProgress(s).count,30);assert.throws(()=>F.saveChallenge(fresh(),'music-voice-1','2026-11-08','övat'),/startat/);
});
