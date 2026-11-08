-- Winter Arc 2: season, practice, bounded XP. Non-destructive upgrade.
begin;
create or replace function public.save_arc_state(p_payload jsonb,p_expected_revision bigint) returns bigint
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_revision bigint; v_name text; v_tz text; v_today text; v_start text; v_created text; h record; e record; s jsonb; step jsonb; actual jsonb;
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
 select (created_at at time zone v_tz)::date::text into v_created from auth.users where id=auth.uid();
 v_start=greatest('2026-11-09',v_created);
 p_payload=jsonb_set(p_payload,'{expedition,start}',to_jsonb(v_start));
 p_payload=jsonb_set(p_payload,'{accountCreated}',to_jsonb(v_created));
 if p_payload ? 'training' then
   if jsonb_typeof(p_payload#>'{training,sessions}') is distinct from 'array' or jsonb_typeof(p_payload#>'{training,plans}') is distinct from 'array' then raise exception 'Invalid training journal';end if;
   if jsonb_array_length(p_payload#>'{training,sessions}')>5000 or jsonb_array_length(p_payload#>'{training,plans}')>30 then raise exception 'Training journal limit reached';end if;
   for s in select value from jsonb_array_elements(p_payload#>'{training,sessions}') loop
     if length(coalesce(s->>'id','')) not between 1 and 100 or s->>'date' !~ '^\d{4}-\d{2}-\d{2}$' or s->>'date'>v_today or jsonb_typeof(s->'exercises') is distinct from 'array' or jsonb_array_length(s->'exercises') not between 1 and 6 or jsonb_typeof(s->'finishedAt') is distinct from 'number' then raise exception 'Invalid training session';end if;
     for step in select value from jsonb_array_elements(s->'exercises') loop
       if jsonb_typeof(step->'done') is distinct from 'array' or jsonb_array_length(step->'done')>3 then raise exception 'Invalid training sets';end if;
       for actual in select value from jsonb_array_elements(step->'done') loop
         if jsonb_typeof(actual) is distinct from 'number' or actual::text::numeric not between 0 and 600 then raise exception 'Invalid training amount';end if;
       end loop;
     end loop;
   end loop;
 end if;

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


create or replace function public.arc_day_done(p_day jsonb) returns integer
language sql immutable set search_path=public,pg_temp as $$
 select count(*)::integer from jsonb_each(coalesce(p_day->'entries','{}')) e
 where coalesce(e.value->>'source','habit')<>'challenge' and (e.value->>'value')::numeric >= (e.value->>'target')::numeric and (e.value->>'target')::numeric>0;
$$;
create or replace function public.arc_day_xp(p_day jsonb) returns numeric
language sql immutable set search_path=public,pg_temp as $$
 select round(coalesce(sum(least(40,greatest(0,(e.value->>'xp')::numeric))) filter(where coalesce(e.value->>'source','habit')<>'challenge'),0)
 *case when public.arc_day_done(p_day)>=5 then 1.5 when public.arc_day_done(p_day)>=3 then 1.2 else 1 end)
 +least(100,coalesce(sum(least(40,greatest(0,(e.value->>'xp')::numeric))) filter(where e.value->>'source'='challenge'),0))
 from jsonb_each(coalesce(p_day->'entries','{}')) e where (e.value->>'value')::numeric >= (e.value->>'target')::numeric;
$$;
create or replace function public.arc_training_xp(p_payload jsonb,p_until text) returns bigint
language plpgsql immutable set search_path=public,pg_temp as $$
declare s jsonb; step jsonb; actual jsonb; meta jsonb; catalog jsonb='{"wall-push":[6,8,40],"incline-push":[8,8,40],"knee-push":[8,8,40],"push-up":[10,8,40],"close-push":[12,6,40],"pike-push":[12,6,40],"chair-squat":[6,8,40],"squat":[8,10,40],"split-squat":[10,6,40],"reverse-lunge":[10,6,40],"calf-raise":[6,12,40],"glute-bridge":[7,10,40],"dead-bug":[7,6,40],"bird-dog":[7,6,40],"plank":[8,20,600],"side-plank":[9,15,600],"hollow-hold":[10,15,600],"dead-hang":[8,15,600],"assisted-pull":[10,5,40],"pull-up":[14,5,40],"row":[10,8,40],"thoracic":[6,6,40],"cat-cow":[5,6,40],"ankle-rock":[5,8,40],"hip-hinge":[6,8,40],"shoulder-circle":[5,8,40],"breathing":[20,300,600],"walk-reset":[6,120,600]}';
 seen text[]='{}';days jsonb='{}';d record;v_date text;v_amount numeric;v_points numeric;v_train numeric;v_breath numeric;v_total numeric;v_factor numeric;total numeric=0;
begin
 for s in select value from jsonb_array_elements(coalesce(p_payload#>'{training,sessions}','[]')) loop
   v_date=s->>'date';
   if s->>'id' is null or s->>'id'=any(seen) or coalesce((s->>'finishedAt')::numeric,0)<=0 or v_date is null or v_date<coalesce(p_payload#>>'{expedition,start}','2026-11-09') or v_date>p_until then continue;end if;
   seen=array_append(seen,s->>'id');v_train=0;v_breath=0;
   for step in select value from jsonb_array_elements(coalesce(s->'exercises','[]')) with ordinality e(value,n) where n<=6 loop
     meta=catalog->(step->>'id');if meta is null then continue;end if;
     for actual in select value from jsonb_array_elements(coalesce(step->'done','[]')) with ordinality e(value,n) where n<=3 loop
       v_amount=least((actual::text)::numeric,(meta->>2)::numeric);if v_amount<=0 then continue;end if;
       v_points=round((meta->>0)::numeric*least(v_amount/(meta->>1)::numeric,1.5));
       if step->>'id'='breathing' then v_breath=v_breath+v_points;else v_train=v_train+v_points;end if;
     end loop;
   end loop;
   v_total=v_train+v_breath;
   if v_total>80 then v_factor=80/v_total;v_train=floor(v_train*v_factor);v_breath=80-v_train;end if;
   days=jsonb_set(days,array[v_date],jsonb_build_object('training',coalesce((days->v_date->>'training')::numeric,0)+v_train,'breath',coalesce((days->v_date->>'breath')::numeric,0)+v_breath));
 end loop;
 for d in select value from jsonb_each(days) loop total=total+least(120,(d.value->>'training')::numeric+least(20,(d.value->>'breath')::numeric));end loop;
 return total::bigint;
end;
$$;
create or replace function public.arc_total_xp(p_payload jsonb,p_until text) returns bigint
language plpgsql immutable set search_path=public,pg_temp as $$
declare rec record;total numeric=0;v_start text=coalesce(p_payload#>>'{expedition,start}','2026-11-09');
begin
 for rec in select key,value from jsonb_each(coalesce(p_payload->'history','{}')) loop
   if rec.key>=v_start and rec.key<=p_until then total=total+public.arc_day_xp(rec.value);end if;
 end loop;
 for rec in select key,value from jsonb_each(coalesce(p_payload->'claims','{}')) loop
   if rec.value->>'date'>=v_start and rec.value->>'date'<=p_until then total=total+case when rec.key like 'three:%' then 50 when rec.key like 'perfect:%' then 100 when rec.key like 'reflect:%' then 75 when rec.key like 'comeback:%' then 40 else 0 end;end if;
 end loop;
 return total::bigint+public.arc_training_xp(p_payload,p_until);
end;
$$;
create or replace function public.squad_progress(p_squad uuid)
returns table(user_id uuid,display_name text,xp bigint,streak integer,perfect_today boolean,completed_week integer)
language plpgsql stable security definer set search_path=public,pg_temp as $$
declare r record; hist jsonb; v_day date; d date; rec record; n integer; base numeric; total numeric; cnt integer;
begin
 if not public.is_squad_member(p_squad) then raise exception 'Squad access denied'; end if;
 for r in select m.user_id,p.display_name,u.payload from public.squad_members m join public.profiles p on p.id=m.user_id left join public.user_states u on u.user_id=m.user_id where m.squad_id=p_squad loop
   user_id=r.user_id;display_name=r.display_name;hist=coalesce(r.payload->'history','{}');
   v_day=(now() at time zone coalesce(r.payload->>'timezone','UTC'))::date;
   perfect_today=v_day::text>=coalesce(r.payload#>>'{expedition,start}','2026-11-09') and public.arc_perfect(hist->v_day::text);streak=0;d=case when perfect_today then v_day else v_day-1 end;
   while d::text>=coalesce(r.payload#>>'{expedition,start}','2026-11-09') and public.arc_perfect(hist->d::text) and streak<10000 loop streak=streak+1;d=d-1;end loop;
   completed_week=0;
   for rec in select key,value from jsonb_each(hist) loop
     if rec.key>=coalesce(r.payload#>>'{expedition,start}','2026-11-09') and rec.key>=date_trunc('week',v_day)::date::text and rec.key<=v_day::text then completed_week=completed_week+public.arc_day_done(rec.value);end if;
   end loop;
   total=public.arc_total_xp(r.payload,v_day::text);
   xp=total::bigint;return next;
 end loop;
end;
$$;
create or replace function public.mission_progress(p_squad uuid)
returns table(id uuid,completed integer)
language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
 if not public.is_squad_member(p_squad) then raise exception 'Squad access denied'; end if;
 return query select m.id,coalesce(sum(public.arc_day_done(h.value)),0)::integer
 from public.missions m left join public.squad_members sm on sm.squad_id=m.squad_id
 left join public.user_states s on s.user_id=sm.user_id
 left join lateral jsonb_each(coalesce(s.payload->'history','{}')) h on h.key>=coalesce(s.payload#>>'{expedition,start}','2026-11-09') and h.key>=(m.deadline-6)::text and h.key<=least(m.deadline,current_date)::text
 where m.squad_id=p_squad group by m.id;
end;
$$;


-- Preserve every journal entry; only the expedition boundary changes. Bump revisions
-- so an old open tab cannot silently overwrite the migrated season settings.
update public.user_states u set
 payload=jsonb_set(jsonb_set(u.payload,'{expedition,start}',to_jsonb(greatest('2026-11-09',(a.created_at at time zone (u.payload->>'timezone'))::date::text))),'{accountCreated}',to_jsonb((a.created_at at time zone (u.payload->>'timezone'))::date::text)),
 revision=u.revision+1,updated_at=now()
from auth.users a where a.id=u.user_id;

revoke all on function public.arc_day_xp(jsonb),public.arc_training_xp(jsonb,text),public.arc_total_xp(jsonb,text) from public,anon,authenticated;
-- CREATE OR REPLACE preserves the authenticated-only grants from migration 001.
commit;
