// Human figure for exercise animations.
//
// A 2D skeleton with fixed bone lengths. Each exercise (src/figure-poses.js) gives two key poses as a
// pelvis position, a torso lean and targets for hands and feet. Elbows and knees are solved with
// two-bone inverse kinematics, so limbs never stretch, knees bend forward, elbows backward, and
// planted feet stay planted. In-between frames are solved again (not blended), and the body is drawn
// with anatomical shapes: tapered thighs and calves, biceps and triceps, chest and back, clothes and
// shoes. The worked muscle group is highlighted.
import {poses as specs, aliases} from './figure-poses.js';

const R = Math.PI / 180;
// Angles: 0 = pointing down, 90 = forward (screen right), 180 = up, 270 = backward.
const dir = a => [Math.sin(a * R), Math.cos(a * R)];
const angleOf = v => Math.atan2(v[0], v[1]) / R;
const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
const len = v => Math.hypot(v[0], v[1]), norm = v => { const l = len(v) || 1; return [v[0] / l, v[1] / l]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1], rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
const lerp = (a, b, k) => a + (b - a) * k, lerpV = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const f1 = n => Math.round(n * 10) / 10, pt = p => f1(p[0]) + ' ' + f1(p[1]);

export const bones = {torso: 40, neck: 6, uarm: 25, farm: 22, hand: 8, thigh: 37, shin: 35, foot: 13, shoulderW: 13, hipW: 7};
export const GROUND = 150;

// Two-bone IK: joint between root a and target t, on the side the preference vector points to.
const turn = (a, b, c) => Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
function ik(a, t, l1, l2, pref, bend) {
  let d = sub(t, a), dist = len(d);
  const max = l1 + l2 - 0.01, min = Math.abs(l1 - l2) + 0.01, u = norm(d);
  if (dist > max) { dist = max; t = add(a, mul(u, max)); } else if (dist < min) { dist = min; t = add(a, mul(u, min)); }
  const ang = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist))));
  const j1 = add(a, mul(rot(u, ang), l1)), j2 = add(a, mul(rot(u, -ang), l1));
  // A fixed bend direction keeps the joint on one side for the whole movement.
  if (bend) return [turn(a, t, j1) === bend ? j1 : j2, t];
  return [dot(sub(j1, a), pref) >= dot(sub(j2, a), pref) ? j1 : j2, t];
}

// A limb target: absolute point, relative to the root joint (world axes), relative in the body frame,
// or joint angles. Body frame: [along the torso towards the head, forward/anterior].
function resolve(spec, root, frame) {
  if (spec.w) return spec.w;
  if (spec.r) return add(root, spec.r);
  if (spec.l) return add(root, add(mul(frame.u, spec.l[0]), mul(frame.n, spec.l[1])));
  return null;
}

// Interpolates two key poses: numbers and points blend, limb targets of the same kind blend in their
// own frame (so a bar held on the back follows the shoulders), other kinds blend as world points.
function blend(a, b, k, solveA, solveB) {
  const out = {p: lerpV(a.p, b.p, k), t: lerp(a.t, b.t, k), h: lerp(a.h || 0, b.h || 0, k), palms: k < .5 ? a.palms : b.palms, limbs: {}};
  for (const key of Object.keys(a.limbs)) {
    const x = a.limbs[key], y = b.limbs[key] || x, z = {...x};
    const kind = s => s.w ? 'w' : s.r ? 'r' : s.l ? 'l' : 'angle';
    if (kind(x) === kind(y)) {
      for (const f of ['w', 'r', 'l']) if (x[f]) z[f] = lerpV(x[f], y[f], k);
      for (const f of ['a1', 'a2', 'end']) if (x[f] != null) z[f] = lerp(x[f], y[f] ?? x[f], k);
    } else { delete z.r; delete z.l; delete z.a1; delete z.a2; z.w = lerpV(solveA[key].end, solveB[key].end, k); }
    if (x.pref || y.pref) z.pref = lerpV(x.pref || y.pref, y.pref || x.pref, k);
    if (x.foot != null) z.foot = lerp(x.foot, y.foot ?? x.foot, k);
    if (x.palm || y.palm) z.palm = k < .5 ? x.palm : y.palm;
    out.limbs[key] = z;
  }
  return out;
}

// Solves one pose into joint positions.
function solve(pose, view, bends = {}) {
  const u = dir(180 - pose.t), n = dir(90 - pose.t), front = view === 'front';
  const P = pose.p, S = add(P, mul(u, bones.torso)), frame = {u, n};
  const neck = add(S, mul(u, bones.neck)), headAxis = dir(180 - pose.t - pose.h);
  const out = {view, P, S, u, n, neck, head: add(neck, mul(headAxis, 1)), headAxis, headFwd: dir(90 - pose.t - pose.h), limbs: {}};
  for (const [key, spec] of Object.entries(pose.limbs)) {
    const leg = key[0] === 'l', side = key[1] === 'n' ? 1 : -1;
    const lat = mul(n, side);
    const root = front ? add(leg ? P : S, mul(lat, leg ? bones.hipW : bones.shoulderW)) : (leg ? P : S);
    const [l1, l2] = leg ? [bones.thigh, bones.shin] : [bones.uarm, bones.farm];
    let mid, end;
    const target = resolve(spec, root, frame);
    if (target) {
      const pref = spec.pref ? norm(spec.pref) : front ? norm(add(lat, [0, leg ? 0.2 : 0.7])) : leg ? norm(add(n, [0.6, 0])) : norm(add(mul(n, -0.6), [0, 1]));
      [mid, end] = ik(root, target, l1, l2, pref, bends[key]);
    } else {
      mid = add(root, mul(dir(spec.a1), l1));
      end = add(mid, mul(dir(spec.a1 + (leg ? -spec.a2 : spec.a2)), l2));
    }
    const lower = angleOf(sub(end, mid));
    let tipAngle = leg ? (spec.foot ?? (front ? 0 : lower + 90)) : lower + (spec.hand || 0), hand = null;
    if (!leg) {
      // fist = gripping, flat = palm on the floor, open = reaching or resting, loose = running.
      const style = spec.palm || pose.palms || 'fist', onFloor = style === 'flat' && end[1] > GROUND - 10;
      if (onFloor) tipAngle = front ? side * 90 : 90;
      const d = dir(tipAngle), perp = [-d[1], d[0]];
      const toward = onFloor ? [0, 1] : front ? mul(lat, -1) : n;
      hand = {d, p: keepSide('palm' + key, perp, toward), curl: {fist: 1, loose: .72, open: .16, flat: 0}[style] ?? 1, style};
    }
    out.limbs[key] = {root, mid, end, tip: add(end, mul(dir(tipAngle), leg ? bones.foot : 14)), tipAngle, leg, side, hand};
  }
  return out;
}

