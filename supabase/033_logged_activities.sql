-- Forgot the timer? Running, walking and sports can be logged afterwards, for today or yesterday, by entering
-- the time (and distance for running). And sports give XP: 0.5 XP per minute, at most 30 XP per day.
-- 1) save_arc_state: as in 032, plus one more kind of new activity: "manual": true. It needs a known activity,
--    today or yesterday (not before the expedition start), 1 minute to 4 hours, the same distance and speed
--    limits as timed activities, finishedAt from now and no timer running. One per activity and day, as before.
--    Saved activities stay locked.
-- 2) arc_rules_day_xp: the 018 rules plus sport XP from 2026-11-17 (mirrors src/xp-rules.js): the day's sports
--    sessions (every activity except run and walk) together give floor(seconds / 120) XP, at most 30.
--    Days before 2026-11-17 are unchanged.
-- No stored profiles, XP or history are changed.
begin;

create or replace function public.save_arc_state(p_payload jsonb,p_expected_revision bigint) returns bigint
language plpgsql security definer set search_path=public,pg_temp as $$
declare old jsonb; a jsonb=p_payload#>'{cardio,active}'; b jsonb; w jsonb; prior jsonb; ts numeric=floor(extract(epoch from clock_timestamp())*1000); v_day text;
begin
 if auth.uid() is null then raise exception 'Logga in först.';end if;
 select payload into old from public.user_states where user_id=auth.uid() for update;
 b=old#>'{cardio,active}';v_day=(now() at time zone coalesce(old->>'timezone',p_payload->>'timezone','UTC'))::date::text;
 if old->'cardio' is not null and p_payload->'cardio' is null then raise exception 'Aktivitetsjournalen måste behållas.';end if;
 if p_payload->'cardio' is not null then
  if jsonb_typeof(p_payload#>'{cardio,sessions}') is distinct from 'array' or jsonb_array_length(p_payload#>'{cardio,sessions}')>1000 then raise exception 'Ogiltig aktivitetsjournal.';end if;
  for w in select value from jsonb_array_elements(coalesce(old#>'{cardio,sessions}','[]')) loop
   if not exists(select 1 from jsonb_array_elements(p_payload#>'{cardio,sessions}') x where x=w) then raise exception 'Sparade aktiviteter är låsta.';end if;
  end loop;
  if exists(select 1 from jsonb_array_elements(p_payload#>'{cardio,sessions}') x group by x->>'id' having count(*)>1) or exists(select 1 from jsonb_array_elements(p_payload#>'{cardio,sessions}') x group by x->>'date',x->>'kind' having count(*)>1) then raise exception 'Aktiviteten räknas en gång per dag.';end if;
  for w in select value from jsonb_array_elements(p_payload#>'{cardio,sessions}') loop
   select value into prior from jsonb_array_elements(coalesce(old#>'{cardio,sessions}','[]')) x where x->>'id'=w->>'id';
   if prior is not null then if prior<>w then raise exception 'Sparad aktivitet är låst.';end if;continue;end if;
   -- 033: an activity logged afterwards (forgot the timer), for today or yesterday, with no timer running.
   if w ? 'manual' then
    if w->'manual' is distinct from 'true'::jsonb
     or (w-'id'-'kind'-'date'-'startedAt'-'finishedAt'-'seconds'-'km'-'weight'-'height'-'manual')<>'{}'::jsonb
     or w->>'kind' is null or w->>'kind'='climb' or not (w->>'kind'=any(public.arc_cardio_kinds()))
     or w->>'date' is null or w->>'date' not in (v_day,(v_day::date-1)::text) or w->>'date'<coalesce(p_payload#>>'{expedition,start}','')
     or length(coalesce(w->>'id','')) not between 1 and 100
     or jsonb_typeof(w->'seconds') is distinct from 'number' or (w->>'seconds')::numeric not between 60 and 14400 or (w->>'seconds')::numeric<>floor((w->>'seconds')::numeric)
     or jsonb_typeof(w->'km') is distinct from 'number' or (w->>'km')::numeric not between 0 and 100 or (w->>'kind'='run' and (w->>'km')::numeric<=0) or (w->>'km')::numeric*3600/(w->>'seconds')::numeric>45
     or jsonb_typeof(w->'finishedAt') is distinct from 'number' or abs((w->>'finishedAt')::numeric-ts)>120000
     or jsonb_typeof(w->'startedAt') is distinct from 'number' or (w->>'startedAt')::numeric<>(w->>'finishedAt')::numeric-(w->>'seconds')::numeric*1000
     or coalesce(jsonb_typeof(w->'weight'),'null') not in ('number','null') or coalesce(jsonb_typeof(w->'height'),'null') not in ('number','null')
    then raise exception 'Kontrollera aktivitet, dag och tid. Pass kan loggas i efterhand för idag eller igår.';end if;
    if coalesce(a,'null'::jsonb)<>'null'::jsonb or coalesce(b,'null'::jsonb)<>'null'::jsonb then raise exception 'Avsluta aktiviteten först.';end if;
    continue;
   end if;
   if b is null or b='null'::jsonb or (w-'seconds'-'km'-'finishedAt')<>b or w->>'date'<>v_day or jsonb_typeof(w->'seconds') is distinct from 'number' or jsonb_typeof(w->'km') is distinct from 'number' or jsonb_typeof(w->'finishedAt') is distinct from 'number' or (w->>'seconds')::numeric not between 60 and 14400 or (w->>'seconds')::numeric<>floor((w->>'seconds')::numeric) or (w->>'seconds')::numeric*1000>ts-(b->>'startedAt')::numeric+2000 or abs((w->>'finishedAt')::numeric-ts)>120000 or (w->>'km')::numeric not between 0 and 100 or (w->>'kind'='run' and (w->>'km')::numeric<=0) or (w->>'km')::numeric*3600/(w->>'seconds')::numeric>45 then raise exception 'Kontrollera distans och verklig träningstid.';end if;
   if a is distinct from 'null'::jsonb then raise exception 'Avsluta aktiviteten innan den sparas.';end if;
  end loop;
  if a is not null and a<>'null'::jsonb then
   if p_payload#>>'{strength,active,id}' is not null or p_payload#>>'{training,active,id}' is not null then raise exception 'Bara ett pass kan pågå.';end if;
   if b is not null and b<>'null'::jsonb then if a<>b then raise exception 'Aktivitetens start är låst.';end if;
   else
    if a->>'kind' not in (select unnest(public.arc_cardio_kinds())) or a->>'kind' is null or a->>'date' is distinct from v_day or length(coalesce(a->>'id','')) not between 1 and 100 or exists(select 1 from jsonb_array_elements(p_payload#>'{cardio,sessions}') x where x->>'date'=v_day and x->>'kind'=a->>'kind') then raise exception 'Välj en ny aktivitet idag.';end if;
    a=a||jsonb_build_object('startedAt',ts,'weight',p_payload#>'{profile,weight}','height',p_payload#>'{profile,height}');p_payload=jsonb_set(p_payload,'{cardio,active}',a);
   end if;
  end if;
 end if;
 return public.save_arc_state_v8(p_payload,p_expected_revision);
end;$$;

alter function public.arc_rules_day_xp(jsonb,text) rename to arc_rules_day_xp_v32;
create function public.arc_rules_day_xp(p jsonb, v_day text) returns integer
language sql immutable set search_path=public,pg_temp as $$
 select public.arc_rules_day_xp_v32(p,v_day)+case when v_day<'2026-11-17' then 0 else least(30,floor(coalesce((
  select sum((w->>'seconds')::numeric) from jsonb_array_elements(coalesce(p#>'{cardio,sessions}','[]')) w
  where w->>'date'=v_day and w->>'kind' not in ('run','walk') and jsonb_typeof(w->'seconds')='number'),0)/120))::integer end;
$$;

revoke all on function public.arc_rules_day_xp(jsonb,text),public.arc_rules_day_xp_v32(jsonb,text) from public,anon,authenticated;
revoke all on function public.save_arc_state(jsonb,bigint) from public,anon;
grant execute on function public.save_arc_state(jsonb,bigint) to authenticated;
insert into public.schema_migrations(name) values('033_logged_activities') on conflict do nothing;
notify pgrst,'reload schema';
commit;
