// Memories on the profile: a month calendar with every saved workout (strength, programs, cardio and sports),
// and an overview of the training streak. Opening a day lists what was trained, and a strength workout
// opens its sets. Only reads the saved journal; nothing is changed or stored here.
import {workoutDays, trainingStreak, liftById} from './strength.js';
import {activities} from './cardio.js';
import {lang} from './i18n.js';
import {streakStatus} from './streak-ui.js';

const shift = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const dayNo = d => Math.round(Date.parse(d + 'T12:00:00Z') / 86400000);
const monthStart = (d, offset = 0) => { const x = new Date(d.slice(0, 7) + '-01T12:00:00Z'); x.setUTCMonth(x.getUTCMonth() + offset); return x.toISOString().slice(0, 10); };
const mondayIndex = d => (new Date(d + 'T12:00:00Z').getUTCDay() + 6) % 7;
// Short weekday names Monday to Sunday in the app's language (2026-11-23 is a Monday).
const weekdays = () => [...Array(7)].map((_, i) => new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'sv-SE', {weekday: 'short', timeZone: 'UTC'}).format(new Date(Date.UTC(2026, 10, 23 + i, 12))).replace('.', '').slice(0, 2));
const minutes = ms => Math.max(1, Math.round(ms / 60000));

// Everything trained, by day: [{kind, id, title, detail}].
export function memoriesByDay(s) {
  const out = {};
  const add = (d, item) => { if (/^\d{4}-\d{2}-\d{2}$/.test(d || '')) (out[d] ??= []).push(item); };
  for (const w of s.strength?.sessions || []) {
    if (!w.finishedAt) continue;
    const sets = (w.exercises || []).reduce((n, e) => n + (e.sets || []).filter(x => x.done).length, 0);
    const mins = Number.isInteger(w.adjustedMinutes) ? w.adjustedMinutes : minutes(w.finishedAt - w.startedAt - (w.pausedMs || 0));
    const names = (w.exercises || []).map(e => liftById[e.id]?.name).filter(Boolean);
    add(w.date, {kind: 'strength', id: w.id, title: 'Styrkepass', detail: `${sets} set · ${mins} min`, names});
  }
  for (const w of s.training?.sessions || []) add(w.date, {kind: 'training', id: w.id, title: w.title || 'Träningspass', detail: w.finishedAt && w.startedAt ? `${minutes(w.finishedAt - w.startedAt)} min` : ''});
  for (const w of s.cardio?.sessions || []) {
    const a = activities.find(x => x.id === w.kind);
    add(w.date, {kind: a?.sport ? 'sport' : 'cardio', id: w.id, title: a?.name || 'Aktivitet', detail: `${(w.seconds / 60).toFixed(0)} min${w.km > 0 ? ' · ' + w.km + ' km' : ''}`});
  }
  return out;
}

// Streaks over time: one rest day between workouts keeps a streak, two in a row ends it (as trainingStreak).
export function streakRuns(s, today) {
  const days = workoutDays(s, today).slice().reverse(), runs = [];
  for (const d of days) {
    const last = runs.at(-1);
    if (last && dayNo(d) - dayNo(last.end) <= 2) { last.end = d; last.days++; } else runs.push({start: d, end: d, days: 1});
  }
  return runs;
}

