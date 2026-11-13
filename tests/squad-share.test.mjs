import test from 'node:test';
import assert from 'node:assert/strict';
import * as Q from '../src/squad-share.js';
import {when,weekPulse,tagline} from '../src/squad-ui.js';

test('picking habits and cardio to share is stored per day and never touches other keys',()=>{
 const s={squadShare:'broken'};Q.setShared(s,'2026-11-13','read',true);assert.ok(Q.isShared(s,'2026-11-13','read'));assert.ok(!Q.isShared(s,'2026-11-12','read'));
 Q.setShared(s,'2026-11-13','read',true);assert.equal(s.squadShare.entries.length,1,'no duplicates');
 Q.setShared(s,'2026-11-13','read',false);assert.ok(!Q.isShared(s,'2026-11-13','read'));
 Q.setAlways(s,'read',true);assert.ok(Q.isAlways(s,'read'));
 assert.ok(Q.cardioShared(s,{id:'r',kind:'run'}),'runs always share');assert.ok(!Q.cardioShared(s,{id:'w',kind:'walk'}));Q.setCardioShared(s,'w',true);assert.ok(Q.cardioShared(s,{id:'w',kind:'walk'}));
});
test('automatic posts read back as cards, hand-written text stays text',()=>{
 const body=Q.habitPostBody({name:'Läs en bok',value:10,target:10},'2026-11-13');
 assert.deepEqual(Q.parseActivity(body),{kind:'habit',done:true,name:'Läs en bok',value:10,target:10,minutes:null,date:'2026-11-13'});
 assert.equal(Q.parseActivity('På väg · Promenad · 10 / 30 · 30 min · 2026-11-13').minutes,30);
 assert.equal(Q.parseActivity('Klar · A · B · 1 / 1 · 2026-11-13').name,'A · B');
 assert.deepEqual(Q.parseActivity('Löpning klart · 5.2 km · 28.5 min · 2026-11-12'),{kind:'cardio',activity:'run',km:5.2,minutes:28.5,date:'2026-11-12'});
 for(const t of ['Klar med dagen!','Lite tröttare idag · men jag dök upp','Klar · 2026-11-13'])assert.equal(Q.parseActivity(t),null,t);
});
test('squad header numbers: time words, the week of workouts and the line of the day',()=>{
 const now=new Date('2026-11-13T12:00:00Z').getTime();
 assert.equal(when(new Date(now-30e3).toISOString(),now),'Nyss');assert.equal(when(new Date(now-12*60e3).toISOString(),now),'12 min sedan');
 const week=weekPulse([{workout:{kind:'strength',date:'2026-11-13'}},{body:'Löpning klart · 5 km · 30 min · 2026-11-12'},{body:'Klar · Läs en bok · 1 / 1 · 2026-11-13'},{workout:{kind:'strength',date:'2026-11-01'}}],'2026-11-13','2026-11-09');
 assert.deepEqual(week.map(d=>d.n),[0,0,0,1,1,0,0]);assert.ok(week[4].today);assert.ok(week[5].future);
 assert.match(tagline([{user_id:'a',trained_today:true},{user_id:'b'}],'b'),/Din tur/);
 assert.match(tagline([{user_id:'a',trained_today:true},{user_id:'b',trained_today:true}],'b'),/Alla/);
});
