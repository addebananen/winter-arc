// Migration 036: when 035 was run before 032, every save in a squad failed with
// "function public.arc_squad_events_v31(jsonb) does not exist". 036 repairs that, whatever the order.
import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../src/domain.js';
import * as S from '../src/strength.js';
import * as SC from '../src/schema.js';

async function database(order) {
  const db = new PGlite(); await db.waitReady;
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
  const dir = new URL('../supabase/', import.meta.url);
  for (const f of (await readdir(dir)).filter(f => /^0\d\d_.*\.sql$/.test(f) && f < '028').sort()) {
    let sql = await readFile(new URL(f, dir), 'utf8');
    if (f.startsWith('001')) sql = sql.replace('create extension if not exists pgcrypto with schema extensions;', '');
    await db.exec(sql);
  }
  for (const name of order) await db.exec(await readFile(new URL(name + '.sql', dir), 'utf8'));
  return db;
}

async function strengthWorkout(db, id) {
  await db.exec('reset role'); await db.query('insert into auth.users(id) values($1)', [id]);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]); await db.exec('set role authenticated');
  let st = D.normalizeState(D.blankState(), '2026-11-07T12:00:00Z'), rev = 0;
  const save = async x => { const r = (await db.query('select public.save_arc_state_v3($1::jsonb,$2) result', [JSON.stringify(x), rev])).rows[0].result; rev = Number(r.revision); return r.payload; };
  st = await save(st); await db.query("select public.create_squad('Gym')");
  S.startWorkout(st, D.dateKey(new Date(), st.timezone), ['squat']); st = await save(st);
  S.logStrengthSet(st, 'squat', 0, 60, 5); st = await save(st); S.finishWorkout(st); await save(st);
  await db.exec('reset role');
}

test('036 repairs saving after 035 was run before 032, and names sports in the feed', async () => {
  const db = await database(['028_schema_status', '031_squad_feed_choice', '034_leg_machines', '035_cardio_machines']);
  try {
    await assert.rejects(strengthWorkout(db, '11111111-1111-4111-8111-111111111111'), /arc_squad_events_v31.*does not exist/);
    await db.exec('reset role');
    for (const name of ['033_logged_activities', '036_repair_squad_feed']) await db.exec(await readFile(new URL(`../supabase/${name}.sql`, import.meta.url), 'utf8'));
    await strengthWorkout(db, '22222222-2222-4222-8222-222222222222');
    assert.equal((await db.query("select count(*)::int n from public.posts where body like 'Styrkepass klart%'")).rows[0].n, 1);
    const installed = (await db.query('select public.schema_status() s')).rows[0].s.installed;
    for (const n of ['032_sports', '033_logged_activities', '036_repair_squad_feed']) assert.ok(installed.includes(n), n);
    assert.ok(SC.MIGRATIONS.includes('036_repair_squad_feed'));
    const feed = (await db.query(`select public.arc_squad_events('{"cardio":{"sessions":[{"id":"f","kind":"treadmill","date":"2026-11-20","seconds":1800,"km":5}]},"squadShare":{"cardio":["f"]}}'::jsonb) e`)).rows[0].e;
    assert.equal(feed['cardio:f'], 'Löpband klart · 5 km · 30.0 min · 2026-11-20');
  } finally { await db.close(); }
});

test('036 changes nothing when 031-035 were run in order', async () => {
  const db = await database(['028_schema_status', '031_squad_feed_choice', '032_sports', '033_logged_activities', '034_leg_machines', '035_cardio_machines', '036_repair_squad_feed']);
  try { await strengthWorkout(db, '33333333-3333-4333-8333-333333333333'); } finally { await db.close(); }
});
