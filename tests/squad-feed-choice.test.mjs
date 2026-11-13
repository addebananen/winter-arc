// Migration 031: only workouts and runs reach the squad feed by themselves, chosen habits follow the
// member's pick, workout photos attach to their own post, and photo reactions stay inside the squad.
import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../src/domain.js';
import * as Q from '../src/squad-share.js';

test('squad feed choice, workout photos and photo reactions (031)',async t=>{
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
  await db.exec(await readFile(new URL('031_squad_feed_choice.sql',dir),'utf8'));
  const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222',c='33333333-3333-4333-8333-333333333333';
  await db.query('insert into auth.users(id) values($1),($2),($3)',[a,b,c]);
  const as=async uid=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid]);await db.exec('set role authenticated');};
  for(const id of [a,b,c]){await as(id);await db.query('select public.save_arc_state($1::jsonb,0)',[JSON.stringify(D.normalizeState(D.blankState(),'2026-11-07T12:00:00Z'))]);}
  await as(a);const squad=(await db.query("select public.create_squad('Northbound') as id")).rows[0].id;const code=(await db.query('select public.get_squad_code($1) as code',[squad])).rows[0].code;
  await as(b);await db.query('select public.join_squad($1)',[code]);
  await db.exec('reset role');
  const base=(await db.query('select payload from public.user_states where user_id=$1',[a])).rows[0].payload;
  const save=async x=>db.query('update public.user_states set payload=$2 where user_id=$1',[a,JSON.stringify(x)]);
  const posts=async()=>(await db.query('select id,body,image_path from public.posts where user_id=$1 order by body',[a])).rows;
  const day='2026-11-12',s=structuredClone(base);
  s.history[day]={entries:{read:{name:'Läs en bok',value:10,target:10},walk:{name:'Promenad',value:30,target:30}}};
  s.strength={...(s.strength||{}),sessions:[{id:'w1',date:day,startedAt:0,finishedAt:45*60000,exercises:[{id:'bench',sets:[{kg:60,reps:8,done:true}]}]}]};
  s.cardio={sessions:[{id:'run1',kind:'run',date:day,km:5,seconds:1800},{id:'walk1',kind:'walk',date:day,km:2,seconds:1500}]};
  s.goals=[{id:'g1',name:'Read books',current:2,target:10,unit:'books'}];s.claims={['three:'+day]:{date:day}};

  await t.test('habits, walks, goals and quests stay private unless chosen; workouts and runs post',async()=>{
   await save(s);const rows=await posts();
   assert.deepEqual(rows.map(r=>r.body.split(' · ')[0]),['Löpning klart','Styrkepass klart']);
  });
  await t.test('a habit picked at check-in is shared, unsharing removes the post, sharing again brings it back',async()=>{
   Q.setShared(s,day,'read',true);await save(s);assert.equal((await posts()).filter(r=>r.body.includes('Läs en bok')).length,1);
   const first=(await posts()).find(r=>r.body.includes('Läs en bok')).id;
   Q.setShared(s,day,'read',false);await save(s);assert.equal((await posts()).filter(r=>r.body.includes('Läs en bok')).length,0);
   Q.setShared(s,day,'read',true);await save(s);const again=(await posts()).find(r=>r.body.includes('Läs en bok'));assert.ok(again);assert.notEqual(again.id,first);
   s.history[day].entries.read.value=0;await save(s);assert.equal((await posts()).filter(r=>r.body.includes('Läs en bok')).length,0,'unchecked habit takes its post away');
   s.history[day].entries.read.value=10;await save(s);
  });
  await t.test('other cardio is shared when picked; a hand-deleted workout post never comes back',async()=>{
   Q.setCardioShared(s,'walk1',true);await save(s);assert.ok((await posts()).some(r=>r.body.startsWith('Promenad')));
   const w=(await posts()).find(r=>r.body.startsWith('Styrkepass'));await as(a);await db.query('delete from public.posts where id=$1',[w.id]);await db.exec('reset role');
   s.strength.sessions[0].exercises[0].sets.push({kg:60,reps:8,done:true});await save(s);assert.ok(!(await posts()).some(r=>r.body.startsWith('Styrkepass')));
   s.strength.sessions[0].exercises[0].sets.pop();
  });
  await t.test('existing posts survive the migration and odd squadShare values are ignored',async()=>{
   const odd=structuredClone(s);odd.squadShare='nope';await save(odd);assert.ok((await posts()).some(r=>r.body.startsWith('Löpning')));await save(s);
  });
  await t.test('the real save RPC keeps squadShare and reaction pictures in the payload',async()=>{
   await as(c);const st=D.normalizeState(D.blankState(),'2026-11-07T12:00:00Z');st.squadShare={entries:['2026-11-12:x'],cardio:[],always:['x']};st.reactionImages=[c+'/posts/r.jpg'];
   const rev=Number((await db.query('select revision from public.user_states where user_id=$1',[c])).rows[0].revision);
   const r=(await db.query('select public.save_arc_state_v3($1::jsonb,$2) r',[JSON.stringify(st),rev])).rows[0].r;
   assert.deepEqual(r.payload.squadShare,st.squadShare);assert.deepEqual(r.payload.reactionImages,st.reactionImages);await db.exec('reset role');
  });
  await t.test('a photo attaches to the post of a saved run, only by its owner',async()=>{
   await as(a);await db.query('insert into storage.objects(bucket_id,name) values($1,$2)',['arc-photos',a+'/posts/run.jpg']);
   const pid=(await db.query('select public.attach_activity_photo($1,$2) id',['cardio:run1',a+'/posts/run.jpg'])).rows[0].id;
   await db.exec('reset role');assert.equal((await db.query('select image_path from public.posts where id=$1',[pid])).rows[0].image_path,a+'/posts/run.jpg');
   await as(a);await assert.rejects(db.query('select public.attach_activity_photo($1,$2)',['entry:'+day+':read',a+'/posts/run.jpg']),/Bara pass/);
   await assert.rejects(db.query('select public.attach_activity_photo($1,$2)',['strength:nope',a+'/posts/run.jpg']),/finns inte/);
   await as(b);await assert.rejects(db.query('select public.attach_activity_photo($1,$2)',['cardio:run1',a+'/posts/run.jpg']),/finns inte/);
  });
  await t.test('photo reactions: squad sees them and the picture, outsiders see nothing',async()=>{
   await db.exec('reset role');const run=(await posts()).find(r=>r.body.startsWith('Löpning')).id;
   await as(b);await db.query('insert into storage.objects(bucket_id,name) values($1,$2)',['arc-photos',b+'/posts/me.jpg']);
   await assert.rejects(db.query('insert into public.photo_reactions(post_id,user_id,image_path) values($1,$2,$3)',[run,b,b+'/posts/missing.jpg']),/row-level/);
   await assert.rejects(db.query('insert into public.photo_reactions(post_id,user_id,image_path) values($1,$2,$3)',[run,b,a+'/posts/run.jpg']),/check|row-level/);
   await db.query('insert into public.photo_reactions(post_id,user_id,image_path) values($1,$2,$3)',[run,b,b+'/posts/me.jpg']);
   await as(a);assert.equal((await db.query('select * from public.photo_reactions')).rows.length,1);
   assert.ok((await db.query('select name from storage.objects')).rows.some(r=>r.name===b+'/posts/me.jpg'),'squad can open the reaction picture');
   await db.query('delete from public.photo_reactions where user_id=$1',[b]);assert.equal((await db.query('select * from public.photo_reactions')).rows.length,1,'others cannot remove your reaction');
   await as(c);assert.equal((await db.query('select * from public.photo_reactions')).rows.length,0);
   assert.ok(!(await db.query('select name from storage.objects')).rows.some(r=>r.name===b+'/posts/me.jpg'),'outsiders never see it');
   await assert.rejects(db.query('insert into public.photo_reactions(post_id,user_id,image_path) values($1,$2,$3)',[run,c,c+'/posts/x.jpg']),/row-level/);
   await as(b);await db.query('delete from public.photo_reactions where post_id=$1',[run]);assert.equal((await db.query('select * from public.photo_reactions')).rows.length,0);
   assert.equal((await db.query('select public.squad_feed_choice_ready() r')).rows[0].r,true);
  });
 }finally{await db.close();}
});
