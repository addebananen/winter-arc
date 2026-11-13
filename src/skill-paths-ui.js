// Skill goal UI: the "Mitt mål" card, the road to the goal and the goal picker.
// Shared by the Skill tree page (skills-ui.js) and the Strength hub (strength-ui.js).
// Buttons use the existing action prefixes: fit:sk:* (skills-ui) and hub:* (strength-ui).
import * as SK from './skills.js';
import * as P from './skill-paths.js';
import {SKILL_PATH_CSS} from './skill-paths-css.js';

export function injectCSS() {
  if (typeof document === 'undefined' || document.getElementById('skill-path-css')) return;
  const s = document.createElement('style'); s.id = 'skill-path-css'; s.textContent = SKILL_PATH_CSS; document.head.appendChild(s);
}

const ROLE_CLASS = {Uppvärmning: 'warm', Befäst: 'keep', Förkunskap: 'pre', Huvudfokus: 'main', Stödstyrka: 'support'};
const unitText = (amount, unit) => unit === 'sek' ? `${amount} s` : `${amount} reps`;
const colorOf = t => SK.branches.find(b => b.id === t.branch)?.color || 'var(--mint)';

// A progress ring around the goal's picture.
function ring(ratio, inner, color) {
  const r = 30, c = 2 * Math.PI * r;
  return `<span class="sp-ring" style="--cat:${color}"><svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="${r}" class="sp-ring-track"/><circle cx="36" cy="36" r="${r}" class="sp-ring-fill" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - ratio)).toFixed(1)}"/></svg><span class="sp-ring-art">${inner}</span></span>`;
}

// The list of exercises in a ready workout, with its role (warm-up, main focus …).
export function templateList(tpl, {esc, thumb = () => ''}) {
  return `<ol class="sp-plan">${tpl.items.map(x => `<li class="sp-plan-row ${ROLE_CLASS[x.role]}"><span class="sp-plan-art">${thumb(x.id)}</span><span class="sp-plan-text"><small class="sp-role">${x.role}</small><strong>${esc(x.level.name)}</strong></span><span class="sp-plan-goal">${x.sets} × ${unitText(x.amount, x.unit)}</span></li>`).join('')}</ol>`;
}

// options: {I, esc, button, thumb(id), allowed(id), day, active (a workout is running), where}
export function goalCard(s, o) {
  const {I, esc, button} = o, goal = P.goalOf(s);
  if (!goal) return pickCard(s, o);
  const p = P.pathOf(s, goal), t = p.tree, color = colorOf(t);
  const full = P.template(s, goal, 'full', {allowed: o.allowed, day: o.day}), quick = P.template(s, goal, 'quick', {allowed: o.allowed, day: o.day});
  const goalArt = o.thumb(`sk-${goal}-${t.levels.length}`);
  const next = p.next, nextLine = p.mastered
    ? `<p class="sp-next"><span>${I('trophy')}</span><span><strong>Bemästrad.</strong> <span class="muted">Håll den vid liv med ett underhållspass i veckan.</span></span></p>`
    : next ? `<p class="sp-next"><span>${I('flag')}</span><span><small class="sp-next-label">${next.own ? 'Ditt nästa steg' : 'Nästa förkunskap'}</small><strong>${esc(next.level.name)}</strong><small class="muted">${esc(next.treeName)} · ${esc(next.level.goal)}</small></span></p>`
    : `<p class="sp-next"><span>${I('lock')}</span><span class="muted">Klara förkunskaperna i trädkartan för att gå vidare.</span></p>`;
  const startLabel = o.active ? 'Lägg till i pågående pass' : 'Starta skill-pass';
  const body = full.items.length
    ? `<div class="sp-today"><div class="sp-today-head"><span class="eyebrow">DAGENS PASS</span><span class="muted"><span>${full.items.length} övningar</span> · <span>≈ ${full.minutes} min</span></span></div>${templateList(full, o)}</div>
      ${button(I(o.active ? 'plus' : 'bolt') + ' ' + startLabel, `hub:template:${goal}:full`, 'btn full sp-start')}
      <div class="sp-actions">${quick.items.length && quick.ids.join() !== full.ids.join() ? button(`${I('clock')}<span>Snabbpass</span><small>≈ ${quick.minutes} min</small>`, `hub:template:${goal}:quick`, 'btn secondary sp-quick') : ''}${button(`${I('mountain')}<span>Visa vägen</span>`, 'fit:sk:road:' + goal, 'btn secondary sp-road-btn')}</div>`
    : `<div class="notice sp-rest">${I('check')}<span>Dagens steg för målet är redan sparade. Vila, och kom tillbaka imorgon.</span></div>${button(`${I('mountain')}<span>Visa vägen</span>`, 'fit:sk:road:' + goal, 'btn secondary full')}`;
  return `<section class="card sp-goal ${o.where || ''}" style="--cat:${color}">
    <div class="sp-goal-top">${ring(p.ratio, goalArt, color)}<div class="sp-goal-title"><span class="eyebrow">MITT MÅL</span><h2>${esc(t.name)}</h2>
      <div class="sp-meter"><span class="sp-meter-count"><b>${p.done}</b><span>/</span><span>${p.total}</span></span> <span class="muted">steg på vägen</span></div>
      ${p.prereqLeft && !p.mastered ? `<small class="muted sp-pre-left"><span>${p.prereqLeft} förkunskapssteg kvar</span></small>` : ''}</div>
      ${button(I('refresh'), 'fit:sk:goals', 'icon-btn sp-change', 'aria-label="Byt mål"')}</div>
    ${nextLine}${body}</section>`;
}

