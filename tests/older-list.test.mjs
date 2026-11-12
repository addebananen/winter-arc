import test from 'node:test';
import assert from 'node:assert/strict';
import {recentThenOlder, weekAgo} from '../src/older-list.js';

test('sessions from the last week show directly; older ones fold into a "show older" list at the bottom', () => {
  assert.equal(weekAgo('2026-11-12'), '2026-11-05');
  const items = ['2026-11-12', '2026-11-05', '2026-11-04', '2026-10-20'].map(date => ({date}));
  const html = recentThenOlder(items, '2026-11-12', x => `<i>${x.date}</i>`);
  const [shown, folded] = html.split('<details');
  assert.match(shown, /2026-11-12.*2026-11-05/);
  assert.doesNotMatch(shown, /2026-11-04|2026-10-20/);
  assert.match(folded, /Visa äldre pass \(2\)<\/summary><i>2026-11-04<\/i><i>2026-10-20<\/i><\/details>/);
  // Nothing older: no fold. Nothing recent: a short note, then the fold.
  assert.doesNotMatch(recentThenOlder(items.slice(0, 2), '2026-11-12', x => x.date), /details/);
  assert.match(recentThenOlder(items.slice(2), '2026-11-12', x => x.date), /Inga pass den senaste veckan\..*<details/);
  assert.equal(recentThenOlder([], '2026-11-12', x => x.date), '');
});
