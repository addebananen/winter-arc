-- Keep the account calendar stable; scheduled goal edits must stay in the future.
begin;
create or replace function public.arc_validate_calendar(p jsonb,old jsonb,day text) returns void
language plpgsql immutable set search_path=public,pg_temp as $$
declare h jsonb;
begin
 if old->>'timezone' is not null and p->>'timezone' is distinct from old->>'timezone' then raise exception 'Kontots tidszon är låst för att skydda dagens resultat.';end if;
 for h in select value from jsonb_array_elements(p->'habits') loop
   if h->'pending' is not null and h->'pending'<>'null'::jsonb then
     if h->>'pendingDate' is null or h->>'pendingDate'<=day then raise exception 'Måländringar gäller tidigast nästa dag.';end if;
     if jsonb_typeof(h#>'{pending,target}') is distinct from 'number' or (h#>>'{pending,target}')::numeric not between 1 and 100000 or jsonb_typeof(h#>'{pending,days}') is distinct from 'array' or jsonb_array_length(h#>'{pending,days}') not between 1 and 7 then raise exception 'Kontrollera morgondagens mål och schema.';end if;
   end if;
 end loop;
end;
$$;
create or replace function public.save_arc_state(p_payload jsonb,p_expected_revision bigint) returns bigint
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_old jsonb; v_revision bigint; v_name text; v_tz text; v_today text; v_start text; v_created text; h record; e record; s jsonb; step jsonb; actual jsonb;
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
 select payload into v_old from public.user_states where user_id=auth.uid();
 if p_payload#>>'{training,active,id}' is not null and p_payload#>>'{training,active,id}' is distinct from v_old#>>'{training,active,id}' then
   p_payload=jsonb_set(p_payload,'{training,active,startedAt}',to_jsonb(floor(extract(epoch from clock_timestamp())*1000)));
 end if;
 perform public.arc_validate_calendar(p_payload,v_old,v_today);
 perform public.arc_validate_state(p_payload,v_old,v_today);
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


revoke all on function public.arc_validate_calendar(jsonb,jsonb,text) from public,anon,authenticated;
commit;
