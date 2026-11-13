// Migration 032: a reaction on your post queues one push notification per person and reaction,
// never for your own post, only when you have notifications on, and in your device's language.
import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../src/domain.js';

test('reaction push notifications (032)',async t=>{
 const db=new PGlite();await db.waitReady;
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create schema storage;create schema extensions;
  create table auth.users(id uuid primary key,created_at timestamptz default '2026-11-07T12:00:00Z');
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  create function extensions.gen_random_bytes(n integer) returns bytea language sql volatile as $$select decode(substr(repeat(md5(random()::text),4),1,n*2),'hex')$$;
  create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
  create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
  create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;
  alter table storage.objects enable row level security;
  grant usage on schema public,auth,storage to authenticated,service_role;
  grant select,insert,delete on storage.objects to authenticated;`);
  const dir=new URL('../supabase/',import.meta.url);
  for(const f of (await readdir(dir)).filter(f=>/^0\d\d_.*\.sql$/.test(f)&&f!=='030_push_schedule.sql').sort()){let sql=await readFile(new URL(f,dir),'utf8');if(f.startsWith('001'))sql=sql.replace('create extension if not exists pgcrypto with schema extensions;','');await db.exec(sql);}
  const [a,b,c]=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333'];
  await db.query('insert into auth.users(id) values($1),($2),($3)',[a,b,c]);
  const as=async uid=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid]);await db.exec('set role authenticated');};
  for(const [id,name] of [[a,'Adrian'],[b,'Maya'],[c,'Noah']]){await as(id);const s=D.normalizeState(D.blankState(),'2026-11-07T12:00:00Z');s.profile.name=name;await db.query('select public.save_arc_state($1::jsonb,0)',[JSON.stringify(s)]);}
  await as(a);const squad=(await db.query("select public.create_squad('Northbound') id")).rows[0].id,code=(await db.query('select public.get_squad_code($1) code',[squad])).rows[0].code;
  for(const u of [b,c]){await as(u);await db.query('select public.join_squad($1)',[code]);}
  await as(a);await db.query("select public.save_push_subscription('https://push.example/a','"+'p'.repeat(30)+"','"+'k'.repeat(12)+"',19,'sv')");
  const post=(await db.query("insert into public.posts(squad_id,user_id,body) values($1,$2,'Styrkepass klart · 6 set · 40 min · 2026-11-13') returning id",[squad,a])).rows[0].id;
  const due=async()=>{await db.exec('reset role');await db.exec('set role service_role');try{return (await db.query('select * from public.push_outbox_due()')).rows;}finally{await db.exec('reset role');}};

  await t.test('a squad member reacting sends one notification in your language',async()=>{
   await as(b);await db.query("insert into public.reactions(post_id,user_id,kind) values($1,$2,'fire')",[post,b]);
   const rows=await due();assert.equal(rows.length,1);assert.equal(rows[0].title,'Maya hejar på dig 🔥');assert.equal(rows[0].body,'Reagerade 🔥 på ditt pass.');assert.equal(rows[0].kind,'reaction-'+post);
   assert.equal((await due()).length,0,'sent only once');
  });
  await t.test('toggling a reaction off and on never notifies twice; your own reaction never notifies',async()=>{
   await as(b);await db.query("delete from public.reactions where post_id=$1 and user_id=$2",[post,b]);await db.query("insert into public.reactions(post_id,user_id,kind) values($1,$2,'fire')",[post,b]);
   await as(a);await db.query("insert into public.reactions(post_id,user_id,kind) values($1,$2,'clap')",[post,a]);
   assert.equal((await due()).length,0);
  });
  await t.test('photo reactions notify too, and turning reactions off stops them',async()=>{
   await as(c);await db.query('insert into storage.objects(bucket_id,name) values($1,$2)',['arc-photos',c+'/posts/me.jpg']);await db.query('insert into public.photo_reactions(post_id,user_id,image_path) values($1,$2,$3)',[post,c,c+'/posts/me.jpg']);
   const rows=await due();assert.equal(rows.length,1);assert.match(rows[0].title,/Noah reagerade med en bild/);
   await as(a);await db.query('select public.set_push_reactions(false)');await as(c);await db.query("insert into public.reactions(post_id,user_id,kind) values($1,$2,'party')",[post,c]);
   assert.equal((await due()).length,0);
  });
  await t.test('nobody but the Edge Function reads the outbox',async()=>{
   await as(b);await assert.rejects(db.query('select * from public.push_outbox'),/permission/);await assert.rejects(db.query('select * from public.push_outbox_due()'),/permission/);
   await db.exec('reset role');assert.ok((await db.query('select public.schema_status() s')).rows[0].s.installed.includes('032_reaction_push'));
  });
 }finally{await db.close();}
});
