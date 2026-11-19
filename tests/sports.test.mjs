// Sport as its own category (migration 032): team, racket, indoor climbing and combat sports, logged with
// the activity timer like running, with their own name in the squad feed.
import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../src/cardio.js';
import * as D from '../src/domain.js';
import * as Q from '../src/squad-share.js';
import * as SC from '../src/schema.js';
import {rulesDayXP,sportXP} from '../src/xp-rules.js';

test('Cardio holds running, walking and gym machines, Sport holds the sports with bouldering and roped climbing indoors',()=>{
  assert.deepEqual(C.conditioning.filter(a=>!a.machine).map(a=>a.id),['run','walk']);for(const id of ['treadmill','crosstrainer','exercise-bike','rowing-machine','stair-climber','ski-erg','air-bike'])assert.ok(C.conditioning.find(a=>a.id===id)?.machine,id);assert.ok(!C.sports.some(a=>a.machine));
  const names=C.sports.map(a=>a.name);
  for(const n of ['Volleyboll','Bouldering','Repklättring','Fotboll','Basket','Innebandy','Padel','Tennis'])assert.ok(names.includes(n),n);
  assert.match(C.sports.find(a=>a.id==='boulder').place,/inomhus/);
  assert.match(C.sports.find(a=>a.id==='rope-climb').place,/inomhus på höjd med rep/);
  // The earlier general climbing is no longer offered, but saved sessions keep their name.
  assert.ok(!C.sports.some(a=>a.id==='climb'));assert.equal(C.activities.find(a=>a.id==='climb').name,'Klättring');assert.ok(C.isSport('climb'));
  assert.ok(C.sports.every(a=>!a.ranked&&!a.name.includes(' · ')));
  const s={profile:{},cardio:{active:null,sessions:[]}};C.start(s,'football','2026-11-17',1000);assert.equal(s.cardio.active.kind,'football');
  assert.deepEqual(Q.parseActivity('Fotboll klart · 0 km · 90.0 min · 2026-11-17'),{kind:'cardio',activity:'football',km:0,minutes:90,date:'2026-11-17'});
});

