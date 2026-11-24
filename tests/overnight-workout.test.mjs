// Migration 038: a strength workout left running past midnight can still be finished (and shortened).
import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../src/domain.js';
import * as S from '../src/strength.js';
import * as SC from '../src/schema.js';

test('a workout started two days ago can be finished, shortened and is saved on its own day (038)', async () => {
  const db = new PGlite(); await db.waitReady;
  try {
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
    for (const f of ['028_schema_status', '031_squad_feed_choice', '032_sports', '033_logged_activities', '038_finish_overnight_workout']) await db.exec(await readFile(new URL(f + '.sql', dir), 'utf8'));
    assert.ok(SC.MIGRATIONS.includes('038_finish_overnight_workout'));
    const id = '11111111-1111-4111-8111-111111111111';
    await db.query('insert into auth.users(id) values($1)', [id]);
    const as = async () => { await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]); await db.exec('set role authenticated'); };
    await as();
    let st = D.normalizeState(D.blankState(), '2026-11-07T12:00:00Z'), rev = 0;
    const save = async x => { const r = (await db.query('select public.save_arc_state_v3($1::jsonb,$2) result', [JSON.stringify(x), rev])).rows[0].result; rev = Number(r.revision); return r.payload; };
    st = await save(st);
    const today = D.dateKey(new Date(), st.timezone);
    // A new workout must still start today.
    const early = structuredClone(st); S.startWorkout(early, '2026-11-12', ['pushup']);
    await assert.rejects(save(early), /börja idag/);
    S.startWorkout(st, today, ['pushup', 'squat']); st = await save(st);
    S.logStrengthSet(st, 'pushup', 0, 0, 10); st = await save(st);
    // Pretend it was started 2785 minutes ago and left running.
    const ago = Date.now() - 2785 * 60000, day = D.dateKey(new Date(ago), st.timezone);
    await db.exec('reset role');
    st.strength.active.startedAt = ago; st.strength.active.date = day;
    await db.query('update public.user_states set payload=$2 where user_id=$1', [id, JSON.stringify(st)]);
    await as();
    S.finishWorkout(st, Date.now(), 60); st = await save(st);
    const saved = st.strength.sessions.at(-1);
    assert.equal(st.strength.active, null);
    assert.equal(saved.date, day);
    assert.equal(saved.adjustedMinutes, 60);
    assert.notEqual(day, today);
  } finally { await db.close(); }
});
