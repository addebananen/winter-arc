// Playing a real instrument into the microphone, and learning before playing:
// - instrument(): shared input for the bass games. The microphone hears which note is played; tapping
//   the fretboard on screen always works too, so every game can be played without an instrument.
// - intro(): "how this exercise works", shown before a level you have not cleared yet.
// - patternLevel(): scales and arpeggios. First the whole pattern with its theory, then from memory.
// - neckLevel(): the whole fretboard, string by string. First with the map, then without.
// - tuner(): a tuner that doubles as a microphone check.
import * as T from './music-theory.js';
import * as M from './music-tree.js';
import * as A from './music-audio.js';

const PREF = 'arc-music-input';
const pref = {
  get() { try { return localStorage.getItem(PREF) === 'tap' ? 'tap' : 'mic'; } catch { return 'mic'; } },
  set(v) { try { localStorage.setItem(PREF, v); } catch {} },
};

// How each kind of exercise works, step by step. Shown on the intro screen.
const QUIZ_HOW = ['Du får tio frågor. Lyssna, och tryck på den stora knappen för att höra igen så många gånger du vill.', 'Välj ett svar. Efter varje svar ser du facit och en kort förklaring.', 'Åtta rätt av tio klarar nivån. Fler rätt ger fler stjärnor.'];
export const HOW = {
  compare: QUIZ_HOW, degree: QUIZ_HOW, interval: QUIZ_HOW, quality: QUIZ_HOW, chordtone: QUIZ_HOW, progression: QUIZ_HOW, inversion: QUIZ_HOW,
  walk: ['Först spelas fyra ackord och sedan en ton.', 'Efter en kort paus går tonen stegvis ner till hemtonen. Räkna tonerna på vägen: det är svaret.', 'Tio frågor. Åtta rätt klarar nivån.'],
  fret: ['Du får ett tonnamn. Hitta tonen på halsen.', 'Spela den på din bas eller gitarr så hör mikrofonen vilken ton det är. Du kan också trycka på greppbrädan på skärmen.', 'Tio toner. Åtta rätt klarar nivån.'],
  pattern: ['Först visas hela mönstret: var fingrarna sitter, vad tonerna heter och hur långt det är mellan dem. Titta, lyssna och spela efter i lugn takt.', 'Sedan döljs mönstret. Spela tonerna i ordning från grundtonen och uppåt.', 'Tre mönster på olika ställen på halsen. Varje fel ton eller titt på facit drar ner resultatet.'],
  neck: ['Först med karta: tonerna visas på halsen. Spela dem i ordning och säg namnet högt.', 'Sedan utan karta: tonerna kommer i blandad ordning. Spela rätt ton på rätt sträng.', 'En fel ton, eller att trycka på Visa, räknas som en miss. Åtta av tio utan miss klarar nivån.'],
  bassline: ['Du får fyra ackord och en regel för vilka toner som får användas.', 'Tryck på ett slag och välj en ton. Lyssna på din basgång med trummor och ackord.', 'Tryck på Rätta. Röda slag bryter mot regeln. Jämför med exemplet och försök igen.'],
  rhythm: ['Klicket räknar in en takt. Lyssna först.', 'Tryck på plattan på varje markerat slag i fyra takter.', 'Du får poäng för hur nära slaget du trycker. 80 % klarar nivån.'],
  guided: ['Lägg en hand på magen och en på bröstet.', 'Andas in genom näsan när cirkeln växer. Säg ett mjukt ”sss” när den krymper.', 'Följ alla andetag så är nivån klar. Ingen mikrofon behövs.'],
  breath: ['Var tyst en sekund när du startat, så mäter appen rummet.', 'Andas in lågt och håll ljudet jämnt så länge som nivån kräver.', 'Tiden avgör om du klarar nivån. Jämnheten avgör stjärnorna.'],
  pitch: ['Lyssna på tonerna. Mikrofonen lyssnar inte medan de spelas.', 'Sjung samma toner. Linjen visar om du ligger för högt eller för lågt.', 'Håll tonen inne i det ljusa fältet en kort stund så räknas den.'],
  harmony: ['Lyssna på ackordet och på tonen du ska utgå från.', 'Sjung den ton som nivån ber om. Linjen visar om du ligger för högt eller för lågt.', 'Slå på Hörlurar om du vill ha en ton att sjunga mot.'],
};
const PLAYED = new Set(['fret', 'pattern', 'neck']);

