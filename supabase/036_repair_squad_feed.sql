-- Repair: saving a workout failed with "function public.arc_squad_events_v31(jsonb) does not exist" when
-- 035_cardio_machines.sql was run before 032_sports.sql. 035 points the squad feed at arc_squad_events_v31,
-- which only 032 creates, and after 035 the file 032 can no longer run (arc_cardio_kinds already exists).
-- This works whatever order 031-035 were run in:
-- 1) arc_squad_events_v31 = the squad feed from 031 (the same function 032 would have kept under this name).
-- 2) arc_squad_events = the 035 version: the 031 feed plus the names of sports and cardio machines.
-- 3) Records 032 as installed once saving reads that activity list (after 032 or 033), so the app shows the sports.
--    Run 033_logged_activities.sql afterwards if it is not installed yet (it is safe to run after this).
-- Needs 028 and 031. No stored profiles, XP or history are changed.
begin;

do $$ begin
 if to_regprocedure('public.arc_squad_events_v30(jsonb)') is null then
  raise exception 'Kör 031_squad_feed_choice.sql först och sedan den här filen igen.';
 end if;
end $$;

create or replace function public.arc_squad_events_v31(p jsonb) returns jsonb
language plpgsql immutable set search_path=public,pg_temp as $$
declare result jsonb='{}'; d record; e record; w jsonb; n integer; mins integer; prefix text;
 picked jsonb=p#>'{squadShare,entries}'; picked_cardio jsonb=p#>'{squadShare,cardio}';
begin
 if jsonb_typeof(picked) is distinct from 'array' then picked='[]'; end if;
 if jsonb_typeof(picked_cardio) is distinct from 'array' then picked_cardio='[]'; end if;
 if jsonb_typeof(p->'history')='object' then
  for d in select key,value from jsonb_each(p->'history') loop
   if jsonb_typeof(d.value->'entries') is distinct from 'object' then continue; end if;
   for e in select key,value from jsonb_each(d.value->'entries') loop
    if picked ? (d.key||':'||e.key) and coalesce((e.value->>'value')::numeric,0)>0 then
     result=result||jsonb_build_object('entry:'||d.key||':'||e.key,
      case when (e.value->>'value')::numeric >= (e.value->>'target')::numeric then 'Klar · ' else 'På väg · ' end
      ||left(coalesce(e.value->>'name','Dagens vana'),120)||' · '||(e.value->>'value')||' / '||(e.value->>'target')
      ||case when e.value ? 'durationMinutes' then ' · '||(e.value->>'durationMinutes')||' min' else '' end||' · '||d.key);
    end if;
   end loop;
  end loop;
 end if;
 foreach prefix in array array['training','strength'] loop
  for w in select value from jsonb_array_elements(coalesce(p#>array[prefix,'sessions'],'[]')) loop
   if w->>'finishedAt' is not null then
    if prefix='strength' then
     select count(*) into n from jsonb_array_elements(w->'exercises') x cross join lateral jsonb_array_elements(x->'sets') s where (s->>'done')::boolean;
    else
     select count(*) into n from jsonb_array_elements(w->'exercises') x cross join lateral jsonb_array_elements(x->'done') s where s::numeric>0;
    end if;
    mins=greatest(0,floor(((w->>'finishedAt')::numeric-(w->>'startedAt')::numeric-coalesce((w->>'pausedMs')::numeric,0))/60000));
    result=result||jsonb_build_object(prefix||':'||(w->>'id'),
     case when prefix='strength' then 'Styrkepass klart' else left(coalesce(w->>'title','Träningspass'),120)||' klart' end
     ||' · '||n||' set · '||mins||' min · '||(w->>'date'));
   end if;
  end loop;
 end loop;
 for w in select value from jsonb_array_elements(coalesce(p#>'{cardio,sessions}','[]')) loop
  if w->>'kind'='run' or picked_cardio ? (w->>'id') then
   result=result||jsonb_build_object('cardio:'||(w->>'id'),case w->>'kind' when 'run' then 'Löpning' when 'walk' then 'Promenad' when 'volleyball' then 'Volleyboll' else 'Klättring' end||' klart · '||(w->>'km')||' km · '||round((w->>'seconds')::numeric/60,1)||' min · '||(w->>'date'));
  end if;
 end loop;
 return result;
end;$$;

create or replace function public.arc_squad_events(p jsonb) returns jsonb
language plpgsql immutable set search_path=public,pg_temp as $$
declare result jsonb=public.arc_squad_events_v31(p); w jsonb; v_name text;
begin
 for w in select value from jsonb_array_elements(coalesce(p#>'{cardio,sessions}','[]')) loop
  v_name=case w->>'kind' when 'treadmill' then 'Löpband' when 'crosstrainer' then 'Crosstrainer' when 'exercise-bike' then 'Motionscykel' when 'rowing-machine' then 'Roddmaskin' when 'stair-climber' then 'Trappmaskin' when 'ski-erg' then 'SkiErg' when 'air-bike' then 'Airbike' when 'boulder' then 'Bouldering' when 'rope-climb' then 'Repklättring' when 'football' then 'Fotboll' when 'basketball' then 'Basket' when 'floorball' then 'Innebandy' when 'handball' then 'Handboll' when 'ice-hockey' then 'Ishockey' when 'padel' then 'Padel' when 'tennis' then 'Tennis' when 'badminton' then 'Badminton' when 'table-tennis' then 'Bordtennis' when 'martial-arts' then 'Kampsport' end;
  if v_name is not null and result ? ('cardio:'||(w->>'id')) then
   result=result||jsonb_build_object('cardio:'||(w->>'id'),v_name||' klart · '||(w->>'km')||' km · '||round((w->>'seconds')::numeric/60,1)||' min · '||(w->>'date'));
  end if;
 end loop;
 return result;
end;$$;

create or replace function public.arc_cardio_kinds() returns text[] language sql immutable set search_path=public,pg_temp as $$
 select array['run','walk','treadmill','crosstrainer','exercise-bike','rowing-machine','stair-climber','ski-erg','air-bike','volleyball','boulder','rope-climb','football','basketball','floorball','handball','ice-hockey','padel','tennis','badminton','table-tennis','martial-arts','climb']
$$;

revoke all on function public.arc_squad_events(jsonb),public.arc_squad_events_v31(jsonb),public.arc_cardio_kinds() from public,anon,authenticated;
-- 032 counts as installed once saving reads the activity list (032 or 033 has run).
insert into public.schema_migrations(name) select '032_sports' where exists(select 1 from pg_proc where oid='public.save_arc_state(jsonb,bigint)'::regprocedure and prosrc like '%arc_cardio_kinds%') on conflict do nothing;
insert into public.schema_migrations(name) values('036_repair_squad_feed') on conflict do nothing;
notify pgrst,'reload schema';
commit;
