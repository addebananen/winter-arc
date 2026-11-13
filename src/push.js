// Notifications: streak reminders from the server (Web Push, supabase/028) and a lock-screen notice while a
// workout is running. iPhone only allows web notifications for an app added to the home screen (iOS 16.4+).
// A web app cannot show a live, ticking timer like a native Live Activity, so the workout notice says when the
// workout started and how long it had run when you left the app; it is refreshed every time you leave.
import {config} from './config.js';
import {lang, translate} from './i18n.js';
import {activities} from './cardio.js';
import {realElapsed} from './strength.js';

const PREF = 'arc-push', HOURS = [18, 19, 20, 21], TAG = 'active-workout';
const readPref = () => { try { return {on: false, hour: 19, workout: true, ...JSON.parse(localStorage.getItem(PREF) || '{}')}; } catch { return {on: false, hour: 19, workout: true}; } };
const writePref = p => { try { localStorage.setItem(PREF, JSON.stringify(p)); } catch { /* private mode: the choice lasts this session */ } };
const keyBytes = b64 => { const s = atob((b64 + '='.repeat((4 - b64.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(s, c => c.charCodeAt(0)); };
const clock = ms => new Date(ms).toLocaleTimeString(lang === 'en' ? 'en-GB' : 'sv-SE', {hour: '2-digit', minute: '2-digit'});

// What is running right now, if anything: {title, startedAt, minutes}.
export function activeWorkout(state, now = Date.now()) {
  const c = state?.cardio?.active, w = state?.strength?.active;
  if (c?.startedAt) return {title: activities.find(a => a.id === c.kind)?.name || 'Konditionspass', startedAt: c.startedAt, minutes: Math.max(0, (now - c.startedAt) / 60000)};
  if (w?.startedAt) return {title: 'Styrkepass', startedAt: w.startedAt, minutes: realElapsed(w, now), paused: Boolean(w.pausedAt)};
  return null;
}
// Notification text for a running workout. Kept in both languages here because the system shows it outside the app.
export function workoutNotice(active, language = lang) {
  const min = Math.floor(active.minutes), sv = language !== 'en';
  const title = sv ? `${active.paused ? 'Pausat' : 'Pågående'} pass · ${active.title}` : `${active.paused ? 'Paused' : 'Workout running'} · ${translate(active.title, 'en')}`;
  const body = sv ? `Startade ${clock(active.startedAt)} · ${min} min hittills. Tryck för att fortsätta.` : `Started ${clock(active.startedAt)} · ${min} min so far. Tap to continue.`;
  return {title, body};
}

export function createPush({getState, getMode, cloud, button, toast, I, standalone}) {
  let pref = readPref(), status = 'checking', busy = false;
  const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const registration = () => navigator.serviceWorker?.getRegistration();

  async function refresh() {
    if (!supported()) status = standalone() ? 'unsupported' : 'install';
    else if (Notification.permission === 'denied') status = 'denied';
    else { const sub = await (await registration())?.pushManager.getSubscription().catch(() => null); status = sub && Notification.permission === 'granted' ? 'on' : 'off'; }
    const box = document.getElementById('push-settings');
    if (box) box.innerHTML = inner();
  }

  function inner() {
    const chip = (label, action, active) => button(label, action, `push-chip ${active ? 'active' : ''}`, `aria-pressed="${active}"`);
    if (getMode() !== 'cloud' && status !== 'install') return `<p>Påminnelser kräver ett konto. Anslut med Google för att slå på dem.</p>`;
    if (status === 'install') return `<p>Lägg appen på hemskärmen först. Öppna den sedan därifrån och slå på notiser här.</p>`;
    if (status === 'unsupported') return `<p>Den här enheten stöder inte notiser. På iPhone krävs iOS 16.4 eller senare.</p>`;
    if (status === 'denied') return `<p>Notiser är blockerade. Slå på dem i iPhone-inställningar → Notiser → Beyond Self.</p>`;
    if (status === 'checking') return `<p class="muted">Kollar notiser…</p>`;
    const on = status === 'on';
    return `<p>${on ? 'Påminnelse när din streak håller på att brytas, en gång per dag.' : 'Få en påminnelse innan din träningsflamma eller vanestreak slocknar.'}</p>
      ${button(on ? 'Stäng av påminnelser' : I('bell') + ' Slå på påminnelser', on ? 'push:off' : 'push:on', on ? 'btn ghost' : 'btn', busy ? 'disabled' : '')}
      ${on ? `<div class="push-hours"><span>Påminn mig kl</span><div class="push-chips">${HOURS.map(h => chip(`${h}:00`, 'push:hour:' + h, pref.hour === h)).join('')}</div></div>
      <div class="push-hours"><span>Pågående pass på låsskärmen</span><div class="push-chips">${chip('På', 'push:workout:1', pref.workout)}${chip('Av', 'push:workout:0', !pref.workout)}</div></div>` : ''}`;
  }

  function settingsHTML() { refresh(); return `<div class="settings-row push-settings"><div><h3>Notiser</h3><div id="push-settings">${inner()}</div></div></div>`; }

  async function subscribe() {
    const reg = await registration();
    if (!reg) throw Error('Notiser fungerar på den publicerade appen, inte i förhandsvisningen.');
    const sub = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({userVisibleOnly: true, applicationServerKey: keyBytes(config.vapidPublicKey)});
    await cloud.savePush(sub.toJSON(), pref.hour, lang === 'en' ? 'en' : 'sv');
  }

  async function action([cmd, arg]) {
    if (busy) return;
    busy = true;
    try {
      if (cmd === 'on') {
        // Must run straight from the tap: iPhone only asks for permission inside a user gesture.
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') { toast(permission === 'denied' ? 'Notiser är blockerade i iPhone-inställningarna.' : 'Notiser är inte påslagna.'); return; }
        await subscribe(); pref = {...pref, on: true}; writePref(pref);
        toast('Påminnelserna är på. Vi hör av oss bara när din streak behöver dig.');
      } else if (cmd === 'off') {
        const sub = await (await registration())?.pushManager.getSubscription();
        if (sub) { await cloud.removePush(sub.endpoint).catch(() => {}); await sub.unsubscribe(); }
        pref = {...pref, on: false}; writePref(pref); toast('Påminnelserna är avstängda.');
      } else if (cmd === 'hour') {
        pref = {...pref, hour: Number(arg)}; writePref(pref); await subscribe(); toast(`Påminnelser kl ${arg}:00.`);
      } else if (cmd === 'workout') {
        pref = {...pref, workout: arg === '1'}; writePref(pref);
        if (!pref.workout) clearWorkout();
      }
    } catch (e) {
      toast(/push_subscription|schema cache|does not exist/i.test(e?.message || '') ? 'Notiser aktiveras med databasuppdatering 028.' : e?.message || 'Notiserna kunde inte ändras.');
    } finally { busy = false; await refresh(); }
  }

  async function clearWorkout() {
    const reg = await registration().catch(() => null);
    (await reg?.getNotifications?.({tag: TAG}).catch(() => []) || []).forEach(n => n.close());
  }
  // Leaving the app with a workout running puts a notice on the lock screen; coming back removes it.
  async function showWorkout() {
    if (!pref.workout || !supported() || Notification.permission !== 'granted') return;
    const active = activeWorkout(getState());
    if (!active) return;
    const reg = await registration().catch(() => null), {title, body} = workoutNotice(active);
    await reg?.showNotification(title, {body, tag: TAG, renotify: false, silent: true, icon: './icon-192.png', badge: './icon-192.png', data: {url: './#training'}}).catch(() => {});
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) showWorkout(); else clearWorkout(); });

  return {settingsHTML, action, clearWorkout};
}
