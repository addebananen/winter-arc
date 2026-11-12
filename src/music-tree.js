// Music skill tree: three branches (Gehör, Bas, Sång) with levels you clear by playing short games.
//
// Teaching order follows established practice:
// - Ear: hear notes inside a key first (scale degrees after a cadence), then intervals, chord colours,
//   the role of a note in a chord and finally the bass movement of a progression.
// - Bass: fretboard map → scales → arpeggios (chord tones) → building lines from roots to walking bass,
//   with timing trained against a click.
// - Voice: breath support (steady, slow release) → pitch matching → harmony (fifths, then thirds).
// Mixed daily review ("Dagens mix") interleaves cleared levels, which research on practice schedules
// shows gives better long-term retention than blocked repetition.
//
// Progress is stored in the save file as `musicTree`. Like calisthenics levels it only shapes the
// character's Music stat; XP and rank stay server-controlled.

export const BRANCHES = [
  {id: 'ear', name: 'Gehör', icon: 'ear', color: '#c3b5f2', tagline: 'Hör vad som händer i musiken'},
  {id: 'bass', name: 'Bas', icon: 'bass', color: '#e0c799', tagline: 'Greppbräda, skalor och basgångar'},
  {id: 'voice', name: 'Sång', icon: 'mic', color: '#e1b6d8', tagline: 'Stöd, tonträff och stämsång'},
];

const L = (name, goal, game, tip = '') => ({name, goal, game, tip});