// Normalises a pose spec: defaults, mirrored or copied far limbs.
function prepare(k, view) {
  const limbs = {...k.limbs};
  for (const [near, far] of [['ln', 'lf'], ['an', 'af']]) {
    if (!limbs[near] || limbs[far]) continue;
    const s = limbs[near], m = {...s};
    if (view === 'front') {
      if (s.w) m.w = [2 * k.p[0] - s.w[0], s.w[1]];
      if (s.r) m.r = [-s.r[0], s.r[1]];
      if (s.l) m.l = [s.l[0], -s.l[1]];
      if (s.a1 != null) m.a1 = -s.a1;
      if (s.a2 != null) m.a2 = -s.a2;
      if (s.pref) m.pref = [-s.pref[0], s.pref[1]];
      if (s.foot != null) m.foot = -s.foot;
    }
    limbs[far] = m;
  }
  return {p: k.p, t: k.t || 0, h: k.h || 0, palms: k.palms, limbs};
}

const ease = k => (1 - Math.cos(Math.PI * k)) / 2;
function bendSides(sa, sb) {
  const out = {};
  for (const key of Object.keys(sa.limbs)) {
    const amount = L => len(sub(L.root, L.mid)) + len(sub(L.mid, L.end)) - len(sub(L.root, L.end));
    const a = sa.limbs[key], b = sb.limbs[key] || a, L = amount(b) > amount(a) ? b : a;
    if (amount(L) > .5) out[key] = turn(L.root, L.end, L.mid);
  }
  return out;
}
function solveKeys(spec, view) {
  const A = prepare(spec.keys[0], view), B = prepare(spec.keys[1] || spec.keys[0], view);
  const bends = bendSides(solve(A, view), solve(B, view));
  return {A, B, bends, sa: solve(A, view, bends), sb: solve(B, view, bends)};
}

// ---------- shapes ----------
// A tapered limb with a muscle belly on the anterior (a) and posterior (p) side.
// While animating, MEMO keeps each shape's side from the previous frame, so a muscle belly or a palm
// never jumps to the other side when a limb passes straight.
let MEMO = null;
function keepSide(key, v, guide) {
  const prev = MEMO?.[key], s = prev ? dot(v, prev) >= 0 : dot(v, guide) >= 0, out = s ? v : mul(v, -1);
  if (MEMO) MEMO[key] = out;
  return out;
}
let limbCount = 0;
function limb(p1, p2, r1, r2, ba, bp, at, n) {
  const d = norm(sub(p2, p1)), L = len(sub(p2, p1)), f = keepSide('limb' + limbCount++, [-d[1], d[0]], n);
  const c = add(p1, mul(d, L * at)), ka = 2 * ba - (r1 + r2) / 2, kp = 2 * bp - (r1 + r2) / 2;
  const a1 = add(p1, mul(f, r1)), a2 = add(p2, mul(f, r2)), b2 = sub(p2, mul(f, r2)), b1 = sub(p1, mul(f, r1));
  const tip = add(p2, mul(d, r2)), tail = sub(p1, mul(d, r1));
  return `M${pt(a1)}Q${pt(add(c, mul(f, ka)))} ${pt(a2)}C${pt(add(a2, mul(d, r2 * .55)))} ${pt(add(tip, mul(f, r2 * .55)))} ${pt(tip)}C${pt(sub(tip, mul(f, r2 * .55)))} ${pt(add(b2, mul(d, r2 * .55)))} ${pt(b2)}Q${pt(sub(c, mul(f, kp)))} ${pt(b1)}C${pt(sub(b1, mul(d, r1 * .55)))} ${pt(sub(tail, mul(f, r1 * .55)))} ${pt(tail)}C${pt(add(tail, mul(f, r1 * .55)))} ${pt(sub(a1, mul(d, r1 * .55)))} ${pt(a1)}Z`;
}
// A smooth closed outline through points (Catmull-Rom as cubic Béziers).
function smooth(points) {
  const n = points.length, at = i => points[(i + n) % n];
  let d = `M${pt(points[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    d += `C${pt(add(p1, mul(sub(p2, p0), 1 / 6)))} ${pt(sub(p2, mul(sub(p3, p1), 1 / 6)))} ${pt(p2)}`;
  }
  return d + 'Z';
}
// A smooth open line through points.
function smoothOpen(points) {
  const n = points.length, at = i => points[Math.max(0, Math.min(n - 1, i))];
  let d = `M${pt(points[0])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    d += `C${pt(add(p1, mul(sub(p2, p0), 1 / 6)))} ${pt(sub(p2, mul(sub(p3, p1), 1 / 6)))} ${pt(p2)}`;
  }
  return d;
}
const local = (o, a, b) => list => list.map(([x, y]) => add(o, add(mul(a, x), mul(b, y))));

// Body outlines in body coordinates: [along torso (1 = shoulder line), forward]. Side view.
const torsoSide = [[-.1, -8.8], [.05, -10.6], [.3, -7.2], [.62, -9], [.88, -9.6], [1.03, -5.4], [1.12, -2], [1.12, 2.6], [.98, 7.6], [.8, 11.2], [.64, 9.8], [.45, 8.4], [.2, 8.6], [.02, 8], [-.1, 2]];
const shortsSide = [[-.13, -9.2], [.05, -11], [.24, -8.2], [.24, 8.9], [.02, 8.4], [-.13, 2.2]];
const torsoFront = [[-.08, 8.6], [.2, 9.4], [.38, 8.2], [.6, 10.8], [.8, 13.8], [.94, 15.2], [1.01, 13.6], [1.06, 10.6], [1.12, 7], [1.16, 3.6], [1.17, 0], [1.16, -3.6], [1.12, -7], [1.06, -10.6], [1.01, -13.6], [.94, -15.2], [.8, -13.8], [.6, -10.8], [.38, -8.2], [.2, -9.4], [-.08, -8.6], [-.16, 0]];
// T-shirt sleeve over the deltoid, in arm coordinates [along the upper arm from the joint, outward]: a
// rounded muscle cap over the joint that is fullest on the outside and narrows to the hem.
const sleeveFront = [[-1.8, -1], [-1.2, 2.6], [.6, 5.7], [3.2, 7.5], [6.2, 7.2], [9, 6.3], [11.6, 5.9], [12.1, 0], [11.6, -5.5], [8, -5.9], [4, -6], [.6, -5.2], [-1.4, -3.2]];
const sleeveSide = [[-2.8, 0], [-2, 4.2], [.6, 6.8], [4, 7.1], [8, 6.4], [11.6, 5.9], [12.1, 0], [11.6, -5.9], [8, -6.4], [4, -6.9], [.6, -6.6], [-2, -4]];
const deltFront = [[-1.3, -1], [-.7, 2.4], [.9, 5.1], [3.2, 6.8], [6.2, 6.4], [9.6, 4.4], [10.4, 0], [9.6, -4.4], [6, -5.2], [2.4, -5.1], [-.1, -4.2], [-1.1, -2.6]];
const shortsFront = [[-.12, 9.6], [.24, 10], [.24, -10], [-.12, -9.6], [-.2, 0]];
const muscleShapes = {
  side: {chest: [[.96, 3], [.92, 7.8], [.8, 11], [.66, 9.6], [.7, 3.4]], abs: [[.58, 8.4], [.42, 8.2], [.2, 8.4], [.2, 4], [.58, 4]], back: [[.94, -5], [.87, -9.4], [.6, -8.8], [.38, -6.8], [.6, -4], [.86, -3.6]], glutes: [[.14, -8], [.04, -10.4], [-.1, -8.6], [-.06, -3.6], [.14, -4.4]]},
  front: {chest: [[.94, .8], [.94, 12.6], [.74, 12.8], [.66, .8], [.66, -.8], [.74, -12.8], [.94, -12.6], [.94, -.8]], abs: [[.6, 5], [.22, 5.2], [.22, -5.2], [.6, -5]], back: [[.86, 13.4], [.6, 10.4], [.5, 8.6], [.7, 11]], glutes: []},
};
// Head outlines in head coordinates: [up from the top of the neck, forward]. Profile modelled on a
// human head: rounded back of the skull, forehead, brow, nose, lips, chin and jaw line.
const headSide = [[2.6, -6.6], [8.5, -7.8], [14.1, -8.8], [19.9, -7.6], [22.6, -2.9], [21.7, 6.4], [18.2, 10.8], [15.2, 12], [13.2, 12.2], [12, 11.9], [10, 13.4], [8.1, 14.5],
  [7.2, 13.9], [7, 12.8], [6.1, 12.9], [5, 13], [4.2, 12.3], [3.7, 12.6], [2.8, 12], [1.5, 12.3], [.4, 11.4], [-.4, 7.4], [-3.6, 5.8], [-7.4, 6.4], [-7.8, -5.8], [-3, -6.4]];
