// Skill goals: pick a skill you want (for example Handstand) and the app lays out the whole road
// there, including the prerequisite trees, and builds ready workouts from where you are right now.
//
// Templates only use exercises that already exist in the skill catalog (sk-<tree>-<level>), so no
// database update is needed. Levels still unlock the usual way: by saving a workout where the goal
// sets are logged with clean form.
//
// The chosen goal is stored in the save file as `skillGoal` (a tree id). Like the skill levels it
// never gives XP or rank.
import * as SK from './skills.js';

// What to warm up with and what builds the strength around each goal. Trees not listed fall back
// to their own branch: mobility goals warm up with wrists, strength goals get core as support.
export const GOAL_PLAN = {
  handstand: {warmup: ['wrists', 'shoulder-flex'], support: ['hspu', 'core'], tip: 'Kort och ofta slår långt och sällan. 10–15 minuter balans 4–6 dagar i veckan bygger handstand snabbast.'},
  hspu: {warmup: ['wrists', 'shoulder-flex'], support: ['handstand', 'dip'], tip: 'Pressen växer med vilan. Kör 2–3 pass i veckan med en vilodag emellan.'},
  oahs: {warmup: ['wrists', 'shoulder-flex'], support: ['handstand', 'core'], tip: 'Bygg på en stabil tvåhandsstående först. Korta försök, full vila.'},
  'l-sit': {warmup: ['wrists', 'pike'], support: ['core', 'dip'], tip: 'Kompression och rörlighet i baksida lår avgör. Stretcha pike nästan varje dag.'},
  'muscle-up': {warmup: ['shoulder-ext'], support: ['pull', 'dip'], tip: 'Explosiva pull-ups till bröstet och starka dips är grunden. Teknik före volym.'},
  'front-lever': {warmup: ['shoulder-flex'], support: ['pull', 'core'], tip: 'Raka armar och nedtryckta skuldror. Korta, tunga håll med lång vila.'},
  'back-lever': {warmup: ['shoulder-ext'], support: ['pull', 'core'], tip: 'Bygg upp axlarnas extension försiktigt. Gå aldrig in i smärta i biceps.'},
  planche: {warmup: ['wrists'], support: ['push', 'core'], tip: 'Planche tar lång tid. Lutning framåt och raka armar, vecka för vecka.'},
  flag: {warmup: ['shoulder-flex'], support: ['pull', 'core'], tip: 'Tryck med nedre armen, dra med övre. Träna båda sidor.'},
  pull: {warmup: ['shoulder-flex'], support: ['core', 'push'], tip: 'Kontrollerade negativa reps bygger första pull-upen.'},
  push: {warmup: ['wrists'], support: ['core', 'dip'], tip: 'Spänd kropp som en planka i varje rep.'},
  dip: {warmup: ['shoulder-ext'], support: ['push', 'core'], tip: 'Sänk bara så djupt du kontrollerar.'},
  legs: {warmup: ['ankles'], support: ['core', 'hips'], tip: 'Rörlighet i fotleden är ofta det som stoppar pistolen.'},
  core: {warmup: ['pike'], support: ['push', 'legs'], tip: 'Kroppslinjen bär alla skills. Kvalitet före tid.'},
};
const planOf = t => GOAL_PLAN[t.id] || (t.branch === 'mobility' ? {warmup: ['wrists'].filter(id => id !== t.id), support: []} : {warmup: [], support: ['core']});

// Goals shown first in the goal picker.
export const FEATURED = ['handstand', 'pull', 'muscle-up', 'l-sit', 'front-lever', 'legs', 'planche', 'hips'];

export const goalOf = s => SK.treeById[s?.skillGoal] ? s.skillGoal : null;
export function setGoal(s, id) {
  if (id && !SK.treeById[id]) throw Error('Välj ett skill-träd i listan.');
  if (id) s.skillGoal = id; else delete s.skillGoal;
  return s;
}

// The road to mastering a tree, in the order you unlock it: every level of the prerequisite trees
// that is needed (and of level prerequisites) comes before the level that needs it. The order is
// the same for everyone; `done` and `next` come from the person's own progress.
const roads = new Map();
export function road(goal) {
  if (roads.has(goal)) return roads.get(goal);
  const cur = {}, steps = [];
  const ensure = (id, n) => {
    const t = SK.treeById[id];
    for (const [r, k] of t.requires || []) ensure(r, k);
    for (let k = (cur[id] || 0) + 1; k <= n; k++) {
      for (const [r, m] of t.levels[k - 1].requires || []) ensure(r, m);
      if ((cur[id] || 0) >= k) continue;
      cur[id] = k; steps.push({tree: id, n: k, id: `sk-${id}-${k}`});
    }
  };
  ensure(goal, SK.treeById[goal].levels.length);
  roads.set(goal, steps);
  return steps;
}

