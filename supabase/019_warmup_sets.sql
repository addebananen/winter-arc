-- Warm-up sets: a set may carry type 'warmup' besides 'failure' and 'drop' (013). Mirrors setTypes in
-- src/strength.js. Warm-up sets are checked like any other set; only the type tag is new.
-- Removing or reordering exercises in the active workout needs no server change. No stored data is changed.
begin;

-- The earlier checks only know 'failure' and 'drop', so they get a copy where warm-up sets look like normal sets.
create function public.arc_strip_warmup_workout(w jsonb) returns jsonb
language sql immutable set search_path=public,pg_temp as $$
 select case when jsonb_typeof(w->'exercises') is distinct from 'array' then w else
  jsonb_set(w,'{exercises}',coalesce((select jsonb_agg(case when jsonb_typeof(e->'sets')='array' then
   jsonb_set(e,'{sets}',coalesce((select jsonb_agg(case when jsonb_typeof(s)='object' and s->>'type'='warmup' then s-'type' else s end order by j)
    from jsonb_array_elements(e->'sets') with ordinality u(s,j)),'[]'::jsonb)) else e end order by i)
   from jsonb_array_elements(w->'exercises') with ordinality t(e,i)),'[]'::jsonb)) end;
$$;

create function public.arc_strip_warmup(p jsonb) returns jsonb
language sql immutable set search_path=public,pg_temp as $$
 select case when p is null or jsonb_typeof(p->'strength') is distinct from 'object' then p else
  jsonb_set(p,'{strength}',(p->'strength')
   ||case when jsonb_typeof(p#>'{strength,sessions}')='array' then jsonb_build_object('sessions',coalesce((select jsonb_agg(public.arc_strip_warmup_workout(w) order by i)
      from jsonb_array_elements(p#>'{strength,sessions}') with ordinality t(w,i)),'[]'::jsonb)) else '{}'::jsonb end
   ||case when jsonb_typeof(p#>'{strength,active}')='object' then jsonb_build_object('active',public.arc_strip_warmup_workout(p#>'{strength,active}')) else '{}'::jsonb end)
 end;
$$;

alter function public.arc_validate_strength(jsonb,jsonb,text) rename to arc_validate_strength_v15;
create function public.arc_validate_strength(p jsonb,old jsonb,day text) returns void
language plpgsql stable set search_path=public,pg_temp as $$
begin
 perform public.arc_validate_strength_v15(public.arc_strip_warmup(p),public.arc_strip_warmup(old),day);
end;$$;

revoke all on function public.arc_strip_warmup_workout(jsonb),public.arc_strip_warmup(jsonb),public.arc_validate_strength_v15(jsonb,jsonb,text),public.arc_validate_strength(jsonb,jsonb,text) from public,anon,authenticated;
notify pgrst,'reload schema';
commit;
