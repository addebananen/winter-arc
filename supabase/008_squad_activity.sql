-- Apply once after the PR is merged. Existing profiles, XP and journals are untouched.
begin;

-- Allowlisted summaries only. Never serialize private state, photos, notes or trackers.
create function public.arc_squad_events(p jsonb) returns jsonb
language plpgsql immutable set search_path=public,pg_temp as $$
declare result jsonb='{}'; d record; e record; w jsonb; g jsonb; n integer; mins integer; prefix text;
begin
 for d in select key,value from jsonb_each(coalesce(p->'history','{}')) loop
  for e in select key,value from jsonb_each(coalesce(d.value->'entries','{}')) loop
   if coalesce((e.value->>'value')::numeric,0)>0 then
    result=result||jsonb_build_object('entry:'||d.key||':'||e.key,
     case when (e.value->>'value')::numeric >= (e.value->>'target')::numeric then 'Klar · ' else 'På väg · ' end
     ||left(coalesce(e.value->>'name','Dagens vana'),120)||' · '||(e.value->>'value')||' / '||(e.value->>'target')
     ||case when e.value ? 'durationMinutes' then ' · '||(e.value->>'durationMinutes')||' min' else '' end||' · '||d.key);
   end if;
  end loop;
 end loop;
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
 for g in select value from jsonb_array_elements(coalesce(p->'goals','[]')) loop
  if coalesce((g->>'current')::numeric,0)>0 then
   result=result||jsonb_build_object('goal:'||(g->>'id'),'Mål · '||left(g->>'name',120)||' · '||(g->>'current')||' / '||(g->>'target')||' '||left(coalesce(g->>'unit',''),30));
  end if;
 end loop;
 for e in select key,value from jsonb_each(coalesce(p->'claims','{}')) loop
  result=result||jsonb_build_object('quest:'||e.key,'Uppdrag klart · '||case split_part(e.key,':',1) when 'three' then 'Tre små segrar' when 'perfect' then 'Alla dagens vanor' when 'reflect' then 'Veckoreflektion' when 'comeback' then 'Comeback' else 'Dagens uppdrag' end||' · '||(e.value->>'date'));
 end loop;
 for g in select value from jsonb_array_elements(coalesce(p->'reflections','[]')) loop
  result=result||jsonb_build_object('reflection:'||(g->>'id'),'Veckoreflektion sparad · '||(g->>'date'));
 end loop;
 return result;
end;
$$;

-- Retain event identity even when its post is manually deleted, preventing resurrection.
create table public.squad_activity_events (
 user_id uuid not null references public.profiles(id) on delete cascade,
 event_key text not null,
 post_id uuid not null default gen_random_uuid(),
 primary key(user_id,event_key),unique(post_id)
);
alter table public.squad_activity_events enable row level security;
revoke all on public.squad_activity_events from public,anon,authenticated;

create function public.arc_publish_activity() returns trigger
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
  if not (after_events ? ev.key) then
   update public.posts set body=left('Återtagen registrering · '||ev.value,2000)
    where id=(select post_id from public.squad_activity_events where user_id=new.user_id and event_key=ev.key) and squad_id=sid;
  end if;
 end loop;
 return new;
end;
$$;
create trigger arc_squad_activity after update of payload on public.user_states
 for each row execute function public.arc_publish_activity();

create function public.attach_post_photo(p_post uuid,p_path text) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Logga in först.';end if;
 if p_path is null or p_path not like auth.uid()::text||'/posts/%' then raise exception 'Välj en ny bild till squadet. Privata bilder får inte kopplas hit.';end if;
 if not exists(select 1 from storage.objects where bucket_id='arc-photos' and name=p_path) then raise exception 'Bilden är inte uppladdad ännu.';end if;
 update public.posts set image_path=p_path where id=p_post and user_id=auth.uid() and public.is_squad_member(squad_id);
 if not found then raise exception 'Inlägget saknas eller tillhör någon annan.';end if;
end;
$$;
revoke all on function public.arc_squad_events(jsonb),public.arc_publish_activity(),public.attach_post_photo(uuid,text) from public,anon,authenticated;
grant execute on function public.attach_post_photo(uuid,text) to authenticated;
create function public.squad_activity_ready() returns boolean language sql stable as $$select true$$;
revoke all on function public.squad_activity_ready() from public,anon;
grant execute on function public.squad_activity_ready() to authenticated;
notify pgrst,'reload schema';
commit;