test('the database accepts the new sports and names them in the squad feed (032)',async t=>{
 const db=new PGlite();await db.waitReady;
 try{
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;create schema extensions;
  create table auth.users(id uuid primary key,created_at timestamptz default '2026-11-07T12:00:00Z');
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  create function extensions.gen_random_bytes(n integer) returns bytea language sql volatile as $$select decode(substr(repeat(md5(random()::text),4),1,n*2),'hex')$$;
  create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
  create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
  create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;
  alter table storage.objects enable row level security;
  grant usage on schema public,auth,storage to authenticated;
  grant select,insert,delete on storage.objects to authenticated;`);
  const dir=new URL('../supabase/',import.meta.url);
  const files=(await readdir(dir)).filter(f=>/^0\d\d_.*\.sql$/.test(f)&&f<'028').sort();
  for(const f of files){let sql=await readFile(new URL(f,dir),'utf8');if(f.startsWith('001'))sql=sql.replace('create extension if not exists pgcrypto with schema extensions;','');await db.exec(sql);}
  for(const f of ['028_schema_status.sql','031_squad_feed_choice.sql','032_sports.sql','033_logged_activities.sql','035_cardio_machines.sql'])await db.exec(await readFile(new URL(f,dir),'utf8'));
  const st0=(await db.query('select public.schema_status() s')).rows[0].s;assert.ok(st0.installed.includes('032_sports'));assert.ok(SC.MIGRATIONS.includes('032_sports'));
  const id='11111111-1111-4111-8111-111111111111';await db.query('insert into auth.users(id) values($1)',[id]);
  const as=async()=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated');};
  await as();let st=D.normalizeState(D.blankState(),'2026-11-07T12:00:00Z'),rev=0;
  const save=async x=>{const r=(await db.query('select public.save_arc_state_v3($1::jsonb,$2) result',[JSON.stringify(x),rev])).rows[0].result;rev=Number(r.revision);return r.payload;};
  st=await save(st);await db.query("select public.create_squad('Sport test')");
  const day=D.dateKey(new Date(),st.timezone);
  await t.test('a sport outside the list is still refused',async()=>{const bad=structuredClone(st);bad.cardio={active:{id:'x1',kind:'curling',date:day,startedAt:1,weight:null,height:null},sessions:[]};await assert.rejects(save(bad),/Välj en ny aktivitet/);});
  st.cardio={active:{id:'fb1',kind:'football',date:day,startedAt:1,weight:null,height:null},sessions:[]};st=await save(st);assert.ok(st.cardio.active.startedAt>10000);
  await db.exec('reset role');st.cardio.active.startedAt=Date.now()-5401000;await db.query('update public.user_states set payload=$2 where user_id=$1',[id,JSON.stringify(st)]);await as();
  st.cardio.sessions.push({...st.cardio.active,km:0,seconds:5400,finishedAt:Date.now()});st.cardio.active=null;Q.setCardioShared(st,'fb1',true);st=await save(st);
  const posts=(await db.query('select body from public.posts')).rows;
  assert.equal(posts.length,1);assert.match(posts[0].body,/^Fotboll klart · 0 km · 90.0 min · /);
  assert.deepEqual(Q.parseActivity(posts[0].body).activity,'football');
  await t.test('033: a forgotten session is logged afterwards for today or yesterday, never earlier',async()=>{
   const yd=C.yesterdayOf(day),old=C.yesterdayOf(yd);st.expedition.start=old;
   await db.exec('reset role');await db.query('update public.user_states set payload=$2 where user_id=$1',[id,JSON.stringify(st)]);await as();
   let x=structuredClone(st);C.logPast(x,'padel',yd,0,3600,day);x=await save(x);st=x;assert.equal(st.cardio.sessions.find(w=>w.kind==='padel').manual,true);
   x=structuredClone(st);C.logPast(x,'run',day,5,1800,day);st=await save(x);
   const early=structuredClone(st);early.cardio.sessions.push({id:'old1',kind:'tennis',date:old,startedAt:Date.now()-3600000,finishedAt:Date.now(),seconds:3600,km:0,weight:null,height:null,manual:true});await assert.rejects(save(early),/idag eller igår/);
   assert.throws(()=>C.logPast(structuredClone(st),'tennis',old,0,3600,day),/idag eller igår/);
   const twice=structuredClone(st);twice.cardio.sessions.push({...twice.cardio.sessions.find(w=>w.kind==='padel'),id:'dup'});await assert.rejects(save(twice),/en gång per dag/);
   const fake=structuredClone(st);fake.cardio.sessions.push({id:'f1',kind:'tennis',date:day,startedAt:Date.now()-60000,finishedAt:Date.now(),seconds:3600,km:0,weight:null,height:null,manual:true});await assert.rejects(save(fake),/Kontrollera/);
   const running=structuredClone(st);running.cardio.active={id:'r2',kind:'walk',date:day,startedAt:1,weight:null,height:null};running.cardio.sessions.push({id:'t2',kind:'tennis',date:day,startedAt:Date.now()-3600000,finishedAt:Date.now(),seconds:3600,km:0,weight:null,height:null,manual:true});await assert.rejects(save(running),/Avsluta|Bara/);
  });
  await t.test('035: a treadmill session is saved, named in the squad feed and gives XP like sports',async()=>{
   const x=structuredClone(st);const w=C.logPast(x,'treadmill',day,5,1800,day);Q.setCardioShared(x,w.id,true);st=await save(x);
   const body=(await db.query("select body from public.posts where body like 'Löpband%'")).rows[0]?.body;assert.match(body,/^Löpband klart · 5 km · 30.0 min · /);assert.equal(Q.parseActivity(body).activity,'treadmill');
   const bad=structuredClone(st);bad.cardio.sessions.push({id:'z',kind:'hoverboard',date:day,startedAt:Date.now()-1800000,finishedAt:Date.now(),seconds:1800,km:0,weight:null,height:null,manual:true});await assert.rejects(save(bad),/Kontrollera/);
  });
  await t.test('033: sports give 0.5 XP per minute, at most 30 a day, the same on the server as in the app',async()=>{
   const yd=C.yesterdayOf(day);
   const server=async(p,d)=>{await db.exec('reset role');const xp=(await db.query('select public.arc_rules_day_xp($1::jsonb,$2) xp',[JSON.stringify(p),d])).rows[0].xp;await as();return xp;};
   assert.equal(sportXP(st,yd),yd<'2026-11-17'?0:30);assert.equal(await server(st,yd),rulesDayXP(st,yd).total);
   assert.equal(rulesDayXP(st,day).parts.sport,30);assert.equal(rulesDayXP(st,day).parts.run,35);assert.equal(await server(st,day),rulesDayXP(st,day).total);
   const half={...st,cardio:{active:null,sessions:[{id:'h',kind:'tennis',date:'2026-11-20',seconds:1830,km:0}]}};assert.equal(sportXP(half,'2026-11-20'),15);assert.equal(await server(half,'2026-11-20'),15);
   const long={...st,cardio:{active:null,sessions:[{id:'l',kind:'padel',date:'2026-11-20',seconds:7200,km:0},{id:'w',kind:'walk',date:'2026-11-20',seconds:7200,km:3}]}};assert.equal(sportXP(long,'2026-11-20'),30);assert.equal(await server(long,'2026-11-20'),30);
   const before={...st,cardio:{active:null,sessions:[{id:'b',kind:'padel',date:'2026-11-16',seconds:3600,km:0}]}};assert.equal(sportXP(before,'2026-11-16'),0);assert.equal(await server(before,'2026-11-16'),0);
  });
 }finally{await db.close();}
});
