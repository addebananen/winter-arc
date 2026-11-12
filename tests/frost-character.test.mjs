import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {FROST_ID, frostForm, frostForms, frostCharacter} from '../src/frost-character.js';
import {character} from '../src/graphics.js';
import {characters} from '../src/fitness.js';

test('the Frost mage grows through five forms, one every five levels from the little one at level 1', () => {
  assert.deepEqual(frostForms.map(([level]) => level), [1, 6, 11, 16, 21]);
  assert.equal(frostForms[0][1], 'Knatten');
  assert.deepEqual([1, 5, 6, 10, 11, 15, 16, 20, 21, 60].map(frostForm), [1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  for (const [level] of frostForms) {
    const form = frostForm(level);
    assert.match(frostCharacter(level), new RegExp(`href="\\./frost/lv${form}\\.webp"`));
    assert.ok(existsSync(new URL(`../src/frost/lv${form}.webp`, import.meta.url)), `picture for form ${form}`);
  }
  // The little one has no magic sparks yet; later forms do.
  assert.doesNotMatch(frostCharacter(1), /hero-spark/);
  assert.match(frostCharacter(21), /hero-spark/);
});

test('the Frost mage is selectable, lists its forms and is drawn through character()', () => {
  const c = characters.find(c => c.id === FROST_ID);
  assert.ok(c);
  assert.equal(c.forms, frostForms);
  assert.match(character(11, true, FROST_ID), /class="character frost-character frost-form-3 large/);
  assert.match(character(11, true, 'ranger'), /char-ranger/);
});
