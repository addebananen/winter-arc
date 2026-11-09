-- Correct the single-hold goal without changing saved workouts, XP or baselines.
begin;
alter function public.arc_strength_meta(text) rename to arc_strength_meta_v10;
create function public.arc_strength_meta(id text) returns jsonb
language sql immutable set search_path=public,pg_temp as $$
 select case when id='sk-oahs-7'
  then jsonb_set(public.arc_strength_meta_v10(id),'{unit}','"sek"'::jsonb)
  else public.arc_strength_meta_v10(id) end
$$;
revoke all on function public.arc_strength_meta_v10(text) from public,anon,authenticated;
notify pgrst,'reload schema';
commit;
