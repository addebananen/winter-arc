// Adrian's own character: five photo-real forms with a living loop (breathing, pulsing energy, drifting sparks).
// The animation is pure CSS so it costs nothing and loops seamlessly. When real video loops exist,
// only heroCharacter() needs to change; the level steps and the saved choice stay the same.
export const HERO_ID='adrian';
// One form every five levels: level 1, 6, 11, 16 and 21.
export const heroForm=level=>Math.min(5,Math.floor((Math.max(1,level)-1)/5)+1);
// Energy sources per form, in image coordinates (195 x 260): [x, y, radius, colour].
const orbs={1:[],2:[[50,80,26,'#58b6ff']],3:[[156,127,42,'#bfe4ff']],4:[[43,125,38,'#4aa8ff'],[164,137,36,'#ff4d6a']],5:[[149,161,42,'#a56bff']]};
const sparkColor={2:'#8fd0ff',3:'#d6efff',4:'#ffb0c0',5:'#cdb0ff'};
// Jagged bolt between two points; the same seed always gives the same shape so the markup is stable.
function bolt(a,b,seed){let d=`M${a[0]} ${a[1]}`;for(let i=1;i<7;i++){const t=i/7,j=(((seed*37+i*61)%17)-8)*1.5;d+=` L${(a[0]+(b[0]-a[0])*t).toFixed(1)} ${(a[1]+(b[1]-a[1])*t+j).toFixed(1)}`;}return `${d} L${b[0]} ${b[1]}`;}
let seq=0;
export function heroCharacter(level=1,large=false){
 const form=heroForm(level),id='hero'+(++seq),list=orbs[form],main=list[0];
 const defs=`<clipPath id="${id}c"><rect width="195" height="260" rx="20"/></clipPath>`+
  list.map((o,i)=>`<radialGradient id="${id}g${i}"><stop stop-color="#fff" stop-opacity=".9"/><stop offset=".18" stop-color="${o[3]}" stop-opacity=".8"/><stop offset=".5" stop-color="${o[3]}" stop-opacity=".28"/><stop offset="1" stop-color="${o[3]}" stop-opacity="0"/></radialGradient>`).join('')+
  (main?`<radialGradient id="${id}a" cx="${main[0]/195}" cy="${main[1]/260}" r=".95"><stop offset=".25" stop-color="${main[3]}" stop-opacity="0"/><stop offset="1" stop-color="${list[1]?.[3]||main[3]}" stop-opacity=".5"/></radialGradient>`:'');
 // Each energy source: soft core, two counter-rotating swirl rings.
 const energy=list.map((o,i)=>`<g class="hero-energy" style="animation-delay:-${i*1.4}s"><circle class="hero-orb" cx="${o[0]}" cy="${o[1]}" r="${o[2]}" fill="url(#${id}g${i})"/><circle class="hero-ring" cx="${o[0]}" cy="${o[1]}" r="${(o[2]*.42).toFixed(1)}" fill="none" stroke="${o[3]}" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="${(o[2]*.9).toFixed(1)} ${(o[2]*.42).toFixed(1)}"/><circle class="hero-ring reverse" cx="${o[0]}" cy="${o[1]}" r="${(o[2]*.62).toFixed(1)}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".7" stroke-linecap="round" stroke-dasharray="${(o[2]*.5).toFixed(1)} ${(o[2]*.8).toFixed(1)}"/></g>`).join('');
 // Form 3 and up: waves of force rolling out from the technique.
 const waves=form>=3?[0,1,2].map(i=>`<circle class="hero-wave" cx="${main[0]}" cy="${main[1]}" r="${main[2]}" fill="none" stroke="${main[3]}" stroke-width="1" style="animation-delay:-${i*1.2}s"/>`).join(''):'';
 // Form 4: blue and red pulling at each other.
 const bolts=form===4?[0,1,2].map(i=>`<path class="hero-bolt" d="${bolt(list[0],list[1],i+1)}" fill="none" stroke="${['#e8f4ff','#c9a6ff','#ffd3dc'][i]}" stroke-width="${i?'.8':'1.3'}" stroke-linejoin="round" style="animation-delay:-${(i*.37).toFixed(2)}s"/>`).join(''):'';
 const sparks=form>1?Array.from({length:6+form*2},(_,i)=>`<circle class="hero-spark" cx="${12+(i*37)%172}" cy="${252-(i*53)%130}" r="${(.8+(i%3)*.45).toFixed(2)}" fill="${i%3?sparkColor[form]:list[i%list.length][3]}" style="animation-delay:-${(i*.7).toFixed(1)}s;animation-duration:${4+i%4}s"/>`).join(''):'';
 const aura=main?`<rect class="hero-aura" width="195" height="260" fill="url(#${id}a)"/>`:'';
 return `<svg class="character hero-character hero-form-${form} ${large?'large':''} char-${HERO_ID}" viewBox="0 0 250 260" aria-label="${HERO_ID}, evolution ${form}" role="img"><defs>${defs}</defs><g transform="translate(27.5 0)"><g clip-path="url(#${id}c)"><image class="hero-photo" href="./hero/lv${form}.jpg" width="195" height="260" preserveAspectRatio="xMidYMid slice"/>${aura}${waves}${energy}${bolts}${sparks}</g><rect class="hero-frame" x=".5" y=".5" width="194" height="259" rx="20" fill="none" stroke="${main?.[3]||'#94a6a7'}"/></g></svg>`;
}
