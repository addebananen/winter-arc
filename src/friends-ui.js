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

export function createFriendsUI({I, esc, button, avatar, character, landscape = () => '', D, F, getMode, cloud, modal, closeModal, toast, render}) {
  let list = null, code = '', loading = false, error = '', demo = null, shown = null;

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
      case 'add-member': {
        if (demoMode) { (demo ||= demoFriends()).push({friendship_id: 'demo-' + id + '-out', user_id: id, display_name: shown?.known?.display_name || 'Vän', relation: 'outgoing'}); }
        else { const result = await cloud.requestFriendMember(id); list = null; if (result === 'accepted') { toast('Ni är nu vänner.'); render(); if (shown?.userId === id) await profile(id, shown.known); return; } }
        toast('Vänförfrågan är skickad.');
        render();
        if (shown?.userId === id) await profile(id, shown.known);
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
        const reopen = cmd === 'accept' && shown && document.querySelector('.member-profile');
        toast(cmd === 'accept' ? 'Ni är nu vänner.' : cmd === 'decline' ? 'Förfrågan är avböjd.' : 'Vännen är borttagen.');
        render();
        if (reopen) await profile(shown.userId, shown.known);
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

  // Opens a friend's or squad member's profile: profile photo, rank with XP, their character and streaks.
  // Only public fields are shown. The photo comes from the squad list (squad_avatars, migration 023), so
  // friends outside your squad show their initials instead.
  async function profile(userId, known) {
    let p;
    if (getMode() === 'cloud') {
      try { p = await cloud.memberProfile(userId); }
      catch (e) { toast(/member_profile|schema cache|does not exist/i.test(e?.message || '') ? 'Profiler aktiveras med databasuppdatering 017.' : e?.message || 'Profilen kunde inte hämtas.'); return; }
      if (p) p = {...p, photo: known?.photo || null};
    } else {
      const f = (data() || []).find(x => x.user_id === userId && x.relation === 'friend');
      p = known || f ? {char_kind: demoKinds[userId], ...f, ...known} : null;
    }
    if (!p) { toast('Profilen kunde inte hämtas.'); return; }
    const xp = Number(p.xp) || 0, l = D.levelInfo(xp), rank = F.rankInfo(xp), kind = p.char_kind || 'ranger';
    const name = p.display_name || 'Äventyrare', num = n => Math.round(n).toLocaleString('sv-SE');
    const charName = p.char_name || F.characters.find(c => c.id === kind)?.name || 'Aurora Ranger';
    shown = {userId, known};
    // Friendship with this person: from the friends list (loaded if needed). Squad members who are not yet
    // friends get a button to add them straight from here.
    if (getMode() === 'cloud' && list === null) { try { list = await cloud.friends(); } catch { list = []; } }
    const fr = (data() || []).find(x => x.user_id === userId);
    const relation = fr?.relation === 'friend' || p.relation === 'friend' ? 'Din vän' : p.relation === 'squad' || known ? 'I ditt squad' : '';
    const friendAction = fr?.relation === 'friend' || p.relation === 'friend' ? ''
      : fr?.relation === 'incoming' ? button(I('check') + ' Godkänn vänförfrågan', 'friend:accept:' + fr.friendship_id, 'btn member-friend')
      : fr?.relation === 'outgoing' ? `<span class="pill member-friend">${I('clock')} Vänförfrågan skickad</span>`
      : known ? button(I('plus') + ' Lägg till som vän', 'friend:add-member:' + userId, 'btn member-friend') : '';
    const pct = n => Math.round(Math.max(0, Math.min(1, n)) * 100);
    const stat = (icon, value, label) => `<div class="mini-stat">${I(icon)}<strong>${value}</strong><span>${label}</span></div>`;
    modal(esc(name), `<div class="member-profile">
      <section class="member-banner">${landscape()}<div class="member-id">${avatar(name, 'large member-photo', p.photo || null)}
        <div><span class="eyebrow">${esc(p.title || tiers[Math.min(3, Math.floor((l.level - 1) / 5))])}</span><h3>${esc(rank.name)} · LVL ${l.level}</h3>${relation ? `<small>${relation}</small>` : ''}${friendAction}</div></div></section>
      <section class="member-rank" style="--rank:${rank.color}">
        <div class="member-rank-head"><span class="rank-emblem">${I(rank.icon)}</span><div><span class="eyebrow">RANK</span><strong>${esc(rank.name)}</strong></div>
          <span class="member-total"><strong>${num(xp)}</strong><small>XP totalt</small></span></div>
        <div class="member-xp"><i style="width:${pct(rank.progress)}%"></i></div>
        <p>${rank.next ? `<b>${num(xp)} / ${num(rank.next.xp)} XP</b> · <span>nästa rank</span> <b>${esc(rank.next.name)}</b>` : '<span>Högsta ranken uppnådd</span>'}</p>
      </section>
      <section class="member-char-card">
        <div class="member-char-head"><span class="eyebrow">KARAKTÄR</span><span class="level-badge">LVL ${l.level}</span></div>
        <div class="member-character">${character(l.level, true, kind)}</div>
        <h3>${esc(charName)}</h3>
        <div class="member-xp level"><i style="width:${pct(l.ratio)}%"></i></div>
        <p><b>${num(xp - l.base)} / ${num(l.next - l.base)} XP</b> · <span>till level</span> <b>${l.level + 1}</b></p>
      </section>
      <div class="mini-stats">${stat('flame', p.training_streak || 0, 'Träningsstreak')}${stat('check', p.streak || 0, 'Vanestreak')}${p.workouts != null ? stat('dumbbell', p.workouts, 'Pass totalt') : ''}</div>
      ${p.trained_today ? '<p class="friend-today">Har tränat idag</p>' : ''}
    </div>`);
  }

  return {view, action, submit, profile, reset: () => { list = null; }};
}
