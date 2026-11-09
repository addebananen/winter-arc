-- Training streak: one flame per day with a saved Styrkehub workout.
-- One rest day between workouts is allowed; two days in a row without a workout resets the streak.
-- Mirrors trainingStreak() in src/strength.js. Read-only: no stored data is changed.
begin;
create or replace function public.arc_training_streak(p jsonb, v_day date) returns integer
language plpgsql stable set search_path=public,pg_temp as $$
declare d date; prev date; n integer=0;
begin
 for d in select distinct (s.value->>'date')::date from jsonb_array_elements(coalesce(p#>'{strength,sessions}','[]'::jsonb)) s
   where s.value->>'finishedAt' is not null and s.value->>'date' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' and (s.value->>'date')::date<=v_day
   order by 1 desc loop
  if prev is null then
   if d<v_day-2 then return 0; end if;
  elsif prev-d>2 then exit;
  end if;
  n=n+1; prev=d;
 end loop;
 return n;
end;$$;

create or replace function public.squad_training_streaks(p_squad uuid)
returns table(user_id uuid, training_streak integer, trained_today boolean)
language plpgsql stable security definer set search_path=public,pg_temp as $$
declare r record; v_day date;
begin
 if not public.is_squad_member(p_squad) then raise exception 'Squad access denied'; end if;
 for r in select m.user_id as member, u.payload from public.squad_members m left join public.user_states u on u.user_id=m.user_id where m.squad_id=p_squad loop
  user_id=r.member;
  v_day=(now() at time zone coalesce(r.payload->>'timezone','UTC'))::date;
  training_streak=public.arc_training_streak(coalesce(r.payload,'{}'::jsonb),v_day);
  trained_today=exists(select 1 from jsonb_array_elements(coalesce(r.payload#>'{strength,sessions}','[]'::jsonb)) s where s.value->>'finishedAt' is not null and s.value->>'date'=v_day::text);
  return next;
 end loop;
end;$$;

revoke all on function public.arc_training_streak(jsonb,date), public.squad_training_streaks(uuid) from public, anon;
grant execute on function public.squad_training_streaks(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
