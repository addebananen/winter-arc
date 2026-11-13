// Sends the streak reminders that are due right now (see supabase/028_push_notifications.sql).
// Called every hour by pg_cron (supabase/029_push_schedule.sql) with the header x-cron-secret.
// Secrets come from Supabase Vault through push_config(), never from the repository.
import webpush from 'npm:web-push@3.6.7';
import {createClient} from 'npm:@supabase/supabase-js@2.119.0';

// Public key: the same one as vapidPublicKey in src/config.js.
const VAPID_PUBLIC = 'BP38epkdSfazD8v0jLA5_oEfel0v3ausKRFhSf0UqcU_4SYQlZdQJ52L9xZ4IpqaU3zdGCefDVAqgQrWg_CzkQQ';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {auth: {persistSession: false}});
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {status, headers: {'Content-Type': 'application/json'}});

Deno.serve(async req => {
  const config = await db.rpc('push_config');
  const secrets = config.data?.[0];
  if (config.error || !secrets?.vapid_private || !secrets?.cron_secret) return json({error: 'Push is not configured'}, 503);
  if (req.headers.get('x-cron-secret') !== secrets.cron_secret) return json({error: 'Forbidden'}, 403);
  webpush.setVapidDetails('https://addebananen.github.io/winter-arc/', VAPID_PUBLIC, secrets.vapid_private);
  const due = await db.rpc('push_due');
  if (due.error) return json({error: due.error.message}, 500);
  let sent = 0, gone = 0, failed = 0;
  await Promise.all((due.data || []).map(async (n: {endpoint: string; p256dh: string; auth: string; kind: string; title: string; body: string; url: string}) => {
    try {
      await webpush.sendNotification({endpoint: n.endpoint, keys: {p256dh: n.p256dh, auth: n.auth}},
        JSON.stringify({title: n.title, body: n.body, url: n.url, tag: n.kind}), {TTL: 4 * 3600, urgency: 'high'});
      sent++;
    } catch (e) {
      const code = (e as {statusCode?: number}).statusCode;
      if (code === 404 || code === 410) { gone++; await db.rpc('push_forget', {p_endpoint: n.endpoint}); }
      else { failed++; console.error('push failed', code, (e as Error).message); }
    }
  }));
  return json({sent, gone, failed});
});
