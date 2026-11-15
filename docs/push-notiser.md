# Push-notiser

Två sorters notiser:

1. **Streak-påminnelser** (skickas från servern, även när appen är stängd)
   - *Träning*: din träningsflamma slocknar ikväll (inget sparat pass igår eller idag, reglerna från 011).
   - *Vanor*: du har en vanestreak och dagens vanor är inte klara.
   - Högst en av varje sort per dag, tidigast vid vald tid (18–21, standard 19) i användarens tidszon.
2. **Pågående pass på låsskärmen** (visas av appen själv)
   - När man lämnar appen med ett styrke- eller konditionspass igång visas "Pågående pass · Startade 18:02 · 23 min hittills".
   - Notisen tas bort när man öppnar appen igen. En webbapp kan inte visa en tickande timer som en Live Activity i en riktig iOS-app, så tiden uppdateras varje gång man lämnar appen.

iPhone kräver att appen är tillagd på hemskärmen (iOS 16.4+) för webbnotiser. Användaren slår på dem under Inställningar → Notiser.

## Delar

| Del | Fil |
| --- | --- |
| Tabell, RPC:er och `push_due()` | `supabase/029_push_notifications.sql` |
| Timschema (pg_cron + pg_net) | `supabase/030_push_schedule.sql` |
| Edge Function som skickar | `supabase/functions/push-reminders/index.ts` |
| Inställningar + låsskärmsnotis | `src/push.js` |
| Visa notis / öppna appen vid tryck | service workern i `scripts/build.mjs` |

Den publika VAPID-nyckeln finns i `src/config.js` och i Edge Function. Den privata nyckeln och cron-hemligheten ligger **bara** i Supabase Vault (`push_vapid_private`, `push_cron_secret`) och läses av funktionen via `push_config()` (endast service role).

## Aktivera i Supabase (en gång, efter merge)

1. Kör `029_push_notifications.sql`.
2. Lägg in två hemligheter i Vault (SQL Editor):
   `select vault.create_secret('<privat VAPID-nyckel>','push_vapid_private');`
   `select vault.create_secret('<lång slumpad sträng>','push_cron_secret');`
3. Deploya Edge Function `push-reminders` med **Verify JWT av** (den kontrollerar själv `x-cron-secret`).
4. Kör `030_push_schedule.sql`.

Byter man VAPID-nycklar måste alla slå på notiserna igen.
