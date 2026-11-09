// Social → Friends: add people with a friend code, accept requests, see each other's level, character and streaks.
// Friends are a wider circle than the squad; nothing private is shared (see supabase/016_friends.sql).
const demoFriends = () => [
  {friendship_id: 'demo-maya', user_id: 'maya', display_name: 'Maya', relation: 'friend', xp: 6370, streak: 18, training_streak: 11, trained_today: true, char_kind: 'striker'},
  {friendship_id: 'demo-noah', user_id: 'noah', display_name: 'Noah', relation: 'friend', xp: 5810, streak: 14, training_streak: 6, trained_today: false, char_kind: 'scholar'},
  {friendship_id: 'demo-elliot', user_id: 'elliot', display_name: 'Elliot', relation: 'incoming'},
  {friendship_id: 'demo-sara', user_id: 'sara', display_name: 'Sara', relation: 'outgoing'},
];

// Demo profiles get a character each so the profile view is complete without an account.
const demoKinds = {maya: 'striker', noah: 'scholar', elliot: 'monk'};
const tiers = ['Vandrare', 'Frostvandrare', 'Norrskensväktare', 'Vinterlegend'];

export function createFriendsUI({I, esc, button, avatar, character, D, F, getMode, cloud, modal, closeModal, toast, render}) {
  let list = null, code = '', loading = false, error = '', demo = null;

  async function load() {
    if (loading) return;
    loading = true; error = '';
    try { [list, code] = await Promise.all([cloud.friends(), cloud.myFriendCode()]); }
    catch (e) { list = []; error = /friends_overview|my_friend_code|schema cache|does not exist/i.test(e?.message || '') ? 'update' : 'failed'; }
    loading = false; render();
  }
  const data = () => getMode() === 'demo' ? (demo ||= demoFriends()) : list;

  function friendCard(f) {
    const level = D.levelInfo(Number(f.xp) || 0).level;
    return `<section class="card friend-card">
      <button class="friend-open" data-action="profile-of:${esc(f.user_id)}" aria-label="Visa profil för ${esc(f.display_name)}"><div class="friend-char" aria-hidden="true">${character(level, false, f.char_kind || 'ranger')}</div>
      <div class="friend-main"><strong>${esc(f.display_name)}</strong><small>${esc(F.rankInfo(Number(f.xp) || 0).name)} · LVL ${level}</small>
        <div class="friend-stats"><span class="flame-badge ${f.trained_today ? 'lit' : ''} ${f.training_streak ? '' : 'out'}" title="Träningsstreak">${I('flame')}${f.training_streak || 0}</span><span class="pill">${f.streak || 0} dagars vanestreak</span>${f.trained_today ? '<span class="friend-today">Har tränat idag</span>' : ''}</div></div></button>
      ${button(I('close'), 'friend:ask-remove:' + f.friendship_id, 'icon-btn friend-remove', `aria-label="Ta bort ${esc(f.display_name)} som vän"`)}
    </section>`;
  }

  function view() {
    const mode = getMode();
    if (mode === 'local') return `<div class="notice">${I('info')}<span>Vänner kräver ett konto. Anslut med Google för att lägga till vänner.</span></div>`;
    if (mode === 'cloud' && list === null) { load(); return `<div class="card"><p class="muted">Hämtar dina vänner…</p></div>`; }
    if (error === 'update') return `<div class="notice">${I('info')}<span>Vänner aktiveras med databasuppdatering 016.</span></div>`;
    const all = data() || [], friends = all.filter(f => f.relation === 'friend').sort((a, b) => (b.training_streak || 0) - (a.training_streak || 0) || (Number(b.xp) || 0) - (Number(a.xp) || 0));
    const incoming = all.filter(f => f.relation === 'incoming'), outgoing = all.filter(f => f.relation === 'outgoing');
    const myCode = mode === 'demo' ? 'DEMO2026' : code;
    return `<section class="card friend-code"><div><span class="eyebrow">DIN VÄNKOD</span><strong id="friend-code" data-no-translate>${esc(myCode || '…')}</strong><small>Dela koden med en vän. När ni lagt till varandra ser ni varandras level, karaktär och streaks.</small></div>
        <div class="friend-code-actions">${button('Kopiera kod', 'friend:copy', 'btn secondary')}</div></section>
      ${error === 'failed' ? `<div class="notice">${I('info')}<span>Vännerna kunde inte hämtas. Försök igen.</span></div>` : ''}
      ${incoming.length ? `<h2 class="space">Vänförfrågningar</h2>${incoming.map(f => `<div class="friend-row">${avatar(f.display_name)}<span class="leader-name"><strong>${esc(f.display_name)}</strong><small>Vill bli din vän</small></span>${button('Godkänn', 'friend:accept:' + f.friendship_id, 'btn')}${button('Avböj', 'friend:decline:' + f.friendship_id, 'btn ghost')}</div>`).join('')}` : ''}
      <h2 class="space">Dina vänner</h2>
      ${friends.length ? `<div class="friend-grid">${friends.map(friendCard).join('')}</div>` : `<p class="fitness-hint">Inga vänner än. Dela din vänkod eller lägg till en väns kod.</p>`}
      ${outgoing.length ? `<h3 class="space">Väntar på svar</h3>${outgoing.map(f => `<div class="friend-row">${avatar(f.display_name)}<span class="leader-name"><strong>${esc(f.display_name)}</strong><small>Förfrågan skickad</small></span>${button('Ångra', 'friend:remove:' + f.friendship_id, 'btn ghost')}</div>`).join('')}` : ''}
      <p class="fitness-hint space">Vänner ser bara namn, level, rank, karaktär och streaks. Bilder, mått, journaler och mål förblir privata. Ditt squad är din närmaste grupp med gemensamt flöde och uppdrag.</p>`;
  }

  async function action([cmd, id]) {
    const demoMode = getMode() === 'demo';
    switch (cmd) {
      case 'add':
        modal('Lägg till vän', `<form id="friend-form" class="form"><label>Din väns vänkod<input name="code" required minlength="8" maxlength="8" autocomplete="off" autocapitalize="characters" placeholder="Till exempel K7Q2M9XA"></label><p class="form-error" role="alert"></p><button class="btn full" type="submit">Skicka förfrågan</button></form>`);
        return;
      case 'ask-remove': {
        const f = (data() || []).find(x => x.friendship_id === id);
        if (f) modal('Ta bort vän', `<p class="intro">Vill du ta bort ${esc(f.display_name)} som vän? Ni slutar se varandras level och streaks. Ni kan lägga till varandra igen med vänkoden.</p>${button('Ta bort vän', 'friend:remove:' + id, 'btn full space')}`);
        return;
      }
      case 'copy': {
        const text = getMode() === 'demo' ? 'DEMO2026' : code;
        try { await navigator.clipboard.writeText(text); toast('Vänkoden är kopierad.'); } catch { toast('Din vänkod: ' + text); }
        return;
      }
      case 'accept': case 'decline': case 'remove':
        if (demoMode) {
          const f = demo.find(x => x.friendship_id === id);
          if (cmd === 'accept' && f) Object.assign(f, {relation: 'friend', xp: 1200, streak: 3, training_streak: 2, trained_today: false, char_kind: 'monk'});
          else demo = demo.filter(x => x.friendship_id !== id);
        } else {
          if (cmd === 'remove') await cloud.removeFriend(id); else await cloud.respondFriend(id, cmd === 'accept');
          list = null;
        }
        if (cmd === 'remove') closeModal();
        toast(cmd === 'accept' ? 'Ni är nu vänner.' : cmd === 'decline' ? 'Förfrågan är avböjd.' : 'Vännen är borttagen.');
        render();
        return;
    }
  }

  async function submit(v) {
    const value = String(v.code || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{8}$/.test(value)) throw Error('En vänkod har åtta bokstäver eller siffror.');
    if (getMode() === 'demo') throw Error('I demoläget kan du inte lägga till riktiga vänner.');
    const result = await cloud.requestFriend(value);
    list = null;
    toast(result === 'accepted' ? 'Ni är nu vänner.' : 'Vänförfrågan är skickad.');
    render();
  }

  // Opens someone's profile: their character big, rank, level and streaks. Only public fields are shown.
  async function profile(userId, known) {
    let p;
    if (getMode() === 'cloud') {
      try { p = await cloud.memberProfile(userId); }
      catch (e) { toast(/member_profile|schema cache|does not exist/i.test(e?.message || '') ? 'Profiler aktiveras med databasuppdatering 016.' : e?.message || 'Profilen kunde inte hämtas.'); return; }
    } else {
      const f = (data() || []).find(x => x.user_id === userId && x.relation === 'friend');
      p = known || f ? {char_kind: demoKinds[userId], ...f, ...known} : null;
    }
    if (!p) { toast('Profilen kunde inte hämtas.'); return; }
    const xp = Number(p.xp) || 0, l = D.levelInfo(xp), rank = F.rankInfo(xp), kind = p.char_kind || 'ranger';
    const charName = p.char_name || F.characters.find(c => c.id === kind)?.name || 'Aurora Ranger';
    const stat = (icon, value, label) => `<div class="mini-stat">${I(icon)}<strong>${value}</strong><span>${label}</span></div>`;
    modal(esc(p.display_name), `<div class="member-profile">
      <div class="member-character">${character(l.level, true, kind)}</div>
      <span class="eyebrow">${esc(p.title || tiers[Math.min(3, Math.floor((l.level - 1) / 5))])}</span>
      <h3>${esc(charName)}</h3>
      <p class="muted">${esc(rank.name)} · LVL ${l.level} · ${xp.toLocaleString('sv-SE')} XP</p>
      <div class="member-xp"><i style="width:${Math.round(l.ratio * 100)}%"></i></div>
      <div class="mini-stats">${stat('flame', p.training_streak || 0, 'Träningsstreak')}${stat('check', p.streak || 0, 'Vanestreak')}${p.workouts != null ? stat('dumbbell', p.workouts, 'Pass totalt') : ''}</div>
      ${p.trained_today ? '<p class="friend-today">Har tränat idag</p>' : ''}
    </div>`);
  }

  return {view, action, submit, profile, reset: () => { list = null; }};
}
