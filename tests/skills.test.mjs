import test from 'node:test';
import assert from 'node:assert/strict';
import * as SK from '../src/skills.js';
import {moves, allMoves} from '../src/skills-moves.js';
import {prepare, sample, solve, lint, com, poseSVG, angleOf} from '../src/skills-anim.js';
import * as D from '../src/domain.js';

test('every skill level has an animation and every requirement points to a real level',()=>{
 for(const t of SK.trees){
  assert.ok(t.levels.length>=2,t.id);
  for(const l of t.levels)assert.ok(moves[l.anim],`${t.id}: ${l.anim}`);
  for(const [id,n] of [...(t.requires||[]),...t.levels.flatMap(l=>l.requires||[])]){assert.ok(SK.treeById[id],id);assert.ok(n>=1&&n<=SK.treeById[id].levels.length,`${t.id} -> ${id} ${n}`);}
 }
});

test('animations stay inside human joint limits and keep their contacts',()=>{
 for(const m of allMoves()){prepare(m);for(let i=0;i<=120;i++)assert.deepEqual(lint(solve(sample(m,m.total*i/120).pose)),[],`${m.id} @${i}`);}
});

test('balance skills keep the centre of mass over the support',()=>{
 for(const id of ['handstand','planche','front-lever','back-lever','l-sit','oahs']){const m=moves[id];prepare(m);const f=m.frames[m.key??0],J=solve(f.p).J,c=com({J});const support=id.includes('lever')?0:J.wristN[0];assert.ok(Math.abs(c[0]-support)<1.5,`${id}: ${c[0]} vs ${support}`);}
});

test('skill levels are sanitised, clamped and logged per account save',()=>{
 const s={skills:{handstand:{level:99,log:[[1,'2026-11-09'],['x','bad']]},nope:{level:3},'l-sit':'junk'}};
 SK.ensureSkills(s);
 assert.equal(s.skills.handstand.level,SK.treeById.handstand.levels.length);
 assert.deepEqual(s.skills.handstand.log,[[1,'2026-11-09']]);
 assert.equal(s.skills.nope,undefined);assert.equal(s.skills['l-sit'],undefined);
 SK.setLevel(s,'pull',3,'2026-11-10');assert.equal(SK.levelOf(s,'pull'),3);assert.deepEqual(s.skills.pull.log.at(-1),[3,'2026-11-10']);
 assert.throws(()=>SK.setLevel(s,'unknown',1,'2026-11-10'));
});

test('skill levels and completed goals strengthen the character without changing XP',()=>{
 const s=D.blankState('2026-11-09');const before=D.totalXP(s),base=D.stats(s);
 SK.setLevel(s,'push',2,'2026-11-09');SK.setLevel(s,'wrists',1,'2026-11-09');
 s.goals=[{id:'g',name:'Mål',category:'faith',target:5,current:5,unit:'st',deadline:'2026-12-01'}];
 const c=SK.characterStats(D.stats(s),s,D.categories);
 assert.equal(D.totalXP(s),before);
 assert.equal(c.Strength,base.Strength+SK.levelPoints(SK.treeById.push.levels[0])+SK.levelPoints(SK.treeById.push.levels[1]));
 assert.equal(c.Flexibility,base.Flexibility+SK.levelPoints(SK.treeById.wrists.levels[0]));
 assert.equal(c.Faith,base.Faith+SK.GOAL_POINTS);
});

test('trees unlock from their requirements but never hard-block self-reported levels',()=>{
 const s={skills:{}};SK.ensureSkills(s);
 assert.equal(SK.status(s,SK.treeById['muscle-up']),'locked');
 SK.setLevel(s,'muscle-up',2,'2026-11-09');assert.equal(SK.status(s,SK.treeById['muscle-up']),'progress');
 SK.setLevel(s,'pull',6,'2026-11-09');SK.setLevel(s,'dip',3,'2026-11-09');SK.setLevel(s,'muscle-up',0,'2026-11-09');
 assert.equal(SK.status(s,SK.treeById['muscle-up']),'open');
});

test('skill animations draw the same human figure as the exercise animations',()=>{
 for(const m of allMoves()){
  prepare(m);
  for(let i=0;i<m.frames.length;i++){
   const big=poseSVG(m,i);
   assert.match(big,/fill="#3b2e27"/,m.id+': hair');
   assert.match(big,/fill="#5b6570"/,m.id+': t-shirt');
   assert.doesNotMatch(big,/NaN|undefined/,m.id+': broken path');
   assert.doesNotMatch(big,/<line[^>]*stroke-width="13.5"/,m.id+': old stick legs');
  }
 }
});

test('hands behind on a bench: the elbows bend backwards like a real arm and the fingers point forward',()=>{
 const m=moves['bench-shoulder'];prepare(m);
 const wrap=a=>((a%360)+540)%360-180;
 for(let i=0;i<=20;i++){
  const {J}=solve(sample(m,m.total*i/20).pose);
  for(const S of ['N','F']){
   const ua=angleOf([J['elbow'+S][0]-J['sh'+S][0],J['elbow'+S][1]-J['sh'+S][1]]),fa=angleOf([J['wrist'+S][0]-J['elbow'+S][0],J['wrist'+S][1]-J['elbow'+S][1]]);
   assert.ok(wrap(ua-fa)>=-2,'elbow '+S+' bends the impossible way: '+wrap(ua-fa).toFixed(0)+'°');
   assert.ok(J['hand'+S][0]>J['wrist'+S][0],'fingers point forward');
  }
 }
});
