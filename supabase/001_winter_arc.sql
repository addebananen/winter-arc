-- Run once in a NEW Supabase project's SQL editor. No secrets belong in this file.
begin;
create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'Äventyrare' check(length(display_name) between 1 and 40)
);
create table public.user_states (
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null,
 revision bigint not null default 1,
 updated_at timestamptz not null default now()
);
create table public.squads (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(trim(name)) between 1 and 40),
 created_by uuid not null references public.profiles(id),
 invite_code text not null unique default encode(extensions.gen_random_bytes(18),'hex'),
 created_at timestamptz not null default now()
);
create table public.squad_members (
 squad_id uuid not null references public.squads(id) on delete cascade,
 user_id uuid not null unique references public.profiles(id) on delete cascade,
 joined_at timestamptz not null default now(), primary key(squad_id,user_id)
);
create table public.posts (
 id uuid primary key default gen_random_uuid(),
 squad_id uuid not null references public.squads(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check(length(trim(body)) between 1 and 2000),
 image_path text,
 created_at timestamptz not null default now(),
 check(image_path is null or image_path like user_id::text||'/posts/%')
);
create table public.reactions (
 post_id uuid not null references public.posts(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 kind text not null check(kind in ('fire','clap','heart')),
 primary key(post_id,user_id,kind)
);
create table public.missions (
 id uuid primary key default gen_random_uuid(),
 squad_id uuid not null references public.squads(id) on delete cascade,
 created_by uuid not null references public.profiles(id),
 name text not null check(length(trim(name)) between 1 and 80),
 target integer not null check(target between 1 and 10000),
 deadline date not null,
 created_at timestamptz not null default now()
);
create index on public.posts(squad_id,created_at desc);
create index on public.squad_members(user_id);
create index on public.reactions(post_id);
create index on public.missions(squad_id);

-- SECURITY DEFINER helpers avoid recursive membership policies. Fixed search_path.
create function public.is_squad_member(p_squad uuid) returns boolean
language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.squad_members where squad_id=p_squad and user_id=auth.uid());
$$;
create function public.shares_squad(p_user uuid) returns boolean
language sql stable security definer set search_path=public,pg_temp as $$
 select auth.uid()=p_user or exists(select 1 from public.squad_members a join public.squad_members b on a.squad_id=b.squad_id where a.user_id=auth.uid() and b.user_id=p_user);
$$;

alter table public.profiles enable row level security;
alter table public.user_states enable row level security;
alter table public.squads enable row level security;
alter table public.squad_members enable row level security;
alter table public.posts enable row level security;
alter table public.reactions enable row level security;
alter table public.missions enable row level security;
create policy profiles_read on public.profiles for select to authenticated using(public.shares_squad(id));
create policy state_read on public.user_states for select to authenticated using(user_id=auth.uid());
create policy squad_read on public.squads for select to authenticated using(public.is_squad_member(id));
create policy member_read on public.squad_members for select to authenticated using(public.is_squad_member(squad_id));
create policy post_read on public.posts for select to authenticated using(public.is_squad_member(squad_id));
create policy post_create on public.posts for insert to authenticated with check(user_id=auth.uid() and public.is_squad_member(squad_id));
create policy post_delete on public.posts for delete to authenticated using(user_id=auth.uid());
create policy reaction_read on public.reactions for select to authenticated using(exists(select 1 from public.posts p where p.id=post_id and public.is_squad_member(p.squad_id)));
create policy reaction_create on public.reactions for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.posts p where p.id=post_id and public.is_squad_member(p.squad_id)));
create policy reaction_delete on public.reactions for delete to authenticated using(user_id=auth.uid());
create policy mission_read on public.missions for select to authenticated using(public.is_squad_member(squad_id));
create policy mission_create on public.missions for insert to authenticated with check(created_by=auth.uid() and public.is_squad_member(squad_id) and deadline=(date_trunc('week',now() at time zone 'Europe/Stockholm')::date+6));

-- No direct writes to private state, public names, or membership; use bounded RPCs.
revoke all on public.profiles,public.user_states,public.squads,public.squad_members,public.posts,public.reactions,public.missions from anon,authenticated;
grant select on public.profiles,public.user_states,public.squad_members,public.posts,public.reactions,public.missions to authenticated;
grant select(id,name,created_by,created_at) on public.squads to authenticated;
grant insert,delete on public.posts,public.reactions to authenticated;
grant insert on public.missions to authenticated;

