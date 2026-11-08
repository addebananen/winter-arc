// Skill-tree animation engine.
// A 2D figure with real segment lengths. Poses use world angles (compass degrees:
// 0 = up, 90 = forward/right, 180 = down). One body point is anchored to a contact
// (floor, bar, wall) and limbs can be solved with two-bone IK so hands and feet stay
// planted while the body moves. A centre-of-mass solver keeps balance skills honest.

export const L = {torso: 50, neck: 19.5, head: 10.5, ua: 29, fa: 25, hand: 8.5, th: 44, sh: 42, foot: 15};
const RAD = Math.PI / 180;
export const dir = a => [Math.sin(a * RAD), -Math.cos(a * RAD)];
const add = (p, v, s = 1) => [p[0] + v[0] * s, p[1] + v[1] * s];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const angleOf = v => Math.atan2(v[0], -v[1]) / RAD;
const norm = a => { a %= 360; if (a > 180) a -= 360; if (a <= -180) a += 360; return a; };

// Approximate segment mass fractions (Dempster/Winter).
const MASS = {head: .081, torso: .497, ua: .028, fa: .016, hand: .006, th: .1, sh: .0465, foot: .0145};

export function full(p) {
  const q = structuredClone(p);
  q.t ??= 0; q.n ??= q.t; q.sw ??= 0; q.hw ??= 0; q.len ??= {};
  q.an ??= [180, 180]; q.af ??= [...q.an];
  q.ln ??= [180, 180, 118]; q.lf ??= [...q.ln];
  for (const k of ['an', 'af']) q[k][2] ??= q[k][1];
  for (const k of ['ln', 'lf']) q[k][2] ??= q[k][1] - 62;
  q.ik = {...(q.ik || {}), __ik: 1};
  return q;
}

function ik2(root, target, l1, l2, bend) {
  const dx = target[0] - root[0], dy = target[1] - root[1], reach = Math.hypot(dx, dy) || 1e-6;
  const d = Math.min(l1 + l2 - 1e-3, Math.max(Math.abs(l1 - l2) + 1e-3, reach));
  const a = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  const base = Math.atan2(dy, dx), th = base + (bend || 0) * a;
  const mid = [root[0] + Math.cos(th) * l1, root[1] + Math.sin(th) * l1];
  const end = [root[0] + dx / reach * d, root[1] + dy / reach * d];
  return {mid, end, err: Math.abs(reach - d)};
}

