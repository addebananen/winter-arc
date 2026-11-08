// Exercise animations for the skill trees. Every pose is built from physical
// constraints: hands/feet anchored to contacts, joint angles inside human limits,
// and balance skills solved so the centre of mass sits over the support.
//
// Conventions (see skills-anim.js): compass angles, 0 = up, 90 = right, 180 = down.
// Side views face right; the chest is on the clockwise side of the torso direction.
// In a handstand (torso 180) the chest faces left and the fingers point right,
// i.e. towards the back, as when you face a wall and kick up.
import {full, fit, balance, joint, solve} from './skills-anim.js';

const FLOOR = {k: 'floor'};
export const BY = -228;               // pull-up bar height
const GY = BY + 5;                    // wrist under the bar
const HW = -3.5;                      // wrist height with the palm flat on the floor
const BAR = {k: 'bar', x: 0, y: BY};
const L_TH = 44, L_SH = 42;

// ---------- helpers ----------
const straight = t => [t + 180, t + 180, t + 172];          // legs in line with the torso, toes pointed
const tuck = t => [t + 42, t + 192, t + 184];               // hips ~138° flexed, knees ~150° bent
const advTuck = t => [t + 90, t + 180, t + 172];            // hips 90°, knees 90°
const rot = (p, b) => {                                      // rigid rotation of every segment
  const q = structuredClone(p); q.t += b; q.n = (q.n ?? p.t) + b;
  for (const k of ['an', 'af', 'ln', 'lf']) if (q[k]) q[k] = q[k].map(v => v + b);
  return q;
};
const hold = (p, s = 1) => ({...p, len: {...(p.len || {}), torso: s}});  // tiny breathing/push change

// Straight body pivoting on the toes; hands planted with IK.
function plank(elev, {hx = 30, hy = HW, hand = 90, toe = 0, bend = 1, hip = 0} = {}) {
  const c = 90 - elev;
  return {t: c - hip, n: c - hip + 4, ln: [c + 180, c + 180, c + 90], lf: [c + 181, c + 181, c + 91], at: {j: 'toeN', x: toe, y: 0},
    ik: {an: {x: hx, y: hy, b: bend, h: hand}, af: {x: hx - 2, y: hy, b: bend, h: hand}}};
}
const sY = (make, lo, hi, y) => fit(make, lo, hi, 'shoulder', 1, y);
// Elevation where the shoulder is exactly one straight arm from a planted wrist.
function reach(make, lo, hi, wrist, arm = 53.7) {
  const f = v => { const S = joint(make(v), 'shoulder'); return Math.hypot(S[0] - wrist[0], S[1] - wrist[1]) - arm; };
  let a = lo, b = hi, fa = f(a);
  for (let i = 0; i < 40; i++) { const m = (a + b) / 2, fm = f(m); if (Math.sign(fm) === Math.sign(fa)) { a = m; fa = fm; } else b = m; }
  return (a + b) / 2;
}

// Hanging from the bar: shoulder position drives the movement, hands stay on the bar.
function hang(sx, sy, {t = 0, legs = [177, 180, 170], far, n, hand = 24, b = 1, len, wy = GY, wx = 0} = {}) {
  return {t, n: n ?? t, len, ln: legs, lf: far || [legs[0] + 3, legs[1] + 2, legs[2] + 2], at: {j: 'shoulder', x: sx, y: sy},
    ik: {an: {x: wx, y: wy, b, h: hand}, af: {x: wx - 2, y: wy, b, h: hand}}};
}

// Straight-arm hold from the bar with body orientation t; arm angle solved for balance.
function barStatic(t, legs, far, {hand = 12, len} = {}) {
  const make = a => ({t, n: t, len, an: [a, a, a + hand], af: [a, a, a + hand], ln: legs, lf: far || legs, at: {j: 'wristN', x: 0, y: GY}});
  return make(t < 0 ? balance(make, 2, 88, 0) : balance(make, -88, -2, 0));
}

// Whole body rotated about the planted wrist until the centre of mass is over it.
function balanced(base, lo = -40, hi = 40, x = 0) {
  const make = b => rot(base, b);
  return make(balance(make, lo, hi, x));
}

// Straight-arm floor support (planche family): arm angle solved for balance.
function planche(t, legs, far, {n, len} = {}) {
  const make = a => ({t, n: n ?? t + 6, len, an: [a, a, 270], af: [a, a, 270], ln: legs, lf: far || legs, at: {j: 'wristN', x: 0, y: HW}});
  return make(balance(make, 181, 260, 0));
}

// Inverted straight body on the hands, tilt solved so CoM is over the hands.
function handstand({wy = HW, legs = [0, 0, -6], far, n = 176, hand = 90, sway = 0, len} = {}) {
  const base = {t: 180, n, len, an: [180, 180, hand], af: [180, 180, hand], ln: legs, lf: far || legs.map(v => v + 1), at: {j: 'wristN', x: 0, y: wy}};
  const make = b => ({...rot(base, b), an: [180 + b, 180 + b, hand], af: [180 + b, 180 + b, hand]});
  return make(balance(make, -14, 14, sway));
}

export const moves = {};
const def = (id, a) => { moves[id] = {id, ...a}; return moves[id]; };

// =====================================================================
// MOBILITY
// =====================================================================

// Kneeling on the heels, arms forward, wrists flex and extend.
{
  const base = h => ({t: 2, n: 4, an: [90, 90, h], af: [91, 91, h], ln: [108, 268, 272], lf: [109, 269, 273], at: {j: 'kneeN', x: 0, y: -6}});
  def('wrist-circles', {title: 'Handledsrörlighet', props: [FLOOR], key: 0, frames: [
    {p: base(30), hold: 300, move: 900, cue: 'Sträck: fingrarna mot taket.', focus: ['hands']},
    {p: base(150), hold: 300, move: 900, cue: 'Böj: fingrarna mot golvet. Lugnt, 10 gånger.', focus: ['hands']},
  ]});
}

// Quadruped wrist rocks (fingers forward).
{
  const quad = (lean, hx) => {
    const make = t => ({t, n: t + 12, ln: [180 - lean, 270, 272], lf: [181 - lean, 271, 273], at: {j: 'kneeN', x: 0, y: -6},
      ik: {an: {x: hx, y: HW, b: 1, h: 90}, af: {x: hx - 2, y: HW, b: 1, h: 90}}});
    return make(sY(make, 60, 120, -56.5 + lean * .15));
  };
  const hx = joint(quad(0, 0), 'shoulder')[0];
  def('wrist-rocks', {title: 'Handledsstretch i fyrfota', props: [FLOOR], key: 1, frames: [
    {p: quad(0, hx), hold: 500, move: 1300, cue: 'Händerna under axlarna, fingrarna framåt.'},
    {p: quad(13, hx), hold: 1400, move: 1300, cue: 'Gunga fram över handlederna. Hela handflatan i golvet.', focus: ['hands'], timer: true},
  ]});
  const lift = (h, back) => {
    const p = quad(back, hx); p.ik = {an: {x: hx + 8.5, y: -1.2, b: 1, h, tip: true}, af: {x: hx + 6.5, y: -1.2, b: 1, h, tip: true}}; return p;
  };
  def('palm-lifts', {title: 'Handflatelyft', props: [FLOOR], key: 1, frames: [
    {p: lift(90, 0), hold: 300, move: 700, cue: 'Handflatorna i golvet.'},
    {p: lift(140, 0), hold: 400, move: 700, cue: 'Lyft handflatan, fingrarna kvar i golvet.', focus: ['hands']},
  ]});
}

// Plank with shoulders leaning ahead of the wrists.
{
  const top = sY(e => plank(e), 4, 60, HW - 52.5), hx = joint(plank(top), 'shoulder')[0] + 1;
  const lean = reach(e => plank(e, {toe: 12}), 4, 60, [hx, HW]);
  def('wrist-lean', {title: 'Handledslean i planka', props: [FLOOR], key: 1, frames: [
    {p: plank(top, {hx}), hold: 500, move: 1500, cue: 'Planka på raka armar.'},
    {p: plank(lean, {hx, toe: 12}), hold: 2200, move: 1300, cue: 'Luta axlarna framför händerna. Raka armbågar.', focus: ['hands', 'shoulders'], timer: true},
  ]});
}

// Band / stick pass-throughs.
{
  const s = a => stand(0, {an: [a, a, a], af: [a + 1, a + 1, a + 1]});
  def('band-dislocates', {title: 'Bandpass', props: [FLOOR], key: 1, frames: [
    {p: s(168), hold: 250, move: 1100, cue: 'Brett grepp om band eller pinne. Raka armar.'},
    {p: s(0), hold: 200, move: 1100, cue: 'Upp över huvudet. Revbenen nere.', focus: ['shoulders']},
    {p: s(-168), hold: 250, move: 1100, cue: 'Hela vägen bakom kroppen.'},
    {p: s(0), hold: 200, move: 1100, cue: 'Och tillbaka, lugnt och kontrollerat.'},
  ]});
}
function stand(x = 0, extra = {}) {
  return {t: 0, n: 2, an: [180, 180, 180], af: [182, 182, 182], ln: [180, 180, 118], lf: [181, 181, 119], at: {j: 'ankleN', x, y: -7}, ...extra};
}

// Puppy pose: hips over knees, chest sinks, arms long on the floor.
{
  const pup = sink => {
    const make = t => ({t, n: t - 18, ln: [180, 270, 272], lf: [181, 271, 273], at: {j: 'kneeN', x: 0, y: -6}, an: [t - 40, t - 40, 92], af: [t - 39, t - 39, 92]});
    const t = sY(make, 95, 160, -27 + sink);
    const p = make(t), sh = joint(p, 'shoulder');
    p.ik = {an: {x: sh[0] + 50, y: HW, b: -1, h: 92}, af: {x: sh[0] + 48, y: HW, b: -1, h: 92}};
    return p;
  };
  def('puppy-pose', {title: 'Valpställning', props: [FLOOR], key: 1, frames: [
    {p: pup(0), hold: 600, move: 1600, cue: 'Höften över knäna, armarna långt fram.'},
    {p: pup(7), hold: 2200, move: 1600, cue: 'Andas ut och låt bröstet sjunka mot golvet.', focus: ['shoulders'], timer: true},
  ]});
}

