-- Runs the push-reminders Edge Function every hour (on the hour). Run AFTER 029 and after the two Vault
-- secrets exist: 'push_vapid_private' and 'push_cron_secret' (see docs/push-notiser.md).
-- Uses pg_cron + pg_net. Not part of the PGlite tests because those extensions only exist on Supabase.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule(jobid) from cron.job where jobname='push-reminders';
select cron.schedule('push-reminders','0 * * * *',$$
 select net.http_post(
  url:='https://noamtwazmbtrnyqdmplf.supabase.co/functions/v1/push-reminders',
  headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret',
   (select decrypted_secret from vault.decrypted_secrets where name='push_cron_secret')),
  body:='{}'::jsonb,
  timeout_milliseconds:=20000);
$$);

-- Register this migration (028 schema_migrations); guarded so the order of merging does not matter.
do $$ begin if to_regclass('public.schema_migrations') is not null then
 insert into public.schema_migrations(name) values('030_push_schedule') on conflict do nothing; end if; end $$;
