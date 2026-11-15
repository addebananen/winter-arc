-- Squad feed you choose yourself, photos on workouts and photo reactions.
-- 1) Only finished workouts (strength hub and training) and runs reach the squad feed automatically.
--    Habits and other cardio are shared only when the member picks them at check-in. The choice lives
--    in the save payload as squadShare = {"entries":["<day>:<habit id>",...],"cardio":["<session id>",...]}.
--    Posts that already exist stay as they are.
-- 2) A shared habit that is unchecked or unshared removes its post (no "Återtagen" leftovers), and can
--    be shared again later. A post the member deleted by hand still never comes back by itself.
-- 3) attach_activity_photo(event, path): add a photo to the post of a just-saved workout or run.
-- 4) photo_reactions: a small round picture as a reaction, one per member and post, visible to the squad.
-- No stored profiles, XP or history are changed.
begin;

alter function public.arc_squad_events(jsonb) rename to arc_squad_events_v30;
create function public.arc_squad_events(p jsonb) returns jsonb
language plpgsql immutable set search_path=public,pg_temp as $$
declare result jsonb='{}'; d record; e record; w jsonb; n integer; mins integer; prefix text;
 picked jsonb=p#>'{squadShare,entries}'; picked_cardio jsonb=p#>'{squadShare,cardio}';
