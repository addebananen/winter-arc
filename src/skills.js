// Calisthenics skill trees.
// Progressions follow the level charts in Overcoming Gravity 2nd ed. (Steven Low) and the
// r/bodyweightfitness "Bodyweight Fitness Progressions" v5.4 / Recommended Routine. `og` is
// the Overcoming Gravity difficulty level where the book lists the exercise; null where the
// step is a preparatory drill from the r/bodyweightfitness charts or common coaching practice.
//
// A level is reached when its goal is met with clean form. Self-reported, like the rest of
// the app, and stored per account in the cloud save (state.skills).

export const SOURCES = 'Overcoming Gravity 2 (Steven Low) och r/bodyweightfitness Bodyweight Fitness Progressions v5.4.';

export const branches = [
  {id: 'mobility', name: 'Rörlighet', icon: 'stretch', color: '#88d3cf'},
  {id: 'foundation', name: 'Grund', icon: 'dumbbell', color: '#a7bcfa'},
  {id: 'skills', name: 'Skills', icon: 'bolt', color: '#e0c799'},
];

const L = (anim, name, goal, cues, mistakes = [], extra = {}) => ({anim, name, goal, cues, mistakes, ...extra});

export const trees = [
  // ------------------------------------------------------------ mobility
  {id: 'wrists', short: 'Handleder', name: 'Handleder', branch: 'mobility', stat: 'Flexibility', col: 0, row: 0,
    about: 'Handlederna bär hela kroppsvikten i handstand, planche och L-sit. Förbered dem före varje pass.',
    levels: [
      L('wrist-circles', 'Handledsrörlighet', '2 × 10 åt varje håll', ['Rulla handlederna, böj och sträck lugnt.', 'Knyt och spreta med fingrarna mellan seten.'], ['Att stressa igenom rörelsen kallt.']),
      L('wrist-rocks', 'Handledsstretch i fyrfota', '3 × 30 s', ['Händerna under axlarna, fingrarna framåt.', 'Gunga fram så långt det är bekvämt.', 'Prova även med fingrarna bakåt.'], ['Handflatan lyfter från golvet.']),
      L('palm-lifts', 'Handflatelyft', '2 × 10', ['Lyft handflatan, fingrarna stannar i golvet.', 'Sänk långsamt.'], ['Att låta armbågen böjas för att fuska.']),
      L('wrist-lean', 'Handledslean i planka', '3 × 20 s utan obehag', ['Raka armar, luta axlarna framför händerna.', 'Öka lutningen gradvis vecka för vecka.'], ['Smärta i handleden: backa ett steg.']),
    ]},
  {id: 'shoulder-flex', short: 'Axlar upp', name: 'Axlar: armar över huvudet', branch: 'mobility', stat: 'Flexibility', col: 0, row: 1,
    about: 'Full axelflexion gör att du kan stå rakt i handstand utan att svanka.',
    levels: [
      L('band-dislocates', 'Bandpass', '2 × 10', ['Brett grepp, raka armar hela vägen.', 'Smalna av greppet över tid.'], ['Böjda armbågar i bakre läget.']),
      L('puppy-pose', 'Valpställning', '3 × 30 s', ['Höften rakt över knäna.', 'Låt bröstet sjunka mot golvet.'], ['Att sätta sig bakåt på hälarna.']),
      L('dead-hang', 'Passivt häng', '3 × 30 s', ['Låt axlarna sträckas mot öronen.', 'Andas lugnt, slappna av i nacken.']),
      L('wall-test', 'Väggtest', 'Raka armar mot väggen, 3 × 10 s', ['Ländrygg, bakhuvud och säte mot väggen.', 'Armarna raka hela vägen upp.'], ['Ländryggen släpper från väggen.']),
    ]},
  {id: 'shoulder-ext', short: 'Axlar bakåt', name: 'Axlar: armar bakåt', branch: 'mobility', stat: 'Flexibility', col: 0, row: 2,
    about: 'Axelextension behövs för back lever, muscle-up-övergången och dips. German hang är förkunskapen för back lever.',
    levels: [
      L('bench-shoulder', 'Axelstretch bakåt', '3 × 30 s', ['Händerna på bänken bakom dig.', 'Sänk dig långsamt med öppet bröst.'], ['Axlarna rullar fram mot öronen.']),
      L('skin-the-cat', 'Skin the cat (tuck)', '3 × 3 kontrollerade', ['Tuck och rotera långsamt bakåt.', 'Gå bara så långt axlarna tillåter.', 'Börja med fötterna i golvet om det behövs.'], ['Att släppa ner i botten utan kontroll.'], {og: 2}),
      L('german-hang', 'German hang', '3 × 20–30 s', ['Raka armar bakom kroppen.', 'Gå in och ut via tuck.'], ['Att hänga i passiva leder första gångerna: håll korta set.'], {og: 1}),
    ]},
  {id: 'pike', short: 'Pike', name: 'Pike & kompression', branch: 'mobility', stat: 'Flexibility', col: 0, row: 3,
    about: 'Baksida lår och höftböjarnas styrka i förkortat läge avgör din L-sit.',
    levels: [
      L('pike-fold', 'Sittande pikestretch', '3 × 30 s', ['Fäll från höften, lång rygg.', 'Raka knän, tårna mot taket.'], ['Att runda ryggen för att nå längre.']),
      L('pike-lift-one', 'Kompressionslyft, ett ben', '3 × 10 per ben', ['Händerna i golvet vid knäna.', 'Lyft benet med lårets framsida.'], ['Att luta bakåt.']),
      L('pike-lift-both', 'Kompressionslyft, båda benen', '3 × 8', ['Luta axlarna framåt över händerna.', 'Lyft båda hälarna samtidigt.'], ['Böjda knän.']),
      L('standing-pike', 'Stående pikefällning', '3 × 30 s med handflatorna i golvet', ['Raka knän, fäll från höften.', 'Låt huvudet hänga tungt.', 'Vikten lätt fram mot tårna.'], ['Att runda ländryggen i stället för att fälla i höften.']),
    ]},
  {id: 'straddle-base', short: 'Straddle-start', name: 'Straddle från grunden', branch: 'mobility', stat: 'Flexibility', col: 0, row: 4,
    about: 'Kommer du bara halvvägs ner i en straddle? Börja här. Stegen öppnar insidan av låren och höfterna i lugn takt, så att pancake och straddle-trädet blir möjliga.',
    levels: [
      L('butterfly', 'Fjärilen', '3 × 30 s', ['Sitt med fotsulorna mot varandra.', 'Håll i fötterna och sitt lång i ryggen.', 'Låt knäna sjunka av sig själva, tryck inte.'], ['Att trycka ner knäna med händerna.']),
      L('straddle-sit', 'Sittande straddle, rak rygg', '3 × 45 s', ['Benen så brett det går utan smärta, knäna får vara lätt böjda.', 'Händerna i golvet bakom dig.', 'Sitt lång och andas lugnt.'], ['Att sjunka ihop i ländryggen.']),
      L('side-lunge', 'Sidoutfall', '2 × 8 per sida', ['Brett steg åt sidan.', 'Böj ena knät och sätt dig bakåt, det andra benet rakt.', 'Gå bara så djupt det känns bra.'], ['Att knät faller inåt.']),
      L('supported-fold', 'Bred fällning med stöd', '3 × 30 s', ['Fötterna brett isär.', 'Händerna på en stol, låda eller block.', 'Fäll från höften med lång rygg.'], ['Att runda ryggen för att komma längre ner.']),
      L('half-pancake', 'Halv pancake', '3 × 30 s', ['Sitt bredbent, knäna får vara lätt böjda.', 'Gå fram med händerna tills du känner stretch.', 'Stanna där och andas ut.'], ['Att tvinga sig längre än en sjua av tio i stretch.']),
    ]},
  {id: 'straddle', short: 'Straddle', name: 'Straddle', branch: 'mobility', stat: 'Flexibility', col: 0, row: 5,
    about: 'Bred straddle behövs för straddle-varianter av planche, levers, flagga och enarms-handstand. De senare nivåerna tar dig steg för steg ner i en mittspagat.',
    levels: [
      L('pancake', 'Pancake', '3 × 45 s', ['Benen brett, tårna mot taket.', 'Fäll framåt med rak rygg.'], ['Att knäna rullar inåt.']),
      L('straddle-lift', 'Straddle-kompressionslyft', '3 × 8', ['Händerna i golvet framför dig.', 'Lyft båda benen med raka knän.']),
      L('horse-stance', 'Hästställning', '3 × 45 s', ['Fötterna dubbelt axelbrett, tårna lätt utåt.', 'Pressa knäna utåt över tårna.', 'Sitt djupt med rak rygg.'], ['Knäna faller inåt.']),
      L('straddle-fold', 'Stående straddlefällning', '3 × 30 s', ['Fötterna brett isär, tårna framåt.', 'Fäll från höften med lång rygg.', 'Händerna i golvet mellan fötterna.'], ['Att låsa knäna bakåt.']),
      L('straddle-slide', 'Sidoglid mot spagat', '3 × 30 s i lägsta läget', ['Händerna i golvet eller på block framför dig.', 'Låt fötterna glida isär lite i taget.', 'Spänn insidan av låren en stund, slappna sedan av och sjunk.'], ['Att tvinga sig ner när det gör ont: stanna vid stark stretch.']),
      L('middle-split', 'Mittspagat', '3 × 30 s', ['Höften i linje med fötterna.', 'Tårna mot taket eller framåt, inte inåt.', 'Ta dig ner via sidoglidet och ut samma väg.'], ['Att rulla bäckenet bakåt och svanka.']),
    ]},
  {id: 'ankles', short: 'Fotleder', name: 'Fotleder & djup knäböj', branch: 'mobility', stat: 'Flexibility', col: 0, row: 6,
    about: 'Fotledsrörlighet låter hälen stanna i golvet i pistol squat.',
    levels: [
      L('knee-to-wall', 'Knä mot vägg', '2 × 10 per ben, knät ca 10 cm framför tårna', ['Hälen stannar i golvet.', 'Knät följer andra tån.']),
      L('deep-squat', 'Djup knäböj, håll', '3 × 60 s med hälarna i golvet', ['Bröstet upp, vikten mitt på foten.', 'Håll i något framför dig om det behövs.']),
      L('squat-rocks', 'Fotledsgunga i djup knäböj', '2 × 10 per ben', ['Sitt i djup knäböj.', 'För knät fram över tårna, ett ben i taget.', 'Hälen stannar i golvet.'], ['Att hälen lyfter när knät går fram.']),
    ]},
  {id: 'hips', short: 'Höfter', name: 'Höfter & frontspagat', branch: 'mobility', stat: 'Flexibility', col: 0, row: 7,
    about: 'Rörliga höfter ger djupare knäböj, friare löpsteg och en väg till frontspagat. Gör båda sidor och logga den stelare.',
    levels: [
      L('hip-flexor-lunge', 'Höftböjarstretch i utfall', '3 × 30 s per sida', ['Bakre knät i golvet, främre foten långt fram.', 'Spänn sätet på bakre sidan.', 'För höften framåt med rak överkropp.'], ['Att svanka i stället för att spänna sätet.']),
      L('pigeon', 'Duvan', '3 × 45 s per sida', ['Främre benet böjt framför dig, bakre benet rakt bakåt.', 'Höften rak mot golvet.', 'Fäll långsamt framåt över främre benet.'], ['Att höften tippar åt sidan.']),
      L('couch-stretch', 'Couch stretch', '3 × 45 s per sida', ['Bakre knät mot väggen, smalbenet upp längs väggen.', 'Främre foten i golvet.', 'Res överkroppen så långt du kan med spänt säte.'], ['Svank i ländryggen.']),
      L('half-split', 'Halv spagat', '3 × 30 s per sida', ['Bakre knät i golvet, främre benet rakt.', 'Tårna på främre foten mot taket.', 'Fäll från höften med lång rygg.'], ['Att böja främre knät.']),
      L('split-slide', 'Frontspagat med stöd', '3 × 30 s per sida i lägsta läget', ['Händerna på block eller golvet.', 'Glid främre hälen fram och bakre knät bak.', 'Höften rak framåt.'], ['Att vrida upp bakre höften.']),
      L('front-split', 'Frontspagat', '3 × 30 s per sida', ['Främre benet rakt fram, bakre rakt bak.', 'Höften rak och nära golvet.', 'Ta dig ner via glidet och upp samma väg.'], ['Att tvinga sig ner när det gör ont: stanna vid stark stretch.']),
    ]},

  // ------------------------------------------------------------ foundation
  {id: 'core', short: 'Kroppslinje', name: 'Kroppslinje', branch: 'foundation', stat: 'Strength', stat2: 'Discipline', col: 1, row: 0,
    about: 'Hollow- och arch-positionen är grunden för handstand, levers och planche.',
    levels: [
      L('plank', 'Planka', '3 × 45 s', ['Armbågarna under axlarna.', 'Spänn säte och mage.'], ['Hängande höft eller höften för högt.']),
      L('tuck-hollow', 'Tuck hollow hold', '3 × 30 s', ['Ländryggen i golvet.', 'Axlarna lyfta, knäna mot bröstet.'], ['Att ländryggen släpper.']),
      L('hollow', 'Hollow hold', '3 × 30 s', ['Raka ben lågt, armarna längs sidorna.', 'Ländryggen kvar i golvet.'], ['Benen så lågt att ryggen svankar.']),
      L('hollow-full', 'Hollow hold, armar över huvudet', '3 × 30 s', ['Armarna förbi öronen.', 'Kroppen som en banan.'], ['Att hakan pekar mot taket.']),
      L('arch-hold', 'Arch hold', '3 × 30 s', ['Lyft bröst, armar och ben.', 'Spänn sätet.'], ['Att bara böja i nacken.']),
    ]},
  {id: 'push', short: 'Armhävning', name: 'Armhävning → enarms', branch: 'foundation', stat: 'Strength', col: 1, row: 1,
    about: 'Horisontell press. Från lutande armhävning till enarmsarmhävning.',
    levels: [
      L('incline-push-up', 'Lutande armhävning', '3 × 8', ['Händerna på en stabil bänk.', 'Rak kropp.'], ['Hängande höft.']),
      L('push-up', 'Armhävning', '3 × 8', ['Bröstet nära golvet.', 'Armbågarna ca 45° från kroppen.'], ['Utflaxande armbågar.', 'Halva repetitioner.'], {og: 1}),
      L('diamond-push-up', 'Diamantarmhävning', '3 × 8', ['Händerna ihop under bröstbenet.', 'Armbågarna bakåt längs kroppen.'], [], {og: 2}),
      L('pppu', 'Pseudo planche push-up', '3 × 8', ['Händerna vid midjan, fingrarna bakåt.', 'Behåll framåtlutningen hela vägen.'], ['Att tappa lutningen i botten.']),
      L('archer-push-up', 'Archer push-up', '3 × 5 per sida', ['Den raka armen glider ut åt sidan.', 'Bröstet mot den böjda armens hand.'], ['Att vrida höften.']),
      L('incline-oapu', 'Lutande enarmsarmhävning', '3 × 5 per sida', ['Fötterna brett, höften parallell med bänken.'], ['Att rotera bålen.'], {og: 5}),
      L('oapu', 'Enarmsarmhävning', '3 × 3–5 per sida', ['Spänn hela kroppen, fötterna brett.', 'Handen under bröstet.'], ['Rotation i höften.'], {og: 6, skill: true}),
    ]},
  {id: 'pull', short: 'Pull-ups', name: 'Pull-ups', branch: 'foundation', stat: 'Strength', col: 1, row: 2,
    about: 'Vertikalt drag. Grunden för front lever, back lever, muscle-up och flaggan.',
    levels: [
      L('dead-hang', 'Häng', '3 × 30 s', ['Fullt grepp, raka armar.', 'Andas lugnt.']),
      L('scap-pull', 'Scapula pull-up', '3 × 8', ['Raka armar, dra ner skulderbladen.', 'Kroppen lyfts bara några cm.'], ['Att böja armarna.']),
      L('arch-hang', 'Arch hang', '3 × 8 (1–2 s håll)', ['Bröstet mot stången, skulderbladen ner och bak.'], ['Att svanka i ländryggen i stället för bröstryggen.']),
      L('pull-up-negative', 'Negativ pull-up', '3 × 5, 3–5 s ner', ['Hoppa upp till toppläget.', 'Sänk dig jämnt hela vägen.'], ['Att släppa de sista centimetrarna.'], {og: 2}),
      L('pull-up', 'Pull-up', '3 × 8', ['Från raka armar till hakan över stången.', 'Ingen sving.'], ['Halva repetitioner.'], {og: 3}),
      L('c2b-pull-up', 'Chest-to-bar pull-up', '3 × 5', ['Dra bröstet hela vägen till stången.', 'Armbågarna bakåt och ner.'], [], {skill: true}),
    ]},
  {id: 'dip', short: 'Dips', name: 'Dips', branch: 'foundation', stat: 'Strength', col: 1, row: 3,
    about: 'Lodrät press nedåt. Support hold är också grunden för L-sit.',
    levels: [
      L('support-hold', 'Support hold', '3 × 30 s', ['Raka armar, axlarna ner från öronen.'], ['Uppdragna axlar.'], {og: 1}),
      L('dip-negative', 'Negativ dip', '3 × 5, 3–5 s ner', ['Sänk tills axeln är strax under armbågen.'], [], {og: 2}),
      L('dip', 'Dips', '3 × 8', ['Lätt framåtlutning, armbågarna bakåt.', 'Full rörelsebana.'], ['För djupt med smärta i axelns framsida.'], {og: 3}),
      L('dip', 'Dips, volym', '3 × 12', ['Samma teknik, fler repetitioner.', 'Stark bas inför muscle-up.'], [], {skill: true}),
    ]},
  {id: 'legs', short: 'Pistol squat', name: 'Ben → pistol squat', branch: 'foundation', stat: 'Strength', col: 1, row: 4,
    about: 'Från knäböj till pistol squat på ett ben.',
    levels: [
      L('squat', 'Djup knäböj', '3 × 15', ['Höften under knähöjd.', 'Hälarna i golvet.']),
      L('split-squat', 'Split squat', '3 × 8 per ben', ['Bakre knät nästan till golvet.']),
      L('bulgarian', 'Bulgarisk split squat', '3 × 8 per ben', ['Bakre foten på en bänk.', 'Tyngden på främre benet.']),
      L('cossack', 'Cossack squat', '3 × 6 per sida', ['Sitt djupt på ett ben, det andra rakt.'], ['Hälen lyfter.'], {og: 3}),
      L('box-pistol', 'Pistol till låda', '3 × 5 per ben', ['Sätt dig kontrollerat, res dig utan gungning.'], [], {requires: [['ankles', 1]]}),
      L('assisted-pistol', 'Assisterad pistol', '3 × 5 per ben', ['Håll i en stolpe, hjälp så lite som möjligt.'], [], {requires: [['ankles', 2]]}),
      L('pistol', 'Pistol squat', '3 × 5 per ben', ['Hela foten i golvet.', 'Armarna framåt som motvikt.'], ['Knät faller inåt.'], {og: 4, skill: true}),
    ]},

  // ------------------------------------------------------------ skills
  {id: 'l-sit', short: 'L-sit', name: 'L-sit', branch: 'skills', stat: 'Strength', col: 2, row: 0,
    requires: [['dip', 1], ['pike', 1], ['core', 2]],
    about: 'Raka armar, nedtryckta axlar och benen vågrätt. Kompressionsstyrka gör största skillnaden.',
    levels: [
      L('foot-l-sit', 'Fotunderstödd L-sit', '3 × 30 s', ['Hälarna i golvet, höften lyft.', 'Axlarna ner.']),
      L('one-foot-l-sit', 'Enbens fotunderstödd L-sit', '3 × 20 s per ben', ['Lyft ett rakt ben.']),
      L('tuck-l-sit', 'Tuck L-sit', '3 × 20 s', ['Knäna mot bröstet.', 'Tryck golvet ifrån dig.'], ['Böjda armbågar.'], {og: 1}),
      L('one-leg-l-sit', 'Enbens L-sit', '3 × 15 s per ben', ['Ett ben rakt, ett i tuck.'], [], {og: 2}),
      L('l-sit', 'L-sit', '3 × 15 s, sedan 30 s', ['Raka ben, spetsade tår.', 'Lyft från axlarna.'], ['Benen sjunker under vågrätt.'], {og: 3, skill: true}),
    ]},
  {id: 'handstand', short: 'Handstand', name: 'Handstand', branch: 'skills', stat: 'Strength', stat2: 'Discipline', col: 2, row: 1,
    requires: [['wrists', 2], ['shoulder-flex', 2], ['core', 3], ['push', 2]],
    about: 'Rak linje från händer till tår. Balansen kommer från fingrar och handleder.',
    levels: [
      L('wall-plank', 'Väggplanka', '3 × 30 s', ['Axlarna över händerna.', 'Spänd mage.']),
      L('chest-to-wall', 'Handstand mot vägg, magen in', '3 × 30 s, sedan 60 s', ['Händerna en handsbredd från väggen.', 'Tryck upp, revbenen in.'], ['Att svanka.', 'Att sjunka i axlarna.'], {og: 1}),
      L('toe-pulls', 'Tåavdrag från vägg', '5 × 3–5 s', ['Dra tårna från väggen med fingrarna.', 'Balansera kort och gå tillbaka.'], [], {og: 3}),
      L('kick-up', 'Kick-up och säker utgång', '10 kontrollerade kick-ups', ['Öva utgången först: kliv ner eller vrid ut åt sidan (piruett).', 'Sparka lätt, samla benen överst.'], ['Att sparka för hårt och falla över.']),
      L('handstand', 'Fristående handstand', '5 × 10 s', ['Rak linje, tryck upp.', 'Korrigera med fingertopparna.'], ['Bananform.'], {og: 4}),
      L('handstand', 'Handstand 30 s', '3 × 30 s', ['Lugn andning i positionen.'], [], {og: 5}),
      L('handstand', 'Handstand 60 s', '1 × 60 s', ['Stabil linje genom hela hållet.'], [], {og: 5, skill: true}),
    ]},
  {id: 'hspu', short: 'HSPU', name: 'Handstand push-up', branch: 'skills', stat: 'Strength', col: 3, row: 1,
    requires: [['push', 2]],
    about: 'En press över huvudet upp och ner: huvudet går fram förbi fingertopparna och armbågarna pekar bakåt.',
    levels: [
      L('pike-push-up', 'Pike push-up', '3 × 8', ['Höften högt.', 'Huvudet fram förbi fingertopparna.'], ['Att huvudet går rakt ner mellan händerna.'], {og: 1}),
      L('elevated-pike-push-up', 'Upphöjd pike push-up', '3 × 8', ['Fötterna på en låda, höften över axlarna.'], [], {og: 2}),
      L('wall-hspu-negative', 'Negativ headstand push-up mot vägg', '3 × 3, 5 s ner', ['Magen mot väggen.', 'Mjuk matta under huvudet.'], [], {og: 3, requires: [['handstand', 2]]}),
      L('wall-hspu-head', 'Headstand push-up mot vägg', '3 × 5', ['Huvudet lätt i mattan.', 'Underarmarna lodräta i botten.'], [], {og: 4, requires: [['handstand', 2]]}),
      L('wall-hspu-deficit', 'Wall HSPU, full rörelsebana', '3 × 5', ['Parallettes, huvudet under händernas nivå.'], [], {og: 5, requires: [['handstand', 2]]}),
      L('free-hspu-head', 'Fristående headstand push-up', '3 × 3', ['Benen balanserar när huvudet går fram.'], [], {og: 6, requires: [['handstand', 6]]}),
      L('free-hspu', 'Fristående handstand push-up', '3 × 3', ['Full rörelsebana utan vägg.'], [], {og: 7, skill: true, requires: [['handstand', 7]]}),
    ]},
  {id: 'oahs', short: 'Enarms-HS', name: 'Enarms-handstand', branch: 'skills', stat: 'Discipline', stat2: 'Strength', col: 3, row: 2,
    requires: [['handstand', 7], ['straddle', 1]],
    about: 'Ofta flera års träning. Stödarmen lodrät, höften förskjuten över handen.',
    levels: [
      L('straddle-handstand', 'Straddle handstand', '3 × 30 s', ['Benen brett, höften över axlarna.']),
      L('weight-shift', 'Viktförflyttning', '3 × 5 per sida', ['Flytta axel och höft över ena handen.'], ['Att bara luta överkroppen.']),
      L('block-oahs', 'Stöd på block', '3 × 20 s per sida', ['Fria handen lätt på ett block.']),
      L('fingertip-oahs', 'Fingertoppsstöd', '3 × 20 s per sida', ['Bara fingertopparna i golvet.']),
      L('oahs-lift', 'Lyft från fingertoppar', '5 × 3 s per sida', ['Lyft kort, tillbaka innan linjen tappas.']),
      L('oahs-straddle', 'Enarms-handstand, straddle', '5 × 5–10 s', ['Fria armen ut åt sidan.'], [], {og: 10}),
      L('oahs', 'Enarms-handstand', '10 s med benen ihop', ['Hela kroppen staplad över en hand.'], [], {og: 10, skill: true}),
    ]},
  {id: 'muscle-up', short: 'Muscle-up', name: 'Muscle-up', branch: 'skills', stat: 'Strength', col: 2, row: 2,
    requires: [['pull', 6], ['dip', 3]],
    about: 'Explosivt drag, snabb övergång och press ovanpå stången.',
    levels: [
      L('kip-swing', 'Kip-sving', '3 × 10', ['Hollow fram, arch bak.', 'Svingen kommer från axlarna och höften.']),
      L('explosive-pull-up', 'Explosiv pull-up', '3 × 5', ['Stången till nedre bröstet eller magen.']),
      L('straight-bar-dip', 'Straight bar dip', '3 × 8', ['Sänk bröstet mot stången, armbågarna bakåt.']),
      L('low-bar-transition', 'Transition på låg stång', '3 × 5', ['Fötterna i golvet, öva att rulla över stången.']),
      L('mu-negative', 'Negativ muscle-up', '3 × 3', ['Långsamt genom övergången.'], [], {og: 3}),
      L('kipping-muscle-up', 'Kipping muscle-up', '3 × 3', ['Höftkick, dra stången mot magen.', 'Gummiband går bra som stöd.'], ['Kycklingvinge: en arm i taget över stången.'], {og: 4}),
      L('muscle-up', 'Muscle-up', '3 × 3', ['Liten sving, ren övergång.'], [], {og: 5, skill: true}),
      L('strict-muscle-up', 'Strikt muscle-up', '3 × 1–3', ['Ingen sving alls.'], [], {og: 7}),
    ]},
  {id: 'front-lever', short: 'Front lever', name: 'Front lever', branch: 'skills', stat: 'Strength', col: 2, row: 3,
    requires: [['pull', 5], ['core', 4]],
    about: 'Raka armar, kroppen vågrät med ansiktet uppåt. Straddle och ett ben är nära i svårighet; välj den som passar dig.',
    levels: [
      L('front-lever-tuck', 'Tuck front lever', '3 × 10–15 s', ['Raka armar, skulderbladen ner.'], ['Böjda armbågar.'], {og: 4}),
      L('front-lever-adv', 'Advanced tuck front lever', '3 × 10–15 s', ['Platt rygg, höften i 90°.'], [], {og: 5}),
      L('front-lever-straddle', 'Straddle front lever', '3 × 10 s', ['Raka ben brett isär.'], [], {og: 6, requires: [['straddle', 1]]}),
      L('front-lever-one', 'Enbens front lever', '3 × 10 s', ['Ett ben rakt, ett i tuck.'], [], {og: 7}),
      L('front-lever', 'Front lever', '3 × 5–10 s', ['Hela kroppen vågrät.'], ['Höften sjunker.'], {og: 8, skill: true}),
    ]},
  {id: 'back-lever', short: 'Back lever', name: 'Back lever', branch: 'skills', stat: 'Strength', col: 2, row: 4,
    requires: [['shoulder-ext', 3], ['pull', 4]],
    about: 'Ansiktet nedåt, armarna bakom kroppen. Kräver german hang. Bygg upp axlarna och biceps långsamt.',
    levels: [
      L('back-lever-tuck', 'Tuck back lever', '3 × 10–15 s', ['Raka armar, knäna mot bröstet.'], [], {og: 3}),
      L('back-lever-adv', 'Advanced tuck back lever', '3 × 10–15 s', ['Platt rygg, höften i 90°.'], [], {og: 4}),
      L('back-lever-straddle', 'Straddle back lever', '3 × 10 s', ['Raka ben brett isär.'], [], {og: 5, requires: [['straddle', 1]]}),
      L('back-lever-one', 'Enbens back lever', '3 × 10 s', ['Ett ben rakt, ett i tuck.'], [], {og: 6}),
      L('back-lever', 'Back lever', '3 × 5–10 s', ['Hela kroppen vågrät, spänt säte.'], [], {og: 7, skill: true}),
    ]},
  {id: 'planche', short: 'Planche', name: 'Planche', branch: 'skills', stat: 'Strength', stat2: 'Discipline', col: 3, row: 3,
    requires: [['wrists', 4], ['push', 4], ['core', 3]],
    about: 'Raka armar, axlarna långt framför händerna. Den mest krävande skillen här: räkna med år.',
    levels: [
      L('planche-lean', 'Planche lean', '3 × 20–30 s', ['Raka armar, axlarna framför händerna.', 'Protrahera skulderbladen.']),
      L('frog-stand', 'Frog stand', '3 × 30 s', ['Knäna mot armbågarna, luta fram.'], [], {og: 3}),
      L('straight-arm-frog', 'Rakarmad frog stand', '3 × 20 s', ['Låsta armbågar.'], [], {og: 4}),
      L('planche-tuck', 'Tuck planche', '3 × 10–15 s', ['Rundad rygg, knäna under bröstet.'], ['Böjda armar.'], {og: 5}),
      L('planche-adv', 'Advanced tuck planche', '3 × 10–15 s', ['Platt rygg, höften i axelhöjd.'], [], {og: 6}),
      L('planche-straddle', 'Straddle planche', '3 × 5–10 s', ['Raka ben brett isär.'], [], {og: 8, requires: [['straddle', 2]]}),
      L('planche-one', 'Enbens planche', '3 × 5–10 s', ['Ett ben rakt bakåt.'], [], {og: 9}),
      L('planche', 'Planche', '3 × 5 s', ['Hela kroppen vågrät.'], [], {og: 11, skill: true}),
    ]},
  {id: 'flag', short: 'Human flag', name: 'Human flag', branch: 'skills', stat: 'Strength', col: 3, row: 4,
    requires: [['pull', 5], ['hspu', 2], ['shoulder-flex', 2]],
    about: 'Övre armen drar, nedre armen trycker. Träna båda sidorna.',
    levels: [
      L('side-plank', 'Sidoplanka', '3 × 45 s per sida', ['Rak linje, höften upp.']),
      L('vertical-flag', 'Vertikal flagga', '3 × 10 s', ['Upp och ner längs stolpen, nedre armen rak.'], ['Böjd nedre arm.']),
      L('tuck-flag', 'Tuck flag', '3 × 10 s', ['Höften i höjd med axlarna.'], [], {og: 5}),
      L('adv-tuck-flag', 'Advanced tuck flag', '3 × 10 s', ['Öppna höften.'], [], {og: 6}),
      L('straddle-flag', 'Straddle flag', '3 × 5–10 s', ['Raka ben brett isär.'], [], {og: 7, requires: [['straddle', 1]]}),
      L('human-flag', 'Human flag', '3 × 5 s', ['Benen ihop, kroppen vågrät.'], [], {og: 8, skill: true}),
    ]},
];

