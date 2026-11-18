-- Sport as its own training category: volleyball, bouldering and roped climbing (both indoors), football,
-- basketball, floorball, handball, ice hockey, padel, tennis, badminton, table tennis and martial arts.
-- Sports are logged with the same activity timer as running and walking (time only, no rank, no XP of their own).
-- 1) arc_cardio_kinds(): the activities that can be started. save_arc_state is the same as in 009, except that
--    it reads this list instead of the fixed run/walk/volleyball/climb.
-- 2) arc_squad_events: a sport shared to the squad gets its own name in the feed ('Fotboll klart · …')
--    instead of the earlier fallback 'Klättring'. The rules for what is shared (031) are unchanged.
-- No stored profiles, XP or history are changed. Earlier 'climb' sessions keep the name Klättring.
begin;

create function public.arc_cardio_kinds() returns text[] language sql immutable set search_path=public,pg_temp as $$
 select array['run','walk','volleyball','climb','boulder','rope-climb','football','basketball','floorball','handball','ice-hockey','padel','tennis','badminton','table-tennis','martial-arts']
$$;

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

alter function public.arc_squad_events(jsonb) rename to arc_squad_events_v31;
create function public.arc_squad_events(p jsonb) returns jsonb
language plpgsql immutable set search_path=public,pg_temp as $$
declare result jsonb=public.arc_squad_events_v31(p); w jsonb; v_name text;
begin
 for w in select value from jsonb_array_elements(coalesce(p#>'{cardio,sessions}','[]')) loop
  v_name=case w->>'kind' when 'boulder' then 'Bouldering' when 'rope-climb' then 'Repklättring' when 'football' then 'Fotboll' when 'basketball' then 'Basket' when 'floorball' then 'Innebandy' when 'handball' then 'Handboll' when 'ice-hockey' then 'Ishockey' when 'padel' then 'Padel' when 'tennis' then 'Tennis' when 'badminton' then 'Badminton' when 'table-tennis' then 'Bordtennis' when 'martial-arts' then 'Kampsport' end;
  if v_name is not null and result ? ('cardio:'||(w->>'id')) then
   result=result||jsonb_build_object('cardio:'||(w->>'id'),v_name||' klart · '||(w->>'km')||' km · '||round((w->>'seconds')::numeric/60,1)||' min · '||(w->>'date'));
  end if;
 end loop;
 return result;
end;$$;

revoke all on function public.arc_cardio_kinds(),public.arc_squad_events(jsonb),public.arc_squad_events_v31(jsonb) from public,anon,authenticated;
revoke all on function public.save_arc_state(jsonb,bigint) from public,anon;
grant execute on function public.save_arc_state(jsonb,bigint) to authenticated;
insert into public.schema_migrations(name) values('032_sports') on conflict do nothing;
notify pgrst,'reload schema';
commit;