export const NODES = [
  // ---------------- GEHÖR ----------------
  {id: 'basics', branch: 'ear', listen: ['Lyssna på den första tonen och nynna den tyst.', 'Lyssna på den andra tonen. Måste rösten upp eller ner för att nå den?', 'Tryck på den stora knappen för att lyssna igen. Lyssna så många gånger du vill.'], name: 'Första stegen', short: 'Grunder', requires: [],
    learn: 'Börja här om gehör är nytt för dig. Du behöver inte kunna några namn: lyssna bara på vad som händer mellan två toner. Går det uppåt eller nedåt? Är det ett litet steg eller ett hopp? Nynna gärna tonerna tyst för dig själv, då hör du skillnaden lättare.',
    levels: [
      L('Högre eller lägre', 'Två toner långt ifrån varandra.', {type: 'compare', mode: 'direction', gaps: [7, 8, 9, 12]}, 'Högre toner låter ljusare och tunnare, lägre toner mörkare och fylligare.'),
      L('Nära varandra', 'Högre eller lägre när tonerna ligger tätt.', {type: 'compare', mode: 'direction', gaps: [1, 2, 3, 4]}, 'Nynna båda tonerna. Känner du att rösten går upp eller ner?'),
      L('Samma eller olika', 'Hör om tonen ändras.', {type: 'compare', mode: 'same', gaps: [1, 2, 3]}),
      L('Steg eller hopp', 'Granne eller längre bort.', {type: 'compare', mode: 'step', leaps: [5, 7, 9, 12]}, 'Ett steg låter som början på en skala. Ett hopp låter som en signal.'),
      L('Hemma eller borta', 'Vilar tonen efter ackorden?', {type: 'compare', mode: 'home'}, 'Hemma känns som slutet på en låt. Borta känns som en fråga som väntar på svar.'),
      L('Hemma eller kvint', 'Två skalsteg: 1 och 5.', {type: 'degree', pool: ['1', '5']}, '1 är hemma. 5 är stabil men ligger högre och vill gärna falla tillbaka till 1.'),
    ]},
  {id: 'homing', branch: 'ear', listen: ['Ackorden slutar på hemtonen. Nynna den.', 'Efter tonen spelas vägen hem: tonen går ner ett steg i taget tills den landar hemma.', 'Räkna tonerna på vägen. Två toner betyder 2, tre toner betyder 3. Samma sak gör du sedan tyst i huvudet.'], name: 'Vägen hem', short: 'Vägen hem', requires: [],
    learn: 'Här lär du dig knepet som gör skalstegen hörbara: att gå hem. Varje ton i en tonart kan gå stegvis ner till hemtonen, och antalet toner på vägen avslöjar vilket skalsteg det var. Först spelar appen vägen åt dig. Sedan går du den själv i huvudet och har knappen Vägen hem som facit.',
    levels: [
      L('Räkna stegen hem', 'Hör vägen från 1, 2 eller 3.', {type: 'degree', pool: ['1', '2', '3'], walk: true}, 'Hör du bara en ton i vägen var den redan hemma: 1.'),
      L('Längre väg hem', 'Hör vägen från 1 till 5.', {type: 'degree', pool: ['1', '2', '3', '4', '5'], walk: true}, 'Fem toner på vägen betyder 5. Sjung med: fem, fyra, tre, två, ett.'),
      L('1 eller 3', 'Gå vägen själv i huvudet.', {type: 'degree', pool: ['1', '3'], help: true}, 'Sjung tyst nedåt från tonen. Är du redan hemma var det 1. Behövs två steg ner var det 3.'),
      L('3 eller 5', 'De två som är lättast att blanda ihop.', {type: 'degree', pool: ['3', '5'], help: true}, '5 ligger högre och låter öppen och ihålig. 3 ligger närmare hemma och låter varm. Vägen hem från 5 är dubbelt så lång.'),
      L('1, 3 eller 5 med facit', 'Alla tre, med Vägen hem som hjälp.', {type: 'degree', pool: ['1', '3', '5'], help: true}, 'Gissa först. Tryck sedan på Vägen hem och räkna, innan du svarar.'),
    ]},
  {id: 'degrees', branch: 'ear', listen: ['Först spelas fyra ackord, som slutet på en låt. Det sista ackordet landar på hemtonen (1): tonen som låten vilar på. Nynna den.', 'Sedan kommer en ensam ton. Låter den lika vilsam som hemtonen, eller vill den någonstans?', 'Sjung tyst från tonen nedåt, ett steg i taget, tills du når hemtonen, och räkna tonerna. Landar du direkt var det 1. Sjunger du tre toner var det en 3:a.'], name: 'Tonartens toner', short: 'Skalsteg', requires: [],
    learn: 'Musik hörs alltid i förhållande till en tonart. Efter en kadens (I–IV–V–I) vet örat var ”hemma” är. Då känns varje ton som ett skalsteg: 1 vilar, 5 är stabil, 7 vill hem till 1. Det är så proffs hör melodier och baslinjer, inte som lösa intervall.',
    levels: [
      L('Hemma, ters och kvint', 'Skilj 1, 3 och 5 efter kadensen.', {type: 'degree', pool: ['1', '3', '5']}, 'Tryck på Hemtonen och jämför. Låter tonen precis som hemtonen var det 1. Ligger den lite högre och låter ljus var det 3. Ligger den ännu högre och låter öppen och stark var det 5.'),
      L('De fem första', 'Lägg till 2 och 4.', {type: 'degree', pool: ['1', '2', '3', '4', '5']}, '2 vill ner till 1, 4 vill ner till 3.'),
      L('Hela durskalan', 'Alla sju skalsteg.', {type: 'degree', pool: ['1', '2', '3', '4', '5', '6', '7']}, '7 är ledtonen: den drar hårt uppåt mot 1.'),
      L('Moll', 'Skalsteg i naturlig moll.', {type: 'degree', minor: true, pool: ['1', '2', 'b3', '4', '5', 'b6', 'b7']}, '♭3 ger mollkänslan. ♭6 låter mörk och vill ner till 5.'),
      L('Kromatiska färger', 'Toner utanför skalan.', {type: 'degree', pool: ['1', 'b2', '3', '#4', '5', 'b6', 'b7']}, '♭7 är bluesig, ♯4 låter spänd och vill upp till 5.'),
    ]},
  {id: 'intervals', branch: 'ear', listen: ['Nynna den första tonen, sedan den andra.', 'Hur långt är det mellan dem? Ett litet steg, ett mellanhopp eller ett stort hopp.', 'Jämför med början på en låt du kan. Minnesknepet visas efter varje svar.'], name: 'Intervall', short: 'Intervall', requires: [['degrees', 1]],
    learn: 'Ett intervall är avståndet mellan två toner. Varje intervall har en egen karaktär. Ett låtminne för början av varje intervall gör dem lättare att känna igen, men målet är att höra karaktären direkt.',
    levels: [
      L('Kvint eller oktav', 'De två mest stabila avstånden.', {type: 'interval', pool: ['5', '8']}, 'Kvinten låter öppen, som Blinka lilla stjärna. Oktaven låter som samma ton högre.'),
      L('Stor eller liten ters', 'Dur- och mollfärgen.', {type: 'interval', pool: ['b3', '3']}, 'Stor ters låter ljus, liten ters mörkare.'),
      L('Kvart, kvint och terser', 'Blanda de vanligaste.', {type: 'interval', pool: ['b3', '3', '4', '5', '8']}),
      L('Sekunder och sexter', 'Små steg och stora språng.', {type: 'interval', pool: ['b2', '2', 'b3', '3', '4', '5', 'b6', '6']}),
      L('Alla, upp och ner', 'Hela oktaven åt båda håll.', {type: 'interval', dir: 'both', pool: ['b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7', '8']}),
      L('Samtidigt klingande', 'Harmoniska intervall.', {type: 'interval', dir: 'harm', pool: ['b3', '3', '4', '#4', '5', '6', 'b7', '8']}, 'Lyssna efter hur mycket det ”gnisslar”: sekunder och septimor skaver, terser och sexter är mjuka.'),
    ]},
  {id: 'quality', branch: 'ear', listen: ['Lyssna på helheten först: ljust och glatt (dur) eller mörkt och vemodigt (moll)?', 'Låter ackordet stabilt, eller spänt och oroligt?', 'När tonerna spelas en i taget: nynna dem nerifrån och upp.'], name: 'Ackordens färg', short: 'Ackord', requires: [['intervals', 2]],
    learn: 'Ackord byggs av terser på varandra. Dur = stor ters + liten ters, moll = liten + stor. Lägger man till en septima får man fyrklanger med egna färger, till exempel den spända dominanten (7) som vill lösas upp.',
    levels: [
      L('Dur eller moll', 'Ljust eller mörkt.', {type: 'quality', pool: ['maj', 'min'], arp: true}),
      L('Dur, moll, sus4', 'Lägg till det svävande sus-ackordet.', {type: 'quality', pool: ['maj', 'min', 'sus4']}),
      L('Förminskat och överstigande', 'Fyra treklangar.', {type: 'quality', pool: ['maj', 'min', 'dim', 'aug']}),
      L('Fyrklanger', 'Maj7, 7 och m7.', {type: 'quality', pool: ['maj7', 'dom7', 'min7'], arp: true}, 'Maj7 drömmig, 7 bluesig och spänd, m7 mjuk.'),
      L('Alla fyrklanger', 'Lägg till halvförminskat.', {type: 'quality', pool: ['maj7', 'dom7', 'min7', 'm7b5']}),
    ]},
  {id: 'chordtones', branch: 'ear', listen: ['Lyssna först på basen. Den spelar ackordets grundton.', 'Lyssna på den sista tonen. Smälter den ihop med basen (1), färgar den ackordet (3) eller låter den öppen och stark (5)?', 'Tryck på ”Bara basen och tonen” och nynna båda.'], name: 'Tonen i ackordet', short: 'Ackordton', requires: [['quality', 1], ['degrees', 2]],
    learn: 'Basen spelar oftast ackordets grundton. Ovanpå den har varje ton en roll: grundton (vila), ters (avgör dur/moll), kvint (stabil, ”tom”) och septima (spänning). När du hör rollen vet du direkt vilka toner som fungerar i en basgång eller stämma.',
    levels: [
      L('1, 3 eller 5 i dur', 'Hör rollen över basen.', {type: 'chordtone', chords: ['maj'], pool: ['1', '3', '5']}, 'Tersen färgar ackordet, kvinten smälter in, grundtonen låter som basen fast högre.'),
      L('Dur och moll blandat', 'Samma roller, olika färg.', {type: 'chordtone', chords: ['maj', 'min'], pool: ['1', '3', '5']}),
      L('Med septima', 'Lägg till 7:an.', {type: 'chordtone', chords: ['maj7', 'dom7', 'min7'], pool: ['1', '3', '5', '7']}, 'Septiman ligger ett steg under oktaven och vill röra sig.'),
      L('Spänningstoner', '9, 11 och 13 över ackordet.', {type: 'chordtone', chords: ['maj', 'min'], pool: ['1', '3', '5', '9', '11', '13']}, '9 = 2 en oktav upp, 11 = 4, 13 = 6. De ger färg ovanpå ackordet.'),
    ]},
  {id: 'bassmove', branch: 'ear', listen: ['Lyssna bara på basen, den lägsta tonen, inte på ackorden ovanför.', 'Nynna basens toner. Går den upp eller ner, i steg eller hopp?', 'Första ackordet är hemma (I). Jämför de andra med det.'], name: 'Basens väg', short: 'Följ basen', requires: [['chordtones', 1]],
    learn: 'För att höra ackordföljder: lyssna på basen först. Den visar vilket skalsteg varje ackord står på. De flesta poplåtar använder I, IV, V och vi. När basen inte spelar grundtonen blir det en omvändning, till exempel C/E.',
    levels: [
      L('Två ackord', 'I till IV, V eller vi.', {type: 'progression', set: 'two'}),
      L('Tre ackord', 'Korta följder.', {type: 'progression', set: 'three'}),
      L('Popföljder', 'Fyra ackord som i tusentals låtar.', {type: 'progression', set: 'pop'}, 'I–V–vi–IV är världens vanligaste följd. Lyssna efter var basen går ner (vi) eller upp (IV).'),
      L('Omvändningar', 'Vilken ackordton spelar basen?', {type: 'inversion'}),
    ]},

  // ---------------- BAS ----------------
  {id: 'fretboard', branch: 'bass', name: 'Greppbrädan', short: 'Greppbräda', requires: [],
    learn: 'En basist behöver kunna hitta varje ton snabbt. Börja med E- och A-strängen: där ligger nästan alla grundtoner. Band 12 är samma ton som lös sträng, en oktav upp. Oktaven ligger alltid två strängar upp och två band fram.',
    levels: [
      L('E-strängen', 'Stamtoner band 0–5.', {type: 'fret', strings: [0], frets: [0, 5]}, 'E F _ G _ A. Mellan E–F och B–C finns inget band emellan.'),
      L('E och A', 'Stamtoner band 0–7.', {type: 'fret', strings: [0, 1], frets: [0, 7]}),
      L('Hela halsen', 'Alla strängar, band 0–12.', {type: 'fret', strings: [0, 1, 2, 3], frets: [0, 12]}),
      L('Förtecken', '♯ och ♭ överallt.', {type: 'fret', strings: [0, 1, 2, 3], frets: [0, 12], naturals: false}, 'F♯ = ett band över F. B♭ = ett band under B.'),
    ]},
  {id: 'neck', branch: 'bass', name: 'Hela halsen', short: 'Halsen', requires: [],
    learn: 'Här lär du dig varje ton på halsen upp till band 12, en sträng i taget, genom att spela den på ditt instrument. Mellan de flesta toner är det två band. Bara E–F och B–C ligger intill varandra. Band 12 är samma ton som den lösa strängen, en oktav upp. Säg tonens namn högt varje gång du spelar den: det är så namnet fastnar. Bas och gitarr har samma fyra lägsta strängar (E, A, D, G), så övningen fungerar på båda.',
    levels: [
      L('E-strängen', 'E F G A B C D på den lägsta strängen.', {type: 'neck', strings: [0]}, 'Riktmärken: F på band 1, G på band 3, A på band 5, B på band 7, C på band 8 och D på band 10.'),
      L('A-strängen', 'A B C D E F G.', {type: 'neck', strings: [1]}, 'Samma avstånd som på E-strängen, bara förskjutet: B på band 2, C på band 3, D på band 5, E på band 7.'),
      L('D-strängen', 'D E F G A B C.', {type: 'neck', strings: [2]}, 'Oktavformen: samma ton finns två strängar upp och två band upp. E-strängens toner hjälper dig hitta D-strängens.'),
      L('G-strängen', 'G A B C D E F.', {type: 'neck', strings: [3]}, 'Oktavformen igen: A-strängens toner finns två band högre upp på G-strängen.'),
      L('E och A med förtecken', 'Alla tolv tonerna på de två lägsta strängarna.', {type: 'neck', strings: [0, 1], notes: 'all'}, '♯ ligger ett band över tonen och ♭ ett band under. C♯ och D♭ är alltså samma band.'),
      L('D och G med förtecken', 'Alla tolv tonerna på de två högsta strängarna.', {type: 'neck', strings: [2, 3], notes: 'all'}, 'Utgå från en ton du kan och räkna ett band upp eller ner.'),
      L('Samma toner på alla strängar', 'Fyra toner, först på E-strängen, sedan på A, D och G.', {type: 'neck', across: true}, 'Samma ton ligger fem band längre ner på nästa sträng. A på band 5 på E-strängen är samma ton som lös A-sträng.'),
      L('Hela halsen på tid', 'Fyra sekunder per ton, alla strängar.', {type: 'neck', strings: [0, 1, 2, 3], notes: 'all', seconds: 4}, 'Tveka inte. Fel ton går fortare att rätta än en lång tvekan.'),
    ]},
  {id: 'groove', branch: 'bass', name: 'Groove & timing', short: 'Timing', requires: [],
    learn: 'Basens viktigaste jobb är tajmingen: tillsammans med trummorna bestämmer basen hur låten känns. Tryck exakt på slagen till klicket. Spela hellre färre toner med perfekt tajming än många som svajar.',
    levels: [
      L('Fjärdedelar', 'Jämna slag, 80 bpm.', {type: 'rhythm', pattern: 'quarters', bpm: 80}),
      L('Åttondelar', 'Dubbelt så tätt, 80 bpm.', {type: 'rhythm', pattern: 'eighths', bpm: 80}, 'Räkna ”ett-och-två-och”.'),
      L('Rockgroove', 'Ett, två-och, tre, fyra. 90 bpm.', {type: 'rhythm', pattern: 'rock', bpm: 90}),
      L('Synkoper', 'Tryck på ”och”-slagen.', {type: 'rhythm', pattern: 'push', bpm: 90}),
      L('Motown', 'Sextondelspush, 96 bpm.', {type: 'rhythm', pattern: 'motown', bpm: 96}, 'Tänk ”ett – e – och – a”. Push:en kommer på ”a” innan tvåan.'),
    ]},
  {id: 'scales', branch: 'bass', name: 'Skalor på basen', short: 'Skalor', requires: [['fretboard', 2]],
    learn: 'Skalor ger dig tonerna som passar i en tonart. På bas spelas de i mönster som går att flytta: samma fingersättning i alla tonarter. Lär dig mönstret från grundtonen och säg skalstegen högt medan du spelar.',
    levels: [
      L('Durskala', 'Ett oktavmönster.', {type: 'pattern', scales: ['major']}, 'Fingrar 2-4, 1-2-4, 1-3-4. Hel, hel, halv, hel, hel, hel, halv.'),
      L('Mollpentatonisk', 'Rockens och bluesens skala.', {type: 'pattern', scales: ['minPent']}),
      L('Naturlig moll', 'Mollskalan.', {type: 'pattern', scales: ['minor']}),
      L('Durpentatonisk', 'Countryns och soulens skala.', {type: 'pattern', scales: ['majPent']}),
      L('Modala färger', 'Mixolydisk, dorisk och blues.', {type: 'pattern', scales: ['mixo', 'dorian', 'blues']}, 'Mixolydisk = dur med ♭7 (funk). Dorisk = moll med stor sext (soul, jazz).'),
    ]},
  {id: 'arpeggios', branch: 'bass', name: 'Arpeggion', short: 'Arpeggio', requires: [['fretboard', 2], ['quality', 1]],
    learn: 'Ett arpeggio är ackordets toner spelade en i taget. Det är basistens viktigaste verktyg: 1-3-5 visar exakt vilket ackord som klingar. Se formen på greppbrädan, inte bara tonnamnen.',
    levels: [
      L('Durtreklang', '1 – 3 – 5 – 8.', {type: 'pattern', chords: ['maj']}),
      L('Molltreklang', '1 – ♭3 – 5 – 8.', {type: 'pattern', chords: ['min']}, 'Samma form som dur, men tersen ett band närmare grundtonen.'),
      L('Dur eller moll', 'Blandat.', {type: 'pattern', chords: ['maj', 'min']}),
      L('Septimackord', '7, maj7 och m7.', {type: 'pattern', chords: ['dom7', 'maj7', 'min7']}),
    ]},
  {id: 'basslines', branch: 'bass', name: 'Bygg basgångar', short: 'Basgång', requires: [['arpeggios', 1], ['chordtones', 1]],
    learn: 'En basgång knyter ihop ackorden. Regeln som nästan alltid håller: grundtonen på ettan. Därefter ackordtoner (ters, kvint, oktav) och på sista slaget en ton som leder in i nästa ackord, ett halvt eller helt tonsteg ifrån. Så byggs walking bass.',
    levels: [
      L('Grundtoner', 'Hitta grundtonen i varje ackord.', {type: 'bassline', rule: 'root'}),
      L('Grundton och kvint', 'Klassiskt country- och poppumpande.', {type: 'bassline', rule: 'root5'}),
      L('Treklangen', 'Använd ters och oktav.', {type: 'bassline', rule: 'triad'}),
      L('Närmande toner', 'Led in i nästa ackord.', {type: 'bassline', rule: 'approach'}, 'Halvtonen under nästa grundton är det starkaste närmandet.'),
      L('Walking bass', 'Fyra slag, mjuk melodisk linje.', {type: 'bassline', rule: 'walk'}, 'Gå i små steg. Byt riktning när det behövs, men hoppa högst en kvint.'),
    ]},

  // ---------------- SÅNG ----------------
  {id: 'breath', branch: 'voice', name: 'Andning & stöd', short: 'Stöd', requires: [],
    learn: 'Stöd betyder att du styr utandningen: revben och mage får stanna ute medan luften släpps långsamt. Andas lågt (magen och sidorna rör sig, inte axlarna). Ett jämnt ”sss” är ett tydligt sätt att öva: målet är en stadig ström, inte mest luft. Övningen lyssnar på hur jämnt du låter.',
    levels: [
      L('Hitta magen', 'Låg andning i lugnt tempo.', {type: 'breath', mode: 'guided', cycles: 4}, 'Hand på magen, andra handen på bröstet. Bara den nedre handen ska röra sig.'),
      L('Sss i 10 sekunder', 'Jämn luftström.', {type: 'breath', mode: 'hiss', seconds: 10}),
      L('Sss i 20 sekunder', 'Håll revbenen ute.', {type: 'breath', mode: 'hiss', seconds: 20}, 'Låt sidorna stanna ute så länge du kan, i stället för att klämma ut luften.'),
      L('Stödd ton', 'Håll en sjungen ton jämn i 8 sekunder.', {type: 'breath', mode: 'tone', seconds: 8}, 'Lika stark och lika hög från början till slut.'),
      L('Lång stödd ton', '15 sekunder med jämn klang.', {type: 'breath', mode: 'tone', seconds: 15}),
    ]},
  {id: 'pitch', branch: 'voice', name: 'Träffa tonen', short: 'Tonträff', requires: [['breath', 1]],
    learn: 'Att sjunga rent är en färdighet som går att träna: lyssna, föreställ dig tonen inombords och sjung sedan. Mätaren visar om du ligger för högt eller lågt. Sjung i en bekväm styrka. Ligger tonen för högt eller lågt för din röst får du sjunga en oktav annorlunda.',
    levels: [
      L('En ton i taget', 'Matcha tonen du hör.', {type: 'pitch', pattern: [[0], [2], [4], [-3], [5]]}),
      L('Do-re-mi', 'Små steg upp och ner.', {type: 'pitch', pattern: [[0, 2, 4], [4, 2, 0], [0, 2, 4, 5, 7]]}),
      L('Treklangen', '1 – 3 – 5 – 8.', {type: 'pitch', pattern: [[0, 4, 7], [7, 4, 0], [0, 4, 7, 12]]}, 'Tänk på ackordet du hörde i Gehör-grenen.'),
      L('Språng', 'Hoppa till kvarten och sexten.', {type: 'pitch', pattern: [[0, 5], [0, 9], [7, 0], [0, 7, 4]]}),
    ]},
  {id: 'harmony', branch: 'voice', name: 'Stämsång', short: 'Harmoni', requires: [['pitch', 2], ['intervals', 2]],
    learn: 'Att sjunga stämma är att hålla en egen ton mot en annan. Börja med enklast möjliga klang: grundton och kvint. Sedan tersen, som är den vanligaste stämman i pop och kör. Hörlurar gör att mikrofonen bara hör dig.',
    levels: [
      L('Grundtonen', 'Sjung ackordets grundton.', {type: 'harmony', role: '1'}),
      L('Kvinten', 'Sjung kvinten över grundtonen.', {type: 'harmony', role: '5'}),
      L('Tersen', 'Stor ters i dur.', {type: 'harmony', role: '3'}, 'Gå upp två steg i skalan: do-re-mi. Mi är tersen.'),
      L('Ters i moll', 'Den mörkare tersen.', {type: 'harmony', role: 'b3', minor: true}),
      L('Ters över melodin', 'Sjung en ters över tonerna du hör.', {type: 'harmony', role: 'third-over'}, 'I en durskala är tersen över antingen stor eller liten. Låt örat välja tonen som hör till skalan.'),
    ]},
];