// Short hair: hairline at the forehead, over the crown, down to the nape, around the ear and a sideburn.
const hairSide = [[18.6, 9.4], [20.6, 5.4], [21.4, 0], [21, -5.2], [18.8, -9.4], [13, -9.8], [8.6, -8.6], [6.4, -7.2], [7.4, -6], [10.6, -6.2], [13, -3.6], [14.4, -1],
  [15.2, 1.6], [16.2, 4.8], [17.1, 7.8]];
// Top of the hair: a quiff at the front, swept back over the crown.
const hairTop = [[18, 10.5], [19.4, 11.7], [21.8, 11.1], [23.8, 8.4], [24.6, 4], [24.4, -1.2], [22.8, -6], [19.8, -9], [17.6, -8.8], [19.2, -5.6], [20.2, -1.2], [19.8, 3.2], [18.8, 6.8], [18, 8.8]];
const hairStrands = [[[23, 8.8], [23.8, 3.2], [23.2, -2.4], [21.2, -6.6]], [[21.4, 10.2], [22.6, 4.6], [22.2, -1.2], [20.4, -5.6]], [[19.8, 10.8], [21.2, 6.4], [21.2, .8], [19.8, -3.6]],
  [[17.6, -1.4], [16.6, -4.8]], [[16.6, 2.4], [15.8, -1.2]], [[15, -6.4], [12.4, -8.2]], [[11.6, -7.4], [9, -7.8]]];
// Face seen from the front: [up, sideways].
const headFront = [[1.4, 0], [2.6, 3.6], [5.4, 6.4], [9.4, 7.8], [13.6, 8.2], [17.6, 7.6], [20.6, 5], [22, 0], [20.6, -5], [17.6, -7.6], [13.6, -8.2], [9.4, -7.8], [5.4, -6.4], [2.6, -3.6]];
const hairFront = [[16.2, 8.6], [19.4, 8.6], [22.4, 7], [24.2, 2.6], [24.2, -2.6], [22.4, -7], [19.4, -8.6], [16.2, -8.6], [16.6, -7.4], [18.4, -5.6], [19, -2.2], [19.1, 1.2], [18.7, 4.6], [17.2, 7.2]];

const palette = {skin: '#e3c6ad', skinFar: '#b99c86', skinLine: '#8a6b57', shirt: '#5b6570', shirtFar: '#48515b', trim: '#4a535d', trimFar: '#3c444c', shorts: '#5b6570', shortsFar: '#48515b',
  shoe: '#eef2f4', shoeFar: '#c3cbcf', sole: '#56636b', stripe: '#e2474b', hair: '#3b2e27', hairSide: '#4d3d33', hairLine: '#6a5444', hl: '#ff7a59'};
// Which body parts light up for an exercise's muscle group.
const highlights = {'Bröst': ['chest', 'uarm'], 'Bröst & armar': ['chest', 'uarm', 'farm'], 'Ben': ['thigh', 'glutes', 'shin'], 'Rygg & ben': ['back', 'glutes', 'thigh'], 'Axlar': ['delt'], 'Balans & axlar': ['delt', 'abs'], 'Rygg': ['back', 'delt'], 'Armar': ['uarm', 'farm'], 'Bål': ['abs'], 'Mage': ['abs'], 'Grepp': ['farm', 'hand']};