// Wall test: arms up overhead with the back flat against the wall.
{
  const s = a => stand(0, {an: [a, a, a], af: [a + 1, a + 1, a + 1]});
  def('wall-test', {title: 'Väggtest för axlarna', props: [FLOOR, {k: 'wall', x: -17, side: 'left', top: -250}], key: 1, frames: [
    {p: s(178), hold: 500, move: 1700, cue: 'Rygg, bakhuvud och säte mot väggen.'},
    {p: s(-4), hold: 2000, move: 1500, cue: 'Raka armar mot väggen ovanför huvudet. Ländryggen kvar.', focus: ['shoulders'], timer: true},
  ]});
}

// Shoulder extension stretch with hands behind on a bench.
{
  const BOX = 46, wx = 0, wy = -BOX + HW;
  const pose = (sx, sy, t) => ({t, n: t + 4, at: {j: 'shoulder', x: sx, y: sy},
    ik: {an: {x: wx, y: wy, b: -1, h: 270}, af: {x: wx - 2, y: wy, b: -1, h: 270}, ln: {x: sx + 62, y: -7, b: -1, f: 118}, lf: {x: sx + 60, y: -7, b: -1, f: 119}}});
  def('bench-shoulder', {title: 'Axelstretch bakåt', props: [FLOOR, {k: 'box', x: -40, w: 44, h: BOX}], key: 1, frames: [
    {p: pose(20, -101, 2), hold: 500, move: 1700, cue: 'Händerna bakom dig på bänken, fingrarna framåt.'},
    {p: pose(28, -78, 0), hold: 2200, move: 1500, cue: 'Sänk dig långsamt. Bröstet öppet, axlarna bort från öronen.', focus: ['shoulders'], timer: true},
  ]});
}

// Skin the cat (tuck) and German hang. Arms stay pointing up to the bar while the
// body rotates backwards through the arms (torso 0 → -340).
{
  const sk = (t, legs, a = 0) => ({t, n: t, an: [a, a, a + 10], af: [a, a, a + 10], ln: legs, lf: legs.map(v => v + 2), at: {j: 'wristN', x: 0, y: GY}});
  const gh = sk(-338, straight(-338 + 8), -6);
  def('skin-the-cat', {title: 'Skin the cat (tuck)', props: [{k: 'rings', x: 0, y: BY + 2}], key: 3, frames: [
    {p: sk(0, [180, 180, 172]), hold: 400, move: 1100, cue: 'Häng med raka armar.'},
    {p: sk(-20, tuck(-20)), hold: 150, move: 1200, cue: 'Dra knäna mot bröstet.'},
    {p: sk(-180, tuck(-180)), hold: 200, move: 1500, cue: 'Rotera bakåt genom armarna.', focus: ['core']},
    {p: sk(-300, tuck(-300), -4), hold: 300, move: 1300, cue: 'Sänk fötterna långsamt bakom dig.'},
    {p: gh, hold: 1300, move: 1500, cue: 'German hang. Andas, slappna av i axlarna.', focus: ['shoulders'], timer: true},
    {p: sk(-300, tuck(-300), -4), hold: 150, move: 1400, cue: 'Tuck och rulla tillbaka samma väg.'},
    {p: sk(-180, tuck(-180)), hold: 150, move: 1300, cue: 'Tillbaka genom upp-och-ner.'},
  ]});
  def('german-hang', {title: 'German hang', props: [{k: 'rings', x: 0, y: BY + 2}], key: 0, frames: [
    {p: gh, hold: 2600, move: 1400, cue: 'Raka armar bakom kroppen. Låt axlarna sträckas.', focus: ['shoulders'], timer: true},
    {p: sk(-334, straight(-334 + 14), -9), hold: 600, move: 1400, cue: 'Andas lugnt. Gå ut via tuck när du är klar.'},
  ]});
}

// Seated pike fold and compression lifts.
{
  const sit = (t, legs, far, hands) => ({t, n: t + 14, ln: legs, lf: far || legs.map(v => v + .5), at: {j: 'pelvis', x: 0, y: -10}, ik: hands});
  const flat = [95, 95, 8];
  const reach = t => { const p = sit(t, flat); const a = joint(p, 'ankleN'); p.ik = {an: {x: a[0] - 9, y: a[1] - 5, b: -1, h: 120}, af: {x: a[0] - 11, y: a[1] - 5, b: -1, h: 120}}; return p; };
  def('pike-fold', {title: 'Sittande pikestretch', props: [FLOOR], key: 1, frames: [
    {p: sit(4, flat, null, {an: {x: 22, y: -12, b: -1, h: 95}, af: {x: 20, y: -12, b: -1, h: 95}}), hold: 400, move: 1800, cue: 'Raka ben, tårna mot taket.'},
    {p: reach(66), hold: 2400, move: 1500, cue: 'Fäll framåt från höften med lång rygg.', focus: ['legs'], timer: true},
  ]});
  const hands = {an: {x: 32, y: HW, b: -1, h: 95}, af: {x: 30, y: HW, b: -1, h: 95}};
  def('pike-lift-one', {title: 'Kompressionslyft, ett ben', props: [FLOOR], key: 1, frames: [
    {p: sit(22, flat, null, hands), hold: 300, move: 650, cue: 'Händerna i golvet bredvid knäna, luta dig fram.'},
    {p: sit(24, [80, 80, 0], flat, hands), hold: 600, move: 650, cue: 'Lyft ett rakt ben med lårets framsida.', focus: ['legs', 'core']},
  ]});
  def('pike-lift-both', {title: 'Kompressionslyft, båda benen', props: [FLOOR], key: 1, frames: [
    {p: sit(26, flat, null, hands), hold: 300, move: 700, cue: 'Luta dig fram, axlarna över händerna.'},
    {p: sit(30, [82, 82, 2], [82.5, 82.5, 2.5], hands), hold: 700, move: 700, cue: 'Lyft båda hälarna. Håll knäna raka.', focus: ['legs', 'core']},
  ]});
}

// Pancake (front view) and straddle compression lifts.
{
  const pan = (fold, lift = 0) => {
    const t = 0, s = 1 - fold * .6;
    return {front: 1, t, n: t, sw: 17, hw: 10, len: {torso: s, neck: 1 - fold * .5}, ln: [96 - lift, 96 - lift, 10], lf: [-96 + lift, -96 + lift, -10], at: {j: 'pelvis', x: 0, y: -10},
      ik: {an: {x: 38 - fold * 10, y: -16 + fold * 12.5, b: -1, h: 180}, af: {x: -38 + fold * 10, y: -16 + fold * 12.5, b: 1, h: 180}}};
  };
  def('pancake', {title: 'Straddle-stretch (pancake)', view: 'front', props: [FLOOR], key: 1, frames: [
    {p: pan(0), hold: 500, move: 1800, cue: 'Benen brett isär, tårna mot taket.'},
    {p: pan(1), hold: 2400, move: 1600, cue: 'Fäll framåt med rak rygg, magen mot golvet.', focus: ['legs'], timer: true},
  ]});
  def('straddle-lift', {title: 'Straddle-kompressionslyft', view: 'front', props: [FLOOR], key: 1, frames: [
    {p: pan(.45), hold: 300, move: 700, cue: 'Händerna i golvet framför dig.'},
    {p: pan(.5, 20), hold: 600, move: 700, cue: 'Lyft båda benen från golvet utan att böja knäna.', focus: ['legs', 'core']},
  ]});
}

// Ankle mobility: knee to wall, deep squat.
{
  const lunge = k => ({t: 4, n: 4, an: [174, 160, 160], af: [176, 162, 162], ln: [140 - k, 196 + k * .9, 118], at: {j: 'ankleN', x: 0, y: -7},
    ik: {lf: {x: -46, y: -2, b: -1, f: 160, tip: true}}});
  def('knee-to-wall', {title: 'Knä mot vägg', props: [FLOOR, {k: 'wall', x: 30, top: -200}], key: 1, frames: [
    {p: lunge(0), hold: 400, move: 900, cue: 'Främre foten en handsbredd från väggen.'},
    {p: lunge(16), hold: 700, move: 900, cue: 'För knät mot väggen. Hälen stannar i golvet.', focus: ['feet']},
  ]});
  const squat = (th, flex, t, a) => ({t, n: t - 14, an: [a, a, a], af: [a + 2, a + 2, a + 2], ln: [th, th + flex, 118], lf: [th + 1, th + flex + 1, 119], at: {j: 'ankleN', x: 0, y: -7}});
  def('deep-squat', {title: 'Djup knäböj, håll', props: [FLOOR], key: 1, frames: [
    {p: squat(180, 0, 0, 178), hold: 400, move: 1700, cue: 'Fötterna axelbrett, tårna lätt utåt.'},
    {p: squat(70, 146, 34, 82), hold: 2400, move: 1500, cue: 'Sitt djupt med hela foten i golvet. Bröstet upp.', focus: ['feet', 'legs'], timer: true},
  ]});
}

