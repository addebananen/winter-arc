// More leg exercises in machines for the Strength Hub, added with migration 034.
// Names are written in Swedish like the core catalog; English names live in src/i18n-en.js.
// Every one counts as a leg exercise (muscle 'Ben', family 'legs'). Thresholds are game milestones for the
// exercise badge as a share of body weight, not population norms; machines differ, so compare on the same one.
// supabase/034_leg_machines.sql holds the same list (tests/leg-machines.test.mjs checks that).
const lift = (id, name, pose, thresholds, cue) => ({id, name, muscle: 'Ben', equipment: 'Maskin', family: 'legs', pose, thresholds, cue, unit: 'kg', aliases: aliases[id]});

// Extra search words, so 'vader', 'säte' or English gym names find the right exercise.
const aliases = {
  'lying-leg-curl': 'Lying Leg Curl hamstrings baksida lår', 'hip-thrust-machine': 'Hip Thrust Machine glutes säte rumpa',
  'hip-abduction': 'Hip Abduction Machine glutes säte utsida lår', 'hip-adduction': 'Hip Adduction Machine adduktorer insida lår',
  'glute-kickback': 'Glute Kickback Machine säte rumpa', 'standing-calf': 'Standing Calf Raise vader calves',
  'seated-calf': 'Seated Calf Raise vader calves', 'leg-press-calf': 'Leg Press Calf Raise vader calves',
  'single-leg-press': 'Single-Leg Leg Press', 'belt-squat': 'Belt Squat knäböj', 'smith-split-squat': 'Smith Machine Split Squat utfall',
};

export const legMachineLifts = [
  lift('lying-leg-curl', 'Liggande lårcurl', 'lying-leg-curl', [.15, .3, .45, .6, .75, .9], 'Ligg på mage med knäna precis nedanför dynan och rullen strax ovanför hälarna. Böj benen lugnt och håll höften mot dynan.'),
  lift('hip-thrust-machine', 'Höftlyft i maskin', 'hip-thrust', [.5, .8, 1.1, 1.5, 1.9, 2.3], 'Övre delen av ryggen mot dynan och fötterna i golvet. Pressa upp höften med sätet tills kroppen är rak från axlar till knän, utan att svanka.'),
  lift('hip-abduction', 'Höftabduktion i maskin', 'hip-abduction', [.2, .35, .5, .65, .8, 1], 'Sitt med ryggen mot stödet och dynorna mot utsidan av knäna. För isär benen med sätet och låt dem gå tillbaka långsamt.'),
  lift('hip-adduction', 'Höftadduktion i maskin', 'hip-adduction', [.2, .35, .5, .65, .8, 1], 'Sitt med ryggen mot stödet och dynorna mot insidan av knäna. Börja i ett bekvämt omfång och pressa ihop benen kontrollerat.'),
  lift('glute-kickback', 'Glute kickback i maskin', 'glute-kickback', [.1, .2, .3, .45, .6, .75], 'Stöd överkroppen mot dynan och spänn bålen. Pressa benet bakåt med sätet utan att svanka. Logga vikten för ett ben.'),
  lift('standing-calf', 'Stående vadpress i maskin', 'calf-raise', [.4, .7, 1, 1.3, 1.6, 2], 'Främre delen av foten på kanten och raka knän. Sänk hälarna långsamt, pausa och res dig så högt du kan.'),
  lift('seated-calf', 'Sittande vadpress', 'seated-calf', [.2, .4, .6, .8, 1, 1.2], 'Sitt med dynan över låren och främre delen av foten på plattan. Sänk hälarna långsamt och pressa upp så högt du kan.'),
  lift('leg-press-calf', 'Vadpress i benpress', 'leg-press-calf', [.5, 1, 1.5, 2, 2.5, 3], 'Raka men inte låsta knän och främre delen av foten mot plattans nederkant. Pressa med vaderna och håll säkerhetsspärrarna nära.'),
  lift('single-leg-press', 'Benpress med ett ben', 'leg-press', [.25, .5, .75, 1, 1.25, 1.5], 'Ett ben mitt på plattan och bäckenet mot dynan. Sänk kontrollerat och pressa utan att knät faller inåt. Logga vikten per ben.'),
  lift('belt-squat', 'Belt squat', 'squat', [.4, .7, 1, 1.3, 1.6, 2], 'Bältet runt höften och händerna på handtagen. Sätt dig ned med rak överkropp och res dig genom hela foten. Ryggen slipper axellasten.'),
  lift('smith-split-squat', 'Utfallsböj i smithmaskin', 'lunge', [.2, .4, .6, .8, 1, 1.2], 'Stången på övre ryggen och ett långt steg isär. Sänk bakre knät mot golvet och pressa upp med främre benet. Logga per ben.'),
];


export const legMachineIds = new Set(legMachineLifts.map(e => e.id));