// The sleeve of one arm in world coordinates. Outward points away from the body (and up when the arm is
// held straight out to the side), so the fuller outer head of the deltoid stays on the outside.
function sleeveOf(fr, L, k) {
  const ad = norm(sub(L.mid, L.root)), f = [-ad[1], ad[0]], side = fr.view === 'side';
  const guide = side ? fr.n : add(norm(sub(L.root, fr.S)), mul(fr.u, .5)), out = side ? keepSide('sleeve' + k, f, guide) : dot(f, guide) >= 0 ? f : mul(f, -1);
  return local(L.root, ad, out);
}
// Shapes of one solved frame, in drawing order. Each entry: [key, path, fill, extra attributes].
function shapes(fr, hl) {
  limbCount = 0;
  const out = [], side = fr.view === 'side', on = part => hl.includes(part);
  const segs = (k, far) => {
    const L = fr.limbs[k], skin = far ? palette.skinFar : palette.skin;
    if (L.leg) {
      out.push([k + 'thigh', limb(L.root, L.mid, 8.6, 5.6, 8.8, 8.2, .38, fr.n), skin]);
      if (on('thigh')) out.push([k + 'thighH', limb(L.root, L.mid, 8.6, 5.6, 8.8, 8.2, .38, fr.n), palette.hl, ' fill-opacity=".45"']);
      out.push([k + 'shin', limb(L.mid, L.end, 5.4, 3.4, 4.8, 6.4, .3, fr.n), skin]);
      if (on('shin')) out.push([k + 'shinH', limb(L.mid, L.end, 5.4, 3.4, 4.8, 6.4, .3, fr.n), palette.hl, ' fill-opacity=".35"']);
      const td = norm(sub(L.mid, L.root)), tf = keepSide('mLeg' + k, [-td[1], td[0]], fr.n), sd = norm(sub(L.end, L.mid));
      const tAt = (t, o) => add(add(L.root, mul(td, bones.thigh * t)), mul(tf, o)), sAt = (t, o) => add(add(L.mid, mul(sd, bones.shin * t)), mul(tf, o));
      if (!far) out.push([k + 'muscleLeg', `M${pt(tAt(.62, 4.6))}Q${pt(tAt(.84, 2.4))} ${pt(tAt(.9, -1.6))}M${pt(tAt(.96, 2.6))}Q${pt(add(L.mid, mul(tf, 4)))} ${pt(sAt(.06, 2.6))}M${pt(sAt(.12, -4.4))}Q${pt(sAt(.32, -3))} ${pt(sAt(.52, -2.2))}`, 'none', ` stroke="${palette.skinLine}" stroke-width=".6" stroke-linecap="round" stroke-opacity=".45"`]);
      const sh = add(L.root, mul(td, bones.thigh * .6));
      out.push([k + 'shorts', limb(L.root, sh, 9.8, 8.8, 9.8, 9.6, .5, fr.n), far ? palette.shortsFar : palette.shorts]);
      const sn = sneaker(L, side);
      out.push([k + 'sole', sn.sole, palette.sole]);
      out.push([k + 'shoe', sn.upper, far ? palette.shoeFar : palette.shoe, ` stroke="#8c989e" stroke-width=".7"`]);
      out.push([k + 'stripe', sn.stripe, 'none', ` stroke="${palette.stripe}" stroke-width="1.2" stroke-linecap="round"`]);
      out.push([k + 'laces', sn.laces, 'none', ' stroke="#9aa7ad" stroke-width=".6" stroke-linecap="round"']);
    } else {
      const sleeve = far ? palette.shirtFar : palette.shirt;
      out.push([k + 'uarm', limb(add(L.root, mul(norm(sub(L.mid, L.root)), 4)), L.mid, 5.9, 4.4, 6.1, 6.3, .42, fr.n), skin]);
      if (on('uarm')) out.push([k + 'uarmH', limb(add(L.root, mul(norm(sub(L.mid, L.root)), 4)), L.mid, 5.9, 4.4, 6.1, 6.3, .42, fr.n), palette.hl, ' fill-opacity=".45"']);
      out.push([k + 'farm', limb(L.mid, L.end, 4.4, 3.1, 4.9, 4.6, .28, fr.n), skin]);
      if (on('farm')) out.push([k + 'farmH', limb(L.mid, L.end, 4.4, 3.1, 4.9, 4.6, .28, fr.n), palette.hl, ' fill-opacity=".4"']);
      const hm = handModel(L);
      out.push([k + 'hand', smooth(hm.outline), on('hand') ? palette.hl : skin, on('hand') ? ' fill-opacity=".85"' : '']);
      out.push([k + 'crease', hm.creases, 'none', ` stroke="${far ? '#6f574a' : palette.skinLine}" stroke-width=".7" stroke-linecap="round" stroke-opacity=".75"`]);
      out.push([k + 'thumb', limb(hm.thumb[0], hm.thumb[1], 1.9, 1.5, 2, 2, .5, fr.n), skin]);
      // Sleeve over the deltoid. From the front its outline is drawn behind the torso (see torso()), so the
      // shoulder runs in one line from the neck over the deltoid and down the arm, without a seam.
      const ad = norm(sub(L.mid, L.root)), so = sleeveOf(fr, L, k);
      out.push([k + 'sleeve', smooth(so(side ? sleeveSide : sleeveFront)), sleeve, side ? '' : ' stroke="none"']);
      out.push([k + 'hem', smoothOpen(so([[11.4, -5.6], [12.1, 0], [11.4, 6]])), 'none', ' stroke="#00000038" stroke-width=".8" stroke-linecap="round"']);
      // From the front: a soft line where the deltoid meets the chest, down the inside of the sleeve.
      if (!side) out.push([k + 'deltEdge', smoothOpen(so([[11.2, -5.5], [7.6, -5.9], [3.6, -5.9], [1.4, -5.1]])), 'none', ' stroke="#00000026" stroke-width=".7" stroke-linecap="round"']);
      if (on('delt')) out.push([k + 'deltH', smooth(so((side ? sleeveSide.map(([a, o]) => [Math.min(a, 10.4) * .96, o * .9]) : deltFront).map(([a, o]) => [a, o * .92]))), palette.hl, ' stroke="none" fill-opacity=".55"']);
      // Muscle contours: the lower edge of the biceps and the elbow crease.
      const af = keepSide('mArm' + k, [-ad[1], ad[0]], fr.n), at = (t, o) => add(add(L.root, mul(ad, bones.uarm * t)), mul(af, o));
      out.push([k + 'muscleArm', `M${pt(at(.6, 3.6))}Q${pt(at(.86, 1.4))} ${pt(at(.9, -.6))}M${pt(at(.97, 2.6))}L${pt(at(.99, .4))}`, 'none', ` stroke="${palette.skinLine}" stroke-width=".6" stroke-linecap="round" stroke-opacity=".5"`]);
    }
  };
  const torso = () => {
    const o = local(fr.P, mul(fr.u, bones.torso), side ? fr.n : fr.n);
    if (!side) for (const k of ['af', 'an']) out.push([k + 'sleeveLine', smooth(sleeveOf(fr, fr.limbs[k], k)(sleeveFront)), 'none', ' stroke="#00000038" stroke-width="1.1"']);
    const neck = ['neck', limb(fr.S, fr.neck, side ? 4.4 : 4.7, side ? 4.2 : 4.5, side ? 4.4 : 4.7, side ? 4.4 : 4.6, .5, fr.n), palette.skin];
    if (!side) out.push(neck);
    out.push(['torso', smooth(o(side ? torsoSide : torsoFront)), palette.shirt]);
    out.push(['shorts', smooth(o(side ? shortsSide : shortsFront)), palette.shorts]);
    // T-shirt neckline seen from the front.
    if (!side) {
      out.push(['collar', smooth(o([[1.17, 5.4], [1.08, 6.2], [1.01, 3.6], [.985, 0], [1.01, -3.6], [1.08, -6.2], [1.17, -5.4], [1.2, 0]])), palette.trim]);
      out.push(['neckline', smooth(o([[1.18, 4.5], [1.1, 5], [1.035, 2.9], [1.02, 0], [1.035, -2.9], [1.1, -5], [1.18, -4.5], [1.21, 0]])), palette.skin, ' stroke="none"']);
    }
    // The Beyond Self logo on the chest: black badge, white mountain, red flag.
    const lc = add(fr.P, add(mul(fr.u, bones.torso * (side ? .78 : .8)), mul(fr.n, side ? 5.4 : -5.6))), lo = local(lc, fr.u, fr.n);
    out.push(['logo', smooth(lo([[2.1, -2.1], [2.3, 0], [2.1, 2.1], [0, 2.3], [-2.1, 2.1], [-2.3, 0], [-2.1, -2.1], [0, -2.3]])), '#0d0f11', ' stroke="#e9edef" stroke-width=".4"']);
    out.push(['logoPeak', `M${pt(lo([[-1.4, -1.6]])[0])}L${pt(lo([[1.1, 0]])[0])}L${pt(lo([[-1.4, 1.6]])[0])}Z`, '#f4f6f7']);
    out.push(['logoFlag', `M${pt(lo([[1.1, 0]])[0])}L${pt(lo([[1.9, .1]])[0])}L${pt(lo([[1.6, .8]])[0])}Z`, palette.stripe]);
    const m = muscleShapes[fr.view];
    for (const part of ['chest', 'abs', 'back', 'glutes']) if (on(part) && m[part].length) out.push([part, smooth(o(m[part])), palette.hl, ' fill-opacity=".55"']);
    if (side) out.push(neck);
  };
  const head = () => {
    const line = (pts, w = .8, color = palette.skinLine) => ['', pts.map((p, i) => (i ? 'L' : 'M') + pt(p)).join(''), 'none', ` stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`];
    const named = (key, item) => { item[0] = key; out.push(item); };
    if (side) {
      const o = local(fr.neck, fr.headAxis, fr.headFwd);
      out.push(['head', smooth(o(headSide)), palette.skin]);
      // Ear: outer rim and the inner fold.
      const ear = o([[12.4, -1.6]])[0];
      out.push(['ear', smooth(o([[13.4, .4], [12.8, -1.6], [11, -2.2], [9, -1.4], [7.6, 0], [8.2, 1.2], [10.4, 1.5], [12.4, 1.4]])), palette.skin]);
      named('earFold', line(o([[12.2, .2], [11.6, -1], [10.2, -1.1], [9.2, -.2]]), .7));
      void ear;
      out.push(['hair', smooth(o(hairSide)), palette.hairSide]);
      out.push(['hairTop', smooth(o(hairTop)), palette.hair]);
      hairStrands.forEach((st, i) => named('strand' + i, line(o(st), i < 3 ? .7 : .55, palette.hairLine)));
      // Eye, brow and lips.
      // Eye in profile: almond opening with white and iris, an upper lid, the brow above.
      out.push(['brow', smooth(o([[13.15, 11.75], [13.75, 10.7], [13.75, 8.7], [13.3, 8.6], [13.3, 10.4], [12.85, 11.5]])), palette.hair]);
      out.push(['eyeWhite', smooth(o([[12.25, 10.75], [12.05, 9.6], [11.85, 8.95], [11.55, 9.7], [11.3, 10.55], [11.8, 10.35]])), '#f3ede6', ' stroke="#8a6b57" stroke-width=".45"']);
      out.push(['iris', smooth(o([[12.15, 10.25], [11.8, 9.75], [11.4, 10.2], [11.8, 10.45]])), '#3a2b22']);
      named('lid', line(o([[12.45, 10.8], [12.25, 9.6], [11.9, 8.9]]), .7, '#4b3a30'));
      named('nostril', line(o([[7.8, 12.9], [8.3, 12.2], [7.7, 11.7]]), .6));
      named('mouth', line(o([[4.3, 12.3], [4.45, 11.2]]), .7));
      named('jaw', line(o([[.8, 8], [3.8, 4.6], [7, 2.2]]), .6));
    } else {
      const o = local(fr.neck, fr.headAxis, fr.n);
      out.push(['earR', smooth(o([[15, 8], [13.6, 9.6], [10.4, 9.4], [9.4, 8]])), palette.skin]);
      out.push(['earL', smooth(o([[15, -8], [13.6, -9.6], [10.4, -9.4], [9.4, -8]])), palette.skin]);
      out.push(['head', smooth(o(headFront)), palette.skin]);
      out.push(['hair', smooth(o(hairFront)), palette.hair]);
      out.push(['hairSideR', smooth(o([[17.6, 8.6], [16.2, 8.7], [15.8, 8.3], [17.2, 7.4], [19.2, 7.6]])), palette.hairSide]);
      out.push(['hairSideL', smooth(o([[17.6, -8.6], [16.2, -8.7], [15.8, -8.3], [17.2, -7.4], [19.2, -7.6]])), palette.hairSide]);
      [[[23.8, -1.4], [22.4, -3.8], [20.4, -5.6]], [[24, 2.2], [22.6, .8], [20.4, 1.4]]].forEach((st, i) => named('strand' + i, line(o(st), .55, palette.hairLine)));
      for (const [k, sgn] of [['R', 1], ['L', -1]]) out.push(['brow' + k, smooth(o([[14.2, 1.3 * sgn], [14.85, 2.9 * sgn], [14.75, 5.1 * sgn], [14.3, 5.2 * sgn], [14.35, 3.1 * sgn], [13.85, 1.5 * sgn]])), palette.hair]);
      for (const [k, sgn] of [['R', 1], ['L', -1]]) {
        out.push(['eye' + k, smooth(o([[13, 1.8 * sgn], [13.55, 3.3 * sgn], [13, 4.8 * sgn], [12.55, 3.3 * sgn]])), '#f3ede6', ' stroke="#8a6b57" stroke-width=".45"']);
        out.push(['iris' + k, smooth(o([[13.45, 3.3 * sgn], [13, 3.85 * sgn], [12.6, 3.3 * sgn], [13, 2.75 * sgn]])), '#3a2b22']);
        named('lid' + k, line(o([[12.95, 1.7 * sgn], [13.65, 3.3 * sgn], [13.05, 4.9 * sgn]]), .6, '#4b3a30'));
      }
      named('nose', line(o([[12.6, .4], [9.6, 1.2], [9.2, 0]]), .8));
      named('mouth', line(o([[6.8, -2], [6.6, 0], [6.8, 2]]), .8));
    }
  };
  if (side) { segs('lf', true); segs('af', true); torso(); segs('ln', false); head(); segs('an', false); }
  else { segs('lf', false); segs('ln', false); torso(); head(); segs('af', false); segs('an', false); }
  return out;
}
// A sneaker: white upper, grey sole, red side stripe and laces. Side view in foot coordinates [along, up].
function sneaker(L, side) {
  if (!side) {
    const at = ([x, y]) => add(L.end, [x, -y]);
    const upper = smooth([[-4.6, -1], [-4.4, 3], [-2, 4.4], [2, 4.4], [4.4, 3], [4.6, -1]].map(at));
    const sole = smooth([[-5.2, -.4], [5.2, -.4], [5.4, -2.4], [4.4, -3.6], [-4.4, -3.6], [-5.4, -2.4]].map(at));
    const lines = p => p.map(([a, b]) => `M${pt(at(a))}L${pt(at(b))}`).join('');
    return {upper, sole, stripe: lines([[[-4.2, .6], [-2.4, 2.2]]]), laces: lines([[[-1.4, 3.4], [1.4, 3.4]], [[-1.2, 2.2], [1.2, 2.2]]])};
  }
  const d = dir(L.tipAngle), n = [-d[1], d[0]], down = dot(n, [0, 1]) >= 0 ? n : mul(n, -1);
  const at = ([x, y]) => add(L.end, add(mul(d, x), mul(down, -y)));
  const upper = smooth([[-4.2, -1.2], [-4.6, 2.2], [-3.2, 4.6], [.6, 4.8], [3.6, 3.8], [7.6, 2.4], [11.6, 1.4], [14.4, .4], [15.2, -1.2]].map(at));
  const sole = smooth([[-5.2, -.8], [15.8, -.8], [16, -2.6], [14.8, -3.8], [-4.4, -3.8], [-5.4, -2.4]].map(at));
  const lines = p => p.map(pts => pts.map((q, i) => (i ? 'L' : 'M') + pt(at(q))).join('')).join('');
  return {upper, sole, stripe: lines([[[.4, 2.8], [4, 1.2], [8.6, .6]]]), laces: lines([[[2.4, 4.2], [3.8, 3.2]], [[4.8, 3.6], [6.2, 2.6]]])};
}
function shoe(L, side) {
  const d = dir(L.tipAngle), up = side ? mul(d, 1) : [0, 0];
  if (!side) { const c = add(L.end, [0, 4]); return `M${pt(add(c, [-4.6, -3.4]))}h9.2a3 3 0 0 1 3 3v2.6a2 2 0 0 1 -2 2h-11.2a2 2 0 0 1 -2 -2v-2.6a3 3 0 0 1 3 -3Z`; }
  const n = [-d[1], d[0]], s = dot(n, [0, 1]) >= 0 ? n : mul(n, -1), A = L.end; void up;
  const heel = sub(A, mul(d, 4.2)), toe = add(A, mul(d, bones.foot + 1.5));
  return `M${pt(add(heel, mul(s, -4)))}L${pt(add(A, mul(s, -5)))}L${pt(add(A, add(mul(d, 6), mul(s, -4.2))))}C${pt(add(toe, mul(s, -3.6)))} ${pt(add(toe, mul(s, -1.4)))} ${pt(add(toe, mul(s, 1.4)))}L${pt(add(toe, add(mul(d, -1), mul(s, 3.4))))}L${pt(add(heel, mul(s, 3.6)))}Q${pt(add(heel, mul(d, -2)))} ${pt(add(heel, mul(s, -4)))}Z`;
}

