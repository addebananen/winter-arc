import {figureArt} from './figure.js';
// Original vector movement sketches. Two controlled poses; no external media or trackers.
const poses={
 squat:[[96,39,96,60,96,94,81,116,80,143,112,116,113,143,75,67,65,58,117,67,127,58],[96,65,96,86,109,110,78,113,80,143,121,121,113,143,75,93,65,84,117,93,127,84]],
 hinge:[[96,39,96,60,96,94,82,117,80,143,110,117,113,143,80,85,78,111,112,85,115,111],[62,80,79,88,109,101,87,119,80,143,118,121,113,143,72,112,76,139,89,112,98,139]],
 bench:[[61,93,80,101,116,101,131,117,135,143,105,123,108,143,80,78,80,53,98,78,98,53],[61,93,80,101,116,101,131,117,135,143,105,123,108,143,64,87,80,89,114,87,98,89]],
 press:[[96,42,96,63,96,100,82,121,80,145,111,121,113,145,76,77,73,51,116,77,119,51],[96,42,96,63,96,100,82,121,80,145,111,121,113,145,78,38,78,16,114,38,114,16]],
 curl:[[96,34,96,55,96,96,82,120,80,145,111,120,113,145,78,81,77,110,114,81,115,110],[96,34,96,55,96,96,82,120,80,145,111,120,113,145,78,81,86,54,114,81,106,54]],
 lateral:[[96,34,96,55,96,96,82,120,80,145,111,120,113,145,77,81,73,109,115,81,119,109],[96,34,96,55,96,96,82,120,80,145,111,120,113,145,66,58,38,62,126,58,154,62]],
 row:[[61,72,78,82,108,100,91,119,80,145,120,120,113,145,77,106,76,133,95,109,97,135],[61,72,78,82,108,100,91,119,80,145,120,120,113,145,62,88,87,100,111,80,109,102]],
 pull:[[96,65,96,86,96,118,84,136,81,153,108,136,112,153,75,53,63,22,117,53,129,22],[96,25,96,46,96,79,84,99,81,119,108,99,112,119,65,53,63,22,127,53,129,22]],
 'seated-row':[[69,47,77,68,82,101,111,110,143,132,112,117,140,141,106,77,139,77,103,83,137,85],[69,47,77,68,82,101,111,110,143,132,112,117,140,141,60,88,88,87,71,97,97,92]],
 'leg-press':[[56,69,64,89,83,110,115,87,144,61,118,96,148,72],[56,69,64,89,83,110,94,80,117,56,103,88,122,66]],
 'leg-curl':[[64,43,68,64,72,99,108,103,113,140,115,110,122,145],[64,43,68,64,72,99,108,103,87,132,115,110,95,139]],
 dip:[[96,31,96,52,96,87,83,107,97,131,111,107,125,131,76,76,76,99,116,76,116,99],[96,57,96,78,96,113,83,131,97,150,111,131,125,150,65,79,76,99,127,79,116,99]],
 pushup:[[52,77,73,87,114,102,139,117,165,134,136,121,159,140,65,112,56,140,83,113,80,140],[52,108,73,115,114,122,139,130,165,134,136,134,159,140,47,123,56,140,97,128,80,140]],
 plank:[[51,87,71,97,113,111,139,123,165,139,138,128,160,143,65,134,45,139,86,136,67,142]],
 hang:[[96,62,96,83,96,116,84,135,81,153,108,135,112,153,75,51,63,22,117,51,129,22]],
 handstand:[[96,128,96,107,96,70,84,42,81,16,108,42,112,16,76,128,70,148,116,128,122,148]]
};
Object.assign(poses,{
 incline:poses.bench.map(v=>v.map((n,i)=>i%2?n-(120-v[i-1])*.25:n)),
 'chest-press':poses.bench,'supported-row':poses.row,'one-pull':poses.pull,
 'leg-extension':[poses['leg-curl'][1],poses['leg-curl'][0]],
 lunge:[poses.squat[0],[96,55,96,76,96,108,72,112,63,145,120,130,138,145,77,86,72,112,115,86,120,112]],
 nordic:poses.hinge,fly:[[96,42,96,63,96,100,82,121,80,145,111,121,113,145,61,64,33,75,131,64,159,75],[96,42,96,63,96,100,82,121,80,145,111,121,113,145,79,76,92,76,113,76,100,76]],
 'reverse-fly':[],facepull:[],overhead:[poses.press[1],poses.press[1].map((n,i)=>i===17||i===21?n+36:n)],
 'y-raise':[poses.lateral[0],poses.press[1]],'side-lying':poses.bench,'seated-press':poses.press,
 skullcrusher:poses.bench,pullover:[poses.bench[0],poses.bench[1]],kickback:[poses.row[1],poses.row[0]],
 preacher:poses.curl,bayesian:poses.curl,'incline-curl':poses.curl,pushdown:[poses.curl[1],poses.curl[0]],
 run:[[96,34,96,55,96,96,72,111,55,142,120,120,137,143,70,68,78,43,122,83,133,67],[96,38,96,59,96,100,117,118,140,139,75,119,56,140,70,86,58,67,122,70,113,45]],
 walk:[],volleyball:[poses.press[0],poses.press[1]],climb:[poses.pull[0],poses.pull[1]]
});
poses['reverse-fly']=[...poses.fly].reverse();poses.facepull=[poses['seated-row'][0],poses.pull[1]];poses.walk=poses.run;
// Abs and mobility poses (migration 014): [head, neck, hip, knee L, foot L, knee R, foot R, elbow L, hand L, elbow R, hand R].
const lying=[36,138,56,140,92,142,114,120,136,146,116,122,138,147,52,124,40,132,58,126,44,134];
Object.assign(poses,{
 situp:[lying,[80,88,84,108,92,142,114,120,136,146,116,122,138,147,70,98,76,88,96,98,86,86]],
 crunch:[lying,[50,122,64,128,92,142,114,120,136,146,116,122,138,147,56,114,46,122,64,116,50,124]],
 'reverse-crunch':[[36,140,56,141,92,142,100,116,124,112,102,118,126,114,72,146,88,147,74,147,90,148],[36,140,56,141,96,134,82,108,104,96,84,110,106,98,72,146,88,147,74,147,90,148]],
 'v-up':[[30,140,50,141,86,142,114,143,142,144,114,145,142,146,34,132,18,128,36,134,20,130],[66,94,72,112,92,142,112,116,130,92,113,118,131,94,90,104,112,96,92,106,114,98]],
 twist:[[74,92,80,110,96,142,118,122,136,134,120,124,138,136,76,124,64,136,84,126,70,138],[78,92,82,110,96,142,118,122,136,134,120,124,138,136,98,122,112,132,104,124,118,134]],
 'leg-raise':[[36,140,56,141,92,142,120,143,148,144,120,145,148,146,72,146,88,147,74,147,90,148],[36,140,56,141,92,142,94,114,96,86,96,114,98,86,72,146,88,147,74,147,90,148]],
 'hanging-raise':[[96,62,96,83,96,116,92,135,90,153,100,135,102,153,75,51,63,22,117,51,129,22],[96,62,96,83,98,116,124,114,150,112,124,118,150,116,75,51,63,22,117,51,129,22]],
 'hanging-knee':[[96,62,96,83,96,116,92,135,90,153,100,135,102,153,75,51,63,22,117,51,129,22],[96,62,96,83,98,114,118,100,114,128,120,104,116,132,75,51,63,22,117,51,129,22]],
 'captains-chair':[[96,36,96,56,96,96,94,122,92,148,98,122,100,148,82,78,62,76,110,78,130,76],[96,36,96,56,96,96,122,90,124,116,124,94,126,120,82,78,62,76,110,78,130,76]],
 'ab-wheel':[[70,100,84,104,120,112,126,146,150,147,128,146,152,148,82,122,78,142,86,124,80,143],[50,124,64,128,106,128,126,146,150,147,128,146,152,148,44,136,26,142,46,137,28,143]],
 'cable-crunch':[[98,62,98,82,100,116,102,148,128,149,104,148,130,150,86,76,94,62,112,76,104,62],[62,114,76,104,100,116,102,148,128,149,104,148,130,150,72,96,64,104,76,100,66,108]],
 'kneel-lunge':[[98,64,98,84,100,118,74,120,70,150,122,148,150,150,84,98,98,112,112,98,102,112],[92,64,92,84,92,120,70,121,66,150,118,148,148,150,78,98,92,114,106,98,96,114]],
 pigeon:[[94,84,96,104,100,136,72,144,102,150,138,147,168,149,80,124,74,146,112,124,118,146],[56,128,72,124,100,136,72,144,102,150,138,147,168,149,50,138,34,146,56,140,38,147]],
 'reach-lunge':[[66,84,78,96,98,118,64,120,60,150,130,136,160,150,66,122,54,148,86,112,80,132],[70,82,80,96,98,118,64,120,60,150,130,136,160,150,66,122,54,148,82,74,84,50]],
 ninety:[[96,88,96,108,96,142,72,146,56,132,120,140,124,122,84,124,80,146,108,124,112,146],[96,88,96,108,96,142,72,140,68,122,122,146,138,132,84,124,80,146,108,124,112,146]],
 'deep-squat':[[96,65,96,86,109,110,78,113,80,143,121,121,113,143,75,93,65,84,117,93,127,84],[96,62,96,83,109,108,78,113,80,143,121,121,113,143,75,90,65,81,117,90,127,81]],
 child:[[56,138,72,130,110,136,82,144,116,150,84,146,118,151,48,144,30,147,50,145,32,148],[58,135,74,127,110,134,82,144,116,150,84,146,118,151,50,143,30,147,52,144,32,148]],
 cobra:[[60,102,72,116,110,144,138,146,166,147,138,148,166,149,72,132,70,148,76,132,74,149],[62,122,76,130,110,144,138,146,166,147,138,148,166,149,74,138,70,148,78,139,74,149]],
 'open-book':[[40,132,58,136,100,140,120,124,140,142,122,126,142,144,74,126,90,120,76,128,92,122],[40,132,58,136,100,140,120,124,140,142,122,126,142,144,74,126,90,120,52,118,38,108]],
 'seated-fold':[[72,88,72,108,70,142,100,143,130,144,100,145,130,146,84,124,98,136,86,126,100,138],[114,122,98,124,70,142,100,143,130,144,100,145,130,146,114,132,128,140,116,134,130,142]],
 butterfly:[[96,88,96,108,96,142,70,134,94,148,122,134,98,148,84,126,94,144,108,126,98,144],[102,94,100,112,96,142,68,140,94,148,124,140,98,148,88,128,94,146,112,128,98,146]],
 dislocate:[[96,42,96,63,96,100,82,121,80,145,111,121,113,145,74,44,56,26,118,44,136,26],[96,42,96,63,96,100,82,121,80,145,111,121,113,145,70,78,48,96,122,78,144,96]]
});
// Seated poses: the machine chest press is pushed forward from a seat (side view), and seated presses
// keep the hips on the bench (front view). [head, neck, hip, knee L, foot L, knee R, foot R, elbow L, hand L, elbow R, hand R]
Object.assign(poses,{
 'chest-press':[[86,40,86,61,88,104,120,106,122,146,118,108,120,146,70,82,96,76,72,84,98,78],[86,40,86,61,88,104,120,106,122,146,118,108,120,146,110,76,138,74,112,78,140,76]],
 'seated-press':[[96,40,96,61,96,100,80,112,78,146,112,112,114,146,74,76,72,52,118,76,120,52],[96,40,96,61,96,100,80,112,78,146,112,112,114,146,78,38,78,16,114,38,114,16]]
});
// Where a cable pulls from, per pose. Two anchors mean one cable per hand.
const cableAnchors={pull:[[96,12]],'one-pull':[[120,12]],pushdown:[[100,12]],'cable-crunch':[[98,12]],pullover:[[160,24]],overhead:[[150,150]],
 lateral:[[150,150],[42,150]],fly:[[20,40],[172,40]],'reverse-fly':[[20,62],[172,62]],curl:[[96,152]],kickback:[[34,128]],'y-raise':[[150,150],[42,150]],
 'seated-row':[[176,80]],facepull:[[176,52]],bayesian:[[30,118]]};
