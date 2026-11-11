import test from 'node:test';
import assert from 'node:assert/strict';
import {heroForm,heroCharacter,HERO_ID} from '../src/hero-character.js';
import {character} from '../src/graphics.js';
import {characters} from '../src/fitness.js';

test('Adrian has five forms, one every five levels',()=>{
 assert.deepEqual([1,5,6,10,11,15,16,20,21,60].map(heroForm),[1,1,2,2,3,3,4,4,5,5]);
 assert.equal(heroForm(0),1);
});
test('form 1 is Adrian without powers and later forms carry energy',()=>{
 assert.doesNotMatch(heroCharacter(1),/hero-orb|hero-spark/);
 for(const level of [6,11,16,21]){const svg=heroCharacter(level);assert.match(svg,/hero-orb/);assert.match(svg,new RegExp(`hero/lv${heroForm(level)}\\.jpg`));}
 assert.match(heroCharacter(16),/hero-bolt/);
});
test('the character is selectable and drawn through the shared character() entry point',()=>{
 assert.ok(characters.some(c=>c.id===HERO_ID));
 assert.match(character(11,true,HERO_ID),/class="character hero-character hero-form-3 large/);
 assert.match(character(11,true,'ranger'),/char-ranger/);
});
