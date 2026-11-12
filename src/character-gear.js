// Character gear: aura, emblem and cape, unlocked by real progress and saved in state.profile.look.
//
// This is the foundation for character customisation before the final artwork exists. Each item has
// its own unlock rule and a simple placeholder look (colour, icon). When the real artwork is ready,
// only gearLayer() needs to draw it; the slots, unlocks and saved choices stay the same.
import * as D from './domain.js';
import * as S from './strength.js';
import * as SK from './skills.js';

export const gearSlots = [
  {id: 'aura', name: 'Aura', hint: 'Ett sken runt din karaktär.'},
  {id: 'cape', name: 'Mantel', hint: 'En mantel bakom din karaktär.'},
  {id: 'emblem', name: 'Emblem', hint: 'Ett märke på bröstet.'},
];

// req: what unlocks the item. level = character level, workouts = saved strength workouts,
// streak = best training streak in days, skills = skill-tree levels reached.
export const gearItems = [
  {id: 'aura-frost', slot: 'aura', name: 'Frostsken', color: '#9fd8ff', req: {level: 3}},
  {id: 'aura-aurora', slot: 'aura', name: 'Norrsken', color: '#7ff0c4', req: {level: 6}},
  {id: 'aura-ember', slot: 'aura', name: 'Glöd', color: '#ff9a4a', req: {streak: 7}},
  {id: 'aura-legend', slot: 'aura', name: 'Legendens ljus', color: '#ffd76a', req: {level: 16}},
  {id: 'cape-night', slot: 'cape', name: 'Nattmantel', color: '#2b3a6b', req: {level: 5}},
  {id: 'cape-crimson', slot: 'cape', name: 'Karmosinmantel', color: '#b8323f', req: {workouts: 20}},
  {id: 'cape-gold', slot: 'cape', name: 'Guldmantel', color: '#c99a2e', req: {level: 20}},
  {id: 'emblem-mountain', slot: 'emblem', name: 'Bergsmärke', icon: 'mountain', color: '#c6ded0', req: {workouts: 1}},
  {id: 'emblem-flame', slot: 'emblem', name: 'Flammärke', icon: 'flame', color: '#ffb36b', req: {streak: 14}},
  {id: 'emblem-tree', slot: 'emblem', name: 'Trädmärke', icon: 'tree', color: '#9be3b0', req: {skills: 10}},
  {id: 'emblem-trophy', slot: 'emblem', name: 'Pokalmärke', icon: 'trophy', color: '#ffd76a', req: {level: 11}},
];
export const gearById = Object.fromEntries(gearItems.map(g => [g.id, g]));

export function progressOf(state, today = D.dateKey()) {
  return {
    level: D.levelInfo(D.totalXP(state)).level,
    workouts: (state.strength?.sessions || []).filter(w => w.finishedAt).length,
    streak: S.trainingStreak(state, today).best,
    skills: SK.summary(state).levels,
  };
}

const reqText = {level: n => `Nå level ${n}`, workouts: n => n === 1 ? 'Spara ditt första styrkepass' : `Spara ${n} styrkepass`, streak: n => `Nå ${n} dagars träningsstreak`, skills: n => `Nå ${n} nivåer i skill tree`};
export const requirement = item => Object.entries(item.req).map(([k, n]) => reqText[k](n)).join(' och ');
export const isUnlocked = (item, progress) => Object.entries(item.req).every(([k, n]) => (progress[k] || 0) >= n);

// The saved look, keeping only items that exist, fit their slot and are still unlocked.
export function lookOf(state, progress = progressOf(state)) {
  const saved = state.profile?.look || {}, look = {};
  for (const slot of gearSlots) {
    const item = gearById[saved[slot.id]];
    if (item && item.slot === slot.id && isUnlocked(item, progress)) look[slot.id] = item.id;
  }
  return look;
}

export function equip(state, slot, id, progress = progressOf(state)) {
  if (!gearSlots.some(s => s.id === slot)) throw Error('Den platsen finns inte.');
  state.profile.look ??= {};
  if (!id || id === 'none') { delete state.profile.look[slot]; return; }
  const item = gearById[id];
  if (!item || item.slot !== slot) throw Error('Det föremålet finns inte.');
  if (!isUnlocked(item, progress)) throw Error(requirement(item) + ' för att låsa upp ' + item.name + '.');
  state.profile.look[slot] = id;
}

// The emblem sits as a small badge in the lower corner of the character, never over the body or face:
// the drawn characters and the picture characters (Adrian, Frostmagikern, Arkanmagikern) differ in shape.
const EMBLEM_CORNER='left:auto;top:auto;right:6%;bottom:8%;transform:none';
// Placeholder artwork around a character svg. Returns html to wrap the character in.
export function gearLayer(characterSvg, look, icon) {
  const aura = gearById[look.aura], cape = gearById[look.cape], emblem = gearById[look.emblem];
  if (!aura && !cape && !emblem) return characterSvg;
  return `<span class="gear-wrap" style="${aura ? `--aura:${aura.color};` : ''}${cape ? `--cape:${cape.color};` : ''}">${aura ? '<i class="gear-aura"></i>' : ''}${cape ? '<i class="gear-cape"></i>' : ''}${characterSvg}${emblem ? `<i class="gear-emblem" style="--emblem:${emblem.color};${EMBLEM_CORNER}" title="${emblem.name}">${icon(emblem.icon)}</i>` : ''}</span>`;
}
