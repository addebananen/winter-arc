// The squad page: a living header (who trained today, the week's pulse, the invite code), member
// cards, friendlier activity posts, photo reactions and the "share this?" bar after a check-in.
// Pure HTML builders; app.js wires the actions (prefix `sq:`). Styles live in squad-css.js.
import {parseActivity} from './squad-share.js';
import {SQUAD_CSS} from './squad-css.js';
import {lang} from './i18n.js';

export function injectSquadCSS() {
  if (typeof document === 'undefined' || document.getElementById('squad-css')) return;
  const s = document.createElement('style'); s.id = 'squad-css'; s.textContent = SQUAD_CSS; document.head.appendChild(s);
}

const DAY = 864e5;
const WEEKDAYS = {sv: ['M', 'T', 'O', 'T', 'F', 'L', 'S'], en: ['M', 'T', 'W', 'T', 'F', 'S', 'S']};
const tones = ['', 'gold', 'purple', 'blue'];

// When a post happened, in words: "Nyss", "12 min sedan", "3 h sedan", "Igår", else a date.
export function when(iso, now = Date.now()) {
  const t = new Date(iso).getTime(), diff = Math.max(0, now - t);
  if (!Number.isFinite(t)) return '';
  if (diff < 60e3) return 'Nyss';
  if (diff < 3600e3) return `${Math.floor(diff / 60e3)} min sedan`;
  if (new Date(t).toDateString() === new Date(now).toDateString()) return `${Math.floor(diff / 3600e3)} h sedan`;
  if (new Date(t).toDateString() === new Date(now - DAY).toDateString()) return 'Igår';
  return new Date(t).toLocaleDateString('sv-SE', {day: 'numeric', month: 'short'});
}

// The day a post counts for: the workout's own date when it has one, otherwise when it was posted.
export const postDay = p => p.workout?.date || parseActivity(p.body)?.date || String(p.created_at || '').slice(0, 10);
export const isWorkoutPost = p => !!p.workout || parseActivity(p.body)?.kind === 'cardio' || /^(Styrkepass|.+) klart · \d+ set · /.test(p.body || '');

// Workouts per day for the current week (Monday first), from the posts the feed already has.
export function weekPulse(posts, today, weekStart) {
  const days = Array.from({length: 7}, (_, i) => {const d = new Date(weekStart + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + i); return d.toISOString().slice(0, 10);});
  const count = Object.fromEntries(days.map(d => [d, 0]));
  for (const p of posts) if (isWorkoutPost(p) && p.body?.indexOf('Återtagen') !== 0) { const d = postDay(p); if (d in count) count[d]++; }
  return days.map((d, i) => ({day: d, label: (WEEKDAYS[lang] || WEEKDAYS.sv)[i], n: count[d], today: d === today, future: d > today}));
}

// A short line on top of the squad that changes with the day.
export function tagline(ms, meId) {
  const trained = ms.filter(m => m.trained_today).length, me = ms.find(m => m.user_id === meId);
  if (!ms.length) return 'Bjud in dina vänner och bygg något tillsammans.';
  if (ms.length > 1 && trained === ms.length) return 'Alla har tränat idag. Det här är ett lag.';
  if (me && !me.trained_today && trained) return trained === 1 ? 'En i squadet har redan tränat idag. Din tur?' : `${trained} i squadet har redan tränat idag. Din tur?`;
  if (me?.trained_today) return trained > 1 ? 'Du har gjort ditt. Heja fram resten!' : 'Du är först ut idag. Visa vägen.';
  return 'Ingen har tränat än idag. Bli den som startar.';
}

