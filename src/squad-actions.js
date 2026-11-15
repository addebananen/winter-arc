// Squad actions: share a habit after check-in, add a photo to a just-saved workout or run, and react
// to posts with your own picture. app.js passes in what it owns (state, saving, photos, modals).
import * as Q from './squad-share.js';

export function createSquadActions(d) {
  const {I, esc, button, ui} = d;
  const attached = new Map(); // event key → photo path, for this session's "photo added" state
  let barTimer = null, bar = null;
  const state = () => d.getState();
  const demo = () => d.getMode() === 'demo';
  const posts = () => demo() ? d.demoPosts() : d.getSocial().posts;
  // Choosing what to share, workout photos and photo reactions need migration 031 in the cloud.
  const ready = () => demo() || (d.getMode() === 'cloud' && !!d.getSquad() && d.getSocial().choiceReady === true);
  const stickers = () => (Array.isArray(state().reactionImages) ? state().reactionImages : []).filter(x => typeof x === 'string').slice(0, 8);
  const nameOf = id => id === d.selfId() ? 'Du' : d.members().find(m => m.user_id === id)?.display_name || posts().find(p => p.user_id === id)?.name || 'Någon i squadet';

  // ---- Share bar after a check-in -------------------------------------------------------------
  function root() { let r = document.getElementById('sq-share-root'); if (!r) { r = document.createElement('div'); r.id = 'sq-share-root'; document.body.appendChild(r); } return r; }
  function drawBar() {
    if (!bar) return;
    const h = state().habits.find(x => x.id === bar.habitId);
    root().innerHTML = ui.shareBar({name: h?.name || '', shared: Q.isShared(state(), bar.day, bar.habitId), always: Q.isAlways(state(), bar.habitId), xpText: bar.xpText, habitId: bar.habitId, day: bar.day});
    clearTimeout(barTimer); barTimer = setTimeout(hideBar, 9000);
  }
  function hideBar() {
    clearTimeout(barTimer); bar = null;
    const el = document.querySelector('#sq-share-root .sq-share-bar');
    if (!el) return;
    el.classList.add('leaving'); setTimeout(() => { if (!bar) document.getElementById('sq-share-root')?.replaceChildren(); }, 260);
  }
  // Called after a habit is saved. Returns true when the bar took over from the usual toast.
  async function afterCheckIn(habitId, day, xpText) {
    if (!ready()) return false;
    const e = state().history[day]?.entries?.[habitId];
    if (!e || !(e.value >= e.target)) { if (bar?.habitId === habitId) hideBar(); return false; }
    if (Q.isAlways(state(), habitId) && !Q.isShared(state(), day, habitId)) await setShare(habitId, day, true);
    bar = {habitId, day, xpText}; drawBar(); return true;
  }
  async function setShare(habitId, day, on) {
    await d.commit(s => Q.setShared(s, day, habitId, on));
    if (demo()) {
      const id = 'share-' + day + '-' + habitId, list = d.demoPosts(), at = list.findIndex(p => p.id === id), e = state().history[day]?.entries?.[habitId];
      if (at >= 0) list.splice(at, 1);
      if (on && e) list.unshift({id, user_id: d.selfId(), name: state().profile.name, body: Q.habitPostBody(e, day), created_at: new Date().toISOString(), reactions: []});
      d.saveDemo();
    } else d.refreshSocial();
  }

  // ---- Photo on a just-saved workout or run ---------------------------------------------------
  function demoWorkout(kind, w) {
    if (kind === 'cardio') return {kind, date: w.date, activity: w.kind, km: w.km, seconds: w.seconds};
    const minutes = Math.max(0, Math.floor((w.finishedAt - w.startedAt - (w.pausedMs || 0)) / 60000));
    return {kind, date: w.date, title: 'Styrkepass', minutes: w.adjustedMinutes ? Math.min(minutes, w.adjustedMinutes) : minutes, exercises: (w.exercises || []).map(x => ({id: x.id, sets: (x.sets || []).filter(s => s.done).map(s => ({kg: s.kg, reps: s.reps, type: s.type || 'normal'}))})).filter(x => x.sets.length)};
  }
  // In the demo the squad feed is local, so the saved workout gets its post here.
  function demoPost(kind, w) {
    const id = 'act-' + kind + '-' + w.id, list = d.demoPosts();
    let p = list.find(x => x.id === id);
    if (!p) { p = {id, user_id: d.selfId(), name: state().profile.name, body: kind === 'cardio' ? 'Löpning klart' : 'Styrkepass klart', created_at: new Date().toISOString(), reactions: [], workout: demoWorkout(kind, w)}; list.unshift(p); d.saveDemo(); }
    return p;
  }
  function photoStep(kind, w) {
    if (!ready() || !w) return '';
    if (kind === 'cardio' && !Q.cardioShared(state(), w)) return '';
    if (demo()) demoPost(kind, w);
    const key = kind + ':' + w.id;
    return ui.photoStep(key, attached.get(key));
  }
  function redrawStep(key, html) {
    for (const el of document.querySelectorAll('[data-photo-step]')) if (el.dataset.photoStep === key) el.outerHTML = html;
    d.hydrateImages();
  }
  async function attachActivity(key, file) {
    redrawStep(key, ui.photoStep(key, null, true));
    try {
      const blob = await d.preparePhoto(file), path = await d.storePhoto(blob, 'posts');
      if (demo()) {
        const [kind, id] = [key.slice(0, key.indexOf(':')), key.slice(key.indexOf(':') + 1)];
        const w = (kind === 'cardio' ? state().cardio?.sessions : state().strength?.sessions)?.find(x => x.id === id);
        if (w) { demoPost(kind, w).image_path = path; d.saveDemo(); }
      } else { await d.cloud.attachActivityPhoto(key, path); d.refreshSocial(); }
      const before = attached.get(key); attached.set(key, path);
      redrawStep(key, ui.photoStep(key, path));
      if (before && before !== path) try { await d.deletePhoto(before); } catch {}
    } catch (err) { redrawStep(key, ui.photoStep(key, attached.get(key))); throw err; }
  }
  function cardioSaved(w) {
    if (!w) return false;
    const shared = ready() && Q.cardioShared(state(), w);
    if (!shared) return false;
    d.modal('Aktiviteten är sparad', `<div class="sp-sum"><div class="sp-sum-burst">${I('check')}</div><div class="sp-sum-grid"><div><b>${Math.round(w.seconds / 60)}</b><small>minuter</small></div>${w.km > 0 ? `<div><b>${Number(w.km).toLocaleString('sv-SE', {maximumFractionDigits: 2})}</b><small>km</small></div>` : ''}${w.kind === 'run' && w.km > 0 ? `<div><b>${Math.floor(w.seconds / w.km / 60)}:${String(Math.floor(w.seconds / w.km % 60)).padStart(2, '0')}</b><small>min/km</small></div>` : ''}</div><p class="fitness-hint space">${I('users')} <span>Delad i squadets flöde.</span></p>${photoStep('cardio', w)}${button('Klart', 'close', 'btn full space')}</div>`);
    d.hydrateImages(); return true;
  }
  // Checkbox in the "finish activity" form for cardio that is not shared automatically.
  const shareField = kind => ready() && kind !== Q.AUTO_CARDIO ? `<label class="sq-share-field"><input type="checkbox" name="share"><span><span>Dela i squadets flöde</span><small>Löpning och styrkepass delas alltid. Annat väljer du själv.</small></span></label>` : '';

  // ---- Photo reactions ------------------------------------------------------------------------
  const mine = post => (post.photoReactions || []).find(r => r.user_id === d.selfId())?.image_path || null;
  async function reactPhoto(postId, path) {
    const post = posts().find(p => p.id === postId);
    if (!post) return;
    if (!demo()) await d.cloud.photoReact(postId, path);
    post.photoReactions = (post.photoReactions || []).filter(r => r.user_id !== d.selfId());
    if (path) post.photoReactions.push({post_id: postId, user_id: d.selfId(), image_path: path, created_at: new Date().toISOString()});
    if (demo()) d.saveDemo();
    d.bumpSocial();
    document.querySelectorAll('.reaction-picker[open]').forEach(p => { p.open = false; });
    d.updateReactions(post, '');
    d.hydrateImages();
    d.toast(path ? 'Din bild sitter nu under inlägget.' : 'Bildreaktionen är borttagen.');
  }
  async function newReactPhoto(postId, file) {
    const blob = await d.preparePhoto(file), path = await d.storePhoto(blob, 'posts');
    await d.commit(s => { s.reactionImages = [path, ...(Array.isArray(s.reactionImages) ? s.reactionImages : []).filter(x => x !== path)].slice(0, 8); });
    await reactPhoto(postId, path);
  }
  function viewPhoto(postId, userId) {
    const r = (posts().find(p => p.id === postId)?.photoReactions || []).find(x => x.user_id === userId);
    if (!r) return;
    d.modal(userId === d.selfId() ? 'Din bildreaktion' : 'Bildreaktion', `<img class="sq-photo-big" data-photo="${esc(r.image_path)}" alt=""><p class="fitness-hint space"><b>${esc(nameOf(userId))}</b> <span>reagerade med en bild</span></p>${userId === d.selfId() ? button(I('close') + ' Ta bort min bildreaktion', 'sq:unphoto:' + postId, 'btn secondary full space') : ''}`);
    d.hydrateImages();
  }
  const socialPhotos = () => ready() ? {row: p => ui.photoRow(p, nameOf), picker: p => ui.photoPicker(p, stickers(), mine(p))} : null;

  async function action([cmd, a, b]) {
    if (cmd === 'share') { await setShare(a, b, !Q.isShared(state(), b, a)); if (bar) drawBar(); else d.toast(Q.isShared(state(), b, a) ? 'Delad med squadet.' : 'Inte längre delad.'); return; }
    if (cmd === 'share-close') return hideBar();
    if (cmd === 'photo-view') return viewPhoto(a, b);
    if (cmd === 'sticker') { const path = stickers()[Number(b)]; if (!path) return; const post = posts().find(p => p.id === a); return reactPhoto(a, post && mine(post) === path ? null : path); }
    if (cmd === 'unphoto') { d.closeModal(); return reactPhoto(a, null); }
  }
  // File inputs and the "always share" checkbox. Returns a promise when it handled the event.
  function change(e) {
    const t = e.target;
    if (t.matches?.('[data-activity-photo]') && t.files?.[0]) return attachActivity(t.dataset.activityPhoto, t.files[0]);
    if (t.matches?.('[data-react-photo]') && t.files?.[0]) return newReactPhoto(t.dataset.reactPhoto, t.files[0]);
    if (t.matches?.('[data-share-always]')) {
      const id = t.dataset.shareAlways, on = t.checked;
      return (async () => { await d.commit(s => Q.setAlways(s, id, on)); if (on && bar && !Q.isShared(state(), bar.day, id)) await setShare(id, bar.day, true); drawBar(); d.toast(on ? 'Vanan delas automatiskt från och med nu.' : 'Du väljer själv nästa gång.'); })();
    }
    return null;
  }
  return {ready, afterCheckIn, photoStep, cardioSaved, shareField, socialPhotos, action, change, hideBar};
}