// Forward kinematics + anchor + IK. Returns joint positions and diagnostics.
export function solve(input) {
  const p = input.ik?.__ik && input.len ? input : full(input), s = k => (p.len[k] ?? 1);
  const td = dir(p.t), perp = [-td[1], td[0]];
  const P = [0, 0], S = add(P, td, L.torso * s('torso'));
  const J = {pelvis: P, shoulder: S};
  J.hipN = add(P, perp, p.hw); J.hipF = add(P, perp, -p.hw);
  J.shN = add(S, perp, p.sw); J.shF = add(S, perp, -p.sw);
  J.head = add(S, dir(p.n), L.neck * s('neck'));
  const arm = (side, key) => {
    const [ua, fa, hd] = p[key], sh = J['sh' + side];
    J['elbow' + side] = add(sh, dir(ua), L.ua * s('ua' + side));
    J['wrist' + side] = add(J['elbow' + side], dir(fa), L.fa * s('fa' + side));
    J['hand' + side] = add(J['wrist' + side], dir(hd), L.hand * s('hand'));
  };
  const leg = (side, key) => {
    const [th, sh, ft] = p[key], hip = J['hip' + side];
    J['knee' + side] = add(hip, dir(th), L.th * s('th' + side));
    J['ankle' + side] = add(J['knee' + side], dir(sh), L.sh * s('sh' + side));
    J['toe' + side] = add(J['ankle' + side], dir(ft), L.foot * s('foot'));
  };
  arm('N', 'an'); arm('F', 'af'); leg('N', 'ln'); leg('F', 'lf');
  const virtual = () => {
    J.hands = mid(J.wristN, J.wristF); J.ankles = mid(J.ankleN, J.ankleF);
    J.toes = mid(J.toeN, J.toeF); J.knees = mid(J.kneeN, J.kneeF);
    J.fingers = mid(J.handN, J.handF); J.hips = mid(J.hipN, J.hipF);
  };
  virtual();
  if (p.at) {
    const target = J[p.at.j]; if (!target) throw Error('Unknown anchor ' + p.at.j);
    const d = [p.at.x - target[0], p.at.y - target[1]];
    for (const k of Object.keys(J)) J[k] = add(J[k], d);
  }
  const errors = [];
  for (const [key, t] of Object.entries(p.ik)) {
    if (!t || key === '__ik') continue;
    const isArm = key[0] === 'a', side = key[1] === 'n' ? 'N' : 'F', w = t.w ?? 1;
    if (w <= 0.001) continue;
    if (isArm) {
      const handA = (t.h ?? p[key][2]) * w + p[key][2] * (1 - w);
      let wrist = [t.x, t.y];
      if (t.tip) wrist = add(wrist, dir(handA), -L.hand * s('hand'));
      if (w < 1) wrist = [J['wrist' + side][0] * (1 - w) + wrist[0] * w, J['wrist' + side][1] * (1 - w) + wrist[1] * w];
      const r = ik2(J['sh' + side], wrist, L.ua * s('ua' + side), L.fa * s('fa' + side), t.b ?? 1);
      J['elbow' + side] = r.mid; J['wrist' + side] = r.end;
      J['hand' + side] = add(r.end, dir(handA), L.hand * s('hand'));
      if (r.err > 2.2 && w > .99) errors.push(`${key} når inte (${r.err.toFixed(1)})`);
    } else {
      const ft = (t.f ?? p[key][2]) * w + p[key][2] * (1 - w);
      let ankle = [t.x, t.y];
      if (t.tip) ankle = add(ankle, dir(ft), -L.foot * s('foot'));
      if (w < 1) ankle = [J['ankle' + side][0] * (1 - w) + ankle[0] * w, J['ankle' + side][1] * (1 - w) + ankle[1] * w];
      const r = ik2(J['hip' + side], ankle, L.th * s('th' + side), L.sh * s('sh' + side), t.b ?? -1);
      J['knee' + side] = r.mid; J['ankle' + side] = r.end;
      J['toe' + side] = add(r.end, dir(ft), L.foot * s('foot'));
      if (r.err > 2.2 && w > .99) errors.push(`${key} når inte (${r.err.toFixed(1)})`);
    }
  }
  virtual();
  return {J, p, errors};
}
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

export function com({J}) {
  let m = 0, x = 0, y = 0;
  const seg = (a, b, w) => { const c = mid(a, b); x += c[0] * w; y += c[1] * w; m += w; };
  seg(J.head, J.head, MASS.head); seg(J.pelvis, J.shoulder, MASS.torso);
  for (const S of ['N', 'F']) {
    seg(J['sh' + S], J['elbow' + S], MASS.ua); seg(J['elbow' + S], J['wrist' + S], MASS.fa); seg(J['wrist' + S], J['hand' + S], MASS.hand);
    seg(J['hip' + S], J['knee' + S], MASS.th); seg(J['knee' + S], J['ankle' + S], MASS.sh); seg(J['ankle' + S], J['toe' + S], MASS.foot);
  }
  return [x / m, y / m];
}

// Find a parameter value v in [lo,hi] so that the centre of mass sits at x=targetX.
export function balance(make, lo, hi, targetX, axis = 0) {
  const f = v => com(solve(full(make(v))))[axis] - targetX;
  let a = lo, b = hi, fa = f(a);
  for (let i = 0; i < 40; i++) {
    const m = (a + b) / 2, fm = f(m);
    if (Math.sign(fm) === Math.sign(fa)) { a = m; fa = fm; } else b = m;
  }
  return (a + b) / 2;
}

