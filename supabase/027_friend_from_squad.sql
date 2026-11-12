-- Add a squad member as a friend straight from their profile, without their friend code.
-- Works only for people you share a squad with; the request follows the same rules as a friend code:
-- a new request is pending until they accept, and if they already asked you it is accepted at once.
-- No stored data is changed.
begin;

create function public.request_friend_member(p_user uuid) returns text
language plpgsql volatile security definer set search_path=public,pg_temp as $$
declare v_row public.friendships;
begin
 if auth.uid() is null then raise exception 'Logga in först.'; end if;
 if p_user is null or p_user=auth.uid() then raise exception 'Du kan inte lägga till dig själv.'; end if;
 if not public.shares_squad(p_user) then raise exception 'Ni är inte i samma squad. Använd vänkoden i stället.'; end if;
 select * into v_row from public.friendships where least(requester,addressee)=least(auth.uid(),p_user) and greatest(requester,addressee)=greatest(auth.uid(),p_user);
 if v_row.id is null then insert into public.friendships(requester,addressee) values(auth.uid(),p_user); return 'pending'; end if;
 if v_row.status='accepted' then return 'accepted'; end if;
 if v_row.addressee=auth.uid() then update public.friendships set status='accepted' where id=v_row.id; return 'accepted'; end if;
 return 'pending';
end;$$;

revoke all on function public.request_friend_member(uuid) from public,anon;
grant execute on function public.request_friend_member(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
