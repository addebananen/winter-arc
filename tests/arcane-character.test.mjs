import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {ARCANE_ID, arcaneForm, arcaneForms, arcaneCharacter} from '../src/arcane-character.js';
import {character} from '../src/graphics.js';
import {characters} from '../src/fitness.js';

test('the Arcane mage grows through five forms from Knatte to Legend, one every five levels', () => {
  assert.deepEqual(arcaneForms, [[1, 'Knatte'], [6, 'Lärling'], [11, 'Magiker'], [16, 'Mästare'], [21, 'Legend']]);
  assert.deepEqual([1, 5, 6, 10, 11, 15, 16, 20, 21, 60].map(arcaneForm), [1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  for (const [level] of arcaneForms) {
    const form = arcaneForm(level);
    assert.match(arcaneCharacter(level), new RegExp(`href="\\./arcane/lv${form}\\.webp"`));
    assert.ok(existsSync(new URL(`../src/arcane/lv${form}.webp`, import.meta.url)), `picture for form ${form}`);
  }
  assert.doesNotMatch(arcaneCharacter(1), /hero-spark/);
  assert.match(arcaneCharacter(21), /hero-spark/);
});

test('the Arcane mage is selectable, lists its forms and is drawn through character()', () => {
  const c = characters.find(c => c.id === ARCANE_ID);
  assert.ok(c);
  assert.equal(c.forms, arcaneForms);
  assert.match(character(16, true, ARCANE_ID), /class="character arcane-character arcane-form-4 large/);
});