// Find v in [lo,hi] so that a joint coordinate (axis 0=x, 1=y) reaches target.
export function fit(make, lo, hi, joint, axis, target) {
  const f = v => solve(full(make(v))).J[joint][axis] - target;
  let a = lo, b = hi, fa = f(a);
  for (let i = 0; i < 40; i++) {
    const m = (a + b) / 2, fm = f(m);
    if (Math.sign(fm) === Math.sign(fa)) { a = m; fa = fm; } else b = m;
  }
  return (a + b) / 2;
}
export const joint = (pose, j) => solve(full(pose)).J[j];

// Anatomical limits, used by the dev gallery to catch impossible poses.
export function lint(sol) {
  const {J} = sol, out = [...sol.errors];
  const a = (from, to) => angleOf(sub(J[to], J[from]));
  const t = a('pelvis', 'shoulder');
  for (const S of ['N', 'F']) {
    const ua = a('sh' + S, 'elbow' + S), fa = a('elbow' + S, 'wrist' + S), hd = a('wrist' + S, 'hand' + S);
    const th = a('hip' + S, 'knee' + S), sh = a('knee' + S, 'ankle' + S), ft = a('ankle' + S, 'toe' + S);
    const elbow = norm(ua - fa), knee = norm(sh - th), hip = (th - t + 720) % 360, ankle = norm(ft - sh), wrist = norm(hd - fa);
    if (sol.p.front) {
      if (Math.abs(elbow) > 155) out.push(`armbåge ${S} ${elbow.toFixed(0)}°`);
      if (Math.abs(knee) > 160) out.push(`knä ${S} ${knee.toFixed(0)}°`);
      continue;
    }
    // Elbow flexion can appear in either rotational sense in 2D (it depends on how the
    // upper arm is rotated), so only its magnitude is checked.
    if (Math.abs(elbow) > 160) out.push(`armbåge ${S} ${elbow.toFixed(0)}°`);
    if (knee < -6 || knee > 162) out.push(`knä ${S} ${knee.toFixed(0)}°`);
    if (hip < 12 || hip > 215) out.push(`höft ${S} ${hip.toFixed(0)}°`);
    if (ankle < -125 || ankle > 20) out.push(`fotled ${S} ${ankle.toFixed(0)}°`);
    if (Math.abs(wrist) > 106) out.push(`handled ${S} ${wrist.toFixed(0)}°`);
  }
  const neck = norm(a('shoulder', 'head') - t);
  if (Math.abs(neck) > 65) out.push(`nacke ${neck.toFixed(0)}°`);
  return out;
}

// ---------- interpolation & timeline ----------
function lerp(a, b, u) {
  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * u;
  if (a === undefined) return b; if (b === undefined) return a;
  if (Array.isArray(a)) return a.map((v, i) => lerp(v, b[i], u));
  if (a && typeof a === 'object' && a.__ik) {
    const o = {__ik: 1};
    for (const k of new Set([...Object.keys(a), ...Object.keys(b || {})])) {
      if (k === '__ik') continue;
      const from = a[k] || {...b[k], w: 0}, to = b?.[k] || {...a[k], w: 0};
      o[k] = lerp({w: 1, ...from}, {w: 1, ...to}, u);
    }
    return o;
  }
  if (a && typeof a === 'object') {
    const o = {};
    for (const k of new Set([...Object.keys(a), ...Object.keys(b || {})])) o[k] = lerp(a[k], b?.[k], u);
    return o;
  }
  return u < .5 ? a : b;
}
const EASE = {
  io: u => -(Math.cos(Math.PI * u) - 1) / 2,
  in: u => 1 - Math.cos(u * Math.PI / 2),
  out: u => Math.sin(u * Math.PI / 2),
  lin: u => u,
  // explosive concentric, soft finish
  snap: u => 1 - Math.pow(1 - u, 3),
};

export function prepare(anim) {
  if (anim._ready) return anim;
  anim.frames = anim.frames.map(f => ({hold: 600, move: 900, ease: 'io', ...f, p: full(f.p)}));
  anim.total = anim.frames.reduce((n, f, i) => n + f.hold + (i < anim.frames.length - 1 || anim.loop !== false ? f.move : 0), 0);
  anim._ready = true;
  return anim;
}