// =====================================================================
// CORE / BODYLINE
// =====================================================================
{
  const fe = sY(e => ({...plank(e), an: [180, 90, 90], af: [181, 91, 91], ik: {}}), 0, 40, -4.5 - 29);
  const fp = (e, s = 1) => ({...plank(e), an: [180, 90, 90], af: [181, 91, 91], ik: {}, len: {torso: s}});
  def('plank', {title: 'Planka', props: [FLOOR], key: 0, frames: [
    {p: fp(fe), hold: 1800, move: 900, cue: 'Armbågarna under axlarna. Rak linje från huvud till häl.', focus: ['core'], timer: true},
    {p: fp(fe + .8, 1.01), hold: 600, move: 900, cue: 'Spänn säte och mage. Andas lugnt.'},
  ]});
  const supine = (t, legs, arms, n) => ({t, n: n ?? t + 22, an: arms, af: arms.map(v => v + 1), ln: legs, lf: legs.map(v => v + 1), at: {j: 'pelvis', x: 0, y: -9}});
  const flatBack = supine(-92, [42, 150, 104], [88, 88, 88], -90);
  def('tuck-hollow', {title: 'Tuck hollow hold', props: [FLOOR], key: 1, frames: [
    {p: flatBack, hold: 500, move: 1200, cue: 'Ligg på rygg. Pressa ländryggen mot golvet.'},
    {p: supine(-74, [-40, 106, 96], [96, 96, 96]), hold: 2400, move: 1100, cue: 'Lyft axlarna, knäna mot bröstet.', focus: ['core'], timer: true},
  ]});
  def('hollow', {title: 'Hollow hold', props: [FLOOR], key: 1, frames: [
    {p: flatBack, hold: 400, move: 1200, cue: 'Ländryggen i golvet hela tiden.'},
    {p: supine(-76, [66, 66, 58], [96, 96, 96]), hold: 2400, move: 1100, cue: 'Raka ben lågt, armarna längs sidorna.', focus: ['core'], timer: true},
  ]});
  def('hollow-full', {title: 'Hollow hold, armar över huvudet', props: [FLOOR], key: 1, frames: [
    {p: flatBack, hold: 400, move: 1200, cue: 'Ländryggen i golvet hela tiden.'},
    {p: supine(-78, [68, 68, 60], [-84, -84, -84], -58), hold: 2400, move: 1100, cue: 'Armarna förbi öronen, kroppen som en banan.', focus: ['core'], timer: true},
  ]});
  const prone = (t, legs, arms) => ({t, n: t - 8, an: arms, af: arms.map(v => v - 1), ln: legs, lf: legs.map(v => v - 1), at: {j: 'pelvis', x: 0, y: -10}});
  def('arch-hold', {title: 'Arch hold', props: [FLOOR], key: 1, frames: [
    {p: prone(92, [272, 272, 268], [88, 88, 90]), hold: 400, move: 1100, cue: 'Ligg på magen, armarna framåt.'},
    {p: prone(76, [286, 286, 278], [72, 72, 72]), hold: 2400, move: 1100, cue: 'Lyft bröst, armar och ben. Spänn sätet.', focus: ['core'], timer: true},
  ]});
}

// =====================================================================
// PUSH-UPS → ONE-ARM PUSH-UP
// =====================================================================
{
  const top = sY(e => plank(e), 4, 60, HW - 52.5), bottom = sY(e => plank(e), 0, 40, -18);
  const hx = joint(plank(top), 'shoulder')[0] + 1.5;
  def('push-up', {title: 'Armhävning', props: [FLOOR], key: 0, ghost: [1], frames: [
    {p: plank(top, {hx}), hold: 450, move: 1150, cue: 'Rak kropp från huvud till häl. Spänn mage och säte.'},
    {p: plank(bottom, {hx}), hold: 250, move: 900, cue: 'Bröstet nära golvet. Armbågarna ca 45° från kroppen.', focus: ['arms']},
  ]});
  const dx = hx - 7;
  def('diamond-push-up', {title: 'Diamantarmhävning', props: [FLOOR], key: 0, ghost: [1], frames: [
    {p: plank(top, {hx: dx}), hold: 450, move: 1150, cue: 'Händerna ihop under bröstbenet, tummar och pekfingrar bildar en diamant.'},
    {p: plank(bottom, {hx: dx}), hold: 250, move: 900, cue: 'Armbågarna nära kroppen, bakåt.', focus: ['arms']},
  ]});
  // Pseudo planche push-up: hands at the waist, shoulders well ahead of the wrists.
  const ptop = sY(e => plank(e), 4, 60, HW - 49.6), pbot = sY(e => plank(e), 0, 40, -20);
  const px = joint(plank(ptop), 'shoulder')[0] - 20;
  def('pppu', {title: 'Pseudo planche push-up', props: [FLOOR], key: 0, ghost: [1], frames: [
    {p: plank(ptop, {hx: px, hand: 270}), hold: 450, move: 1250, cue: 'Händerna vid midjan, fingrarna bakåt. Luta axlarna framåt.', focus: ['shoulders']},
    {p: plank(pbot, {hx: px, hand: 270}), hold: 250, move: 1000, cue: 'Behåll lutningen hela vägen ner.', focus: ['arms']},
  ]});
  const BOX = 46, inc = e => plank(e, {toe: -8});
  const itop = sY(inc, 10, 75, -BOX + HW - 52.5), ibot = sY(inc, 5, 70, -BOX - 15), ix = joint(inc(itop), 'shoulder')[0] + 1.5;
  def('incline-push-up', {title: 'Lutande armhävning', props: [FLOOR, {k: 'box', x: ix - 16, w: 34, h: BOX}], key: 0, ghost: [1], frames: [
    {p: plank(itop, {hx: ix, hy: -BOX + HW, toe: -8}), hold: 450, move: 1100, cue: 'Händerna på en stabil bänk, axelbrett.'},
    {p: plank(ibot, {hx: ix, hy: -BOX + HW, toe: -8}), hold: 250, move: 900, cue: 'Bröstet mot kanten. Kroppen hålls rak.', focus: ['arms']},
  ]});
}
// Head-on views (camera in front of the head). The body points away from the camera,
// so the torso and legs are drawn foreshortened.
{
  const front = (sx, sy, {nearHand, farHand, farArm, feet = 14, tilt = 0, hy = HW}) => {
    const p = {front: 1, dimLegs: 1, t: tilt, n: tilt, sw: 17, hw: 7, len: {torso: .3, neck: .35}, at: {j: 'shoulder', x: sx, y: sy},
      ln: [180, 180, 180], lf: [180, 180, 180], ik: {}};
    const pel = joint(p, 'pelvis'), drop = -7 - pel[1], s = Math.max(.15, Math.hypot(drop, Math.max(0, feet - 7)) / (L_TH + L_SH) * .995);
    p.len = {...p.len, thN: s, shN: s, thF: s, shF: s, foot: .3};
    p.ik.ln = {x: pel[0] + feet, y: -7, b: 0, f: 180}; p.ik.lf = {x: pel[0] - feet, y: -7, b: 0, f: 180};
    p.ik.an = {x: nearHand[0], y: nearHand[1] ?? hy, b: -1, h: 180};
    if (farHand) p.ik.af = {x: farHand[0], y: farHand[1] ?? hy, b: 1, h: 180};
    else p.af = farArm;
    p.len.hand = .45;
    return p;
  };
  def('archer-push-up', {title: 'Archer push-up', view: 'front', props: [FLOOR], key: 1, frames: [
    {p: front(0, -52, {nearHand: [40], farHand: [-40]}), hold: 400, move: 1300, cue: 'Händerna nästan dubbelt axelbrett.'},
    {p: front(20, -24, {nearHand: [40], farHand: [-40]}), hold: 300, move: 1100, cue: 'Sänk dig mot ena handen. Den andra armen hålls rak.', focus: ['arms']},
    {p: front(0, -52, {nearHand: [40], farHand: [-40]}), hold: 400, move: 1300, cue: 'Tryck upp till mitten.'},
    {p: front(-20, -24, {nearHand: [40], farHand: [-40]}), hold: 300, move: 1100, cue: 'Byt sida.', focus: ['arms']},
  ]});
  const BOX = 40, behind = [196, 110, 110];
  def('incline-oapu', {title: 'Lutande enarmsarmhävning', view: 'front', props: [FLOOR, {k: 'box', x: -18, w: 40, h: BOX}], key: 1, frames: [
    {p: front(-6, -BOX - 55, {nearHand: [8, -BOX + HW], farArm: behind, feet: 32, tilt: 6}), hold: 400, move: 1300, cue: 'En hand på bänken under bröstet. Fötterna brett.'},
    {p: front(-1, -BOX - 26, {nearHand: [8, -BOX + HW], farArm: behind, feet: 32, tilt: 10}), hold: 300, move: 1100, cue: 'Sänk dig med höften i linje. Tryck upp.', focus: ['arms', 'core']},
  ]});
  def('oapu', {title: 'Enarmsarmhävning', view: 'front', props: [FLOOR], key: 1, frames: [
    {p: front(-6, -55, {nearHand: [8], farArm: behind, feet: 34, tilt: 6}), hold: 450, move: 1400, cue: 'Handen under bröstet, fötterna brett. Spänn hela kroppen.'},
    {p: front(-1, -24, {nearHand: [8], farArm: behind, feet: 34, tilt: 11}), hold: 300, move: 1200, cue: 'Låt inte höften rotera. Bröstet mot handen.', focus: ['arms', 'core']},
  ]});
}