export const treeById = Object.fromEntries(trees.map(t => [t.id, t]));
for (const t of trees) t.levels.forEach((l, i) => { l.n = i + 1; l.tree = t.id; });

// ---------- state ----------
export function ensureSkills(state) {
  const raw = state.skills && typeof state.skills === 'object' && !Array.isArray(state.skills) ? state.skills : {};
  const clean = {};
  for (const [id, v] of Object.entries(raw)) {
    const t = treeById[id]; if (!t || !v || typeof v !== 'object') continue;
    const level = Math.max(0, Math.min(t.levels.length, Math.floor(Number(v.level) || 0)));
    const log = Array.isArray(v.log) ? v.log.filter(e => Array.isArray(e) && Number.isInteger(e[0]) && typeof e[1] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e[1])).slice(-60) : [];
    clean[id] = {level, log};
  }
  state.skills = clean;
  return state;
}
export const levelOf = (state, id) => workoutLevels(state)[id] || 0;

export function setLevel(state, id, level, date) {
  ensureSkills(state);
  const t = treeById[id]; if (!t) throw Error('Okänd skill.');
  level = Math.max(0, Math.min(t.levels.length, Math.floor(level)));
  const cur = state.skills[id] || {level: 0, log: []};
  cur.level = level; cur.log = [...cur.log, [level, date]].slice(-60);
  state.skills[id] = cur;
  return state;
}

