# Winter Arc

En svensk, mobilanpassad PWA för vanor, karaktärsutveckling och en expedition med vänner. HTML, CSS och JavaScript, med Supabase för Google-konton, gemensam data och privata bilder.

## Kör appen

```sh
npm ci
npm test
npm run build
npm run dev
```

Öppna `http://127.0.0.1:4173`. Node 20 eller senare krävs. Färdiga PWA-ikoner är incheckade; `python scripts/make-icons.py` återskapar dem utan externa Pythonpaket.

## Status

- Det tydligt märkta demoläget innehåller påhittade vänner och historik. Ändringar sparas på den aktuella enheten.
- **Börja min egen lokala expedition** skapar en separat tom resa. Demo flyttas aldrig in i ett riktigt konto.
- Google-inloggning är avstängd tills projektets publika Supabase-konfiguration har lagts in. Appen utger sig inte för att vara ansluten.
- Molnkoden, SQL-installationen och RLS-reglerna finns med. Riktig OAuth, mobilkamera och flera verkliga enheter behöver verifieras efter anslutningen.
- Den anslutna Sites-publiceringen är en privat förhandsversion. GitHub-repositoryts synlighet styr inte vem som får läsa privata kontodata i Supabase.

## Funktioner

Dagens vanor, 18 biblioteksförslag inom sex kategorier, egna vanor och scheman, vanekopplingar enligt Atomic Habits, personliga mål, dagsmål, streaks, XP, nivåer, combo och multipliers. Karaktären har Strength, Discipline, Wisdom, Faith och Social och fyra visuella evolutioner. Skill tree, achievements, belöningar, dagliga quests och comeback efter en missad dag.

Squad med kodinbjudningar, flöde, bildinlägg, reaktioner, leaderboard, gemensam streak och veckouppdrag. Privat kroppstracker med bilder, vikt, midjemått, graf och jämförelse. Bildjournal, veckoreflektioner, 90-dagarsöversikt, Wrapped som nedladdningsbar SVG och JSON-export av journaldata. En användare tillhör ett squad i denna version. Flödet hämtar de 50 senaste inläggen.

## Anslut ett nytt Supabase-projekt