// =====================================================================
// PULL-UPS
// =====================================================================
def('dead-hang', {title: 'Häng', props: [BAR], key: 0, frames: [
  {p: hang(-2, GY + 53.6), hold: 2400, move: 1300, cue: 'Raka armar, fullt grepp om stången.', timer: true},
  {p: hang(-2, GY + 53.4, {len: {torso: 1.01}}), hold: 500, move: 1300, cue: 'Andas lugnt. Släpp spänningen i nacken.'},
]});
def('scap-pull', {title: 'Scapula pull-up', props: [BAR], key: 1, ghost: [0], frames: [
  {p: hang(-2, GY + 53.6, {len: {torso: 1.1, neck: .78}}), hold: 400, move: 800, cue: 'Passivt häng: axlarna vid öronen.'},
  {p: hang(-2, GY + 53.6, {len: {torso: 1, neck: 1}, legs: [176, 180, 170]}), hold: 700, move: 800, cue: 'Dra ner skulderbladen. Raka armar, kroppen lyfts några cm.', focus: ['shoulders']},
]});
def('arch-hang', {title: 'Arch hang', props: [BAR], key: 1, ghost: [0], frames: [
  {p: hang(-2, GY + 53.6), hold: 400, move: 1000, cue: 'Starta i häng.'},
  {p: hang(-9, GY + 52, {t: -15, n: -10, legs: [188, 190, 182]}), hold: 900, move: 1000, cue: 'Bröstet fram mot stången, skulderbladen ner och bak. Raka armar.', focus: ['shoulders']},
]});
{
  const bottom = hang(-3, GY + 53.4), top = hang(-14, GY + 2, {t: -12, legs: [168, 176, 164], n: -24});
  def('pull-up-negative', {title: 'Negativ pull-up', props: [BAR], key: 0, frames: [
    {p: top, hold: 500, move: 3600, ease: 'lin', cue: 'Börja med hakan över stången (hoppa upp).'},
    {p: bottom, hold: 500, move: 800, cue: 'Sänk dig långsamt, 3–5 sekunder, till raka armar.', focus: ['arms']},
  ]});
  def('pull-up', {title: 'Pull-up', props: [BAR], key: 1, ghost: [0], frames: [
    {p: bottom, hold: 500, move: 1150, cue: 'Starta från raka armar. Dra ner skulderbladen först.'},
    {p: top, hold: 350, move: 1300, cue: 'Hakan över stången. Bröstet mot stången.', focus: ['arms']},
  ]});
  def('c2b-pull-up', {title: 'Chest-to-bar pull-up', props: [BAR], key: 1, ghost: [0], frames: [
    {p: bottom, hold: 450, move: 1150, cue: 'Raka armar i botten.'},
    {p: hang(-15, GY - 8, {t: -20, legs: [164, 172, 160], n: -30}), hold: 350, move: 1300, cue: 'Dra bröstet hela vägen till stången. Armbågarna bakåt.', focus: ['arms']},
  ]});
}

// =====================================================================
// DIPS
// =====================================================================
{
  const DY = -122, wy = DY - 3;
  const dip = (sx, sy, t, legs = [178, 268, 258]) => ({t, n: t, ln: legs, lf: legs.map(v => v + 1), at: {j: 'shoulder', x: sx, y: sy},
    ik: {an: {x: 0, y: wy, b: 1, h: 90}, af: {x: -2, y: wy, b: 1, h: 90}}});
  const top = dip(-1, wy - 53.6, 6), bottom = dip(9, wy - 26, 24, [172, 262, 252]);
  def('support-hold', {title: 'Support hold', props: [FLOOR, {k: 'dip', x: 0, y: DY}], key: 0, frames: [
    {p: top, hold: 2400, move: 900, cue: 'Raka armar, axlarna ner från öronen.', focus: ['shoulders'], timer: true},
    {p: hold(top, 1.015), hold: 500, move: 900, cue: 'Tryck stängerna mot golvet.'},
  ]});
  def('dip-negative', {title: 'Negativ dip', props: [FLOOR, {k: 'dip', x: 0, y: DY}], key: 0, frames: [
    {p: top, hold: 500, move: 3600, ease: 'lin', cue: 'Starta i support med raka armar.'},
    {p: bottom, hold: 500, move: 900, cue: 'Sänk dig långsamt, 3–5 sekunder. Kliv upp igen.', focus: ['arms']},
  ]});
  def('dip', {title: 'Dips', props: [FLOOR, {k: 'dip', x: 0, y: DY}], key: 1, ghost: [0], frames: [
    {p: top, hold: 450, move: 1200, cue: 'Raka armar, lätt framåtlutad.'},
    {p: bottom, hold: 250, move: 1000, cue: 'Ner tills axeln är strax under armbågen. Tryck upp.', focus: ['arms']},
  ]});
}

// =====================================================================
// LEGS → PISTOL SQUAT
// =====================================================================
{
  const squat = (th, flex, t, a) => ({t, n: t - 14, an: [a, a, a], af: [a + 2, a + 2, a + 2], ln: [th, th + flex, 118], lf: [th + 1, th + flex + 1, 119], at: {j: 'ankleN', x: 0, y: -7}});
  def('squat', {title: 'Djup knäböj', props: [FLOOR], key: 1, ghost: [1], frames: [
    {p: squat(180, 0, 0, 178), hold: 350, move: 1300, cue: 'Fötterna axelbrett. Bröstet upp.'},
    {p: squat(70, 146, 34, 86), hold: 250, move: 1100, cue: 'Höften under knähöjd. Hälarna kvar i golvet.', focus: ['legs']},
  ]});
  const split = (th, sh, back, t = 2) => ({t, n: t, an: [178, 178, 178], af: [182, 182, 182], ln: [th, sh, 118], at: {j: 'ankleN', x: 34, y: -7},
    ik: {lf: back}});
  def('split-squat', {title: 'Split squat', props: [FLOOR], key: 1, ghost: [0], frames: [
    {p: split(152, 192, {x: -16, y: -1, b: -1, f: 150, tip: true}), hold: 350, move: 1300, cue: 'Långt steg. Bakre foten på tå.'},
    {p: split(100, 196, {x: -16, y: -1, b: -1, f: 150, tip: true}), hold: 250, move: 1100, cue: 'Sänk bakre knät nästan till golvet. Främre knät över foten.', focus: ['legs']},
  ]});
  const BOX = 46;
  def('bulgarian', {title: 'Bulgarisk split squat', props: [FLOOR, {k: 'box', x: -62, w: 34, h: BOX}], key: 1, ghost: [0], frames: [
    {p: split(164, 186, {x: -40, y: -BOX - 6, b: -1, f: 250}, 6), hold: 350, move: 1300, cue: 'Bakre fotens ovansida på bänken.'},
    {p: split(98, 198, {x: -40, y: -BOX - 6, b: -1, f: 250}, 14), hold: 250, move: 1100, cue: 'Gå rakt ner. Tyngden på främre benet.', focus: ['legs']},
  ]});
  const coss = (px, py, b) => ({front: 1, t: 0, n: 0, sw: 16, hw: 9, an: [194, 300, 300], af: [166, 60, 60], len: {faN: .7, faF: .7}, at: {j: 'pelvis', x: px, y: py},
    ik: {ln: {x: 44, y: -7, b, f: 180}, lf: {x: -44, y: -7, b: -1, f: 0}}});
  def('cossack', {title: 'Cossack squat', view: 'front', props: [FLOOR], key: 1, frames: [
    {p: coss(0, -84, 1), hold: 300, move: 1300, cue: 'Bred fotställning.'},
    {p: coss(30, -40, 1), hold: 300, move: 1100, cue: 'Sitt djupt på ena benet. Det andra benet rakt, tårna upp.', focus: ['legs']},
    {p: coss(0, -84, 1), hold: 300, move: 1300, cue: 'Tryck tillbaka till mitten.'},
  ]});
  const pist = (th, flex, t, free, a = 90) => ({t, n: t - 10, an: [a, a, a], af: [a + 2, a + 2, a + 2], ln: [th, th + flex, 118], lf: free, at: {j: 'ankleN', x: 0, y: -7}});
  def('box-pistol', {title: 'Pistol till låda', props: [FLOOR, {k: 'box', x: -58, w: 40, h: 42}], key: 1, ghost: [0], frames: [
    {p: pist(180, 0, 2, [150, 150, 70]), hold: 350, move: 1500, cue: 'Stå på ett ben framför en låda.'},
    {p: pist(98, 100, 30, [96, 96, 16]), hold: 400, move: 1300, cue: 'Sätt dig kontrollerat på lådan. Res dig utan gungning.', focus: ['legs']},
  ]});
  const POLE = 42;
  const ap = (th, flex, t, free, h) => ({...pist(th, flex, t, free), ik: {an: {x: POLE - 5, y: h, b: 1, h: 90}, af: {x: POLE - 7, y: h - 6, b: 1, h: 90}}});
  def('assisted-pistol', {title: 'Assisterad pistol', props: [FLOOR, {k: 'pole', x: POLE, top: -200}], key: 1, ghost: [0], frames: [
    {p: ap(180, 0, 2, [150, 150, 70], -112), hold: 350, move: 1600, cue: 'Håll i en stolpe eller dörrkarm.'},
    {p: ap(70, 146, 40, [86, 86, 6], -66), hold: 300, move: 1400, cue: 'Gå hela vägen ner. Använd armarna så lite som möjligt.', focus: ['legs']},
  ]});
  def('pistol', {title: 'Pistol squat', props: [FLOOR], key: 1, ghost: [0], frames: [
    {p: pist(180, 0, 2, [150, 150, 70], 92), hold: 400, move: 1500, cue: 'Stå på ett ben, armarna framåt som motvikt.'},
    {p: pist(70, 146, 42, [84, 84, 6], 86), hold: 300, move: 1300, cue: 'Hela foten i golvet. Knät följer tårna.', focus: ['legs']},
  ]});
}

