-- Cardio machines on the Cardio tab: treadmill, cross trainer, exercise bike, rowing machine, stair climber,
-- SkiErg and air bike. They are logged like the other activities (timer or afterwards, time and optional distance,
-- no rank) and, like sports, give 0.5 XP per minute, at most 30 XP per day together with sports (rule from 033).
-- 1) arc_cardio_kinds(): the list from 032 plus the machines, so save_arc_state (033) accepts them.
-- 2) arc_squad_events: as in 032, with the machines' own names in the squad feed ('Löpband klart · …').
-- No stored profiles, XP or history are changed.
begin;

create or replace function public.arc_cardio_kinds() returns text[] language sql immutable set search_path=public,pg_temp as $$
 select array['run','walk','treadmill','crosstrainer','exercise-bike','rowing-machine','stair-climber','ski-erg','air-bike','volleyball','boulder','rope-climb','football','basketball','floorball','handball','ice-hockey','padel','tennis','badminton','table-tennis','martial-arts','climb']
$$;

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

revoke all on function public.arc_cardio_kinds(),public.arc_squad_events(jsonb) from public,anon,authenticated;
insert into public.schema_migrations(name) values('035_cardio_machines') on conflict do nothing;
notify pgrst,'reload schema';
commit;
