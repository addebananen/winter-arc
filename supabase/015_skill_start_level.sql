-- Let each person set where they already are in a skill tree (a self-assessed starting level).
-- Levels up to the starting level count as done; the next level is still unlocked by a saved workout.
-- Skill levels only shape character stats, never XP or rank. No stored data is changed.
begin;
alter function public.arc_validate_strength(jsonb,jsonb,text) rename to arc_validate_strength_v13;
create function public.arc_validate_strength(p jsonb,old jsonb,day text) returns void
language plpgsql stable set search_path=public,pg_temp as $$
declare k text; v jsonb; lvl numeric;
begin
 -- Earlier versions rejected every change to p.skills; check everything else with the old skills in place.
 perform public.arc_validate_strength_v13(jsonb_set(p,'{skills}',coalesce(nullif(old->'skills','null'::jsonb),'{}'::jsonb)),old,day);
 if coalesce(nullif(p->'skills','null'::jsonb),'{}'::jsonb) is not distinct from coalesce(nullif(old->'skills','null'::jsonb),'{}'::jsonb) then return; end if;
 if jsonb_typeof(p->'skills') is distinct from 'object' then raise exception 'Ogiltiga skill-nivåer.'; end if;
 for k, v in select key, value from jsonb_each(p->'skills') loop
  if public.arc_strength_meta('sk-'||k||'-1') is null then raise exception 'Okänd skill.'; end if;
  if jsonb_typeof(v) is distinct from 'object' or jsonb_typeof(v->'level') is distinct from 'number' then raise exception 'Ogiltig startnivå.'; end if;
  lvl=(v->>'level')::numeric;
  if lvl<>floor(lvl) or lvl<0 or (lvl>0 and public.arc_strength_meta('sk-'||k||'-'||lvl::int) is null) then raise exception 'Ogiltig startnivå.'; end if;
  if v ? 'log' and (jsonb_typeof(v->'log') is distinct from 'array' or jsonb_array_length(v->'log')>60) then raise exception 'Ogiltig skill-logg.'; end if;
 end loop;
end;$$;
revoke all on function public.arc_validate_strength_v13(jsonb,jsonb,text),public.arc_validate_strength(jsonb,jsonb,text) from public,anon,authenticated;
create or replace function public.training_expansion_ready() returns integer language sql stable as $$select 15$$;
notify pgrst,'reload schema';
commit;