// =====================================================================
// L-SIT
// =====================================================================
{
  const PY = -18, wy = PY - 3.5, PARA = {k: 'para', x: 0, y: PY};
  const ls = (legs, far, extra = {}) => {
    const make = a => ({t: 2, n: 8, an: [a, a, 90], af: [a, a, 90], ln: legs, lf: far || legs.map(v => v + .6), at: {j: 'wristN', x: 0, y: wy}, ...extra});
    return extra.ik ? make(178) : make(balance(make, 150, 210, 0));
  };
  const heel = (x, legsFree) => {
    const p = {t: 2, n: 8, an: [178, 178, 90], af: [178, 178, 90], ln: [100, 100, 10], lf: [100, 100, 10], at: {j: 'wristN', x: 0, y: wy}, ik: {}};
    p.ik.lf = {x, y: -7, b: -1, f: 10};
    if (!legsFree) p.ik.ln = {x: x + 1, y: -7, b: -1, f: 10}; else p.ln = legsFree;
    return p;
  };
  const sitting = {t: 2, n: 8, ln: [96, 96, 8], lf: [96.5, 96.5, 8.5], at: {j: 'pelvis', x: -10, y: -10}, ik: {an: {x: 0, y: wy, b: 1, h: 90}, af: {x: -2, y: wy, b: 1, h: 90}}};
  const hx = joint(heel(70), 'pelvis')[0] + 78;
  def('foot-l-sit', {title: 'Fotunderstödd L-sit', props: [FLOOR, PARA], key: 1, frames: [
    {p: sitting, hold: 400, move: 1000, cue: 'Sitt mellan parallettes, hälarna i golvet.'},
    {p: heel(hx), hold: 2400, move: 1000, cue: 'Tryck upp med raka armar. Axlarna ner.', focus: ['shoulders'], timer: true},
  ]});
  def('one-foot-l-sit', {title: 'Enbens fotunderstödd L-sit', props: [FLOOR, PARA], key: 1, frames: [
    {p: heel(hx), hold: 500, move: 900, cue: 'Fotunderstödd L-sit.'},
    {p: heel(hx, [88, 88, 98]), hold: 2200, move: 900, cue: 'Lyft ett rakt ben. Byt ben varje set.', focus: ['legs', 'core'], timer: true},
  ]});
  const tk = ls([40, 190, 182], [41, 191, 183]);
  def('tuck-l-sit', {title: 'Tuck L-sit', props: [FLOOR, PARA], key: 1, frames: [
    {p: heel(hx), hold: 400, move: 1100, cue: 'Starta med hälarna i golvet.'},
    {p: tk, hold: 2400, move: 1000, cue: 'Knäna mot bröstet, fötterna från golvet. Axlarna ner.', focus: ['shoulders', 'core'], timer: true},
  ]});
  def('one-leg-l-sit', {title: 'Enbens L-sit', props: [FLOOR, PARA], key: 1, frames: [
    {p: tk, hold: 500, move: 1100, cue: 'Tuck L-sit.'},
    {p: ls([90, 90, 98], [41, 191, 183]), hold: 2200, move: 1000, cue: 'Sträck ut ett ben vågrätt. Byt ben varje set.', focus: ['legs', 'core'], timer: true},
  ]});
  def('l-sit', {title: 'L-sit', props: [FLOOR, PARA], key: 1, frames: [
    {p: tk, hold: 600, move: 1200, cue: 'Från tuck: tryck ner axlarna.', focus: ['shoulders']},
    {p: ls([90, 90, 98]), hold: 2600, move: 1100, cue: 'Raka ben, spetsade tår, höften lyft.', focus: ['core', 'legs'], timer: true},
  ]});
}

// =====================================================================
// HANDSTAND
// =====================================================================
{
  // Wall plank: hands on the floor, feet on the wall, body angled.
  const wp = (t => {
    const p = {t, n: t + 6, an: [184, 184, 90], af: [184, 184, 90], ln: straight(t).map((v, i) => i === 2 ? t + 180 - 80 : v), at: {j: 'wristN', x: 0, y: HW}};
    return p;
  })(112);
  const wallX = joint(wp, 'toeN')[0] - 2;
  def('wall-plank', {title: 'Väggplanka', props: [FLOOR, {k: 'wall', x: wallX, side: 'left', top: -150}], key: 0, frames: [
    {p: wp, hold: 2200, move: 900, cue: 'Fötterna mot väggen, axlarna över händerna.', focus: ['shoulders'], timer: true},
    {p: hold(wp, 1.015), hold: 500, move: 900, cue: 'Tryck golvet ifrån dig. Spänd mage.'},
  ]});
  // Chest-to-wall: chest faces the wall (left), fingers point away from it.
  const c2w = handstand();
  const cx = joint(c2w, 'toeN')[0] - 6;
  def('chest-to-wall', {title: 'Handstand mot vägg (magen mot väggen)', props: [FLOOR, {k: 'wall', x: cx, side: 'left', top: -250}], key: 0, frames: [
    {p: c2w, hold: 2200, move: 1000, cue: 'Magen mot väggen, händerna en handsbredd ut. Bara tårna nuddar.', focus: ['core'], timer: true},
    {p: hold(c2w, 1.02), hold: 600, move: 1000, cue: 'Tryck upp: axlarna mot öronen, revbenen in.', focus: ['shoulders']},
  ]});
  // Back-to-wall toe pulls: heels on the wall (right), then balance away.
  const lean = rot({...handstand(), at: {j: 'wristN', x: 0, y: HW}}, 0);
  const onWall = (() => { const p = structuredClone(lean); p.t += 5; p.ln = [8, 8, 2]; p.lf = [9, 9, 3]; p.n += 2; return p; })();
  const bw = joint(onWall, 'ankleN')[0] + 6;
  def('toe-pulls', {title: 'Tåavdrag från vägg', props: [FLOOR, {k: 'wall', x: bw, top: -250}], key: 1, frames: [
    {p: onWall, hold: 700, move: 900, cue: 'Ryggen mot väggen, hälarna vilar mot den.'},
    {p: handstand(), hold: 1400, move: 900, cue: 'Dra tårna från väggen med fingrarna. Balansera 1–3 s.', focus: ['hands']},
  ]});
  // Kick-up: lunge with hands planted, swing the back leg up, join legs, step down.
  const kick = {t: 132, n: 140, an: [182, 182, 90], af: [182, 182, 90], ln: [173, 197, 92], lf: straight(132).map(v => v - 364), at: {j: 'wristN', x: 0, y: HW},
    ik: {ln: {x: -42, y: -7, b: -1, f: 92}}};
  const swing = {t: 168, n: 172, an: [181, 181, 90], af: [181, 181, 90], ln: [278, 368, 360], lf: [-6, -6, -12], at: {j: 'wristN', x: 0, y: HW}};
  def('kick-up', {title: 'Kick-up och utgång', props: [FLOOR], key: 2, frames: [
    {p: kick, hold: 350, move: 750, ease: 'snap', cue: 'Lunga, händerna i golvet. Bakre benet rakt.'},
    {p: swing, hold: 0, move: 550, cue: 'Sparka upp bakre benet, det främre följer.'},
    {p: handstand({legs: [360, 360, 354], far: [-1, -1, -7]}), hold: 1300, move: 700, cue: 'Samla benen. Kan du inte stanna: kliv ner eller vrid ut åt sidan.', focus: ['core']},
    {p: swing, hold: 0, move: 650, cue: 'Kliv ner ett ben i taget.'},
  ]});
  const a = handstand({sway: 1.4}), b = handstand({sway: -1.4});
  def('handstand', {title: 'Fristående handstand', props: [FLOOR], key: 0, frames: [
    {p: a, hold: 200, move: 1500, cue: 'Tryck upp golvet. Axlarna mot öronen.', focus: ['shoulders']},
    {p: b, hold: 200, move: 1500, cue: 'Balansera med fingrarna och handlovarna.', focus: ['hands']},
  ]});
}