1. Skapa ett projekt i [Supabase](https://supabase.com/dashboard). Kör hela `supabase/001_winter_arc.sql` i SQL Editor **en gång i ett nytt projekt**. Skriptet skapar tabeller, funktioner, privata lagringsregler och bildbucketen `arc-photos`.
2. Aktivera Google under Authentication → Sign In / Providers. Skapa en Google OAuth-webbklient i ert Google Cloud-projekt och konfigurera Supabase-leverantören enligt [Supabase Google-guide](https://supabase.com/docs/guides/auth/social-sign-in/auth-google). Google-klientens hemlighet anges bara i Supabase, aldrig i GitHub eller frontend.
3. Sätt appens produktionsadress som Site URL och tillåten Redirect URL i Supabase Authentication → URL Configuration. OAuth-return går till **exakt samma origin och sökväg** som appen. För GitHub Pages används adressen med `/winter-arc/` och avslutande snedstreck. Lägg bara till den lokala adressen om utveckling behövs.
4. Lägg projektets URL och **publika publishable/anon-nyckel** i `src/config.js`. Dessa får finnas i frontend; RLS skyddar datan. Använd aldrig `service_role` eller en databashemlighet här.
5. Kör tester och bygg igen, publicera och testa två separata Google-konton. Skapa squad från det första kontot och gå med via koden från det andra.

Verifiera att konto B ser konto A:s delade inlägg och kan reagera, men inte kan läsa konto A:s kroppsbilder, mått, mål eller reflektioner. Prova även inloggning/utloggning, bildimport, omladdning, förlorat nätverk och två samtidiga enheter innan skarp användning. [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) och [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) beskriver den underliggande åtkomstmodellen.

## Publicera och uppdatera

`npm run build` skapar `dist/`. Den kan hostas på vanlig HTTPS-hosting med stöd för statiska filer. Appen fungerar på en underkatalog. HTTPS krävs för service worker och iPhone-installation.

Sites-projektets ID ligger i `.openai/hosting.json`. Fortsatta redigeringar i samma Codex-chat kan byggas och publiceras till samma Sites-adress. Sites egen källkodsförvaring och GitHub-repositoryt är två separata remotes; en GitHub-push publicerar inte automatiskt till Sites.

För automatiska GitHub Pages-uppdateringar:

1. Välj Settings → Pages → Source: **GitHub Actions** i repositoryt.
2. Lägg till repositoryvariabeln `PAGES_ENABLED` med värdet `true` under Settings → Secrets and variables → Actions → Variables.
3. Kör workflowet **Deploy GitHub Pages** manuellt första gången. Därefter bygger och publicerar varje push till `main`. Detta workflow är avsiktligt avstängt tills hosting är aktiverad.

Google/Supabase tillåter sedan denna adress som redirect. Lägg aldrig privata bilder i repositoryt eller `dist/`.

Service workern cachelagrar endast appens skal. Supabase-anrop, åtkomsttoken, bild-URL:er och privata molnposter läggs inte i service worker-cachen. Nya versioner upptäcks automatiskt och användaren får välja att öppna den nya versionen. Lokala framsteg bevaras. En molnändring som inte kan sparas återställs med ett felmeddelande, så appen visar inte osparade framsteg som synkade. Samtidiga enheter skyddas av revisionskontroll; vid konflikt hämtar man senaste resan och gör om ändringen.

## På iPhone

Öppna den publicerade adressen i Safari → Dela → Lägg till på hemskärmen → Lägg till. Manifest, PNG-ikoner, safe-area-stöd och standalone-läge ingår. Privat Sites-hosting kräver dessutom den åtkomst som Sites ger ägaren; en öppen webbpublicering med Supabase är enklare för ett fristående squad.

## Regler och avgränsningar

- Dagar följer kontots tidszon från starten. Alla dagens mål måste vara klara för en perfekt dag. Streaken får vara kvar medan idag fortfarande pågår, men bryts om gårdagens mål missades. XP försvinner inte av en missad dag.
- Dagens mål sparas som ett historiskt ögonblick. Ändringar i en vanas mål och schema börjar gälla imorgon. Tidigare dagars krav ändras inte. En dag utan några mål räknas inte som en perfekt dag.
- 3 vanor ger 1,2× daglig van-XP, 5 vanor ger 1,5×. Ångring räknar om XP och tar tillbaka bonus för ett dagligt uppdrag vars krav inte längre är uppfyllda.
- Comeback-quest erbjuds efter en missad föregående dag. Den återställer inte den gamla streaken.
- Gruppuppdrag räknar vanor under sin kalendervecka. Gemensam streak är den kortaste nuvarande individuella streaken i squadet.
- Bilder i kroppstrackern är privata. Ett flödesinlägg delas uttryckligen med squadet. Bilder komprimeras till JPEG och platsmetadata följer inte med den omkodade bilden. HEIC-stöd beror på webbläsaren; appen ger ett tydligt fel om bilden behöver exporteras som JPEG.
- Lokal lagring är inte en säkerhetskopia. Rensad webbplatsdata, privat surfning eller en ny enhet kan sakna lokala framsteg och bilder. Molnläget använder Supabase och synkar mellan enheter.
- Vanorna är självrapporterade. Appen är avsedd för tillit mellan vänner och har ingen tävlingsverifiering för pengar eller priser.
- SQL-ändringar efter installation ska läggas i **nya migrationsfiler**. Kör inte om första installationsfilen i en befintlig databas.

## Testning

`npm test` kör domän-, DOM- och Postgres-tester. DOM-tester körs i jsdom och ersätter inte visuell Safari-QA. Databastesterna använder en isolerad PGlite-Postgres med tre användaridentiteter, autentiserade roller och samma RLS-regler. Supabases yttre OAuth-/Storage-tjänster simuleras; själva SQL-funktionerna och åtkomstreglerna körs. Testerna omfattar bland annat tidszoner, streak-reset, historiska mål, XP och bonusångring, kontoisolering, inlägg/reaktioner, privata/delade bilder och revisionskonflikter.