export function createMemories({getState, I, esc, button, modal, today}) {
  let offset = 0;
  const monthLabel = d => new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'sv-SE', {month: 'long', year: 'numeric', timeZone: 'UTC'}).format(new Date(d + 'T12:00:00Z'));

  function calendar() {
    const s = getState(), now = today(), first = monthStart(now, offset), next = monthStart(now, offset + 1), byDay = memoriesByDay(s);
    const cells = [...Array(mondayIndex(first))].map(() => '<span class="mem-day empty"></span>');
    let trained = 0;
    for (let d = first; d < next; d = shift(d, 1)) {
      const items = byDay[d] || [], kinds = [...new Set(items.map(x => x.kind))];
      if (items.length) trained++;
      const label = `${d}${items.length ? ': ' + items.map(x => x.title).join(', ') : ''}`;
      cells.push(items.length
        ? `<button class="mem-day has ${d === now ? 'today' : ''}" data-action="mem:day:${d}" aria-label="${esc(label)}">${kinds.includes('strength') ? I('dumbbell') : ''}<b>${Number(d.slice(8))}</b><span class="mem-dots">${kinds.map(k => `<i class="${k}"></i>`).join('')}</span></button>`
        : `<span class="mem-day ${d === now ? 'today' : ''} ${d > now ? 'future' : ''}" aria-label="${d}"><b>${Number(d.slice(8))}</b></span>`);
    }
    return `<section class="card memories"><div class="section-head"><h3>${I('calendar')} Minnen</h3><span class="pill">${trained} träningsdagar</span></div>
      <div class="mem-month">${button(I('chevron'), 'mem:prev', 'icon-btn mem-prev', 'aria-label="Föregående månad"')}<strong data-no-translate>${monthLabel(first)}</strong>${button(I('chevron'), 'mem:next', 'icon-btn', `aria-label="Nästa månad" ${offset >= 0 ? 'disabled' : ''}`)}</div>
      <div class="mem-grid" aria-hidden="true">${weekdays().map(w => `<span class="mem-wd" data-no-translate>${w}</span>`).join('')}</div>
      <div class="mem-grid">${cells.join('')}</div>
      <p class="mem-legend"><span><i class="strength"></i>Styrka</span><span><i class="cardio"></i>Cardio</span><span><i class="sport"></i>Sport</span><span><i class="training"></i>Program</span></p></section>`;
  }

  function streakSummary() {
    const s = getState(), now = today(), st = trainingStreak(s, now), total = workoutDays(s, now).length;
    return `<section class="card mem-streak"><div class="mem-streak-flame">${I('flame')}<strong>${st.days}</strong></div><div><span class="eyebrow">TRÄNINGSSTREAK</span><h3>${st.days} dagar i rad</h3><p>Längsta: ${st.best} · ${total} träningsdagar totalt</p></div>${button('Översikt', 'mem:streak', 'btn secondary')}</section>`;
  }

  function view() { return streakSummary() + calendar(); }

  function dayModal(d) {
    const items = memoriesByDay(getState())[d] || [];
    modal('Träning · ' + d, items.length ? items.map(x => `<section class="settings-row mem-item ${x.kind}"><div><h3>${esc(x.title)}</h3><p>${esc(x.detail)}${x.names?.length ? '<br>' + x.names.map(esc).join(', ') : ''}</p></div>${x.kind === 'strength' ? button('Visa set', 'hub:session:' + x.id, 'btn secondary') : ''}</section>`).join('') : '<p class="intro">Ingen träning sparad den här dagen.</p>');
  }

  function streakModal() {
    const s = getState(), now = today(), st = trainingStreak(s, now), done = new Set(workoutDays(s, now)), runs = streakRuns(s, now);
    const weeks = 12, start = shift(now, -(mondayIndex(now) + 7 * (weeks - 1)));
    const current = st.days ? runs.at(-1) : null;
    const cells = [];
    for (let d = start; d <= shift(now, 6 - mondayIndex(now)); d = shift(d, 1)) cells.push(`<i class="${done.has(d) ? 'on' : ''} ${current && d >= current.start && d <= current.end ? 'run' : ''} ${d > now ? 'future' : ''} ${d === now ? 'today' : ''}" title="${d}"></i>`);
    const top = [...runs].sort((a, b) => b.days - a.days || b.end.localeCompare(a.end)).slice(0, 3);
    modal('Din streak', `<div class="mem-streak-stats"><div><strong>${st.days}</strong><span>Nuvarande</span></div><div><strong>${st.best}</strong><span>Längsta</span></div><div><strong>${done.size}</strong><span>Träningsdagar</span></div></div>
      <p class="intro"><strong>${streakStatus(s, now).title}</strong><br>${streakStatus(s, now).text}</p>
      <h3 class="space">Senaste 12 veckorna</h3><div class="mem-heat" aria-label="Träningsdagar de senaste 12 veckorna">${weekdays().map(w => `<span data-no-translate>${w}</span>`).join('')}${cells.join('')}</div>
      <p class="mem-legend"><span><i class="strength"></i>Pass</span><span><i class="run"></i>Nuvarande streak</span></p>
      ${top.length ? `<h3 class="space">Dina längsta streaks</h3>${top.map(r => `<section class="settings-row"><div><h3>${r.days} träningsdagar</h3><p>${r.start} – ${r.end}</p></div></section>`).join('')}` : ''}
      <p class="fitness-hint">Ett sparat styrkepass tänder dagen. En vilodag mellan passen går bra, två dagar i rad utan pass nollställer streaken.</p>`);
  }

  function action([cmd, arg]) {
    if (cmd === 'prev') offset--;
    else if (cmd === 'next') offset = Math.min(0, offset + 1);
    else if (cmd === 'day') return dayModal(arg);
    else if (cmd === 'streak') return streakModal();
    const el = globalThis.document?.querySelector('.memories');
    if (el) el.outerHTML = calendar();
  }

  return {view, calendar, streakModal, action};
}

