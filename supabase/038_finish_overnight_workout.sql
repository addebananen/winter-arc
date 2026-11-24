-- A strength workout that was left running past midnight (forgot to press Avsluta) could never be saved:
-- the server only accepted a finished workout dated today, so saving failed with
-- "Starta och logga passet innan du sparar." Now a workout that was started on an earlier day is checked
-- against the day it started, so it can be finished (and its time shortened) and is saved on that day.
-- Everything else is checked exactly as before. A new workout must still start today.
-- No stored profiles, XP or history are changed.
begin;

alter function public.arc_validate_strength(jsonb,jsonb,text) rename to arc_validate_strength_v37;
create function public.arc_validate_strength(p jsonb,old jsonb,day text) returns void
language plpgsql stable set search_path=public,pg_temp as $$
declare b jsonb=old#>'{strength,active}';
begin
 if b->>'date'<day and p#>>'{strength,active,id}' is null
    and exists(select 1 from jsonb_array_elements(coalesce(p#>'{strength,sessions}','[]')) w where w->>'id'=b->>'id') then
  perform public.arc_validate_strength_v37(p,old,b->>'date');
 else
  perform public.arc_validate_strength_v37(p,old,day);
 end if;
end;$$;

revoke all on function public.arc_validate_strength(jsonb,jsonb,text),public.arc_validate_strength_v37(jsonb,jsonb,text) from public,anon,authenticated;
insert into public.schema_migrations(name) values('038_finish_overnight_workout') on conflict do nothing;
notify pgrst,'reload schema';
commit;