create function public.save_arc_state(p_payload jsonb,p_expected_revision bigint) returns bigint
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_revision bigint; v_name text; v_tz text; v_today text; h record; e record;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if pg_column_size(p_payload)>1500000 then raise exception 'Your journal is too large. Export it before continuing.'; end if;
 if jsonb_typeof(p_payload) is distinct from 'object' or p_payload->>'version' is distinct from '1'
   or jsonb_typeof(p_payload->'habits') is distinct from 'array' or jsonb_typeof(p_payload->'history') is distinct from 'object'
   or jsonb_typeof(p_payload->'body') is distinct from 'array' or jsonb_typeof(p_payload->'claims') is distinct from 'object'
   or jsonb_typeof(p_payload->'goals') is distinct from 'array' or jsonb_typeof(p_payload->'reflections') is distinct from 'array'
   or jsonb_typeof(p_payload->'rewards') is distinct from 'array' then raise exception 'Invalid state'; end if;
 v_name=trim(p_payload#>>'{profile,name}');
 if v_name is null or length(v_name) not between 1 and 40 then raise exception 'Invalid profile name'; end if;
 v_tz=p_payload->>'timezone';
 if not exists(select 1 from pg_timezone_names where name=v_tz) then raise exception 'Invalid timezone'; end if;
 v_today=(now() at time zone v_tz)::date::text;
 for h in select key,value from jsonb_each(p_payload->'history') loop
   if h.key !~ '^\d{4}-\d{2}-\d{2}$' or h.key>v_today or jsonb_typeof(h.value->'entries') is distinct from 'object' or jsonb_typeof(h.value->'required') is distinct from 'array' then raise exception 'Invalid daily history'; end if;
   for e in select key,value from jsonb_each(h.value->'entries') loop
     if jsonb_typeof(e.value->'value') is distinct from 'number' or jsonb_typeof(e.value->'target') is distinct from 'number' or jsonb_typeof(e.value->'xp') is distinct from 'number' then raise exception 'Invalid daily progress'; end if;
     if (e.value->>'target')::numeric<=0 or (e.value->>'target')::numeric>100000 or (e.value->>'value')::numeric<0 or (e.value->>'value')::numeric>(e.value->>'target')::numeric or (e.value->>'xp')::numeric not between 1 and 40 then raise exception 'Invalid daily values'; end if;
   end loop;
 end loop;
 if exists(select 1 from jsonb_array_elements(p_payload->'body') b where b->>'photo' is not null and b->>'photo' not like auth.uid()::text||'/body/%') then raise exception 'Invalid private image reference'; end if;
 if p_expected_revision=0 then
   insert into public.user_states(user_id,payload) values(auth.uid(),p_payload) on conflict do nothing returning revision into v_revision;
 else
   update public.user_states set payload=p_payload,revision=revision+1,updated_at=now() where user_id=auth.uid() and revision=p_expected_revision returning revision into v_revision;
 end if;
 if v_revision is null then raise exception 'Revision conflict. Refresh before saving.'; end if;
 insert into public.profiles(id,display_name) values(auth.uid(),v_name) on conflict(id) do update set display_name=excluded.display_name;
 return v_revision;
end;
$$;

create function public.create_squad(p_name text) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if not exists(select 1 from public.profiles where id=auth.uid()) then raise exception 'Complete your profile first'; end if;
 if exists(select 1 from public.squad_members where user_id=auth.uid()) then raise exception 'You already belong to a squad'; end if;
 insert into public.squads(name,created_by) values(trim(p_name),auth.uid()) returning id into v_id;
 insert into public.squad_members(squad_id,user_id) values(v_id,auth.uid());return v_id;
end;
$$;
create function public.join_squad(p_code text) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if length(p_code)<>36 then raise exception 'Invalid invitation code'; end if;
 select id into v_id from public.squads where invite_code=p_code;
 if v_id is null then raise exception 'Invitation not found'; end if;
 if exists(select 1 from public.squad_members where user_id=auth.uid()) then raise exception 'You already belong to a squad'; end if;
 insert into public.squad_members(squad_id,user_id) values(v_id,auth.uid());return v_id;
end;
$$;
create function public.get_squad_code(p_squad uuid) returns text
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_code text;
begin
 select invite_code into v_code from public.squads where id=p_squad and created_by=auth.uid();
 if v_code is null then raise exception 'Only the squad creator can share an invitation code'; end if;
 return v_code;
end;
$$;

-- Derived progress, never exposes private goals, body metrics, photos or reflections.
create function public.arc_day_done(p_day jsonb) returns integer
language sql immutable set search_path=public,pg_temp as $$
 select count(*)::integer from jsonb_each(coalesce(p_day->'entries','{}')) e
 where (e.value->>'value')::numeric >= (e.value->>'target')::numeric and (e.value->>'target')::numeric>0;
$$;
create function public.arc_perfect(p_day jsonb) returns boolean
language sql immutable set search_path=public,pg_temp as $$
 select coalesce(jsonb_array_length(p_day->'required')>0 and not exists(
 select 1 from jsonb_array_elements_text(p_day->'required') id where not coalesce((p_day->'entries'->id->>'value')::numeric >= (p_day->'entries'->id->>'target')::numeric,false)),false);
$$;
create function public.squad_progress(p_squad uuid)
returns table(user_id uuid,display_name text,xp bigint,streak integer,perfect_today boolean,completed_week integer)
language plpgsql stable security definer set search_path=public,pg_temp as $$
declare r record; hist jsonb; v_day date; d date; rec record; n integer; base numeric; total numeric; cnt integer;
begin
 if not public.is_squad_member(p_squad) then raise exception 'Squad access denied'; end if;
 for r in select m.user_id,p.display_name,u.payload from public.squad_members m join public.profiles p on p.id=m.user_id left join public.user_states u on u.user_id=m.user_id where m.squad_id=p_squad loop
   user_id=r.user_id;display_name=r.display_name;hist=coalesce(r.payload->'history','{}');
   v_day=(now() at time zone coalesce(r.payload->>'timezone','UTC'))::date;
   perfect_today=public.arc_perfect(hist->v_day::text);streak=0;d=case when perfect_today then v_day else v_day-1 end;
   while public.arc_perfect(hist->d::text) and streak<10000 loop streak=streak+1;d=d-1;end loop;
   total=0;completed_week=0;
   for rec in select key,value from jsonb_each(hist) loop
     if rec.key ~ '^\d{4}-\d{2}-\d{2}$' and rec.key<=v_day::text then
       cnt=public.arc_day_done(rec.value);
       select coalesce(sum(least(40,greatest(0,(e.value->>'xp')::numeric))),0) into base from jsonb_each(coalesce(rec.value->'entries','{}')) e where (e.value->>'value')::numeric>=(e.value->>'target')::numeric;
       total=total+round(base*case when cnt>=5 then 1.5 when cnt>=3 then 1.2 else 1 end);
       if rec.key>=date_trunc('week',v_day)::date::text then completed_week=completed_week+cnt;end if;
     end if;
   end loop;
   -- Bonus claims are bounded to known quest types; friends track their own habits.
   for rec in select key,value from jsonb_each(coalesce(r.payload->'claims','{}')) loop
     if rec.value->>'date'<=v_day::text then total=total+case when rec.key like 'three:%' then 50 when rec.key like 'perfect:%' then 100 when rec.key like 'reflect:%' then 75 when rec.key like 'comeback:%' then 40 else 0 end;end if;
   end loop;
   xp=total::bigint;return next;
 end loop;
end;
$$;
create function public.mission_progress(p_squad uuid)
returns table(id uuid,completed integer)
language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
 if not public.is_squad_member(p_squad) then raise exception 'Squad access denied'; end if;
 return query select m.id,coalesce(sum(public.arc_day_done(h.value)),0)::integer
 from public.missions m left join public.squad_members sm on sm.squad_id=m.squad_id
 left join public.user_states s on s.user_id=sm.user_id
 left join lateral jsonb_each(coalesce(s.payload->'history','{}')) h on h.key>=(m.deadline-6)::text and h.key<=least(m.deadline,current_date)::text
 where m.squad_id=p_squad group by m.id;
end;
$$;

-- Private bucket. Body images are owner-only; a posted image is readable by its squad.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('arc-photos','arc-photos',false,5242880,array['image/jpeg']) on conflict(id) do nothing;
create policy arc_photo_insert on storage.objects for insert to authenticated with check(bucket_id='arc-photos' and (storage.foldername(name))[1]=auth.uid()::text and (storage.foldername(name))[2] in ('body','posts'));
create policy arc_photo_read on storage.objects for select to authenticated using(bucket_id='arc-photos' and ((storage.foldername(name))[1]=auth.uid()::text or exists(select 1 from public.posts p where p.image_path=name and public.is_squad_member(p.squad_id))));
create policy arc_photo_delete on storage.objects for delete to authenticated using(bucket_id='arc-photos' and (storage.foldername(name))[1]=auth.uid()::text);

-- Function execution is authenticated-only; internal scoring helpers stay private.
revoke all on function public.is_squad_member(uuid),public.shares_squad(uuid),public.save_arc_state(jsonb,bigint),public.create_squad(text),public.join_squad(text),public.get_squad_code(uuid),public.arc_day_done(jsonb),public.arc_perfect(jsonb),public.squad_progress(uuid),public.mission_progress(uuid) from public,anon,authenticated;
grant execute on function public.is_squad_member(uuid),public.shares_squad(uuid),public.save_arc_state(jsonb,bigint),public.create_squad(text),public.join_squad(text),public.get_squad_code(uuid),public.squad_progress(uuid),public.mission_progress(uuid) to authenticated;
commit;