// Requirements that are not yet met for a whole tree (to start it) or a single level.
export function missing(state, reqs = []) {
  return reqs.filter(([id, n]) => levelOf(state, id) < n).map(([id, n]) => ({id, n, name: treeById[id].name, level: treeById[id].levels[n - 1].name}));
}
export function status(state, t) {
  const lvl = levelOf(state, t.id);
  if (lvl >= t.levels.length) return 'mastered';
  if (lvl > 0) return 'progress';
  return missing(state, t.requires).length ? 'locked' : 'open';
}

// ---------- character sync ----------
// Every reached level gives the tree's stat points (harder levels give more). Completed
// personal goals add to their life area. These points shape the character only; XP and rank
// stay server-enforced and are not affected.
export const levelPoints = l => 15 + 10 * (l.og || Math.min(4, l.n));
export function skillStats(state) {
  const s = {Strength: 0, Flexibility: 0, Discipline: 0};
  for (const t of trees) {
    const lvl = levelOf(state, t.id);
    for (const l of t.levels.slice(0, lvl)) {
      const p = levelPoints(l);
      if (t.stat2) { s[t.stat] += Math.round(p * .7); s[t.stat2] += Math.round(p * .3); } else s[t.stat] += p;
    }
  }
  return s;
}
export const GOAL_POINTS = 50;
export function goalStats(state, categories) {
  const s = {};
  for (const g of state.goals || []) if (g.current >= g.target) {
    const stat = categories[g.category]?.stat || 'Discipline';
    s[stat] = (s[stat] || 0) + GOAL_POINTS;
  }
  return s;
}
export function characterStats(base, state, categories) {
  const out = {...base}, add = o => { for (const [k, v] of Object.entries(o)) out[k] = (out[k] || 0) + v; };
  add(skillStats(state)); add(goalStats(state, categories));
  return out;
}
export function summary(state) {
  let levels = 0, total = 0, mastered = 0;
  for (const t of trees) { const l = levelOf(state, t.id); levels += l; total += t.levels.length; if (l >= t.levels.length) mastered++; }
  return {levels, total, mastered, trees: trees.length};
}