// =====================================================================
// HANDSTAND PUSH-UP
// The press is an overhead press upside down: the head travels towards the fingertips
// (past the hands) while the elbows point back towards the chest side / the feet, and the
// forearms stay close to vertical. Wall work is done chest-to-wall (wall on the chest side)
// so the body can stay straight instead of arching.
// =====================================================================
// Grid search for two angles that put a joint on a target.
function seek(make, [a0, a1], [b0, b1], j, target) {
  let best = null;
  for (let pass = 0, sa = (a1 - a0) / 24, sb = (b1 - b0) / 24; pass < 3; pass++, sa /= 8, sb /= 8) {
    const ca = best ? best[0] : (a0 + a1) / 2, cb = best ? best[1] : (b0 + b1) / 2;
    for (let i = -12; i <= 12; i++) for (let k = -12; k <= 12; k++) {
      const a = ca + i * sa, b = cb + k * sb, J = joint(make(a, b), j), d = Math.hypot(J[0] - target[0], J[1] - target[1]);
      if (!best || d < best[2]) best = [a, b, d];
    }
  }
  return best;
}
{
  const pike = (t, th, hx, toe = 0, toeY = 0, hy = HW) => ({t, n: t - 6, ln: [th, th, th - 70], lf: [th + 1, th + 1, th - 69], at: {j: 'toeN', x: toe, y: toeY},
    ik: {an: {x: hx, y: hy, b: 1, h: 90}, af: {x: hx - 2, y: hy, b: 1, h: 90}}});
  // Top: arms in line with the torso (inverted V).
  const T0 = 140, armTip = th => { const S = joint(pike(T0, th, 0), 'shoulder'); return S[1] - Math.cos(T0 * Math.PI / 180) * 53.6; };
  let lo = 190, hi = 262; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if ((armTip(m) - HW) * (armTip(lo) - HW) > 0) lo = m; else hi = m; }
  const pth = (lo + hi) / 2, S0 = joint(pike(T0, pth, 0), 'shoulder'), hx = S0[0] + Math.sin(T0 * Math.PI / 180) * 53.6;
  // Bottom: shoulders past the hands, forearms vertical, head on the floor ahead of the fingers.
  const [bt, bth] = seek((t, th) => pike(t, th, hx), [128, 192], [pth - 20, pth + 40], 'shoulder', [hx - 2, -38]);
  def('pike-push-up', {title: 'Pike push-up', props: [FLOOR], key: 1, ghost: [0], frames: [
    {p: pike(T0, pth, hx), hold: 400, move: 1300, cue: 'Höften högt, armar och bål i linje: ett upp-och-ner V.'},
    {p: pike(bt, bth, hx), hold: 250, move: 1100, cue: 'Huvudet ner strax framför händerna. Armbågarna bakåt mot höften.', focus: ['arms', 'shoulders']},
  ]});
  const BOX = 48, ep = (t, th, x) => pike(t, th, x, -40, -BOX);
  const [et, eth] = seek((t, th) => ep(t, th, 0), [150, 200], [215, 300], 'shoulder', [30, HW - 53.4]);
  const ex = joint(ep(et, eth, 0), 'shoulder')[0] + 2;
  const [ebt, ebth] = seek((t, th) => ep(t, th, ex), [150, 200], [205, 300], 'shoulder', [ex + 2, -34]);
  def('elevated-pike-push-up', {title: 'Upphöjd pike push-up', props: [FLOOR, {k: 'box', x: -64, w: 46, h: BOX}], key: 1, ghost: [0], frames: [
    {p: ep(et, eth, ex), hold: 400, move: 1300, cue: 'Fötterna på en låda, höften nästan rakt över axlarna.'},
    {p: ep(ebt, ebth, ex), hold: 250, move: 1100, cue: 'Huvudet fram förbi fingertopparna. Armbågarna bakåt.', focus: ['arms', 'shoulders']},
  ]});
  // Chest-to-wall: wall on the left (chest side), fingers point away from it.
  const wallHS = (sx, sy, t, legs, wy = HW) => ({t, n: t + 4, ln: legs, lf: legs.map(v => v + 1), at: {j: 'shoulder', x: sx, y: sy},
    ik: {an: {x: 0, y: wy, b: 1, h: 90}, af: {x: -2, y: wy, b: 1, h: 90}}});
  const legsTo = (sx, sy, t, wx) => { // legs straight, toes resting on the wall
    const make = a => wallHS(sx, sy, t, [a, a, a - 6]);
    const a = fit(make, -40, 10, 'toeN', 0, wx);
    return make(a);
  };
  const up = wallHS(1, HW - 53.6, 178, [-2, -2, -8]);
  const W = joint(up, 'toeN')[0] - 3, WALL = {k: 'wall', x: W, side: 'left', top: -270};
  const down = legsTo(25, -30, 172, W + 2);
  def('wall-hspu-negative', {title: 'Negativ headstand push-up mot vägg', props: [FLOOR, {k: 'mat', x: 0, w: 50}, WALL], key: 0, frames: [
    {p: up, hold: 500, move: 3600, ease: 'lin', cue: 'Handstand med magen mot väggen.'},
    {p: down, hold: 600, move: 900, cue: 'Sänk huvudet till mattan på 3–5 s, framför fingertopparna.', focus: ['arms']},
  ]});
  def('wall-hspu-head', {title: 'Headstand push-up mot vägg', props: [FLOOR, {k: 'mat', x: 0, w: 50}, WALL], key: 1, ghost: [0], frames: [
    {p: up, hold: 400, move: 1500, cue: 'Raka armar, tårna mot väggen.'},
    {p: down, hold: 250, move: 1300, cue: 'Huvudet lätt i mattan framför händerna. Tryck upp.', focus: ['arms', 'shoulders']},
  ]});
  const PY = -18, pwy = PY - 3.5;
  const dUp = wallHS(1, pwy - 53.6, 178, [-2, -2, -8], pwy);
  const W2 = joint(dUp, 'toeN')[0] - 3;
  const dDown = (() => { const make = a => wallHS(25, -44, 172, [a, a, a - 6], pwy); return make(fit(make, -40, 10, 'toeN', 0, W2 + 2)); })();
  def('wall-hspu-deficit', {title: 'Wall HSPU, full rörelsebana', props: [FLOOR, {k: 'para', x: 0, y: PY}, {k: 'wall', x: W2, side: 'left', top: -280}], key: 1, ghost: [0], frames: [
    {p: dUp, hold: 400, move: 1600, cue: 'Händerna på parallettes, magen mot väggen.'},
    {p: dDown, hold: 250, move: 1400, cue: 'Huvudet under händernas nivå. Full rörelsebana.', focus: ['arms', 'shoulders']},
  ]});
  // Freestanding: the legs counter-balance towards the chest side as the head moves forward.
  const freeHS = (sx, sy, wy) => {
    const make = b => ({t: 180 - b * .4, n: 184 - b * .4, ln: [-b, -b, -b - 6], lf: [-b + 1, -b + 1, -b - 5], at: {j: 'shoulder', x: sx, y: sy},
      ik: {an: {x: 0, y: wy, b: 1, h: 90}, af: {x: -2, y: wy, b: 1, h: 90}}});
    return make(balance(make, -40, 40, 0));
  };
  def('free-hspu-head', {title: 'Fristående headstand push-up', props: [FLOOR, {k: 'mat', x: 0, w: 50}], key: 1, ghost: [0], frames: [
    {p: freeHS(1, HW - 53.6, HW), hold: 400, move: 1600, cue: 'Fristående handstand.'},
    {p: freeHS(25, -30, HW), hold: 250, move: 1400, cue: 'Huvudet framåt, benen balanserar bakåt. Tryck upp.', focus: ['arms', 'core']},
  ]});
  def('free-hspu', {title: 'Fristående handstand push-up', props: [FLOOR, {k: 'para', x: 0, y: PY}], key: 1, ghost: [0], frames: [
    {p: freeHS(1, pwy - 53.6, pwy), hold: 400, move: 1700, cue: 'Fristående handstand på parallettes.'},
    {p: freeHS(25, -44, pwy), hold: 250, move: 1500, cue: 'Full rörelsebana utan vägg. Linjen tillbaka i toppen.', focus: ['arms', 'core']},
  ]});
}

// =====================================================================
// ONE-ARM HANDSTAND (front view)
// =====================================================================
{
  // Front view, inverted: the near side is the viewer's left. Hands point towards the
  // viewer and are drawn short.
  const base = (legsN, legsF, extra = {}) => ({front: 1, t: 180, n: 180, sw: 17, hw: 9, len: {hand: .35}, an: [180, 180, 180], af: [180, 180, 180], ln: legsN, lf: legsF, at: {j: 'wristN', x: 0, y: HW}, ...extra});
  const strad = (d = 38) => [[-d, -d, -d - 4], [d, d, d + 4]];
  const [sN, sF] = strad();
  const hs = base(sN, sF);
  def('straddle-handstand', {title: 'Straddle handstand', view: 'front', props: [FLOOR], key: 0, frames: [
    {p: rot(hs, .8), hold: 300, move: 1600, cue: 'Benen brett isär, höften rakt över axlarna.', focus: ['core']},
    {p: rot(hs, -.8), hold: 300, move: 1600, cue: 'Raka armar, tryck jämnt i båda händerna.'},
  ]});
  // Weight shifted onto the near (left) hand: the support arm stays vertical, the hips and
  // legs move over that hand until the centre of mass is above it. The free arm's angle is
  // solved so its fingertips just reach the floor (or the block).
  const shifted = (floorY, {legs = strad(), arm = null, lift = false, spread = 0} = {}) => {
    const withArm = (k, phi) => {
      const p = base(legs[0].map(v => v - k), legs[1].map(v => v - k), {t: 180 - k, n: 180 - k});
      p.an = [180 - k * .35, 180 - k * .35, 180];
      p.af = lift ? arm : [phi, phi, phi];
      return p;
    };
    const solveArm = k => lift || floorY == null ? 180 : fit(phi => withArm(k, phi), 180, 180 - 60 - spread, 'handF', 1, floorY);
    const k = balance(k => withArm(k, solveArm(k)), -30, 30, 0);
    return withArm(k, solveArm(k));
  };
  const span = 34 + 3;
  def('weight-shift', {title: 'Viktförflyttning i straddle', view: 'front', props: [FLOOR], key: 1, frames: [
    {p: base(sN, sF, {an: [180, 180, 180], af: [180, 180, 180]}), hold: 300, move: 1300, cue: 'Straddle handstand.'},
    {p: shifted(-1), hold: 900, move: 1300, cue: 'Flytta axel och höft över ena handen. Den andra blir lätt.', focus: ['shoulders']},
  ]});
  const BLK = 22;
  const onBlock = shifted(-BLK - 1), bx = joint(onBlock, 'handF')[0];
  def('block-oahs', {title: 'Enarms-handstand med block', view: 'front', props: [FLOOR, {k: 'box', x: bx - 9, w: 22, h: BLK}], key: 0, frames: [
    {p: onBlock, hold: 2200, move: 1000, cue: 'Fria handen på ett block, lätt tryck. Stödarmen lodrät.', focus: ['shoulders'], timer: true},
    {p: onBlock, hold: 500, move: 1000, cue: 'Låt blocket ta allt mindre vikt.'},
  ]});
  def('fingertip-oahs', {title: 'Fingertoppsstöd', view: 'front', props: [FLOOR], key: 0, frames: [
    {p: shifted(-.5), hold: 2200, move: 1000, cue: 'Bara fingertopparna i golvet, långt ut. Nästan ingen vikt.', focus: ['hands'], timer: true},
    {p: shifted(-.5), hold: 500, move: 1000, cue: 'Stödhanden gör jobbet.'},
  ]});
  const free = shifted(null, {lift: true, arm: [102, 102, 102]});
  def('oahs-lift', {title: 'Lyft från fingertoppar', view: 'front', props: [FLOOR], key: 1, frames: [
    {p: shifted(-.5), hold: 600, move: 900, cue: 'Fingertoppsstöd.'},
    {p: free, hold: 1400, move: 900, cue: 'Lyft handen 1–3 s. Tillbaka innan du tappar linjen.', focus: ['hands']},
  ]});
  def('oahs-straddle', {title: 'Enarms-handstand, straddle', view: 'front', props: [FLOOR], key: 0, frames: [
    {p: free, hold: 1300, move: 1400, cue: 'Fria armen ut åt sidan. Höften förskjuten över handen.', focus: ['core'], timer: true},
    {p: rot(free, .7), hold: 400, move: 1400, cue: 'Små korrigeringar i fingrar och handled.', focus: ['hands']},
  ]});
  const together = shifted(null, {lift: true, arm: [100, 100, 100], legs: strad(6)});
  def('oahs', {title: 'Enarms-handstand', view: 'front', props: [FLOOR], key: 0, frames: [
    {p: together, hold: 1600, move: 1400, cue: 'Benen ihop. Hela kroppen staplad över en hand.', focus: ['core'], timer: true},
    {p: rot(together, .6), hold: 400, move: 1400, cue: 'Andas. Balansera med handen, inte med höften.', focus: ['hands']},
  ]});
}

