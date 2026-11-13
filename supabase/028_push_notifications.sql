-- Push notifications: streak reminders sent to the phone even when the app is closed.
-- 1) push_subscriptions: one row per device (Web Push endpoint + keys). No table policies: rows are only
--    written and read through the functions below, so nobody can see another person's devices.
-- 2) save_push_subscription / remove_push_subscription: the signed-in user registers or removes a device.
-- 3) push_due(): called hourly by the push-reminders Edge Function (service role only). Returns the
--    reminders that are due right now and marks them as sent, so each reminder goes out at most once a day.
--    - training: your training streak dies tonight (no saved workout yesterday or today, 011 rules).
--    - habits: you have a habit streak and today's habits are not done yet.
-- 4) push_config(): the VAPID private key and cron secret from Supabase Vault, service role only.
-- No existing data is changed.
begin;

create table public.push_subscriptions(
 endpoint text primary key check (endpoint ~ '^https://' and length(endpoint)<=1000),
 user_id uuid not null references auth.users(id) on delete cascade,
 p256dh text not null check (length(p256dh) between 20 and 200),
 auth text not null check (length(auth) between 8 and 100),
 remind_hour smallint not null default 19 check (remind_hour between 0 and 23),
 lang text not null default 'en' check (lang in ('en','sv')),
 created_at timestamptz not null default now(),
 last_training_day date,
 last_habit_day date
);
create index push_subscriptions_user on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from public, anon, authenticated;

create function public.push_ready() returns boolean language sql stable as $$ select true $$;
grant execute on function public.push_ready() to authenticated;

create function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text, p_hour integer default 19, p_lang text default 'en')
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Logga in först.'; end if;
 if (select count(*) from public.push_subscriptions where user_id=auth.uid() and endpoint<>p_endpoint)>=10 then
  raise exception 'För många enheter har notiser på.'; end if;
 insert into public.push_subscriptions(endpoint,user_id,p256dh,auth,remind_hour,lang)
  values(p_endpoint,auth.uid(),p_p256dh,p_auth,coalesce(p_hour,19),case when p_lang='sv' then 'sv' else 'en' end)
  on conflict(endpoint) do update set user_id=excluded.user_id,p256dh=excluded.p256dh,auth=excluded.auth,remind_hour=excluded.remind_hour,lang=excluded.lang;
end;$$;

create function public.remove_push_subscription(p_endpoint text) returns void
language sql security definer set search_path=public,pg_temp as $$
 delete from public.push_subscriptions where endpoint=p_endpoint and user_id=auth.uid();
$$;

revoke all on function public.save_push_subscription(text,text,text,integer,text), public.remove_push_subscription(text) from public, anon;
grant execute on function public.save_push_subscription(text,text,text,integer,text), public.remove_push_subscription(text) to authenticated;

-- p_now is only for tests; the Edge Function calls push_due() without arguments.
create function public.push_due(p_now timestamptz default now())
returns table(endpoint text, p256dh text, auth text, kind text, title text, body text, url text)
language plpgsql volatile security definer set search_path=public,pg_temp as $$
declare r record; v_local timestamp; v_day date; v_last date; v_streak integer; d date; hist jsonb; v_start text;
begin
 for r in select s.*, u.payload from public.push_subscriptions s join public.user_states u on u.user_id=s.user_id loop
  v_local=p_now at time zone coalesce(r.payload->>'timezone','UTC');
  if extract(hour from v_local)<r.remind_hour then continue; end if;
  v_day=v_local::date;
  endpoint=r.endpoint; p256dh=r.p256dh; auth=r.auth;
  -- Training streak: alive while there is a saved workout at most two days back. Last chance = tonight.
  if r.last_training_day is distinct from v_day then
   select max((s.value->>'date')::date) into v_last from jsonb_array_elements(coalesce(r.payload#>'{strength,sessions}','[]'::jsonb)) s
    where s.value->>'finishedAt' is not null and s.value->>'date' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' and (s.value->>'date')::date<=v_day;
   v_streak=public.arc_training_streak(r.payload,v_day);
   if v_streak>0 and v_last=v_day-2 then
    update public.push_subscriptions set last_training_day=v_day where push_subscriptions.endpoint=r.endpoint;
    kind='training';
    if r.lang='sv' then title='Din flamma slocknar ikväll 🔥'; body=format('%s dagars träningsstreak. Kör ett pass idag så lever den vidare.',v_streak);
    else title='Your flame goes out tonight 🔥'; body=format('%s-day training streak. Train today to keep it alive.',v_streak); end if; url='./#training';
    return next;
   end if;
  end if;
  -- Habit streak: perfect days in a row up to yesterday, and today is not perfect yet.
  if r.last_habit_day is distinct from v_day then
   hist=coalesce(r.payload->'history','{}'); v_start=coalesce(r.payload#>>'{expedition,start}','2026-11-09');
   if not public.arc_perfect(hist->v_day::text) then
    v_streak=0; d=v_day-1;
    while d::text>=v_start and public.arc_perfect(hist->d::text) and v_streak<10000 loop v_streak=v_streak+1; d=d-1; end loop;
    if v_streak>0 then
     update public.push_subscriptions set last_habit_day=v_day where push_subscriptions.endpoint=r.endpoint;
     kind='habits';
     if r.lang='sv' then title='Håll din streak vid liv'; body=format('%s dagar i rad. Bocka av dagens vanor innan midnatt.',v_streak);
     else title='Keep your streak alive'; body=format('%s days in a row. Check off today''s habits before midnight.',v_streak); end if; url='./#habits';
     return next;
    end if;
   end if;
  end if;
 end loop;
end;$$;

-- A device that the push service says is gone (HTTP 404/410) is removed.
create function public.push_forget(p_endpoint text) returns void
language sql security definer set search_path=public,pg_temp as $$
 delete from public.push_subscriptions where endpoint=p_endpoint;
$$;

-- Secrets live in Supabase Vault, never in the repository: 'push_vapid_private' and 'push_cron_secret'.
create function public.push_config() returns table(vapid_private text, cron_secret text)
language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
 if to_regclass('vault.decrypted_secrets') is null then return; end if;
 return query execute $q$select (select decrypted_secret from vault.decrypted_secrets where name='push_vapid_private'),
  (select decrypted_secret from vault.decrypted_secrets where name='push_cron_secret')$q$;
end;$$;

revoke all on function public.push_due(timestamptz), public.push_forget(text), public.push_config() from public, anon, authenticated;
grant execute on function public.push_due(timestamptz), public.push_forget(text), public.push_config() to service_role;

notify pgrst,'reload schema';
commit;
