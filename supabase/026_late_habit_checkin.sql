-- Glömde du checka in? Gårdagens vanor kan nu registreras i efterhand, en dag bakåt.
-- Träning (vanor i kategorin strength, t.ex. Styrketräning och Löpning) måste fortfarande
-- registreras samma dag. Utmaningar, bonusar och träningspass för igår kan inte läggas till.
-- Dagar äldre än igår är låsta som förut. Ingen lagrad data ändras.
begin;

alter function public.arc_validate_state(jsonb,jsonb,text) rename to arc_validate_state_v24;

-- Checks only yesterday's record: entries may be added or changed for habits that were due
-- yesterday, never removed, and never for training habits or challenges.
create or replace function public.arc_validate_late_day(p jsonb,old jsonb,day text) returns void
language plpgsql stable set search_path=public,pg_temp as $$
declare yd text=(day::date-1)::text;pd jsonb;od jsonb;due jsonb;req jsonb;e record;h jsonb;prev jsonb;changed integer=0;
begin
 old=coalesce(old,'{}');pd=p->'history'->yd;od=old->'history'->yd;
 if yd<p#>>'{expedition,start}' or pd is null or jsonb_typeof(pd->'entries') is distinct from 'object' or jsonb_typeof(pd->'required') is distinct from 'array' then raise exception 'Tidigare dagars resultat är låsta.';end if;
 if (pd-'entries'-'required') is distinct from (coalesce(od,'{}'::jsonb)-'entries'-'required') then raise exception 'Tidigare dagars resultat är låsta.';end if;
 select coalesce(jsonb_agg(x->>'id' order by x->>'id'),'[]') into due from jsonb_array_elements(p->'habits') x
  where not coalesce((x->>'archived')::boolean,false) and x->>'start'<=yd and x->'days' @> to_jsonb(array[extract(dow from yd::date)::integer]);
 if exists(select 1 from jsonb_array_elements(pd->'required') v where jsonb_typeof(v) is distinct from 'string') or exists(select 1 from jsonb_array_elements_text(pd->'required') v group by v having count(*)>1) then raise exception 'Dagens krav får inte tas bort eller dupliceras.';end if;
 if od is null then
   select coalesce(jsonb_agg(v order by v),'[]') into req from jsonb_array_elements_text(pd->'required') v;
   if req<>due then raise exception 'Dagens krav får inte tas bort eller dupliceras.';end if;
 else
   if exists(select 1 from jsonb_array_elements_text(coalesce(od->'required','[]')) v where not pd->'required' ? v)
     or exists(select 1 from jsonb_array_elements_text(pd->'required') v where not coalesce(od->'required','[]') ? v and not due ? v) then raise exception 'Dagens krav får inte tas bort eller dupliceras.';end if;
 end if;
 if exists(select 1 from jsonb_object_keys(coalesce(od->'entries','{}')) k where not pd->'entries' ? k) then raise exception 'Tidigare dagars resultat är låsta.';end if;
 for e in select key,value from jsonb_each(pd->'entries') loop
   prev=od->'entries'->e.key;
   if prev is not distinct from e.value then continue;end if;
   changed=changed+1;
   if e.value ? 'source' or coalesce(prev ? 'source',false) then raise exception 'Utmaningar kan bara registreras samma dag.';end if;
   select value into h from jsonb_array_elements(p->'habits') x(value) where value->>'id'=e.key;
   if h is null or not due ? e.key or not pd->'required' ? e.key then raise exception 'Vanan var inte aktiv igår.';end if;
   if h->>'category'='strength' or e.value->>'category'='strength' or prev->>'category'='strength' then raise exception 'Träning kan bara registreras samma dag.';end if;
   if jsonb_typeof(e.value->'value') is distinct from 'number' or (e.value->>'value')::numeric<0 or (e.value->>'value')::numeric>(h->>'target')::numeric
     or e.value->'target' is distinct from h->'target' or e.value->'xp' is distinct from h->'xp' or e.value->'category' is distinct from h->'category'
     or e.value->>'activityKey' is distinct from public.arc_habit_key(h) or e.value->'durationMinutes' is distinct from h->'durationMinutes' then raise exception 'Registreringen måste följa vanans låsta mål och XP.';end if;
 end loop;
 if changed=0 then raise exception 'Tidigare dagars resultat är låsta.';end if;
 if exists(select 1 from jsonb_each(pd->'entries') z where coalesce(z.value->>'source','habit')<>'challenge' group by z.value->>'activityKey' having count(*)>1) then raise exception 'Samma aktivitet får bara en registrering per dag, även efter arkivering.';end if;
end;
$$;

-- Same rules as before for today and older days. A valid change to yesterday is checked above and
-- then hidden from the earlier validator, which still locks every other past day.
create or replace function public.arc_validate_state(p jsonb,old jsonb,day text) returns void
language plpgsql stable set search_path=public,pg_temp as $$
declare yd text=(day::date-1)::text;
begin
 old=coalesce(old,'{}');
 if p->'history'->yd is distinct from old->'history'->yd then
   perform public.arc_validate_late_day(p,old,day);
   p=case when old->'history' ? yd then jsonb_set(p,array['history',yd],old->'history'->yd) else p #- array['history',yd] end;
 end if;
 perform public.arc_validate_state_v24(p,old,day);
end;
$$;

create or replace function public.late_checkin_ready() returns boolean language sql stable set search_path=public,pg_temp as $$select true$$;

revoke all on function public.arc_validate_state_v24(jsonb,jsonb,text),public.arc_validate_late_day(jsonb,jsonb,text),public.arc_validate_state(jsonb,jsonb,text),public.late_checkin_ready() from public,anon,authenticated;
grant execute on function public.late_checkin_ready() to authenticated;
notify pgrst,'reload schema';
commit;
