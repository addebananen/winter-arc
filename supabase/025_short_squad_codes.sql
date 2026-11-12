-- Short squad codes that are easy to write down and say out loud: eight characters shown as XXXX-XXXX,
-- without look-alike characters (no 0/O, 1/I/L). Every squad gets one, new squads get one automatically.
-- Joining accepts the short code in any case, with or without the dash or spaces. The old 36-character
-- invitation codes keep working, so codes that are already shared are not broken.
-- Like the old code, the short code is hidden from table reads; members fetch it with get_squad_code.
-- No other stored data is changed.
begin;

alter table public.squads add column short_code text unique check(short_code ~ '^[A-HJKMNP-Z2-9]{8}$');

create function public.arc_new_squad_code() returns text
language plpgsql volatile set search_path=public,pg_temp as $$
declare alphabet constant text:='ABCDEFGHJKMNPQRSTUVWXYZ23456789'; b bytea:=extensions.gen_random_bytes(8); v text:='';
begin
 for i in 0..7 loop v=v||substr(alphabet,1+(get_byte(b,i)%length(alphabet)),1); end loop;
 return v;
end;$$;

-- Give every existing squad a code (retry on the rare collision).
do $$
declare r record; done boolean;
begin
 for r in select id from public.squads where short_code is null loop
  done=false;
  while not done loop
   begin update public.squads set short_code=public.arc_new_squad_code() where id=r.id; done=true;
   exception when unique_violation then done=false; end;
  end loop;
 end loop;
end $$;

create function public.arc_squad_short_code() returns trigger
language plpgsql set search_path=public,pg_temp as $$
begin
 if new.short_code is null then
  loop
   new.short_code=public.arc_new_squad_code();
   exit when not exists(select 1 from public.squads where short_code=new.short_code);
  end loop;
 end if;
 return new;
end;$$;
create trigger squads_short_code before insert on public.squads for each row execute function public.arc_squad_short_code();
alter table public.squads alter column short_code set not null;

-- Members see the short code, formatted XXXX-XXXX.
create or replace function public.get_squad_code(p_squad uuid) returns text
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_code text;
begin
 if not public.is_squad_member(p_squad) then raise exception 'Only squad members can see the invitation code'; end if;
 select short_code into v_code from public.squads where id=p_squad;
 return substr(v_code,1,4)||'-'||substr(v_code,5,4);
end;
$$;

-- Join with the short code (any case, dash and spaces ignored) or an old 36-character code.
create or replace function public.join_squad(p_code text) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid; v_code text:=upper(regexp_replace(coalesce(p_code,''),'[\s-]','','g'));
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if length(v_code)=8 then select id into v_id from public.squads where short_code=v_code;
 elsif length(trim(p_code))=36 then select id into v_id from public.squads where invite_code=trim(p_code);
 else raise exception 'Invalid invitation code'; end if;
 if v_id is null then raise exception 'Invitation not found'; end if;
 if exists(select 1 from public.squad_members where user_id=auth.uid()) then raise exception 'You already belong to a squad'; end if;
 insert into public.squad_members(squad_id,user_id) values(v_id,auth.uid());return v_id;
end;
$$;

revoke all on function public.arc_new_squad_code(),public.arc_squad_short_code() from public,anon,authenticated;
revoke all on function public.get_squad_code(uuid),public.join_squad(text) from public,anon,authenticated;
grant execute on function public.get_squad_code(uuid),public.join_squad(text) to authenticated;
notify pgrst,'reload schema';
commit;
