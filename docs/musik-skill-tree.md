# Musik i skill tree: funktioner och system

Den här filen beskriver musikkategorin i skill tree: vad spelaren kan göra, hur poäng och framsteg fungerar, och hur koden hänger ihop. Den gamla Musikkursen under Träning (`src/music.js`, `src/music-ui.js`) är en separat funktion och beskrivs i README.

## Funktioner

### Trädet
Skill tree → kategorin **Musik** har tre grenar, 16 noder och 80 nivåer. Varje nivå är ett kort spel. En nivå klaras med minst 80 %. Stjärnor: 80 % ger 1, 90 % ger 2 och 100 % ger 3.

| Gren | Nod | Nivåer | Spel |
|---|---|---|---|
| Gehör | Första stegen | 6 | Lättast: högre eller lägre, samma eller olika, steg eller hopp, hemma eller borta. Inga namn att kunna. |
| Gehör | Vägen hem | 5 | Steget mellan Första stegen och Skalsteg. Efter ackorden och tonen spelas tonens väg stegvis ner till hemtonen. Antalet toner på vägen är svaret. Sedan går man vägen själv i huvudet, med knappen **Vägen hem** som facit. |
| Gehör | Skalsteg | 5 | Kadens i en tonart, sedan en ton. Vilket skalsteg (1–7, moll, kromatiskt)? |
| Gehör | Intervall | 6 | Två toner. Vilket intervall? Uppåt, båda håll och samtidigt klingande. Varje intervall har ett minnesknep (låt). |
| Gehör | Ackordtyp | 5 | Dur, moll, sus4, förminskat, överstigande och fyrklanger. |
| Gehör | Ackordton över basen | 4 | Bas + ackord, sedan en ton. Är det 1, 3, 5, 7 eller 9/11/13? |
| Gehör | Basens rörelse | 4 | Följ basen och välj ackordföljd (I–IV–V–vi, popföljder), sedan omvändningar. |
| Bas | Greppbrädan | 4 | Hitta en ton på halsen, från E-strängen till förtecken över hela halsen. Spelas på instrumentet eller med tryck. |
| Bas | Hela halsen | 8 | Lär dig varje ton upp till band 12 genom att spela den. En sträng i taget, först med karta och sedan ur minnet. Därefter förtecken, samma toner på alla strängar och hela halsen på tid. |
| Bas | Groove | 5 | Tryck i takt med klicket: fjärdedelar, åttondelar, rock, synkoper, Motown. |
| Bas | Skalor | 5 | Först visas hela mönstret med skalsteg, tonnamn och hel- och halvsteg. Sedan spelas skalan ur minnet: dur, pentatoniskt, moll, modalt. |
| Bas | Arpeggion | 4 | Samma två steg som skalorna, med ackordets toner: dur, moll, septimackord. |
| Bas | Basgångar | 5 | Bygg en basgång över fyra takter: grundton, grundton + kvint, treklang, närmande ton och walking bass. Lyssna på den med trummor och ackord, rätta, och hör ett exempel. |
| Sång | Andning och stöd | 5 | Guidad låg andning, ett jämnt ”sss” i 10 och 20 sekunder, och stödd ton i 8 och 15 sekunder. Mikrofonen mäter tid och jämnhet. |
| Sång | Tonträff | 4 | Lyssna och sjung samma toner. En stämapparat visar hur nära du ligger. |
| Sång | Stämsång | 5 | Sjung grundton, kvint, ters eller moll-ters till ett ackord, eller en ters över en melodi. Hörlursläge spelar en ton under tiden. |

En nod låses upp när du klarat en viss nivå i noden före (se `requires` i `src/music-tree.js`). Nivåerna i en nod spelas i ordning. Varje nivå har en kort lärtext och ofta ett tips.

### Spela på riktigt
Greppbrädan, Hela halsen, Skalor och Arpeggion spelas på en riktig bas eller gitarr. Mikrofonen hör vilken ton som spelas och appen går vidare av sig själv, så telefonen kan ligga still. Bas och gitarr har samma fyra lägsta strängar (E, A, D, G) och appen jämför bara tonnamnet, inte oktaven, så samma övningar fungerar på båda. Knappen **Mikrofon på / Tryck på skärmen** byter till tryck på greppbrädan. Valet sparas i telefonen (`arc-music-input`), inte i kontot.

- Rutan **Jag hör** visar hela tiden vilken ton appen uppfattar och hur stark signalen är.
- En rätt ton räknas direkt. En fel ton måste hållas en kort stund innan den räknas, så att en sträng man råkar nudda inte blir ett svar.
- Appen lyssnar inte medan den själv spelar ljud.
- **Stämapparat och mikrofontest** finns överst i basgrenen. Visar den rätt ton hör mikrofonen instrumentet i övningarna också.
- Dagens mix använder alltid tryck, eftersom den blandar in lyssningsfrågor.

