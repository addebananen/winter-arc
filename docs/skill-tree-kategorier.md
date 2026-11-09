# Skill tree – kommande kategorier

Core, Löpning och Musik syns redan i kategorilistan som **"Kommer snart"**.
Här samlar vi förslag på hur träden kan byggas. Ändra fritt, det här är ett utkast att jobba vidare på tillsammans.

## Så aktiverar man en kategori
1. Bygg trädets innehåll, t.ex. i en egen fil `src/skills-core.js`, i samma format som `src/skills.js` (nivåer med mål, tekniktips och vanliga fel).
2. I `src/skill-tree-ui.js`: ta bort `soon: true` på kategorin.
3. I `src/app.js`: lägg till kategorins vy i `createSkillTreeUI({categories: {...}})`, med `view` och `progress`.
4. Skriv tester och öppna en pull request. Säg till i gruppen innan ni börjar, så att två personer inte bygger samma träd.

Nivåer ska låsas upp av **sparade pass**, inte av att man bara klickar i dem, precis som calisthenics.

## Core (bålstyrka)
Obs: *hollow hold* och *L-sit* finns redan i calisthenics-trädet. Bestäm om de ska flyttas, delas eller länkas som förkunskap.

| Gren | Förslag på nivåer |
|---|---|
| Anti-extension | Dead bug → planka 30 s → planka 60 s → RKC-planka → ab wheel från knä → ab wheel stående |
| Anti-rotation / sida | Sidoplanka 30 s → sidoplanka med benlyft → Pallof press → Copenhagen-planka |
| Flexion / hängande | Hängande knälyft → hängande benlyft → toes to bar → windshield wipers |
| Kontroll | Hollow hold → hollow rock → V-ups → dragon flag negativ → dragon flag |

## Löpning
Kan kopplas till den rankade löpningen som redan finns i `src/cardio.js` (uppmätt distans och tid).

| Gren | Förslag på nivåer |
|---|---|
| Grund | 1 km utan paus → 3 km → 5 km → 5 km tre veckor i rad |
| Distans | 10 km → 15 km → halvmaraton (21,1 km) |
| Fart | 5 km under 30 min → under 27 min → under 25 min → 10 km under 55 min |
| Teknik / variation | Intervaller (6 × 400 m) → backintervaller → tempopass 20 min |

## Musik
Musikkursen i `src/music.js` har redan lektioner i nivåer och kan visas som ett träd.
