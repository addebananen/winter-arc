// Small Web Audio engine for the music games: soft keys, a plucked bass, a click and drums,
// plus a microphone listener for pitch and loudness. Everything is synthesised; no sample files.
//
// iPhone notes: audio may only start inside a tap, so `unlock()` is called from button handlers.
// `navigator.audioSession` (iOS 17+) makes sound play even with the ring/silent switch on, and is
// switched to play-and-record while the microphone is in use.
import {freqOf, detectPitch} from './music-theory.js';

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
  return ctx;
}
export const now = () => ctx?.currentTime || 0;

// ---------- instruments ----------
function keys(midi, t, dur, vel = .7) {
  const f = freqOf(midi), g = ctx.createGain(), out = ctx.createBiquadFilter();
  out.type = 'lowpass'; out.frequency.value = Math.min(9000, f * 9); out.Q.value = .3;
  const peak = .16 * vel;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + .008);
  g.gain.exponentialRampToValueAtTime(peak * .45, t + .35); g.gain.setTargetAtTime(peak * .25, t + .35, dur * .6);
  g.gain.setTargetAtTime(.0001, t + dur, .12);
  for (const [mult, type, amp, det] of [[1, 'triangle', 1, 0], [1, 'sine', .6, 4], [2, 'sine', .22, -3], [3, 'sine', .08, 0]]) {
    const o = ctx.createOscillator(), a = ctx.createGain();
    o.type = type; o.frequency.value = f * mult; o.detune.value = det; a.gain.value = amp;
    o.connect(a); a.connect(g); o.start(t); o.stop(t + dur + .8);
  }
  g.connect(out); out.connect(master);
}
function bass(midi, t, dur, vel = .9) {
  const f = freqOf(midi), g = ctx.createGain(), lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.Q.value = 2.2;
  lp.frequency.setValueAtTime(f * 7, t); lp.frequency.exponentialRampToValueAtTime(f * 2.2, t + .25);
  const peak = .42 * vel;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + .006);
  g.gain.exponentialRampToValueAtTime(peak * .5, t + .3); g.gain.setTargetAtTime(.0001, t + Math.max(.1, dur - .04), .05);
  const saw = ctx.createOscillator(), sub = ctx.createOscillator(), sg = ctx.createGain();
  saw.type = 'sawtooth'; saw.frequency.value = f; sub.type = 'sine'; sub.frequency.value = f; sg.gain.value = .9;
  saw.connect(lp); sub.connect(sg); sg.connect(g); lp.connect(g); g.connect(master);
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
  o.connect(g); g.connect(master); o.start(t); o.stop(t + .06);
}
function kick(t) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + .14);
  g.gain.setValueAtTime(.7, t); g.gain.exponentialRampToValueAtTime(.0001, t + .32);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + .35);
}
function hat(t, open = false) {
  const s = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noise(); hp.type = 'highpass'; hp.frequency.value = 7000;
  g.gain.setValueAtTime(.09, t); g.gain.exponentialRampToValueAtTime(.0001, t + (open ? .2 : .05));
  s.connect(hp); hp.connect(g); g.connect(master); s.start(t); s.stop(t + .25);
}
function snare(t) {
  const s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noise(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = .7;
  g.gain.setValueAtTime(.32, t); g.gain.exponentialRampToValueAtTime(.0001, t + .16);
  s.connect(bp); bp.connect(g); g.connect(master); s.start(t); s.stop(t + .2);
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
  const t = ctx.currentTime + .01;
  const seq = {
    right: [[76, 0], [83, .07]], wrong: [[52, 0], [51, .09]], combo: [[79, 0], [84, .06], [88, .12]],
    star: [[88, 0], [95, .05]], clear: [[72, 0], [76, .1], [79, .2], [84, .3], [88, .42]], tap: [[84, 0]],
  }[kind] || [];
  for (const [m, d] of seq) keys(m, t + d, kind === 'clear' ? .5 : .18, kind === 'wrong' ? .45 : .6);
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
// Calls onFrame({freq, clarity, rms, level, t}) once per animation frame until stop() is called.
export async function listen(onFrame) {
  if (!unlock()) throw Error('Mikrofonen stöds inte i den här webbläsaren.');
  const s = await stream();
  if (ctx.state !== 'running') await ctx.resume?.();
  const src = ctx.createMediaStreamSource(s), an = ctx.createAnalyser();
  an.fftSize = 2048; src.connect(an);
  const buf = new Float32Array(an.fftSize);
  let raf = 0, alive = true;
  const tick = () => {
    if (!alive) return;
    an.getFloatTimeDomainData(buf);
    let sum = 0; for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length), p = detectPitch(buf, ctx.sampleRate);
    onFrame({freq: p?.freq || null, clarity: p?.clarity || 0, rms, level: Math.min(1, rms * 9), t: ctx.currentTime});
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => { alive = false; cancelAnimationFrame(raf); try { src.disconnect(); } catch {} };
}