// Numeric goals are read from the existing progression, never from translated names.
export function workoutGoal(l){
 const match=l.goal.match(/(\d+)\s*×\s*(\d+)(?:[–-]\d+)?(\s*s\b)?/);
 const sets=match?Number(match[1]):1,unit=(match?.[3]||!match&&/\d+(?:[–-]\d+)?\s*s\b/.test(l.goal))?'sek':'reps';
 let amount=match?Number(match[2]):Number(l.goal.match(/\d+/)?.[0]||1);
 const later=l.goal.match(/sedan\s+(\d+)/);if(later)amount=Math.max(amount,Number(later[1]));
 return {sets,amount,unit};
}
const families={push:'push',dip:'push',hspu:'push',planche:'push',pull:'pull','muscle-up':'pull','front-lever':'pull','back-lever':'pull',legs:'legs',ankles:'legs'};
export const workoutCatalog=trees.flatMap(t=>t.levels.map(l=>{const g=workoutGoal(l);return {id:`sk-${t.id}-${l.n}`,name:l.name,muscle:t.branch==='mobility'?'Rörlighet':'Calisthenics',equipment:['pull','dip','muscle-up','front-lever','back-lever','flag'].includes(t.id)?'Räcke':'Kroppsvikt',family:families[t.id]||'core',pose:'skill',unit:g.unit,thresholds:[1,2,3,4,5,6].map(n=>g.amount*n),cue:l.cues.join(' ')+' Mål: '+l.goal+'. Logga den svagare sidan efter båda sidor och följ målets tempo.',skillTree:t.id,skillLevel:l.n,skillAnim:l.anim,skillSets:g.sets,skillAmount:g.amount};}));
export const workoutById=Object.fromEntries(workoutCatalog.map(e=>[e.id,e]));
// Mobility levels added after the first skill catalog. Saving them needs database update 020.
export const mobilityUpdateIds=new Set(['sk-pike-4','sk-straddle-3','sk-straddle-4','sk-straddle-5','sk-straddle-6','sk-ankles-3',...[1,2,3,4,5,6].map(n=>'sk-hips-'+n)]);
// Beginner straddle steps. Saving them needs database update 021.
export const straddleBaseIds=new Set([1,2,3,4,5].map(n=>'sk-straddle-base-'+n));
// Database version (training_expansion_ready) a skill workout needs before it can be saved.
export const workoutVersion=id=>straddleBaseIds.has(id)?21:mobilityUpdateIds.has(id)?20:0;
const legacyStrength={pushup:'push-up',pullup:'pull-up',dip:'dip',plank:'plank',hang:'dead-hang',diamond:'diamond-push-up'};
const legacyTraining={'incline-push':'incline-push-up','push-up':'push-up','close-push':'diamond-push-up','pike-push':'pike-push-up','squat':'squat','split-squat':'split-squat','plank':'plank','side-plank':'side-plank','dead-hang':'dead-hang','pull-up':'pull-up','hollow-hold':'hollow'};
const cache=new WeakMap();
export function workoutLevels(state){
 const strength=state.strength?.sessions||[],training=state.training?.sessions||[],baseline=trees.map(t=>state.skills?.[t.id]?.level||0).join(','),saved=cache.get(state);
 if(saved&&saved.strength===strength&&saved.training===training&&saved.sn===strength.length&&saved.tn===training.length&&saved.baseline===baseline)return saved.levels;
 const levels=Object.fromEntries(trees.map(t=>[t.id,Math.max(0,Math.min(t.levels.length,Number(state.skills?.[t.id]?.level)||0))]));
 const events=[...strength.map(w=>({w,kind:'strength'})),...training.map(w=>({w,kind:'training'}))].filter(({w})=>w.finishedAt&&w.date>=(state.expedition?.start||'0000-00-00')).sort((a,b)=>a.w.date.localeCompare(b.w.date)||a.w.finishedAt-b.w.finishedAt);
 const meets=reqs=>(reqs||[]).every(([id,n])=>levels[id]>=n);
 for(const {w,kind} of events){
  const performed=(w.exercises||[]).map(e=>{const meta=workoutById[e.id];return {anim:meta?.skillAnim||(kind==='strength'?legacyStrength[e.id]:legacyTraining[e.id]),unit:meta?.unit||(['plank','hang','dead-hang','side-plank','hollow-hold'].includes(e.id)?'sek':'reps'),values:kind==='strength'?(e.sets||[]).filter(v=>v.done&&(!meta||v.quality===true)).map(v=>v.reps):(e.done||[])};});
  let changed=true;while(changed){changed=false;for(const t of trees){const l=t.levels[levels[t.id]];if(!l||!meets(t.requires)||!meets(l.requires))continue;const g=workoutGoal(l);if(performed.some(e=>e.anim===l.anim&&e.unit===g.unit&&e.values.filter(n=>Number.isFinite(n)&&n>=g.amount).length>=g.sets)){levels[t.id]++;changed=true;}}}
 }
 cache.set(state,{strength,training,sn:strength.length,tn:training.length,baseline,levels});return levels;
}
export function canTrain(state,tree,n){const t=treeById[tree],l=t?.levels[n-1];return !!l&&n<=levelOf(state,tree)+1&&!missing(state,t.requires).length&&!missing(state,l.requires).length;}

export const workoutVariant=id=>workoutById[id]?.skillAnim||legacyStrength[id]||null;
