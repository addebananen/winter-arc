// XP rules from 2026-11-10: only five activities give XP, at most once per day each.
//
// Everything else (own habits, other library habits, quests, combos, programs, breathing, other
// cardio and the skill tree) still counts in the character's stats, but gives no XP, level or rank.
// XP earned before this date is kept exactly as it was (see legacy rules in domain.js).
// The server mirrors these rules in supabase/018_xp_rules.sql; keep both in sync.
export const XP_RULES_START = '2026-11-10';

// habit: index in the habit library (domain.js), so entries are matched by activityKey 'habit:N'.
export const xpActivities = [
  {id: 'strength', name: 'Styrkepass', habit: 0, habitName: 'Styrketräning', xp: 40},
  {id: 'run', name: 'Löpningspass', habit: 8, habitName: 'Löpning', xp: 35},
  {id: 'read', name: 'Läsa 10 sidor', habit: 2, habitName: 'Läs en bok', xp: 25},
  {id: 'stretch', name: 'Stretching 10 minuter', habit: 9, habitName: 'Rörlighet', xp: 20},
  {id: 'cold', name: 'Kalldusch', habit: 11, habitName: 'Kall avslutning på duschen', xp: 15},
];

export const rulesActive = day => day >= XP_RULES_START;
const lower = s => String(s || '').trim().toLocaleLowerCase('sv-SE');
const matches = (e, a) => e.activityKey ? e.activityKey === 'habit:' + a.habit : lower(e.name) === lower(a.habitName);

// The XP activity a habit (or a history entry) belongs to, or null when it only counts in stats.
export function xpActivityOf(h, templateIndex) {
  if (templateIndex != null) return xpActivities.find(a => a.habit === templateIndex) || null;
  return xpActivities.find(a => matches(h, a)) || null;
}

// XP for one day under the new rules, with the parts that earned it.
export function rulesDayXP(state, day) {
  const done = Object.values(state.history?.[day]?.entries || {}).filter(e => e.source !== 'challenge' && e.value >= e.target);
  const fromHabit = a => Math.max(0, ...done.filter(e => matches(e, a)).map(e => Math.min(a.xp, Number(e.xp) || 0)));
  const workout = (state.strength?.sessions || []).some(w => w.finishedAt && w.date === day);
  const run = (state.cardio?.sessions || []).some(w => w.kind === 'run' && w.date === day);
  const parts = {};
  for (const a of xpActivities) {
    const xp = (a.id === 'strength' && workout) || (a.id === 'run' && run) ? a.xp : fromHabit(a);
    if (xp) parts[a.id] = xp;
  }
  return {total: Object.values(parts).reduce((n, x) => n + x, 0), parts};
}