### Så funkar övningen
Innan en nivå man inte har klarat visas en skärm med tre steg om hur just den övningen går till, vad som är bra att veta (nodens lärtext och nivåns tips) och, för spelade övningar, valet mellan instrument och tryck. Stegen per speltyp ligger i `HOW` i `src/music-play-ui.js`. Skalor och arpeggion har dessutom en mening om vad skalan eller ackordet är (`ABOUT` i `src/music-theory.js`).

### Lyssningshjälp
Varje gehörsnod har tre korta steg för hur man lyssnar och tänker (`listen` i `src/music-tree.js`). De visas under knappen **Så tänker du** i spelet och är öppna första gången man spelar en nod. Efter varje svar i Första stegen och Skalsteg visas en mening om hur tonen känns (`why` på frågan, `DEGREE_FEEL` i `src/music-theory.js`).

### Motivation och spelkänsla
- **Fortsätt-knappen** pekar på nästa nivå att spela.
- **Dagens mix** blandar tio gehörs- och greppbrädefrågor från nivåer du redan klarat. Den väljer helst nivåer med få stjärnor eller som du inte spelat på länge (blandad repetition sitter längst). Mixen räknas vid 70 %.
- **Streak**: dagar i rad med minst ett nytt resultat.
- **Combo** under spelet, ljud för rätt och fel, vibration, stjärnor, konfetti och en räknare som fyller ringen på resultatskärmen.
- **Röstläge** (låg, mellan, hög) under Sång väljer tonhöjd för sångspelen och sparas.
- Rörelser stängs av om telefonen har ”minska rörelse” påslaget.

### Poäng
Musiknivåer ger **bara Music-staten** för karaktären, aldrig XP eller rank (samma regel som calisthenics). En klarad nivå ger `10 + 4 × nivå (max 5) + 2 × stjärnor` poäng.

## System

### Filer
| Fil | Innehåll |
|---|---|
| `src/music-theory.js` | Ren musikteori utan DOM: toner, intervall, ackord, skalor, greppbräda, frågegeneratorer, basgångsregler och rättning, rytmrättning och tonhöjdsmätning. |
| `src/music-tree.js` | Trädet (grenar, noder, nivåer) och all logik för framsteg: upplåsning, stjärnor, sparning, streak, mix och stats. |
| `src/music-audio.js` | Ljudmotor med Web Audio: inspelad flygel och elbas, syntetiserat klick och trummor, korta ljudeffekter och mikrofonlyssning. |
| `src/sounds/` | 28 korta mp3-filer (cirka 780 kB): flygel A1–C6 och elbas E1–G3, en inspelning var tredje halvton. |
| `src/music-play-ui.js` | Det som spelas på instrumentet: mikrofoninmatningen som spelen delar, skärmen ”Så funkar övningen”, skalor och arpeggion, Hela halsen och stämapparaten. |
| `src/music-tree-ui.js` | Vyn i skill tree, nivåbladet och övriga spel. Spelen ligger i ett eget lager (`.mg`) utanför `#app`, så att appens omritningar inte avbryter ett spel. |
| `src/music-tree-css.js` | All stil för trädet och spelen. Läggs in en gång som `<style id="music-tree-css">`, så att `style.css` inte behöver ändras. |
| `src/i18n-music-en.js` | Engelska översättningar av alla musiktexter. Sprids in i `src/i18n-en.js`. |
| `tests/music-tree.test.mjs` | Tester för teorin, rättningen, trädet, sparningen, stats, översättningar och ett klick genom gränssnittet. |

`src/app.js` har bara några rader för musiken: den skapar `createMusicTreeUI`, kopplar in kategorin `music`, skickar klick som börjar med `mt:` till `musicTree.action`, och lägger till musikpoängen i karaktärens stats.

### Sparning
Allt sparas i användarens vanliga sparfil (tabellen `user_states` i Supabase, via `save_arc_state_v3`) under nyckeln `musicTree`:

```js
musicTree: {
  nodes: { degrees: { level: 2, stars: [3, 2], seen: '2026-11-11' }, ... }, // klarade nivåer, bästa stjärnor per nivå, senast spelad
  days: ['2026-11-10', '2026-11-11'],  // dagar med resultat (för streak), max 60
  voice: 'mid',                        // röstläge
  best: {},                            // personliga rekord
  mixes: 3                             // antal klarade mixar
}
```

- Ingen databasmigration behövs. Servern godkänner okända nycklar i sparfilen; det är kontrollerat mot den riktiga databasen med en läsfråga (2026-11-11).
- `ensureMusicTree` städar och fyller i data som saknas, så gamla sparfiler fungerar.
- Ett resultat sparas bara om det förbättrar något (ny nivå, fler stjärnor, ny dag eller en klarad mix). Sämre resultat skriver aldrig över bättre.
- Inget annat i sparfilen ändras; XP, historik och profil påverkas inte.