begin
 if jsonb_typeof(picked) is distinct from 'array' then picked='[]'; end if;
 if jsonb_typeof(picked_cardio) is distinct from 'array' then picked_cardio='[]'; end if;
 if jsonb_typeof(p->'history')='object' then
  for d in select key,value from jsonb_each(p->'history') loop
   if jsonb_typeof(d.value->'entries') is distinct from 'object' then continue; end if;
   for e in select key,value from jsonb_each(d.value->'entries') loop
    if picked ? (d.key||':'||e.key) and coalesce((e.value->>'value')::numeric,0)>0 then
     result=result||jsonb_build_object('entry:'||d.key||':'||e.key,
      case when (e.value->>'value')::numeric >= (e.value->>'target')::numeric then 'Klar · ' else 'På väg · ' end
      ||left(coalesce(e.value->>'name','Dagens vana'),120)||' · '||(e.value->>'value')||' / '||(e.value->>'target')
      ||case when e.value ? 'durationMinutes' then ' · '||(e.value->>'durationMinutes')||' min' else '' end||' · '||d.key);
    end if;
   end loop;
  end loop;
 end if;
 foreach prefix in array array['training','strength'] loop
  for w in select value from jsonb_array_elements(coalesce(p#>array[prefix,'sessions'],'[]')) loop
   if w->>'finishedAt' is not null then
    if prefix='strength' then
     select count(*) into n from jsonb_array_elements(w->'exercises') x cross join lateral jsonb_array_elements(x->'sets') s where (s->>'done')::boolean;
    else
     select count(*) into n from jsonb_array_elements(w->'exercises') x cross join lateral jsonb_array_elements(x->'done') s where s::numeric>0;
    end if;
    mins=greatest(0,floor(((w->>'finishedAt')::numeric-(w->>'startedAt')::numeric-coalesce((w->>'pausedMs')::numeric,0))/60000));
    result=result||jsonb_build_object(prefix||':'||(w->>'id'),
     case when prefix='strength' then 'Styrkepass klart' else left(coalesce(w->>'title','Träningspass'),120)||' klart' end
     ||' · '||n||' set · '||mins||' min · '||(w->>'date'));
   end if;
  end loop;
 end loop;
 for w in select value from jsonb_array_elements(coalesce(p#>'{cardio,sessions}','[]')) loop
  if w->>'kind'='run' or picked_cardio ? (w->>'id') then
   result=result||jsonb_build_object('cardio:'||(w->>'id'),case w->>'kind' when 'run' then 'Löpning' when 'walk' then 'Promenad' when 'volleyball' then 'Volleyboll' else 'Klättring' end||' klart · '||(w->>'km')||' km · '||round((w->>'seconds')::numeric/60,1)||' min · '||(w->>'date'));
  end if;
 end loop;
 return result;
end;$$;

create or replace function public.arc_publish_activity() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
declare sid uuid; before_events jsonb; after_events jsonb; ev record; pid uuid; fresh boolean;
begin
 select squad_id into sid from public.squad_members where user_id=new.user_id;
 if sid is null then return new;end if;
 before_events=public.arc_squad_events(old.payload);after_events=public.arc_squad_events(new.payload);
 for ev in select key,value from jsonb_each_text(after_events) loop
  if before_events->>ev.key is not distinct from ev.value then continue;end if;
  pid=null;
  insert into public.squad_activity_events(user_id,event_key) values(new.user_id,ev.key)
   on conflict do nothing returning post_id into pid;
  fresh=pid is not null;
  if fresh then
   insert into public.posts(id,squad_id,user_id,body) values(pid,sid,new.user_id,left(ev.value,2000));
  else
   select post_id into pid from public.squad_activity_events where user_id=new.user_id and event_key=ev.key;
   update public.posts set body=left(ev.value,2000) where id=pid and squad_id=sid;
  end if;
 end loop;
 for ev in select key,value from jsonb_each_text(before_events) loop
  if after_events ? ev.key then continue; end if;
  select post_id into pid from public.squad_activity_events where user_id=new.user_id and event_key=ev.key;
  if split_part(ev.key,':',1) in ('entry','cardio') then
   -- Chosen shares: unchecking or unsharing takes the post away, and sharing again makes a new one.
   delete from public.posts where id=pid and squad_id=sid;
   delete from public.squad_activity_events where user_id=new.user_id and event_key=ev.key;
  else
   update public.posts set body=left('Återtagen registrering · '||ev.value,2000) where id=pid and squad_id=sid;
  end if;
 end loop;
 return new;
end;
$$;

create function public.attach_activity_photo(p_event text,p_path text) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare pid uuid;
begin
 if auth.uid() is null then raise exception 'Logga in först.';end if;
 if split_part(coalesce(p_event,''),':',1) not in ('strength','training','cardio') then raise exception 'Bara pass och löpning kan få en bild här.';end if;
 select post_id into pid from public.squad_activity_events where user_id=auth.uid() and event_key=p_event;
 if pid is null or not exists(select 1 from public.posts where id=pid) then raise exception 'Passet finns inte i squadets flöde.';end if;
 perform public.attach_post_photo(pid,p_path);
 return pid;
end;
$$;

create table public.photo_reactions (
 post_id uuid not null references public.posts(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 image_path text not null check(image_path like user_id::text||'/posts/%'),
 created_at timestamptz not null default now(),
 primary key(post_id,user_id)
);
alter table public.photo_reactions enable row level security;
revoke all on public.photo_reactions from public,anon,authenticated;
grant select,insert,update,delete on public.photo_reactions to authenticated;
create policy photo_reaction_read on public.photo_reactions for select to authenticated
 using(exists(select 1 from public.posts p where p.id=post_id and public.is_squad_member(p.squad_id)));
create policy photo_reaction_create on public.photo_reactions for insert to authenticated
 with check(user_id=auth.uid() and exists(select 1 from public.posts p where p.id=post_id and public.is_squad_member(p.squad_id))
  and exists(select 1 from storage.objects o where o.bucket_id='arc-photos' and o.name=image_path));
create policy photo_reaction_change on public.photo_reactions for update to authenticated
 using(user_id=auth.uid())
 with check(user_id=auth.uid() and exists(select 1 from storage.objects o where o.bucket_id='arc-photos' and o.name=image_path));
create policy photo_reaction_delete on public.photo_reactions for delete to authenticated using(user_id=auth.uid());

-- Reaction pictures are readable by the squad of the post they react to. Nothing else is opened.
-- A definer helper keeps the storage policy from looping back into the photo_reactions policies.
create function public.can_see_reaction_photo(p_name text) returns boolean
language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.photo_reactions r join public.posts p on p.id=r.post_id
  where r.image_path=p_name and public.is_squad_member(p.squad_id));
$$;
revoke all on function public.can_see_reaction_photo(text) from public,anon;
grant execute on function public.can_see_reaction_photo(text) to authenticated;
create policy arc_reaction_photo_read on storage.objects for select to authenticated using(
 bucket_id='arc-photos' and public.can_see_reaction_photo(name));

create function public.squad_feed_choice_ready() returns boolean language sql stable as $$select true$$;
revoke all on function public.arc_squad_events(jsonb),public.arc_squad_events_v30(jsonb),public.arc_publish_activity(),public.attach_activity_photo(text,text),public.squad_feed_choice_ready() from public,anon,authenticated;
grant execute on function public.attach_activity_photo(text,text),public.squad_feed_choice_ready() to authenticated;

-- Record the migration once 028 (schema_status) is installed; before that it is found by fingerprint.
do $$begin
 if to_regclass('public.schema_migrations') is not null then
  insert into public.schema_migrations(name) values('031_squad_feed_choice') on conflict do nothing;
 end if;
end$$;
notify pgrst,'reload schema';
commit;