export function sample(anim, time) {
  prepare(anim);
  const fr = anim.frames;
  let t = ((time % anim.total) + anim.total) % anim.total;
  for (let i = 0; i < fr.length; i++) {
    const f = fr[i];
    if (t < f.hold) return {pose: f.p, i, phase: 'hold', u: t / f.hold, frame: f};
    t -= f.hold;
    const next = fr[i + 1] || fr[0];
    if (t < f.move) {
      const u = (EASE[f.ease] || EASE.io)(t / f.move);
      return {pose: f.move ? lerp(f.p, next.p, u) : next.p, i, phase: 'move', u: t / f.move, frame: f, next};
    }
    t -= f.move;
  }
  return {pose: fr[0].p, i: 0, phase: 'hold', u: 0, frame: fr[0]};
}

// ---------- drawing ----------
const C = {edge: '#142022', near: '#d4ece5', far: '#7d9f97', torso: '#bfe0d7', head: '#e9f4f0', focus: '#e0c799', prop: '#56696a', propFill: '#223030', floor: '#3a4b4c', ghost: 'rgba(198,231,223,.13)'};
const W = {ua: 9.5, fa: 8, hand: 6, th: 13.5, sh: 10, foot: 6.5};

function propsSVG(props = [], J) {
  let s = '';
  for (const pr of props) {
    const k = pr.k;
    if (k === 'wall') s += `<rect x="${pr.x - (pr.side === 'left' ? 9 : 0)}" y="${pr.top ?? -260}" width="9" height="${-(pr.top ?? -260)}" rx="2" fill="${C.propFill}" stroke="${C.prop}" stroke-width="1.2"/>`;
    if (k === 'bar') s += `${pr.posts === false ? '' : `<line x1="${pr.x}" y1="${pr.y}" x2="${pr.x}" y2="${pr.y - 14}" stroke="${C.prop}" stroke-width="2" stroke-linecap="round" opacity=".55"/>`}<circle cx="${pr.x}" cy="${pr.y}" r="4.2" fill="#2b3a3a" stroke="#8aa3a1" stroke-width="2.2"/>`;
    if (k === 'rings') s += `<line x1="${pr.x}" y1="${pr.y - 70}" x2="${pr.x}" y2="${pr.y - 9}" stroke="${C.prop}" stroke-width="1.6"/><circle cx="${pr.x}" cy="${pr.y - 4}" r="6" fill="none" stroke="${C.prop}" stroke-width="2.6"/>`;
    if (k === 'para') s += `<path d="M${pr.x - 14} 0 L${pr.x - 7} ${pr.y ?? -11} H${pr.x + 7} L${pr.x + 14} 0" fill="none" stroke="${C.prop}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`;
    if (k === 'dip') s += `<line x1="${pr.x - 30}" y1="${pr.y}" x2="${pr.x + 30}" y2="${pr.y}" stroke="${C.prop}" stroke-width="4" stroke-linecap="round"/><line x1="${pr.x - 24}" y1="${pr.y}" x2="${pr.x - 24}" y2="0" stroke="${C.prop}" stroke-width="2.2" opacity=".6"/><line x1="${pr.x + 24}" y1="${pr.y}" x2="${pr.x + 24}" y2="0" stroke="${C.prop}" stroke-width="2.2" opacity=".6"/>`;
    if (k === 'box') s += `<rect x="${pr.x}" y="${-pr.h}" width="${pr.w}" height="${pr.h}" rx="3" fill="${C.propFill}" stroke="${C.prop}" stroke-width="1.4"/>`;
    if (k === 'pole') s += `<line x1="${pr.x}" y1="${pr.top ?? -260}" x2="${pr.x}" y2="0" stroke="${C.prop}" stroke-width="5" stroke-linecap="round"/>`;
    if (k === 'mat') s += `<rect x="${pr.x}" y="-3" width="${pr.w}" height="3" rx="1.5" fill="#2c3b3b"/>`;
    if (k === 'band' && J) { const a = pr.from, b = J[pr.to]; s += `<path d="M${a[0]} ${a[1]} L${b[0]} ${b[1]}" stroke="#e0c799" stroke-width="2" stroke-dasharray="1 0" opacity=".75" fill="none"/>`; }
  }
  return s;
}

