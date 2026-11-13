-- Schema version tracking: the app (and whoever runs SQL) can ask which migrations are installed.
-- Migrations 001-027 were pasted by hand and never recorded, so they are detected by a fingerprint:
-- an object that only exists once that migration has run. 001-007 are detected one by one where they
-- left a unique object; 005 and 006 only changed function bodies, so they count as installed once 007's
-- arc_strength_score exists (007 builds on them). 021 was removed: 025 replaced it before it was ever run.
-- 029 and 030 (push notifications) were run in Supabase before this file, so their guarded self-record
-- was skipped; they are detected the same way.
-- From 028 on, every migration records itself at the end:
--   insert into public.schema_migrations(name) values('0NN_name') on conflict do nothing;
-- No stored user data is changed.
begin;

create table if not exists public.schema_migrations(
 name text primary key check(name ~ '^[0-9]{3}_[a-z0-9_]+$'),
 applied_at timestamptz not null default now()
);
alter table public.schema_migrations enable row level security;
revoke all on public.schema_migrations from public,anon,authenticated;

create or replace function public.arc_legacy_migrations() returns text[]
language plpgsql stable set search_path=public,pg_temp as $$
declare
 fn constant jsonb:='{
  "001_winter_arc":"is_squad_member","002_training_season":"arc_training_xp","003_daily_integrity":"arc_validate_state",
  "004_calendar_integrity":"arc_validate_calendar","005_effort_rewards":"arc_strength_score","006_music_course":"arc_strength_score",
  "007_strength_hub":"arc_strength_score","009_training_expansion":"save_arc_state_v8","010_skill_workouts":"arc_validate_strength_v9",
  "011_training_streak":"squad_training_streaks","012_skill_hold_units":"arc_strength_meta_v10",
  "013_workout_time_and_set_types":"arc_validate_strength_v12","014_core_mobility_catalog":"arc_strength_meta_v13",
  "015_skill_start_level":"arc_validate_strength_v13","017_member_profiles":"member_profile","018_xp_rules":"arc_total_xp_v17",
  "019_warmup_sets":"arc_validate_strength_v15","020_mobility_progressions":"arc_strength_meta_v19",
  "022_straddle_basics":"arc_strength_meta_v21","023_squad_avatars":"squad_avatars",
  "024_squad_workout_details":"squad_workout_feed","024_straddle_research":"arc_strength_meta_v23",
  "025_short_squad_codes":"arc_new_squad_code","026_late_habit_checkin":"late_checkin_ready",
  "027_friend_from_squad":"request_friend_member","029_push_notifications":"push_ready"}';
 tb constant jsonb:='{"008_squad_activity":"squad_activity_events","016_friends":"friendships"}';
 r record; found text[]:='{}'; done boolean;
begin
 for r in select key,value from jsonb_each_text(fn) loop
  if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=r.value) then found=found||r.key; end if;
 end loop;
 for r in select key,value from jsonb_each_text(tb) loop
  if to_regclass('public.'||r.value) is not null then found=found||r.key; end if;
 end loop;
 -- 030 (push schedule) only leaves a pg_cron job; cron exists on Supabase but not everywhere.
 if to_regclass('cron.job') is not null then
  execute 'select exists(select 1 from cron.job where jobname=''push-reminders'')' into done;
  if done then found=found||'030_push_schedule'::text; end if;
 end if;
 return found;
end;$$;

-- Installed migrations, sorted by name. Legacy ones are re-detected on every call, so a hand-run
-- older migration (for example 026 run after this one) shows up without a manual record.
create or replace function public.schema_status() returns jsonb
language sql stable security definer set search_path=public,pg_temp as $$
 select jsonb_build_object('installed',coalesce(jsonb_agg(m order by m),'[]'::jsonb))
 from (select unnest(public.arc_legacy_migrations()) m union select name from public.schema_migrations) x;
$$;

revoke all on function public.arc_legacy_migrations(),public.schema_status() from public,anon,authenticated;
grant execute on function public.schema_status() to authenticated;

insert into public.schema_migrations(name) values('028_schema_status') on conflict do nothing;
notify pgrst,'reload schema';
commit;
