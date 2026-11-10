// Skill tree UI: dependency map, tree cards, level detail with animations, level setup.
import * as SK from './skills.js';
import {poseSVG, mountPlayer} from './skills-anim.js';

// The animation catalogue is computed on first use so it never slows down app start.
let moves = null, loading = null;
const loadMoves = () => moves ? Promise.resolve(moves) : (loading ||= import('./skills-moves.js').then(m => (moves = m.moves)));

export function createSkillsUI({getState, I, esc, button, bar, today, modal, commit, toast, render, startReady = () => true}) {
  const startOf = (s, id) => s.skills?.[id]?.level || 0;
  let branch = 'all';
  const state = () => SK.ensureSkills(getState());
  const STATUS = {locked: 'Förkunskap saknas', open: 'Redo att börja', progress: 'Pågår', mastered: 'Bemästrad'};
  const statName = {Strength: 'Strength', Flexibility: 'Flexibility', Discipline: 'Discipline'};
  const thumb = (l, cls = 'sk-mini') => moves?.[l.anim] ? poseSVG(moves[l.anim], moves[l.anim].key ?? 0, cls) : '';
  const focusLevel = (s, t) => t.levels[Math.min(t.levels.length - 1, SK.levelOf(s, t.id))];
  const reqText = list => list.map(m => `${esc(m.name)} nivå ${m.n} (${esc(m.level)})`).join(', ');

  // ---------- map ----------
  const X = [16, 246, 476, 706], NW = 196, NH = 66, RY = r => 46 + r * 82;
  function mapSVG(s) {
    const pos = t => [X[t.col], RY(t.row)];
    const edges = [];
    for (const t of SK.trees) for (const [id, n] of t.requires || []) {
      const from = SK.treeById[id], [x1, y1] = pos(from), [x2, y2] = pos(t), ok = SK.levelOf(s, id) >= n;
      let d;
      if (from.col === t.col) { const x = x1 + NW, a = y1 + NH / 2, b = y2 + NH / 2; d = `M${x} ${a} C${x + 34} ${a},${x + 34} ${b},${x} ${b}`; }
      else { const sx = x1 + NW, sy = y1 + NH / 2, ex = x2, ey = y2 + NH / 2, m = (sx + ex) / 2; d = `M${sx} ${sy} C${m} ${sy},${m} ${ey},${ex} ${ey}`; }
      edges.push(`<path d="${d}" class="sk-edge ${ok ? 'ok' : ''}"/>`);
    }
    const heads = ['Rörlighet', 'Grund', 'Skills', 'Avancerat'].map((h, i) => `<text x="${X[i] + 2}" y="24" class="sk-col">${h.toUpperCase()}</text>`).join('');
    const nodes = SK.trees.map(t => {
      const [x, y] = pos(t), st = SK.status(s, t), lvl = SK.levelOf(s, t.id), l = focusLevel(s, t), ratio = lvl / t.levels.length;
      const art = moves[l.anim] ? poseSVG(moves[l.anim], moves[l.anim].key ?? 0, '').replace('<svg ', `<svg x="${x + 8}" y="${y + 8}" width="62" height="${NH - 16}" preserveAspectRatio="xMidYMid meet" `) : '';
      return `<g class="sk-node ${st}" data-action="fit:sk:open:${t.id}" role="button" tabindex="0" aria-label="${esc(t.name)}, nivå ${lvl} av ${t.levels.length}, ${STATUS[st]}">
        <rect x="${x}" y="${y}" width="${NW}" height="${NH}" rx="14"/>
        <rect x="${x + 6}" y="${y + 6}" width="66" height="${NH - 12}" rx="9" class="sk-node-art"/>${art}
        <text x="${x + 82}" y="${y + 26}" class="sk-node-name">${esc(t.short || t.name)}</text>
        <text x="${x + 82}" y="${y + 43}" class="sk-node-sub">${st === 'mastered' ? '✓ Bemästrad' : st === 'locked' ? 'Låst · ' + lvl + '/' + t.levels.length : 'Nivå ' + lvl + '/' + t.levels.length}</text>
        <rect x="${x + 82}" y="${y + 51}" width="${NW - 96}" height="3" rx="1.5" class="sk-node-track"/><rect x="${x + 82}" y="${y + 51}" width="${Math.max(0, (NW - 96) * ratio)}" height="3" rx="1.5" class="sk-node-fill"/>
      </g>`;
    }).join('');
    return `<svg class="sk-map" viewBox="0 0 918 ${RY(6) + 4}" role="group" aria-label="Karta över skill-trädet">${heads}${edges.join('')}${nodes}</svg>`;
  }

  // ---------- list ----------
  function card(s, t) {
    const lvl = SK.levelOf(s, t.id), st = SK.status(s, t), next = t.levels[lvl], miss = SK.missing(s, t.requires);
    const b = SK.branches.find(b => b.id === t.branch);
    return `<section class="card sk-card ${st}" style="--cat:${b.color}">
      <button class="sk-card-art" data-action="fit:sk:open:${t.id}" aria-label="Öppna ${esc(t.name)}">${thumb(focusLevel(s, t), 'sk-card-thumb')}</button>
      <div class="sk-card-body"><div class="flex between"><span class="eyebrow">${b.name} · ${statName[t.stat]}</span><span class="level-badge">${lvl}/${t.levels.length}</span></div>
      <h3>${esc(t.name)}</h3>${bar(lvl / t.levels.length, st === 'mastered' ? 'var(--gold)' : b.color)}
      <p>${st === 'mastered' ? 'Bemästrad. Håll den vid liv med regelbunden träning.' : next ? `<strong>Nästa:</strong> ${esc(next.name)} · <span class="muted">${esc(next.goal)}</span>` : ''}</p>
      ${st === 'locked' ? `<p class="sk-req">${I('lock')} Förkunskap krävs: ${reqText(miss)}</p>` : ''}
      ${button(st === 'mastered' ? 'Se trädet' : 'Träna nästa nivå ' + I('arrow'), 'fit:sk:open:' + t.id, 'btn ghost')}</div></section>`;
  }

  function view() {
    if (!moves) { loadMoves().then(() => render()); return `<div class="card sk-loading" role="status"><span class="eyebrow">SKILL TREE</span><p class="muted">Laddar dina skill-träd…</p></div>`; }
    const s = state(), sum = SK.summary(s), pts = SK.skillStats(s), started = sum.levels > 0;
    const list = SK.trees.filter(t => branch === 'all' || t.branch === branch);
    return `<section class="card sk-hero"><div><span class="eyebrow">SKILL TREE · CALISTHENICS</span><h2>Från grund till skill.</h2>
      <p>${sum.levels} av ${sum.total} nivåer klara · ${sum.mastered} av ${sum.trees} träd bemästrade. Varje nivå stärker din karaktär.</p>
      <div class="sk-stat-row">${Object.entries(pts).map(([k, v]) => `<span class="pill">${I(k === 'Flexibility' ? 'stretch' : k === 'Discipline' ? 'bolt' : 'dumbbell')}${k} +${v}</span>`).join('')}</div>
      ${button(I('flag') + ' Ange var jag är', 'fit:sk:levels', 'btn secondary sk-levels-btn')}</div>
      <span class="pill">${I('dumbbell')} Länkat till sparade pass</span></section>
      ${started ? '' : `<div class="notice">${I('info')}<span>Välj ett steg och lägg till det i ditt pass. När alla målset är sparade och passet avslutas låses nivån upp automatiskt. Tidigare angivna nivåer finns kvar som utgångsläge. Har du redan kommit en bit? Tryck på Ange var jag är.</span></div>`}
      <div class="sk-map-wrap" tabindex="0" aria-label="Skill-trädets karta, scrolla i sidled">${mapSVG(s)}</div>
      <div class="chips">${button('Alla', 'fit:sk:branch:all', `chip ${branch === 'all' ? 'active' : ''}`)}${SK.branches.map(b => button(I(b.icon) + b.name, 'fit:sk:branch:' + b.id, `chip ${branch === b.id ? 'active' : ''}`)).join('')}</div>
      <div class="sk-grid">${list.map(t => card(s, t)).join('')}</div>
      <p class="fitness-hint">Progressionerna bygger på ${SK.SOURCES} Gå vidare när målet klaras med ren teknik. Stoppa vid smärta. Skill-nivåer ger karaktärens stats men påverkar inte XP eller rank.</p>`;
  }

  // ---------- detail ----------
  async function detail(id, focus) {
    await loadMoves();
    const s = state(), t = SK.treeById[id], lvl = SK.levelOf(s, id);
    focus ??= Math.min(t.levels.length, lvl + 1);
    const l = t.levels[focus - 1], b = SK.branches.find(b => b.id === t.branch), m = moves[l.anim];
    const treeMiss = SK.missing(s, t.requires), lvlMiss = SK.missing(s, l.requires), isNext = focus === lvl + 1, done = focus <= lvl;
    const pts = SK.levelPoints(l);
    modal(esc(t.name), `<div class="sk-detail" style="--cat:${b.color}">
      <p class="intro">${esc(t.about)}</p>
      <div class="sk-start"><div><strong>${startOf(s, id) ? `Startnivå: ${startOf(s, id)} av ${t.levels.length}` : 'Ingen startnivå angiven'}</strong><small>Har du redan kommit längre? Ange var du är, så börjar trädet därifrån.</small></div>${button(startOf(s, id) ? 'Ändra' : 'Ange min nivå', 'fit:sk:setup:' + id, 'btn secondary')}</div>
      ${treeMiss.length && lvl === 0 ? `<div class="notice">${I('info')}<span>Förkunskap krävs: ${reqText(treeMiss)}.</span></div>` : ''}
      <div class="sk-anim" data-skill-anim="${l.anim}" data-label="${esc(l.name)}"></div>
      <div class="sk-focus"><div class="flex between"><span class="pill">${done ? I('check') + ' Klar' : isNext ? 'Ditt nästa steg' : 'Senare steg'} · nivå ${focus} av ${t.levels.length}</span>${l.og ? `<span class="muted sk-og" title="Svårighetsnivå enligt Overcoming Gravity">OG ${l.og}</span>` : ''}</div>
        <h3>${esc(l.name)}${l.skill ? ' <span class="sk-skill">SKILL</span>' : ''}</h3>
        <p class="sk-goal">${I('flag')} Mål: <strong>${esc(l.goal)}</strong></p>
        <ul class="sk-cues">${l.cues.map(c => `<li>${I('check')}${esc(c)}</li>`).join('')}${l.mistakes.map(c => `<li class="bad">${I('close')}${esc(c)}</li>`).join('')}</ul>
        ${lvlMiss.length ? `<p class="sk-req">${I('lock')} Förkunskap krävs: ${reqText(lvlMiss)}</p>` : ''}
        ${(isNext||done)?button(I('plus')+' Lägg till i workout',`hub:skill-add:${id}:${focus}`,'btn full',SK.canTrain(s,id,focus)?'':'disabled'):button('Visa mitt nästa steg',`fit:sk:show:${id}:${Math.min(t.levels.length,lvl+1)}`,'btn secondary full')}<p class="fitness-hint">Upplåsning kräver ${SK.workoutGoal(l).sets} set med minst ${SK.workoutGoal(l).amount} ${SK.workoutGoal(l).unit} i samma avslutade pass, rätt variant och uppfyllda förkunskaper. Logga båda sidor och målets tempo.</p>
      </div>
      <h3 class="space">Hela progressionen</h3>
      <ol class="sk-ladder">${t.levels.map(x => {
        const st = x.n <= lvl ? 'done' : x.n === lvl + 1 ? 'next' : 'later', fromStart = x.n <= startOf(s, id);
        return `<li><button class="sk-rung ${st} ${x.n === focus ? 'focus' : ''}" data-action="fit:sk:show:${id}:${x.n}" aria-current="${x.n === focus}">
          <span class="sk-rung-art">${thumb(x)}</span><span class="sk-rung-text"><strong>${x.n}. ${esc(x.name)}${fromStart ? ' <span class="sk-start-tag">startnivå</span>' : ''}</strong><small>${esc(x.goal)}</small></span>
          <span class="sk-rung-state">${st === 'done' ? I('check') : st === 'next' ? I('arrow') : ''}</span></button></li>`;
      }).join('')}</ol>
      <p class="fitness-hint space">Nivåer från sparade pass uppdateras automatiskt. Ingen separat XP-belöning för att öppna eller visa trädet.</p>
      <p class="fitness-hint">Källor: ${SK.SOURCES}</p></div>`);
    mountAnims();
  }

  function mountAnims() {
    for (const el of document.querySelectorAll('[data-skill-anim]')) {
      if (el.dataset.mounted) continue;
      const m = moves[el.dataset.skillAnim]; if (!m) continue;
      el.dataset.mounted = '1'; mountPlayer(el, m, {label: el.dataset.label || m.title});
    }
  }

  async function action(parts) {
    const [cmd, a, b] = parts;
    switch (cmd) {
      case 'branch': branch = a; return true;
      case 'open': await detail(a); return false;
      case 'show': await detail(a, Number(b)); return false;
      case 'setup': startModal(a); return false;
      case 'levels': levelsModal(); return false;
      case 'up':case 'down':throw Error('Nya nivåer låses upp genom sparade workouts. Välj Lägg till i workout.');
    }
    return false;
  }

  // One place to set where you are in every tree, reachable straight from the Skill tree page.
  function levelsModal() {
    const s = state();
    modal('Var är du i dina skill-träd?', `<p class="intro">Välj ett träd och ange den högsta nivån du redan klarar. Då börjar trädet därifrån.</p>
      ${SK.branches.map(b => {
        const trees = SK.trees.filter(t => t.branch === b.id);
        return trees.length ? `<h3 class="sk-levels-head">${esc(b.name)}</h3><div class="sk-levels-list">${trees.map(t => {
          const lvl = SK.levelOf(s, t.id), start = startOf(s, t.id);
          return button(`<span><strong>${esc(t.name)}</strong><small>${lvl ? `Nivå ${lvl} av ${t.levels.length}` : 'Inte påbörjad'}${start ? ` · startnivå ${start}` : ''}</small></span>${I('chevron')}`, 'fit:sk:setup:' + t.id, 'sk-levels-row');
        }).join('')}</div>` : '';
      }).join('')}`);
  }

  // Self-assessed starting level: levels up to it count as done; the next level still needs a saved workout.
  function startModal(id) {
    const s = state(), t = SK.treeById[id], cur = startOf(s, id);
    const row = (n, title, sub) => `<label class="sk-start-option ${n === cur ? 'selected' : ''}"><input type="radio" name="level" value="${n}" ${n === cur ? 'checked' : ''}><span><strong>${title}</strong><small>${sub}</small></span></label>`;
    modal('Var är du i ' + esc(t.name) + '?', `<p class="intro">Välj den högsta nivån du redan klarar med ren teknik. Nivåerna upp till den räknas som klara, och nästa nivå låses upp med ett sparat pass.</p><form id="fitness-skill-setup" class="form"><input type="hidden" name="tree" value="${id}"><div class="sk-start-list">${row(0, 'Börja från början', 'Ingen nivå är klar än.')}${t.levels.map(l => row(l.n, `${l.n}. ${esc(l.name)}`, esc(l.goal))).join('')}</div><p class="fitness-hint">Startnivån är självskattad. Den ger karaktärens stats men aldrig XP eller rank.</p><p class="form-error" role="alert"></p><button class="btn full" type="submit">Spara startnivå</button></form>`);
  }
  async function submit(v) {
    if (!startReady()) throw Error('Startnivåer aktiveras med databasuppdatering 015. Ladda om appen efter aktivering.');
    const t = SK.treeById[v.tree], n = Number(v.level);
    if (!t || !Number.isInteger(n) || n < 0 || n > t.levels.length) throw Error('Välj en nivå i listan.');
    await commit(s => SK.setLevel(s, v.tree, n, today()), n ? `Startnivå sparad: ${t.levels[n - 1].name}.` : 'Startnivån är borttagen.');
    await detail(v.tree);
  }
  let thumbQueued=false;
  function workoutThumb(id){if(!moves){if(!thumbQueued){thumbQueued=true;loadMoves().then(()=>{thumbQueued=false;render();});}return '';}const e=SK.workoutById[id];return e?thumb(SK.treeById[e.skillTree].levels[e.skillLevel-1],'movement-art'):'';}

  return {view, action, submit, mountAnims,workoutThumb};
}

