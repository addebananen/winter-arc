import {SEASON_START,extraHabits,ensureTraining,trainingXP,trainingStats,hasRecovery} from './fitness.js';
export const categories = {
 strength: {name:'Träning', stat:'Strength', icon:'dumbbell', color:'#a7bcfa'},
 mobility: {name:'Rörlighet', stat:'Flexibility', icon:'refresh', color:'#88d3cf'},
 health: {name:'Hälsa', stat:'Discipline', icon:'heart', color:'#82d6b4'},
 discipline: {name:'Disciplin', stat:'Discipline', icon:'bolt', color:'#ffca84'},
 wisdom: {name:'Läsning', stat:'Wisdom', icon:'book', color:'#c4b3ec'},
 faith: {name:'Tro', stat:'Faith', icon:'sun', color:'#ead398'},
 social: {name:'Socialt', stat:'Social', icon:'users', color:'#f3acc4'}
};
export const library = [
 ['Styrketräning','strength',1,'pass',40,'Efter jobbet tar jag på träningskläder.'],
 ['Promenad','health',30,'min',25,'Efter lunchen går jag ut.'],
 ['Läs en bok','wisdom',10,'sidor',25,'Efter kvällsteet öppnar jag min bok.'],
 ['Bön & reflektion','faith',5,'min',20,'Efter att jag vaknar tar jag en lugn stund.'],
 ['Fokus utan mobilen','discipline',30,'min',30,'Efter frukosten lägger jag mobilen i ett annat rum.'],
 ['Hör av dig till en vän','social',1,'gång',20,'Efter middagen skickar jag ett meddelande.'],
 ['Drick vatten','health',8,'glas',20,'Vid varje måltid fyller jag mitt glas.'],
 ['Sov i tid','health',1,'kväll',25,'När kvällslarmet ringer lägger jag undan skärmen.'],
 ['Löpning','strength',20,'min',35,'Efter att skorna är på går jag ut.'],
 ['Rörlighet','mobility',10,'min',20,'Efter tandborstningen rullar jag ut mattan.'],
 ['Tacksamhetsjournal','faith',3,'saker',20,'Efter kvällsbönen skriver jag tre saker.'],
 ['Kall avslutning på duschen','discipline',30,'sek',15,'Efter min vanliga dusch sänker jag temperaturen.'],
 ['Meditation','health',5,'min',20,'Efter kaffet sitter jag ner och andas.'],
 ['Studera något nytt','wisdom',20,'min',30,'Efter lunchen öppnar jag min kurs.'],
 ['En vänlig handling','social',1,'gång',20,'När jag möter någon söker jag en möjlighet att hjälpa.'],
 ['Bibelstudie','faith',10,'min',25,'Efter frukosten läser jag ett stycke.'],
 ['Städa din plats','discipline',5,'min',15,'Efter arbetsdagen återställer jag skrivbordet.'],
 ['Skärmfri morgon','discipline',30,'min',25,'När jag vaknar låter jag mobilen ligga kvar.']
 ,...extraHabits];
