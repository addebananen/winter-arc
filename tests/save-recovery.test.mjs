import test from 'node:test';
import assert from 'node:assert/strict';
import {saveWithRecovery} from '../src/save-recovery.js';
test('a committed workout with lost reply recovers the canonical state without finishing twice',async()=>{
 const candidate={strength:{active:null,sessions:[{id:'w',startedAt:100,finishedAt:500,pausedAt:null,pausedMs:0,exercises:[{kg:60,reps:5}]}]}},canonical=structuredClone(candidate);canonical.strength.sessions[0].finishedAt=530;
 let saves=0;const result=await saveWithRecovery(candidate,{save:async()=>{saves++;throw Error('Network lost');},load:async()=>canonical,mutate:()=>assert.fail('must not re-finish'),normalize:()=>{}});
 assert.equal(saves,1);assert.equal(result.strength.sessions[0].finishedAt,530);
});
test('JSON key order cannot turn a committed habit save into a failed save',async()=>{
 const result=await saveWithRecovery({name:'Read',count:1},{save:async()=>{throw Error('offline');},load:async()=>({count:1,name:'Read'}),mutate:()=>assert.fail(),normalize:()=>{}});assert.equal(result.count,1);
});
test('recovery never accepts different reps, images or private tracking values',async()=>{
 for(const field of ['reps','photo','startedAt'])await assert.rejects(saveWithRecovery({private:{[field]:1}},{save:async()=>{throw Error('network');},load:async()=>({private:{[field]:2}}),mutate:()=>assert.fail(),normalize:()=>{}}),/network/);
});
test('revision retry keeps concurrent changes and replays intent once',async()=>{
 let n=0;const result=await saveWithRecovery({name:'new',body:[]},{save:async s=>{if(!n++)throw Error('Revision conflict');return s;},load:async()=>({name:'old',body:['private photo']}),mutate:s=>s.name='new',normalize:()=>{}});assert.deepEqual(result,{name:'new',body:['private photo']});assert.equal(n,2);
});