export function createPlay({ic, esc, toast, S, current, runRound, setScreen, fretboard, closeGame, openOverlay, frame, finish, branchOf}) {
  const cap = s => s.replace(/^./, c => c.toUpperCase());
  const stringName = s => `${T.STRINGS[s].name}-<span>strängen</span>`;

  // ---------- shared instrument input ----------
  function instrument(g) {
    if (g.ctl) return g.ctl;
    const tr = T.createNoteTracker();
    let stop = null, starting = false, lastPc = null, pend = null;
    const ctl = g.ctl = {
      mode: pref.get(), handlers: null, redraw: null,
      // After a note is accepted, the same note still ringing must not count against the next one.
      accepted(pc) { lastPc = pc; pend = null; },
      bar() {
        const mic = ctl.mode === 'mic';
        return `<div class="mg-input"><button type="button" class="chip ${mic ? 'active' : ''}" data-mg="input" aria-pressed="${mic}">${ic(mic ? 'mic' : 'tap')}<span>${mic ? 'Mikrofon på' : 'Tryck på skärmen'}</span></button>${mic ? '<span class="mg-live" aria-live="off"><small>Jag hör</small><b>–</b><i><u></u></i></span>' : ''}</div>`;
      },
      async start() {
        if (stop || starting || ctl.mode !== 'mic') return;
        starting = true;
        try { const s = await A.listen(onFrame, {mode: 'instrument'}); if (current() === g) stop = s; else s(); }
        catch (e) { ctl.mode = 'tap'; toast(e?.message || 'Kunde inte starta mikrofonen.'); ctl.redraw?.(); }
        finally { starting = false; }
      },
      end() { stop?.(); stop = null; },
      async toggle() {
        ctl.mode = ctl.mode === 'mic' ? 'tap' : 'mic'; pref.set(ctl.mode);
        if (ctl.mode === 'mic') { ctl.redraw?.(); await ctl.start(); } else { ctl.end(); ctl.redraw?.(); }
      },
    };
    function onFrame(f) {
      if (current() !== g) return;
      // While the app itself makes sound, hear nothing: the speaker is not the player.
      const ev = tr.push(f.t < A.busyUntil() ? {...f, freq: null, clarity: 0} : f), c = tr.candidate;
      const live = g.root.querySelector('.mg-live');
      if (live) { live.querySelector('b').textContent = c != null ? T.pcName(c) : '–'; live.querySelector('u').style.transform = `scaleX(${f.level.toFixed(2)})`; live.classList.toggle('on', c != null); }
      const h = ctl.handlers; if (!h) return;
      if (ev && h.free) h.free(ev);
      const want = h.expect?.();
      if (want == null) { pend = null; return; }
      if (ev) {
        if (ev.pc === want) { ctl.accepted(want); h.hit(ev); return; }
        if (ev.pc !== lastPc) pend = {midi: ev.midi, t: f.t};
      }
      // A wrong note has to hold a little longer than a right one before it counts: a brushed string is not an answer.
      if (pend) { if (c !== pend.midi) pend = null; else if (f.t - pend.t > .15) { const m = pend.midi; pend = null; h.miss?.(m); } }
    }
    g.cleanup.push(() => ctl.end());
    return ctl;
  }

  // ---------- "how this exercise works" ----------
  // Resolves true when the player presses Start. Shown for levels that are not cleared yet.
  function intro(node, level) {
    const b = branchOf(node.branch), type = level.game.type, steps = HOW[level.game.walk ? 'walk' : level.game.mode === 'guided' ? 'guided' : type] || [], played = PLAYED.has(type);
    return new Promise(resolve => {
      const g = openOverlay(); g.color = b.color; g.results = []; g.combo = 0;
      const draw = () => {
        const mic = pref.get() === 'mic';
        g.root.innerHTML = `<div class="mg-card" style="--c:${b.color}">${frame({title: esc(level.name), sub: `<span>${esc(node.name)}</span> · <span>nivå</span> ${level.n}`, color: b.color, combo: 0})}<div class="mg-body mg-intro">
          <div class="mg-prompt"><span class="mg-step">Så funkar övningen</span><h2>${esc(level.goal)}</h2></div>
          <ol class="mg-steps">${steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol>
          ${played ? `<div class="mg-choose"><strong>Hur vill du spela?</strong><div class="mg-row"><button type="button" class="chip ${mic ? 'active' : ''}" data-mg="use:mic" aria-pressed="${mic}">${ic('mic')}<span>Med instrumentet</span></button><button type="button" class="chip ${mic ? '' : 'active'}" data-mg="use:tap" aria-pressed="${!mic}">${ic('tap')}<span>Tryck på skärmen</span></button></div><p class="muted">${mic ? 'Mikrofonen hör vilken ton du spelar på basen eller gitarren. Håll telefonen nära instrumentet eller förstärkaren.' : 'Du trycker på greppbrädan på skärmen i stället för att spela.'}</p></div>` : ''}
          <div class="mg-theory"><strong>Bra att veta</strong><p>${esc(node.learn)}</p>${level.tip ? `<p class="mg-tip">${esc(level.tip)}</p>` : ''}</div>
          <div class="mg-row mg-stick"><button type="button" class="btn" data-mg="start">${ic('play')}<span>Starta</span></button></div>
        </div></div>`;
      };
      draw();
      g.on = cmd => {
        if (cmd === 'close') return closeGame();
        if (cmd.startsWith('use:')) { pref.set(cmd.slice(4)); return draw(); }
        if (cmd === 'start') { g.on = null; A.unlock(); resolve(true); }
      };
    });
  }

  // ---------- scales and arpeggios ----------
  function patternLevel(node, level) {
    const b = branchOf(node.branch), R = T.rng(), count = 3;
    const head = {title: esc(level.name), sub: `<span>${esc(node.name)}</span> · <span>nivå</span> ${level.n}`, color: b.color, count};
    return runRound({node, level, color: b.color, count, title: head.title, sub: head.sub,
      ask: (i, g) => new Promise(resolve => {
        const q = T.patternQuestion(R, level.game), ctl = instrument(g), n = q.targets.length;
        const name = q.title.split(' ')[0], kind = cap(q.title.slice(name.length + 1)), key = p => p[0] + ':' + p[1];
        let phase = 'learn', idx = 0, mistakes = 0, peeked = false, peek = false, said = '', over = false;
        const marks = {};
        const shape = () => Object.fromEntries(q.positions.map((p, k) => [key(p), {cls: 'show', label: T.degreeLabel(q.labels[k])}]));
        const theory = () => `<div class="mg-theory-row">${q.labels.map((l, k) => `<span><b>${T.degreeLabel(l)}</b><small>${q.names[k]}</small></span>${q.gaps && k < n - 1 ? `<em>${q.gaps[k]}</em>` : ''}`).join('')}</div>`;
        const demo = () => { A.stopAll(); A.play(q.targets.map((m, k) => ({t: k * .55, notes: [m], dur: .5, inst: 'bass'})), {bpm: 80}); };
        const draw = () => {
          const keep = g.root.querySelector('.mg-board')?.scrollLeft || 0;
          if (phase === 'learn') setScreen(g, head, `
            <div class="mg-prompt"><span class="mg-step"><span>Steg 1 av 2</span> · <span>Lär dig mönstret</span></span><h2><b>${name}</b> <span>${esc(kind)}</span></h2><p class="muted">${esc(T.ABOUT[q.id] || '')}</p></div>
            ${theory()}
            ${fretboard({frets: q.frets, marks: shape(), root: q.root})}
            <div class="mg-row"><button type="button" class="btn ghost" data-mg="demo">${ic('play')}<span>Lyssna</span></button><button type="button" class="btn" data-mg="go"><span>Spela ur minnet</span>${ic('arrow')}</button></div>
            ${ctl.bar()}
            <p class="mg-note muted"><span>Siffran är skalsteget, räknat från grundtonen.</span> <span>Spela mönstret några gånger i lugn takt och säg skalstegen högt.</span> <span>Formen är densamma var du än börjar på halsen.</span></p>`);
          else setScreen(g, head, `
            <div class="mg-prompt"><span class="mg-step"><span>Steg 2 av 2</span> · <span>Ur minnet</span></span><h2><b>${name}</b> <span>${esc(kind)}</span></h2><p class="muted">Spela tonerna i ordning, nerifrån och upp.</p></div>
            <div class="mg-seq">${q.labels.map((l, k) => `<span class="${k < idx ? 'done' : k === idx ? 'now' : ''}">${T.degreeLabel(l)}</span>`).join('')}</div>
            ${fretboard({frets: q.frets, marks: peek ? {...shape(), ...marks} : marks, root: q.root})}
            <p class="mg-status muted">${said}</p>
            ${ctl.bar()}
            <div class="mg-sub-actions">${idx < n ? `<button type="button" class="chip" data-mg="peek">${ic('info')}<span>Visa mönstret</span></button>` : ''}</div><div class="mg-after"></div>`);
          const board = g.root.querySelector('.mg-board'); if (board) board.scrollLeft = keep;
        };
        const end = () => {
          A.sfx(mistakes ? 'right' : 'combo'); g._ok = !mistakes;
          g.root.querySelector('.mg-after').innerHTML = `<div class="mg-reveal ${mistakes ? 'bad' : 'ok'}"><strong>${mistakes ? 'Klart' : 'Felfritt!'}</strong><div class="mg-facts"><span><small>Missar</small><b>${mistakes}</b></span><span class="wide"><small>Toner</small><b>${q.names.join(' ')}</b></span></div></div><button type="button" class="btn mg-next" data-mg="next"><span>Nästa</span>${ic('arrow')}</button>`;
        };
        const hit = () => {
          marks[key(q.positions[idx])] = {cls: 'right', label: T.degreeLabel(q.labels[idx])}; idx++; said = ''; navigator.vibrate?.(10);
          draw(); if (idx === n) end();
        };
        const miss = midi => { mistakes++; said = `<span>Det där var</span> <b>${T.pcName(midi)}</b>. <span>Sök vidare.</span>`; navigator.vibrate?.([20, 40, 20]); const el = g.root.querySelector('.mg-status'); if (el) { el.innerHTML = said; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); } };
        ctl.redraw = draw;
        ctl.handlers = {
          expect: () => phase === 'play' && idx < n ? T.pcOf(q.targets[idx]) : null, hit, miss,
          // In the learn step the board lights up where the heard note sits, so you see that the app hears you.
          free: ev => { if (phase !== 'learn') return; q.positions.forEach((p, k) => { if (T.pcOf(q.targets[k]) !== ev.pc) return; const el = g.root.querySelector(`[data-mg="fret:${p[0]}:${p[1]}"]`); if (el) { el.classList.remove('heard'); void el.offsetWidth; el.classList.add('heard'); } }); },
        };
        draw(); ctl.start();
        g.on = (cmd, el) => {
          if (cmd === 'close') return closeGame();
          if (cmd === 'input') return ctl.toggle();
          if (cmd === 'demo') return demo();
          if (cmd === 'go') { phase = 'play'; A.stopAll(); return draw(); }
          if (cmd === 'peek' && phase === 'play') { if (!peeked) { peeked = true; mistakes++; } peek = true; draw(); setTimeout(() => { if (current() === g && peek && !over) { peek = false; if (idx < n) draw(); } }, 2500); return; }
          if (cmd === 'next') { over = true; g.on = null; ctl.handlers = null; return resolve({ok: mistakes === 0, score: n / (n + mistakes)}); }
          if (!cmd.startsWith('fret:')) return;
          const [, s, f] = cmd.split(':').map(Number), midi = T.fretMidi(s, f);
          A.note(midi, .6, 'bass');
          if (phase !== 'play' || idx >= n) return;
          if (midi === q.targets[idx]) { ctl.accepted(T.pcOf(midi)); hit(); }
          else { miss(midi); el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake', 'miss'); setTimeout(() => el.classList.remove('miss'), 500); }
        };
      })});
  }

  // ---------- the whole neck ----------
  function neckLevel(node, level) {
    const b = branchOf(node.branch), game = level.game, R = T.rng(), {learn, test} = T.neckTargets(R, game);
    const g = openOverlay(); g.color = b.color; g.results = []; g.combo = 0; g.best = 0; g.index = 0;
    const ctl = instrument(g), strings = game.across ? [0, 1, 2, 3] : game.strings;
    const sub = `<span>${esc(node.name)}</span> · <span>nivå</span> ${level.n}`;
    let phase = learn.length ? 'learn' : 'test', i = 0, clean = 0, missed = false, shown = false, said = '', lastHit = null, timer = 0;
    const list = () => phase === 'learn' ? learn : test, cur = () => list()[i];
    const draw = () => {
      const c = cur(), keep = g.root.querySelector('.mg-board')?.scrollLeft || 0, marks = {};
      if (phase === 'learn') for (const x of learn) marks[x.s + ':' + x.f] = {cls: x === c ? 'now' : 'show', label: x.name};
      else { if (lastHit) marks[lastHit.s + ':' + lastHit.f] = {cls: 'right', label: lastHit.name}; if (shown) marks[c.s + ':' + c.f] = {cls: 'now', label: c.name}; }
      setScreen(g, {title: esc(level.name), sub, color: b.color, count: phase === 'test' ? test.length : 0}, `
        <div class="mg-prompt"><span class="mg-step">${phase === 'learn' ? '<span>Steg 1 av 2</span> · <span>Med kartan</span>' : learn.length ? '<span>Steg 2 av 2</span> · <span>Ur minnet</span>' : '<span>Ur minnet</span>'}</span>
          <h2><span>Spela</span> <b class="mg-big">${c.name}</b></h2><p class="muted">${stringName(c.s)}${phase === 'learn' ? ` · <span>band</span> ${c.f}` : ''}</p></div>
        ${game.seconds && phase === 'test' ? `<div class="mg-timer" style="--s:${game.seconds}s"><i></i></div>` : ''}
        ${fretboard({frets: [0, 12], strings, marks})}
        <p class="mg-status muted">${said}</p>
        ${ctl.bar()}
        <div class="mg-sub-actions">${phase === 'learn' ? `<button type="button" class="chip" data-mg="skip">${ic('arrow')}<span>Hoppa över kartan</span></button>` : `<button type="button" class="chip" data-mg="peek">${ic('info')}<span>Visa</span></button>`}</div>`);
      const board = g.root.querySelector('.mg-board');
      if (board) {
        // With the map (or after Show) the target is scrolled into view. Without it the neck stays put, so scrolling gives nothing away.
        if (phase === 'learn' || shown) { const el = board.querySelector('.m-now'); if (el) board.scrollLeft = Math.max(0, el.offsetLeft - board.clientWidth / 2); } else board.scrollLeft = keep;
      }
    };
    const begin = () => { missed = false; shown = false; timer = performance.now(); draw(); };
    const hit = () => {
      const c = cur();
      if (phase === 'test') {
        const slow = game.seconds && performance.now() - timer > game.seconds * 1000, ok = !missed && !slow;
        g.results.push(ok); if (ok) clean++; g.combo = ok ? g.combo + 1 : 0; g.best = Math.max(g.best, g.combo); g.index++;
        said = ok ? '' : slow && !missed ? '<span>Rätt ton, men för långsamt.</span>' : '';
        navigator.vibrate?.(ok ? 10 : [20, 40, 20]);
      } else { said = ''; navigator.vibrate?.(10); }
      lastHit = c; i++;
      if (i < list().length) return begin();
      if (phase === 'learn') { phase = 'test'; i = 0; lastHit = null; said = '<span>Bra. Nu utan karta: tonerna kommer i blandad ordning.</span>'; return begin(); }
      g.on = null; ctl.handlers = null; ctl.end();
      finish({node, level, score: clean / test.length, color: b.color});
    };
    const miss = midi => {
      if (phase === 'test') missed = true;
      said = `<span>Det där var</span> <b>${T.pcName(midi)}</b>. <span>Sök vidare.</span>`; navigator.vibrate?.([20, 40, 20]);
      const el = g.root.querySelector('.mg-status'); if (el) { el.innerHTML = said; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
    };
    ctl.redraw = draw;
    ctl.handlers = {expect: () => cur()?.pc ?? null, hit, miss};
    begin(); ctl.start();
    g.on = (cmd, el) => {
      if (cmd === 'close') return closeGame();
      if (cmd === 'input') return ctl.toggle();
      if (cmd === 'skip' && phase === 'learn') { phase = 'test'; i = 0; lastHit = null; said = ''; return begin(); }
      if (cmd === 'peek' && phase === 'test') { missed = true; shown = true; return draw(); }
      if (!cmd.startsWith('fret:')) return;
      const [, s, f] = cmd.split(':').map(Number), midi = T.fretMidi(s, f), c = cur();
      A.note(midi, .6, 'bass');
      if (s === c.s && T.pcOf(midi) === c.pc) { ctl.accepted(c.pc); hit(); }
      else { miss(midi); el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake', 'miss'); setTimeout(() => el.classList.remove('miss'), 500); }
    };
  }

  // ---------- tuner / microphone check ----------
  async function tuner() {
    const color = branchOf('bass').color, g = openOverlay(); g.color = color; g.results = []; g.combo = 0;
    g.root.innerHTML = `<div class="mg-card" style="--c:${color}">${frame({title: 'Stämapparat', sub: '<span>Bas och gitarr</span>', color, combo: 0})}<div class="mg-body mg-tune">
      <div class="mg-prompt"><p class="muted"><span>Spela en sträng i taget.</span> <span>Visar appen rätt ton här, hör mikrofonen ditt instrument i övningarna också.</span></p></div>
      <div class="mg-tune-note"><b>–</b><small></small></div>
      <div class="mg-tune-bar"><i></i><u></u></div>
      <p class="mg-status muted">Väntar på en ton…</p>
      <div class="mg-tune-strings">${['E', 'A', 'D', 'G', 'B'].map(x => `<span data-pc="${T.pcOf(T.midiOf(T.parseNote(x + 2)))}">${x}</span>`).join('')}</div>
      <div class="mg-input"><span class="mg-live on"><small>Nivå</small><i><u></u></i></span></div>
    </div></div>`;
    g.on = cmd => cmd === 'close' && closeGame();
    const q = s => g.root.querySelector(s), note = q('.mg-tune-note b'), oct = q('.mg-tune-note small'), dot = q('.mg-tune-bar u'), status = q('.mg-status'), lvl = q('.mg-live u'), wrap = q('.mg-tune');
    let smooth = null, quiet = 0;
    try {
      const stop = await A.listen(f => {
        if (current() !== g) return;
        lvl.style.transform = `scaleX(${f.level.toFixed(2)})`;
        if (!(f.freq && f.clarity > .88 && f.loud)) { if (++quiet > 25) { wrap.classList.remove('live', 'ok'); status.textContent = 'Väntar på en ton…'; smooth = null; } return; }
        quiet = 0;
        const m = T.midiFloat(f.freq); smooth = smooth == null || Math.abs(m - smooth) > .7 ? m : smooth * .7 + m * .3;
        const near = Math.round(smooth), cents = (smooth - near) * 100, ok = Math.abs(cents) <= 6;
        note.textContent = T.pcName(near); oct.textContent = String(Math.floor(near / 12) - 1);
        dot.style.transform = `translateX(${Math.max(-50, Math.min(50, cents)).toFixed(1)}%)`;
        wrap.classList.add('live'); wrap.classList.toggle('ok', ok);
        status.textContent = ok ? 'Stämd' : cents < 0 ? 'För lågt: spänn strängen' : 'För högt: släpp på strängen';
        for (const el of g.root.querySelectorAll('.mg-tune-strings span')) el.classList.toggle('on', Number(el.dataset.pc) === T.pcOf(near));
      }, {mode: 'instrument'});
      if (current() === g) g.cleanup.push(stop); else stop();
    } catch (e) { if (current() === g) status.textContent = e?.message || 'Kunde inte starta mikrofonen.'; }
  }

  const needsIntro = (id, n) => M.levelOf(S(), id) < n;
  return {instrument, intro, needsIntro, patternLevel, neckLevel, tuner};
}