function seg(a, b, w, color, extra = '') {
  return `<line x1="${a[0].toFixed(2)}" y1="${a[1].toFixed(2)}" x2="${b[0].toFixed(2)}" y2="${b[1].toFixed(2)}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"${extra}/>`;
}

export function figureSVG(sol, opts = {}) {
  const {J, p} = sol, focus = new Set(opts.focus || []), ghost = opts.ghost;
  const col = (part, base) => ghost ? C.ghost : focus.has(part) ? C.focus : base;
  // Near limbs get a thin dark outline so they read clearly in front of the torso.
  const outline = !ghost;
  const limb = (S, base) => {
    const near = S === 'N', o = (a, b, w) => near && outline ? seg(a, b, w + 3, C.edge) : '';
    const legAttr = p.dimLegs ? ' opacity=".3"' : '';
    const arm = [[J['sh' + S], J['elbow' + S], W.ua, 'arms'], [J['elbow' + S], J['wrist' + S], W.fa, 'arms'], [J['wrist' + S], J['hand' + S], W.hand, 'hands']];
    const leg = [[J['hip' + S], J['knee' + S], W.th, 'legs'], [J['knee' + S], J['ankle' + S], W.sh, 'legs'], [J['ankle' + S], J['toe' + S], W.foot, 'feet']];
    return {
      arm: arm.map(([a, b, w]) => o(a, b, w)).join('') + arm.map(([a, b, w, part]) => seg(a, b, w, col(part, base))).join(''),
      leg: `<g${legAttr}>` + leg.map(([a, b, w]) => o(a, b, w)).join('') + leg.map(([a, b, w, part]) => seg(a, b, w, col(part, base))).join('') + '</g>',
    };
  };
  const far = limb('F', C.far), near = limb('N', C.near);
  // torso as a tapered capsule (hips 13 → chest 17)
  const td = sub(J.shoulder, J.pelvis), len = Math.hypot(...td) || 1, u = [td[0] / len, td[1] / len], n = [-u[1], u[0]];
  const hip = (6.5 + p.hw * .55), chest = (8.5 + p.sw * .6);
  const q = [add(J.pelvis, n, hip), add(J.shoulder, n, chest), add(J.shoulder, n, -chest), add(J.pelvis, n, -hip)];
  const torso = `<path d="M${q.map(v => v[0].toFixed(2) + ' ' + v[1].toFixed(2)).join(' L')}Z" fill="${col('core', C.torso)}" stroke="${col('core', C.torso)}" stroke-width="5" stroke-linejoin="round"/>`;
  const shoulders = p.sw ? seg(J.shN, J.shF, 9, col('shoulders', C.torso)) : (focus.has('shoulders') && !ghost ? `<circle cx="${J.shoulder[0]}" cy="${J.shoulder[1]}" r="7.5" fill="${C.focus}"/>` : '');
  const neck = seg(J.shoulder, add(J.shoulder, dir(angleOf(sub(J.head, J.shoulder))), 6), 7, col('core', C.torso));
  const hd = sub(J.head, J.shoulder), hl = Math.hypot(...hd) || 1, face = [-hd[1] / hl, hd[0] / hl];
  const head = `<circle cx="${J.head[0].toFixed(2)}" cy="${J.head[1].toFixed(2)}" r="${L.head}" fill="${ghost ? C.ghost : C.head}"/>` +
    (ghost || p.front ? '' : `<circle cx="${(J.head[0] + face[0] * 6.2 + hd[0] / hl * 1.2).toFixed(2)}" cy="${(J.head[1] + face[1] * 6.2 + hd[1] / hl * 1.2).toFixed(2)}" r="1.7" fill="#1b2a2a" opacity=".75"/>`);
  return `<g>${far.leg}${far.arm}${torso}${shoulders}${neck}${head}${near.leg}${near.arm}</g>`;
}

