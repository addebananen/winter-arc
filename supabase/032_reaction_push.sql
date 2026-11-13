-- Push notification when someone in the squad reacts to your post (emoji or photo reaction).
-- 1) push_subscriptions.reactions: on by default, switched with set_push_reactions(on) from Settings.
-- 2) push_outbox: one queued notification per (post, person, reaction). Toggling a reaction off and on
--    again never notifies twice. Reacting to your own post never notifies.
-- 3) Triggers on reactions and photo_reactions queue the notification and wake the push-reminders Edge
--    Function right away through pg_net (only on Supabase; elsewhere the hourly run picks it up).
-- 4) push_outbox_due(): the Edge Function reads what to send (service role only).
-- No existing data is changed.
begin;

alter table public.push_subscriptions add column reactions boolean not null default true;

create function public.set_push_reactions(p_on boolean) returns void
language sql security definer set search_path=public,pg_temp as $$
 update public.push_subscriptions set reactions=coalesce(p_on,true) where user_id=auth.uid();
$$;
revoke all on function public.set_push_reactions(boolean) from public,anon;
grant execute on function public.set_push_reactions(boolean) to authenticated;

create table public.push_outbox(
 id bigserial primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 dedupe text not null unique,
 tag text not null,
 title_sv text not null, body_sv text not null,
 title_en text not null, body_en text not null,
 url text not null default './#squad/feed',
 created_at timestamptz not null default now(),
 sent_at timestamptz
);
create index push_outbox_unsent on public.push_outbox(created_at) where sent_at is null;
alter table public.push_outbox enable row level security;
revoke all on public.push_outbox from public,anon,authenticated;

-- Wakes the Edge Function now. Skipped quietly where pg_net or the Vault secret is missing.
create function public.arc_push_kick() returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare secret text;
begin
 if to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') is null or to_regclass('vault.decrypted_secrets') is null then return; end if;
 execute $q$select decrypted_secret from vault.decrypted_secrets where name='push_cron_secret'$q$ into secret;
 if secret is null then return; end if;
 execute $q$select net.http_post(url:='https://noamtwazmbtrnyqdmplf.supabase.co/functions/v1/push-reminders',
  body:='{"only":"outbox"}'::jsonb,params:='{}'::jsonb,
  headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret',$1),timeout_milliseconds:=20000)$q$ using secret;
exception when others then return; -- a notification must never block a reaction
end;$$;

create function public.arc_queue_reaction(p_post uuid,p_from uuid,p_kind text) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_owner uuid; v_body text; v_name text; v_emoji text; v_sv text; v_en text;
begin
 select user_id,body into v_owner,v_body from public.posts where id=p_post;
 if v_owner is null or v_owner=p_from then return; end if;
 if not exists(select 1 from public.push_subscriptions where user_id=v_owner and reactions) then return; end if;
 select left(coalesce(display_name,''),40) into v_name from public.profiles where id=p_from;
 v_name=coalesce(nullif(v_name,''),'Någon');
 v_emoji=case p_kind when 'fire' then '🔥' when 'clap' then '👏' when 'heart' then '🤍' when 'strong' then '💪' when 'mind' then '🤯' when 'rocket' then '🚀' when 'respect' then '🫡' when 'party' then '🎉' else '' end;
 if v_body like 'Löpning klart ·%' then v_sv='din löptur'; v_en='your run';
 elsif v_body ~ '^.+ klart · [0-9]+ set · ' then v_sv='ditt pass'; v_en='your workout';
 elsif v_body ~ '^(Klar|På väg) · ' then v_sv='din vana'; v_en='your habit';
 else v_sv='ditt inlägg'; v_en='your post'; end if;
 insert into public.push_outbox(user_id,dedupe,tag,title_sv,body_sv,title_en,body_en)
 values(v_owner,p_post||':'||p_from||':'||p_kind,'reaction-'||p_post,
  case when p_kind='photo' then v_name||' reagerade med en bild 📸' else v_name||' hejar på dig '||v_emoji end,
  case when p_kind='photo' then 'På '||v_sv||'. Tryck för att se den.' else 'Reagerade '||v_emoji||' på '||v_sv||'.' end,
  case when p_kind='photo' then v_name||' reacted with a photo 📸' else v_name||' is cheering you on '||v_emoji end,
  case when p_kind='photo' then 'On '||v_en||'. Tap to see it.' else 'Reacted '||v_emoji||' to '||v_en||'.' end)
 on conflict(dedupe) do nothing;
 if found then perform public.arc_push_kick(); end if;
end;$$;

create function public.arc_reaction_push() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform public.arc_queue_reaction(new.post_id,new.user_id,case when tg_table_name='photo_reactions' then 'photo' else to_jsonb(new)->>'kind' end);
 return new;
end;$$;
create trigger arc_reaction_push after insert on public.reactions for each row execute function public.arc_reaction_push();
create trigger arc_photo_reaction_push after insert on public.photo_reactions for each row execute function public.arc_reaction_push();

-- What to send now: unsent reactions from the last day, one row per device in the device's language.
create function public.push_outbox_due() returns table(endpoint text,p256dh text,auth text,kind text,title text,body text,url text)
language plpgsql volatile security definer set search_path=public,pg_temp as $$
declare ids bigint[];
begin
 select array_agg(o.id) into ids from public.push_outbox o where o.sent_at is null and o.created_at>now()-interval '1 day';
 if ids is null then return; end if;
 update public.push_outbox set sent_at=now() where id=any(ids);
 return query select s.endpoint,s.p256dh,s.auth,o.tag,
  case when s.lang='sv' then o.title_sv else o.title_en end,
  case when s.lang='sv' then o.body_sv else o.body_en end,o.url
  from public.push_outbox o join public.push_subscriptions s on s.user_id=o.user_id and s.reactions
  where o.id=any(ids) order by o.id;
end;$$;

revoke all on function public.arc_push_kick(),public.arc_queue_reaction(uuid,uuid,text),public.arc_reaction_push(),public.push_outbox_due() from public,anon,authenticated;
grant execute on function public.push_outbox_due() to service_role;

do $$ begin if to_regclass('public.schema_migrations') is not null then
 insert into public.schema_migrations(name) values('032_reaction_push') on conflict do nothing; end if; end $$;
notify pgrst,'reload schema';
commit;