// =====================================================================
// MUSCLE-UP
// =====================================================================
{
  const sw = (a, t, legs) => ({t, n: t, an: [a, a, a + 14], af: [a, a, a + 14], ln: legs, lf: legs.map(v => v + 2), at: {j: 'wristN', x: 0, y: GY}});
  def('kip-swing', {title: 'Kip-sving', props: [BAR], key: 0, frames: [
    {p: sw(-14, -16, [160, 168, 160]), hold: 120, move: 900, cue: 'Hollow framför stången: fötterna fram, bröstet in.', focus: ['core']},
    {p: sw(14, 18, [204, 204, 196]), hold: 120, move: 900, cue: 'Arch bakom stången: bröstet igenom armarna.', focus: ['core']},
  ]});
  const MU = {
    hang: hang(-2, GY + 53.6, {t: 8, legs: [196, 198, 190]}),
    drive: hang(-8, GY + 50, {t: -16, legs: [150, 166, 156]}),
    pull: hang(-19, GY - 7, {t: -30, n: -36, legs: [146, 162, 152]}),
    turn: hang(-9, GY - 17, {t: 32, n: 36, legs: [176, 186, 178], wx: 4, wy: GY - 3, hand: 60}),
    dip: hang(9, GY - 26, {t: 30, n: 30, legs: [162, 172, 164], wx: 1, wy: BY - 4, hand: 92}),
    top: hang(5, BY - 4 - 53.6, {t: 10, n: 10, legs: [168, 176, 168], wx: 1, wy: BY - 4, hand: 92}),
  };
  def('explosive-pull-up', {title: 'Explosiv pull-up', props: [BAR], key: 1, ghost: [0], frames: [
    {p: hang(-3, GY + 53.4), hold: 500, move: 650, ease: 'snap', cue: 'Från raka armar: dra så snabbt du kan.'},
    {p: MU.pull, hold: 300, move: 1300, cue: 'Stången till nedre bröstet eller magen. Sänk kontrollerat.', focus: ['arms']},
  ]});
  def('straight-bar-dip', {title: 'Straight bar dip', props: [BAR], key: 1, ghost: [0], frames: [
    {p: MU.top, hold: 450, move: 1200, cue: 'Support ovanpå stången, lätt framåtlutad.'},
    {p: MU.dip, hold: 250, move: 1000, cue: 'Sänk bröstet mot stången, armbågarna bakåt. Tryck upp.', focus: ['arms']},
  ]});
  // Low bar transition drill: feet stay on the floor at the start.
  const LB = -150, lgy = LB + 5;
  const low = (sx, sy, t, legs, wy, hand, feet) => {
    const p = {t, n: t, ln: legs, lf: legs.map(v => v + 2), at: {j: 'shoulder', x: sx, y: sy}, ik: {an: {x: 0, y: wy, b: 1, h: hand}, af: {x: -2, y: wy, b: 1, h: hand}}};
    if (feet) { p.ik.ln = {x: feet, y: -7, b: -1, f: 118}; p.ik.lf = {x: feet - 2, y: -7, b: -1, f: 119}; }
    return p;
  };
  def('low-bar-transition', {title: 'Transition på låg stång', props: [FLOOR, {k: 'bar', x: 0, y: LB}], key: 2, frames: [
    {p: low(-14, lgy + 34, -14, [176, 230, 118], lgy, 24, 8), hold: 400, move: 650, ease: 'snap', cue: 'Stå under en låg stång. Hoppa och dra.'},
    {p: low(-16, LB - 6, 30, [176, 230, 200], LB + 1, 60, null), hold: 0, move: 500, cue: 'Luta bröstet över stången, handlederna rullar över.'},
    {p: low(9, LB - 26, 30, [170, 230, 200], LB - 4, 92, null), hold: 200, move: 800, cue: 'Tryck ur dippen.', focus: ['arms']},
    {p: low(5, LB - 4 - 53.6, 10, [176, 186, 178], LB - 4, 92, null), hold: 700, move: 700, cue: 'Raka armar ovanpå stången.'},
    {p: low(9, LB - 26, 30, [170, 230, 200], LB - 4, 92, null), hold: 0, move: 600, cue: 'Sänk dig tillbaka genom dippen och kliv ner.'},
    {p: low(-16, LB - 6, 30, [176, 230, 200], LB + 1, 60, null), hold: 0, move: 700, cue: 'Sänk dig tillbaka genom dippen och kliv ner.'},
  ]});
  def('mu-negative', {title: 'Negativ muscle-up', props: [BAR], key: 0, frames: [
    {p: MU.top, hold: 500, move: 1400, cue: 'Starta i support ovanpå stången.'},
    {p: MU.dip, hold: 0, move: 1300, ease: 'lin', cue: 'Sänk dig kontrollerat in i dippen.'},
    {p: MU.turn, hold: 0, move: 1300, ease: 'lin', cue: 'Luta dig bakåt genom övergången, långsamt.', focus: ['arms']},
    {p: MU.pull, hold: 0, move: 1400, cue: 'Sänk till häng med raka armar.'},
    {p: MU.hang, hold: 700, move: 0, cue: 'Hoppa upp till support och gör om.'},
  ]});
  const muFrames = (k = 1) => [
    {p: hang(-4, GY + 53.6, {t: -14 * k, legs: [180 - 18 * k, 182, 174]}), hold: 250, move: 650, cue: k ? 'Kip-sving: hollow fram, arch bak.' : 'Raka armar, helt stilla.'},
    ...(k ? [{p: MU.hang, hold: 0, move: 500, cue: 'Från arch: sparka höften framåt.'}] : []),
    {p: MU.drive, hold: 0, move: 450, ease: 'in', cue: k ? 'Höftkick och explosivt drag.' : 'Explosivt drag, ingen sving.'},
    {p: MU.pull, hold: 0, move: 380, ease: 'out', cue: 'Dra stången mot magen, lite bakom stången.', focus: ['arms']},
    {p: MU.turn, hold: 0, move: 380, cue: 'Snabb övergång: bröstet över stången.'},
    {p: MU.dip, hold: 120, move: 700, cue: 'Tryck ur dippen.', focus: ['arms']},
    {p: MU.top, hold: 900, move: 1500, cue: 'Raka armar ovanpå stången. Sänk kontrollerat.'},
    {p: MU.pull, hold: 0, move: 900, cue: 'Tillbaka till häng.'},
  ];
  def('kipping-muscle-up', {title: 'Kipping muscle-up', props: [BAR], key: 5, frames: muFrames(1)});
  def('muscle-up', {title: 'Muscle-up', props: [BAR], key: 5, frames: muFrames(.6)});
  def('strict-muscle-up', {title: 'Strikt muscle-up', props: [BAR], key: 4, frames: muFrames(0)});
}

// =====================================================================
// FRONT LEVER
// =====================================================================
{
  const T = -90;
  const hangP = {t: 0, an: [0, 0, 12], af: [0, 0, 12], ln: [178, 180, 170], at: {j: 'wristN', x: 0, y: GY}};
  const strad = {thF: .82, shF: .82, foot: .9};
  const L = {
    tuck: barStatic(T, tuck(T)),
    adv: barStatic(T, advTuck(T)),
    straddle: barStatic(T, [92, 92, 100], [86, 86, 94], {len: strad}),
    one: barStatic(T, [90, 90, 98], advTuck(T)),
    full: barStatic(T, [90, 90, 98]),
  };
  const fl = (id, title, pose, cue, prev, prevCue) => def(id, {title, props: [BAR], key: 1, frames: [
    {p: prev, hold: 500, move: 1500, cue: prevCue},
    {p: pose, hold: 2600, move: 1400, cue, focus: ['core', 'arms'], timer: true},
  ]});
  fl('front-lever-tuck', 'Tuck front lever', L.tuck, 'Raka armar. Pressa stången mot höfterna, rundad rygg.', {...hangP, ln: tuck(0)}, 'Från häng: skulderbladen ner, knäna mot bröstet.');
  fl('front-lever-adv', 'Advanced tuck front lever', L.adv, 'Platt rygg, höften i 90°. Kroppen vågrät.', L.tuck, 'Från tuck: platta till ryggen.');
  fl('front-lever-straddle', 'Straddle front lever', L.straddle, 'Raka ben brett isär. Höften i linje med axlarna.', L.adv, 'Från advanced tuck: sträck ut benen brett.');
  fl('front-lever-one', 'Enbens front lever', L.one, 'Ett ben rakt, ett i tuck. Byt ben varje set.', L.adv, 'Från advanced tuck.');
  fl('front-lever', 'Front lever', L.full, 'Hela kroppen vågrät. Spänn säte och mage.', hangP, 'Från häng: raka armar hela vägen.');
}