function pickCard(s, {I, esc, button, thumb}) {
  return `<section class="card sp-goal sp-pick"><span class="eyebrow">VÄLJ ETT MÅL</span><h2>Vad vill du kunna?</h2>
    <p class="muted">Välj en skill. Appen visar hela vägen dit och bygger färdiga pass från där du är nu.</p>
    <div class="sp-pick-grid">${P.FEATURED.map(id => { const t = SK.treeById[id], p = P.pathOf(s, id); return `<button class="sp-pick-opt" data-action="fit:sk:goal:${id}" style="--cat:${colorOf(t)}"><span class="sp-pick-art">${thumb(`sk-${id}-${t.levels.length}`)}</span><strong>${esc(t.short || t.name)}</strong><small><span>${p.done}/${p.total}</span> <span>steg</span></small></button>`; }).join('')}</div>
    ${button('Alla skills ' + I('arrow'), 'fit:sk:goals', 'btn ghost')}</section>`;
}

// Every tree, grouped by branch, with how far along the road you are.
export function goalPicker(s, {esc, thumb}) {
  const cur = P.goalOf(s);
  return `<p class="intro">Välj det du vill kunna. Förkunskaperna läggs automatiskt in på vägen.</p>${SK.branches.map(b => `<h3 class="sp-group">${esc(b.name)}</h3><div class="sp-pick-list">${SK.trees.filter(t => t.branch === b.id).map(t => { const p = P.pathOf(s, t.id); return `<button class="sp-pick-row ${t.id === cur ? 'selected' : ''}" data-action="fit:sk:goal:${t.id}" style="--cat:${b.color}"><span class="sp-pick-art">${thumb(`sk-${t.id}-${t.levels.length}`)}</span><span><strong>${esc(t.name)}</strong><small><span>${p.done}/${p.total}</span> <span>steg</span>${p.mastered ? ' · <span>Bemästrad</span>' : ''}</small><span class="sp-mini-bar"><i style="width:${Math.round(p.ratio * 100)}%"></i></span></span></button>`; }).join('')}</div>`).join('')}${cur ? `<button class="btn ghost full" data-action="fit:sk:goal-clear">Ta bort mitt mål</button>` : ''}`;
}

// The whole road: every step in unlock order, grouped by tree.
export function roadView(s, goal, {I, esc, button, thumb, allowed, day}) {
  const p = P.pathOf(s, goal), t = p.tree, groups = [];
  for (const x of p.steps) { const g = groups.at(-1); if (g && g.tree === x.tree) g.steps.push(x); else groups.push({tree: x.tree, steps: [x]}); }
  const readyIds = new Set(p.ready.map(x => x.id)), plan = P.GOAL_PLAN[goal];
  return `<div class="sp-road" style="--cat:${colorOf(t)}"><span class="eyebrow">VÄGEN TILL MÅLET</span>
    <div class="sp-road-head"><div><span class="sp-meter-count big"><b>${p.done}</b><span>/</span><span>${p.total}</span></span><small class="muted">steg klara</small></div><div class="sp-road-bar"><i style="width:${Math.round(p.ratio * 100)}%"></i></div></div>
    ${plan?.tip ? `<p class="notice">${I('info')}<span>${esc(plan.tip)}</span></p>` : ''}
    ${groups.map(g => { const tree = SK.treeById[g.tree], own = g.tree === goal, done = g.steps.every(x => x.done); return `<section class="sp-seg ${own ? 'own' : 'pre'} ${done ? 'done' : ''}"><h4><span>${esc(tree.name)}</span>${own ? '' : ' <span class="sp-tag">förkunskap</span>'}${done ? ' ' + I('check') : ''}</h4><ol>${g.steps.map(x => { const ready = readyIds.has(x.id), st = x.done ? 'done' : ready ? 'ready' : 'later'; return `<li class="sp-step ${st}"><span class="sp-dot">${x.done ? I('check') : x.n}</span><button class="sp-step-main" data-action="fit:sk:show:${x.tree}:${x.n}"><span class="sp-step-art">${thumb(x.id)}</span><span><strong>${esc(x.level.name)}</strong><small>${esc(x.level.goal)}</small></span></button>${ready ? button(I('plus'), `hub:skill-add:${x.tree}:${x.n}`, 'icon-btn sp-step-add', `aria-label="Lägg till ${esc(x.level.name)}"${allowed(x.id) ? '' : ' disabled'}`) : ''}</li>`; }).join('')}</ol></section>`; }).join('')}
    <p class="fitness-hint">Ett steg låses upp när målets set är loggade med ren teknik i ett sparat pass. Stoppa vid smärta.</p></div>`;
}