export function habitTemplate(h){const id=h.templateId;return id&&/^habit-\d+$/.test(id)?library[Number(id.slice(6))]:library.find(x=>x[0].toLocaleLowerCase('sv-SE')===h.name.trim().toLocaleLowerCase('sv-SE'));}
export function habitKey(h){const item=habitTemplate(h),i=library.indexOf(item);return item?(['Lugn andning','En minuts andningspaus'].includes(item[0])?'breathing':item[0]==='Meditation'?'meditation':'habit:'+i):'custom:'+h.name.trim().toLocaleLowerCase('sv-SE').replace(/\s+/g,' ');}
export function normalizeHabits(state){for(const h of state.habits){const item=habitTemplate(h);h.templateId=item?'habit-'+library.indexOf(item):null;h.activityKey=habitKey(h);h.xp=item?item[4]:15;if(item)h.category=item[1];}return state;}
export const uid = () => globalThis.crypto.randomUUID();
export function dateKey(d = new Date(), zone) {
 const p = new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
 return ['year','month','day'].map(k=>p.find(x=>x.type===k).value).join('-');
}
export function shiftDate(day, delta) { const d = new Date(day+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+delta); return d.toISOString().slice(0,10); }
export function due(h, day) { const w=new Date(day+'T12:00:00Z').getUTCDay(); return !h.archived && day>=h.start && (!h.days || h.days.includes(w)); }
export function makeHabit(item, today=dateKey()) { return {templateId:'habit-'+library.findIndex(x=>x[0]===item[0]),activityKey:habitKey({name:item[0]}),id:uid(),name:item[0],category:item[1],target:item[2],unit:item[3],xp:item[4],cue:item[5],days:[0,1,2,3,4,5,6],start:today,archived:false}; }
export function blankState(today=dateKey()) { return {version:1,profile:{name:'Äventyrare',bio:'Lite bättre, varje dag.',title:'The beginning',color:'ice'},timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,habits:[],history:{},goals:[],reflections:[],body:[],claims:{},rewards:[],accountCreated:today,expedition:{start:seasonStart(today),days:90},onboarded:false}; }
export function seasonStart(created=dateKey()){return created>SEASON_START?created:SEASON_START;}
export function normalizeState(state,created, demo=false){ensureTraining(state);normalizeHabits(state);if(!demo){if(created)state.accountCreated=dateKey(new Date(created),state.timezone);else state.accountCreated??=state.expedition.start;state.expedition.start=seasonStart(state.accountCreated);for(const h of state.habits)if(h.start<state.expedition.start)h.start=state.expedition.start;}return state;}
export function ensureDay(state,day) {
 if(!state.history[day]) state.history[day]={required:state.habits.filter(h=>due(h,day)).map(h=>h.id),entries:{}};
 return state.history[day];
}
export function progress(state,day=dateKey()) {
 if(day<state.expedition.start)return {done:0,total:0,perfect:false,ratio:0};
 const record=state.history[day];
 const required=record?.required ?? state.habits.filter(h=>due(h,day)).map(h=>h.id);
 const entries=record?.entries||{};
 const done=required.filter(id=>entries[id] && entries[id].value>=entries[id].target).length;
 return {done,total:required.length,perfect:required.length>0&&done===required.length,ratio:required.length?done/required.length:0};
}
export function setProgress(state,id,value,day=dateKey()) {
 if(day<state.expedition.start)throw Error('Din Winter Arc börjar '+state.expedition.start+'. Förbered dina vanor så länge.');
 const h=state.habits.find(x=>x.id===id); if(!h||!due(h,day))throw Error('Vanan är inte aktiv den här dagen.');
 if(!Number.isFinite(value)||value<0||value>h.target)throw Error('Ogiltigt värde.');
 const record=ensureDay(state,day); if(!record.required.includes(id))record.required.push(id);
 record.entries[id]={value,target:h.target,xp:h.xp,category:h.category,name:h.name,activityKey:habitKey(h)};
 const p=progress(state,day),count=Object.values(record.entries).filter(e=>e.source!=='challenge'&&e.value>=e.target).length;
 if(count<3)delete state.claims['three:'+day];if(!p.perfect)delete state.claims['perfect:'+day];if(count<2&&!hasRecovery(state,day))delete state.claims['comeback:'+day];
 return p;
}
export function addHabit(state,h,today=dateKey()) {if(state.habits.some(x=>!x.archived&&habitKey(x)===habitKey(h))||Object.values(state.history[today]?.entries||{}).some(e=>e.activityKey===habitKey(h)&&e.value>=e.target))throw Error('Den aktiviteten finns redan bland dina vanor. Den räknas en gång per dag.');if(state.habits.filter(x=>!x.archived).length>=20)throw Error('Välj högst 20 aktiva vanor. Färre, tydligare steg gör din resa hållbar.');state.habits.push(h);if(due(h,today)&&state.history[today]&&!state.history[today].required.includes(h.id))state.history[today].required.push(h.id);}
export function archiveHabit(state,id,today=dateKey()) { const h=state.habits.find(h=>h.id===id);if(!h)return;h.archived=true;delete h.pending;delete h.pendingDate; const r=state.history[today]; if(r && !(r.entries[id]?.value>=r.entries[id]?.target))r.required=r.required.filter(x=>x!==id); }
export function applyScheduledChanges(state,day=dateKey()){for(const h of state.habits)if(h.pending&&h.pendingDate<=day){const pending=h.pending;delete h.pending;delete h.pendingDate;Object.assign(h,pending);}}
export function multiplier(count){return count>=5?1.5:count>=3?1.2:1;}
export function challengeXP(record){const done=Object.values(record?.entries||{}).filter(e=>e.value>=e.target),meditation=done.filter(e=>e.activityKey==='meditation'&&e.source!=='challenge').reduce((n,e)=>n+e.xp,0);return Math.min(100,Object.entries(record?.entries||{}).filter(([,e])=>e.source==='challenge'&&e.value>=e.target).reduce((n,[id,e])=>n+Math.max(0,e.xp-(id==='challenge:meditation-notice'?meditation:0)),0));}
export function dayXP(record) {const all=Object.values(record?.entries||{}).filter(e=>e.value>=e.target),done=all.filter(e=>e.source!=='challenge');return Math.round(Math.min(200,done.reduce((sum,e)=>sum+e.xp,0))*multiplier(done.length))+challengeXP(record);}
export function totalXP(state){return Object.entries(state.history).filter(([d])=>d>=state.expedition.start).reduce((s,[,r])=>s+dayXP(r),0)+Object.values(state.claims).filter(c=>c.date>=state.expedition.start).reduce((s,c)=>s+c.xp,0)+trainingXP(state);}
export function levelInfo(xp){const level=Math.floor(Math.sqrt(xp/80))+1,base=80*(level-1)**2,next=80*level**2;return {level,base,next,ratio:(xp-base)/(next-base)};}
export function streak(state,today=dateKey()) {
 let d=progress(state,today).perfect?today:shiftDate(today,-1),n=0;
 while(d>=state.expedition.start&&progress(state,d).perfect){n++;d=shiftDate(d,-1); if(n>10000)break;} return n;
}
export function bestStreak(state){let best=0,n=0,last='';for(const d of Object.keys(state.history).sort()){if(progress(state,d).perfect){n=last&&d===shiftDate(last,1)?n+1:1;best=Math.max(best,n);}else n=0;last=d;}return best;}
export function stats(state){
 const s={Strength:0,Flexibility:0,Discipline:0,Wisdom:0,Faith:0,Social:0};
 for(const [day,r] of Object.entries(state.history)){
  if(day<state.expedition.start)continue;
  const habits=Object.values(r.entries).filter(e=>e.source!=='challenge'&&e.value>=e.target),base=habits.reduce((n,e)=>n+e.xp,0),meditation=habits.filter(e=>e.activityKey==='meditation').reduce((n,e)=>n+e.xp,0);
  for(const e of habits)s[categories[e.category]?.stat||'Discipline']+=e.xp*Math.min(1,200/base);
  const challenges=Object.entries(r.entries).filter(([,e])=>e.source==='challenge'&&e.value>=e.target).map(([id,e])=>({...e,earned:Math.max(0,e.xp-(id==='challenge:meditation-notice'?meditation:0))})),bonus=challenges.reduce((n,e)=>n+e.earned,0);
  for(const e of challenges)s[categories[e.category]?.stat||'Discipline']+=e.earned*Math.min(1,100/bonus);
 }
 for(const [k,v] of Object.entries(trainingStats(state)))s[k]+=v;
 const target=Math.round(Object.values(s).reduce((n,v)=>n+v,0)),order=Object.keys(s).sort((a,b)=>(s[b]%1)-(s[a]%1));let rest=target-Object.values(s).reduce((n,v)=>n+Math.floor(v),0);for(const k of Object.keys(s))s[k]=Math.floor(s[k]);for(const k of order)if(rest-->0)s[k]++;return s;
}
export function achievements(state,today=dateKey()) {
 const done=completedHabits(state);
 return [
 {id:'first',name:'Första steget',description:'Klara din första vana',icon:'flag',unlocked:done>=1,progress:Math.min(done,1)},
 {id:'week',name:'Obruten',description:'7 perfekta dagar i rad',icon:'flame',unlocked:bestStreak(state)>=7,progress:Math.min(bestStreak(state)/7,1)},
 {id:'century',name:'Hundra små steg',description:'Genomför 100 vanor',icon:'gem',unlocked:done>=100,progress:Math.min(done/100,1)},
 {id:'balance',name:'I balans',description:'Utveckla alla sex stats',icon:'compass',unlocked:Object.values(stats(state)).every(x=>x>0),progress:Object.values(stats(state)).filter(x=>x>0).length/6},
 {id:'journal',name:'Ett visuellt minne',description:'Spara 7 progressbilder',icon:'camera',unlocked:state.body.length>=7,progress:Math.min(state.body.length/7,1)},
 {id:'reflect',name:'Självinsikt',description:'Skriv 4 veckoreflektioner',icon:'book',unlocked:state.reflections.length>=4,progress:Math.min(state.reflections.length/4,1)}
 ];
}
export function completedHabits(state){return Object.entries(state.history).filter(([day])=>day>=state.expedition.start).flatMap(([,r])=>Object.values(r.entries)).filter(e=>e.source!=='challenge'&&e.value>=e.target).length;}
export function quests(state,today=dateKey()) {
 if(today<state.expedition.start)return [];
 const p=progress(state,today),n=Object.values(state.history[today]?.entries||{}).filter(e=>e.source!=='challenge'&&e.value>=e.target).length;
 const yesterday=shiftDate(today,-1),prior=progress(state,yesterday);const missed=yesterday>=state.expedition.start&&prior.total>0&&!prior.perfect;
 const q=[{id:'three:'+today,name:'Bygg momentum',description:'Genomför 3 vanor idag.',icon:'bolt',xp:50,current:Math.min(n,3),target:3},
 {id:'perfect:'+today,name:'Dagens expedition',description:'Nå alla dina dagliga mål.',icon:'flag',xp:100,current:p.perfect?1:0,target:1},
 {id:'reflect:'+weekKey(today),name:'Stanna upp. Se framåt.',description:'Skriv veckans reflektion.',icon:'book',xp:75,current:state.reflections.some(r=>weekKey(r.date)===weekKey(today))?1:0,target:1}];
 if(missed)q.push({id:'comeback:'+today,name:'Tillbaka på stigen',description:'Klara 2 vanor eller ett helt comeback-pass. En ny start, i din takt.',icon:'sun',xp:40,current:hasRecovery(state,today)?2:Math.min(n,2),target:2});return q;
}
export function claimQuest(state,id,today=dateKey()){const q=quests(state,today).find(q=>q.id===id);if(!q||q.current<q.target||state.claims[id])throw Error('Uppdraget är inte redo.');state.claims[id]={date:today,xp:q.xp};return q.xp;}
export function weekKey(day){const w=new Date(day+'T12:00:00Z').getUTCDay();return shiftDate(day,-((w+6)%7));}
export function expeditionProgress(state,today=dateKey()){return Math.max(0,Math.min(state.expedition.days,Math.floor((new Date(today+'T12:00:00Z')-new Date(state.expedition.start+'T12:00:00Z'))/86400000)+1));}
export function seedDemo(today=dateKey()) {
 const s=blankState(today);s.profile={name:'Alex',bio:'Bygger den jag vill bli. Ett steg i taget.',title:'Frostvandrare',color:'ice'};s.onboarded=true;s.expedition.start=shiftDate(today,-23);
 s.habits=[0,2,3,4,1].map(i=>makeHabit(library[i],shiftDate(today,-23)));
 for(let i=23;i>0;i--){const d=shiftDate(today,-i);ensureDay(s,d);s.habits.forEach((h,j)=>{if(i!==13 || j<2)setProgress(s,h.id,h.target,d);});}
 ensureDay(s,today);s.habits.slice(0,2).forEach(h=>setProgress(s,h.id,h.target,today));
 s.goals=[{id:uid(),name:'En starkare version av mig',target:60,current:18,unit:'träningspass',deadline:shiftDate(today,66),category:'strength'}];return s;
}
