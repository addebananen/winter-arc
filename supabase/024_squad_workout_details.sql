-- Read-only workout sharing for existing activity posts, plus eight reactions.
-- No private state, body measurements, notes or photographs are returned.
begin;
alter table public.reactions drop constraint reactions_kind_check;
alter table public.reactions add constraint reactions_kind_check
 check(kind in ('fire','clap','heart','strong','mind','rocket','respect','party'));

create function public.squad_workout_feed(p_squad uuid)
returns table(post_id uuid,workout jsonb)
language plpgsql stable security definer set search_path=public,pg_temp as $$
declare r record; w jsonb; x jsonb; st jsonb; moves jsonb; sets jsonb; minutes numeric; k text;
begin
 if auth.uid() is null or not public.is_squad_member(p_squad) then
  raise exception 'Squad access denied';
 end if;
 for r in
  select p.id,e.event_key,u.payload
  from (select id,user_id from public.posts where squad_id=p_squad order by created_at desc limit 50) p
  join public.squad_activity_events e on e.post_id=p.id and e.user_id=p.user_id
  join public.user_states u on u.user_id=p.user_id
  where split_part(e.event_key,':',1) in ('strength','training','cardio')
 loop
  k=split_part(r.event_key,':',1);
  select value into w from jsonb_array_elements(coalesce(r.payload#>array[k,'sessions'],'[]'))
   where value->>'id'=split_part(r.event_key,':',2) and value->>'finishedAt' is not null limit 1;
  post_id=r.id;
  if w is null then workout=jsonb_build_object('kind',k,'unavailable',true);return next;continue;end if;
  if k='cardio' then
   workout=jsonb_build_object('kind',k,'date',w->'date','activity',w->'kind','km',w->'km','seconds',w->'seconds');
  else
   minutes=greatest(0,floor(((w->>'finishedAt')::numeric-(w->>'startedAt')::numeric-coalesce((w->>'pausedMs')::numeric,0))/60000));
   if k='strength' and w ? 'adjustedMinutes' then minutes=least(minutes,greatest(0,(w->>'adjustedMinutes')::numeric));end if;
   moves='[]';
   for x in select value from jsonb_array_elements(coalesce(w->'exercises','[]')) loop
    sets='[]';
    if k='strength' then
     for st in select value from jsonb_array_elements(coalesce(x->'sets','[]')) loop
      if coalesce((st->>'done')::boolean,false) then
       sets=sets||jsonb_build_array(jsonb_build_object('kg',st->'kg','reps',st->'reps','type',coalesce(st->>'type','normal')));
      end if;
     end loop;
    else
     for st in select value from jsonb_array_elements(coalesce(x->'done','[]')) loop
      if st::numeric>0 then sets=sets||jsonb_build_array(jsonb_build_object('reps',st));end if;
     end loop;
    end if;
    if jsonb_array_length(sets)>0 then moves=moves||jsonb_build_array(jsonb_build_object('id',x->'id','sets',sets));end if;
   end loop;
   workout=jsonb_build_object('kind',k,'date',w->'date','minutes',minutes,'exercises',moves,
    'title',case when k='strength' then 'Styrkepass' else left(coalesce(w->>'title','Träningspass'),120) end);
  end if;
  return next;
 end loop;
end;
$$;
revoke all on function public.squad_workout_feed(uuid) from public,anon;
grant execute on function public.squad_workout_feed(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
