-- Open each other's profiles: character, rank, level, streaks and number of workouts.
-- Allowed for yourself, accepted friends (016) and people in the same squad. New function only; no data is changed.
begin;

create function public.member_profile(p_user uuid)
returns table(user_id uuid, display_name text, title text, relation text, xp bigint, streak integer, training_streak integer, trained_today boolean, workouts integer, char_kind text, char_name text)
language plpgsql stable security definer set search_path=public,pg_temp as $$
declare v_payload jsonb; hist jsonb; v_day date; d date; perfect boolean;
begin
 if auth.uid() is null then raise exception 'Logga in först.'; end if;
 relation=case when p_user=auth.uid() then 'self'
  when exists(select 1 from public.friendships f where f.status='accepted' and least(f.requester,f.addressee)=least(auth.uid(),p_user) and greatest(f.requester,f.addressee)=greatest(auth.uid(),p_user)) then 'friend'
  when public.shares_squad(p_user) then 'squad' end;
 if relation is null then raise exception 'Profilen är privat.'; end if;
 user_id=p_user;
 select p.display_name into display_name from public.profiles p where p.id=p_user;
 display_name=coalesce(display_name,'Äventyrare');
 select u.payload into v_payload from public.user_states u where u.user_id=p_user;
 xp=0; streak=0; training_streak=0; trained_today=false; workouts=0;
 if v_payload is not null then
  v_day=(now() at time zone coalesce(v_payload->>'timezone','UTC'))::date; hist=coalesce(v_payload->'history','{}');
  perfect=v_day::text>=coalesce(v_payload#>>'{expedition,start}','2026-11-09') and public.arc_perfect(hist->v_day::text);
  d=case when perfect then v_day else v_day-1 end;
  while d::text>=coalesce(v_payload#>>'{expedition,start}','2026-11-09') and public.arc_perfect(hist->d::text) and streak<10000 loop streak=streak+1; d=d-1; end loop;
  xp=public.arc_total_xp(v_payload,v_day::text)::bigint;
  training_streak=public.arc_training_streak(v_payload,v_day);
  select count(*)::integer, coalesce(bool_or(s.value->>'date'=v_day::text),false) into workouts, trained_today
   from jsonb_array_elements(coalesce(v_payload#>'{strength,sessions}','[]'::jsonb)) s where s.value->>'finishedAt' is not null;
  title=left(v_payload#>>'{profile,title}',40); char_kind=left(v_payload#>>'{profile,character}',20); char_name=left(v_payload#>>'{profile,characterName}',40);
 end if;
 return next;
end;$$;

revoke all on function public.member_profile(uuid) from public,anon;
grant execute on function public.member_profile(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
