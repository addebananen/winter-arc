// Private gratitude journal on a habit. Writing the day's gratitudes in the habit counts as progress
// (one per line), and the text is kept in state.gratitude, which is never shared: not in squad posts,
// member profiles, leaderboards or summaries. Only the owner's own saved state holds it.
import {library} from './domain.js';

const templateIndex = library.findIndex(x => x[0] === 'Tacksamhetsjournal');
// The library habit "Tacksamhetsjournal", or an own habit with gratitude in its name.
export const isGratitude = h => !!h && (h.templateId === 'habit-' + templateIndex || /tacksam|gratitude|thankful/i.test(h.name || ''));

export const MAX_LENGTH = 500;
export const entriesFor = (state, day) => state.gratitude?.[day]?.items || [];

// Saves the day's lines and returns how many there are. Empty lines are dropped.
export function saveGratitude(state, day, lines) {
  const items = lines.map(x => String(x || '').trim().slice(0, MAX_LENGTH)).filter(Boolean);
  state.gratitude ??= {};
  if (items.length) state.gratitude[day] = {items, at: Date.now()};
  else delete state.gratitude[day];
  return items.length;
}

// Earlier days with entries, newest first.
export const history = (state, before, limit = 30) => Object.entries(state.gratitude || {})
  .filter(([day]) => day < before).sort((a, b) => b[0].localeCompare(a[0])).slice(0, limit);

export function gratitudeForm({state, day, habit, esc, form}) {
  const items = entriesFor(state, day), fields = Math.max(3, Math.min(10, habit.target || 3), items.length);
  const earlier = history(state, day);
  return `<p class="intro">${esc(habit.cue || 'Skriv ner det du är tacksam för idag.')}</p><p class="fitness-hint">Bara du kan se det du skriver här. Det delas aldrig med ditt squad.</p>`
    + form('gratitude-form', `<input type="hidden" name="id" value="${esc(habit.id)}">${Array.from({length: fields}, (_, i) => `<label>${i + 1}.<input name="line" maxlength="${MAX_LENGTH}" value="${esc(items[i] || '')}" autocomplete="off" placeholder="Jag är tacksam för …"></label>`).join('')}`, 'Spara')
    + (earlier.length ? `<details class="older-list"><summary class="btn ghost full space">Tidigare (${earlier.length})</summary>${earlier.map(([d, e]) => `<section class="settings-row"><div><h3>${esc(d)}</h3>${e.items.map(x => `<p>${esc(x)}</p>`).join('')}</div></section>`).join('')}</details>` : '');
}
