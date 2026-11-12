// Small Web Audio engine for the music games: a recorded grand piano and electric bass, a click and
// drums, plus a microphone listener for pitch and loudness. The piano and bass are real recordings in
// `src/sounds/` (see docs/musik-skill-tree.md for sources). If they have not loaded, a synth plays instead.
//
// iPhone notes: audio may only start inside a tap, so `unlock()` is called from button handlers.
// `navigator.audioSession` (iOS 17+) makes sound play even with the ring/silent switch on, and is
// switched to play-and-record while the microphone is in use.
import {freqOf, detectPitch, QUIET} from './music-theory.js';

let ctx = null, master = null, comp = null;
const AC = () => (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) || null;
export const supported = () => !!AC();

function session(type) { try { if (navigator.audioSession) navigator.audioSession.type = type; } catch {} }

export function unlock() {
  const C = AC(); if (!C) return null;
  if (!ctx) {
    session('playback');
    ctx = new C({latencyHint: 'interactive'});
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = .8;
    master.connect(comp); comp.connect(ctx.destination);
  }
  if (ctx.state !== 'running') ctx.resume?.();
  decodeAll();
  return ctx;
}
export const now = () => ctx?.currentTime || 0;
// When the app's own sound has died away. The microphone games ignore what they hear until then,
// so the phone's speaker can never be mistaken for the player's instrument.
let busy = 0;
export const busyUntil = () => busy;

// Music goes through a bus that can be cut, so a new question never plays on top of the last one.
// Feedback sounds (sfx) go straight to the master and are never cut.
let bus = null;
const out = () => { if (!bus) { bus = ctx.createGain(); bus.connect(master); } return bus; };
export function stopAll() {
  if (!ctx || !bus) return;
  const b = bus; bus = null; busy = Math.min(busy, ctx.currentTime + .3);
  b.gain.setTargetAtTime(0, ctx.currentTime, .025);
  setTimeout(() => { try { b.disconnect(); } catch {} }, 250);
}

// ---------- recorded instruments ----------
// One recording every third semitone; notes in between are the nearest recording, slightly retuned.
const RECORDED = {piano: [33, 36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84], bass: [28, 31, 34, 37, 40, 43, 46, 49, 52, 55]};
const NOTE = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'];
const fileOf = (inst, midi) => `./sounds/${inst}-${NOTE[midi % 12]}${Math.floor(midi / 12) - 1}.mp3`;
export const soundFiles = () => Object.entries(RECORDED).flatMap(([inst, list]) => list.map(midi => fileOf(inst, midi)));
const raw = new Map(), bank = {piano: new Map(), bass: new Map()};
let fetching = null, decoding = null;
// Download the recordings (no AudioContext needed, so this can start before the first tap).
export function preload() {
  if (fetching || !AC() || typeof fetch !== 'function') return fetching;
  fetching = Promise.all(Object.entries(RECORDED).flatMap(([inst, list]) => list.map(async midi => {
    try { const r = await fetch(fileOf(inst, midi)); if (r.ok) raw.set(inst + midi, await r.arrayBuffer()); } catch {}
  })));
  return fetching;
}
function decodeAll() {
  if (decoding || !ctx) return decoding;
  decoding = (async () => {
    await preload();
    await Promise.all(Object.entries(RECORDED).flatMap(([inst, list]) => list.map(async midi => {
      const data = raw.get(inst + midi); if (!data) return;
      try {
        const buffer = await new Promise((ok, fail) => ctx.decodeAudioData(data, ok, fail));
        // Find where the note really starts and how loud it is, so every note is tight and equally strong.
        const d = buffer.getChannelData(0); let peak = 0; for (let i = 0; i < d.length; i += 2) { const v = Math.abs(d[i]); if (v > peak) peak = v; }
        let first = 0; while (first < d.length && Math.abs(d[first]) < peak * .04) first++;
        bank[inst].set(midi, {buffer, lead: Math.max(0, first / buffer.sampleRate - .004), gain: .5 / (peak || 1)});
      } catch {}
      raw.delete(inst + midi);
    })));
  })();
  return decoding;
}
// Resolves when the recordings are ready, or after `ms` so a slow network never blocks a game.
export const ready = (ms = 1800) => Promise.race([decodeAll() || Promise.resolve(), new Promise(r => setTimeout(r, ms))]);
function recorded(inst, midi, t, dur, level, release, dest) {
  let best = null; for (const [m, s] of bank[inst]) if (!best || Math.abs(m - midi) < Math.abs(best.m - midi)) best = {m, s};
  if (!best || Math.abs(best.m - midi) > 7) return false;
  const src = ctx.createBufferSource(), g = ctx.createGain(), rate = Math.pow(2, (midi - best.m) / 12);
  src.buffer = best.s.buffer; src.playbackRate.value = rate;
  g.gain.setValueAtTime(level * best.s.gain, t); g.gain.setTargetAtTime(0, t + dur, release);
  src.connect(g); g.connect(dest); src.start(t, best.s.lead * rate); src.stop(t + dur + release * 8);
  return true;
}
function keys(midi, t, dur, vel = .7, dest = out()) { if (!recorded('piano', midi, t, dur, vel * .9, .16, dest)) synthKeys(midi, t, dur, vel, dest); }
function bass(midi, t, dur, vel = .9) { if (!recorded('bass', midi, t, dur, vel * .85, .05, out())) synthBass(midi, t, dur, vel); }

