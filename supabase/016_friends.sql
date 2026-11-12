-- Friends: a wider circle than the squad. Add someone with their friend code; they accept the request.
-- Friends see each other's name, level/XP, character, habit streak and training streak. Never private data
-- (body photos, measurements, journals, goals) and never anything before the request is accepted.
-- New tables and functions only; no stored data is changed.
begin;

create table public.friend_codes(
 user_id uuid primary key references auth.users(id) on delete cascade,
 code text not null unique check(code ~ '^[A-Z0-9]{8}$')
);
create table public.friendships(
 id uuid primary key default gen_random_uuid(),
 requester uuid not null references auth.users(id) on delete cascade,
 addressee uuid not null references auth.users(id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','accepted')),
 created_at timestamptz not null default now(),
 check(requester<>addressee)
);
create unique index friendships_pair on public.friendships(least(requester,addressee),greatest(requester,addressee));
alter table public.friend_codes enable row level security;
alter table public.friendships enable row level security;
-- Only participants can read a friendship; all changes go through the functions below.
create policy friendships_read on public.friendships for select to authenticated using(auth.uid() in (requester,addressee));
create policy friend_codes_read on public.friend_codes for select to authenticated using(user_id=auth.uid());
grant select on public.friendships, public.friend_codes to authenticated;

create function public.my_friend_code() returns text
language plpgsql volatile security definer set search_path=public,pg_temp as $$
declare v text;
begin
 if auth.uid() is null then raise exception 'Logga in först.'; end if;
 select code into v from public.friend_codes where user_id=auth.uid();
 while v is null loop
  v=upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
  begin insert into public.friend_codes(user_id,code) values(auth.uid(),v);
  exception when unique_violation then select code into v from public.friend_codes where user_id=auth.uid(); end;
 end loop;
 return v;
end;$$;

create function public.request_friend(p_code text) returns text
language plpgsql volatile security definer set search_path=public,pg_temp as $$
declare v_other uuid; v_row public.friendships;
begin
 if auth.uid() is null then raise exception 'Logga in först.'; end if;
 select user_id into v_other from public.friend_codes where code=upper(trim(p_code));
 if v_other is null then raise exception 'Hittade ingen med den vänkoden.'; end if;
 if v_other=auth.uid() then raise exception 'Det är din egen vänkod.'; end if;
 select * into v_row from public.friendships where least(requester,addressee)=least(auth.uid(),v_other) and greatest(requester,addressee)=greatest(auth.uid(),v_other);
 if v_row.id is null then insert into public.friendships(requester,addressee) values(auth.uid(),v_other); return 'pending'; end if;
 if v_row.status='accepted' then return 'accepted'; end if;
 -- They already asked you: adding their code accepts it.
 if v_row.addressee=auth.uid() then update public.friendships set status='accepted' where id=v_row.id; return 'accepted'; end if;
 return 'pending';
end;$$;

create function public.respond_friend(p_id uuid, p_accept boolean) returns void
language plpgsql volatile security definer set search_path=public,pg_temp as $$
begin
 if not exists(select 1 from public.friendships where id=p_id and addressee=auth.uid() and status='pending') then raise exception 'Förfrågan finns inte längre.'; end if;
 if p_accept then update public.friendships set status='accepted' where id=p_id; else delete from public.friendships where id=p_id; end if;
end;$$;

create function public.remove_friend(p_id uuid) returns void
language plpgsql volatile security definer set search_path=public,pg_temp as $$
begin
 delete from public.friendships where id=p_id and auth.uid() in (requester,addressee);
end;$$;

create function public.friends_overview()
returns table(friendship_id uuid, user_id uuid, display_name text, relation text, xp bigint, streak integer, training_streak integer, trained_today boolean, char_kind text, char_name text)
language plpgsql stable security definer set search_path=public,pg_temp as $$
declare r record; hist jsonb; v_day date; d date; perfect boolean;
begin
 if auth.uid() is null then raise exception 'Logga in först.'; end if;
 for r in select f.id, f.status, f.requester, case when f.requester=auth.uid() then f.addressee else f.requester end as other, p.display_name as name, u.payload
   from public.friendships f
   left join public.profiles p on p.id=case when f.requester=auth.uid() then f.addressee else f.requester end
   left join public.user_states u on u.user_id=case when f.requester=auth.uid() then f.addressee else f.requester end
   where auth.uid() in (f.requester,f.addressee) order by f.created_at loop
  friendship_id=r.id; user_id=r.other; display_name=coalesce(r.name,'Äventyrare');
  relation=case when r.status='accepted' then 'friend' when r.requester=auth.uid() then 'outgoing' else 'incoming' end;
  xp=null; streak=null; training_streak=null; trained_today=null; char_kind=null; char_name=null;
  if r.status='accepted' and r.payload is not null then
   v_day=(now() at time zone coalesce(r.payload->>'timezone','UTC'))::date; hist=coalesce(r.payload->'history','{}');
   perfect=v_day::text>=coalesce(r.payload#>>'{expedition,start}','2026-11-09') and public.arc_perfect(hist->v_day::text);
   streak=0; d=case when perfect then v_day else v_day-1 end;
   while d::text>=coalesce(r.payload#>>'{expedition,start}','2026-11-09') and public.arc_perfect(hist->d::text) and streak<10000 loop streak=streak+1; d=d-1; end loop;
   xp=public.arc_total_xp(r.payload,v_day::text)::bigint;
   training_streak=public.arc_training_streak(r.payload,v_day);
   trained_today=exists(select 1 from jsonb_array_elements(coalesce(r.payload#>'{strength,sessions}','[]'::jsonb)) s where s.value->>'finishedAt' is not null and s.value->>'date'=v_day::text);
   char_kind=left(r.payload#>>'{profile,character}',20); char_name=left(r.payload#>>'{profile,characterName}',40);
  end if;
  return next;
 end loop;
end;$$;

create function public.friends_ready() returns boolean language sql stable as $$select true$$;

revoke all on function public.my_friend_code(),public.request_friend(text),public.respond_friend(uuid,boolean),public.remove_friend(uuid),public.friends_overview(),public.friends_ready() from public,anon;
grant execute on function public.my_friend_code(),public.request_friend(text),public.respond_friend(uuid,boolean),public.remove_friend(uuid),public.friends_overview(),public.friends_ready() to authenticated;
notify pgrst,'reload schema';
commit;
