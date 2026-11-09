import {liftById} from './strength.js';
import {exerciseById} from './fitness.js';
import {activities} from './cardio.js';
import {movementArt} from './strength-art.js';

export const reactions=[
 ['fire','🔥','På eld'],['clap','👏','Snyggt jobbat'],['heart','🤍','Stöttar dig'],
 ['strong','💪','Starkt'],['mind','🤯','Imponerande'],['rocket','🚀','Nästa nivå'],
 ['respect','🫡','Respekt'],['party','🎉','Värt att fira']
];
export function createSocialUI({esc,I,button,selfId,expanded=()=>true}){
 const number=n=>new Intl.NumberFormat('sv-SE',{maximumFractionDigits:1}).format(Number(n)||0);
 const exercise=(w,x)=>(w.kind==='strength'?liftById:exerciseById)[x.id]||{name:'Tidigare övning',unit:'reps'};
 const title=w=>w.kind==='cardio'?(activities.find(a=>a.id===w.activity)?.name||'Kondition'):(w.title||'Träningspass');
 const setCount=w=>(w.exercises||[]).reduce((n,x)=>n+x.sets.length,0);
 function metrics(w){if(w.kind==='cardio')return [[number(w.seconds/60),'minuter'],...(w.km>0?[[number(w.km),'km']]:[]),...(w.activity==='run'&&w.km>0?[[`${Math.floor(w.seconds/w.km/60)}:${String(Math.floor(w.seconds/w.km%60)).padStart(2,'0')}`,'min/km']]:[])];return [[number(w.minutes),'minuter'],[w.exercises?.length||0,'övningar'],[setCount(w),'set']];}
 const metricHTML=w=>`<div class="shared-metrics">${metrics(w).map(([v,l])=>`<span><strong>${v}</strong><small>${l}</small></span>`).join('')}</div>`;
 function reactionBar(post,burst=''){
  const all=expanded()?reactions:reactions.slice(0,3),rs=post.reactions||[];
  const chip=([kind,emoji,label],picker=false)=>{const active=rs.some(r=>r.user_id===selfId()&&r.kind===kind),n=rs.filter(r=>r.kind===kind).length;return button(`<span class="reaction-emoji" aria-hidden="true">${emoji}</span>${picker?`<span class="reaction-label">${label}</span>`:`<span class="reaction-count">${n||''}</span>`}`,'react:'+post.id+':'+kind,`react-btn ${picker?'reaction-option':''} ${active?'active':''} ${burst===kind?'reaction-pop':''}`,`aria-label="${label}${n?', '+n+' reaktioner':''}" aria-pressed="${active}" title="${label}"`);};
  const shown=all.filter(([k],i)=>i<3||rs.some(r=>r.kind===k));
  const people=new Set(rs.map(r=>r.user_id)).size;
  return `<div class="post-reaction-zone" data-reactions-for="${esc(post.id)}"><div class="reactions">${shown.map(r=>chip(r)).join('')}<details class="reaction-picker"><summary aria-label="Välj reaktion">${I('plus')}<span>Heja</span></summary><div class="reaction-menu"><span class="eyebrow">GE LITE ENERGI</span><div class="reaction-options">${all.map(r=>chip(r,true)).join('')}</div></div></details></div><p class="reaction-caption" aria-live="polite">${burst?reactions.find(r=>r[0]===burst)?.[2]+'!':people?people+' '+(people===1?'person hejar på':'personer hejar på'):'Ett litet tryck. Lite extra motivation.'}</p></div>`;
 }
 function workoutCard(post){const w=post.workout;if(!w)return '';return `<button class="shared-workout" data-action="post-workout:${esc(post.id)}" aria-label="Visa ${esc(title(w))} med övningar och resultat"><span class="shared-workout-heading"><span class="shared-workout-symbol">${I(w.kind==='cardio'?'activity':'dumbbell')}</span><span><small>PASS GENOMFÖRT</small><strong>${esc(title(w))}</strong></span>${I('chevron')}</span>${w.unavailable?'<p>Visa passets sammanfattning</p>':metricHTML(w)}${w.exercises?.length?`<span class="shared-exercise-preview">${w.exercises.slice(0,3).map(x=>esc(exercise(w,x).name)).join(' · ')}${w.exercises.length>3?' · +'+(w.exercises.length-3):''}</span>`:''}<span class="shared-workout-link">Se hela passet ${I('arrow')}</span></button>`;}
 function details(post){const w=post.workout;if(!w)return '<p>Passet kunde inte hittas. Uppdatera flödet och försök igen.</p>';return `<div class="shared-session"><div class="shared-session-intro"><span class="eyebrow">${esc(post.name||post.profiles?.display_name||'Äventyrare')} · ${esc(w.date||'SPARAT PASS')}</span><h3>${esc(title(w))}</h3></div>${w.unavailable?`<p class="intro">Detaljerna för det här äldre passet finns inte längre i träningshistoriken.</p><p class="post-text">${esc(post.body)}</p>`:metricHTML(w)}${(w.exercises||[]).map((x,i)=>{const e=exercise(w,x);return `<section class="shared-exercise"><div class="shared-exercise-head"><span class="shared-exercise-art">${w.kind==='strength'&&e.pose?movementArt(e,false):I('dumbbell')}</span><div><small>ÖVNING ${String(i+1).padStart(2,'0')}</small><h3>${esc(e.name)}</h3><p>${esc(e.muscle||e.stat||'')}${e.unit==='kg'&&e.equipment==='Hantlar'?' · kg per hantel':''}</p></div></div><table class="shared-sets"><caption class="sr-only">${esc(e.name)}: genomförda set</caption><thead><tr><th>Set</th>${e.unit==='kg'?'<th>Vikt</th>':''}<th>${e.unit==='sek'?'Tid':'Reps'}</th><th>Typ</th></tr></thead><tbody>${x.sets.map((s,j)=>`<tr><th scope="row">${j+1}</th>${e.unit==='kg'?`<td>${number(s.kg)} <small>kg</small></td>`:''}<td>${number(s.reps)}${e.unit==='sek'?' <small>s</small>':''}</td><td>${s.type==='failure'?'<span class="set-tag">Failure</span>':s.type==='drop'?'<span class="set-tag">Drop-set</span>':'<span class="set-tag subtle">Vanligt</span>'}</td></tr>`).join('')}</tbody></table></section>`;}).join('')}${post.image_path?`<img class="shared-session-photo" data-photo="${esc(post.image_path)}" alt="Bild delad till passet">`:''}${reactionBar(post)}<p class="shared-privacy">Bara sparade träningsresultat delas. Personliga anteckningar och spegelbilder är privata.</p></div>`;}
 return {reactionBar,workoutCard,details};
}
