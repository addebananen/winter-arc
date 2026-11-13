# Beyond Self

Appen hette tidigare Winter Arc. "Winter Arc" lever kvar som namnet på 90-dagarsutmaningen i appen, och interna nycklar (`arc-*` i lagringen, fotodatabasen `winter-arc-photos`, cachenamnet) är oförändrade så att sparad data finns kvar.

En svensk, mobilanpassad PWA för vanor, karaktärsutveckling och en expedition med vänner. HTML, CSS och JavaScript, med Supabase för Google-konton, gemensam data och privata bilder.

**Publicerad app:** [addebananen.github.io/winter-arc](https://addebananen.github.io/winter-arc/). GitHub Actions testar, bygger och publicerar uppdateringar från `main` automatiskt.

## Kör appen

```sh
npm ci
npm test
npm run build
npm run dev
```

Öppna `http://127.0.0.1:4173`. Node 22.13 eller senare krävs. Färdiga PWA-ikoner är incheckade. De skapas från logotypen `assets/beyond-self-logo.png` med `python scripts/make-icons.py` (kräver Pillow: `pip install pillow`).

## Status

- Den publika releasen kräver Google-inloggning. Den visar inga demo- eller lokala kontoval. Isolerade DOM-tester aktiverar utvecklingslägen via ersatt testkonfiguration; `developmentModes` är `false` i publicerad kod.
- Befintliga molnprofiler, journaler och historik bevaras vid uppgraderingar. Appens cache innehåller kod, inte kontodata. Nya funktioner lägger till data utan att återställa tidigare stats.
- Databasschemat omfattar migrationerna 001–008. Alla åtta tabeller har RLS och bildbucketen är privat. Befintliga projekt ska endast tillämpa saknade migrationer.
- Google-leverantören och webbklienten är konfigurerade i Supabase. Aktiveringen är verifierad mot tjänstens riktiga auth-inställningar och appens `googleEnabled` är `true`.
- Riktig Google-inloggning, sparad profil och återhämtning efter omladdning är verifierade på både GitHub Pages och den privata förhandsversionen. Samma konto hämtar samma molnprofil från båda adresserna. Mobilkamera på fysisk iPhone och flera verkliga vänners konton behöver fortfarande provas tillsammans.
- Den anslutna Sites-publiceringen är en privat förhandsversion. GitHub-repositoryts synlighet styr inte vem som får läsa privata kontodata i Supabase.

## Funktioner

Dagens vanor, 68 biblioteksförslag inom åtta kategorier, egna vanor och scheman, vanekopplingar enligt Atomic Habits, personliga mål, dagsmål, streaks, XP, nivåer, combo och multipliers. Fyra valbara karaktärer med egna namn och fyra visuella evolutioner. Sju stats: Strength, Flexibility, Discipline, Wisdom, Faith, Social och Music. Level följer samlad XP; sju separata ranks går från Rookie till Diamond. Skill tree, achievements, belöningar, dagliga quests och comeback efter en missad dag.

28 träningsövningar, sex grundpass, tre comeback-pass, egna upplägg, registrering per set, vilotimer, andningspaus med pausfunktion och träningsjournal. Övningsnivå 1–10 följer övningens egna repetitioner/sekunder. 20 utmaningar kategoriserade per stat, med en privat anteckning om vad man gjort/lärt sig. Valfri privat NoFap-räknare med dagar/timmar, omstart och personbästa; den påverkar aldrig XP, rank eller squaddata.

**Skill tree** är en egen destination i menyn, med en kategorilista överst. Kategorin **Calisthenics**: 20 träd och 105 nivåer i tre grenar. Rörlighet: handleder, axlar upp och bakåt, pike, straddle och fotleder. Grund: kroppslinje, armhävning → enarms, pull-ups, dips och ben → pistol. Skills: L-sit, handstand, handstand push-up, enarms-handstand, muscle-up, front lever, back lever, planche och human flag. Ordningen följer nivåtabellerna i *Overcoming Gravity 2* (Steven Low) och r/bodyweightfitness *Bodyweight Fitness Progressions v5.4*. Varje nivå har mål, teknikpunkter, vanliga fel, rekommenderade förkunskaper och en animation. Användaren anger sin nivå per träd och markerar nästa nivå när målet klaras. Nivåerna sparas i kontots molndata (`skills` i sparfilen) och ger karaktärens stats (Strength, Flexibility, Discipline). Uppnådda personliga mål ger +50 i sitt livsområde. Ingen av dem påverkar XP eller rank, som fortsatt kontrolleras av servern.

Animationerna (`src/skills-anim.js`, `src/skills-moves.js`) är en 2D-figur med riktiga segmentlängder. Händer och fötter låses mot golv, stång eller vägg med tvåleds-IK, och balansskills löses så att tyngdpunkten ligger över stödet. En anatomikontroll (`lint`) stoppar omöjliga ledvinklar och kontakter som inte nås. Figuren ritas med samma människa som övningsanimationerna (`skillFigure` i `src/figure.js`): t-shirt med logga, shorts, sneakers, huvud och händer som greppar stång, ringar, parallettes och dipsräcke eller ligger platt mot golvet. Rörelser filmade rakt framifrån (till exempel archer push-up) visar bara överkroppen, eftersom benen pekar bort från kameran. `dev/skill-review.html` och `dev/skill-gallery.html` visar alla animationer för granskning. `dev/app.html` kör appen lokalt i utvecklingsläge utan backend (`python3 -m http.server` i repots rot).

Fyra fasta mobildestinationer: Idag, Träning, Skill tree och Squad. Kategorin **Musik** har 18 noder och 91 nivåer i Gehör, Bas och Sång, som klaras genom korta spel (gehörsquiz, greppbräda, skalor, basgångsbyggare, timing, andning och tonträff med mikrofon). Se `docs/skill-tree-kategorier.md`. Nya skill tree-kategorier läggs till i `src/skill-tree-ui.js`. Profilen nås från avataren, vanor och expedition från startsidan. Tydlig installationsknapp i inställningar.

Squad med kodinbjudningar, flöde, bildinlägg, reaktioner, leaderboard, gemensam streak och veckouppdrag. Privat kroppstracker med bilder, vikt, midjemått, graf och jämförelse. Bildjournal, veckoreflektioner, 90-dagarsöversikt, Wrapped som nedladdningsbar SVG och JSON-export av journaldata. En användare tillhör ett squad i denna version. Flödet hämtar de 50 senaste inläggen.

## Anslut ett nytt Supabase-projekt

1. Skapa ett projekt i [Supabase](https://supabase.com/dashboard). Kör hela `supabase/001_winter_arc.sql` i SQL Editor **en gång i ett nytt projekt**. Skriptet skapar tabeller, funktioner, privata lagringsregler och bildbucketen `arc-photos`. Kör sedan `supabase/002_training_season.sql` och `supabase/003_daily_integrity.sql` och `supabase/004_calendar_integrity.sql` och `supabase/005_effort_rewards.sql` och `supabase/006_music_course.sql`, `supabase/007_strength_hub.sql` samt `supabase/008_squad_activity.sql` i ordning, en gång vardera.
2. Aktivera Google under Authentication → Sign In / Providers. Skapa en Google OAuth-webbklient i ert Google Cloud-projekt och konfigurera Supabase-leverantören enligt [Supabase Google-guide](https://supabase.com/docs/guides/auth/social-sign-in/auth-google). Google-klientens hemlighet anges bara i Supabase, aldrig i GitHub eller frontend.
3. Sätt appens produktionsadress som Site URL och tillåten Redirect URL i Supabase Authentication → URL Configuration. OAuth-return går till **exakt samma origin och sökväg** som appen. För GitHub Pages används adressen med `/winter-arc/` och avslutande snedstreck. Lägg bara till den lokala adressen om utveckling behövs.
4. Lägg projektets URL och **publika publishable/anon-nyckel** i `src/config.js`. Dessa får finnas i frontend; RLS skyddar datan. Använd aldrig `service_role` eller en databashemlighet här.
5. Kör tester och bygg igen, publicera och testa två separata Google-konton. Skapa squad från det första kontot och gå med via koden från det andra.

För ett befintligt projekt: kör inte redan applicerade migrationer igen. OAuth-klienthemligheter ska enbart ligga i Supabase-leverantörens inställningar, aldrig i källkoden. Hämta projektets callback från Supabase när en ny installation konfigureras.

Verifiera att konto B ser konto A:s delade inlägg och kan reagera, men inte kan läsa konto A:s kroppsbilder, mått, privata trackers eller skrivna reflektionsanteckningar. Prova även inloggning/utloggning, bildimport, omladdning, förlorat nätverk och två samtidiga enheter innan skarp användning. [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) och [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) beskriver den underliggande åtkomstmodellen.

## Publicera och uppdatera

`npm run build` skapar `dist/`. Den kan hostas på vanlig HTTPS-hosting med stöd för statiska filer. Appen fungerar på en underkatalog. HTTPS krävs för service worker och iPhone-installation.

Sites-projektets ID ligger i `.openai/hosting.json`. Fortsatta redigeringar i samma Codex-chat kan byggas och publiceras till samma Sites-adress. Sites egen källkodsförvaring och GitHub-repositoryt är två separata remotes; en GitHub-push publicerar inte automatiskt till Sites.

För automatiska GitHub Pages-uppdateringar:

1. Välj Settings → Pages → Source: **GitHub Actions** i repositoryt.
2. Kör workflowet **Deploy GitHub Pages** manuellt första gången, eller gör en ny push till `main`. Därefter bygger och publicerar varje push automatiskt. Workflowet känner av när Pages är aktiverat och hoppar över publiceringen tills dess.

Google/Supabase tillåter sedan denna adress som redirect. Lägg aldrig privata bilder i repositoryt eller `dist/`.

Service workern cachelagrar endast appens skal. Supabase-anrop, åtkomsttoken, bild-URL:er och privata molnposter läggs inte i service worker-cachen. Nya versioner upptäcks automatiskt och aktiveras när appen är inaktiv en kort stund, inget formulär eller dialog är öppet och inget träningspass pågår. Uppdateringen kräver nätanslutning och kan vänta tills appen öppnas igen. Ingen ominstallation av hemskärmsgenvägen behövs. Molnprofiler och sparade framsteg ligger kvar i Supabase. En molnändring som inte kan sparas återställs med ett felmeddelande, så appen visar inte osparade framsteg som synkade. Samtidiga enheter skyddas av revisionskontroll; vid konflikt hämtar man senaste resan och gör om ändringen.

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


## Musik: kurs, källor och poäng

Under Träning → Musikkurs finns 30 originallektioner i tio svårighetssteg, fördelade på teori/skalor, gehör och sång. Varje lektion har instruktioner, länkade övningar, reflektion och privat genomförandelogg. Svårighet är kursens pedagogiska gradering, inte en medicinsk skala, talangbedömning eller verifierad färdighetsnivå. Samma lektion kan ge XP en gång per dag. Musikvanor och musiklektioner delar grundpoäng: kursbonusen räknas bara över dagens musikvanepoäng, med det gemensamma utmaningstaket 100 bonus-XP. Befintliga template-ID:n är bevarade; åtta musikvanor ligger sist i biblioteket.

Länkade övningar och underlag: [musictheory.net](https://www.musictheory.net/exercises), [teoria](https://www.teoria.com/en/exercises/), [VoiceScienceWorks SOVT](https://www.voicescienceworks.org/sovt-exercises.html), [sugrörsfonation](https://www.voicescienceworks.org/straw-phonation.html), [Berklee röstvanor](https://college.berklee.edu/bt/213/play_for_life.html), [Berklee registerarbete](https://college.berklee.edu/people/ilona-tipp) och [NIDCD rösthälsa](https://www.nidcd.nih.gov/health/taking-care-your-voice). Källorna har inte godkänt eller certifierat kursen. Länkar öppnas i nya flikar; externa övningsresultat importeras inte. Sång sker i bekvämt omfång med pauser, utan krav på maxhöjd eller volym. Kursen lovar inte ett visst röstomfång eller mixed voice.

Framtida databasmigrationer ska vara nya, framåtgående filer (009 och vidare); ändra eller kör inte om redan tillämpade migrationer. Bygg, tester och uppgraderingskontroller ska passera före publicering.

## Styrkehub och tidsbaserade vanor (migration 007)

20 övningar, originalritade rörelseskisser, utrustnings-/muskelfilter, fyra rutiner och tomma pass. Setloggen har föregående resultat, kg, reps/sekunder och upp till sex set per övning. Serverstyrd timer med paus, anteckning, historik och kroppsviktssnapshot. Tids-XP och PR-bonusar beräknas även på servern. Metod och forskningskällor finns i `STRENGTH-METHOD.md` och i appens “Så räknar vi”.

Välj minuter när en vana skapas eller redigeras; ändringar före expeditionens start gäller direkt, senare ändringar gäller nästa dag. Profilen stöder egen uppladdad bild samt frivillig kroppsvikt och längd. Profilbilden ligger i samma privata bildlagring och delas inte automatiskt i squadet. Befintliga poster raderas eller omräknas inte vid migreringen. Spara ny migration `007_strength_hub.sql` efter 001–006 innan denna frontendversion används. Ändra inte redan applicerade migrationer.


## Squad-aktivitet och bildsäkerhet (migration 008)
Vanor/utmaningar med registrerade framsteg, avslutade träningspass, målframsteg, hämtade quests och genomförd reflektion skapar allowlistade sammanfattningar i squadet. Sammanfattningen skrivs atomiskt med kontots tillstånd. Ingen historisk masspublicering sker. Återkommande sparanden uppdaterar samma aktivitet; ångrade registreringar märks som återtagna. Ett manuellt raderat aktivitetsinlägg återuppstår inte.

Spegelbilder, kroppsmått, NoFap och andra privata trackers, träningsanteckningar samt skrivna reflektioner/lärdomar kopieras aldrig till flödet. En separat uppladdning under `posts/` kan läggas till på ett eget inlägg. RLS och bild-RPC:n avvisar andras inlägg och privata bildsökvägar.

PostgREST-frågan namnger FK-kopplingarna uttryckligen. Ett lyckat sparande betraktas inte som misslyckat bara för att flödeshämtningen fallerar. Inlägg får en stabil identifierare och utkast som överlever osäkra svar. Profil- och kroppsbilder raderas inte vid osäkra sparfel. Den gamla versionen kunde lämna sparade inlägg men radera deras bildfil vid ett flödesfel; en sådan fil måste laddas upp igen via Byt bild. Inga äldre inlägg raderas automatiskt.

Verifiering omfattar Supabase-klientens faktiska REST-frågor, molnflöden med injicerade nätverksfel och PostgreSQL/RLS med isolerade konton. Det verkliga flödet och att reaktioner överlever omladdning har också kontrollerats. Kör alltid hela testsamlingen och bygg före nästa publicering. Installerad migration 008 ska inte köras igen.


## Utökad träningskatalog och kondition (migration 009)
106 separata styrkevarianter har tekniktext, illustration, egen journal och sex spelmilstolpar. Kondition innehåller löpning, promenad, volleyboll och klättring. Löpning använder km och minuter, och en separat uppskattad 5 km-rank för distanser 1–21,1 km: tid × (5/km)^1,06. Spelgränserna är 40/35/30/25/22/19 minuter. Övriga aktiviteter har ingen rank. Klockan stämplas av servern; loggad rörelsetid får vara kortare än förfluten tid och registrering görs en gång per aktivitet och dag. Samlad konditions-XP begränsas och delar poäng med överlappande styrka och vanor.

Vikt och längd sparas vid passstart. Styrkevarianter använder samma princip för relativ styrka som tidigare. Ingen universell längdbonus införs: forskningen stöder inte en sådan korrektionsfaktor för alla övningar eller löpning. Maskinranker är egna spelmilstolpar och jämförs på samma utrustning; de är inte befolkningspercentiler. Nippards tier-listor gäller val av hypertrofiövningar, inte personliga kg-ranker.

Underlag: https://pubmed.ncbi.nlm.nih.gov/27570626/ (löptidsprognos), https://pubmed.ncbi.nlm.nih.gov/18172672/ (kroppsstorlek), https://pubmed.ncbi.nlm.nih.gov/15705030/ (Smith kontra fria vikter), https://pubmed.ncbi.nlm.nih.gov/16937972/ (1RM-prognoser). Videokällor för teknik/övningsval finns i katalogens detaljvyer. Källorna fastställer inte appens egna rankgränser.

Migration 009 rättar även Storage INSERT-regeln så att en inloggad användare kan ladda upp profilbild i sin egen avatar-mapp. Andras mappar och privat läsning förblir skyddade. Kör endast nya migrationen en gång; tidigare konton och historik bevaras. Från ett nytt projekt tillämpas 001–009 i ordning. Nästa nya migration efter detta är 010. Generera 009 från dess mall och katalogen med `node scripts/cardio-migration.mjs` innan den tillämpas; ändra aldrig filen efter installation.



## Squadets passdetaljer och reaktioner (migration 014)

Träningsinlägg öppnar en läsvy med övningar, genomförda set, kg/reps/sekunder och settyper. Konditionspass visar tid, distans och löptempo. Befintliga automatiska inlägg kopplas till redan sparad träningshistorik; inga kopior av privat användardata görs. Raderade inlägg lämnar inga åtkomliga passdetaljer. Saknas ett äldre pass visas detta uttryckligen.

Kör `supabase/024_squad_workout_details.sql` en gång efter merge. RPC:n kontrollerar squadmedlemskap och returnerar enbart tillåtna träningsfält för flödets senaste 50 inlägg. Privata anteckningar, kroppsmått, spegelbilder och trackers lämnas utanför. Migrationen utökar också till åtta reaktioner. Innan den är installerad fungerar de tre tidigare reaktionerna och vanliga inlägg, medan passdetaljer visar en återförsöksnotis. Ingen profil, XP eller historik nollställs.

Verifiering: `node --test tests/*.test.mjs` och `node scripts/build.mjs`. `node scripts/review-social.mjs` skapar en isolerad granskning i `dist/review/` med exempeldata, mockad molnanslutning och minneslagring. Den ingår inte i den vanliga produktionsbyggnaden.

## Passtid och settyper (migration 013)
Glömde du trycka Avsluta kan du korta passtiden när du sparar passet. Tiden kan bara kortas, aldrig förlängas, och XP räknas på den nya tiden. Har passet pågått i minst tre timmar visar appen en påminnelse. Varje set kan markeras som vanligt set, till failure (F) eller drop-set (D) genom att trycka på setets nummer. Sparade pass är fortfarande låsta.

`supabase/013_workout_time_and_set_types.sql` låter servern godkänna en kortare passtid (`adjustedMinutes`, klampas till den riktiga tiden) och räkna XP på den, och nekar okända settyper. Den ändrar ingen sparad data. Kör den en gång i SQL Editor efter 012. Kör den direkt efter merge: innan den är körd sparas den kortare tiden och settyperna, men servern räknar fortfarande XP och leaderboard på den fulla tiden.

## Språk
Appen är på **engelska som standard** och kan bytas till **svenska** under Inställningar → Språk (även på inloggningsskärmen). Valet sparas på enheten. Källtexterna är svenska; `src/i18n.js` översätter det som visas med ordlistorna `src/i18n-en.js` (svenska → engelska) och `src/i18n-sv.js` (engelska övningsnamn → svenska). Siffror skrivs som `{#}` i nycklarna, och långa texter översätts mening för mening. Användarskrivet innehåll översätts aldrig.

## Startnivå i skill-trädet (migration 015)
I varje skill-träd kan man trycka **Ange min nivå** och välja den högsta nivå man redan klarar. Nivåerna upp till den räknas som klara (märkta "startnivå"), och nästa nivå låses fortfarande upp med ett sparat pass. Startnivån är självskattad: den ger karaktärens stats men aldrig XP eller rank, och kan ändras eller tas bort.

`supabase/015_skill_start_level.sql` låter servern godkänna en startnivå om trädet och nivån finns. Den ändrar ingen sparad data. Kör den en gång i SQL Editor efter 014. Innan den är körd förklarar appen att databasuppdateringen behövs.

## Karaktärens utrustning (förberedelse)

Under Profil → Karaktär finns Utrustning med tre platser: aura, mantel och emblem. Föremålen låses upp av level, antal styrkepass, bästa träningsstreak och nivåer i skill tree, och valet sparas i `profile.look`. Grafiken är enkla platshållare (färgsken, mantelfärg, märke på bröstet) tills riktiga karaktärsbilder finns. Byt då bara ut `gearLayer()` i `src/character-gear.js`; platser, upplåsning och sparade val stannar som de är. Ingen databasändring behövs.

## Övningsanimationer

Övningarna ritas av en människofigur i `src/figure.js` med fasta benlängder och mänskliga proportioner. Varje övning i `src/figure-poses.js` beskrivs med två nyckellägen: höftens position, bålens lutning och var händer och fötter ska vara. Knän och armbågar räknas fram med invers kinematik, så att knän alltid böjs framåt, armbågar bakåt och fötter som står i golvet står still. Mellanlägena räknas om i varje steg, och bålen, låren, vaderna, biceps och bröstet har anatomiska former med kläder och skor. Muskelgruppen som tränas markeras. Figuren bär en grå t-shirt med Beyond Self-loggan på bröstet, matchande shorts och vita sneakers med röd rand. Håret är en kort frisyr med volym på toppen och kortare sidor ner mot nacken. Små detaljer (hårstrån, snören, knogveck) ritas bara när figuren visas stort, så att miniatyrerna i listan förblir lätta. Händerna har handflata, fyra fingrar i tre leder och tumme: de sluter sig runt stången, hanteln eller handtaget, ligger platt mot golvet i armhävningar och är öppna när man sträcker sig. Redskap följer händerna: viktskiva för skivstång i sidovy, en hantel i varje hand, kabel från ett fäste, band och hjul. Bänkar, säten, räcken och maskiner står i bakgrunden.

Lägg till en ny övning genom att ge den en `pose` som finns i `figure-poses.js`, eller lägg till en ny pose där. Testerna kontrollerar att benlängderna är konstanta i alla mellanlägen. Animationen spelas upp live: varje bild räknas fram från skelettet och alla former ritas om (ingen SMIL-morfning, som plattade till armar på iPhone). Formerna minns vilken sida de låg åt i förra bilden, och varje knä och armbåge behåller sin böjriktning hela rörelsen.
## Hemskärmsikon

Service workern hämtar och sparar aldrig ikonerna eller manifestet. iPhone visar annars en bokstav i stället för ikonen när service workern svarar på ikonhämtningen.

## Träningspass: ordning, borttagning och uppvärmningsset (migration 019)

Varje övning i ett pågående pass har en meny (⋯) med Flytta upp, Flytta ner och Ta bort övning. Har övningen loggade set frågar appen först. Ett set kan märkas som uppvärmning (W), failure (F) eller drop-set (D). Uppvärmningsset räknas aldrig som personbästa.

`supabase/019_warmup_sets.sql` låter servern godkänna settypen `warmup`. Den ändrar ingen data. Kör den en gång i SQL Editor efter 018. Innan den är körd går det inte att spara ett pass med uppvärmningsset i molnet.

## XP-regler (migration 018)

Från och med 2026-11-10 ger bara fem aktiviteter XP, högst en gång per dag var: styrkepass 40 (avslutat pass i styrkehubben eller vanan Styrketräning, oavsett längd), löpningspass 35 (löppass eller vanan Löpning), Läs en bok 25, Rörlighet 20 och Kall avslutning på duschen 15. En vana med lägre mål ger proportionellt mindre.

Egna vanor, övriga vanor, dagens uppdrag, combo, träningsprogram, andning, musik, annan kondition och skill tree bygger fortfarande karaktärens stats i sin kategori men ger ingen XP. XP som tjänats till och med 2026-11-09 räknas som förut, så ingen förlorar något.

Reglerna finns i `src/xp-rules.js` och speglas på servern i `supabase/018_xp_rules.sql`, som byter ut `arc_total_xp` (leaderboard, vänner, profiler). Den ändrar ingen sparad data. Kör den en gång i SQL Editor efter 017.

## Social och vänner (migration 016)

Fliken längst ner heter nu **Social** och har fyra delar: **Vänner**, **Squad** (gemensamt flöde med vanor och pass), **Leaderboard** och **Uppdrag**.

Vänner är en bredare krets än squadet. Var och en har en egen vänkod på åtta tecken. Den ena lägger in den andras kod, den andra godkänner. Vänner ser bara varandras namn, level, rank, karaktär, vanestreak och träningsstreak. Bilder, mått, journaler och mål förblir privata, och ingenting syns innan förfrågan är godkänd.

`supabase/016_friends.sql` lägger till tabellerna `friend_codes` och `friendships` samt funktionerna `my_friend_code`, `request_friend`, `respond_friend`, `remove_friend` och `friends_overview`. Den ändrar ingen befintlig data. Tryck på en vän, en rad i leaderboarden eller ett namn i flödet för att öppna personens profil med karaktär, rank, level, streaks och antal pass. Det kräver `supabase/017_member_profiles.sql` (funktionen `member_profile`), som bara visar profiler för dig själv, dina vänner och personer i ditt squad. Kör den efter 016; den ändrar ingen data. Kör den en gång i SQL Editor efter 015. Innan den är körd visar Vänner-fliken att databasuppdateringen behövs.

## Färgteman
Under kugghjulet → Färgtema finns fyra vinterteman: **Nordljus** (standard), **Frost** (isblått), **Polarnatt** (indigo) och **Beyond Self** (svart, vitt och rött som appikonen). Valet sparas på enheten. `src/themes.js` läser appens CSS vid start och räknar om de svala färgerna för valt tema, medan varma accenter (guld, flamma, rött) behålls. Ny CSS får därför automatiskt alla teman, så skriv nya färger i appens svala grundpalett.

## Mage- och rörlighetsövningar (migration 014)
Styrkehubben har två nya muskelgrupper: **Mage** (bl.a. situps, crunches, leg raise, captain's chair leg raise, hängande knä- och benlyft, ab wheel och kabelcrunch) och **Rörlighet** (bl.a. höftböjarstretch, couch stretch, duvan, world's greatest stretch, 90/90, kobran och fotledsrörlighet). Övningarna finns i `src/strength-catalog-core.js`. Rörlighet påverkar aldrig helhetsranken.

`supabase/014_core_mobility_catalog.sql` lägger till övningarna i serverns katalog och genereras med `node scripts/core-catalog-migration.mjs`. Den ändrar ingen sparad data. Kör den en gång i SQL Editor efter 013. Innan den är körd visar appen ett meddelande om man försöker lägga till de nya övningarna i ett pass.

## Träningsstreak (migration 011)
En flamma per dag med ett sparat pass i Styrkehubben. En vilodag mellan passen är okej, men två dagar i rad utan pass nollställer streaken. Flera pass samma dag ger en flamma. Streaken visas på startsidan, i Styrkehubben och i squadets leaderboard. Andra pass (Pass & andning, kondition) räknas inte.

`supabase/011_training_streak.sql` lägger till `squad_training_streaks` som räknar streaken på servern med samma regel som appen (`trainingStreak` i `src/strength.js`). Migrationen läser bara data och ändrar inget sparat. Kör den en gång i SQL Editor efter att 010 är körd. Innan den är körd visar squadet en notis i stället för streaks.

## Skill tree kopplat till workouts (migration 010)
Trädets befintliga progressioner har varsin katalogövning med samma animation, teknik och mål. Övningsbibliotekets chip Calisthenics · skill tree öppnar Skill tree-fliken. Under ett pågående styrkepass växlar Passet / Skill tree mellan setloggen och trädet utan att avsluta passet. Lägg till i workout köar rätt antal målset; inget pass behöver startas om.

Nya nivåer härleds från avslutade pass efter expeditionens start. Rätt variant och minst målets set/reps/sekunder krävs i samma pass, tillsammans med föregående nivå och trädets förkunskaper. Teknik, tempo och båda sidor bekräftas vid loggning. En sparad generisk armhävning, pull-up, dips, planka eller häng kan också uppfylla motsvarande mål. Pågående eller ofullständiga set räknas inte. Avancerade resultat före nödvändiga förkunskaper behöver göras om efter att förkunskaperna uppnåtts.

Befintliga manuellt angivna nivåer bevaras som historiskt utgångsläge. Nya manuella höjningar blockeras i UI och databas. Derived nivåer ger samma karaktärspoäng som tidigare; ingen extra XP delas ut för att visa eller öppna trädet. Passens vanliga tidsbaserade XP-regler gäller. Likadana skill-varianter kan inte registreras under flera katalog-ID:n samma dag. Skill-övningar påverkar inte styrkehubens sammanvägda rank.

Kör endast migration 010 efter 001–009. Gamla migrationer ska inte regenereras eller köras igen. 010 genereras före installation via `node scripts/skill-workout-migration.mjs`; därefter fryses den som övriga migrationer.


## Stabilitetskontroll och migration 012
Bildbehandling hör till det formulär där bilden valdes. En långsam privat bild kan inte följa med till profilbild eller squad-inlägg efter att rutan stängts. Setutkast, inklusive teknikbekräftelsen, bevaras om sparandet misslyckas och användaren växlar flik. En oläsbar gammal social cache blockerar inte starten.

Migration 012 rättar enbart enheten för enarms-handstandens sista mål (ett håll på 10 sekunder). Tidigare workouts, profiler, XP och nivåer ändras inte. Kör 012 en gång efter 011; regenerera aldrig tidigare migrationer.

