import test from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../src/domain.js';
import * as GR from '../src/gratitude.js';

test('the gratitude journal habit keeps private lines per day and counts each as progress', () => {
  const s = D.blankState('2026-11-10');
  const h = D.makeHabit(D.library.find(x => x[0] === 'Tacksamhetsjournal'), '2026-11-10');
  assert.ok(GR.isGratitude(h));
  assert.ok(GR.isGratitude({name: 'Min tacksamhet'}));
  assert.ok(!GR.isGratitude(D.makeHabit(D.library[0], '2026-11-10')));
  assert.equal(GR.saveGratitude(s, '2026-11-12', ['  Familjen ', '', 'Solen', 'x'.repeat(900)]), 3);
  assert.deepEqual(GR.entriesFor(s, '2026-11-12').slice(0, 2), ['Familjen', 'Solen']);
  assert.equal(GR.entriesFor(s, '2026-11-12')[2].length, GR.MAX_LENGTH);
  GR.saveGratitude(s, '2026-11-11', ['Igår']);
  assert.deepEqual(GR.history(s, '2026-11-12').map(([d]) => d), ['2026-11-11']);
  // Clearing every line removes the day.
  assert.equal(GR.saveGratitude(s, '2026-11-11', ['', ' ']), 0);
  assert.equal(s.gratitude['2026-11-11'], undefined);
  const html = GR.gratitudeForm({state: s, day: '2026-11-12', habit: h, esc: x => String(x), form: (id, body) => `<form id="${id}">${body}</form>`});
  assert.equal((html.match(/name="line"/g) || []).length, 3);
  assert.match(html, /value="Familjen"/);
  assert.match(html, /Det delas aldrig med ditt squad/);
});