for (const n of NODES) n.levels.forEach((l, i) => { l.n = i + 1; l.node = n.id; });
export const nodeById = Object.fromEntries(NODES.map(n => [n.id, n]));
export const QUIZ_TYPES = new Set(['compare', 'degree', 'interval', 'quality', 'chordtone', 'progression', 'inversion', 'fret']);
export const MIC_TYPES = new Set(['pitch', 'harmony']);
export const usesMic = game => MIC_TYPES.has(game.type) || (game.type === 'breath' && game.mode !== 'guided');

// ---------------- state ----------------
const DAY = /^\d{4}-\d{2}-\d{2}$/;
export function ensureMusicTree(state) {
  const raw = state.musicTree && typeof state.musicTree === 'object' && !Array.isArray(state.musicTree) ? state.musicTree : {};
  const nodes = {};
  for (const [id, v] of Object.entries(raw.nodes || {})) {
    const n = nodeById[id]; if (!n || !v || typeof v !== 'object') continue;
    const level = Math.max(0, Math.min(n.levels.length, Math.floor(Number(v.level) || 0)));
    const stars = Array.isArray(v.stars) ? v.stars.slice(0, n.levels.length).map(x => Math.max(0, Math.min(3, Math.floor(Number(x) || 0)))) : [];
    nodes[id] = {level, stars, seen: DAY.test(v.seen) ? v.seen : ''};
  }
  const days = Array.isArray(raw.days) ? [...new Set(raw.days.filter(d => DAY.test(d)))].sort().slice(-60) : [];
  const voice = ['low', 'mid', 'high'].includes(raw.voice) ? raw.voice : 'mid';
  const best = {};
  for (const [k, v] of Object.entries(raw.best || {})) if (/^[a-z]+$/.test(k) && Number.isFinite(Number(v))) best[k] = Math.max(0, Math.round(Number(v)));
  state.musicTree = {nodes, days, voice, best, mixes: Math.max(0, Math.floor(Number(raw.mixes) || 0))};
  return state;
}
export const levelOf = (state, id) => state.musicTree?.nodes?.[id]?.level || 0;
export const starsOf = (state, id, n) => state.musicTree?.nodes?.[id]?.stars?.[n - 1] || 0;
export const missing = (state, reqs = []) => reqs.filter(([id, n]) => levelOf(state, id) < n).map(([id, n]) => ({id, n, name: nodeById[id].name}));
export function status(state, node) {
  const l = levelOf(state, node.id);
  if (l >= node.levels.length) return 'mastered';
  if (missing(state, node.requires).length) return 'locked';
  return l > 0 ? 'progress' : 'open';
}
// Level n can be played when the node is open and every level before it is cleared.
export const canPlay = (state, id, n) => { const node = nodeById[id]; return !!node?.levels[n - 1] && !missing(state, node.requires).length && n <= levelOf(state, id) + 1; };

