-- New XP rules from 2026-11-10 (mirrors src/xp-rules.js). Only five activities give XP, at most once per day:
-- strength workout 40 (finished hub workout or the Styrketräning habit), running 35 (run session or the Löpning
-- habit), Läs en bok 25, Rörlighet 20 and Kall avslutning på duschen 15. A habit with a lower goal gives its own
-- smaller XP. Own habits, other habits, quests, combos, programs and other cardio give no XP from that date.
-- XP up to 2026-11-09 is computed exactly as before, so nobody loses earned XP. No stored data is changed.
begin;

create function public.arc_rules_day_xp(p jsonb, v_day text) returns integer
language sql immutable set search_path=public,pg_temp as $$
 with done as (
  select e from jsonb_each(coalesce(p->'history'->v_day->'entries','{}')) x(k,e)
  where coalesce(e->>'source','')<>'challenge' and (e->>'value')::numeric>=(e->>'target')::numeric
 ), rules(id,habit,habit_name,xp) as (values
  ('strength',0,'styrketräning',40),('run',8,'löpning',35),('read',2,'läs en bok',25),
  ('stretch',9,'rörlighet',20),('cold',11,'kall avslutning på duschen',15)
 )
 select coalesce(sum(case
  when r.id='strength' and exists(select 1 from jsonb_array_elements(coalesce(p#>'{strength,sessions}','[]')) w where w->>'finishedAt' is not null and w->>'date'=v_day) then r.xp
  when r.id='run' and exists(select 1 from jsonb_array_elements(coalesce(p#>'{cardio,sessions}','[]')) w where w->>'kind'='run' and w->>'date'=v_day) then r.xp
  else coalesce((select max(least(r.xp,greatest(0,coalesce((d.e->>'xp')::numeric,0)))) from done d
   where case when d.e ? 'activityKey' then d.e->>'activityKey'='habit:'||r.habit else lower(trim(d.e->>'name'))=r.habit_name end),0)
 end),0)::integer from rules r;
$$;

create function public.arc_rules_xp(p jsonb, until_day text) returns bigint
language sql immutable set search_path=public,pg_temp as $$
 select coalesce(sum(public.arc_rules_day_xp(p,d)),0)::bigint from (
  select key d from jsonb_each(coalesce(p->'history','{}'))
  union select w->>'date' from jsonb_array_elements(coalesce(p#>'{strength,sessions}','[]')) w
  union select w->>'date' from jsonb_array_elements(coalesce(p#>'{cardio,sessions}','[]')) w
 ) days where d ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' and d>='2026-11-10' and d>=coalesce(p#>>'{expedition,start}','2026-11-09') and d<=until_day;
$$;

alter function public.arc_total_xp(jsonb,text) rename to arc_total_xp_v17;
create function public.arc_total_xp(p jsonb, until_day text) returns bigint
language sql immutable set search_path=public,pg_temp as $$
 select public.arc_total_xp_v17(p,least(until_day,'2026-11-09'))+public.arc_rules_xp(p,until_day);
$$;

revoke all on function public.arc_rules_day_xp(jsonb,text),public.arc_rules_xp(jsonb,text),public.arc_total_xp(jsonb,text),public.arc_total_xp_v17(jsonb,text) from public,anon,authenticated;
notify pgrst,'reload schema';
commit;