### Ljud och mikrofon
- Piano och bas är riktiga inspelningar. Toner mellan inspelningarna spelas med den närmaste inspelningen, lätt omstämd. Filerna börjar laddas när musikträdet visas och avkodas vid första trycket. Har de inte hunnit laddas (eller saknas nätet) spelar ett syntljud i stället, så spelet väntar aldrig mer än knappt två sekunder.
- Källor: flygeln är Salamander Grand Piano av Alexander Holm (via Tone.js, `Tonejs/audio`), elbasen kommer från `nbrosowsky/tonejs-instruments` (CC BY 3.0). Filerna är kortade, mono och omkodade.
- Ljud får bara starta efter ett tryck på iPhone, så `unlock()` anropas från knapparna.
- På iOS 17+ sätts `navigator.audioSession` till uppspelning, så ljudet hörs även med ljudlöst-knappen på. Medan mikrofonen används byts den till uppspelning och inspelning.
- Musiken går genom en egen kanal som tystas (`stopAll`) när en ny fråga spelas, när en loop startas om och när spelet stängs. Ljudeffekterna går förbi den kanalen.
- Mikrofonen öppnas en gång per spel och stängs när spelet stängs, så iPhone bara frågar om lov en gång.
- Tonhöjden mäts med McLeods metod (normaliserad autokorrelation, NSDF) i `detectPitch`. För sång används ett kort fönster (70–1100 Hz) ungefär 30 gånger i sekunden. För instrument används ett längre fönster som hör ner till basens låga E (41 Hz) och upp över gitarrens tolfte band, ungefär 45 gånger i sekunden.
- Ingenting beror på hur starkt mikrofonen tar upp ljudet. En telefon ger mycket svagare signal än en dator, så ljudnivån jämförs med rummets brus i stället för med ett fast tal.
- `createNoteTracker` gör om mätningarna till spelade toner: en ton räknas en gång när den är tydlig och har hållit i sig cirka 60 ms. Toner som klingar ut, ekon och brus räknas inte, och samma ton räknas igen först vid ett nytt anslag. I testerna hörs en ton inom en kvarts sekund.
- Oktaven räknas inte, så en mörk röst kan sjunga en ton en oktav under och en gitarr kan spela basens övningar.
- Sångspelen lyssnar inte medan referenstonen spelas och klingar ut, så telefonens egen högtalare inte kan ge poäng.
- `_headers` tillåter mikrofon för appen själv (`Permissions-Policy: microphone=(self)`).

### Rättning i korthet
- **Gehör och greppbräda**: rätt eller fel per fråga, tio frågor. Samma ton frågas aldrig två gånger i rad.
- **Skalor och arpeggion**: tre mönster. Poängen är antal toner delat med toner plus missar. En fel ton och en titt på mönstret räknas som missar.
- **Hela halsen**: bara passet utan karta räknas. En ton är ren om den kom utan fel ton, utan Visa och (på tidsnivån) inom tiden. Med mikrofon jämförs tonnamnet, med tryck även strängen.
- **Basgångar**: varje slag kontrolleras mot nivåns regel (`gradeBassLine`). I walking bass spelas slag 4 i oktaven närmast tonen innan (`voiceLine`), och hopp större än en kvint inom en takt räknas som fel. Exempellinjen klarar alltid sin egen regel (testat i alla tonarter).
- **Groove**: varje tryck jämförs med närmaste mål (`gradeTaps`), med en takts inräkning och kompensation för ljudfördröjning.
- **Andning**: tid upp till målet ger upp till 79 %, och när målet nås avgör jämnheten resten. Ett kort ljud (hosta, klick) räknas inte som ett försök.
- **Tonträff och stämsång**: håll tonen inom ±50 cent i 0,4 sekunder. Efter 10 sekunder går spelet vidare.

### Språk
Texterna skrivs på svenska i koden och översätts när de visas, som i resten av appen. Varje ny text behöver en rad i `src/i18n-music-en.js`. Text som byggs ihop av flera delar läggs i egna `<span>` så att varje del kan översättas.

### Lägga till en nivå
1. Lägg till `L(namn, mål, spel, tips)` i rätt nod i `src/music-tree.js`. Spelet återanvänder en befintlig speltyp (`compare`, `degree`, `interval`, `quality`, `chordtone`, `progression`, `inversion`, `fret`, `neck`, `pattern`, `bassline`, `rhythm`, `breath`, `pitch`, `harmony`).
2. Lägg till de nya texterna i `src/i18n-music-en.js`. En ny speltyp behöver också sina tre steg i `HOW`.
3. Kör `npm test` och `npm run build`. Testerna kontrollerar att alla nivåer har ett spel som finns och att texterna är översatta.

Nya nivåer läggs alltid sist i en nod, så att sparade framsteg pekar på samma nivåer som förut.

## Kvar att testa på en riktig iPhone
- Ljud med ljudlöst-knappen på.
- Mikrofontillstånd när appen körs från hemskärmen.
- Fördröjningen i groove-spelet med och utan Bluetooth-hörlurar.
- Mikrofonen med riktig bas och gitarr: börja i stämapparaten. Prova akustiskt nära telefonen och med förstärkare, särskilt den låga E-strängen.
- Sång med telefonens mikrofon efter att de fasta ljudnivåerna togs bort.