// A hand: palm from the wrist, four fingers as one curling chain of three bones, and a thumb.
// Local coordinates: x along the hand, y towards the palm. curl 1 closes a fist around the grip point.
const GRIP = [6.6, 3];
function handModel(L) {
  const {d, p, curl} = L.hand, at = ([x, y]) => add(L.end, add(mul(d, x), mul(p, y)));
  const segs = [4.4, 3, 2.4], bends = [70, 92, 78].map(b => b * curl * R), joints = [[6.6, -.2]], angs = [];
  let a = 0;
  for (let i = 0; i < 3; i++) { a += bends[i]; angs.push(a); const c = joints[i]; joints.push([c[0] + segs[i] * Math.cos(a), c[1] + segs[i] * Math.sin(a)]); }
  const angleAt = j => j === 0 ? angs[0] / 2 : j === 3 ? angs[2] : (angs[j - 1] + angs[j]) / 2;
  const dorsal = j => { const t = angleAt(j), c = joints[j]; return [c[0] + Math.sin(t) * 1.8, c[1] - Math.cos(t) * 1.8]; };
  const palmar = j => { const t = angleAt(j), c = joints[j]; return [c[0] - Math.sin(t) * 1.7, c[1] + Math.cos(t) * 1.7]; };
  const tip = [joints[3][0] + Math.cos(angs[2]) * 1.5, joints[3][1] + Math.sin(angs[2]) * 1.5];
  const outline = [[0, -3.2], [3.4, -3.6], [6, -3.3], dorsal(0), dorsal(1), dorsal(2), dorsal(3), tip, palmar(3), palmar(2), palmar(1), [6, 2.9], [3, 3.5], [.2, 3]].map(at);
  const creases = [1, 2].map(j => `M${pt(at(lerpV(dorsal(j), palmar(j), .15)))}L${pt(at(lerpV(dorsal(j), palmar(j), .85)))}`).join('');
  const thumb = [at([2.4, 2.2]), at(lerpV([6.6, 4.8], [7.4, 1.2], curl))];
  return {outline, creases, thumb};
}

