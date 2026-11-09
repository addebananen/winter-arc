-- Shorten a forgotten workout and tag sets as failure or drop-set.
-- A saved workout may carry adjustedMinutes: whole minutes, at least 1 and at most the real
-- (server-timed) duration. It can only shorten a workout, never lengthen it, so XP can only go down.
-- Sets may carry type 'failure' or 'drop'; a normal set has no type. Saved workouts stay locked.
-- Mirrors elapsed()/finishWorkout()/setSetType() in src/strength.js. No stored data is changed.
begin;

create or replace function public.arc_strength_minutes(w jsonb) returns numeric
language sql immutable set search_path=public,pg_temp as $$
 select greatest(0,least(120,
  least(floor(((w->>'finishedAt')::numeric-(w->>'startedAt')::numeric-coalesce((w->>'pausedMs')::numeric,0))/60000),
        coalesce(case when jsonb_typeof(w->'adjustedMinutes')='number' then (w->>'adjustedMinutes')::numeric end,120)),
  5*(select count(*) from jsonb_array_elements(w->'exercises') e cross join lateral jsonb_array_elements(e->'sets') s where s->>'done'='true')));
$$;

alter function public.arc_prepare_strength(jsonb,jsonb,text) rename to arc_prepare_strength_v12;
create function public.arc_prepare_strength(p jsonb,old jsonb,day text) returns jsonb
language plpgsql volatile set search_path=public,pg_temp as $$
declare out jsonb='[]';w jsonb;real_min numeric;
begin
 p=public.arc_prepare_strength_v12(p,old,day);
 if not p ? 'strength' then return p;end if;
 for w in select value from jsonb_array_elements(coalesce(p#>'{strength,sessions}','[]')) loop
  -- Only a workout saved in this request may set adjustedMinutes; it is clamped to the real duration.
  if w ? 'adjustedMinutes' and not exists(select 1 from jsonb_array_elements(coalesce(old#>'{strength,sessions}','[]')) saved where saved->>'id'=w->>'id') then
   real_min=floor(((w->>'finishedAt')::numeric-(w->>'startedAt')::numeric-coalesce((w->>'pausedMs')::numeric,0))/60000);
   if jsonb_typeof(w->'adjustedMinutes')='number' and (w->>'adjustedMinutes')::numeric=floor((w->>'adjustedMinutes')::numeric) and (w->>'adjustedMinutes')::numeric>=1 and (w->>'adjustedMinutes')::numeric<real_min then
    w=jsonb_set(w,'{adjustedMinutes}',to_jsonb((w->>'adjustedMinutes')::integer));
   elsif jsonb_typeof(w->'adjustedMinutes')='number' and (w->>'adjustedMinutes')::numeric>=real_min then
    w=w-'adjustedMinutes';
   end if;
  end if;
  out=out||jsonb_build_array(w);
 end loop;
 return jsonb_set(p,'{strength,sessions}',out);
end;$$;

alter function public.arc_validate_strength(jsonb,jsonb,text) rename to arc_validate_strength_v12;
create function public.arc_validate_strength(p jsonb,old jsonb,day text) returns void
language plpgsql stable set search_path=public,pg_temp as $$
declare w jsonb;
begin
 perform public.arc_validate_strength_v12(p,old,day);
 for w in select value from jsonb_array_elements(coalesce(p#>'{strength,sessions}','[]')) union all select p#>'{strength,active}' where p#>>'{strength,active,id}' is not null loop
  if w ? 'adjustedMinutes' and (jsonb_typeof(w->'adjustedMinutes') is distinct from 'number' or (w->>'adjustedMinutes')::numeric<1 or (w->>'adjustedMinutes')::numeric<>floor((w->>'adjustedMinutes')::numeric)
     or (w->>'adjustedMinutes')::numeric>floor(((w->>'finishedAt')::numeric-(w->>'startedAt')::numeric-coalesce((w->>'pausedMs')::numeric,0))/60000)) then
   raise exception 'Passtiden kan bara kortas, inte förlängas.';
  end if;
  if exists(select 1 from jsonb_array_elements(coalesce(w->'exercises','[]')) e cross join lateral jsonb_array_elements(coalesce(e->'sets','[]')) s
            where s ? 'type' and s->>'type' not in ('failure','drop')) then
   raise exception 'Ogiltig settyp. Välj vanligt set, failure eller drop-set.';
  end if;
 end loop;
end;$$;

revoke all on function public.arc_prepare_strength_v12(jsonb,jsonb,text),public.arc_prepare_strength(jsonb,jsonb,text),public.arc_validate_strength_v12(jsonb,jsonb,text),public.arc_validate_strength(jsonb,jsonb,text) from public,anon,authenticated;
notify pgrst,'reload schema';
commit;