// =====================================================================
// BACK LEVER (requires German hang mobility)
// =====================================================================
{
  const T = 90;
  const inv = {t: 180, n: 180, an: [0, 0, 10], af: [0, 0, 10], ln: tuck(180), lf: tuck(180).map(v => v + 1), at: {j: 'wristN', x: 0, y: GY}};
  const strad = {thF: .82, shF: .82, foot: .9};
  const L = {
    tuck: barStatic(T, tuck(T)),
    adv: barStatic(T, advTuck(T)),
    straddle: barStatic(T, [-88, -88, -96], [-94, -94, -102], {len: strad}),
    one: barStatic(T, [-90, -90, -98], advTuck(T).map(v => v - 360)),
    full: barStatic(T, [-90, -90, -98]),
  };
  const bl = (id, title, pose, cue, from = inv, fromCue = 'Från inverterat häng (skin the cat).') => def(id, {title, props: [{k: 'rings', x: 0, y: BY + 2}], key: 1, frames: [
    {p: from, hold: 500, move: 1500, cue: fromCue},
    {p: pose, hold: 2600, move: 1400, cue, focus: ['core', 'arms'], timer: true},
  ]});
  bl('back-lever-tuck', 'Tuck back lever', L.tuck, 'Sänk till vågrätt. Raka armar, knäna mot bröstet.');
  bl('back-lever-adv', 'Advanced tuck back lever', L.adv, 'Platt rygg, höften i 90°.');
  const invStraight = {...inv, ln: [0, 0, -6], lf: [1, 1, -5]};
  bl('back-lever-straddle', 'Straddle back lever', L.straddle, 'Raka ben brett isär. Spänn sätet.', invStraight, 'Från inverterat häng med raka ben.');
  bl('back-lever-one', 'Enbens back lever', L.one, 'Ett ben rakt, ett i tuck.', invStraight, 'Från inverterat häng med raka ben.');
  bl('back-lever', 'Back lever', L.full, 'Hela kroppen vågrät, ansiktet mot golvet.', {...inv, ln: [0, 0, -6], lf: [1, 1, -5]}, 'Från inverterat häng med raka ben.');
}

// =====================================================================
// PLANCHE
// =====================================================================
{
  // Planche lean: plank on straight arms, shoulders ahead of the hands.
  const top = sY(e => plank(e, {hand: 270}), 4, 60, HW - 52.5), hx = joint(plank(top), 'shoulder')[0];
  const lean = reach(e => plank(e, {toe: 20, hand: 270}), 2, 60, [hx, HW]);
  def('planche-lean', {title: 'Planche lean', props: [FLOOR], key: 1, frames: [
    {p: plank(top, {hx, hand: 270}), hold: 500, move: 1500, cue: 'Planka på raka armar, fingrarna bakåt eller åt sidan.'},
    {p: plank(lean, {hx, toe: 20, hand: 270}), hold: 2400, move: 1300, cue: 'Luta axlarna långt framför händerna. Skjut ifrån golvet.', focus: ['shoulders'], timer: true},
  ]});
  // Frog stand: knees rest on bent elbows, body tipped forward until the feet float.
  // Forearms vertical, upper arms angled back, knees resting just above the elbows.
  const frog = {t: 120, n: 140, an: [225, 180, 90], af: [226, 181, 90], ln: [146, 290, 280], lf: [147, 291, 281], at: {j: 'wristN', x: 0, y: HW}};
  const fs = balanced(frog, -30, 30);
  const fsGround = (() => { const p = structuredClone(fs); p.t -= 14; p.n -= 14; return p; })();
  def('frog-stand', {title: 'Frog stand', props: [FLOOR], key: 1, frames: [
    {p: rot(fs, -10), hold: 400, move: 1300, cue: 'Knäna mot armbågarnas utsida.'},
    {p: fs, hold: 2200, move: 1200, cue: 'Luta fram tills fötterna lyfter. Titta framåt.', focus: ['shoulders'], timer: true},
  ]});
  const sa = balanced({t: 86, n: 104, an: [200, 200, 270], af: [201, 201, 270], ln: [102, 247, 237], lf: [103, 248, 238], at: {j: 'wristN', x: 0, y: HW}}, -30, 30);
  def('straight-arm-frog', {title: 'Rakarmad frog stand', props: [FLOOR], key: 1, frames: [
    {p: rot(sa, -9), hold: 400, move: 1300, cue: 'Raka armar, knäna mot överarmarnas utsida.'},
    {p: sa, hold: 2200, move: 1200, cue: 'Luta fram och lyft fötterna. Armbågarna låsta.', focus: ['shoulders', 'arms'], timer: true},
  ]});
  const strad = {thF: .82, shF: .82, foot: .9};
  const P = {
    tuck: planche(112, tuck(112)),
    adv: planche(92, advTuck(92)),
    straddle: planche(90, [272, 272, 264], [266, 266, 258], {len: strad}),
    one: planche(91, [271, 271, 263], advTuck(91)),
    full: planche(90, [270, 270, 262], [271, 271, 263], {n: 98}),
  };
  const pl = (id, title, pose, cue) => def(id, {title, props: [FLOOR], key: 0, frames: [
    {p: pose, hold: 2600, move: 1000, cue, focus: ['shoulders', 'core'], timer: true},
    {p: hold(pose, 1.012), hold: 400, move: 1000, cue: 'Låsta armbågar, protraherade skulderblad.'},
  ]});
  pl('planche-tuck', 'Tuck planche', P.tuck, 'Luta axlarna framför händerna. Rundad rygg, knäna under bröstet.');
  pl('planche-adv', 'Advanced tuck planche', P.adv, 'Platt rygg, höften i axelhöjd.');
  pl('planche-straddle', 'Straddle planche', P.straddle, 'Raka ben brett isär, kroppen vågrät.');
  pl('planche-one', 'Enbens planche', P.one, 'Ett ben rakt bakåt, det andra i tuck.');
  pl('planche', 'Planche', P.full, 'Hela kroppen vågrät, axlarna långt framför händerna.');
}

// =====================================================================
// HUMAN FLAG (front view)
// =====================================================================
{
  const POLE = {k: 'pole', x: -4, top: -270};
  const flag = (t, legsN, legsF, sx, sy, {top = -222, bot = -122, len} = {}) => ({front: 1, t, n: t, sw: 17, hw: 9, len: {hand: .5, ...(len || {})}, ln: legsN, lf: legsF, at: {j: 'shoulder', x: sx, y: sy},
    ik: {an: {x: -1, y: top, b: -1, h: 270}, af: {x: -1, y: bot, b: 1, h: 270}}});
  // Side plank on the forearm, seen from the front.
  const sp = (lift = 0) => ({front: 1, t: 74 - lift, n: 80 - lift, sw: 17, hw: 9, len: {faN: .3, hand: .3}, an: [180, 180, 180], af: [0, 0, 0], ln: straight(74 - lift), lf: straight(74 - lift).map(v => v + 3), at: {j: 'elbowN', x: 0, y: -5}});
  def('side-plank', {title: 'Sidoplanka', view: 'front', props: [FLOOR], key: 0, frames: [
    {p: sp(0), hold: 2200, move: 900, cue: 'Armbågen under axeln. Rak linje från fot till huvud.', focus: ['core'], timer: true},
    {p: sp(2), hold: 500, move: 900, cue: 'Tryck höften upp mot taket.'},
  ]});
  def('vertical-flag', {title: 'Vertikal flagga', view: 'front', props: [FLOOR, POLE], key: 0, frames: [
    {p: flag(194, [6, 6, 0], [10, 10, 4], 16, -158, {top: -206, bot: -126}), hold: 2400, move: 1200, cue: 'Upp och ner längs stolpen. Nedre armen trycker rak.', focus: ['arms'], timer: true},
    {p: flag(196, [8, 8, 2], [12, 12, 6], 17, -159, {top: -206, bot: -126}), hold: 500, move: 1200, cue: 'Övre armen drar. Spänd mage.'},
  ]});
  const T = 270;
  const tuckLegs = [[90, 180, 180], [91, 182, 182]];
  const fl = {
    tuck: flag(T, tuckLegs[0], tuckLegs[1], 42.7, -172, {len: {thN: .28, thF: .28, shN: .85, shF: .85}}),
    adv: flag(T, tuckLegs[0], tuckLegs[1], 42.7, -172, {len: {thN: .75, thF: .75, shN: .85, shF: .85}}),
    straddle: flag(T, [66, 66, 66], [114, 114, 114], 42.7, -172),
    full: flag(T, [88, 88, 88], [92, 92, 92], 42.7, -172),
  };
  const vert = flag(194, [6, 6, 0], [10, 10, 4], 16, -158, {top: -206, bot: -126});
  const f = (id, title, pose, cue) => def(id, {title, view: 'front', props: [FLOOR, POLE], key: 1, frames: [
    {p: vert, hold: 500, move: 1700, cue: 'Från vertikal flagga: sänk kontrollerat.'},
    {p: pose, hold: 2400, move: 1500, cue, focus: ['core', 'arms'], timer: true},
  ]});
  f('tuck-flag', 'Tuck flag', fl.tuck, 'Knäna indragna, höften i höjd med axlarna.');
  f('adv-tuck-flag', 'Advanced tuck flag', fl.adv, 'Öppna höften, knäna fortfarande böjda.');
  f('straddle-flag', 'Straddle flag', fl.straddle, 'Raka ben brett isär. Kroppen vågrät.');
  f('human-flag', 'Human flag', fl.full, 'Benen ihop, kroppen vågrät. Nedre armen trycker, övre drar.');
}

export const allMoves = () => Object.values(moves);
