# Winter Arc

En svensk, mobilanpassad PWA för vanor, karaktärsutveckling och en expedition med vänner. HTML, CSS och JavaScript, med Supabase för Google-konton, gemensam data och privata bilder.

**Publicerad app:** [addebananen.github.io/winter-arc](https://addebananen.github.io/winter-arc/). GitHub Actions testar, bygger och publicerar uppdateringar från `main` automatiskt.

## Kör appen

```sh
npm ci
npm test
npm run build
npm run dev
```

Öppna `http://127.0.0.1:4173`. Node 22.13 eller senare krävs. Färdiga PWA-ikoner är incheckade; `python scripts/make-icons.py` återskapar dem utan externa Pythonpaket.

## Status

- Det tydligt märkta demoläget innehåller påhittade vänner och historik. Ändringar sparas på den aktuella enheten.
- Nya besökare väljer Google-inloggning eller att uttryckligen utforska demon. En utgången eller avbruten inloggning visas med möjlighet att försöka igen.
- **Börja min egen lokala expedition** skapar en separat tom resa. Demo flyttas aldrig in i ett riktigt konto.
- Supabase-projektet **Winter -arc** (`noamtwazmbtrnyqdmplf`, Frankfurt) är anslutet i den publika frontendkonfigurationen. SQL-migrationerna 001–005 är genomförda. Alla sju tabeller har verifierad RLS och bildbucketen är privat. Anonym läsning av privat kontodata har verifierats nekad i den verkliga tjänsten.
- Google-leverantören och webbklienten är konfigurerade i Supabase. Aktiveringen är verifierad mot tjänstens riktiga auth-inställningar och appens `googleEnabled` är `true`.
- Riktig Google-inloggning, sparad profil och återhämtning efter omladdning är verifierade på både GitHub Pages och den privata förhandsversionen. Samma konto hämtar samma molnprofil från båda adresserna. Mobilkamera på fysisk iPhone och flera verkliga vänners konton behöver fortfarande provas tillsammans.
- Den anslutna Sites-publiceringen är en privat förhandsversion. GitHub-repositoryts synlighet styr inte vem som får läsa privata kontodata i Supabase.

## Funktioner

Dagens vanor, 60 biblioteksförslag inom sju kategorier, egna vanor och scheman, vanekopplingar enligt Atomic Habits, personliga mål, dagsmål, streaks, XP, nivåer, combo och multipliers. Fyra valbara karaktärer med egna namn och fyra visuella evolutioner. Sex stats: Strength, Flexibility, Discipline, Wisdom, Faith och Social. Level följer samlad XP; sju separata ranks går från Rookie till Diamond. Skill tree, achievements, belöningar, dagliga quests och comeback efter en missad dag.

28 träningsövningar, sex grundpass, tre comeback-pass, egna upplägg, registrering per set, vilotimer, andningspaus med pausfunktion och träningsjournal. Övningsnivå 1–10 följer övningens egna repetitioner/sekunder. 20 utmaningar kategoriserade per stat, med en privat anteckning om vad man gjort/lärt sig. Valfri privat NoFap-räknare med dagar/timmar, omstart och personbästa; den påverkar aldrig XP, rank eller squaddata.

Tre fasta mobildestinationer: Idag, Träning och Squad. Profilen nås från avataren, vanor och expedition från startsidan. Tydlig installationsknapp i inställningar.

Squad med kodinbjudningar, flöde, bildinlägg, reaktioner, leaderboard, gemensam streak och veckouppdrag. Privat kroppstracker med bilder, vikt, midjemått, graf och jämförelse. Bildjournal, veckoreflektioner, 90-dagarsöversikt, Wrapped som nedladdningsbar SVG och JSON-export av journaldata. En användare tillhör ett squad i denna version. Flödet hämtar de 50 senaste inläggen.

## Anslut ett nytt Supabase-projekt

1. Skapa ett projekt i [Supabase](https://supabase.com/dashboard). Kör hela `supabase/001_winter_arc.sql` i SQL Editor **en gång i ett nytt projekt**. Skriptet skapar tabeller, funktioner, privata lagringsregler och bildbucketen `arc-photos`. Kör sedan `supabase/002_training_season.sql` och `supabase/003_daily_integrity.sql` och `supabase/004_calendar_integrity.sql` och `supabase/005_effort_rewards.sql` i ordning, en gång vardera.
2. Aktivera Google under Authentication → Sign In / Providers. Skapa en Google OAuth-webbklient i ert Google Cloud-projekt och konfigurera Supabase-leverantören enligt [Supabase Google-guide](https://supabase.com/docs/guides/auth/social-sign-in/auth-google). Google-klientens hemlighet anges bara i Supabase, aldrig i GitHub eller frontend.
3. Sätt appens produktionsadress som Site URL och tillåten Redirect URL i Supabase Authentication → URL Configuration. OAuth-return går till **exakt samma origin och sökväg** som appen. För GitHub Pages används adressen med `/winter-arc/` och avslutande snedstreck. Lägg bara till den lokala adressen om utveckling behövs.
4. Lägg projektets URL och **publika publishable/anon-nyckel** i `src/config.js`. Dessa får finnas i frontend; RLS skyddar datan. Använd aldrig `service_role` eller en databashemlighet här.
5. Kör tester och bygg igen, publicera och testa två separata Google-konton. Skapa squad från det första kontot och gå med via koden från det andra.

För det redan installerade Winter -arc-projektet: kör inte SQL-filen igen. Google-klienten är konfigurerad med callback `https://noamtwazmbtrnyqdmplf.supabase.co/auth/v1/callback`. Google är aktiverat i Supabase och `googleEnabled` är `true` i `src/config.js`. Returadresserna för Sites och den förberedda GitHub Pages-adressen är sparade i Supabase. Google-klientens hemlighet ligger enbart i Supabase och ska inte läggas i källkoden.

Supabases huvudadress (Site URL) är nu `https://addebananen.github.io/winter-arc/`. Sites-förhandsversionen finns kvar som en separat tillåten returadress.

Google Cloud-projektet **Winter Arc** (`winter-arc-514022`) är skapat utan att något betalkonto kopplats in i denna installation. Google Auth Platforms grundkonfiguration och webbklienten **Winter Arc Web** är klara med två JavaScript-origins (Sites-adressen och `https://addebananen.github.io`) och Supabase-callbacken ovan. Klienthemligheten har förts direkt till Supabase. Appen använder endast grundläggande Google-inloggning (namn, e-post och profil); se [Googles regler för app-publik](https://support.google.com/cloud/answer/15549945?hl=en).

Verifiera att konto B ser konto A:s delade inlägg och kan reagera, men inte kan läsa konto A:s kroppsbilder, mått, mål eller reflektioner. Prova även inloggning/utloggning, bildimport, omladdning, förlorat nätverk och två samtidiga enheter innan skarp användning. [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) och [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) beskriver den underliggande åtkomstmodellen.

## Publicera och uppdatera

`npm run build` skapar `dist/`. Den kan hostas på vanlig HTTPS-hosting med stöd för statiska filer. Appen fungerar på en underkatalog. HTTPS krävs för service worker och iPhone-installation.

Sites-projektets ID ligger i `.openai/hosting.json`. Fortsatta redigeringar i samma Codex-chat kan byggas och publiceras till samma Sites-adress. Sites egen källkodsförvaring och GitHub-repositoryt är två separata remotes; en GitHub-push publicerar inte automatiskt till Sites.

För automatiska GitHub Pages-uppdateringar:

1. Välj Settings → Pages → Source: **GitHub Actions** i repositoryt.
2. Kör workflowet **Deploy GitHub Pages** manuellt första gången, eller gör en ny push till `main`. Därefter bygger och publicerar varje push automatiskt. Workflowet känner av när Pages är aktiverat och hoppar över publiceringen tills dess.

Google/Supabase tillåter sedan denna adress som redirect. Lägg aldrig privata bilder i repositoryt eller `dist/`.

Service workern cachelagrar endast appens skal. Supabase-anrop, åtkomsttoken, bild-URL:er och privata molnposter läggs inte i service worker-cachen. Nya versioner upptäcks automatiskt och användaren får välja att öppna den nya versionen. Lokala framsteg bevaras. En molnändring som inte kan sparas återställs med ett felmeddelande, så appen visar inte osparade framsteg som synkade. Samtidiga enheter skyddas av revisionskontroll; vid konflikt hämtar man senaste resan och gör om ändringen.

## På iPhone

Öppna den publicerade adressen i Safari → Dela → Lägg till på hemskärmen → Lägg till. Manifest, PNG-ikoner, safe-area-stöd och standalone-läge ingår. Privat Sites-hosting kräver dessutom den åtkomst som Sites ger ägaren; en öppen webbpublicering med Supabase är enklare för ett fristående squad.

## Regler och avgränsningar

- Startdatum är det senare av **9 november 2026** och kontots registreringsdag i kontots tidszon. Före start kan man förbereda vanor och prova träning; XP och streak börjar räknas på startdagen. Äldre journaler behålls men räknas inte före start. Demoläget har uttrycklig exempelhistorik.
- Tränings-XP beror på övning och registrerad mängd. Högst 80 XP per pass och 120 per dag, varav högst 20 från andning. Högst 100 utmanings-XP per dag, en registrering per utmaning/dag. Dessa får ingen van-combo och räknas inte som extra vanor i gruppuppdrag.
- Dagar följer kontots tidszon från starten. Alla dagens mål måste vara klara för en perfekt dag. Streaken får vara kvar medan idag fortfarande pågår, men bryts om gårdagens mål missades. XP försvinner inte av en missad dag.
- Dagens mål sparas som ett historiskt ögonblick. Ändringar i en vanas mål och schema börjar gälla imorgon. Tidigare dagars krav ändras inte. En dag utan några mål räknas inte som en perfekt dag.
- 3 vanor ger 1,2× daglig van-XP, 5 vanor ger 1,5×. Ångring räknar om XP och tar tillbaka bonus för ett dagligt uppdrag vars krav inte längre är uppfyllda.
- Comeback-quest erbjuds efter en missad föregående dag och kan klaras med två vanor eller ett helt comeback-pass. Man kan välja lätt rörelse, rörlighet eller lugn. Den återställer inte den gamla streaken.
- Gruppuppdrag räknar vanor under sin kalendervecka. Gemensam streak är den kortaste nuvarande individuella streaken i squadet.
- Bilder i kroppstrackern är privata. Ett flödesinlägg delas uttryckligen med squadet. Bilder komprimeras till JPEG och platsmetadata följer inte med den omkodade bilden. HEIC-stöd beror på webbläsaren; appen ger ett tydligt fel om bilden behöver exporteras som JPEG.
- Lokal lagring är inte en säkerhetskopia. Rensad webbplatsdata, privat surfning eller en ny enhet kan sakna lokala framsteg och bilder. Molnläget använder Supabase och synkar mellan enheter.
- Vanorna är självrapporterade. Appen är avsedd för tillit mellan vänner och har ingen tävlingsverifiering för pengar eller priser.
- SQL-ändringar efter installation ska läggas i **nya migrationsfiler**. Kör inte om första installationsfilen i en befintlig databas.

## Testning

`npm test` kör domän-, DOM- och Postgres-tester. DOM-tester körs i jsdom och ersätter inte visuell Safari-QA. Databastesterna använder en isolerad PGlite-Postgres med tre användaridentiteter, autentiserade roller och samma RLS-regler. Supabases yttre OAuth-/Storage-tjänster simuleras; själva SQL-funktionerna och åtkomstreglerna körs. Testerna omfattar bland annat tidszoner, streak-reset, historiska mål, XP och bonusångring, kontoisolering, inlägg/reaktioner, privata/delade bilder och revisionskonflikter.

Övningarna är självrapporterad, anpassningsbar vardagspraktik. Underlag för lugn andning och de enklaste styrkerörelserna: [NHS andning](https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/) och [NHS styrkeövningar](https://www.nhs.uk/live-well/exercise/strength-exercises/). [Apples guide till hemskärmsappen](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios).

## Dagliga regler och integritet

Varje vana och utmaning räknas en gång per dag. En träningsövning kan ingå i ett sparat pass en gång per dag, med upp till tre set. Att arkivera och återskapa en genomförd vana ger inte en ny registrering samma dag. Andning och meditation kopplas till motsvarande vana så samma arbete inte ger dubbel grund-XP. Egna vanor ger 15 XP, biblioteksaktiviteter 10–40 enligt sina definitioner; daglig van-bas-XP är högst 200 före combo.

SQL-funktionerna kontrollerar aktiviteternas identiteter, mål, XP-definitioner, dagens krav, giltiga quest-bonusar, sparade pass och historik. Tidigare dagars resultat och redan sparade träningspass är låsta. Timerns start stämplas av servern; en för snabb andningsövning nekas även om klientens klocka eller data manipulerats. RPC `save_arc_state_v3` returnerar den kanoniska serverstaten och dess revision. RLS nekar direkt skrivning till privata tillståndstabeller.

Detta hindrar teknisk XP-spam och flera vanliga manipulationsvägar. Självrapporterad träning kan inte bevisa att en fysisk aktivitet utförts; systemet är ingen verifiering för tävlingar med pengar eller priser.

Startskärm och sidövergångar använder korta opacity-/transform-animationer. Reduce Motion respekteras; timers uppdaterar bara sin text i stället för att rendera om hela appen varje sekund. Visuell browser-QA ersätter inte prestandamätning på en fysisk iPhone.

Kontots tidszon hålls fast efter registrering för att förhindra byte av kalenderdag som XP-genväg. En väntande måländring får tidigast träda i kraft nästa dag.

Biblioteksaktiviteternas stat och enhet är fasta. Ett mindre dagligt mål ger proportionellt färre XP (avrundat, minst 1 XP); ett större mål ger inte mer än aktivitetens normalpoäng. Exempel: en sida av ett normalt läsmål på tio sidor ger 3 XP i stället för 25. Egna vanor ger fortfarande 15 XP.
