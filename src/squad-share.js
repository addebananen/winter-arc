// What reaches the squad feed. Finished workouts and runs always do (server rule, migration 031).
// Habits and other cardio only when the member picks them. Saved in the payload as
// squadShare = {entries:["<day>:<habit id>"], cardio:["<session id>"], always:["<habit id>"]}.
// Entries are never pruned: removing an old key would take that old post away from the feed.
// `always` is only a client convenience that picks the habit automatically at check-in.
export const AUTO_CARDIO = 'run';
const list = v => Array.isArray(v) ? v.filter(x => typeof x === 'string').slice(-2000) : [];
export function ensure(s) {
  const q = s.squadShare && typeof s.squadShare === 'object' && !Array.isArray(s.squadShare) ? s.squadShare : {};
  s.squadShare = {...q, entries: list(q.entries), cardio: list(q.cardio), always: list(q.always)};
  return s.squadShare;
}
export const entryKey = (day, id) => `${day}:${id}`;
export const isShared = (s, day, id) => list(s.squadShare?.entries).includes(entryKey(day, id));
export const isAlways = (s, id) => list(s.squadShare?.always).includes(id);
function toggle(arr, key, on) { const next = arr.filter(x => x !== key); if (on) next.push(key); return next; }
export function setShared(s, day, id, on) { const q = ensure(s); q.entries = toggle(q.entries, entryKey(day, id), on); }
export function setAlways(s, id, on) { const q = ensure(s); q.always = toggle(q.always, id, on); }
export const cardioShared = (s, w) => !!w && (w.kind === AUTO_CARDIO || list(s.squadShare?.cardio).includes(w.id));
export function setCardioShared(s, id, on) { const q = ensure(s); q.cardio = toggle(q.cardio, id, on); }

// The text the server writes for a shared habit, so the demo feed and the real feed look the same.
export function habitPostBody(entry, day) {
  return `${entry.value >= entry.target ? 'Klar' : 'På väg'} · ${entry.name || 'Dagens vana'} · ${entry.value} / ${entry.target}${entry.durationMinutes ? ` · ${entry.durationMinutes} min` : ''} · ${day}`;
}
// Reads an automatic activity post back into parts, so the feed can show it as a card instead of a
// dry line of text. Returns null for anything a member wrote by hand.
export function parseActivity(body = '') {
  const parts = String(body).split(' · ');
  const date = /^\d{4}-\d{2}-\d{2}$/.test(parts.at(-1) || '') ? parts.at(-1) : null;
  if (!date) return null;
  if (parts[0] === 'Klar' || parts[0] === 'På väg') {
    const rest = parts.slice(1, -1), ratio = /^([\d.]+) \/ ([\d.]+)$/;
    const minutes = rest.length >= 3 && / min$/.test(rest.at(-1)) && ratio.test(rest.at(-2)) ? parseFloat(rest.pop()) : null;
    const m = ratio.exec(rest.pop() || '');
    if (!m || !rest.length) return null;
    return {kind: 'habit', done: parts[0] === 'Klar', name: rest.join(' · '), value: Number(m[1]), target: Number(m[2]), minutes, date};
  }
  const cardio = {'Löpning': 'run', 'Promenad': 'walk', 'Volleyboll': 'volleyball', 'Klättring': 'climb'};
  const head = /^(.+) klart$/.exec(parts[0]);
  if (head && cardio[head[1]] && parts.length === 4) return {kind: 'cardio', activity: cardio[head[1]], km: parseFloat(parts[1]), minutes: parseFloat(parts[2]), date};
  return null;
}