export const MEMORIES_CSS = String.raw`
.memories .section-head h3{display:flex;align-items:center;gap:8px;margin:0}
.memories .section-head h3 .i{width:18px;height:18px}
.mem-month{display:flex;align-items:center;justify-content:space-between;margin:6px 0 12px}
.mem-month strong{text-transform:capitalize;font-size:16px}
.mem-prev .i{transform:rotate(180deg)}
.mem-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.mem-grid+.mem-grid{margin-top:6px}
.mem-wd{text-align:center;font-size:11px;color:var(--muted)}
.mem-day{position:relative;aspect-ratio:1/1.15;border-radius:12px;background:var(--surface);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;color:var(--muted);font:inherit;border:1px solid transparent;padding:0}
.mem-day b{font-size:14px;font-weight:600}
.mem-day.empty{background:none}
.mem-day.future{opacity:.45}
.mem-day.today{border-color:var(--mint)}
.mem-day.has{background:linear-gradient(160deg,#2b4a44,#1e2f30);color:var(--text);border-color:#4f7d72;cursor:pointer}
.mem-day.has .i{width:14px;height:14px;color:var(--mint)}
.mem-dots{display:flex;gap:3px;height:5px}
.mem-dots i,.mem-legend i{width:5px;height:5px;border-radius:50%;display:inline-block}
.mem-legend{display:flex;flex-wrap:wrap;gap:12px;margin:12px 0 0;font-size:11px;color:var(--muted)}
.mem-legend span{display:flex;align-items:center;gap:5px}
.mem-legend i{width:8px;height:8px}
i.strength{background:var(--mint)}i.cardio{background:#8fc4ff}i.sport{background:var(--gold)}i.training{background:#b58cff}i.run{background:#ff8a5c}
.mem-streak{display:flex;align-items:center;gap:14px}
.mem-streak>div:nth-child(2){flex:1;min-width:0}
.mem-streak h3{margin:2px 0}
.mem-streak p{margin:0;font-size:12px;color:var(--muted)}
.mem-streak-flame{position:relative;width:54px;height:54px;border-radius:50%;display:grid;place-items:center;background:#ff8a5c22;color:#ff9a6a;flex:0 0 54px}
.mem-streak-flame .i{width:30px;height:30px}
.mem-streak-flame strong{position:absolute;bottom:-4px;right:-4px;background:var(--panel);border:1px solid var(--line);border-radius:99px;padding:1px 7px;font-size:12px;color:var(--text)}
.mem-streak-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px}
.mem-streak-stats div{background:var(--surface);border-radius:14px;padding:12px;text-align:center}
.mem-streak-stats strong{display:block;font-size:24px}
.mem-streak-stats span{font-size:11px;color:var(--muted)}
.mem-heat{display:grid;grid-template-columns:repeat(7,22px);gap:5px;margin:8px auto 0;justify-content:center}
.mem-heat span{text-align:center;font-size:10px;color:var(--muted)}
.mem-heat i{width:22px;height:22px;border-radius:6px;background:var(--surface)}
.mem-heat i.on{background:var(--mint)}
.mem-heat i.on.run{background:#ff8a5c}
.mem-heat i.future{opacity:.3}
.mem-heat i.today{outline:1.5px solid var(--text);outline-offset:1px}
.search-wrap{position:relative}
.search-wrap .strength-search{padding-right:52px}
.search-clear{position:absolute;right:8px;top:7px;width:38px;height:38px;border-radius:50%;border:0;background:var(--surface);color:var(--text);display:grid;place-items:center;font-size:20px;line-height:1;cursor:pointer}
.search-clear[hidden]{display:none}
`;

export function injectMemoriesCSS(doc = globalThis.document) {
  if (!doc || doc.getElementById('memories-css')) return;
  const el = doc.createElement('style'); el.id = 'memories-css'; el.textContent = MEMORIES_CSS; doc.head.appendChild(el);
}