// ---------- equipment ----------
const steel = '#a9bcc4', iron = '#1f2a30';
const grip = L => L.hand ? add(L.end, add(mul(L.hand.d, GRIP[0]), mul(L.hand.p, GRIP[1]))) : add(L.end, mul(dir(L.tipAngle), 4.5));
function gearShapes(fr, e, spec) {
  const front = fr.view === 'front', g = [], hands = ['an', 'af'].map(k => fr.limbs[k]).filter(Boolean);
  const eq = spec.equipment || e.equipment;
  if (eq === 'Skivstång') {
    if (front) {
      const [a, b] = hands.map(grip).sort((x, y) => x[0] - y[0]), y = (a[1] + b[1]) / 2;
      g.push(['bar', `M${f1(a[0] - 34)} ${f1(y - 1.6)}H${f1(b[0] + 34)}V${f1(y + 1.6)}H${f1(a[0] - 34)}Z`, steel, '', 'mid']);
      for (const x of [a[0] - 30, b[0] + 24]) g.push(['plate' + (x < a[0] ? 'L' : 'R'), `M${f1(x)} ${f1(y - 16)}h6a1.5 1.5 0 0 1 1.5 1.5v29a1.5 1.5 0 0 1 -1.5 1.5h-6a1.5 1.5 0 0 1 -1.5 -1.5v-29a1.5 1.5 0 0 1 1.5 -1.5Z`, iron, ` stroke="${steel}" stroke-width="1.4"`, 'mid']);
    } else {
      // Seen from the side, the near plate is in front of the hand and hides it, as in real life.
      const c = grip(fr.limbs.an);
      g.push(['plate', `M${pt(add(c, [-16, 0]))}a16 16 0 1 0 32 0a16 16 0 1 0 -32 0Z`, iron, ` stroke="${steel}" stroke-width="2.4"`, 'top']);
      g.push(['plateRing', `M${pt(add(c, [-9, 0]))}a9 9 0 1 0 18 0a9 9 0 1 0 -18 0Z`, 'none', ` stroke="#3c4c55" stroke-width="2"`, 'top']);
      g.push(['hub', `M${pt(add(c, [-3, 0]))}a3 3 0 1 0 6 0a3 3 0 1 0 -6 0Z`, steel, '', 'top']);
    }
  } else if (eq === 'Hantlar') {
    for (const [i, L] of hands.entries()) {
      const c = grip(L), layer = !front && i === 1 ? 'back' : 'mid';
      if (front || spec.dumbbellAlong) {
        const d = front ? [1, 0] : norm(sub(L.tip, L.end)), n = [-d[1], d[0]];
        const box = (o, w, h) => { const p = add(c, mul(d, o)); return `M${pt(add(add(p, mul(d, -w / 2)), mul(n, -h / 2)))}L${pt(add(add(p, mul(d, w / 2)), mul(n, -h / 2)))}L${pt(add(add(p, mul(d, w / 2)), mul(n, h / 2)))}L${pt(add(add(p, mul(d, -w / 2)), mul(n, h / 2)))}Z`; };
        g.push(['db' + i + 'h', box(0, 18, 2.6), steel, '', layer]);
        g.push(['db' + i + 'a', box(-8, 5, 13), iron, ` stroke="${steel}" stroke-width="1.2"`, layer]);
        g.push(['db' + i + 'b', box(8, 5, 13), iron, ` stroke="${steel}" stroke-width="1.2"`, layer]);
      } else {
        // Seen from the side, the near plate is closest to the viewer and hides the hand, as in real life.
        const sideLayer = i === 1 ? 'back' : 'top';
        g.push(['db' + i, `M${pt(add(c, [-8, 0]))}a8 8 0 1 0 16 0a8 8 0 1 0 -16 0Z`, iron, ` stroke="${steel}" stroke-width="2"`, sideLayer]);
        g.push(['db' + i + 'c', `M${pt(add(c, [-2.4, 0]))}a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0 -4.8 0Z`, steel, '', sideLayer]);
      }
    }
  } else if (eq === 'Kabel' && spec.anchor) {
    const anchors = Array.isArray(spec.anchor[0]) ? spec.anchor.filter(Array.isArray) : [spec.anchor];
    anchors.forEach((a, i) => {
      const L = anchors.length > 1 ? hands[i] : hands[0], c = grip(L), d = norm(sub(c, a)), n = [-d[1], d[0]];
      g.push(['cable' + i, `M${pt(add(a, mul(n, .8)))}L${pt(add(c, mul(n, .8)))}L${pt(sub(c, mul(n, .8)))}L${pt(sub(a, mul(n, .8)))}Z`, '#8fa3ab', '', 'back']);
      g.push(['handle' + i, `M${pt(add(c, mul(n, -6)))}L${pt(add(c, mul(n, 6)))}L${pt(add(add(c, mul(n, 6)), mul(d, 3)))}L${pt(add(add(c, mul(n, -6)), mul(d, 3)))}Z`, iron, ` stroke="${steel}" stroke-width="1.6"`, 'mid']);
    });
  } else if (eq === 'Gummiband') {
    const [a, b] = hands.map(grip);
    g.push(['band', front || len(sub(a, b)) > 6 ? `M${pt(a)}Q${pt(add(lerpV(a, b, .5), [0, 14]))} ${pt(b)}Q${pt(add(lerpV(a, b, .5), [0, 11]))} ${pt(a)}Z` : `M${pt(add(a, [-4, 0]))}a4 6 0 1 0 8 0a4 6 0 1 0 -8 0Z`, 'none', ' stroke="#e58fae" stroke-width="3"', 'top']);
  } else if (spec.wheel) {
    const c = grip(fr.limbs.an);
    g.push(['wheel', `M${pt(add(c, [-9, 5]))}a9 9 0 1 0 18 0a9 9 0 1 0 -18 0Z`, iron, ` stroke="${steel}" stroke-width="2.4"`, 'mid']);
  }
  if (spec.handles || (eq === 'Kabel' && !spec.anchor)) for (const [i, L] of hands.entries()) { const c = grip(L); g.push(['grip' + i, `M${pt(add(c, [-3.5, -6]))}h7v12h-7Z`, iron, ` stroke="${steel}" stroke-width="1.4"`, !front && i === 1 ? 'back' : 'mid']); }
  if (spec.sled) { const L = fr.limbs.ln, c = add(L.end, mul(dir(L.tipAngle), 6)), d = dir(L.tipAngle), n = [-d[1], d[0]]; g.push(['sled', `M${pt(add(c, mul(n, -24)))}L${pt(add(c, mul(n, 24)))}L${pt(add(add(c, mul(n, 24)), mul(d, 5)))}L${pt(add(add(c, mul(n, -24)), mul(d, 5)))}Z`, '#3d4f58', ` stroke="${steel}" stroke-width="1.4"`, 'back']); }
  if (spec.pad) { const L = fr.limbs.ln, c = add(lerpV(L.mid, L.end, .82), mul(fr.n, 0)); g.push(['pad', `M${pt(add(c, [-6, 0]))}a6 6 0 1 0 12 0a6 6 0 1 0 -12 0Z`, '#3d4f58', ` stroke="${steel}" stroke-width="1.4"`, 'top']); }
  return g;
}

