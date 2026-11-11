-- Squad members can see each other's profile pictures.
-- 1) squad_avatars(squad): the profile picture path of every member, only for members of that squad.
-- 2) A read policy on the photo bucket for profile pictures (folder <user>/avatar/) of people you share a
--    squad with. Body photos and other private files stay private: only the avatar folder is opened.
-- No stored data is changed.
begin;

create function public.squad_avatars(p_squad uuid) returns table(user_id uuid, photo text)
language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
 if not public.is_squad_member(p_squad) then raise exception 'Squad access denied'; end if;
 return query select m.user_id, u.payload#>>'{profile,photo}'
  from public.squad_members m join public.user_states u on u.user_id=m.user_id
  where m.squad_id=p_squad and u.payload#>>'{profile,photo}' like m.user_id::text||'/avatar/%';
end;
$$;
revoke all on function public.squad_avatars(uuid) from public,anon,authenticated;
grant execute on function public.squad_avatars(uuid) to authenticated;

create policy arc_avatar_squad_read on storage.objects for select to authenticated using(
 bucket_id='arc-photos' and (storage.foldername(name))[2]='avatar'
 and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' and public.shares_squad(((storage.foldername(name))[1])::uuid));

notify pgrst,'reload schema';
commit;