export function createSquadUI({I, esc, button, avatar, levelOf, rankOf}) {
  const ring = (m, i, size = '') => `<span class="sq-ring ${m.trained_today ? 'lit' : ''} ${size}">${avatar(m.display_name, tones[i % 4], m.photo)}${m.trained_today ? `<i class="sq-ring-dot" aria-hidden="true">${I('check')}</i>` : ''}</span>`;

  // Header of the squad page.
  function hero({name, ms, posts, meId, today, weekStart, code, canCopy, ownerId}) {
    const trained = ms.filter(m => m.trained_today).length, week = weekPulse(posts, today, weekStart), total = week.reduce((n, d) => n + d.n, 0), max = Math.max(3, ...week.map(d => d.n));
    const best = ms.reduce((b, m) => (m.training_streak || 0) > (b?.training_streak || 0) ? m : b, null);
    return `<section class="sq-hero">
<div class="sq-hero-glow" aria-hidden="true"></div>
<div class="sq-hero-head"><div><span class="eyebrow">DITT SQUAD</span><h2>${esc(name)}</h2><p class="sq-tagline">${esc(tagline(ms, meId))}</p></div>
<div class="sq-today" role="img" aria-label="${trained} av ${ms.length} har tränat idag"><svg viewBox="0 0 44 44" aria-hidden="true"><circle class="sq-today-track" cx="22" cy="22" r="19"/><circle class="sq-today-fill" cx="22" cy="22" r="19" style="stroke-dasharray:${(119.4 * trained / Math.max(1, ms.length)).toFixed(1)} 119.4"/></svg><b>${trained}<small>/${ms.length}</small></b></div></div>
<div class="sq-faces">${ms.map((m, i) => `<button class="sq-face" data-action="profile-of:${esc(m.user_id)}" aria-label="Visa profil för ${esc(m.display_name)}">${ring(m, i)}</button>`).join('')}<span class="sq-faces-label">${trained ? `<span>${trained} av ${ms.length}</span> <span>har tränat idag</span>` : '<span>Ingen har tränat än idag</span>'}</span></div>
<div class="sq-stats">
 <div><b>${total}</b><small>pass den här veckan</small></div>
 <div><b>${best?.training_streak || 0}</b><small>${best?.training_streak ? `<span>längsta flamman</span> · ${esc(best.display_name)}` : 'längsta flamman'}</small></div>
 <div><b>${ms.reduce((n, m) => n + (m.completed_week || 0), 0)}</b><small>vanor i veckan</small></div>
</div>
<div class="sq-week" aria-label="Pass per dag den här veckan">${week.map(d => `<span class="sq-day ${d.today ? 'today' : ''} ${d.future ? 'future' : ''}" title="${d.n} pass"><i style="--h:${d.n ? Math.max(18, Math.round(d.n / max * 100)) : 0}%">${d.n ? `<em>${d.n}</em>` : ''}</i><small>${d.label}</small></span>`).join('')}</div>
<div class="sq-invite"><div><small>Squad-kod · bjud in en vän</small><code id="squad-code">${code}</code></div>${button(I('plus') + ' Kopiera', 'copy-squad-code', 'btn ghost', canCopy ? '' : 'disabled')}</div>
</section>
<div class="sq-members" role="list" aria-label="Medlemmar">${ms.map((m, i) => `<button class="sq-member ${m.user_id === meId ? 'me' : ''}" role="listitem" data-action="profile-of:${esc(m.user_id)}">${ring(m, i, 'big')}<strong>${esc(m.display_name)}${m.user_id === meId ? ' <span class="muted">(du)</span>' : ''}</strong><small><span>LVL ${levelOf(m.xp || 0)}</span> · <span>${esc(rankOf(m.xp || 0))}</span></small><span class="sq-member-status ${m.trained_today ? 'lit' : ''}">${I('flame')}<b>${m.training_streak || 0}</b><span>${m.trained_today ? 'Tränat idag' : m.training_streak ? 'Vilar' : 'Redo'}</span></span>${m.user_id === ownerId ? `<span class="sq-crown" title="Skapade squadet">${I('trophy')}</span>` : ''}</button>`).join('')}<button class="sq-member sq-member-add" data-action="copy-squad-code">${I('plus')}<strong>Bjud in</strong><small>Kopiera koden</small></button></div>`;
  }

  // The small grey line under a name: what the post is about.
  function action(p) {
    const a = parseActivity(p.body);
    if (p.workout) return p.workout.kind === 'cardio' ? (p.workout.activity === 'run' ? 'Var ute och sprang' : 'Loggade en aktivitet') : 'Körde ett pass';
    if (a?.kind === 'habit') return a.done ? 'Klarade en vana' : 'På väg mot en vana';
    if (a?.kind === 'cardio') return a.activity === 'run' ? 'Var ute och sprang' : 'Loggade en aktivitet';
    if (/^Återtagen/.test(p.body || '')) return 'Ändrade en registrering';
    return p.image_path ? 'Delade en bild' : 'Delade en tanke';
  }

  // A shared habit as a card instead of "Klar · Läs en bok · 10 / 10 · 2026-11-13".
  function habitCard(p, categoryOf) {
    const a = parseActivity(p.body);
    if (a?.kind !== 'habit') return '';
    const c = categoryOf(a.name);
    return `<div class="sq-habit ${a.done ? 'done' : ''}" style="--cat:${c.color}"><span class="sq-habit-icon">${I(c.icon)}</span><span class="sq-habit-text"><small>${a.done ? 'VANA KLAR' : 'PÅ VÄG'}</small><strong>${esc(a.name)}</strong><span class="sq-habit-bar"><i style="width:${Math.min(100, Math.round(a.value / Math.max(1, a.target) * 100))}%"></i></span></span><span class="sq-habit-count"><b>${a.value}</b>/${a.target}${a.minutes ? `<small>${a.minutes} min</small>` : ''}</span></div>`;
  }

  // Round pictures under a post. Tap one to see it bigger.
  function photoRow(post, nameOf) {
    const list = post.photoReactions || [];
    if (!list.length) return '';
    return `<div class="sq-photo-reacts">${list.slice(0, 8).map(r => `<button class="sq-photo-react" data-action="sq:photo-view:${esc(post.id)}:${esc(r.user_id)}" aria-label="Bildreaktion från ${esc(nameOf(r.user_id))}"><img data-photo="${esc(r.image_path)}" alt=""></button>`).join('')}<span class="sq-photo-names">${list.length === 1 ? `<b>${esc(nameOf(list[0].user_id))}</b> <span>reagerade med en bild</span>` : `<span>${list.length} bildreaktioner</span>`}</span></div>`;
  }

  // Inside the reaction menu: your own pictures to react with, plus a new one.
  function photoPicker(post, stickers, mine) {
    return `<div class="sq-sticker-pick"><span class="eyebrow">REAGERA MED EN EGEN BILD</span><div class="sq-stickers">${stickers.map((path, i) => button(`<img data-photo="${esc(path)}" alt="">`, `sq:sticker:${post.id}:${i}`, `sq-sticker ${mine === path ? 'active' : ''}`, `aria-label="Reagera med din bild ${i + 1}" aria-pressed="${mine === path}"`)).join('')}<label class="sq-sticker sq-sticker-new" aria-label="Ny bild som reaktion"><input type="file" accept="image/*" data-react-photo="${esc(post.id)}" hidden>${I('camera')}<span>Ny</span></label>${mine ? button(I('close'), `sq:unphoto:${post.id}`, 'sq-sticker sq-sticker-clear', 'aria-label="Ta bort din bildreaktion"') : ''}</div></div>`;
  }

  // The step after saving a workout or a run: one tap to add a photo to its squad post.
  function photoStep(eventKey, photo = null, busy = false) {
    const input = `<input type="file" accept="image/*" data-activity-photo="${esc(eventKey)}" hidden>`;
    if (photo) return `<div class="sq-photo-step done" data-photo-step="${esc(eventKey)}"><img data-photo="${esc(photo)}" alt="Bilden på ditt pass"><div><b>${I('check')} <span>Bilden är delad med squadet</span></b><label class="sq-photo-change">${input}${I('camera')} <span>Byt bild</span></label></div></div>`;
    return `<label class="sq-photo-step ${busy ? 'busy' : ''}" data-photo-step="${esc(eventKey)}">${input}<span class="sq-photo-icon">${I('camera')}</span><span><b>${busy ? 'Laddar upp…' : 'Lägg till en bild från passet'}</b><small>Den visas på ditt inlägg i squadets flöde.</small></span>${I('plus')}</label>`;
  }

  // The bar after a check-in: share this habit with the squad, and optionally always.
  function shareBar({name, shared, always, xpText, habitId, day}) {
    return `<div class="sq-share-bar ${shared ? 'shared' : ''}" role="status">
<div class="sq-share-text">${xpText ? `<small>${esc(xpText)}</small>` : ''}<strong>${shared ? '<span>Delad med squadet</span>' : '<span>Dela med squadet?</span>'}</strong><span class="sq-share-name">${esc(name)}</span></div>
${button(shared ? I('check') + ' Delad' : I('users') + ' Dela', `sq:share:${habitId}:${day}`, `btn ${shared ? 'ghost' : ''} sq-share-btn`, `aria-pressed="${shared}"`)}
<label class="sq-share-always"><input type="checkbox" data-share-always="${esc(habitId)}" ${always ? 'checked' : ''}><span>Dela alltid den här vanan</span></label>
${button(I('close'), 'sq:share-close', 'icon-btn sq-share-close', 'aria-label="Stäng"')}</div>`;
  }

  return {hero, action, habitCard, photoRow, photoPicker, photoStep, shareBar, when};
}
