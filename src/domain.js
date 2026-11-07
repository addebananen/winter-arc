export const categories = {
 strength: {name:'Träning', stat:'Strength', icon:'dumbbell', color:'#a7bcfa'},
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
 ['Rörlighet','strength',10,'min',20,'Efter tandborstningen rullar jag ut mattan.'],
 ['Tacksamhetsjournal','faith',3,'saker',20,'Efter kvällsbönen skriver jag tre saker.'],
 ['Kall avslutning på duschen','discipline',30,'sek',15,'Efter min vanliga dusch sänker jag temperaturen.'],
 ['Meditation','health',5,'min',20,'Efter kaffet sitter jag ner och andas.'],
 ['Studera något nytt','wisdom',20,'min',30,'Efter lunchen öppnar jag min kurs.'],
 ['En vänlig handling','social',1,'gång',20,'När jag möter någon söker jag en möjlighet att hjälpa.'],
 ['Bibelstudie','faith',10,'min',25,'Efter frukosten läser jag ett stycke.'],
 ['Städa din plats','discipline',5,'min',15,'Efter arbetsdagen återställer jag skrivbordet.'],
 ['Skärmfri morgon','discipline',30,'min',25,'När jag vaknar låter jag mobilen ligga kvar.']
];
export const uid = () => globalThis.crypto.randomUUID();
export function dateKey(d = new Date(), zone) {
 const p = new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
 return ['year','month','day'].map(k=>p.find(x=>x.type===k).value).join('-');
}
export function shiftDate(day, delta) { const d = new Date(day+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+delta); return d.toISOString().slice(0,10); }
export function due(h, day) { const w=new Date(day+'T12:00:00Z').getUTCDay(); return !h.archived && day>=h.start && (!h.days || h.days.includes(w)); }
export function makeHabit(item, today=dateKey()) { return {id:uid(),name:item[0],category:item[1],target:item[2],unit:item[3],xp:item[4],cue:item[5],days:[0,1,2,3,4,5,6],start:today,archived:false}; }
export function blankState(today=dateKey()) { return {version:1,profile:{name:'Äventyrare',bio:'Lite bättre, varje dag.',title:'The beginning',color:'ice'},timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,habits:[],history:{},goals:[],reflections:[],body:[],claims:{},rewards:[],expedition:{start:today,days:90},onboarded:false}; }
export function ensureDay(state,day) {
 if(!state.history[day]) state.history[day]={required:state.habits.filter(h=>due(h,day)).map(h=>h.id),entries:{}};
 return state.history[day];
}
export function progress(state,day=dateKey()) {
 const record=state.history[day];
 const required=record?.required ?? state.habits.filter(h=>due(h,day)).map(h=>h.id);
 const entries=record?.entries||{};
 const done=required.filter(id=>entries[id] && entries[id].value>=entries[id].target).length;
 return {done,total:required.length,perfect:required.length>0&&done===required.length,ratio:required.length?done/required.length:0};
}
export function setProgress(state,id,value,day=dateKey()) {
 const h=state.habits.find(x=>x.id===id); if(!h||!due(h,day))throw Error('Vanan är inte aktiv den här dagen.');
 if(!Number.isFinite(value)||value<0||value>h.target)throw Error('Ogiltigt värde.');
 const record=ensureDay(state,day); if(!record.required.includes(id))record.required.push(id);
 record.entries[id]={value,target:h.target,xp:h.xp,category:h.category,name:h.name};
 const p=progress(state,day),count=Object.values(record.entries).filter(e=>e.value>=e.target).length;
 if(count<3)delete state.claims['three:'+day];if(!p.perfect)delete state.claims['perfect:'+day];if(count<2)delete state.claims['comeback:'+day];
 return p;
}
export function addHabit(state,h,today=dateKey()) {state.habits.push(h);if(due(h,today)&&state.history[today]&&!state.history[today].required.includes(h.id))state.history[today].required.push(h.id);}
export function archiveHabit(state,id,today=dateKey()) { const h=state.habits.find(h=>h.id===id);if(!h)return;h.archived=true; const r=state.history[today]; if(r && !(r.entries[id]?.value>=r.entries[id]?.target))r.required=r.required.filter(x=>x!==id); }
export function multiplier(count){return count>=5?1.5:count>=3?1.2:1;}
export function dayXP(record) {const done=Object.values(record?.entries||{}).filter(e=>e.value>=e.target);return Math.round(done.reduce((sum,e)=>sum+e.xp,0)*multiplier(done.length));}
export function totalXP(state){return Object.values(state.history).reduce((s,r)=>s+dayXP(r),0)+Object.values(state.claims).reduce((s,c)=>s+c.xp,0);}
export function levelInfo(xp){const level=Math.floor(Math.sqrt(xp/80))+1,base=80*(level-1)**2,next=80*level**2;return {level,base,next,ratio:(xp-base)/(next-base)};}
export function streak(state,today=dateKey()) {
 let d=progress(state,today).perfect?today:shiftDate(today,-1),n=0;
 while(progress(state,d).perfect){n++;d=shiftDate(d,-1); if(n>10000)break;} return n;
}
export function bestStreak(state){let best=0,n=0,last='';for(const d of Object.keys(state.history).sort()){if(progress(state,d).perfect){n=last&&d===shiftDate(last,1)?n+1:1;best=Math.max(best,n);}else n=0;last=d;}return best;}
export function stats(state) {const s={Strength:0,Discipline:0,Wisdom:0,Faith:0,Social:0};for(const r of Object.values(state.history))for(const e of Object.values(r.entries))if(e.value>=e.target)s[categories[e.category]?.stat||'Discipline']+=e.xp;return s;}
export function achievements(state,today=dateKey()) {
 const done=Object.values(state.history).flatMap(r=>Object.values(r.entries)).filter(e=>e.value>=e.target).length;
 return [
 {id:'first',name:'Första steget',description:'Klara din första vana',icon:'flag',unlocked:done>=1,progress:Math.min(done,1)},
 {id:'week',name:'Obruten',description:'7 perfekta dagar i rad',icon:'flame',unlocked:bestStreak(state)>=7,progress:Math.min(bestStreak(state)/7,1)},
 {id:'century',name:'Hundra små steg',description:'Genomför 100 vanor',icon:'gem',unlocked:done>=100,progress:Math.min(done/100,1)},
 {id:'balance',name:'I balans',description:'Utveckla alla fem stats',icon:'compass',unlocked:Object.values(stats(state)).every(x=>x>0),progress:Object.values(stats(state)).filter(x=>x>0).length/5},
 {id:'journal',name:'Ett visuellt minne',description:'Spara 7 progressbilder',icon:'camera',unlocked:state.body.length>=7,progress:Math.min(state.body.length/7,1)},
 {id:'reflect',name:'Självinsikt',description:'Skriv 4 veckoreflektioner',icon:'book',unlocked:state.reflections.length>=4,progress:Math.min(state.reflections.length/4,1)}
 ];
}
export function quests(state,today=dateKey()) {
 const p=progress(state,today),n=Object.values(state.history[today]?.entries||{}).filter(e=>e.value>=e.target).length;
 const yesterday=shiftDate(today,-1),prior=progress(state,yesterday);const missed=yesterday>=state.expedition.start&&prior.total>0&&!prior.perfect;
 const q=[{id:'three:'+today,name:'Bygg momentum',description:'Genomför 3 vanor idag.',icon:'bolt',xp:50,current:Math.min(n,3),target:3},
 {id:'perfect:'+today,name:'Dagens expedition',description:'Nå alla dina dagliga mål.',icon:'flag',xp:100,current:p.perfect?1:0,target:1},
 {id:'reflect:'+weekKey(today),name:'Stanna upp. Se framåt.',description:'Skriv veckans reflektion.',icon:'book',xp:75,current:state.reflections.some(r=>weekKey(r.date)===weekKey(today))?1:0,target:1}];
 if(missed)q.push({id:'comeback:'+today,name:'Tillbaka på stigen',description:'En missad dag är inte slutet. Klara 2 vanor idag.',icon:'sun',xp:40,current:Math.min(n,2),target:2});return q;
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