// Fit all frames (sampled) plus props into a consistent 16:10 viewBox.
export function frameBox(anim, aspect) {
  prepare(anim);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const take = (x, y, r = 0) => { x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r); };
  for (let i = 0; i <= 48; i++) {
    const {J} = solve(sample(anim, anim.total * i / 48).pose);
    for (const [k, v] of Object.entries(J)) take(v[0], v[1], k === 'head' ? L.head + 2 : 7);
  }
  for (const pr of anim.props || []) {
    if (pr.k === 'bar' || pr.k === 'rings') take(pr.x, pr.y, 6);
    if (pr.k === 'box') { take(pr.x, -pr.h); take(pr.x + pr.w, 0); }
    if (pr.k === 'dip') { take(pr.x - 30, pr.y); take(pr.x + 30, pr.y); }
    if (pr.k === 'para') take(pr.x, -12, 14);
  }
  if ((anim.props || []).some(p => p.k === 'floor')) take(x0, 4);
  const pad = 14; x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
  aspect ??= Math.max(1.1, Math.min(1.6, (x1 - x0) / (y1 - y0)));
  let w = Math.max(x1 - x0, 170), h = Math.max(y1 - y0, 106);
  if (w / h > aspect) h = w / aspect; else w = h * aspect;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return {x: cx - w / 2, y: cy - h / 2, w, h};
}

function sceneSVG(anim, pose, box, opts = {}) {
  const sol = solve(pose);
  const floor = (anim.props || []).some(p => p.k === 'floor');
  const ghosts = (opts.ghosts || []).map(g => figureSVG(solve(g), {ghost: true})).join('');
  const front = new Set(['bar', 'rings', 'band']), all = anim.props || [];
  const back = propsSVG(all.filter(p => !front.has(p.k)), sol.J), fore = propsSVG(all.filter(p => front.has(p.k)), sol.J);
  const floorLine = floor ? `<line x1="${box.x}" y1="0.5" x2="${box.x + box.w}" y2="0.5" stroke="url(#skf)" stroke-width="1.4"/>` : '';
  return `${floorLine}${back}${ghosts}${figureSVG(sol, {focus: opts.focus})}${fore}`;
}

const DEFS = `<defs><linearGradient id="skf" x1="0" x2="1"><stop offset="0" stop-color="${C.floor}" stop-opacity="0"/><stop offset=".15" stop-color="${C.floor}"/><stop offset=".85" stop-color="${C.floor}"/><stop offset="1" stop-color="${C.floor}" stop-opacity="0"/></linearGradient></defs>`;

// Static picture of one keyframe (for tree nodes and thumbnails).
export function poseSVG(anim, index = anim.key ?? 0, cls = 'sk-thumb') {
  prepare(anim);
  const box = anim._box ||= frameBox(anim);
  const f = anim.frames[Math.min(index, anim.frames.length - 1)];
  return `<svg class="${cls}" viewBox="${box.x.toFixed(1)} ${box.y.toFixed(1)} ${box.w.toFixed(1)} ${box.h.toFixed(1)}" aria-hidden="true">${DEFS}${sceneSVG(anim, f.p, box, {focus: f.focus})}</svg>`;
}

