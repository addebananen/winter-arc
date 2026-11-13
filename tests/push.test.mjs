import test from 'node:test';
import assert from 'node:assert/strict';
import {activeWorkout, workoutNotice} from '../src/push.js';

test('a running strength workout or cardio session becomes a lock-screen notice with start time and minutes',()=>{
 const start=Date.UTC(2026,10,13,17,2),now=start+23*60000+30000;
 assert.equal(activeWorkout({strength:{active:null},cardio:{active:null}},now),null);
 const strength=activeWorkout({strength:{active:{startedAt:start,pausedMs:3*60000,pausedAt:null}}},now);
 assert.equal(Math.floor(strength.minutes),20,'Paused time is not counted');
 const sv=workoutNotice(strength,'sv');assert.match(sv.title,/^Pågående pass · Styrkepass$/);assert.match(sv.body,/^Startade \d\d:\d\d · 20 min hittills/);
 assert.match(workoutNotice(strength,'en').title,/^Workout running · Strength workout$/);
 const run=activeWorkout({cardio:{active:{kind:'run',startedAt:start}},strength:{active:null}},now);
 assert.equal(run.title,'Löpning');assert.match(workoutNotice(run,'sv').body,/23 min/);
 assert.match(workoutNotice({...strength,paused:true},'sv').title,/^Pausat pass/);
});
