// Skill tree: an own destination in the bottom tab bar with a category dropdown.
//
// Add a new category in two steps:
// 1. Add an entry to `skillCategories` below (id, name, icon, color, tagline).
//    Entries with `soon: true` show in the dropdown as "Kommer snart" and cannot be chosen.
// 2. Remove `soon` and pass a view for the same id to createSkillTreeUI({categories}) in app.js:
//    {view: () => html, progress: () => ({done, total})}.
// Förslag på nivåer för kommande kategorier finns i docs/skill-tree-kategorier.md.
export const skillCategories = [
  {id: 'calisthenics', name: 'Calisthenics', icon: 'dumbbell', color: '#c6e7df', tagline: 'Kroppsvikt från grund till skill'},
  {id: 'core', name: 'Core', icon: 'plank', color: '#ffca84', tagline: 'Bålstyrka från plankan till dragon flag', soon: true},
  {id: 'running', name: 'Löpning', icon: 'run', color: '#a7bcfa', tagline: 'Från första kilometern till milen och längre', soon: true},
  {id: 'music', name: 'Musik', icon: 'music', color: '#e1b6d8', tagline: 'Gehör, bas och sång'},
];

const STORE = 'arc-skill-category';
const remembered = () => { try { return localStorage.getItem(STORE) || ''; } catch { return ''; } };
const remember = id => { try { localStorage.setItem(STORE, id); } catch {} };

export function createSkillTreeUI({I, esc, render, categories = {}, list = skillCategories}) {
  const ready = c => !c.soon && typeof categories[c.id]?.view === 'function';
  const options = () => list.filter(c => ready(c) || c.soon);
  const pick = id => list.find(c => c.id === id && ready(c)) || list.find(ready);
  let current = pick(remembered())?.id;

  const progress = c => {
    if (!ready(c)) return null;
    const p = categories[c.id].progress?.();
    return p && p.total ? p : null;
  };
  const progressText = p => p ? `${p.done}/${p.total} nivåer` : '';

  function option(c) {
    const active = c.id === current, p = progress(c);
    if (c.soon) return `<li><div class="skt-opt soon" aria-disabled="true" style="--cat:${c.color}">
      <span class="skt-ico">${I(c.icon)}</span><span class="skt-text"><strong>${esc(c.name)}</strong><small>${esc(c.tagline)}</small></span>
      <span class="skt-soon">Kommer snart</span></div></li>`;
    return `<li><button type="button" class="skt-opt ${active ? 'active' : ''}" data-action="skt:cat:${c.id}" ${active ? 'aria-current="true"' : ''} style="--cat:${c.color}">
      <span class="skt-ico">${I(c.icon)}</span><span class="skt-text"><strong>${esc(c.name)}</strong><small>${esc(c.tagline)}${p ? ' · ' + progressText(p) : ''}</small></span>
      <span class="skt-check">${active ? I('check') : ''}</span></button></li>`;
  }

  function picker(c) {
    const p = progress(c), total = options().length, soon = options().filter(x => x.soon).length;
    return `<details class="skt-picker" style="--cat:${c.color}">
      <summary aria-label="Kategori: ${esc(c.name)}. Byt kategori">
        <span class="skt-ico">${I(c.icon)}</span>
        <span class="skt-text"><small>KATEGORI</small><strong>${esc(c.name)}</strong></span>
        ${p ? `<span class="skt-count">${progressText(p)}</span>` : ''}
        <span class="skt-caret">${I('chevron')}</span>
      </summary>
      <div class="skt-menu"><p class="skt-menu-head">Välj skill tree <span class="muted">${total - soon} av ${total} öppna</span></p>
        <ul>${options().map(option).join('')}</ul></div>
    </details>`;
  }

  function view() {
    const c = pick(current);
    if (!c) return `<div class="card"><p class="muted">Inga skill-träd är tillgängliga ännu.</p></div>`;
    current = c.id;
    return `<div class="skt-head">${picker(c)}</div><div class="skt-body" data-skill-category="${c.id}">${categories[c.id].view()}</div>`;
  }

  function action([cmd, id]) {
    if (cmd !== 'cat') return false;
    const c = pick(id);
    if (!c || c.id !== id) throw Error('Den kategorin är inte öppen ännu.');
    current = id; remember(id); render();
    return true;
  }

  // The dropdown closes when you tap outside it or press Escape.
  if (typeof document !== 'undefined') {
    document.addEventListener('click', e => {
      for (const d of document.querySelectorAll('details.skt-picker[open]')) if (!d.contains(e.target)) d.open = false;
    });
    document.addEventListener('keydown', e => {
      const d = document.querySelector('details.skt-picker[open]');
      if (e.key === 'Escape' && d) { d.open = false; d.querySelector('summary').focus(); }
    });
  }

  return {view, action, current: () => current};
}
