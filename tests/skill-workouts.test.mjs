import test from 'node:test';
import assert from 'node:assert/strict';
import * as SK from '../src/skills.js';
const base=()=>({skills:{},expedition:{start:'2026-11-09'},strength:{sessions:[]},training:{sessions:[]}});
const session=(tree,n,values,date='2026-11-09',quality=true)=>({id:crypto.randomUUID(),date,finishedAt:Date.parse(date+'T12:00:00Z'),exercises:[{id:`sk-${tree}-${n}`,sets:values.map(reps=>({kg:0,reps,done:true,quality}))}]});
test('every existing progression has a loggable numeric goal and stable unique workout identity',()=>{assert.equal(SK.workoutCatalog.length,SK.trees.reduce((n,t)=>n+t.levels.length,0));assert.equal(new Set(SK.workoutCatalog.map(e=>e.id)).size,SK.workoutCatalog.length);for(const e of SK.workoutCatalog){assert.ok(e.skillSets>=1&&e.skillSets<=6);assert.ok(e.skillAmount>0&&e.skillAmount<=600);}assert.deepEqual(SK.workoutGoal(SK.treeById.handstand.levels[1]),{sets:3,amount:60,unit:'sek'});});
test('unfinished, partial and unconfirmed sets do not unlock skills',()=>{const s=base();s.strength.active=session('push',1,[8,8,8]);assert.equal(SK.levelOf(s,'push'),0);s.strength.sessions.push(session('push',1,[8,8]));assert.equal(SK.levelOf(s,'push'),0);s.strength.sessions.push(session('push',1,[8,8,8],'2026-11-10',false));assert.equal(SK.levelOf(s,'push'),0);});
test('completed workouts unlock sequential goals, once, and keep previous baseline records intact',()=>{const s=base();s.strength.sessions.push(session('push',1,[8,8,8]));assert.equal(SK.levelOf(s,'push'),1);s.strength.sessions.push(session('push',2,[8,8,8],'2026-11-10'));assert.equal(SK.levelOf(s,'push'),2);assert.deepEqual(s.skills,{});assert.equal(SK.summary(s).levels,2);assert.equal(SK.levelOf(s,'push'),2);});
test('advanced work cannot bypass missing prerequisites or retroactively unlock when prerequisites come later',()=>{const s=base();s.strength.sessions.push(session('hspu',1,[8,8,8]));assert.equal(SK.levelOf(s,'hspu'),0);s.skills.push={level:2,log:[]};assert.equal(SK.levelOf(s,'hspu'),1);const fresh=base();fresh.strength.sessions.push(session('hspu',1,[8,8,8]),session('push',1,[8,8,8],'2026-11-10'),session('push',2,[8,8,8],'2026-11-11'));assert.equal(SK.levelOf(fresh,'hspu'),0);fresh.strength.sessions.push(session('hspu',1,[8,8,8],'2026-11-12'));assert.equal(SK.levelOf(fresh,'hspu'),1);});
test('generic saved plank and pull-up variants count only with the required same-session sets',()=>{const s=base();s.strength.sessions.push({id:'plank',date:'2026-11-09',finishedAt:1,exercises:[{id:'plank',sets:[45,45,45].map(reps=>({reps,done:true}))}]});assert.equal(SK.levelOf(s,'core'),1);s.skills.pull={level:4,log:[]};s.strength.sessions.push({id:'pull',date:'2026-11-10',finishedAt:2,exercises:[{id:'pullup',sets:[8,8,8].map(reps=>({reps,done:true}))}]});assert.equal(SK.levelOf(s,'pull'),5);});

test('single timed goals use seconds and unlock from a matching completed hold',()=>{assert.deepEqual(SK.workoutGoal(SK.treeById.oahs.levels[6]),{sets:1,amount:10,unit:'sek'});const s=base();s.skills={oahs:{level:6,log:[]},handstand:{level:7,log:[]},straddle:{level:1,log:[]}};s.strength.sessions.push(session('oahs',7,[10]));assert.equal(SK.levelOf(s,'oahs'),7);});

test('new mobility progressions are appended, linked to workouts and shipped in migration 020',async()=>{
 const {readFile}=await import('node:fs/promises');
 assert.equal(SK.treeById.straddle.levels[0].anim,'pancake');assert.equal(SK.treeById.straddle.levels[1].anim,'straddle-lift');
 assert.equal(SK.treeById.straddle.levels.at(-1).anim,'middle-split');assert.equal(SK.treeById.hips.levels.at(-1).anim,'front-split');
 const sql=await readFile(new URL('../supabase/020_mobility_progressions.sql',import.meta.url),'utf8');
 for(const id of SK.mobilityUpdateIds){assert.ok(SK.workoutById[id],id);assert.match(sql,new RegExp(`"id":"${id}"`));}
 const s=base();s.skills.straddle={level:2,log:[]};assert.equal(SK.levelOf(s,'straddle'),2);
 s.strength.sessions.push(session('straddle',3,[45,45,45]),session('hips',1,[30,30,30],'2026-11-10'));
 assert.equal(SK.levelOf(s,'straddle'),3);assert.equal(SK.levelOf(s,'hips'),1);assert.equal(SK.workoutById['sk-hips-1'].unit,'sek');
});
