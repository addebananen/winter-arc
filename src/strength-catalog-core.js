// Abs (Mage) and mobility (Rörlighet) exercises for the Strength Hub, added with migration 014.
// Names are written in Swedish like the base lifts; English names live in src/i18n-en.js.
// Abs exercises use the 'core' rank family. Mobility uses 'mobility', which never affects the overall rank.
// Thresholds are game milestones for the exercise badge (reps or seconds), not population norms.
const lift = (id, name, muscle, equipment, family, pose, thresholds, cue, unit = 'reps') => ({id, name, muscle, equipment, family, pose, thresholds, cue, unit});

export const coreLifts = [
  lift('situp', 'Situps', 'Mage', 'Kroppsvikt', 'core', 'situp', [5, 15, 25, 40, 60, 80], 'Ligg på rygg med böjda knän och fötterna i golvet. Rulla upp med bålen tills du sitter och sänk kontrollerat. Dra inte i nacken.'),
  lift('crunch', 'Crunches', 'Mage', 'Kroppsvikt', 'core', 'crunch', [10, 20, 35, 50, 75, 100], 'Ligg på rygg med böjda knän. Lyft skulderbladen från golvet genom att spänna magen, och sänk lugnt. Ländryggen stannar i golvet.'),
  lift('reverse-crunch', 'Omvända crunches', 'Mage', 'Kroppsvikt', 'core', 'reverse-crunch', [5, 10, 15, 25, 35, 50], 'Ligg på rygg med böjda knän i luften. Rulla upp bäckenet mot bröstet med magen, utan att gunga, och sänk långsamt.'),
  lift('bicycle-crunch', 'Cykelcrunch', 'Mage', 'Kroppsvikt', 'core', 'crunch', [10, 20, 30, 45, 60, 80], 'För motsatt armbåge mot knät medan andra benet sträcks. Byt sida lugnt. Logga totala repetitioner.'),
  lift('v-up', 'V-ups', 'Mage', 'Kroppsvikt', 'core', 'v-up', [3, 8, 12, 18, 25, 35], 'Ligg utsträckt och lyft raka ben och överkropp samtidigt så att händerna når mot tårna. Sänk kontrollerat utan att släppa spänningen.'),
  lift('russian-twist', 'Russian twist', 'Mage', 'Kroppsvikt', 'core', 'twist', [10, 20, 30, 40, 60, 80], 'Sitt lutad bakåt med rak rygg och vrid överkroppen från sida till sida. Fötterna kan vara i golvet. Logga totala repetitioner.'),
  lift('leg-raise', 'Benlyft liggande', 'Mage', 'Kroppsvikt', 'core', 'leg-raise', [5, 10, 15, 20, 30, 40], 'Ligg på rygg med händerna längs sidorna. Lyft raka ben till lodrätt och sänk långsamt utan att ländryggen släpper golvet.'),
  lift('captains-chair', "Benlyft i captain's chair", 'Mage', 'Maskin', 'core', 'captains-chair', [5, 10, 15, 20, 25, 30], 'Stöd underarmarna på dynorna med ryggen mot ryggstödet. Lyft knäna eller raka ben mot bröstet utan att svinga, och sänk kontrollerat.'),
  lift('hanging-knee-raise', 'Hängande knälyft', 'Mage', 'Räcke', 'core', 'hanging-knee', [3, 8, 12, 18, 25, 30], 'Häng med aktiva skuldror. Dra knäna mot bröstet med magen och sänk lugnt utan att gunga.'),
  lift('hanging-leg-raise', 'Hängande benlyft', 'Mage', 'Räcke', 'core', 'hanging-raise', [1, 3, 6, 10, 15, 20], 'Häng med aktiva skuldror och lyft raka ben till minst vågrätt. Sänk kontrollerat och undvik sving.'),
  lift('ab-wheel', 'Ab wheel-utrullning', 'Mage', 'Kroppsvikt', 'core', 'ab-wheel', [1, 3, 6, 10, 15, 20], 'Börja på knä med hjulet under axlarna. Rulla fram så långt du kan behålla en rak rygg och rulla tillbaka med magen.'),
  lift('cable-crunch', 'Kabelcrunch', 'Mage', 'Kabel', 'core', 'cable-crunch', [.2, .35, .5, .65, .8, 1], 'Knästå framför kabeln med repet vid huvudet. Rulla ner med magen mot låren utan att dra med armarna. Jämför på samma maskin.', 'kg'),

  lift('hip-flexor-stretch', 'Höftböjarstretch', 'Rörlighet', 'Matta', 'mobility', 'kneel-lunge', [20, 30, 45, 60, 90, 120], 'Knästå i utfall, spänn sätet och för höften lätt framåt tills det känns på framsidan av bakre höften. Logga tid per sida.', 'sek'),
  lift('couch-stretch', 'Couch stretch', 'Rörlighet', 'Matta', 'mobility', 'kneel-lunge', [20, 30, 45, 60, 90, 120], 'Bakre knät mot golvet och foten mot en vägg eller soffa. Res överkroppen och spänn sätet. Gå bara så långt det känns bekvämt. Logga tid per sida.', 'sek'),
  lift('pigeon', 'Duvan', 'Rörlighet', 'Matta', 'mobility', 'pigeon', [20, 30, 45, 60, 90, 120], 'Främre benet vikt framför dig och bakre benet rakt bakåt. Håll höften jämn och andas lugnt. Logga tid per sida.', 'sek'),
  lift('worlds-greatest', "World's greatest stretch", 'Rörlighet', 'Matta', 'mobility', 'reach-lunge', [3, 5, 8, 10, 12, 15], 'Ta ett långt utfall, sätt handen i golvet och vrid upp andra armen mot taket. Byt sida. Logga repetitioner per sida.'),
  lift('ninety-ninety', '90/90-höftrotation', 'Rörlighet', 'Matta', 'mobility', 'ninety', [4, 8, 12, 16, 20, 24], 'Sitt med båda knäna böjda i 90 grader åt samma håll. Rotera knäna till andra sidan med rak överkropp. Logga totala repetitioner.'),
  lift('deep-squat-hold', 'Djup knäböj, stillastående', 'Rörlighet', 'Kroppsvikt', 'mobility', 'deep-squat', [15, 30, 45, 60, 90, 120], 'Sjunk ner i en djup knäböj med hälarna i golvet och bröstet upp. Håll i något framför dig om det behövs.', 'sek'),
  lift('childs-pose', 'Barnets position', 'Rörlighet', 'Matta', 'mobility', 'child', [20, 30, 45, 60, 90, 120], 'Sitt på hälarna, fäll fram och sträck armarna framåt. Låt ryggen och axlarna slappna av och andas lugnt.', 'sek'),
  lift('cobra', 'Kobran', 'Rörlighet', 'Matta', 'mobility', 'cobra', [15, 30, 45, 60, 90, 120], 'Ligg på mage och res överkroppen på händerna med höften kvar i golvet. Håll axlarna låga och gå bara till en bekväm höjd.', 'sek'),
  lift('open-book', 'Öppen bok, bröstrygg', 'Rörlighet', 'Matta', 'mobility', 'open-book', [4, 6, 8, 10, 12, 15], 'Ligg på sidan med böjda knän och armarna framåt. Öppna översta armen bakåt och följ med blicken. Logga repetitioner per sida.'),
  lift('hamstring-stretch', 'Baksida lår-stretch', 'Rörlighet', 'Matta', 'mobility', 'seated-fold', [20, 30, 45, 60, 90, 120], 'Sitt med raka ben och fäll framåt från höften med lång rygg. Sträck bara så långt det känns bekvämt.', 'sek'),
  lift('butterfly', 'Fjärilsstretch', 'Rörlighet', 'Matta', 'mobility', 'butterfly', [20, 30, 45, 60, 90, 120], 'Sitt med fotsulorna mot varandra och låt knäna sjunka utåt. Fäll lätt framåt med rak rygg.', 'sek'),
  lift('band-dislocate', 'Axelgenomförning med band', 'Rörlighet', 'Gummiband', 'mobility', 'dislocate', [5, 8, 10, 12, 15, 20], 'Håll ett gummiband brett med raka armar och för det över huvudet och bakåt i en jämn båge. Bredda greppet om axlarna tar emot.'),
  lift('knee-to-wall', 'Fotledsrörlighet mot vägg', 'Rörlighet', 'Kroppsvikt', 'mobility', 'kneel-lunge', [5, 8, 10, 12, 15, 20], 'Stå med foten en bit från väggen och för knät mot väggen med hälen kvar i golvet. Logga repetitioner per sida.'),
];

export const coreLiftIds = new Set(coreLifts.map(e => e.id));