// Stars from a 0–1 score. 80 % clears a level; 90 % and 100 % give more stars.
export const starsFor = score => score >= .999 ? 3 : score >= .9 ? 2 : score >= .8 ? 1 : 0;

// Records a finished round. Returns what changed so the UI can celebrate it.
export function record(state, id, n, score, day) {
  ensureMusicTree(state);
  const node = nodeById[id];
  if (!node?.levels[n - 1]) throw Error('Okänd musiknivå.');
  if (!canPlay(state, id, n)) throw Error('Klara nivån innan för att låsa upp den här.');
  const stars = starsFor(score), cur = state.musicTree.nodes[id] || {level: 0, stars: [], seen: ''};
  const before = cur.stars[n - 1] || 0, cleared = stars > 0 && n > cur.level;
  while (cur.stars.length < n) cur.stars.push(0);
  cur.stars[n - 1] = Math.max(before, stars);
  if (cleared) cur.level = n;
  if (stars > 0) cur.seen = day;
  state.musicTree.nodes[id] = cur;
  const newDay = stars > 0 && !state.musicTree.days.includes(day);
  if (newDay) state.musicTree.days = [...state.musicTree.days, day].slice(-60);
  return {stars, cleared, improved: stars > before, newDay, mastered: cur.level >= node.levels.length};
}
export function recordMix(state, score, day) {
  ensureMusicTree(state);
  const ok = score >= .7, newDay = ok && !state.musicTree.days.includes(day);
  if (ok) { state.musicTree.mixes++; if (newDay) state.musicTree.days = [...state.musicTree.days, day].slice(-60); }
  return {ok, newDay};
}
export function setVoice(state, voice) { ensureMusicTree(state); if (['low', 'mid', 'high'].includes(voice)) state.musicTree.voice = voice; return state; }
export function setBest(state, key, value) { ensureMusicTree(state); if (value > (state.musicTree.best[key] || 0)) { state.musicTree.best[key] = Math.round(value); return true; } return false; }

