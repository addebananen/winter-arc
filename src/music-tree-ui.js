// Music skill tree UI: the tree (in the Skill tree tab), a level sheet, and full-screen games.
// The games live in their own overlay outside #app so app re-renders never interrupt a round.
import * as T from './music-theory.js';
import * as M from './music-tree.js';
import * as A from './music-audio.js';
import {MUSIC_CSS} from './music-tree-css.js';
import {createPlay} from './music-play-ui.js';

// ---------- icons ----------
const P = {
  ear: 'M6.5 9.5a5.5 5.5 0 0 1 11 0c0 3.2-3.2 4.1-3.2 7.4a3 3 0 0 1-5.6 1.5M9.6 9.8a2.4 2.4 0 0 1 4.8 0c0 1.4-1.2 1.8-1.6 2.9',
  bass: 'M19 3l2 2-2.2 2.2M14.8 7.2l2-2 2 2-2 2M15.5 8.5l-6 6M9.8 12.7c-1.7-.5-3.6.1-4.5 1.6-1 1.7-.4 3.4.5 4.1.8.8 2.5 1.4 4.2.4 1.5-.9 2-2.8 1.5-4.4M7.6 16.4l.01 0',
  mic: 'M12 3.5a3 3 0 0 0-3 3v5.5a3 3 0 0 0 6 0V6.5a3 3 0 0 0-3-3zM5.8 11.5a6.2 6.2 0 0 0 12.4 0M12 17.8v3',
  play: 'M8 5.5v13l10.5-6.5z', replay: 'M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.8v3.6h3.6', lock: 'M7 11V8a5 5 0 0 1 10 0v3M5.5 11h13v9.5h-13z',
  check: 'M5 12.5l4.5 4.5L19 7.5', close: 'M6 6l12 12M18 6L6 18', arrow: 'M5 12h14M13 6l6 6-6 6', flame: 'M12 21c-4 0-6.5-2.6-6.5-6 0-3.4 3-5.4 3.5-9 2.7 1.6 4 3.6 4 5.8 1-.8 1.5-2 1.6-3.3 2 1.6 3.9 3.9 3.9 6.5 0 3.4-2.5 6-6.5 6z',
  star: 'M12 3.3l2.7 5.5 6 .9-4.35 4.2 1 6-5.35-2.8-5.35 2.8 1-6L3.3 9.7l6-.9z', shuffle: 'M3.5 7h3.8c2.4 0 3.6 1.2 4.7 3.2l1 1.6c1.1 2 2.3 3.2 4.7 3.2h2.8M17.5 5l2.5 2-2.5 2M3.5 17h3.8c1.2 0 2.1-.3 2.8-.9M14.3 7.9c.7-.6 1.6-.9 2.7-.9h3M17.5 15l2.5 2-2.5 2',
  headphones: 'M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v5H4zM17 15h3v5h-3z', note: 'M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z',
  bolt: 'M13 3L5 13.5h6l-1 7.5 8-10.5h-6z', tap: 'M9 11.5V5.2a1.6 1.6 0 0 1 3.2 0v5.3l4.3.9c1.1.2 1.8 1.2 1.7 2.3l-.5 4.2a3 3 0 0 1-3 2.6h-3.3a3 3 0 0 1-2.4-1.2l-3.2-4.4a1.5 1.5 0 0 1 2.3-1.9z', tuner: 'M4 16a8 8 0 0 1 16 0M12 16l3.5-6M4 19.5h16M12 8v1.5M6.3 10.3l1 1M17.7 10.3l-1 1', info: 'M12 8v.01M11 11h1v6h1M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
};
const ic = (n, cls = '') => `<svg class="mi ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]}"/></svg>`;
const star = on => `<svg class="mt-star ${on ? 'on' : ''}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P.star}"/></svg>`;
const stars = (n, max = 3) => `<span class="mt-stars" aria-label="${n} av ${max} stjärnor">${Array.from({length: max}, (_, i) => star(i < n)).join('')}</span>`;
const branchOf = id => M.BRANCHES.find(b => b.id === id);
const ring = (p, color, size = 52) => {
  const r = size / 2 - 3, c = 2 * Math.PI * r;
  return `<svg class="mt-ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="mt-ring-bg"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="mt-ring-fg" style="stroke:${color};stroke-dasharray:${c};stroke-dashoffset:${c * (1 - p)}"/></svg>`;
};
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = ms => new Promise(r => setTimeout(r, ms));

function injectCSS() {
  if (typeof document === 'undefined' || document.getElementById('music-tree-css')) return;
  const s = document.createElement('style'); s.id = 'music-tree-css'; s.textContent = MUSIC_CSS; document.head.appendChild(s);
}

