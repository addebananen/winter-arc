export const SEASON_START='2026-11-09';
export const characters=[
 {id:'ranger',name:'Aurora Ranger',role:'Utforskaren',motto:'Ett nytt steg, varje dag.',description:'Nyfiken, jordnära och som starkast när livet är i balans.',color:'#b9ded0',symbol:'compass'},
 {id:'striker',name:'Frost Striker',role:'Byggaren',motto:'Styrka byggs. Den bevisas inte.',description:'Lugn kraft. Små, kontrollerade repetitioner och ett långsiktigt fokus.',color:'#b8c9ec',symbol:'dumbbell'},
 {id:'monk',name:'Ember Monk',role:'Den förankrade',motto:'Hitta lugnet. Behåll riktningen.',description:'Närvaro, tro och disciplin. En stilla stund kan vara dagens starkaste handling.',color:'#e4c494',symbol:'sun'},
 {id:'scholar',name:'Lunar Scholar',role:'Tänkaren',motto:'Var nyfiken en stund till.',description:'Läsning, vetenskap och stora frågor. Samla insikter, inte bara poäng.',color:'#cbbce8',symbol:'book'}
];
export const ranks=[
 {name:'Rookie',xp:0,color:'#a3b6ae',icon:'flag'},
 {name:'Iron',xp:800,color:'#a8b7c2',icon:'shield'},
 {name:'Bronze',xp:2400,color:'#d4a47e',icon:'shield'},
 {name:'Silver',xp:6000,color:'#d4dfeb',icon:'gem'},
 {name:'Gold',xp:12000,color:'#e5c786',icon:'gem'},
 {name:'Platinum',xp:22000,color:'#9fd9cf',icon:'trophy'},
 {name:'Diamond',xp:36000,color:'#b7c7f1',icon:'trophy'}
];
export function rankInfo(xp){let index=0;for(let i=0;i<ranks.length;i++)if(xp>=ranks[i].xp)index=i;const rank=ranks[index],next=ranks[index+1];return {...rank,index,next,progress:next?Math.max(0,Math.min(1,(xp-rank.xp)/(next.xp-rank.xp))):1};}
export const extraHabits=[
 ['Lugn andning','health',5,'min',20,'Efter att jag sätter mig bekvämt andas jag lugnt en stund.'],
 ['En minuts andningspaus','health',60,'sek',10,'Efter att jag stängt en uppgift slappnar jag av och andas.'],
 ['Kroppsskanning','health',5,'min',20,'Före läggdags lägger jag märke till hur kroppen känns.'],
 ['Dagsljus på morgonen','health',10,'min',20,'Efter frukosten tar jag en stund utomhus.'],
 ['Skärmfri kväll','health',20,'min',25,'När kvällsteet är klart lägger jag undan skärmen.'],
 ['Förbered morgondagen','discipline',5,'min',20,'Efter middagen gör jag nästa morgon lite enklare.'],
 ['Två minuters start','discipline',2,'min',15,'När något känns stort gör jag bara de första två minuterna.'],
 ['Min viktigaste uppgift','discipline',1,'uppgift',30,'Efter frukosten väljer jag det som betyder mest idag.'],
 ['Ordning i rummet','discipline',10,'min',20,'Efter arbetsdagen återställer jag min plats.'],
 ['Lär utan distraktion','wisdom',20,'min',30,'Efter att jag lagt undan mobilen studerar jag en sak i taget.'],
 ['Aktiv återkallning','wisdom',5,'min',25,'Efter läsningen stänger jag boken och skriver vad jag minns.'],
 ['Förklara en idé enkelt','wisdom',1,'idé',25,'Efter att jag lärt mig något förklarar jag det med egna ord.'],
 ['Läs vetenskap','wisdom',10,'min',25,'Efter lunchen läser jag en trovärdig vetenskaplig källa.'],
 ['Lär dig ett nytt ord','wisdom',3,'ord',15,'Efter frukosten skriver jag nya ord och använder dem i meningar.'],
 ['Huvudräkning','wisdom',5,'min',20,'Efter min studiestund löser jag några uppgifter utan miniräknare.'],
 ['Skriv en boksammanfattning','wisdom',5,'meningar',25,'Efter dagens läsning skriver jag de viktigaste idéerna.'],
 ['Bibel: ett stycke, en tanke','faith',1,'stycke',25,'Efter frukosten läser jag ett stycke och skriver en tanke.'],
 ['Stillhet utan skärm','faith',5,'min',20,'Efter dagens sista uppgift ger jag mig själv en lugn stund.'],
 ['Bön för någon annan','faith',1,'stund',20,'Efter min egen reflektion tänker jag på någon annan.'],
 ['En vers att reflektera över','faith',1,'vers',20,'Efter läsningen väljer jag en vers att bära med mig.'],
 ['Ett ärligt samtal','social',1,'samtal',25,'När vi har en stund tillsammans lyssnar jag utan min mobil.'],
 ['Säg ett konkret tack','social',1,'tack',20,'När jag uppskattar något berättar jag exakt vad det betydde.'],
 ['Uppmuntra ditt squad','social',1,'person',15,'Efter min egen check-in uppmuntrar jag någon annan.'],
 ['Gör något hjälpsamt','social',1,'handling',20,'När jag ser ett litet behov erbjuder jag min hjälp.'],
 ['Armhävningspraktik','strength',10,'reps',25,'Efter uppvärmningen gör jag en variant jag kan kontrollera.'],
 ['Knäböjspraktik','strength',15,'reps',25,'Efter min promenad övar jag lugna knäböj i bekvämt djup.'],
 ['Hängpraktik','strength',20,'sek',20,'Efter uppvärmningen använder jag ett stabilt räcke för ett kort häng.'],
 ['Bålstabilitet','strength',30,'sek',25,'Efter träningen gör jag en anpassad bålövning.'],
 ['Calisthenics-pass','strength',1,'pass',40,'När träningskläderna är på börjar jag med den enklaste rörelsen.'],
 ['Lugn kondition','strength',15,'min',30,'Efter jobbet rör jag mig i ett tempo som passar dagsformen.'],
 ['Rörliga axlar','mobility',5,'min',20,'Efter arbetsdagen gör jag lugna axelrörelser utan att pressa.'],
 ['Höftmobilitet','mobility',5,'min',20,'Efter promenaden gör jag mjuka rörelser för höfterna.'],
 ['Fotledsmobilitet','mobility',2,'min',15,'Efter tandborstningen ger jag fotlederna lite rörelse.'],
 ['Mjuk morgonrörlighet','mobility',5,'min',20,'Efter att jag klivit upp rör jag kroppen lugnt.'],
 ['Bröstryggsrotation','mobility',6,'reps',15,'Efter en sittande stund roterar jag mjukt åt båda hållen.'],
 ['Rörlighetspaus','mobility',2,'min',15,'Efter ett fokusblock byter jag position och rör mig en stund.'],
 ['Handskriven reflektion','wisdom',5,'min',20,'Efter dagen skriver jag utan att redigera mig själv.'],
 ['Planera veckans träning','discipline',1,'plan',20,'När veckan börjar väljer jag tid för rörelse och återhämtning.'],
 ['Utomhus utan hörlurar','health',10,'min',20,'Efter lunchen lägger jag märke till omgivningen en stund.'],
 ['Vila med avsikt','health',10,'min',20,'Efter en krävande stund återhämtar jag mig utan att scrolla.'],
 ['Öva en kreativ färdighet','wisdom',15,'min',25,'Efter att jag förberett min plats skapar jag något litet.'],
 ['Lyssna för att förstå','social',1,'stund',20,'I nästa samtal ställer jag en öppen följdfråga.']
];

