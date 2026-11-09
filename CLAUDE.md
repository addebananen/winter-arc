# Beyond Self – regler för Claude

Flera personer jobbar i det här projektet, var och en med sin egen Claude.
Följ reglerna nedan så att vi inte krockar med varandra.

## Om projektet
Svensk mobil-PWA för vanor, träning och squad. Vanilla HTML/CSS/JS som byggs med esbuild.
Supabase används för inloggning (Google) och data. Se README.md för detaljer.

- `npm ci`: installera beroenden
- `npm test`: kör alla tester (domän, DOM och Postgres via PGlite)
- `npm run build`: bygger till `dist/`
- `npm run dev`: startar lokalt på http://127.0.0.1:4173

## Git-regler (viktigast)
- **Pusha ALDRIG direkt till `main`.** Allt som hamnar i `main` publiceras automatiskt till den riktiga appen (GitHub Pages).
- Jobba alltid på en egen gren, en gren per uppgift. Utgå från senaste `main`.
- Kör `npm test` och `npm run build` innan varje commit. Båda måste passera.
- Ändringar förs in i `main` via en pull request, aldrig på annat sätt.
- Om grenen ligger efter `main` eller har konflikter: hämta senaste `main`, lös konflikterna så att **båda** ändringarna behålls, och kör testerna igen.
- Håll ändringarna små och fokuserade på uppgiften. Gör inga orelaterade omskrivningar eller omformateringar av filer, det skapar onödiga konflikter för de andra.

## Filer som alla delar (var extra försiktig)
- `src/app.js`, `src/domain.js`, `src/style.css`: används av alla funktioner. Ändra bara det som behövs.
- Funktionsområden har egna filer: träning (`src/fitness.js`, `src/fitness-ui.js`) och musik (`src/music.js`, `src/music-ui.js`). Lägg ny funktionalitet i egna filer när det går.

## Språk (engelska som standard, svenska som val)
- Appen visas på engelska som standard och kan bytas till svenska under Inställningar. Källtexterna i koden skrivs på svenska.
- Översättningen sker i `src/i18n.js` när texten visas. **Lägg till varje ny gränssnittstext i `src/i18n-en.js`** (svenska → engelska). Siffror skrivs som `{#}`, t.ex. `"{#} dagar": "{#} days"`.
- Övningsnamn som skrivs på engelska i katalogen behöver en svensk översättning i `src/i18n-sv.js`.
- Text som användare själva skriver (inlägg, anteckningar) översätts aldrig.

## Databas (Supabase)
- Migrationerna i `supabase/` är numrerade (001, 002 …). Ändra eller kör ALDRIG om en befintlig migration.
- Nya databasändringar läggs i en ny fil med nästa lediga nummer. Kolla högsta numret på senaste `main` först.
- Kör aldrig SQL mot den riktiga Supabase-databasen. Det gör en människa manuellt efter att PR:en är mergad.
- Lägg aldrig hemligheter (nycklar, lösenord, client secrets) i koden.

## Data
- Användarnas befintliga profiler, XP och historik måste bevaras vid uppdateringar. Nya funktioner lägger till data, de nollställer aldrig något.