// Live player. Stops by itself when its element leaves the document.
const raf = f => globalThis.requestAnimationFrame ? requestAnimationFrame(f) : setTimeout(() => f(performance.now()), 16);
const caf = id => globalThis.cancelAnimationFrame ? cancelAnimationFrame(id) : clearTimeout(id);
export function mountPlayer(el, anim, {label = '', reduced = !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches} = {}) {
  prepare(anim);
  const box = anim._box ||= frameBox(anim);
  const ghostPoses = (anim.ghost || []).map(i => anim.frames[i].p);
  el.classList.add('sk-player');
  el.innerHTML = `<div class="sk-stage"><svg viewBox="${box.x.toFixed(1)} ${box.y.toFixed(1)} ${box.w.toFixed(1)} ${box.h.toFixed(1)}" role="img" aria-label="${label}">${DEFS}<g class="sk-scene"></g></svg><svg class="sk-ring" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="16" class="sk-ring-bg"/><circle cx="20" cy="20" r="16" class="sk-ring-fg" pathLength="100" stroke-dasharray="0 100"/></svg><span class="sk-step"></span></div><div class="sk-bar"><button type="button" class="sk-play" aria-label="Pausa">${PAUSE}</button><p class="sk-cue" aria-live="polite"></p><button type="button" class="sk-speed" aria-label="Byt hastighet">1×</button></div><div class="sk-progress"><span></span></div>`;
  const scene = el.querySelector('.sk-scene'), cue = el.querySelector('.sk-cue'), ring = el.querySelector('.sk-ring'), ringFg = el.querySelector('.sk-ring-fg'), step = el.querySelector('.sk-step'), prog = el.querySelector('.sk-progress span'), play = el.querySelector('.sk-play'), speedBtn = el.querySelector('.sk-speed');
  let playing = !reduced, speed = 1, time = 0, last = performance.now(), lastCue = -1, frameId = 0, visible = true, manualFrame = 0;
  const draw = () => {
    const s = playing ? sample(anim, time) : {pose: anim.frames[manualFrame].p, i: manualFrame, phase: 'hold', u: 1, frame: anim.frames[manualFrame]};
    scene.innerHTML = sceneSVG(anim, s.pose, box, {focus: s.frame.focus, ghosts: ghostPoses});
    if (s.i !== lastCue) {
      // A frame with move: 0 is a deliberate reset (e.g. jump back up): fade instead of snapping.
      const prev = anim.frames[(s.i - 1 + anim.frames.length) % anim.frames.length];
      if (playing && lastCue !== -1 && prev.move === 0 && scene.animate) scene.animate([{opacity: 0}, {opacity: 1}], {duration: 320, easing: 'ease-out'});
      lastCue = s.i; cue.classList.remove('in'); void cue.offsetWidth;
      cue.textContent = s.frame.cue || ''; cue.classList.add('in');
      step.textContent = `${s.i + 1}/${anim.frames.length}`;
    }
    const timed = s.frame.timer && s.phase === 'hold';
    ring.classList.toggle('on', !!timed);
    if (timed) ringFg.setAttribute('stroke-dasharray', `${(s.u * 100).toFixed(1)} 100`);
    prog.style.width = ((time % anim.total) / anim.total * 100).toFixed(2) + '%';
  };
  const loop = now => {
    if (!el.isConnected) { caf(frameId); observer?.disconnect(); return; }
    const dt = Math.min(64, now - last); last = now;
    if (playing && visible) { time += dt * speed; draw(); }
    frameId = raf(loop);
  };
  const observer = 'IntersectionObserver' in globalThis ? new IntersectionObserver(([e]) => { visible = e.isIntersecting; }) : null;
  observer?.observe(el);
  play.addEventListener('click', e => {
    e.stopPropagation();
    if (playing) { playing = false; manualFrame = sample(anim, time).i; }
    else if (reduced && !el.dataset.started) { el.dataset.started = '1'; playing = true; }
    else playing = true;
    play.innerHTML = playing ? PAUSE : PLAY; play.setAttribute('aria-label', playing ? 'Pausa' : 'Spela');
    draw();
  });
  speedBtn.addEventListener('click', e => { e.stopPropagation(); speed = speed === 1 ? .5 : speed === .5 ? .25 : 1; speedBtn.textContent = speed === 1 ? '1×' : speed === .5 ? '½×' : '¼×'; });
  el.querySelector('.sk-stage').addEventListener('click', () => {
    if (playing) return;
    manualFrame = (manualFrame + 1) % anim.frames.length; lastCue = -1; draw();
  });
  if (!playing) { play.innerHTML = PLAY; play.setAttribute('aria-label', 'Spela'); manualFrame = anim.key ?? 0; }
  draw();
  frameId = raf(loop);
  return {stop: () => { caf(frameId); observer?.disconnect(); }};
}
const PLAY = '<svg viewBox="0 0 24 24" class="i"><path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/></svg>';
const PAUSE = '<svg viewBox="0 0 24 24" class="i"><path d="M8 5v14M16 5v14"/></svg>';