// Reps are practice, not a test of maximum capacity. Every movement is adjustable.
export const exercises=[
 {id:'wall-push',name:'Armhävning mot vägg',family:'push',stat:'Strength',unit:'reps',reference:8,xp:6,equipment:'Vägg',difficulty:1,cue:'Händer mot väggen. Håll kroppen stabil och böj armarna lugnt.'},
 {id:'incline-push',name:'Lutande armhävning',family:'push',stat:'Strength',unit:'reps',reference:8,xp:8,equipment:'Stabil upphöjd yta',difficulty:2,cue:'Välj en stadig yta. Sänk bröstet kontrollerat och pressa tillbaka.'},
 {id:'knee-push',name:'Armhävning på knä',family:'push',stat:'Strength',unit:'reps',reference:8,xp:8,equipment:'Matta',difficulty:2,cue:'Stöd på knä och händer. Håll en rak linje från knä till huvud.'},
 {id:'push-up',name:'Armhävning',family:'push',stat:'Strength',unit:'reps',reference:8,xp:10,equipment:'Ingen',difficulty:3,cue:'Spänn bålen, sänk kontrollerat och välj ett djup du kan behålla tekniken i.'},
 {id:'close-push',name:'Smal armhävning',family:'push',stat:'Strength',unit:'reps',reference:6,xp:12,equipment:'Ingen',difficulty:4,cue:'Händer lite närmare varandra. Behåll ett bekvämt läge för handleder och axlar.'},
 {id:'pike-push',name:'Pike-armhävning',family:'push',stat:'Strength',unit:'reps',reference:6,xp:12,equipment:'Ingen',difficulty:4,cue:'Höften upp, händer stadigt i golvet. Använd ett kort rörelseomfång du kontrollerar.'},
 {id:'chair-squat',name:'Sätt dig och res dig',family:'legs',stat:'Strength',unit:'reps',reference:8,xp:6,equipment:'Stabil stol',difficulty:1,cue:'Sätt dig lugnt på en stadig stol och res dig med kontroll. Använd stöd om du behöver.'},
 {id:'squat',name:'Knäböj',family:'legs',stat:'Strength',unit:'reps',reference:10,xp:8,equipment:'Ingen',difficulty:2,cue:'Fötter stadigt i golvet. Böj i höft och knä till ett bekvämt djup.'},
 {id:'split-squat',name:'Split squat',family:'legs',stat:'Strength',unit:'reps',reference:6,xp:10,equipment:'Stöd vid behov',difficulty:3,cue:'Stå i en stadig saxposition och sänk kroppen lugnt. Reps anges per sida.'},
 {id:'reverse-lunge',name:'Bakåtutfall',family:'legs',stat:'Strength',unit:'reps',reference:6,xp:10,equipment:'Stöd vid behov',difficulty:3,cue:'Ta ett kontrollerat steg bakåt och återgå. Reps anges per sida.'},
 {id:'calf-raise',name:'Tåhävning',family:'legs',stat:'Strength',unit:'reps',reference:12,xp:6,equipment:'Stöd vid behov',difficulty:1,cue:'Res dig långsamt på tå och sänk hälarna igen. Håll i ett stöd för balans.'},
 {id:'glute-bridge',name:'Höftlyft',family:'legs',stat:'Strength',unit:'reps',reference:10,xp:7,equipment:'Matta',difficulty:1,cue:'Ligg med böjda knän. Lyft höfterna utan att översträcka ryggen.'},
 {id:'dead-bug',name:'Dead bug',family:'core',stat:'Strength',unit:'reps',reference:6,xp:7,equipment:'Matta',difficulty:1,cue:'Ligg på rygg och sträck motsatt arm och ben lugnt. Reps anges per sida.'},
 {id:'bird-dog',name:'Bird dog',family:'core',stat:'Strength',unit:'reps',reference:6,xp:7,equipment:'Matta',difficulty:1,cue:'Stå på alla fyra. Sträck motsatt arm och ben och behåll balansen.'},
 {id:'plank',name:'Planka',family:'core',stat:'Strength',unit:'sek',reference:20,xp:8,equipment:'Matta',difficulty:2,cue:'Underarmar i golvet. Håll kroppen stabil och andas lugnt. Stöd på knä är ett alternativ.'},
 {id:'side-plank',name:'Sidoplanka',family:'core',stat:'Strength',unit:'sek',reference:15,xp:9,equipment:'Matta',difficulty:3,cue:'Stöd på underarm och knä eller fötter. Håll korta, kontrollerade omgångar per sida.'},
 {id:'hollow-hold',name:'Hollow hold',family:'core',stat:'Strength',unit:'sek',reference:15,xp:10,equipment:'Matta',difficulty:3,cue:'Ligg på rygg, spänn bålen och börja med böjda knän. Släpp om tekniken försvinner.'},
 {id:'dead-hang',name:'Kontrollerat häng',family:'pull',stat:'Strength',unit:'sek',reference:15,xp:8,equipment:'Fast förankrad stång',difficulty:2,cue:'Använd en säker, fast stång. Ha fötterna nära golv eller stöd och välj en kort tid.'},
 {id:'assisted-pull',name:'Assisterad pull-up',family:'pull',stat:'Strength',unit:'reps',reference:5,xp:10,equipment:'Stång och säkert stöd',difficulty:3,cue:'Använd ett säkert stöd eller passande assistans och dra upp med kontroll.'},
 {id:'pull-up',name:'Pull-up',family:'pull',stat:'Strength',unit:'reps',reference:5,xp:14,equipment:'Fast förankrad stång',difficulty:4,cue:'Använd en säker stång, undvik sving och välj kontrollerade repetitioner.'},
 {id:'row',name:'Kroppsviktsrodd',family:'pull',stat:'Strength',unit:'reps',reference:8,xp:10,equipment:'Säkert förankrat räcke eller ringar',difficulty:3,cue:'Välj utrustning som är avsedd för belastningen. Justera lutningen efter din nivå.'},
 {id:'thoracic',name:'Bröstryggsrotation',family:'mobility',stat:'Flexibility',unit:'reps',reference:6,xp:6,equipment:'Matta',difficulty:1,cue:'Rotera överkroppen mjukt åt båda sidor inom ett bekvämt rörelseomfång.'},
 {id:'cat-cow',name:'Katt och ko',family:'mobility',stat:'Flexibility',unit:'reps',reference:6,xp:5,equipment:'Matta',difficulty:1,cue:'På alla fyra: runda och förläng ryggen lugnt utan att pressa ytterlägen.'},
 {id:'ankle-rock',name:'Fotledsgungning',family:'mobility',stat:'Flexibility',unit:'reps',reference:8,xp:5,equipment:'Stöd vid behov',difficulty:1,cue:'För knät mjukt fram över foten med hälen kvar i golvet. Reps anges per sida.'},
 {id:'hip-hinge',name:'Höftfällning',family:'mobility',stat:'Flexibility',unit:'reps',reference:8,xp:6,equipment:'Ingen',difficulty:1,cue:'För höfterna bakåt med mjuka knän. Gå bara så långt du kan kontrollera rörelsen.'},
 {id:'shoulder-circle',name:'Axelcirklar',family:'mobility',stat:'Flexibility',unit:'reps',reference:8,xp:5,equipment:'Ingen',difficulty:1,cue:'Gör långsamma, bekväma cirklar med axlarna. Håll resten av kroppen avspänd.'},
 {id:'breathing',name:'Lugn andning',family:'breath',stat:'Discipline',unit:'sek',reference:300,xp:20,equipment:'En bekväm plats',difficulty:1,cue:'Andas lugnt och regelbundet, utan att forcera. Följ din egen bekväma rytm.'},
 {id:'walk-reset',name:'En lugn rörelsepaus',family:'recovery',stat:'Discipline',unit:'sek',reference:120,xp:6,equipment:'Ingen',difficulty:1,cue:'Gå eller rör dig lugnt på ett sätt som passar din dagsform.'}
];
export const exerciseById=Object.fromEntries(exercises.map(e=>[e.id,e]));
export const programs=[
 {id:'first-step',name:'Börja där du är',tag:'NYBÖRJARE',minutes:8,kind:'strength',description:'En mjuk start med tre enkla kroppsviktsrörelser.',moves:[['wall-push',2,8],['chair-squat',2,8],['dead-bug',2,6]],rest:40},
 {id:'full-body',name:'Bodyweight foundations',tag:'CALISTHENICS',minutes:15,kind:'strength',description:'Press, ben och bål. Ett litet, komplett pass.',moves:[['push-up',2,6],['squat',2,10],['plank',2,20]],rest:60},
 {id:'pull-foundation',name:'Pull & control',tag:'STÅNG / RÄCKE',minutes:15,kind:'strength',description:'Kontrollerad dragstyrka. Säker, fast förankrad utrustning krävs.',moves:[['assisted-pull',2,5],['row',2,8],['dead-hang',2,15]],rest:75},
 {id:'core-control',name:'Stark från mitten',tag:'BÅL',minutes:10,kind:'strength',description:'Stabilitet med lugn andning och korta omgångar.',moves:[['dead-bug',2,6],['bird-dog',2,6],['side-plank',2,15]],rest:45},
 {id:'mobility',name:'Mer rörelsefrihet',tag:'FLEXIBILITY',minutes:7,kind:'mobility',description:'Lugn rörelse för rygg, höft och fotleder.',moves:[['cat-cow',1,6],['thoracic',1,6],['hip-hinge',1,8],['ankle-rock',1,8]],rest:20},
 {id:'strong-legs',name:'Stadigare steg',tag:'BEN',minutes:12,kind:'strength',description:'Bygg stabilitet i ett kontrollerat tempo.',moves:[['squat',2,10],['reverse-lunge',2,6],['glute-bridge',2,10],['calf-raise',2,12]],rest:60},
 {id:'reset-move',name:'Tillbaka med ett steg',tag:'COMEBACK',minutes:3,kind:'recovery',description:'En kort, anpassningsbar start. Ingen ökande bestraffning.',moves:[['wall-push',1,5],['chair-squat',1,5],['walk-reset',1,60]],rest:20},
 {id:'reset-mobility',name:'Starta mjukt igen',tag:'COMEBACK',minutes:4,kind:'recovery',description:'Välj rörlighet när kroppen behöver en lugnare väg tillbaka.',moves:[['shoulder-circle',1,6],['cat-cow',1,6],['breathing',1,60]],rest:15},
 {id:'reset-calm',name:'En lugn omstart',tag:'COMEBACK',minutes:2,kind:'recovery',description:'Sitt bekvämt och följ några lugna andetag.',moves:[['breathing',1,120]],rest:0}
];
export const challenges=[
 {id:'push-technique',stat:'Strength',name:'Kvalitet före antal',minutes:4,xp:30,icon:'dumbbell',prompt:'Välj en enkel armhävningsvariant. Gör 2 lugna omgångar med 5 repetitioner. Skriv vad som hjälpte dig behålla kontrollen.'},
 {id:'legs-balance',stat:'Strength',name:'Stadig grund',minutes:5,xp:30,icon:'dumbbell',prompt:'Gör 2 lugna omgångar med 8 anpassade knäböj. Ta stöd om du behöver och stanna i ett bekvämt djup.'},
 {id:'core-form',stat:'Strength',name:'Känn din bål',minutes:3,xp:25,icon:'shield',prompt:'Prova bird dog i korta, kontrollerade omgångar. Lägg märke till när du kan hålla balansen utan att hålla andan.'},
 {id:'mobility-break',stat:'Flexibility',name:'Bryt sittandet',minutes:3,xp:20,icon:'refresh',prompt:'Byt position och gör mjuka axelcirklar och höftfällningar. Välj rörelser som känns bekväma.'},
 {id:'mobility-explore',stat:'Flexibility',name:'Utforska ditt rörelseomfång',minutes:5,xp:25,icon:'compass',prompt:'Välj två rörelser från rörlighetspasset. Öva lugnt och notera hur det känns. Målet är kontroll, inte att pressa djupare.'},
 {id:'ankle-practice',stat:'Flexibility',name:'Från grunden',minutes:3,xp:20,icon:'mountain',prompt:'Öva mjuka fotledsgungningar med stöd. Jämför känslan mellan sidorna utan att tvinga fram samma rörelse.'},
 {id:'focus-sprint',stat:'Discipline',name:'En sak i taget',minutes:10,xp:30,icon:'bolt',prompt:'Välj en viktig uppgift, lägg undan mobilen och arbeta med bara den i tio minuter. Skriv vad du hann.'},
 {id:'meditation-notice',stat:'Discipline',name:'Lägg märke till, återvänd',minutes:5,xp:25,icon:'sun',prompt:'Sitt bekvämt. Lägg märke till andningen och återvänd vänligt när tankarna vandrar. Inga perfekta minuter krävs.'},
 {id:'make-easy',stat:'Discipline',name:'Gör morgondagen enkel',minutes:5,xp:20,icon:'list',prompt:'Förbered en sak som minskar tröskeln för en vana imorgon: en bok på kudden, kläder framme eller en undanlagd mobil.'},
 {id:'bible-context',stat:'Faith',name:'Läs med sammanhang',minutes:10,xp:30,icon:'book',prompt:'Läs ett kort bibelstycke och lite före och efter. Skriv vad sammanhanget hjälper dig förstå.'},
 {id:'faith-practice',stat:'Faith',name:'Från ord till handling',minutes:5,xp:25,icon:'sun',prompt:'Välj en tanke från dagens bibelläsning. Skriv en liten, konkret handling som kan uttrycka den idag.'},
 {id:'faith-questions',stat:'Faith',name:'En ärlig fråga',minutes:5,xp:25,icon:'book',prompt:'Läs en vers och skriv en fråga du faktiskt undrar över. Försök förstå innan du försöker formulera ett färdigt svar.'},
 {id:'book-recall',stat:'Wisdom',name:'Stäng boken. Vad minns du?',minutes:5,xp:25,icon:'book',prompt:'Läs några sidor, stäng boken och skriv tre idéer du minns. Kontrollera sedan vad du missade.'},
 {id:'feynman',stat:'Wisdom',name:'Förklara utan fackspråk',minutes:8,xp:30,icon:'book',prompt:'Välj ett begrepp du lär dig. Förklara det som för någon som aldrig hört talas om det. Markera luckorna i din förklaring.'},
 {id:'science-check',stat:'Wisdom',name:'Ett påstående under lupp',minutes:10,xp:35,icon:'compass',prompt:'Välj ett vetenskapligt påstående. Hitta ursprungskällan och skriv vad den visar, vad den inte visar och en osäkerhet.'},
 {id:'science-predict',stat:'Wisdom',name:'Gissa. Undersök. Uppdatera.',minutes:10,xp:30,icon:'bolt',prompt:'Skriv en förutsägelse om ett vardagligt fenomen. Läs en trovärdig förklaring och jämför den med din första tanke.'},
 {id:'mental-math',stat:'Wisdom',name:'Fem små problem',minutes:5,xp:20,icon:'bolt',prompt:'Välj fem huvudräkningsuppgifter på din nivå. Lös dem utan miniräknare och förklara en av metoderna.'},
 {id:'teach-squad',stat:'Social',name:'Dela något användbart',minutes:5,xp:25,icon:'users',prompt:'Förklara en lärdom för en vän och fråga hur personen ser på den. Dela bara det du själv vill dela.'},
 {id:'specific-thanks',stat:'Social',name:'Ett tack med innehåll',minutes:3,xp:20,icon:'heart',prompt:'Tacka någon för något konkret och berätta varför det betydde något för dig.'},
 {id:'listen-first',stat:'Social',name:'Nyfiken före snabb',minutes:5,xp:25,icon:'users',prompt:'Ställ en öppen fråga till en vän och lyssna färdigt. Följ upp med en fråga istället för att direkt ge råd.'}
];
export const statCategory={Strength:'strength',Flexibility:'mobility',Discipline:'discipline',Wisdom:'wisdom',Faith:'faith',Social:'social'};
export function ensureTraining(state){state.training??={sessions:[],plans:[],active:null};state.training.sessions??=[];state.training.plans??=[];state.privateTrackers??={};state.privateTrackers.nofap??={enabled:false,startedAt:null,resets:[],longestMs:0};state.profile.character??='ranger';state.profile.characterName??='';return state;}
export function sessionBreakdown(session){const out={training:0,breath:0,stats:{Strength:0,Flexibility:0,Discipline:0}};if(!session?.finishedAt)return out;for(const step of (session.exercises||[]).slice(0,6)){const e=exerciseById[step.id];if(!e)continue;for(const raw of (step.done||[]).slice(0,3)){const actual=Number(raw);if(!Number.isFinite(actual)||actual<=0)continue;const value=Math.min(actual,e.unit==='sek'?600:40);const points=Math.round(e.xp*Math.min(value/e.reference,1.5));if(e.id==='breathing')out.breath+=points;else out.training+=points;out.stats[e.stat]+=points;}}const total=out.training+out.breath;if(total>80){const factor=80/total;out.training=Math.floor(out.training*factor);out.breath=80-out.training;for(const k of Object.keys(out.stats))out.stats[k]=Math.round(out.stats[k]*factor);}return out;}
export const sessionXP=s=>{const p=sessionBreakdown(s);return p.training+p.breath;};
export function trainingDays(state){const days={},seen=new Set();for(const s of state.training?.sessions||[]){if(seen.has(s.id)||s.date<(state.expedition?.start||'0000-00-00'))continue;seen.add(s.id);const p=sessionBreakdown(s);days[s.date]??={training:0,breath:0,stats:{Strength:0,Flexibility:0,Discipline:0}};days[s.date].training+=p.training;days[s.date].breath+=p.breath;for(const k of Object.keys(p.stats))days[s.date].stats[k]+=p.stats[k];}return days;}
export function breathCredit(state,day){return Object.values(state.history?.[day]?.entries||{}).filter(e=>e.activityKey==='breathing'&&e.value>=e.target).reduce((n,e)=>n+e.xp,0);}
export function trainingXP(state,day){return Object.entries(trainingDays(state)).filter(([d])=>!day||d===day).reduce((n,[d,p])=>n+Math.min(120,p.training+Math.max(0,Math.min(20,p.breath)-breathCredit(state,d))),0);}
export function trainingStats(state){const stats={Strength:0,Flexibility:0,Discipline:0};for(const [day,p] of Object.entries(trainingDays(state))){const breath=Math.max(0,Math.min(20,p.breath)-breathCredit(state,day)),total=p.training+breath;if(!total)continue;const ratio=Math.min(1,120/total);stats.Strength+=Math.round(p.stats.Strength*ratio);stats.Flexibility+=Math.round(p.stats.Flexibility*ratio);stats.Discipline+=Math.round((Math.max(0,p.stats.Discipline-p.breath)+breath)*ratio);}return stats;}
export function mastery(state,id){let points=0,sets=0;const e=exerciseById[id];for(const s of state.training?.sessions||[])if(s.finishedAt&&s.date>=state.expedition.start)for(const x of s.exercises||[])if(x.id===id)for(const n of x.done||[])if(Number(n)>0){points+=Number(n)/(e?.unit==='sek'?5:1);sets++;}const level=Math.min(10,Math.floor(Math.sqrt(points/30))+1),base=30*(level-1)**2,next=30*level**2;return {level,points:Math.round(points),sets,progress:level===10?1:Math.min(1,(points-base)/(next-base)),next};}
export function activityDone(state,id,day){return (state.training?.sessions||[]).some(s=>s.date===day&&s.finishedAt&&s.exercises.some(e=>e.id===id&&e.done.some(n=>n>0)))||(id==='breathing'&&Object.values(state.history?.[day]?.entries||{}).some(e=>e.activityKey==='breathing'&&e.value>=e.target));}
export function startSession(state,programId,day,level=0,now=Date.now()){ensureTraining(state);if(state.training.active)throw Error('Avsluta eller spara det pågående passet först.');const p=[...programs,...state.training.plans].find(x=>x.id===programId);if(!p)throw Error('Passet kunde inte hittas.');if(new Set(p.moves.map(x=>x[0])).size!==p.moves.length)throw Error('Använd fler set istället för att lägga in samma övning flera gånger.');if(p.moves.some(([id])=>activityDone(state,id,day)))throw Error('En övning i passet är redan registrerad idag. Varje övning räknas en gång per dag. Välj ett annat pass.');const tier=Math.max(0,Math.min(2,Number(level)||0));state.training.active={id:crypto.randomUUID(),programId:p.id,title:p.name,kind:p.kind,date:day,level:tier,startedAt:now,finishedAt:null,restUntil:0,exercises:p.moves.map(([id,sets,target])=>({id,sets,target:Math.min(exerciseById[id]?.unit==='sek'?600:40,Math.round(target*[1,1.2,1.4][tier])),done:[]}))};return state.training.active;}
export function startBreathing(state,day,seconds=120,now=Date.now()){ensureTraining(state);if(activityDone(state,'breathing',day))throw Error('Andningsövningen är redan registrerad idag. Välkommen tillbaka imorgon.');if(state.training.active)throw Error('Avsluta det pågående passet först.');state.training.active={id:crypto.randomUUID(),programId:'breathe',title:'En lugn stund',kind:'breathing',date:day,level:0,startedAt:now,finishedAt:null,duration:Math.max(60,Math.min(300,seconds))*1000,pausedAt:null,pausedMs:0,exercises:[{id:'breathing',sets:1,target:Math.max(60,Math.min(300,seconds)),done:[]}]};return state.training.active;}
export function breathingElapsed(active,now=Date.now()){return Math.max(0,(active.pausedAt||now)-active.startedAt-(active.pausedMs||0));}
export function toggleBreathingPause(state,now=Date.now()){const a=state.training?.active;if(!a||a.kind!=='breathing')return;if(a.pausedAt){a.pausedMs=(a.pausedMs||0)+(now-a.pausedAt);a.pausedAt=null;}else a.pausedAt=now;}
export function logSet(state,index,actual,now=Date.now()){const a=state.training?.active,step=a?.exercises[index],e=exerciseById[step?.id];if(!e||!Number.isFinite(actual)||actual<0||actual>(e.unit==='sek'?600:40)||step.done.length>=step.sets)throw Error('Kontrollera repetitionerna eller tiden.');step.done.push(actual);a.restUntil=now+((programs.find(p=>p.id===a.programId)?.rest)||30)*1000;}
export function creditLinkedHabit(state,activity,seconds,day){if(day<state.expedition.start)return;for(const h of state.habits)if(!h.archived&&h.activityKey===activity&&h.start<=day&&h.days.includes(new Date(day+'T12:00:00Z').getUTCDay())&&seconds>=h.target*(h.unit==='min'?60:1)){state.history[day]??={required:state.habits.filter(h=>!h.archived&&h.start<=day&&h.days.includes(new Date(day+'T12:00:00Z').getUTCDay())).map(h=>h.id),entries:{}};state.history[day].entries[h.id]={value:h.target,target:h.target,xp:h.xp,category:h.category,name:h.name,activityKey:h.activityKey};}}
export function finishSession(state,now=Date.now()){ensureTraining(state);const a=state.training.active;if(!a)throw Error('Inget pass pågår.');if(a.exercises.some(e=>e.done.some(n=>n>0)&&activityDone(state,e.id,a.date)))throw Error('En övning är redan registrerad idag. Hämta senaste resan.');if(a.kind==='breathing'){const seconds=Math.floor(Math.min(a.duration,breathingElapsed(a,now))/1000);if(seconds<60)throw Error('Minst en lugn minut behövs för att spara övningen. Du kan alltid avsluta utan XP.');a.exercises[0].done=[seconds];}if(!a.exercises.some(e=>e.done.some(n=>n>0)))throw Error('Registrera minst en omgång innan du sparar passet.');const breathing=a.exercises.filter(e=>e.id==='breathing').reduce((n,e)=>n+e.done.reduce((n,v)=>n+v,0),0);if(breathing)creditLinkedHabit(state,'breathing',breathing,a.date);a.finishedAt=now;if(!state.training.sessions.some(s=>s.id===a.id))state.training.sessions.push(structuredClone(a));state.training.active=null;return a;}
export function hasRecovery(state,day){return (state.training?.sessions||[]).some(s=>s.date===day&&s.kind==='recovery'&&s.finishedAt&&s.exercises.every(e=>e.done.some(n=>n>0)));}
export function challengeDone(state,id,day){return Boolean(state.history?.[day]?.entries?.['challenge:'+id])||(id==='meditation-notice'&&Object.values(state.history?.[day]?.entries||{}).some(e=>e.activityKey==='meditation'&&e.value>=e.target));}
export function saveChallenge(state,id,day,note){const c=challenges.find(c=>c.id===id);if(!c)throw Error('Utmaningen kunde inte hittas.');if(day<state.expedition.start)throw Error('Din Winter Arc har inte startat än.');if(challengeDone(state,id,day))throw Error('Utmaningen är redan sparad idag.');if(!note?.trim()||note.length>1200)throw Error('Skriv en kort rad om vad du gjorde eller lärde dig.');state.history[day]??={required:state.habits.filter(h=>!h.archived&&h.start<=day&&h.days.includes(new Date(day+'T12:00:00Z').getUTCDay())).map(h=>h.id),entries:{}};state.history[day].entries['challenge:'+id]={value:1,target:1,xp:c.xp,category:statCategory[c.stat],name:c.name,source:'challenge',note:note.trim()};if(id==='meditation-notice')creditLinkedHabit(state,'meditation',300,day);}
export function nofapElapsed(state,now=Date.now()){const tracker=state.privateTrackers?.nofap;if(!tracker?.enabled||!tracker.startedAt)return null;return Math.max(0,now-Date.parse(tracker.startedAt));}
export function startNofap(state,start,now=Date.now()){ensureTraining(state);const timestamp=Date.parse(start);if(!Number.isFinite(timestamp)||timestamp>now)throw Error('Välj en starttid som inte ligger i framtiden.');state.privateTrackers.nofap={...state.privateTrackers.nofap,enabled:true,startedAt:new Date(timestamp).toISOString()};}
export function resetNofap(state,now=Date.now()){ensureTraining(state);const t=state.privateTrackers.nofap,elapsed=nofapElapsed(state,now)||0;t.resets.push({at:new Date(now).toISOString(),durationMs:elapsed});t.resets=t.resets.slice(-100);t.longestMs=Math.max(t.longestMs||0,elapsed);t.startedAt=new Date(now).toISOString();t.enabled=true;}
