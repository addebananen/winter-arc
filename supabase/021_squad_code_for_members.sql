-- Every squad member can see the squad's invitation code, so the code can be shown at the top of the
-- Squad tab for everyone (they joined with it anyway). Before this, only the creator could fetch it.
-- Accounts outside the squad still cannot read the code, and the code column stays hidden from table reads.
-- No stored data is changed.
begin;

create or replace function public.get_squad_code(p_squad uuid) returns text
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_code text;
begin
 if not public.is_squad_member(p_squad) then raise exception 'Only squad members can see the invitation code'; end if;
 select invite_code into v_code from public.squads where id=p_squad;
 return v_code;
end;
$$;

revoke all on function public.get_squad_code(uuid) from public,anon,authenticated;
grant execute on function public.get_squad_code(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