export function createMusicTreeUI({state, commit, esc, toast, today, modal, closeModal, render}) {
  injectCSS();
  let branch = 'all';
  const S = () => { const s = state(); if (!s.musicTree) M.ensureMusicTree(s); return s; };

  // ---------------- tree view ----------------
  function nodeCard(node, i) {
    const s = S(), st = M.status(s, node), lvl = M.levelOf(s, node.id), b = branchOf(node.branch), miss = M.missing(s, node.requires);
    const starCount = node.levels.reduce((n, l) => n + M.starsOf(s, node.id, l.n), 0);
    return `<li class="mt-node ${st}" style="--c:${b.color};--i:${i}">
      <button type="button" class="mt-node-btn" data-action="mt:node:${node.id}" aria-label="${esc(node.name)}">
        <span class="mt-node-ico">${ring(lvl / node.levels.length, b.color)}<span>${st === 'locked' ? ic('lock') : st === 'mastered' ? ic('check') : ic(b.icon)}</span></span>
        <span class="mt-node-text"><strong>${esc(node.name)}</strong>
          <small>${st === 'locked' ? `<span>Kräver</span> ${miss.map(m => `<span>${esc(m.name)}</span> ${m.n}`).join(' · ')}` : `<span>Nivå</span> ${lvl}/${node.levels.length}`}</small>
          ${st === 'locked' ? '' : stars(Math.round(starCount / node.levels.length))}</span>
        <span class="mt-node-go">${st === 'locked' ? '' : ic('arrow')}</span>
      </button></li>`;
  }
  function view() {
    A.preload(); // start downloading the piano and bass recordings while the player reads the tree
    const s = S(), sum = M.summary(s), d = today(), streak = M.streak(s, d), stat = M.musicStats(s).Music, next = M.nextUp(s, branch === 'all' ? null : branch);
    const mix = M.mixPool(s, d).length >= 2, playedToday = (s.musicTree.days || []).includes(d);
    const branches = M.BRANCHES.filter(b => branch === 'all' || b.id === branch);
    return `<section class="card mt-hero">
      <div class="mt-hero-glow" aria-hidden="true"></div>
      <span class="eyebrow">Skill tree · Musik</span>
      <h2>Från första ton till egen basgång.</h2>
      <p class="muted"><span>Gehör, bas och sång i korta spel.</span> <span>Varje nivå klaras med minst 80 % rätt.</span></p>
      <div class="mt-chips">
        <span class="mt-chip">${ic('note')}<b>${sum.levels}/${sum.total}</b> <span>nivåer</span></span>
        <span class="mt-chip gold">${star(true)}<b>${sum.stars}</b> <span>stjärnor</span></span>
        <span class="mt-chip ${playedToday ? 'hot' : ''}">${ic('flame')}<b>${streak}</b> <span>dagars streak</span></span>
        <span class="mt-chip">${ic('bolt')}<span>Music</span> <b>+${stat}</b></span>
      </div>
      <div class="mt-hero-actions">
        ${next ? `<button type="button" class="btn mt-cta" data-action="mt:play:${next.node.id}:${next.n}">${ic('play')}<span class="mt-cta-text"><small>Fortsätt</small><strong><span>${esc(next.node.name)}</span> · <span>nivå</span> ${next.n}</strong></span></button>` : '<p class="muted">Alla nivåer är klara. Spela Dagens mix för att hålla allt vasst.</p>'}
        ${mix ? `<button type="button" class="btn mt-mix" data-action="mt:mix">${ic('shuffle')}<span>Dagens mix</span></button>` : ''}
      </div>
    </section>
    <div class="chips mt-filter" aria-label="Musikgrenar">${[['all', 'Alla'], ...M.BRANCHES.map(b => [b.id, b.name])].map(([k, n]) => `<button type="button" class="chip ${branch === k ? 'active' : ''}" data-action="mt:branch:${k}" aria-pressed="${branch === k}">${k === 'all' ? '' : ic(branchOf(k).icon)}${n}</button>`).join('')}</div>
    <div class="mt-branches">${branches.map(b => {
      const nodes = M.NODES.filter(n => n.branch === b.id), done = nodes.reduce((n, x) => n + M.levelOf(s, x.id), 0), total = nodes.reduce((n, x) => n + x.levels.length, 0);
      return `<section class="mt-branch" style="--c:${b.color}"><header><span class="mt-branch-ico">${ic(b.icon)}</span><div><h3>${b.name}</h3><small>${b.tagline}</small></div><span class="mt-branch-count">${done}/${total}</span></header>
        ${b.id === 'bass' ? `<button type="button" class="chip mt-tuner" data-action="mt:tuner">${ic('tuner')}<span>Stämapparat och mikrofontest</span></button>` : ''}
        <ol class="mt-path">${nodes.map(nodeCard).join('')}</ol></section>`;
    }).join('')}</div>
    <details class="mt-about"><summary>${ic('info')}<span>Så är trädet uppbyggt</span></summary>
      <p>Ordningen följer hur musiker brukar lära sig: först att höra toner i en tonart, sedan intervall, ackord och basens roll. På basen: greppbrädan, skalor, arpeggion och till sist egna basgångar. I sång: stöd, tonträff och stämsång.</p>
      <p>Dagens mix blandar nivåer du redan klarat. Blandad repetition ger bättre minne över tid än att nöta en sak i taget.</p>
      <p>Basövningarna för halsen, skalor och arpeggion spelar du på ditt instrument: mikrofonen hör vilken ton du spelar. Det fungerar med bas och gitarr. Du kan alltid trycka på skärmen i stället.</p>
      <p>Sångövningarna använder mikrofonen. Ljudet analyseras bara i telefonen och sparas inte. Sjung i bekväm styrka och vila om rösten känns trött eller hes.</p>
      <p>Nivåerna ger din karaktär Music-poäng. De påverkar inte XP eller rank.</p>
    </details>`;
  }
  const progress = () => { const x = M.summary(S()); return {done: x.levels, total: x.total}; };

  // ---------------- level sheet ----------------
  function sheet(id) {
    const s = S(), node = M.nodeById[id]; if (!node) return;
    const b = branchOf(node.branch), lvl = M.levelOf(s, id), miss = M.missing(s, node.requires);
    const voice = node.branch === 'voice' ? `<div class="mt-voice"><span class="eyebrow">Din röst</span><div class="chips">${Object.entries(T.VOICES).map(([k, v]) => `<button type="button" class="chip ${s.musicTree.voice === k ? 'active' : ''}" data-action="mt:voice:${k}:${id}" aria-pressed="${s.musicTree.voice === k}"><span>${v.name}</span></button>`).join('')}</div><p class="mt-hint">${ic('headphones')}<span>Använd gärna hörlurar. Då hör mikrofonen bara din röst.</span></p></div>` : '';
    modal(esc(node.name), `<div class="mt-sheet" style="--c:${b.color}">
      <div class="mt-sheet-head"><span class="mt-node-ico big">${ring(lvl / node.levels.length, b.color, 64)}<span>${ic(b.icon)}</span></span><div><span class="eyebrow">${b.name}</span><p><span>Nivå</span> ${lvl}/${node.levels.length}</p></div></div>
      <div class="mt-learn"><span class="eyebrow">Så funkar det</span><p>${esc(node.learn)}</p></div>
      ${miss.length ? `<div class="notice">${ic('lock')}<span><span>Lås upp genom att klara</span> ${miss.map(m => `<b>${esc(m.name)}</b> <span>nivå</span> ${m.n}`).join(', ')}.</span></div>` : ''}
      ${voice}
      <ol class="mt-ladder">${node.levels.map(l => {
        const can = M.canPlay(s, id, l.n), done = l.n <= lvl, st = M.starsOf(s, id, l.n), cur = l.n === lvl + 1 && can;
        return `<li class="mt-rung ${done ? 'done' : ''} ${cur ? 'current' : ''} ${can ? '' : 'locked'}">
          <span class="mt-rung-n">${done ? ic('check') : l.n}</span>
          <span class="mt-rung-text"><strong>${esc(l.name)}</strong><small>${esc(l.goal)}</small>${done ? stars(st) : ''}</span>
          ${can ? `<button type="button" class="mt-rung-play" data-action="mt:play:${id}:${l.n}" aria-label="${esc(l.name)}">${ic(done ? 'replay' : 'play')}</button>` : `<span class="mt-rung-lock">${ic('lock')}</span>`}
        </li>`;
      }).join('')}</ol>
    </div>`);
  }

  async function action([cmd, a, b, c]) {
    if (cmd === 'branch') { branch = a === 'all' || branchOf(a) ? a : 'all'; render(); return true; }
    if (cmd === 'node') { sheet(a); return true; }
    if (cmd === 'voice') { await commit(s => M.setVoice(s, a)); sheet(b); return true; }
    if (cmd === 'play') { closeModal?.(false); A.unlock(); await A.ready(); startLevel(a, Number(b), true); return true; }
    if (cmd === 'tuner') { A.unlock(); play.tuner(); return true; }
    if (cmd === 'mix') { A.unlock(); await A.ready(); startMix(); return true; }
    void c;
    return false;
  }

  // ---------------- game overlay ----------------
  let G = null; // current game {root, cleanup[]}
  function openOverlay() {
    closeGame();
    const root = document.createElement('div');
    root.className = 'mg'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true');
    document.body.appendChild(root); document.body.classList.add('mg-open');
    G = {root, cleanup: [], alive: true};
    root.addEventListener('click', e => { const t = e.target.closest('[data-mg]'); if (t && !t.disabled && G?.on) G.on(t.dataset.mg, t, e); });
    return G;
  }
  function closeGame() {
    if (!G) return;
    G.alive = false; for (const f of G.cleanup) try { f(); } catch {}
    A.stopAll(); A.releaseMic();
    G.root.remove(); document.body.classList.remove('mg-open'); G = null;
  }
  if (typeof document !== 'undefined') document.addEventListener('keydown', e => { if (e.key === 'Escape' && G) closeGame(); });

  function frame({title, sub, color, count, index, combo}) {
    const dots = count ? `<div class="mg-dots" aria-hidden="true">${Array.from({length: count}, (_, i) => `<i class="${i < index ? (G.results?.[i] ? 'ok' : 'bad') : i === index ? 'now' : ''}"></i>`).join('')}</div>` : '';
    return `<header class="mg-head" style="--c:${color}"><button type="button" class="mg-x" data-mg="close" aria-label="Stäng">${ic('close')}</button>
      <div class="mg-title"><small>${sub}</small><strong>${title}</strong></div>
      <span class="mg-combo ${combo >= 2 ? 'show' : ''}" aria-live="polite">${ic('flame')}<b>×${combo || 0}</b></span></header>${dots}`;
  }

  // Shared round runner: `game.ask(i)` renders question i and resolves with {ok, score?}.
  async function runRound({node, level, color, title, sub, count, ask, mix = false}) {
    const g = openOverlay(); g.results = []; g.combo = 0; g.best = 0; g.color = color;
    let points = 0;
    for (let i = 0; i < count && g.alive; i++) {
      g.index = i;
      const r = await ask(i, g);
      if (!g.alive) return;
      const ok = r.ok;
      g.results.push(ok); points += r.score ?? (ok ? 1 : 0);
      g.combo = ok ? g.combo + 1 : 0; g.best = Math.max(g.best, g.combo);
    }
    if (!g.alive) return;
    finish({node, level, score: points / count, mix, color, title, sub});
  }

  function bodyHTML(inner) { return `<div class="mg-body">${inner}</div>`; }
  function setScreen(g, head, inner) { g.root.innerHTML = `<div class="mg-card" style="--c:${g.color}">${frame({...head, count: head.count, index: g.index, combo: g.combo})}${bodyHTML(inner)}</div>`; }

  // ---------- quiz questions (ear + fretboard find) ----------
  function makeQuestion(game, R) {
    switch (game.type) {
      case 'compare': return T.compareQuestion(R, game);
      case 'degree': return T.degreeQuestion(R, game);
      case 'interval': return T.intervalQuestion(R, game);
      case 'quality': return T.qualityQuestion(R, game);
      case 'chordtone': return T.chordToneQuestion(R, game);
      case 'progression': return T.progressionQuestion(R, game);
      case 'inversion': return T.inversionQuestion(R);
      case 'fret': return T.fretQuestion(R, game);
      default: throw Error('Okänt spel.');
    }
  }
  const contextChips = q => {
    if (q.kind === 'degree') { const m = q.prompt.match(/^Tonart: (.+?)(-dur|-moll)\./); return m ? `<span class="mg-ctx"><small>Tonart</small><b>${m[1]}</b><span>${m[2] === '-dur' ? 'Dur' : 'Moll'}</span></span>` : ''; }
    if (q.kind === 'chordtone' || q.kind === 'inversion') { const m = q.prompt.match(/^(?:Ackord: )?([^ .]+)\./); return m ? `<span class="mg-ctx"><small>Ackord</small><b>${m[1]}</b></span>` : ''; }
    if (q.kind === 'progression') { const m = q.prompt.match(/^Tonart (\S+)-dur/); return m ? `<span class="mg-ctx"><small>Tonart</small><b>${m[1]}</b><span>Dur</span></span>` : ''; }
    return '';
  };
  const questionText = q => ({degree: 'Vilket skalsteg är tonen?', chordtone: 'Vilken roll har den sista tonen?', progression: 'Följ basen. Vilken ackordföljd?', inversion: 'Vilken ackordton ligger i basen?'}[q.kind] || q.prompt);
  const revealHTML = (q, ok) => {
    const right = q.options?.find(o => o.id === q.answer);
    let facts = '';
    if (q.facts) facts = `<span><small>Svar</small><b>${esc(right.label)}</b></span>` + q.facts.map(([k, v]) => `<span><small>${k}</small><b>${esc(v)}</b></span>`).join('');
    else if (q.kind === 'degree') { const m = q.reveal.match(/är (\S+)\.$/); facts = `<span><small>Skalsteg</small><b>${esc(right.label)}</b></span><span><small>Ton</small><b>${m?.[1] || ''}</b></span>`; }
    else if (q.kind === 'interval') facts = `<span><small>Intervall</small><b>${esc(right.label)}</b></span><span><small>Halvtoner</small><b>${T.semis(q.answer)}</b></span>${T.intervalSongs[q.answer] ? `<span class="wide"><small>Minnesknep</small><b>${esc(T.intervalSongs[q.answer])}</b></span>` : ''}`;
    else if (q.kind === 'quality') facts = `<span><small>Ackord</small><b>${esc(right.label)}</b></span><span><small>Toner</small><b>${esc(right.sub)}</b></span>`;
    else if (q.kind === 'chordtone') { const m = q.reveal.match(/^(\S+) är .*\((\S+)\) i (\S+)\. Basen spelar (\S+)\.$/); facts = `<span><small>Roll</small><b>${esc(right.label)}</b></span>${m ? `<span><small>Ton</small><b>${m[1]}</b></span><span><small>Skalsteg</small><b>${m[2]}</b></span><span><small>Basen</small><b>${m[4]}</b></span>` : ''}`; }
    else if (q.kind === 'progression') facts = `<span class="wide"><small>Ackord</small><b>${esc(right.sub)}</b></span>`;
    else if (q.kind === 'inversion') { const m = q.reveal.match(/Basen spelar (\S+): (\S+)\.$/); facts = `<span><small>I basen</small><b>${esc(right.label)}</b></span>${m ? `<span><small>Ackord</small><b>${m[2]}</b></span>` : ''}`; }
    else if (q.kind === 'fret') facts = `<span class="${q.played ? '' : 'wide'}"><small>Ton</small><b>${q.prompt.match(/^Hitta (\S+)/)?.[1] || ''}</b></span>${q.played ? `<span><small>Du spelade</small><b>${q.played}</b></span>` : ''}`;
    return `<div class="mg-reveal ${ok ? 'ok' : 'bad'}"><strong>${ok ? 'Rätt!' : 'Inte riktigt.'}</strong><div class="mg-facts">${facts}</div>${q.why ? `<p class="mg-why">${esc(q.why)}</p>` : ''}</div>`;
  };

  function quizLevel(node, level, mixItems) {
    const b = branchOf(node?.branch || 'ear'), R = T.rng();
    const count = mixItems ? mixItems.length : 10;
    return runRound({node, level, color: b.color, count, mix: !!mixItems,
      title: mixItems ? 'Dagens mix' : esc(level.name), sub: mixItems ? 'Blandad repetition' : `<span>${esc(node.name)}</span> · <span>nivå</span> ${level.n}`,
      ask: (i, g) => {
        const item = mixItems ? mixItems[i] : {node, level};
        let q = makeQuestion(item.level.game, R);
        // Never the same note twice in a row: a string that still rings must not answer the next question.
        for (let k = 0; k < 8 && q.kind === 'fret' && q.pc === g.lastPc; k++) q = makeQuestion(item.level.game, R);
        g.lastPc = q.kind === 'fret' ? q.pc : null;
        return q.kind === 'fret' ? fretAsk(g, q, item, mixItems) : quizAsk(g, q, item, mixItems);
      }});
  }
  function headFor(g, item, mixItems) {
    return mixItems ? {title: 'Dagens mix', sub: `<span>${esc(item.node.name)}</span> · <span>nivå</span> ${item.level.n}`, color: g.color, count: mixItems.length}
      : {title: esc(item.level.name), sub: `<span>${esc(item.node.name)}</span> · <span>nivå</span> ${item.level.n}`, color: g.color, count: 10};
  }
  function quizAsk(g, q, item, mixItems) {
    return new Promise(resolve => {
      let answered = false, playing = 0;
      // "How to think": the node's listening steps. Open on the very first question of a node you have not cleared yet.
      const steps = item.node.listen || [], openHow = !mixItems && g.index === 0 && M.levelOf(S(), item.node.id) === 0;
      const hear = async (events = q.play) => {
        const pad = g.root.querySelector('.mg-listen'); pad?.classList.add('playing');
        A.stopAll(); const id = ++playing, end = A.play(events, {bpm: q.kind === 'progression' ? 96 : 80});
        await wait(Math.max(300, (end - A.now()) * 1000));
        if (id === playing) pad?.classList.remove('playing');
      };
      setScreen(g, headFor(g, item, mixItems), `
        <div class="mg-prompt">${contextChips(q)}<h2>${questionText(q)}</h2></div>
        <button type="button" class="mg-listen" data-mg="hear" aria-label="Lyssna igen"><span class="mg-pulse"></span><span class="mg-pulse two"></span>${ic('play')}<span class="mg-eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span></button>
        <div class="mg-sub-actions">${steps.length ? `<button type="button" class="chip ${openHow ? 'active' : ''}" data-mg="how" aria-expanded="${openHow}">${ic('bolt')}<span>Så tänker du</span></button>` : ''}${q.home ? `<button type="button" class="chip" data-mg="home">${ic('note')}<span>Hemtonen</span></button>` : ''}${q.help && q.way ? `<button type="button" class="chip" data-mg="way">${ic('arrow')}<span>Vägen hem</span></button>` : ''}${q.replay !== q.play ? `<button type="button" class="chip" data-mg="replay">${ic('replay')}<span>${q.kind === 'degree' || q.kind === 'compare' ? 'Bara tonen' : 'Bara basen och tonen'}</span></button>` : ''}</div>
        ${steps.length ? `<div class="mg-how" ${openHow ? '' : 'hidden'}><ol>${steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol>${item.level.tip ? `<p>${esc(item.level.tip)}</p>` : ''}</div>` : ''}
        <div class="mg-options ${q.options.length > 4 ? 'many' : ''} ${q.kind === 'progression' ? 'wide' : ''}">${q.options.map(o => `<button type="button" class="mg-opt" data-mg="ans:${o.id}"><strong>${esc(o.label)}</strong>${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</button>`).join('')}</div>
        <div class="mg-after"></div>`);
      hear();
      g.on = (cmd, el) => {
        if (cmd === 'close') return closeGame();
        if (cmd === 'hear') return hear(q.play);
        if (cmd === 'replay') return hear(q.replay);
        if (cmd === 'home' && q.home) return hear(q.home);
        if (cmd === 'way' && q.way) return hear(q.way);
        if (cmd === 'how') { const box = g.root.querySelector('.mg-how'); if (box) { box.hidden = !box.hidden; el.classList.toggle('active', !box.hidden); el.setAttribute('aria-expanded', String(!box.hidden)); } return; }
        if (cmd === 'next') { g.on = null; return resolve({ok: g._ok}); }
        if (cmd.startsWith('ans:') && !answered) {
          answered = true; const id = cmd.slice(4), ok = id === q.answer; g._ok = ok;
          for (const b of g.root.querySelectorAll('.mg-opt')) { b.disabled = true; const bid = b.dataset.mg.slice(4); if (bid === q.answer) b.classList.add('right'); else if (b === el) b.classList.add('wrong'); }
          feedback(g, ok, el);
          g.root.querySelector('.mg-after').innerHTML = revealHTML(q, ok) + `<button type="button" class="btn mg-next" data-mg="next"><span>Nästa</span>${ic('arrow')}</button>`;
          if (!ok) setTimeout(() => G === g && hear(q.after || q.replay), 500);
        }
      };
    });
  }

  // Correct/wrong juice: sound, combo, floating label, shake.
  function feedback(g, ok, el) {
    const combo = ok ? g.combo + 1 : 0;
    A.sfx(ok ? (combo >= 3 ? 'combo' : 'right') : 'wrong');
    if (el) {
      el.classList.add(ok ? 'pop' : 'shake');
      if (ok) { const f = document.createElement('span'); f.className = 'mg-float'; f.textContent = combo >= 2 ? `×${combo}` : '+1'; el.appendChild(f); }
    }
    const c = g.root.querySelector('.mg-combo');
    if (c) { c.querySelector('b').textContent = '×' + combo; c.classList.toggle('show', combo >= 2); c.classList.remove('bump'); void c.offsetWidth; if (combo >= 2) c.classList.add('bump'); }
    navigator.vibrate?.(ok ? 12 : [20, 40, 20]);
  }

  // ---------- fretboard ----------
  function fretboard({frets = [0, 12], marks = {}, root = null, strings = [0, 1, 2, 3], dim = false}) {
    const cols = [];
    for (let f = frets[0]; f <= frets[1]; f++) cols.push(f);
    const inlay = f => [3, 5, 7, 9, 15].includes(f) ? 'dot' : f === 12 ? 'dbl' : '';
    return `<div class="mg-board ${dim ? 'dim' : ''}" style="--cols:${cols.length}">
      <div class="mg-frets">${cols.map(f => `<span class="${inlay(f)}">${f}</span>`).join('')}</div>
      ${[3, 2, 1, 0].map(s => `<div class="mg-string s${s} ${strings.includes(s) ? '' : 'off'}"><b>${T.STRINGS[s].name}</b>${cols.map(f => {
        const k = s + ':' + f, m = marks[k], isRoot = root && root[0] === s && root[1] === f;
        return `<button type="button" class="mg-fret ${f === 0 ? 'open' : ''} ${m ? 'm-' + m.cls : ''} ${isRoot ? 'root' : ''}" data-mg="fret:${s}:${f}" ${strings.includes(s) ? '' : 'disabled'} aria-label="${T.STRINGS[s].name} ${f}">${m?.label ? `<i>${esc(m.label)}</i>` : isRoot ? '<i>1</i>' : ''}</button>`;
      }).join('')}</div>`).join('')}
    </div>`;
  }
  function fretAsk(g, q, item, mixItems) {
    return new Promise(resolve => {
      const name = q.prompt.match(/^Hitta (\S+)/)[1], on = q.prompt.match(/på (\S)-strängen/)?.[1];
      // Play the note on a real bass or guitar, or tap it. Dagens mix blends in listening questions, so it stays tap only.
      const ctl = mixItems ? null : play.instrument(g);
      let done = false, shown = {}, timer = 0;
      const draw = (marks = shown) => {
        shown = marks;
        // Keep the neck where the player left it, so the answer they tapped stays in view.
        const keep = g.root.querySelector('.mg-board')?.scrollLeft || 0;
        setScreen(g, headFor(g, item, mixItems), `<div class="mg-prompt"><h2><span>${ctl?.mode === 'mic' ? 'Spela' : 'Hitta'}</span> <b class="mg-big">${name}</b></h2>${on ? `<p class="muted">${on}-<span>strängen</span></p>` : '<p class="muted">Var som helst på halsen</p>'}</div>
          ${fretboard({frets: q.frets, strings: q.strings, marks})}${ctl && !done ? ctl.bar() : ''}<div class="mg-after"></div>`);
        const board = g.root.querySelector('.mg-board'); if (board) board.scrollLeft = keep;
      };
      const next = () => { clearTimeout(timer); g.on = null; if (ctl) ctl.handlers = null; resolve({ok: g._ok}); };
      const answer = (midi, spot, played) => {
        if (done) return;
        done = true; const ok = T.pcOf(midi) === q.pc; g._ok = ok;
        const marks = {}; for (const [ss, ff] of q.answer) marks[ss + ':' + ff] = {cls: 'right', label: name};
        if (!ok && spot) marks[spot] = {cls: 'wrong', label: T.pcName(midi)};
        draw(marks);
        feedback(g, ok, spot ? g.root.querySelector(`[data-mg="fret:${spot}"]`) : g.root.querySelector('.mg-big'));
        g.root.querySelector('.mg-after').innerHTML = revealHTML(played && !ok ? {...q, played: T.pcName(midi)} : q, ok) + `<button type="button" class="btn mg-next" data-mg="next"><span>Nästa</span>${ic('arrow')}</button>`;
        // With the instrument in your hands the round moves on by itself.
        if (played) timer = setTimeout(() => G === g && g.on && next(), ok ? 1300 : 3200);
      };
      if (ctl) { ctl.redraw = () => draw(); ctl.handlers = {expect: () => done ? null : q.pc, hit: ev => answer(ev.midi, null, true), miss: midi => answer(midi, null, true)}; }
      draw({}); ctl?.start();
      g.on = cmd => {
        if (cmd === 'close') return closeGame();
        if (cmd === 'input') return ctl?.toggle();
        if (cmd === 'next') return next();
        if (cmd.startsWith('fret:') && !done) {
          const [, s, f] = cmd.split(':').map(Number), midi = T.fretMidi(s, f);
          A.note(midi, .9, 'bass');
          answer(midi, s + ':' + f, false);
        }
      };
    });
  }

  // ---------- bass line builder ----------
  function basslineLevel(node, level) {
    const b = branchOf(node.branch), rule = level.game.rule, R = T.rng();
    const line = T.bassChords(R, rule === 'root' || rule === 'root5' ? R.pick(['three', 'pop']) : 'pop');
    if (line.chords.length < 4) while (line.chords.length < 4) line.chords.push(line.chords[line.chords.length % 3]);
    const picks = Array(16).fill(null);
    let sel = 0, graded = null, stopLoop = null;
    const g = openOverlay(); g.color = b.color; g.results = []; g.combo = 0; g.index = 0;
    const bpm = rule === 'walk' ? 96 : 88;
    // Early rules only offer chord tones, so the choice teaches the rule instead of hiding it.
    const choicesFor = i => T.beatChoices(line, Math.floor(i / 4), i % 4).filter(x => x.role === 'chord' || rule === 'walk' || (rule === 'approach' && i % 4 === 3));
    const lineEvents = (useModel) => {
      const p = useModel ? model() : picks, ev = [];
      line.chords.forEach((c, bar) => {
        const r = T.midiOf(c.root), tones = T.CHORDS[c.q].tones.map(t => r + T.semis(t)).map(n => n < 55 ? n + 12 : n > 67 ? n - 12 : n);
        ev.push({t: bar * 4, notes: tones, dur: 3.9, inst: 'keys', vel: .32}, ...T_drum(bar));
      });
      // The bass plays what is graded: a walking line is voiced to the nearest octave.
      const notes = p.map((id, i) => T.beatChoices(line, Math.floor(i / 4), i % 4).find(x => x.id === id)?.midi ?? null);
      (rule === 'walk' ? T.voiceLine(notes) : notes).forEach((m, i) => { if (m != null) ev.push({t: i, notes: [m], dur: .92, inst: 'bass'}); });
      return ev;
    };
    const T_drum = bar => A.drumBar(bar);
    function model() {
      const pat = {root: ['R', 'R', 'R', 'R'], root5: ['R', 'R', '5', '5'], triad: ['R', '3', '5', '8'], approach: ['R', '3', '5', 'a-'], walk: ['R', '2', '3', 'a-']}[rule];
      return line.chords.flatMap(() => pat);
    }
    function loop(useModel) {
      stopLoop?.(); A.stopAll();
      const ev = lineEvents(useModel), start = A.now() + .08, end = A.play(ev, {bpm, at: start - .06});
      const spb = 60 / bpm; let raf = 0, alive = true;
      const tick = () => {
        if (!alive || !G) return;
        const beat = Math.floor((A.now() - start) / spb);
        for (const el of g.root.querySelectorAll('.mg-slot')) el.classList.toggle('beat', Number(el.dataset.i) === beat);
        if (A.now() < end) raf = requestAnimationFrame(tick); else { alive = false; for (const el of g.root.querySelectorAll('.mg-slot.beat')) el.classList.remove('beat'); setPlaying(false); }
      };
      raf = requestAnimationFrame(tick); setPlaying(true);
      stopLoop = () => { alive = false; cancelAnimationFrame(raf); };
      g.cleanup.push(() => stopLoop?.());
    }
    const setPlaying = on => g.root.querySelector('[data-mg="listen"]')?.classList.toggle('on', on);
    function draw() {
      const filled = picks.every(Boolean);
      const ch = choicesFor(sel);
      g.root.innerHTML = `<div class="mg-card" style="--c:${b.color}">${frame({title: esc(level.name), sub: `<span>${esc(node.name)}</span> · <span>nivå</span> ${level.n}`, color: b.color, combo: 0})}
      <div class="mg-body">
        <div class="mg-prompt"><span class="mg-ctx"><small>Tonart</small><b>${line.key}</b><span>Dur</span></span><p class="mg-rule">${esc(T.BASS_RULES[rule].text)}</p></div>
        <div class="mg-bars">${line.chords.map((c, bar) => `<div class="mg-bar"><div class="mg-chord"><b>${c.name}</b><small>${c.deg}</small></div><div class="mg-slots">${[0, 1, 2, 3].map(beat => {
          const i = bar * 4 + beat, p = picks[i], choice = p && choicesFor(i).find(x => x.id === p), flag = graded ? (graded.flags[i] ? 'ok' : 'bad') : '';
          return `<button type="button" class="mg-slot ${i === sel && !graded ? 'sel' : ''} ${p ? 'set' : ''} ${flag}" data-mg="slot:${i}" data-i="${i}" aria-label="Takt ${bar + 1} slag ${beat + 1}">${choice ? `<b>${choice.label}</b><small>${choice.id === 'R' ? '1' : choice.id.startsWith('a') ? '→' : choice.id}</small>` : `<small>${beat + 1}</small>`}</button>`;
        }).join('')}</div></div>`).join('')}</div>
        ${graded ? '' : `<div class="mg-choices"><span class="eyebrow"><span>Takt</span> ${Math.floor(sel / 4) + 1} · <span>slag</span> ${sel % 4 + 1}</span><div class="mg-chip-row">${ch.map(x => `<button type="button" class="mg-choice ${x.role}" data-mg="pick:${x.id}"><b>${x.label}</b><small>${esc(x.sub)}</small></button>`).join('')}</div></div>`}
        <div class="mg-row">
          <button type="button" class="btn ghost mg-listen-btn" data-mg="listen">${ic('play')}<span>Lyssna</span></button>
          ${graded ? `<button type="button" class="btn ghost" data-mg="model">${ic('note')}<span>Hör ett exempel</span></button>` : `<button type="button" class="btn" data-mg="grade" ${filled ? '' : 'disabled'}>${ic('check')}<span>Rätta</span></button>`}
        </div>
        ${graded ? `<div class="mg-reveal ${graded.score >= .8 ? 'ok' : 'bad'}"><strong>${Math.round(graded.score * 100)} %</strong><p>${graded.score >= .8 ? 'Snyggt. Lyssna hur basen binder ihop ackorden.' : 'Röda slag bryter mot regeln. Jämför med exemplet.'}</p></div><button type="button" class="btn mg-next" data-mg="done"><span>Se resultat</span>${ic('arrow')}</button>` : ''}
      </div></div>`;
    }
    draw();
    g.on = (cmd) => {
      if (cmd === 'close') return closeGame();
      if (cmd === 'listen') return loop(false);
      if (cmd === 'model') return loop(true);
      if (cmd.startsWith('slot:') && !graded) { sel = Number(cmd.slice(5)); const p = picks[sel]; const c = p && choicesFor(sel).find(x => x.id === p); if (c) A.note(c.midi, .5, 'bass'); return draw(); }
      if (cmd.startsWith('pick:') && !graded) {
        const id = cmd.slice(5), c = choicesFor(sel).find(x => x.id === id); picks[sel] = id; A.note(c.midi, .55, 'bass');
        const nextEmpty = picks.findIndex((p, i) => !p && i > sel); sel = nextEmpty >= 0 ? nextEmpty : Math.min(15, sel + 1);
        return draw();
      }
      if (cmd === 'grade') { graded = T.gradeBassLine(line, picks, rule); A.sfx(graded.score >= .8 ? 'combo' : 'wrong'); draw(); loop(false); return; }
      if (cmd === 'done') { stopLoop?.(); A.stopAll(); g.on = null; finish({node, level, score: graded.score, color: b.color}); }
    };
  }

  // ---------- rhythm ----------
  function rhythmLevel(node, level) {
    const b = branchOf(node.branch), {pattern, bpm} = level.game, pat = T.RHYTHMS[pattern], spb = 60 / bpm, bars = 4;
    const g = openOverlay(); g.color = b.color; g.results = []; g.combo = 0; g.index = 0;
    let taps = [], start = 0, running = false, raf = 0, targets = [];
    const lat = () => (A.unlock()?.outputLatency || A.unlock()?.baseLatency || .02);
    function draw(result) {
      g.root.innerHTML = `<div class="mg-card" style="--c:${b.color}">${frame({title: esc(level.name), sub: `<span>${esc(node.name)}</span> · <span>nivå</span> ${level.n}`, color: b.color, combo: 0})}
      <div class="mg-body">
        <div class="mg-prompt"><span class="mg-ctx"><small>Tempo</small><b>${bpm}</b><span>bpm</span></span><h2>${esc(pat.name)}</h2><p class="muted">Ett takts inräkning, sedan fyra takter. Tryck på plattan på varje markerad ton.</p></div>
        <div class="mg-grid">${[0, 1, 2, 3].map(beat => `<span class="mg-beat"><small>${beat + 1}</small></span>`).join('')}${pat.hits.map(h => `<i class="mg-hit" style="left:${h / 4 * 100}%"></i>`).join('')}<span class="mg-head-line"></span></div>
        <button type="button" class="mg-pad" data-mg="pad" aria-label="Tryck i takt"><span class="mg-pad-ring"></span><b>${running ? 'TRYCK' : result ? Math.round(result.score * 100) + ' %' : 'REDO'}</b><small class="mg-pad-fb"></small></button>
        ${result ? `<div class="mg-reveal ${result.score >= .8 ? 'ok' : 'bad'}"><div class="mg-facts"><span><small>Träffar</small><b>${result.hit}/${result.total}</b></span><span><small>Perfekta</small><b>${result.perfect}</b></span><span><small>Snittfel</small><b>${result.avg ?? '–'} ms</b></span><span><small>Extra tryck</small><b>${result.extra}</b></span></div></div>` : ''}
        <div class="mg-row">${running ? '' : `<button type="button" class="btn ghost" data-mg="demo">${ic('note')}<span>Hör mönstret</span></button><button type="button" class="btn" data-mg="start">${ic('play')}<span>${result ? 'Försök igen' : 'Starta'}</span></button>`}${result && !running ? `<button type="button" class="btn mg-next" data-mg="done"><span>Se resultat</span>${ic('arrow')}</button>` : ''}</div>
      </div></div>`;
    }
    const events = (withBass) => {
      const ev = [];
      for (let bar = 0; bar < bars + 1; bar++) for (let beat = 0; beat < 4; beat++) ev.push({t: bar * 4 + beat, inst: 'click', accent: beat === 0});
      if (withBass) for (let bar = 1; bar <= bars; bar++) for (const h of pat.hits) ev.push({t: bar * 4 + h, notes: [33], dur: .4, inst: 'bass'});
      return ev;
    };
    let best = null;
    function run() {
      taps = []; running = true; draw();
      A.stopAll(); start = A.now() + .1; A.play(events(false), {bpm, at: start - .06});
      targets = []; for (let bar = 1; bar <= bars; bar++) for (const h of pat.hits) targets.push((start + (bar * 4 + h) * spb) * 1000);
      const end = start + (bars + 1) * 4 * spb;
      const head = g.root.querySelector('.mg-head-line'), beatEls = g.root.querySelectorAll('.mg-beat');
      const tick = () => {
        if (!G || !g.alive) return;
        const pos = (A.now() - start) / spb, inBar = ((pos % 4) + 4) % 4;
        if (head) head.style.left = (inBar / 4 * 100) + '%';
        beatEls.forEach((el, i) => el.classList.toggle('on', Math.floor(inBar) === i && pos >= 0));
        const pad = g.root.querySelector('.mg-pad b'); if (pad) pad.textContent = pos < 4 ? String(Math.max(1, Math.ceil(4 - pos))) : 'TRYCK';
        if (A.now() < end + .25) raf = requestAnimationFrame(tick);
        else { running = false; const r = T.gradeTaps(taps, targets, spb * 1000); best = !best || r.score > best.score ? r : best; A.sfx(r.score >= .8 ? 'combo' : 'wrong'); draw(r); }
      };
      raf = requestAnimationFrame(tick); g.cleanup.push(() => cancelAnimationFrame(raf));
    }
    draw();
    const onDown = e => {
      const pad = e.target.closest('.mg-pad'); if (!pad || !running) return;
      e.preventDefault();
      if ((A.now() - start) / spb < 3.5) return; // count-in bar: listen first
      const t = (A.now() - lat()) * 1000; taps.push(t);
      let d = Infinity; for (const x of targets) if (Math.abs(t - x) < Math.abs(d)) d = t - x;
      const fb = pad.querySelector('.mg-pad-fb'), win = Math.min(160, spb * 300);
      const label = Math.abs(d) <= win * .4 ? 'Perfekt' : Math.abs(d) <= win ? (d < 0 ? 'Tidig' : 'Sen') : 'Miss';
      if (fb) { fb.textContent = label; fb.className = 'mg-pad-fb ' + (label === 'Perfekt' ? 'ok' : label === 'Miss' ? 'bad' : ''); }
      pad.classList.remove('hit'); void pad.offsetWidth; pad.classList.add('hit');
      A.note(33, .25, 'bass');
    };
    g.root.addEventListener('pointerdown', onDown);
    g.on = cmd => {
      if (cmd === 'close') return closeGame();
      if (cmd === 'demo') return A.stopAll(), A.play(events(true).filter(e => e.inst !== 'click' || e.t >= 4).map(e => ({...e, t: e.t - 4})).filter(e => e.t < 8), {bpm});
      if (cmd === 'start') return run();
      if (cmd === 'done') { g.on = null; finish({node, level, score: best.score, color: b.color}); }
    };
  }

  // ---------- voice: breath, pitch, harmony ----------
  function micScreen(g, head, inner) {
    g.root.innerHTML = `<div class="mg-card" style="--c:${g.color}">${frame({...head, combo: 0})}<div class="mg-body">${inner}</div></div>`;
  }
  function micError(g, head, err) {
    micScreen(g, head, `<div class="mg-prompt"><h2>Mikrofonen behövs</h2><p class="muted">${esc(err.message || 'Kunde inte starta mikrofonen.')}</p></div><div class="mg-row"><button type="button" class="btn" data-mg="close">${ic('close')}<span>Tillbaka</span></button></div>`);
    g.on = cmd => cmd === 'close' && closeGame();
  }

  function breathLevel(node, level) {
    const b = branchOf(node.branch), game = level.game, head = {title: esc(level.name), sub: `<span>${esc(node.name)}</span> · <span>nivå</span> ${level.n}`, color: b.color};
    const g = openOverlay(); g.color = b.color; g.results = []; g.combo = 0;
    if (game.mode === 'guided') return guidedBreath(g, head, node, level);
    micScreen(g, head, `<div class="mg-prompt"><h2>${game.mode === 'hiss' ? 'Säg ett jämnt ”sss”' : 'Sjung en bekväm ton på ”a”'}</h2><p class="muted"><span>Mål</span>: ${game.seconds} <span>sekunder</span>. <span>${game.mode === 'hiss' ? 'Andas in lågt, håll revbenen ute och släpp luften långsamt.' : 'Lika stark och lika hög hela vägen.'}</span></p></div>
      <div class="mg-breath"><div class="mg-orb"><span class="mg-orb-fill"></span><b>0.0</b><small>sek</small></div><div class="mg-meter"><i class="mg-meter-band"></i><i class="mg-meter-lvl"></i></div></div>
      <p class="mg-status muted">Tryck på Starta. Var tyst en sekund medan appen lyssnar på rummet.</p>
      <div class="mg-row"><button type="button" class="btn" data-mg="start">${ic('mic')}<span>Starta</span></button></div>`);
    let stop = null, best = 0;
    g.cleanup.push(() => stop?.());
    async function start() {
      const status = g.root.querySelector('.mg-status'), orb = g.root.querySelector('.mg-orb'), num = orb.querySelector('b'), fill = orb.querySelector('.mg-orb-fill'), lvl = g.root.querySelector('.mg-meter-lvl'), band = g.root.querySelector('.mg-meter-band');
      g.root.querySelector('.mg-row').innerHTML = '';
      let phase = 'calib', calib = [], thr = .02, full = 0, startT = 0, vals = [], quiet = 0, cents = [];
      const finishTry = () => {
        stop?.(); stop = null;
        const dur = startT ? (vals.length ? vals[vals.length - 1].t - startT : 0) : 0;
        const amps = vals.map(v => v.rms), mean = amps.reduce((a, x) => a + x, 0) / (amps.length || 1);
        const cv = amps.length ? Math.sqrt(amps.reduce((a, x) => a + (x - mean) ** 2, 0) / amps.length) / (mean || 1) : 1;
        const pitchSpread = cents.length > 5 ? Math.sqrt(cents.reduce((a, x) => a + x * x, 0) / cents.length) : 0;
        const steady = Math.max(0, Math.min(1, 1 - Math.max(0, cv - .12) * 1.6 - (game.mode === 'tone' ? Math.max(0, pitchSpread - 15) / 80 : 0)));
        const reached = Math.min(1, dur / game.seconds), score = reached < 1 ? .79 * reached : .8 + .2 * steady;
        best = Math.max(best, score);
        orb.classList.remove('live'); A.sfx(score >= .8 ? 'combo' : 'wrong');
        status.innerHTML = `<span class="mg-facts"><span><small>Tid</small><b>${dur.toFixed(1)} s</b></span><span><small>Jämnhet</small><b>${Math.round(steady * 100)} %</b></span></span>`;
        g.root.querySelector('.mg-row').innerHTML = `<button type="button" class="btn ghost" data-mg="start">${ic('replay')}<span>Igen</span></button><button type="button" class="btn mg-next" data-mg="done"><span>Se resultat</span>${ic('arrow')}</button>`;
      };
      try {
        stop = await A.listen(f => {
          if (!G || G !== g) return;
          lvl.style.height = Math.min(100, (full ? f.rms / full : f.level) * 100) + '%';
          if (phase === 'calib') {
            calib.push(f.rms);
            if (calib.length > 30) { thr = Math.max(.0002, (calib.reduce((a, x) => a + x, 0) / calib.length) * 3); full = thr * 6; band.style.bottom = '16.7%'; phase = 'wait'; status.textContent = game.mode === 'hiss' ? 'Andas in lågt… och börja sss.' : 'Andas in lågt… och sjung.'; }
            return;
          }
          const voiced = game.mode === 'hiss' ? f.rms > thr && f.clarity < .85 : f.rms > thr && f.freq && f.clarity > .7;
          if (phase === 'wait' && voiced) { phase = 'run'; startT = f.t; orb.classList.add('live'); status.textContent = 'Håll det jämnt…'; }
          if (phase === 'run') {
            if (voiced) { quiet = 0; vals.push({t: f.t, rms: f.rms}); if (game.mode === 'tone' && f.freq) { if (!cents.base) cents.base = f.freq; cents.push(1200 * Math.log2(f.freq / cents.base)); } }
            else if (++quiet > 12) {
              // A short blip (a cough, a click) is not an attempt: keep listening.
              if (f.t - startT < 1.2) { phase = 'wait'; vals = []; cents = []; startT = 0; quiet = 0; orb.classList.remove('live', 'goal'); num.textContent = '0.0'; fill.style.transform = 'scaleY(0)'; return; }
              phase = 'end'; finishTry(); return;
            }
            const dur = f.t - startT; num.textContent = dur.toFixed(1);
            fill.style.transform = `scaleY(${Math.min(1, dur / game.seconds)})`;
            if (dur >= game.seconds && !orb.classList.contains('goal')) { orb.classList.add('goal'); A.sfx('star'); }
            if (dur > game.seconds * 2.5) { phase = 'end'; finishTry(); }
          }
        });
      } catch (e) { micError(g, head, e); }
    }
    g.on = cmd => {
      if (cmd === 'close') return closeGame();
      if (cmd === 'start') { stop?.(); return start(); }
      if (cmd === 'done') { g.on = null; finish({node, level, score: best, color: b.color}); }
    };
  }

  function guidedBreath(g, head, node, level) {
    const cycles = level.game.cycles || 4;
    micScreen(g, head, `<div class="mg-prompt"><h2>Låg andning</h2><p class="muted">En hand på magen, en på bröstet. Andas in genom näsan när cirkeln växer och säg ett mjukt ”sss” när den krymper.</p></div>
      <div class="mg-breath"><div class="mg-lung"><span></span><b>Redo</b></div></div><p class="mg-status muted"><span>Andetag</span> 0/${cycles}</p>
      <div class="mg-row"><button type="button" class="btn" data-mg="start">${ic('play')}<span>Starta</span></button></div>`);
    let running = false;
    async function run() {
      running = true; g.root.querySelector('.mg-row').innerHTML = '';
      const lung = g.root.querySelector('.mg-lung'), label = lung.querySelector('b'), st = g.root.querySelector('.mg-status');
      for (let i = 0; i < cycles && G === g; i++) {
        st.innerHTML = `<span>Andetag</span> ${i + 1}/${cycles}`;
        lung.className = 'mg-lung in'; label.textContent = 'Andas in'; A.play([{t: 0, notes: [57], dur: 1, inst: 'keys', vel: .25}], {bpm: 60}); await wait(4000); if (G !== g) return;
        lung.className = 'mg-lung hold'; label.textContent = 'Håll ute'; await wait(1500); if (G !== g) return;
        lung.className = 'mg-lung out'; label.textContent = 'Sss…'; A.play([{t: 0, notes: [52], dur: 1, inst: 'keys', vel: .2}], {bpm: 60}); await wait(6000); if (G !== g) return;
      }
      lung.className = 'mg-lung'; label.textContent = 'Klart'; A.sfx('clear');
      st.textContent = 'Rörde sig magen och sidorna mer än bröstet och axlarna?';
      g.root.querySelector('.mg-row').innerHTML = `<button type="button" class="btn ghost" data-mg="self:0">Inte än</button><button type="button" class="btn" data-mg="self:1">${ic('check')}<span>Ja</span></button>`;
      running = false;
    }
    g.on = cmd => {
      if (cmd === 'close') return closeGame();
      if (cmd === 'start' && !running) return run();
      if (cmd === 'self:1') { g.on = null; finish({node, level, score: 1, color: g.color}); }
      if (cmd === 'self:0') { g.root.querySelector('.mg-status').textContent = 'Prova liggande på rygg med en bok på magen. Boken ska lyftas när du andas in.'; g.root.querySelector('.mg-row').innerHTML = `<button type="button" class="btn" data-mg="start">${ic('replay')}<span>Igen</span></button>`; }
    };
  }

  // Sing targets one at a time. Each target: hold within ±TOL cents for HOLD seconds, 10 s timeout.
  // The level is judged against the room noise, never a fixed number: a phone microphone is far quieter than a computer's.
  const TOL = 50, HOLD = .4;
  function singLevel(node, level) {
    const b = branchOf(node.branch), game = level.game, s = S(), voice = T.VOICES[s.musicTree.voice] || T.VOICES.mid;
    const head = {title: esc(level.name), sub: `<span>${esc(node.name)}</span> · <span>nivå</span> ${level.n}`, color: b.color};
    const g = openOverlay(); g.color = b.color; g.results = []; g.combo = 0;
    const R = T.rng(), home = voice.home;
    // Build rounds: [{ref: events to play first, targets:[midi], label}]
    const rounds = [];
    const fit = list => { const lo = Math.min(...list), hi = Math.max(...list); let shift = 0; if (home + lo < voice.range[0]) shift = voice.range[0] - (home + lo); if (home + hi + shift > voice.range[1]) shift -= home + hi + shift - voice.range[1]; return shift; };
    if (game.type === 'pitch') for (const pat of game.pattern) {
      const shift = fit(pat) + R.pick([-2, 0, 0, 2]), notes = pat.map(x => home + x + shift);
      rounds.push({ref: notes.map((n, i) => ({t: i * .8, notes: [n], dur: .75, inst: 'keys'})), targets: notes, names: notes.map(n => T.pcName(n)), label: 'Lyssna, sjung sedan samma toner.'});
    } else {
      const role = game.role, picks = role === 'third-over' ? [0, 2, 4, 5, 7] : [0, 1, 2, 3, 4];
      for (const k of R.shuffle(picks).slice(0, 4)) {
        if (role === 'third-over') {
          const scale = [0, 2, 4, 5, 7, 9, 11, 12, 14], idx = [0, 2, 4, 5, 7].indexOf(k), deg = [0, 1, 2, 3, 4][idx];
          const root = home - 5, mel = root + scale[deg], tgt = root + scale[deg + 2];
          rounds.push({ref: [{t: 0, notes: [root, root + 4, root + 7], dur: 1.2, inst: 'keys', vel: .4}, {t: 1.4, notes: [mel], dur: 1.6, inst: 'keys'}], drone: mel, targets: [tgt], names: [T.pcName(tgt)], label: 'Sjung en ters över tonen.'});
        } else {
          const root = voice.range[0] + 2 + k, q = game.minor ? 'min' : 'maj', chord = T.CHORDS[q].tones.map(t => root + T.semis(t));
          const tgt = root + T.semis(role);
          rounds.push({ref: [{t: 0, notes: [root - 12], dur: 1.6, inst: 'bass'}, {t: 0, notes: chord, dur: 1.6, inst: 'keys', vel: .45}, {t: 2, notes: [root], dur: 1.4, inst: 'keys'}], drone: root, targets: [tgt], names: [T.pcName(tgt)],
            label: role === '1' ? 'Sjung ackordets grundton.' : role === '5' ? 'Sjung kvinten över grundtonen.' : 'Sjung tersen över grundtonen.'});
        }
      }
    }
    const total = rounds.reduce((n, r) => n + r.targets.length, 0);
    let ri = 0, ti = 0, hits = 0, stop = null, phones = false, deaf = 0, began = 0;
    g.cleanup.push(() => stop?.());
    function draw() {
      const r = rounds[ri];
      micScreen(g, {...head, count: rounds.length}, `<div class="mg-prompt"><h2>${r.label}</h2><p class="muted"><span>Omgång</span> ${ri + 1}/${rounds.length}</p></div>
        <div class="mg-targets">${r.names.map((n, i) => `<span class="${i < ti ? 'done' : i === ti ? 'now' : ''}">${n}</span>`).join('')}</div>
        <div class="mg-tuner"><canvas width="600" height="260" aria-hidden="true"></canvas><div class="mg-tuner-label"><b>–</b><small>Sjung</small></div></div>
        <p class="mg-status muted"></p>
        <div class="mg-row"><button type="button" class="btn ghost" data-mg="ref">${ic('replay')}<span>Lyssna igen</span></button>${game.type === 'harmony' ? `<button type="button" class="chip ${phones ? 'active' : ''}" data-mg="phones" aria-pressed="${phones}">${ic('headphones')}<span>Hörlurar</span></button>` : ''}</div>`);
    }
    // The mic must not grade the phone's own speaker: ignore it while the reference plays and as it fades out.
    async function playRef() { const r = rounds[ri]; A.stopAll(); const end = A.play(r.ref, {bpm: 75}); deaf = end + .6; began = deaf; await wait((end - A.now()) * 1000 + 150); }
    async function startRound() {
      stop?.(); stop = null; ti = 0; draw();
      await playRef(); if (G !== g) return;
      if (phones && rounds[ri].drone) A.play([{t: 0, notes: [rounds[ri].drone], dur: 8, inst: 'keys', vel: .18}], {bpm: 60});
      const canvas = g.root.querySelector('canvas'), cx = canvas.getContext('2d'), lab = g.root.querySelector('.mg-tuner-label b'), sub = g.root.querySelector('.mg-tuner-label small');
      const trail = [], recent = []; let held = 0, last = 0, stopped = false;
      const next = ok => {
        if (stopped) return;
        g.results.push(ok); if (ok) hits++;
        const el = g.root.querySelector('.mg-targets .now'); if (el) { el.classList.remove('now'); el.classList.add(ok ? 'done' : 'missed'); }
        feedback(g, ok, el);
        g.combo = ok ? g.combo + 1 : 0;
        ti++; held = 0; began = Math.max(A.now(), deaf); trail.length = 0;
        const nowEl = g.root.querySelectorAll('.mg-targets span')[ti]; nowEl?.classList.add('now');
        if (ti >= rounds[ri].targets.length) {
          stopped = true; stop?.(); stop = null;
          setTimeout(() => { if (G !== g) return; ri++; if (ri < rounds.length) startRound(); else finish({node, level, score: hits / total, color: b.color}); }, 900);
        }
      };
      try {
        stop = await A.listen(f => {
          if (G !== g || stopped) return;
          const target = rounds[ri].targets[ti]; if (target == null) return;
          const dt = last ? f.t - last : 0; last = f.t;
          let c = null;
          if (f.t < deaf) { trail.push(null); if (trail.length > 90) trail.shift(); lab.textContent = T.pcName(target); sub.textContent = 'Lyssna'; drawTuner(cx, canvas, trail, held / HOLD); return; }
          if (f.freq && f.clarity > .75 && f.loud) c = T.foldCents(f.freq, target);
          // One stray frame (a consonant, a breath) should not break a held note: use the middle of the last three.
          recent.push(c); if (recent.length > 3) recent.shift();
          if (c != null) { const ok = recent.filter(v => v != null).sort((p, q) => p - q); c = ok[ok.length >> 1]; }
          trail.push(c); if (trail.length > 90) trail.shift();
          if (c != null && Math.abs(c) <= TOL) held += dt; else held = Math.max(0, held - dt * .5);
          lab.textContent = c == null ? '–' : T.pcName(Math.round(T.midiFloat(f.freq)));
          sub.textContent = c == null ? 'Sjung' : Math.abs(c) <= TOL ? 'Håll!' : c > 0 ? 'För högt' : 'För lågt';
          drawTuner(cx, canvas, trail, held / HOLD);
          if (held >= HOLD) next(true);
          else if (A.now() - began > 10) next(false);
        });
      } catch (e) { micError(g, head, e); }
    }
    function drawTuner(cx, cv, trail, p) {
      const w = cv.width, h = cv.height, mid = h / 2, scale = h / 2 / 120;
      cx.clearRect(0, 0, w, h);
      cx.fillStyle = 'rgba(198,231,223,.08)'; cx.fillRect(0, mid - TOL * scale, w, 2 * TOL * scale);
      cx.strokeStyle = 'rgba(198,231,223,.35)'; cx.setLineDash([6, 8]); cx.beginPath(); cx.moveTo(0, mid); cx.lineTo(w, mid); cx.stroke(); cx.setLineDash([]);
      cx.lineWidth = 6; cx.lineCap = 'round'; cx.lineJoin = 'round';
      let pen = false; cx.beginPath();
      trail.forEach((c, i) => { const x = w * .1 + i / 90 * w * .75; if (c == null) { pen = false; return; } const y = mid - Math.max(-120, Math.min(120, c)) * scale; if (!pen) { cx.moveTo(x, y); pen = true; } else cx.lineTo(x, y); });
      const col = getComputedStyle(g.root.querySelector('.mg-card')).getPropertyValue('--c') || '#e1b6d8';
      cx.strokeStyle = col.trim(); cx.stroke();
      const lastC = trail[trail.length - 1];
      if (lastC != null) { const y = mid - Math.max(-120, Math.min(120, lastC)) * scale; cx.fillStyle = Math.abs(lastC) <= TOL ? '#c6e7df' : col.trim(); cx.beginPath(); cx.arc(w * .85, y, 14, 0, 7); cx.fill(); }
      cx.fillStyle = '#c6e7df'; cx.fillRect(0, h - 6, w * Math.min(1, p), 6);
    }
    draw();
    const intro = g.root.querySelector('.mg-status'); if (intro) intro.innerHTML = `<span>Röstläge</span>: <span>${voice.name}</span>. <span>Tryck Starta och lyssna först.</span>`;
    g.root.querySelector('.mg-row').insertAdjacentHTML('beforeend', `<button type="button" class="btn" data-mg="go">${ic('mic')}<span>Starta</span></button>`);
    g.on = cmd => {
      if (cmd === 'close') return closeGame();
      if (cmd === 'go') return startRound();
      if (cmd === 'ref') return playRef();
      if (cmd === 'phones') { phones = !phones; const el = g.root.querySelector('[data-mg="phones"]'); el?.classList.toggle('active', phones); el?.setAttribute('aria-pressed', phones); }
    };
  }

  // ---------------- start + results ----------------
  // `explain` shows "how this exercise works" first, for a level that is not cleared yet.
  async function startLevel(id, n, explain = false) {
    const node = M.nodeById[id], level = node?.levels[n - 1];
    if (!level || !M.canPlay(S(), id, n)) { toast('Klara nivån innan för att låsa upp den här.'); return; }
    if (explain && play.needsIntro(id, n)) await play.intro(node, level);
    const t = level.game.type;
    if (M.QUIZ_TYPES.has(t)) return quizLevel(node, level);
    if (t === 'pattern') return play.patternLevel(node, level);
    if (t === 'neck') return play.neckLevel(node, level);
    if (t === 'bassline') return basslineLevel(node, level);
    if (t === 'rhythm') return rhythmLevel(node, level);
    if (t === 'breath') return breathLevel(node, level);
    if (t === 'pitch' || t === 'harmony') return singLevel(node, level);
  }
  function startMix() {
    const s = S(), pool = M.mixPool(s, today());
    if (pool.length < 2) { toast('Klara några nivåer först, så blandas de här.'); return; }
    const R = T.rng(), items = [], total = pool.reduce((a, x) => a + x.weight, 0);
    for (let i = 0; i < 10; i++) { let r = R() * total; const hit = pool.find(x => (r -= x.weight) <= 0) || pool[0]; items.push({node: hit.node, level: hit.level}); }
    return quizLevel(null, null, items);
  }

  async function finish({node, level, score, mix, color}) {
    if (!G) return;
    const g = G, d = today(), s = state();
    let res = null, saved = false;
    try {
      const probe = structuredClone(s);
      res = mix ? M.recordMix(probe, score, d) : M.record(probe, node.id, level.n, score, d);
      if (mix ? res.ok : (res.improved || res.cleared || res.newDay)) { await commit(x => mix ? M.recordMix(x, score, d) : M.record(x, node.id, level.n, score, d)); saved = true; }
    } catch (e) { toast(e.message || 'Kunde inte spara resultatet.'); }
    if (G !== g) return;
    const st = mix ? (score >= .999 ? 3 : score >= .85 ? 2 : score >= .7 ? 1 : 0) : M.starsFor(score), pass = mix ? score >= .7 : st > 0;
    const nextLevel = !mix && pass && node.levels[level.n] && M.canPlay(state(), node.id, level.n + 1) ? level.n + 1 : null;
    const streak = M.streak(state(), d), pct = Math.round(score * 100), gain = !mix && res?.cleared ? M.levelPoints(level.n, st) : 0;
    const R = 70, C = 2 * Math.PI * R;
    g.root.innerHTML = `<div class="mg-card mg-end ${pass ? 'pass' : ''}" style="--c:${color}">
      <header class="mg-head"><button type="button" class="mg-x" data-mg="close" aria-label="Stäng">${ic('close')}</button><div class="mg-title"><small>${mix ? 'Blandad repetition' : `<span>${esc(node.name)}</span> · <span>nivå</span> ${level.n}`}</small><strong>${mix ? 'Dagens mix' : esc(level.name)}</strong></div><span></span></header>
      <div class="mg-body">
        <div class="mg-score"><svg viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="${R}" class="bg"/><circle cx="80" cy="80" r="${R}" class="fg" style="stroke-dasharray:${C};--off:${C * (1 - score)};stroke-dashoffset:${C}"/></svg><div><b data-count="${pct}">0</b><small>%</small></div></div>
        <div class="mg-end-stars">${[1, 2, 3].map(i => `<span class="${i <= st ? 'won' : ''}" style="--d:${i}">${star(i <= st)}</span>`).join('')}</div>
        <h2>${mix ? (pass ? 'Mixen klar!' : 'Bra repetition') : res?.cleared ? (res.mastered ? 'Gren bemästrad!' : 'Nivå klar!') : pass ? (res?.improved ? 'Nytt rekord!' : 'Snyggt!') : 'Nästan!'}</h2>
        <p class="muted">${pass ? (mix ? 'Blandad repetition sitter längst.' : st < 3 ? 'Spela igen för fler stjärnor.' : 'Felfritt. Perfekt.') : mix ? '70 % behövs för att mixen ska räknas.' : '80 % behövs för att klara nivån. Försök igen, det sitter snart.'}</p>
        <div class="mt-chips center">${gain ? `<span class="mt-chip">${ic('bolt')}<span>Music</span> <b>+${gain}</b></span>` : ''}${streak ? `<span class="mt-chip ${res?.newDay ? 'hot' : ''}">${ic('flame')}<b>${streak}</b> <span>dagars streak</span></span>` : ''}${g.best >= 3 ? `<span class="mt-chip gold">${ic('flame')}<span>Bästa combo</span> <b>×${g.best}</b></span>` : ''}</div>
        ${!saved && pass && !mix && !res?.improved && !res?.newDay ? '<p class="mt-hint"><span>Du har redan det här resultatet.</span></p>' : ''}
        <div class="mg-row col">
          ${nextLevel ? `<button type="button" class="btn" data-mg="next-level">${ic('arrow')}<span>Nästa nivå</span></button>` : ''}
          <button type="button" class="btn ${nextLevel ? 'ghost' : ''}" data-mg="again">${ic('replay')}<span>Spela igen</span></button>
          <button type="button" class="btn ghost" data-mg="close"><span>Till trädet</span></button>
        </div>
      </div></div>`;
    // Count up, fill the ring, pop the stars.
    const b = g.root.querySelector('[data-count]'), fg = g.root.querySelector('.mg-score .fg'), t0 = performance.now(), dur = reduced() ? 1 : 900;
    requestAnimationFrame(() => { if (fg) fg.style.strokeDashoffset = 'var(--off)'; });
    const up = t => { const p = Math.min(1, (t - t0) / dur); if (b) b.textContent = Math.round(pct * (1 - Math.pow(1 - p, 3))); if (p < 1 && G === g) requestAnimationFrame(up); };
    requestAnimationFrame(up);
    for (let i = 1; i <= st; i++) setTimeout(() => G === g && A.sfx('star'), 700 + i * 260);
    if (pass) { setTimeout(() => G === g && A.sfx('clear'), 300); if (!reduced()) confetti(g.root, color); }
    g.on = cmd => {
      if (cmd === 'close') return closeGame();
      if (cmd === 'again') return mix ? startMix() : startLevel(node.id, level.n);
      if (cmd === 'next-level') return startLevel(node.id, nextLevel, true);
    };
  }
  function confetti(root, color) {
    const box = document.createElement('div'); box.className = 'mg-confetti'; box.setAttribute('aria-hidden', 'true');
    const cols = [color, '#c6e7df', '#e0c799', '#f0f3ec'];
    for (let i = 0; i < 46; i++) {
      const p = document.createElement('i'), a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 220;
      p.style.cssText = `--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d - 120}px;--r:${Math.random() * 720 - 360}deg;--d:${Math.random() * .25}s;background:${cols[i % cols.length]}`;
      box.appendChild(p);
    }
    root.querySelector('.mg-card')?.appendChild(box);
    setTimeout(() => box.remove(), 2200);
  }

  const play = createPlay({ic, esc, toast, S, current: () => G, runRound, setScreen, fretboard, closeGame, openOverlay, frame, finish, branchOf});
  return {view, progress, action, sheet, startLevel, close: closeGame};
}