const flatBench=new Set(['bench','skullcrusher','pullover','side-lying']);
const sideView=(a,b)=>Math.max(Math.abs(a[16]-a[20]),Math.abs(b[16]-b[20]))<30;

// Muscular figure: a tapered torso, thick upper arms and thighs, shoulder caps and a far side drawn darker
// behind the body. Every joint moves between the two key poses.
export function movementArt(e,animated=false){
 const figure=figureArt(e,animated);if(figure)return figure;
 let [a,b]=poses[e.equipment==='Maskin'&&e.pose==='press'?'seated-press':e.pose]||poses.curl;b=b||a;
 if(a.length<22){a=[...a,53,83,65,105,88,83,96,102];b=[...b,53,83,65,105,88,83,96,102];}
 // Dumbbell lunges carry the weights at the sides; a goblet squat holds one dumbbell at the chest.
 const arms=(v,f)=>{const o=[...v];f(o,v);return o;};
 if(e.equipment==='Hantlar'&&e.pose==='lunge')[a,b]=[a,b].map(v=>arms(v,(o,v)=>{const mid=v[3]+(v[5]-v[3])*.5;o.splice(14,8,v[2]-16,mid,v[2]-17,v[5]+12,v[2]+16,mid,v[2]+17,v[5]+12);}));
 const goblet=e.equipment==='Hantlar'&&e.pose==='squat';
 if(goblet)[a,b]=[a,b].map(v=>arms(v,(o,v)=>o.splice(14,8,v[2]-13,v[3]+24,v[2]-2,v[3]+14,v[2]+13,v[3]+24,v[2]+2,v[3]+14)));
 const r=n=>Math.round(n*10)/10,moving=(v1,v2)=>animated&&String(v1)!==String(v2);
 const anim=(attr,v1,v2)=>moving(v1,v2)?`<animate attributeName="${attr}" values="${v1};${v2};${v1}" dur="3.6s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.5;1" keySplines=".4 0 .2 1;.4 0 .2 1"/>`:'';
 const move=(x1,y1,x2,y2)=>moving(`${x1} ${y1}`,`${x2} ${y2}`)?`<animateTransform attributeName="transform" type="translate" values="${r(x1)} ${r(y1)};${r(x2)} ${r(y2)};${r(x1)} ${r(y1)}" dur="3.6s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.5;1" keySplines=".4 0 .2 1;.4 0 .2 1"/>`:'';
 const line=(i,j,w,color,extra='')=>`<line x1="${a[i]}" y1="${a[i+1]}" x2="${a[j]}" y2="${a[j+1]}" stroke="${color}" stroke-width="${w}"${extra}>${anim('x1',a[i],b[i])}${anim('y1',a[i+1],b[i+1])}${anim('x2',a[j],b[j])}${anim('y2',a[j+1],b[j+1])}</line>`;
 // Muscle belly: a lighter, shorter stroke along the upper half of a segment.
 const belly=(i,j,w,color)=>{const at=(v,t)=>[r(v[i]+(v[j]-v[i])*t),r(v[i+1]+(v[j+1]-v[i+1])*t)];const [p1,p2,q1,q2]=[at(a,.18),at(a,.62),at(b,.18),at(b,.62)];return `<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" stroke="${color}" stroke-width="${w}">${anim('x1',p1[0],q1[0])}${anim('y1',p1[1],q1[1])}${anim('x2',p2[0],q2[0])}${anim('y2',p2[1],q2[1])}</line>`;};
 const torso=v=>{const dx=v[4]-v[2],dy=v[5]-v[3],len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,at=(t,w)=>[[v[2]+dx*t+nx*w,v[3]+dy*t+ny*w],[v[2]+dx*t-nx*w,v[3]+dy*t-ny*w]];const [s1,s2]=at(.02,14),[c1,c2]=at(.34,13),[w1,w2]=at(1,9);return [s1,c1,w1,w2,c2,s2].map(p=>p.map(r).join(',')).join(' ');};
 const skin='#c6ded0',skinFar='#8fa9a2',shirt='#8fb8e8',pants='#425d79',pantsFar='#2f4559',sheen='#e4f2ec';
 const limbs=(side,far)=>{const [k,f,el,h]=side==='L'?[6,8,14,16]:[10,12,18,20];const leg=far?pantsFar:pants,arm=far?skinFar:skin;return {legs:line(4,k,16,leg)+line(k,f,11,leg)+(far?'':belly(4,k,6,'#5a7896')),arms:line(2,el,12,arm)+line(el,h,9,arm)+`<circle cx="${a[2]}" cy="${a[3]}" r="8" fill="${arm}">${anim('cx',a[2],b[2])}${anim('cy',a[3],b[3])}</circle>`+(far?'':belly(2,el,5,sheen))};};
 const farSide=limbs('R',true),nearSide=limbs('L',false);
 // Equipment, drawn where the hands are.
 const side=sideView(a,b),hx=v=>(v[16]+v[20])/2,hy=v=>(v[17]+v[21])/2;let gear='',back='';
 const plate=(x1,y1,x2,y2,rad)=>`<g transform="translate(${r(x1)} ${r(y1)})">${move(x1,y1,x2,y2)}<circle r="${rad}" fill="#22313a" stroke="#a8bbc4" stroke-width="3"/><circle r="3" fill="#a8bbc4"/></g>`;
 const dumbbell=(x1,y1,x2,y2)=>`<g transform="translate(${r(x1)} ${r(y1)})">${move(x1,y1,x2,y2)}<path d="M-7 0H7" stroke="#a8bbc4" stroke-width="3"/><rect x="-11" y="-6" width="5" height="12" rx="1.5" fill="#22313a" stroke="#a8bbc4" stroke-width="1.5"/><rect x="6" y="-6" width="5" height="12" rx="1.5" fill="#22313a" stroke="#a8bbc4" stroke-width="1.5"/></g>`;
 if(e.equipment==='Skivstång'){
  if(side)gear=plate(hx(a),hy(a),hx(b),hy(b),13);
  else{const bar=(v,d)=>[Math.min(v[16],v[20])-d,hy(v),Math.max(v[16],v[20])+d,hy(v)];const [x1,y1,x2,y2]=bar(a,24),[u1,v1,u2,v2]=bar(b,24);
   gear=`<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="#a8bbc4" stroke-width="4" stroke-linecap="round">${anim('x1',r(x1),r(u1))}${anim('y1',r(y1),r(v1))}${anim('x2',r(x2),r(u2))}${anim('y2',r(y2),r(v2))}</line>`
    +[[x1+5,y1,u1+5,v1],[x2-5,y2,u2-5,v2]].map(([p,q,s,t])=>`<g transform="translate(${r(p)} ${r(q)})">${move(p,q,s,t)}<rect x="-3.5" y="-14" width="7" height="28" rx="2" fill="#22313a" stroke="#a8bbc4" stroke-width="2"/></g>`).join('');}
 }else if(e.equipment==='Hantlar'){
  gear=goblet?`<g transform="translate(${r(hx(a))} ${r(hy(a))})">${move(hx(a),hy(a),hx(b),hy(b))}<g transform="rotate(90)">${dumbbell(0,0,0,0)}</g></g>`:side?[16,20].map(i=>plate(a[i],a[i+1],b[i],b[i+1],7)).join(''):[16,20].map(i=>dumbbell(a[i],a[i+1],b[i],b[i+1])).join('');
 }else if(e.equipment==='Kabel'){
  const anchors=cableAnchors[e.pose]||[[96,12]],hands=anchors.length>1?[16,20]:[null];
  gear=anchors.map(([x,y],n)=>{const i=hands[n];const [p,q,s,t]=i==null?[hx(a),hy(a),hx(b),hy(b)]:[a[i],a[i+1],b[i],b[i+1]];return `<circle cx="${x}" cy="${y}" r="4" fill="#526a70"/><line x1="${x}" y1="${y}" x2="${r(p)}" y2="${r(q)}" stroke="#7f98a0" stroke-width="2">${anim('x2',r(p),r(s))}${anim('y2',r(q),r(t))}</line><g transform="translate(${r(p)} ${r(q)})">${move(p,q,s,t)}<rect x="-6" y="-3" width="12" height="6" rx="3" fill="#22313a" stroke="#a8bbc4" stroke-width="2"/></g>`;}).join('');
 }else if(e.equipment==='Maskin'&&(e.pose==='chest-press'||e.pose==='press')){
  gear=[16,20].map(i=>`<g transform="translate(${r(a[i])} ${r(a[i+1])})">${move(a[i],a[i+1],b[i],b[i+1])}<rect x="-4" y="-7" width="8" height="14" rx="4" fill="#22313a" stroke="#a8bbc4" stroke-width="2"/></g>`).join('');
 }else if(e.equipment==='Gummiband'){
  const curve=v=>`M${v[16]} ${v[17]}Q${r(hx(v))} ${r(hy(v)+18)} ${v[20]} ${v[21]}`;gear=`<path d="${curve(a)}" fill="none" stroke="#e58fae" stroke-width="3">${anim('d',curve(a),curve(b))}</path>`;
 }
 // Frames, benches and seats behind the figure.
 if(e.equipment==='Räcke')back='<path d="M44 20H148M48 20V152M144 20V152"/>';
 else if(e.pose==='chest-press')back='<path d="M74 54L78 110M70 112H120M78 112V151M116 112V151M150 40V151M140 151H162"/>';
 else if(e.pose==='seated-press'||e.equipment==='Maskin'&&e.pose==='press')back='<path d="M66 112H126M74 112V151M118 112V151"/>';
 else if(flatBench.has(e.pose))back='<path d="M48 112H125M60 112V151M118 112V151"/>';
 else if(e.pose==='incline')back='<path d="M52 118L118 96M66 116V151M112 100V151"/>';
 else if(e.equipment==='Maskin'||e.equipment==='Kabel')back='<path d="M36 20V151H162M158 20V151M36 20H158"/>';
 else if(e.id==='handstand')back='<path d="M126 8V152"/>';
 const id='skin-'+e.id;
 // Holds (plank, hang) do not change pose; a slow breath keeps them alive.
 const breathe=animated&&String(a)===String(b)?'><animateTransform attributeName="transform" type="translate" values="0 0;0 -1.5;0 0" dur="3.6s" repeatCount="indefinite"/':'';
 return `<svg class="movement-art ${animated?'moving':''}" viewBox="0 0 192 170" role="img" aria-label="${e.name}: förenklad rörelsedemonstration"><defs><linearGradient id="${id}" x2="0" y2="1"><stop stop-color="#e2f2ec"/><stop offset="1" stop-color="#8cc2b8"/></linearGradient></defs><ellipse cx="96" cy="154" rx="75" ry="5" fill="#0003"/><g fill="none" stroke="#526a70" stroke-width="4" stroke-linecap="round">${back}</g><g${breathe}><g fill="none" stroke-linecap="round" stroke-linejoin="round">${farSide.legs}${farSide.arms}<polygon points="${torso(a)}" fill="${shirt}" stroke="${shirt}" stroke-width="4">${anim('points',torso(a),torso(b))}</polygon>${line(2,4,3,'#c3dcf6',' stroke-opacity=".55"')}${nearSide.legs}${line(0,2,8,skin)}${nearSide.arms}</g><circle cx="${a[0]}" cy="${a[1]}" r="10.5" fill="url(#${id})">${anim('cx',a[0],b[0])}${anim('cy',a[1],b[1])}</circle>${gear}</g></svg>`;
}