// Days in a row with at least one cleared round (today or yesterday keeps it alive).
export function streak(state, today) {
  const days = new Set(state.musicTree?.days || []), d = new Date(today + 'T12:00:00Z');
  if (!days.has(today)) d.setUTCDate(d.getUTCDate() - 1);
  let n = 0;
  while (days.has(d.toISOString().slice(0, 10))) { n++; d.setUTCDate(d.getUTCDate() - 1); }
  return n;
}

// ---------------- character ----------------
// Each cleared level gives Music stat points; stars add a little. Shapes the character only.
export const levelPoints = (n, stars) => 10 + 4 * Math.min(5, n) + 2 * stars;
export function musicStats(state) {
  let music = 0;
  for (const node of NODES) {
    const lvl = levelOf(state, node.id);
    for (let n = 1; n <= lvl; n++) music += levelPoints(n, starsOf(state, node.id, n));
  }
  return {Music: music};
}
export function summary(state) {
  let levels = 0, total = 0, stars = 0, mastered = 0;
  for (const node of NODES) {
    const l = levelOf(state, node.id); levels += l; total += node.levels.length; if (l >= node.levels.length) mastered++;
    for (let n = 1; n <= node.levels.length; n++) stars += starsOf(state, node.id, n);
  }
  return {levels, total, stars, maxStars: total * 3, mastered, nodes: NODES.length};
}
// The next level to play: the first open node in tree order, preferring the branch asked for.
export function nextUp(state, branch) {
  const pool = NODES.filter(n => !branch || n.branch === branch);
  for (const node of pool) { const s = status(state, node); if (s === 'progress' || s === 'open') return {node, n: levelOf(state, node.id) + 1}; }
  return null;
}
// Interleaved review: quiz levels already cleared, weighted toward low stars and long-unseen nodes.
export function mixPool(state, today) {
  const out = [];
  for (const node of NODES) {
    const lvl = levelOf(state, node.id), seen = state.musicTree?.nodes?.[node.id]?.seen || today;
    const age = Math.max(0, (Date.parse(today) - Date.parse(seen)) / 864e5);
    for (let n = 1; n <= lvl; n++) {
      const l = node.levels[n - 1]; if (!QUIZ_TYPES.has(l.game.type)) continue;
      out.push({node, level: l, weight: 1 + (3 - starsOf(state, node.id, n)) + Math.min(5, age / 2)});
    }
  }
  return out;
}
