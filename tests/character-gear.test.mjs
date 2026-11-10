import test from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../src/domain.js';
import * as G from '../src/character-gear.js';

const icon = n => `<svg data-icon="${n}"></svg>`;

test('gear unlocks from real progress, can be equipped and removed, and locked items are refused', () => {
  const s = D.normalizeState(D.blankState('2026-11-10'), '2026-11-07T12:00:00Z');
  const fresh = G.progressOf(s, '2026-11-10');
  assert.equal(fresh.level, 1);
  assert.throws(() => G.equip(s, 'aura', 'aura-frost', fresh), /level 3/);
  const strong = {level: 12, workouts: 25, streak: 8, skills: 2};
  G.equip(s, 'aura', 'aura-aurora', strong);
  G.equip(s, 'emblem', 'emblem-trophy', strong);
  G.equip(s, 'cape', 'cape-crimson', strong);
  assert.deepEqual(G.lookOf(s, strong), {aura: 'aura-aurora', cape: 'cape-crimson', emblem: 'emblem-trophy'});
  assert.throws(() => G.equip(s, 'aura', 'emblem-flame', strong), /finns inte/, 'An item only fits its own slot');
  assert.throws(() => G.equip(s, 'hat', 'aura-frost', strong), /platsen/);
  G.equip(s, 'cape', 'none', strong);
  assert.equal(G.lookOf(s, strong).cape, undefined);
  assert.deepEqual(G.lookOf(s, fresh), {}, 'Items that are no longer unlocked are not shown');
  assert.equal(G.requirement(G.gearById['emblem-tree']), 'Nå 10 nivåer i skill tree');
});

test('the gear layer wraps the character only when something is equipped', () => {
  assert.equal(G.gearLayer('<svg class="character"></svg>', {}, icon), '<svg class="character"></svg>');
  const html = G.gearLayer('<svg class="character"></svg>', {aura: 'aura-ember', emblem: 'emblem-flame'}, icon);
  assert.match(html, /gear-aura/);
  assert.match(html, /--aura:#ff9a4a/);
  assert.match(html, /data-icon="flame"/);
  assert.doesNotMatch(html, /gear-cape/);
  for (const slot of G.gearSlots) assert.ok(G.gearItems.some(g => g.slot === slot.id), slot.id);
});