// ---------- synth instruments (fallback, and the feedback chimes) ----------
function synthKeys(midi, t, dur, vel = .7, dest = out()) {
  const f = freqOf(midi), g = ctx.createGain(), lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = Math.min(9000, f * 9); lp.Q.value = .3;
  const peak = .16 * vel;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + .008);
  g.gain.exponentialRampToValueAtTime(peak * .45, t + .35); g.gain.setTargetAtTime(peak * .25, t + .35, dur * .6);
  g.gain.setTargetAtTime(.0001, t + dur, .12);
  for (const [mult, type, amp, det] of [[1, 'triangle', 1, 0], [1, 'sine', .6, 4], [2, 'sine', .22, -3], [3, 'sine', .08, 0]]) {
    const o = ctx.createOscillator(), a = ctx.createGain();
    o.type = type; o.frequency.value = f * mult; o.detune.value = det; a.gain.value = amp;
    o.connect(a); a.connect(g); o.start(t); o.stop(t + dur + .8);
  }
  g.connect(lp); lp.connect(dest);
}
function synthBass(midi, t, dur, vel = .9) {
  const f = freqOf(midi), g = ctx.createGain(), lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.Q.value = 2.2;
  lp.frequency.setValueAtTime(f * 7, t); lp.frequency.exponentialRampToValueAtTime(f * 2.2, t + .25);
  const peak = .42 * vel;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + .006);
  g.gain.exponentialRampToValueAtTime(peak * .5, t + .3); g.gain.setTargetAtTime(.0001, t + Math.max(.1, dur - .04), .05);
  const saw = ctx.createOscillator(), sub = ctx.createOscillator(), sg = ctx.createGain();
  saw.type = 'sawtooth'; saw.frequency.value = f; sub.type = 'sine'; sub.frequency.value = f; sg.gain.value = .9;
  saw.connect(lp); sub.connect(sg); sg.connect(g); lp.connect(g); g.connect(out());
  saw.start(t); sub.start(t); saw.stop(t + dur + .4); sub.stop(t + dur + .4);
}
let noiseBuf = null;
function noise() {
  if (noiseBuf) return noiseBuf;
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * .5, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}
function click(t, accent = false) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'square'; o.frequency.value = accent ? 1760 : 1180;
  g.gain.setValueAtTime(accent ? .16 : .1, t); g.gain.exponentialRampToValueAtTime(.0001, t + .045);
  o.connect(g); g.connect(out()); o.start(t); o.stop(t + .06);
}
function kick(t) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + .14);
  g.gain.setValueAtTime(.7, t); g.gain.exponentialRampToValueAtTime(.0001, t + .32);
  o.connect(g); g.connect(out()); o.start(t); o.stop(t + .35);
}
function hat(t, open = false) {
  const s = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noise(); hp.type = 'highpass'; hp.frequency.value = 7000;
  g.gain.setValueAtTime(.09, t); g.gain.exponentialRampToValueAtTime(.0001, t + (open ? .2 : .05));
  s.connect(hp); hp.connect(g); g.connect(out()); s.start(t); s.stop(t + .25);
}
function snare(t) {
  const s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noise(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = .7;
  g.gain.setValueAtTime(.32, t); g.gain.exponentialRampToValueAtTime(.0001, t + .16);
  s.connect(bp); bp.connect(g); g.connect(out()); s.start(t); s.stop(t + .2);
}

// ---------- scheduling ----------
// events: [{t (beats), notes:[midi], dur (beats), inst, vel}] at `bpm`. Returns the end time in seconds.
export function play(events, {bpm = 80, at} = {}) {
  if (!unlock()) return 0;
  const spb = 60 / bpm, start = (at ?? ctx.currentTime) + .06;
  let end = start;
  for (const e of events) {
    const t = start + e.t * spb, dur = (e.dur || 1) * spb;
    for (const n of e.notes || []) (e.inst === 'bass' ? bass : keys)(n, t, dur, e.vel);
    if (e.inst === 'click') click(t, e.accent);
    if (e.inst === 'kick') kick(t);
    if (e.inst === 'hat') hat(t, e.open);
    if (e.inst === 'snare') snare(t);
    end = Math.max(end, t + dur);
  }
  busy = Math.max(busy, end + .35);
  return end;
}
export const note = (midi, dur = .8, inst = 'keys') => play([{t: 0, notes: [midi], dur, inst}], {bpm: 60});

// One bar of drums starting at a beat offset: kick 1 & 3, snare 2 & 4, eighth hats.
export const drumBar = (bar, beatsPerBar = 4) => [
  {t: bar * beatsPerBar, inst: 'kick'}, {t: bar * beatsPerBar + 2, inst: 'kick'},
  {t: bar * beatsPerBar + 1, inst: 'snare'}, {t: bar * beatsPerBar + 3, inst: 'snare'},
  ...[0, .5, 1, 1.5, 2, 2.5, 3, 3.5].map(x => ({t: bar * beatsPerBar + x, inst: 'hat'})),
];

// Short sound effects for feedback. Pleasant, never harsh.
export function sfx(kind) {
  if (!unlock()) return;
  const t = ctx.currentTime + .01; busy = Math.max(busy, t + .7);
  const seq = {
    right: [[76, 0], [83, .07]], wrong: [[52, 0], [51, .09]], combo: [[79, 0], [84, .06], [88, .12]],
    star: [[88, 0], [95, .05]], clear: [[72, 0], [76, .1], [79, .2], [84, .3], [88, .42]], tap: [[84, 0]],
  }[kind] || [];
  for (const [m, d] of seq) synthKeys(m, t + d, kind === 'clear' ? .5 : .18, kind === 'wrong' ? .45 : .6, master);
}

// ---------- microphone ----------
// The stream is kept open for the whole game, so iPhone only asks for permission once per round of
// play. `listen` returns a stop function for the analysis; `releaseMic` turns the microphone off.
let micStream = null;
async function stream() {
  if (micStream && micStream.getAudioTracks().some(t => t.readyState === 'live')) return micStream;
  if (!navigator.mediaDevices?.getUserMedia) throw Error('Mikrofonen stöds inte i den här webbläsaren.');
  session('play-and-record');
  try { micStream = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: false, noiseSuppression: false, autoGainControl: false}}); }
  catch (e) { session('playback'); throw Error(e?.name === 'NotAllowedError' ? 'Mikrofonen är blockerad. Tillåt mikrofon för appen i Inställningar och försök igen.' : 'Kunde inte starta mikrofonen.'); }
  return micStream;
}
export function releaseMic() {
  if (!micStream) return;
  for (const t of micStream.getTracks()) t.stop();
  micStream = null; session('playback');
}
// Calls onFrame({freq, clarity, rms, level, loud, t}) until stop() is called.
// mode 'voice' suits singing (70–1100 Hz). mode 'instrument' hears a bass down to low E (41 Hz) and a
// guitar up to the 12th fret: it needs a longer window, so the samples are halved to keep it fast.
// Nothing here depends on how loud the microphone is: a phone gives a much weaker signal than a
// computer, so `loud` compares the level with the room noise instead of a fixed number.
const MODES = {voice: {size: 2048, minF: 70, maxF: 1100, decimate: 1, every: 30}, instrument: {size: 4096, minF: 38, maxF: 1400, decimate: 2, every: 20}};
export async function listen(onFrame, {mode = 'voice'} = {}) {
  if (!unlock()) throw Error('Mikrofonen stöds inte i den här webbläsaren.');
  const s = await stream();
  if (ctx.state !== 'running') await ctx.resume?.();
  const m = MODES[mode] || MODES.voice, src = ctx.createMediaStreamSource(s), an = ctx.createAnalyser();
  an.fftSize = m.size; an.smoothingTimeConstant = 0; src.connect(an);
  const buf = new Float32Array(an.fftSize);
  let raf = 0, alive = true, lastRun = 0, floor = null, ref = 0, lastT = 0;
  const tick = now => {
    if (!alive) return;
    raf = requestAnimationFrame(tick);
    if (now - lastRun < m.every) return;
    lastRun = now;
    an.getFloatTimeDomainData(buf);
    // Loudness from the newest quarter of the window, so the meter and note starts react quickly.
    let sum = 0; const from = buf.length - (buf.length >> 2); for (let i = from; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / (buf.length - from)), p = detectPitch(buf, ctx.sampleRate, m.minF, m.maxF, m.decimate);
    const t = ctx.currentTime;
    floor = floor == null ? rms : Math.min(rms, floor * Math.pow(2, Math.max(0, t - lastT) / 20)); lastT = t; ref = Math.max(ref * .9995, rms, floor * 8, QUIET);
    onFrame({freq: p?.freq || null, clarity: p?.clarity || 0, rms, level: Math.min(1, rms / ref), loud: rms > Math.max(floor * 2.5, QUIET), floor, t});
  };
  raf = requestAnimationFrame(tick);
  return () => { alive = false; cancelAnimationFrame(raf); try { src.disconnect(); } catch {} };
}