export function pathOf(s, goal) {
  const steps = road(goal).map(x => {
    const t = SK.treeById[x.tree], level = t.levels[x.n - 1];
    return {...x, level, treeName: t.name, own: x.tree === goal, done: SK.levelOf(s, x.tree) >= x.n};
  });
  const ready = steps.filter(x => !x.done && SK.levelOf(s, x.tree) === x.n - 1 && SK.canTrain(s, x.tree, x.n));
  const done = steps.filter(x => x.done).length;
  const goalTree = SK.treeById[goal], goalLevel = SK.levelOf(s, goal);
  return {goal, tree: goalTree, steps, ready, next: ready[0] || null, done, total: steps.length,
    ratio: steps.length ? done / steps.length : 1, mastered: goalLevel >= goalTree.levels.length,
    goalLevel, prereqLeft: steps.filter(x => !x.own && !x.done).length};
}

// Ready workouts for a goal.
// full: warm-up, every step you can unlock now (up to four), the level you just reached to
//       consolidate, and support strength. Up to six exercises (about 30–45 minutes).
// quick: one warm-up, the most important step and one support exercise (about 15 minutes).
export const KINDS = {
  full: {name: 'Skill-pass', max: 6, main: 4},
  quick: {name: 'Snabbpass', max: 3, main: 1},
};

export function template(s, goal, kind = 'full', {allowed = () => true, day = null} = {}) {
  const t = SK.treeById[goal]; if (!t) throw Error('Välj ett skill-träd i listan.');
  const spec = KINDS[kind] || KINDS.full, plan = planOf(t), p = pathOf(s, goal);
  const savedToday = new Set(), active = s.strength?.active;
  for (const w of s.strength?.sessions || []) if (day && w.date === day) for (const e of w.exercises || []) savedToday.add(SK.workoutVariant(e.id) || e.id);
  for (const e of active?.exercises || []) savedToday.add(SK.workoutVariant(e.id) || e.id);
  const items = [], trees = new Set(), anims = new Set();
  const add = (tree, n, role) => {
    const id = `sk-${tree}-${n}`, e = SK.workoutById[id];
    if (!e || (trees.has(tree) && role !== 'Befäst') || items.some(x => x.id === id) || anims.has(e.skillAnim) || savedToday.has(e.skillAnim) || savedToday.has(id) || !SK.canTrain(s, tree, n) || !allowed(id)) return false;
    trees.add(tree); anims.add(e.skillAnim);
    items.push({id, tree, n, role, level: SK.treeById[tree].levels[n - 1], sets: e.skillSets, amount: e.skillAmount, unit: e.unit});
    return true;
  };
  // Something you already master is the best warm-up; a beginner starts at level 1.
  const easy = id => { const l = SK.levelOf(s, id); return l > 0 ? l : 1; };
  const next = id => { const t2 = SK.treeById[id], l = SK.levelOf(s, id); return l < t2.levels.length && SK.canTrain(s, id, l + 1) ? l + 1 : l || null; };

  const main = [], warm = [], support = [];
  const mainSteps = p.mastered ? [{tree: goal, n: t.levels.length}] : p.ready.slice(0, spec.main);
  for (const x of mainSteps) main.push([x.tree, x.n, x.tree === goal ? 'Huvudfokus' : 'Förkunskap']);
  const mainTrees = new Set(mainSteps.map(x => x.tree));
  for (const id of plan.warmup) if (!mainTrees.has(id)) warm.push([id, easy(id), 'Uppvärmning']);
  if (kind === 'full' && !p.mastered && p.goalLevel > 0 && mainTrees.has(goal)) main.push([goal, p.goalLevel, 'Befäst']);
  for (const id of plan.support) { const n = next(id); if (n) support.push([id, n, 'Stödstyrka']); }

  if (kind === 'quick') {
    add(...(warm[0] || [])) || warm.slice(1).some(w => add(...w));
    main.some(m => add(...m));
    support.some(x => add(...x)) || main.slice(1).some(m => add(...m));
  } else {
    for (const w of warm) if (items.length < spec.max) add(...w);
    for (const m of main) if (items.length < spec.max) add(...m);
    for (const x of support) if (items.length < spec.max) add(...x);
  }
  // The trees chosen above are added in one order; the workout runs warm-up → main → support.
  const order = {Uppvärmning: 0, Befäst: 1, Förkunskap: 2, Huvudfokus: 2, Stödstyrka: 3};
  items.sort((a, b) => order[a.role] - order[b.role]);
  const sets = items.reduce((n, x) => n + x.sets, 0);
  // Rough time: the work itself plus about a minute of rest per set and a few minutes to set up.
  const seconds = items.reduce((n, x) => n + x.sets * ((x.unit === 'sek' ? x.amount : x.amount * 3) + 60), 0);
  return {goal, kind, name: spec.name, items, ids: items.map(x => x.id), sets, minutes: Math.max(5, Math.round(seconds / 60 + 3)), tip: plan.tip || ''};
}

// Level a goal-set counts toward in the active workout: how many logged clean sets meet the goal.
export function goalProgress(exercise, meta) {
  if (!meta?.skillTree) return null;
  const hit = (exercise.sets || []).filter(x => x.done && x.quality === true && x.reps >= meta.skillAmount).length;
  return {hit, need: meta.skillSets, amount: meta.skillAmount, unit: meta.unit, complete: hit >= meta.skillSets};
}
