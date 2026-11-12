// Session lists show the last week; older sessions fold into a "Visa äldre pass" list at the bottom.
// items: newest first, each with a date (YYYY-MM-DD). render: item -> html.
export function weekAgo(today) {
  const d = new Date(today + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
}
export function recentThenOlder(items, today, render, label = 'Visa äldre pass') {
  const cut = weekAgo(today), recent = items.filter(x => x.date >= cut), older = items.filter(x => x.date < cut);
  if (!older.length) return recent.map(render).join('');
  const hint = recent.length ? '' : '<p class="fitness-hint space">Inga pass den senaste veckan.</p>';
  return `${recent.map(render).join('')}${hint}<details class="older-list"><summary class="btn ghost full space">${label} (${older.length})</summary>${older.map(render).join('')}</details>`;
}