// Static scenery drawn behind the figure: benches, bars, machines, mats.
function scenery(list = []) {
  const s = {stroke: '#4f646c', fill: '#2b3a41'};
  return list.map(([kind, ...v]) => {
    if (kind === 'bench') { const [x1, x2, y] = v; return `<rect x="${x1}" y="${y}" width="${x2 - x1}" height="7" rx="3.5" fill="${s.fill}" stroke="${s.stroke}" stroke-width="1.5"/><path d="M${x1 + 8} ${y + 7}V${GROUND}M${x2 - 8} ${y + 7}V${GROUND}" stroke="${s.stroke}" stroke-width="4"/>`; }
    if (kind === 'pad') { const [x1, y1, x2, y2] = v; return `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${s.fill}" stroke-width="8" stroke-linecap="round"/><path d="M${x1} ${y1}L${x2} ${y2}" stroke="${s.stroke}" stroke-width="1.2" stroke-linecap="round" fill="none"/>`; }
    if (kind === 'post') { const [x, y1, y2 = GROUND] = v; return `<path d="M${x} ${y1}V${y2}" stroke="${s.stroke}" stroke-width="4" stroke-linecap="round"/>`; }
    if (kind === 'bar') { const [x1, x2, y] = v; return `<path d="M${x1} ${y}H${x2}" stroke="#8193a0" stroke-width="4" stroke-linecap="round"/>`; }
    if (kind === 'line') { const [x1, y1, x2, y2, w = 4] = v; return `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${s.stroke}" stroke-width="${w}" stroke-linecap="round"/>`; }
    if (kind === 'pulley') { const [x, y] = v; return `<circle cx="${x}" cy="${y}" r="4.5" fill="${s.fill}" stroke="#8193a0" stroke-width="2"/>`; }
    if (kind === 'mat') { const [x1, x2] = v; return `<rect x="${x1}" y="${GROUND - 2}" width="${x2 - x1}" height="3" rx="1.5" fill="#35505a"/>`; }
    if (kind === 'wall') { const [x] = v; return `<path d="M${x} 0V${GROUND}" stroke="${s.stroke}" stroke-width="5"/>`; }
    return '';
  }).join('');
}

// ---------- animation ----------
const STEPS = 7;
function frames(spec, view) {
  const {A, B, bends, sa, sb} = solveKeys(spec, view);
  const list = [];
  for (let i = 0; i <= STEPS; i++) {
    const k = ease(i / STEPS);
    list.push(i === 0 ? sa : i === STEPS ? sb : solve(blend(A, B, k, sa.limbs, sb.limbs), view, bends));
  }
  return list;
}

export function hasFigure(e) { return !!specFor(e); }
function specFor(e) {
  const key = aliases[e.id] || aliases[e.pose + '|' + e.equipment] || e.pose;
  return specs[key];
}

// Every drawn shape of one frame, in drawing order: gear behind, body, gear in hand, near arm, gear in front.
// Fine details only matter when the figure is shown large; thumbnails leave them out to stay light.
const FINE = /strand|laces|stripe|crease|logoPeak|logoFlag|earFold|nostril|lid|iris|jaw|strings|muscle/;
function drawList(fr, e, spec, hl, fine = true) {
  const body = shapes(fr, hl).filter(x => fine || !FINE.test(x[0])), gear = gearShapes(fr, e, spec), view = fr.view;
  const split = body.findIndex(x => x[0] === (view === 'side' ? 'anuarm' : 'afuarm'));
  const layer = name => gear.filter(g => (g[4] || 'top') === name);
  return [...layer('back'), ...body.slice(0, split), ...layer('mid'), ...body.slice(split), ...layer('top')];
}

export function figureArt(e, animated = false) {
  const spec = specFor(e);
  if (!spec) return null;
  const view = spec.view || 'side', hl = highlights[e.muscle] || [];
  const list = frames(spec, view);
  const moving = animated && spec.keys.length > 1;
  const items = drawList(list[0], e, spec, hl, animated);
  const paths = items.map(([, d, fill, extra = ''], i) => {
    const outline = fill === 'none' || extra.includes('stroke=') ? '' : ' stroke="#00000038" stroke-width=".8"';
    return `<path${moving ? ` data-i="${i}"` : ''} d="${d}" fill="${fill}"${extra}${outline}/>`;
  }).join('');
  // Fit the view to the figure in every frame (and cable anchors), padded, at least 130 wide, 192:170.
  let [x1, y1, x2, y2] = [Infinity, Infinity, -Infinity, GROUND + 6];
  const anchors = e.equipment === 'Kabel' && spec.anchor ? (Array.isArray(spec.anchor[0]) ? spec.anchor.filter(Array.isArray) : [spec.anchor]) : [];
  for (const fr of list) for (const p of [fr.P, fr.S, fr.neck, add(fr.neck, mul(fr.headAxis, 20)), ...Object.values(fr.limbs).flatMap(L => [L.root, L.mid, L.end, L.tip]), ...anchors]) {
    x1 = Math.min(x1, p[0] - 22); y1 = Math.min(y1, p[1] - 16); x2 = Math.max(x2, p[0] + 22); y2 = Math.max(y2, p[1] + 10);
  }
  if (x2 - x1 < 130) { const c = (x1 + x2) / 2; x1 = c - 65; x2 = c + 65; }
  let w = x2 - x1, h = y2 - y1;
  if (w / h > 192 / 170) { const nh = w * 170 / 192; y1 -= (nh - h) / 2; h = nh; } else { const nw = h * 192 / 170; x1 -= (nw - w) / 2; w = nw; }
  const breath = animated && !moving ? '<animateTransform attributeName="transform" type="translate" values="0 0;0 -1.2;0 0" dur="3.6s" repeatCount="indefinite"/>' : '';
  let key = '';
  if (moving) { key = (e.id || e.pose) + '|' + (e.equipment || '') + '|' + (e.muscle || ''); registry.set(key, e); startRuntime(); }
  return `<svg class="movement-art ${animated ? 'moving' : ''}"${moving ? ` data-figure="${key}"` : ''} viewBox="${f1(x1)} ${f1(y1)} ${f1(w)} ${f1(h)}" role="img" aria-label="${e.name}: rörelsedemonstration"><ellipse cx="${f1((list[0].P[0] + (list[0].limbs.ln?.end[0] ?? list[0].P[0])) / 2)}" cy="${GROUND + 2}" rx="62" ry="4.5" fill="#0004"/><g>${scenery([...(spec.scene || []), ...(spec.sceneFor?.[e.equipment] || [])])}</g><g>${breath}${paths}</g></svg>`;
}

// ---------- runtime ----------
// Animated figures are solved again on every display frame: the skeleton is posed, then every shape is
// rebuilt. No shape is morphed into another, so nothing can flatten, flip or blink between frames.
const registry = new Map(), players = new Map();
let running = false;
// One loop: hold at the start, move, hold at the end, move back. Returns how far into the move (0..1).
export function phase(t, dur) {
  const x = (t % dur) / dur, hold = .1, move = .4;
  if (x < hold) return 0;
  if (x < hold + move) return ease((x - hold) / move);
  if (x < hold * 2 + move) return 1;
  return ease(1 - (x - hold * 2 - move) / move);
}
// Draws one exercise at a point in its movement into an existing svg (used by the runtime and tests).
const keyCache = new Map();
function keyPoses(spec) {
  if (!keyCache.has(spec)) {
    const view = spec.view || 'side';
    keyCache.set(spec, {view, ...solveKeys(spec, view)});
  }
  return keyCache.get(spec);
}
export function poseAt(svg, e, k, memo = {}) {
  const spec = specFor(e), hl = highlights[e.muscle] || [], {view, A, B, sa, sb, bends} = keyPoses(spec);
  MEMO = memo;
  try {
    const fr = solve(blend(A, B, k, sa.limbs, sb.limbs), view, bends);
    const list = drawList(fr, e, spec, hl);
    for (const path of svg.querySelectorAll('path[data-i]')) { const d = list[Number(path.dataset.i)]?.[1]; if (d && path.getAttribute('d') !== d) path.setAttribute('d', d); }
  } finally { MEMO = null; }
}
function startRuntime() {
  if (running || typeof window === 'undefined' || !window.requestAnimationFrame) return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  running = true;
  let idle = 0;
  const tick = now => {
    for (const svg of document.querySelectorAll('svg[data-figure]')) {
      if (!players.has(svg)) players.set(svg, {start: now, memo: {}, e: registry.get(svg.dataset.figure)});
    }
    for (const [svg, p] of players) {
      if (!svg.isConnected || !p.e) { players.delete(svg); continue; }
      const spec = specFor(p.e);
      poseAt(svg, p.e, phase((now - p.start) / 1000, spec.dur || 3.2), p.memo);
    }
    // Keep looking for a while: the svg is usually inserted right after it is rendered.
    idle = players.size ? 0 : idle + 1;
    if (idle < 120) window.requestAnimationFrame(tick); else running = false;
  };
  window.requestAnimationFrame(tick);
}

// Solved joints of one key pose (used by tests).
export const solvePose = (key, view = 'side') => solve(prepare(key, view), view);

// All solved frames of an exercise, start to end (used by tests).
export function framesOf(e) { const spec = specFor(e); return spec ? frames(spec, spec.view || 'side') : []; }
