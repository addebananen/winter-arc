// Key poses for the exercise figure (src/figure.js). Side view faces right; front view faces the viewer.
// Each key: p = pelvis (hip joint) [x, y], t = torso lean in degrees (0 upright, 90 face-down horizontal,
// -90 lying on the back with the head to the left), h = head tilt.
// Limbs: ln/lf = near/far leg, an/af = near/far arm (front view: n = screen right, f is mirrored).
//   w: [x, y] world target for the ankle or wrist   r: [dx, dy] from the hip or shoulder
//   l: [along, forward] from the hip or shoulder in body coordinates
//   a1/a2: angles instead of a target (thigh + knee bend, upper arm + elbow bend). 0 down, 90 forward, 180 up.
//   pref: [x, y] which way the knee or elbow points; foot: foot angle.
// Ground is y = 150; an ankle standing on the floor is at y = 146.
const G = 146;
const legs = (x = 98, far = 92) => ({ln: {w: [x, G], foot: 90}, lf: {w: [far, G], foot: 90}});
const hang = {an: {r: [3, 46]}, af: {r: [-1, 46]}};
const stand = (extra = {}) => ({p: [96, 75], t: 2, limbs: {...legs(), ...hang, ...extra}});
const seatedLegs = (x = 122) => ({ln: {w: [x, G], foot: 90}, lf: {w: [x - 5, G], foot: 90}});

export const poses = {
  // ---------- squat & hinge ----------
  squat: {keys: [
    {p: [94, 75], t: 6, limbs: {...legs(100, 96), an: {l: [-1, -9], pref: [-1, .5]}, af: {l: [-1, -9], pref: [-1, .5]}}},
    {p: [70, 113], t: 44, limbs: {...legs(100, 96), an: {l: [-1, -9], pref: [-1, .5]}, af: {l: [-1, -9], pref: [-1, .5]}}},
  ], scene: []},
  'goblet-squat': {keys: [
    {p: [94, 75], t: 4, limbs: {...legs(100, 96), an: {l: [-12, 12], pref: [0, 1]}, af: {l: [-12, 12], pref: [0, 1]}}},
    {p: [76, 116], t: 30, limbs: {...legs(102, 98), an: {l: [-12, 12], pref: [0, 1]}, af: {l: [-12, 12], pref: [0, 1]}}},
  ], equipment: 'Hantlar', dumbbellAlong: true},
  'sissy-squat': {keys: [
    {p: [94, 75], t: 2, limbs: {...legs(100, 96), an: {l: [-6, 26], pref: [0, 1]}, af: {l: [-6, 26], pref: [0, 1]}}},
    {p: [92, 112], t: -28, limbs: {ln: {w: [100, 140], foot: 60}, lf: {w: [96, 140], foot: 60}, an: {l: [-6, 26], pref: [0, 1]}, af: {l: [-6, 26], pref: [0, 1]}}},
  ]},
  hinge: {keys: [
    {p: [74, 101], t: 64, limbs: {...legs(102, 98), an: {w: [102, 128]}, af: {w: [102, 128]}}},
    {p: [93, 75], t: 3, limbs: {...legs(102, 98), an: {r: [5, 46]}, af: {r: [5, 46]}}},
  ]},
  lunge: {keys: [
    {p: [92, 76], t: 2, limbs: {ln: {w: [116, G], foot: 90}, lf: {w: [62, 140], foot: 40, pref: [1, .4]}, an: {r: [1, 46]}, af: {r: [-2, 46]}}},
    {p: [88, 108], t: 4, limbs: {ln: {w: [116, G], foot: 90}, lf: {w: [58, 140], foot: 40, pref: [0, 1]}, an: {r: [1, 46]}, af: {r: [-2, 46]}}},
  ], dumbbellAlong: false},
  bulgarian: {keys: [
    {p: [90, 78], t: 6, limbs: {ln: {w: [114, G], foot: 90}, lf: {w: [52, 112], foot: 20, pref: [1, .4]}, an: {r: [1, 46]}, af: {r: [-2, 46]}}},
    {p: [84, 108], t: 14, limbs: {ln: {w: [114, G], foot: 90}, lf: {w: [52, 112], foot: 20, pref: [0, 1]}, an: {r: [1, 46]}, af: {r: [-2, 46]}}},
  ], scene: [['bench', 30, 70, 114]]},
  'leg-press': {keys: [
    {p: [74, 116], t: -58, limbs: {ln: {w: [104, 84], foot: 150, pref: [-1, -1]}, lf: {w: [100, 86], foot: 150, pref: [-1, -1]}, an: {w: [86, 124]}, af: {w: [84, 124]}}},
    {p: [74, 116], t: -58, limbs: {ln: {w: [130, 60], foot: 150, pref: [-1, -1]}, lf: {w: [126, 62], foot: 150, pref: [-1, -1]}, an: {w: [86, 124]}, af: {w: [84, 124]}}},
  ], sled: true, scene: [['line', 34, 96, 66, 124, 9], ['line', 64, 124, 98, 124, 9], ['post', 80, 128], ['line', 120, 140, 176, 40, 3]]},
  'leg-curl': {keys: [
    {p: [84, 106], t: -12, limbs: {ln: {a1: 84, a2: 0, foot: 170}, lf: {a1: 84, a2: 0, foot: 170}, an: {w: [92, 112]}, af: {w: [90, 112]}}},
    {p: [84, 106], t: -12, limbs: {ln: {a1: 84, a2: 100, foot: 80}, lf: {a1: 84, a2: 100, foot: 80}, an: {w: [92, 112]}, af: {w: [90, 112]}}},
  ], pad: true, scene: [['line', 62, 114, 112, 114, 8], ['line', 62, 114, 70, 64, 8], ['post', 88, 118]]},
  'leg-extension': {keys: [
    {p: [84, 106], t: -8, limbs: {ln: {a1: 86, a2: 92, foot: 86}, lf: {a1: 86, a2: 92, foot: 86}, an: {w: [92, 112]}, af: {w: [90, 112]}}},
    {p: [84, 106], t: -8, limbs: {ln: {a1: 86, a2: 2, foot: 176}, lf: {a1: 86, a2: 2, foot: 176}, an: {w: [92, 112]}, af: {w: [90, 112]}}},
  ], pad: true, scene: [['line', 62, 114, 112, 114, 8], ['line', 62, 114, 70, 64, 8], ['post', 88, 118]]},
  nordic: {keys: [
    {p: [96, 110], t: 0, limbs: {ln: {w: [60, 144], foot: 0, pref: [0, 1]}, lf: {w: [58, 144], foot: 0, pref: [0, 1]}, an: {l: [-10, 14]}, af: {l: [-10, 14]}}},
    {p: [80, 116], t: -34, limbs: {ln: {w: [60, 144], foot: 0, pref: [0, 1]}, lf: {w: [58, 144], foot: 0, pref: [0, 1]}, an: {l: [-10, 14]}, af: {l: [-10, 14]}}},
  ], scene: [['mat', 40, 130]]},
  'deep-squat': {keys: [
    {p: [82, 120], t: 26, limbs: {...legs(100, 96), an: {l: [-10, 22], pref: [0, 1]}, af: {l: [-10, 22], pref: [0, 1]}}},
    {p: [82, 122], t: 30, limbs: {...legs(100, 96), an: {l: [-10, 22], pref: [0, 1]}, af: {l: [-10, 22], pref: [0, 1]}}},
  ]},

  // ---------- presses ----------
  bench: {keys: [
    {p: [114, 107], t: -90, limbs: {ln: {w: [140, G], foot: 90}, lf: {w: [136, G], foot: 90}, an: {w: [86, 90]}, af: {w: [86, 90]}}},
    {p: [114, 107], t: -90, limbs: {ln: {w: [140, G], foot: 90}, lf: {w: [136, G], foot: 90}, an: {w: [77, 60]}, af: {w: [77, 60]}}},
  ], scene: [['bench', 54, 132, 113]]},
  incline: {keys: [
    {p: [96, 110], t: -58, limbs: {ln: {w: [128, G], foot: 90}, lf: {w: [124, G], foot: 90}, an: {r: [12, -9]}, af: {r: [12, -9]}}},
    {p: [96, 110], t: -58, limbs: {ln: {w: [128, G], foot: 90}, lf: {w: [124, G], foot: 90}, an: {r: [6, -46]}, af: {r: [6, -46]}}},
  ], scene: [['pad', 96, 117, 56, 82], ['line', 82, 118, 108, 118, 7], ['post', 88, 120], ['post', 64, 92]]},
  'chest-press': {keys: [
    {p: [88, 108], t: -6, limbs: {...seatedLegs(118), an: {r: [16, 9]}, af: {r: [16, 9]}}},
    {p: [88, 108], t: -6, limbs: {...seatedLegs(118), an: {r: [46, 7]}, af: {r: [46, 7]}}},
  ], equipment: 'none', handles: true, scene: [['line', 70, 115, 112, 115, 8], ['line', 74, 115, 76, 62, 8], ['post', 92, 119], ['post', 152, 30], ['line', 152, 76, 140, 76, 4]]},
  press: {keys: [
    {p: [95, 75], t: 0, h: -6, limbs: {...legs(100, 96), an: {r: [9, -6], pref: [.3, 1]}, af: {r: [9, -6], pref: [.3, 1]}}},
    {p: [95, 75], t: -3, limbs: {...legs(100, 96), an: {r: [3, -47]}, af: {r: [3, -47]}}},
  ]},
  'seated-press': {keys: [
    {p: [90, 110], t: -2, h: -4, limbs: {...seatedLegs(120), an: {r: [7, -8], pref: [.3, 1]}, af: {r: [7, -8], pref: [.3, 1]}}},
    {p: [90, 110], t: -2, limbs: {...seatedLegs(120), an: {r: [2, -47]}, af: {r: [2, -47]}}},
  ], scene: [['line', 70, 117, 112, 117, 8], ['line', 76, 117, 78, 60, 8], ['post', 92, 121]]},
  pushup: {keys: [
    {p: [106, 117], t: 67, limbs: {ln: {w: [40, 140], foot: 40}, lf: {w: [40, 140], foot: 40}, an: {w: [143, 146]}, af: {w: [141, 146]}}},
    {p: [111, 134], t: 82, limbs: {ln: {w: [40, 140], foot: 40}, lf: {w: [40, 140], foot: 40}, an: {w: [143, 146], pref: [-1, -1]}, af: {w: [141, 146], pref: [-1, -1]}}},
  ], scene: [['mat', 30, 160]]},
  plank: {keys: [{p: [100, 132], t: 80, limbs: {ln: {w: [32, 140], foot: 40}, lf: {w: [32, 140], foot: 40}, an: {a1: 4, a2: 86}, af: {a1: 4, a2: 86}}}], scene: [['mat', 24, 160]]},
  dip: {keys: [
    {p: [96, 62], t: 6, limbs: {ln: {a1: 8, a2: 70, foot: 20}, lf: {a1: 2, a2: 76, foot: 20}, an: {w: [100, 70]}, af: {w: [100, 70]}}},
    {p: [88, 88], t: 22, limbs: {ln: {a1: 16, a2: 70, foot: 20}, lf: {a1: 10, a2: 76, foot: 20}, an: {w: [100, 70], pref: [-1, -.2]}, af: {w: [100, 70], pref: [-1, -.2]}}},
  ], equipment: 'none', scene: [['bar', 86, 140, 77], ['post', 134, 77]]},
  fly: {view: 'front', keys: [
    {p: [96, 74], t: 0, limbs: {...{ln: {w: [104, G], foot: 0}}, an: {r: [42, 6], pref: [0, 1]}}},
    {p: [96, 74], t: 0, limbs: {...{ln: {w: [104, G], foot: 0}}, an: {r: [-11, 26], pref: [.6, 1]}}},
  ], anchor: [[176, 26], [16, 26], 'pair']},
  'db-fly': {keys: [
    {p: [114, 107], t: -90, limbs: {ln: {w: [140, G], foot: 90}, lf: {w: [136, G], foot: 90}, an: {w: [74, 61]}, af: {w: [74, 61]}}},
    {p: [114, 107], t: -90, limbs: {ln: {w: [140, G], foot: 90}, lf: {w: [136, G], foot: 90}, an: {w: [72, 98], pref: [0, 1]}, af: {w: [72, 98], pref: [0, 1]}}},
  ], scene: [['bench', 54, 132, 113]]},
  skullcrusher: {keys: [
    {p: [114, 107], t: -90, limbs: {ln: {w: [140, G], foot: 90}, lf: {w: [136, G], foot: 90}, an: {a1: 194, a2: 0}, af: {a1: 194, a2: 0}}},
    {p: [114, 107], t: -90, limbs: {ln: {w: [140, G], foot: 90}, lf: {w: [136, G], foot: 90}, an: {a1: 200, a2: 112}, af: {a1: 200, a2: 112}}},
  ], scene: [['bench', 54, 132, 113]]},
  pullover: {keys: [
    {p: [114, 107], t: -90, limbs: {ln: {w: [140, G], foot: 90}, lf: {w: [136, G], foot: 90}, an: {a1: 184, a2: 12}, af: {a1: 184, a2: 12}}},
    {p: [114, 107], t: -90, limbs: {ln: {w: [140, G], foot: 90}, lf: {w: [136, G], foot: 90}, an: {a1: 262, a2: 14}, af: {a1: 262, a2: 14}}},
  ], scene: [['bench', 54, 132, 113]]},
  'side-lying': {keys: [
    {p: [114, 107], t: -90, limbs: {ln: {w: [140, G], foot: 90}, lf: {w: [136, G], foot: 90}, an: {a1: 98, a2: 6}, af: {w: [84, 112]}}},
    {p: [114, 107], t: -90, limbs: {ln: {w: [140, G], foot: 90}, lf: {w: [136, G], foot: 90}, an: {a1: 178, a2: 6}, af: {w: [84, 112]}}},
  ], scene: [['bench', 54, 132, 113]]},

  // ---------- pulls ----------
  row: {keys: [
    {p: [80, 82], t: 68, limbs: {...legs(102, 98), an: {r: [-1, 46]}, af: {r: [-1, 46]}}},
    {p: [80, 82], t: 66, limbs: {...legs(102, 98), an: {l: [-14, 11], pref: [-.4, -1]}, af: {l: [-14, 11], pref: [-.4, -1]}}},
  ]},
  'supported-row': {keys: [
    {p: [82, 98], t: 46, limbs: {ln: {w: [64, G], foot: 90}, lf: {w: [60, G], foot: 90}, an: {r: [2, 46]}, af: {r: [2, 46]}}},
    {p: [82, 98], t: 46, limbs: {ln: {w: [64, G], foot: 90}, lf: {w: [60, G], foot: 90}, an: {l: [-12, 11], pref: [-.4, -1]}, af: {l: [-12, 11], pref: [-.4, -1]}}},
  ], scene: [['pad', 88, 104, 126, 66], ['post', 106, 88]]},
  pull: {view: 'front', keys: [
    {p: [96, 70], t: 0, limbs: {ln: {a1: 3, a2: 6, foot: 3}, an: {w: [128, -16]}}},
    {p: [96, 38], t: 0, limbs: {ln: {a1: 4, a2: 8, foot: 4}, an: {w: [128, -16], pref: [1, 1]}}},
  ], equipment: 'none', scene: [['bar', 40, 152, -23], ['post', 44, -23], ['post', 148, -23]]},
  pulldown: {keys: [
    {p: [88, 108], t: -8, limbs: {...seatedLegs(118), an: {r: [6, -46]}, af: {r: [6, -46]}}},
    {p: [88, 108], t: -16, limbs: {...seatedLegs(118), an: {r: [12, 2], pref: [-.6, 1]}, af: {r: [12, 2], pref: [-.6, 1]}}},
  ], anchor: [96, 6], scene: [['line', 70, 115, 112, 115, 8], ['post', 92, 119], ['line', 106, 96, 126, 96, 6], ['post', 148, 6], ['line', 96, 6, 148, 6, 4], ['pulley', 96, 6]]},
  'one-pull': {keys: [
    {p: [88, 108], t: -6, limbs: {...seatedLegs(118), an: {r: [8, -46]}, af: {l: [-14, 10]}}},
    {p: [88, 108], t: -12, limbs: {...seatedLegs(118), an: {r: [8, 4], pref: [-.6, 1]}, af: {l: [-14, 10]}}},
  ], anchor: [98, 6], scene: [['line', 70, 115, 112, 115, 8], ['post', 92, 119], ['line', 106, 96, 126, 96, 6], ['post', 148, 6], ['line', 98, 6, 148, 6, 4], ['pulley', 98, 6]]},
  'seated-row': {keys: [
    {p: [66, 128], t: 22, limbs: {ln: {w: [124, 128], foot: 160}, lf: {w: [120, 130], foot: 160}, an: {w: [140, 116]}, af: {w: [138, 117]}}},
    {p: [66, 128], t: -8, limbs: {ln: {w: [124, 128], foot: 160}, lf: {w: [120, 130], foot: 160}, an: {l: [18, 12], pref: [-1, .2]}, af: {l: [18, 12], pref: [-1, .2]}}},
  ], anchor: [178, 118], scene: [['line', 40, 136, 96, 136, 8], ['post', 66, 140], ['line', 128, 112, 134, 150, 5], ['post', 178, 60], ['pulley', 178, 118]]},
  facepull: {keys: [
    {p: [92, 75], t: -4, limbs: {...legs(98, 92), an: {r: [44, -10]}, af: {r: [44, -10]}}},
    {p: [92, 75], t: -6, limbs: {...legs(98, 92), an: {r: [10, -16], pref: [-.4, -1]}, af: {r: [10, -16], pref: [-.4, -1]}}},
  ], anchor: [182, 28], scene: [['post', 182, 10], ['pulley', 182, 28]]},
  hang: {view: 'front', keys: [{p: [96, 74], t: 0, limbs: {ln: {a1: 4, a2: 8, foot: 4}, an: {w: [124, -16]}}}], scene: [['bar', 40, 152, -23], ['post', 44, -23], ['post', 148, -23]]},
  climb: {view: 'front', keys: [
    {p: [96, 80], t: 0, limbs: {ln: {a1: 30, a2: 70, foot: 10}, lf: {a1: -4, a2: -30, foot: -4}, an: {w: [116, 2]}, af: {w: [80, 30]}}},
    {p: [96, 74], t: 0, limbs: {ln: {a1: 4, a2: 30, foot: 4}, lf: {a1: -30, a2: -70, foot: -10}, an: {w: [114, 32]}, af: {w: [78, 0]}}},
  ], scene: [['line', 40, 4, 40, 150, 6]]},

  // ---------- arms & shoulders ----------
  curl: {keys: [
    {p: [95, 75], t: 0, limbs: {...legs(100, 96), an: {r: [4, 46]}, af: {r: [4, 46]}}},
    {p: [95, 75], t: -2, limbs: {...legs(100, 96), an: {r: [13, 5], pref: [-.2, 1]}, af: {r: [13, 5], pref: [-.2, 1]}}},
  ], anchor: [128, 148], sceneFor: {Kabel: [['post', 140, 40], ['pulley', 128, 148]]}},
  preacher: {keys: [
    {p: [84, 108], t: 14, limbs: {...seatedLegs(116), an: {a1: 42, a2: 4}, af: {a1: 42, a2: 4}}},
    {p: [84, 108], t: 14, limbs: {...seatedLegs(116), an: {a1: 42, a2: 118}, af: {a1: 42, a2: 118}}},
  ], scene: [['line', 64, 115, 100, 115, 8], ['post', 82, 119], ['pad', 102, 80, 124, 102], ['post', 118, 100]]},
  'incline-curl': {keys: [
    {p: [96, 110], t: -38, limbs: {ln: {w: [128, G], foot: 90}, lf: {w: [124, G], foot: 90}, an: {a1: -4, a2: 2}, af: {a1: -4, a2: 2}}},
    {p: [96, 110], t: -38, limbs: {ln: {w: [128, G], foot: 90}, lf: {w: [124, G], foot: 90}, an: {a1: -4, a2: 132}, af: {a1: -4, a2: 132}}},
  ], scene: [['pad', 96, 117, 70, 80], ['line', 82, 118, 108, 118, 7], ['post', 90, 120], ['post', 76, 92]]},
  bayesian: {keys: [
    {p: [100, 75], t: 8, limbs: {ln: {w: [116, G], foot: 90}, lf: {w: [84, G], foot: 90}, an: {a1: -28, a2: 4}, af: {r: [6, 46]}}},
    {p: [100, 75], t: 8, limbs: {ln: {w: [116, G], foot: 90}, lf: {w: [84, G], foot: 90}, an: {a1: -28, a2: 128}, af: {r: [6, 46]}}},
  ], anchor: [28, 128], scene: [['post', 28, 20], ['pulley', 28, 128]]},
  pushdown: {keys: [
    {p: [94, 75], t: 10, limbs: {...legs(100, 96), an: {r: [17, 13], pref: [-1, .4]}, af: {r: [17, 13], pref: [-1, .4]}}},
    {p: [94, 75], t: 10, limbs: {...legs(100, 96), an: {r: [10, 45]}, af: {r: [10, 45]}}},
  ], anchor: [124, 6], scene: [['post', 150, 6], ['line', 124, 6, 150, 6, 4], ['pulley', 124, 6]]},
  overhead: {keys: [
    {p: [96, 75], t: 8, limbs: {ln: {w: [116, G], foot: 90}, lf: {w: [84, G], foot: 90}, an: {a1: 168, a2: 128}, af: {a1: 168, a2: 128}}},
    {p: [96, 75], t: 8, limbs: {ln: {w: [116, G], foot: 90}, lf: {w: [84, G], foot: 90}, an: {a1: 166, a2: 8}, af: {a1: 166, a2: 8}}},
  ], anchor: [40, 140], sceneFor: {Kabel: [['post', 30, 20], ['pulley', 40, 140]]}},
  kickback: {keys: [
    {p: [76, 84], t: 72, limbs: {...legs(98, 74), an: {a1: -72, a2: 82}, af: {w: [128, 118]}}},
    {p: [76, 84], t: 72, limbs: {...legs(98, 74), an: {a1: -72, a2: -4}, af: {w: [128, 118]}}},
  ], anchor: [150, 140], sceneFor: {Kabel: [['post', 156, 30], ['pulley', 150, 140]], Hantlar: [['bench', 112, 166, 120]]}},
  lateral: {view: 'front', keys: [
    {p: [96, 74], t: 0, limbs: {ln: {w: [104, G], foot: 0}, an: {r: [6, 46], pref: [1, .2]}}},
    {p: [96, 74], t: 0, limbs: {ln: {w: [104, G], foot: 0}, an: {r: [45, 4], pref: [0, 1]}}},
  ], anchor: [[40, 148], [152, 148], 'pair']},
  'y-raise': {view: 'front', keys: [
    {p: [96, 74], t: 0, limbs: {ln: {w: [104, G], foot: 0}, an: {r: [-4, 44], pref: [1, .2]}}},
    {p: [96, 74], t: 0, limbs: {ln: {w: [104, G], foot: 0}, an: {r: [28, -38], pref: [1, .4]}}},
  ], anchor: [[40, 148], [152, 148], 'pair']},
  'reverse-fly': {view: 'front', keys: [
    {p: [96, 74], t: 0, limbs: {ln: {w: [104, G], foot: 0}, an: {r: [-11, 26], pref: [.6, 1]}}},
    {p: [96, 74], t: 0, limbs: {ln: {w: [104, G], foot: 0}, an: {r: [44, 4], pref: [0, 1]}}},
  ], anchor: [[16, 40], [176, 40], 'pair']},
  dislocate: {keys: [
    {p: [95, 75], t: 0, limbs: {...legs(100, 96), an: {a1: 34, a2: 0}, af: {a1: 34, a2: 0}}},
    {p: [95, 75], t: 0, limbs: {...legs(100, 96), an: {a1: 226, a2: 0}, af: {a1: 226, a2: 0}}},
  ]},

  // ---------- core ----------
  situp: {keys: [
    {p: [104, 140], t: -90, limbs: {ln: {w: [140, G], foot: 90}, lf: {w: [136, G], foot: 90}, an: {l: [-8, 10], pref: [0, -1]}, af: {l: [-8, 10], pref: [0, -1]}}},
    {p: [104, 140], t: -14, limbs: {ln: {w: [140, G], foot: 90}, lf: {w: [136, G], foot: 90}, an: {l: [-8, 10], pref: [-1, 0]}, af: {l: [-8, 10], pref: [-1, 0]}}},
  ], scene: [['mat', 40, 160]]},
  crunch: {keys: [
    {p: [104, 140], t: -90, limbs: {ln: {w: [140, G], foot: 90}, lf: {w: [136, G], foot: 90}, an: {l: [-8, 10], pref: [0, -1]}, af: {l: [-8, 10], pref: [0, -1]}}},
    {p: [104, 140], t: -58, limbs: {ln: {w: [140, G], foot: 90}, lf: {w: [136, G], foot: 90}, an: {l: [-8, 10], pref: [0, -1]}, af: {l: [-8, 10], pref: [0, -1]}}},
  ], scene: [['mat', 40, 160]]},
  'reverse-crunch': {keys: [
    {p: [104, 140], t: -90, limbs: {ln: {a1: 178, a2: 88, foot: 180}, lf: {a1: 178, a2: 88, foot: 180}, an: {w: [100, 146]}, af: {w: [100, 146]}}},
    {p: [100, 134], t: -96, limbs: {ln: {a1: 222, a2: 92, foot: 220}, lf: {a1: 222, a2: 92, foot: 220}, an: {w: [100, 146]}, af: {w: [100, 146]}}},
  ], scene: [['mat', 40, 160]]},
  'v-up': {keys: [
    {p: [104, 140], t: -90, limbs: {ln: {a1: 90, a2: 0, foot: 180}, lf: {a1: 90, a2: 0, foot: 180}, an: {a1: 268, a2: 0}, af: {a1: 268, a2: 0}}},
    {p: [104, 140], t: -42, limbs: {ln: {a1: 138, a2: 0, foot: 222}, lf: {a1: 138, a2: 0, foot: 222}, an: {a1: 128, a2: 0}, af: {a1: 128, a2: 0}}},
  ], scene: [['mat', 30, 170]]},
  twist: {keys: [
    {p: [96, 138], t: -34, limbs: {ln: {a1: 122, a2: 84, foot: 120}, lf: {a1: 122, a2: 84, foot: 120}, an: {l: [-14, 22], pref: [0, 1]}, af: {l: [-14, 22], pref: [0, 1]}}},
    {p: [96, 138], t: -30, limbs: {ln: {a1: 122, a2: 84, foot: 120}, lf: {a1: 122, a2: 84, foot: 120}, an: {l: [-32, 10], pref: [0, 1]}, af: {l: [-32, 10], pref: [0, 1]}}},
  ], scene: [['mat', 40, 160]]},
  'leg-raise': {keys: [
    {p: [104, 140], t: -90, limbs: {ln: {a1: 92, a2: 0, foot: 180}, lf: {a1: 92, a2: 0, foot: 180}, an: {w: [100, 146]}, af: {w: [100, 146]}}},
    {p: [104, 140], t: -90, limbs: {ln: {a1: 176, a2: 0, foot: 266}, lf: {a1: 176, a2: 0, foot: 266}, an: {w: [100, 146]}, af: {w: [100, 146]}}},
  ], scene: [['mat', 30, 170]]},
  'captains-chair': {keys: [
    {p: [96, 70], t: 0, limbs: {ln: {a1: 2, a2: 4, foot: 30}, lf: {a1: -2, a2: 4, foot: 30}, an: {a1: 4, a2: 88}, af: {a1: 4, a2: 88}}},
    {p: [96, 70], t: -6, limbs: {ln: {a1: 100, a2: 92, foot: 30}, lf: {a1: 100, a2: 92, foot: 30}, an: {a1: 4, a2: 88}, af: {a1: 4, a2: 88}}},
  ], scene: [['line', 74, 60, 126, 60, 7], ['line', 72, 20, 72, 150, 6], ['line', 72, 110, 104, 128, 6]]},
  'hanging-knee': {keys: [
    {p: [100, 72], t: 0, limbs: {ln: {a1: 2, a2: 12, foot: 20}, lf: {a1: -2, a2: 14, foot: 20}, an: {w: [104, -16]}, af: {w: [104, -16]}}},
    {p: [100, 68], t: -12, limbs: {ln: {a1: 104, a2: 104, foot: 40}, lf: {a1: 100, a2: 108, foot: 40}, an: {w: [104, -16]}, af: {w: [104, -16]}}},
  ], scene: [['bar', 60, 150, -22], ['post', 146, -22]]},
  'hanging-raise': {keys: [
    {p: [100, 72], t: 0, limbs: {ln: {a1: 2, a2: 6, foot: 20}, lf: {a1: -2, a2: 8, foot: 20}, an: {w: [104, -16]}, af: {w: [104, -16]}}},
    {p: [100, 68], t: -16, limbs: {ln: {a1: 100, a2: 2, foot: 184}, lf: {a1: 98, a2: 4, foot: 184}, an: {w: [104, -16]}, af: {w: [104, -16]}}},
  ], scene: [['bar', 60, 150, -22], ['post', 146, -22]]},
  'ab-wheel': {keys: [
    {p: [76, 108], t: 58, limbs: {ln: {w: [40, 144], foot: 0, pref: [0, 1]}, lf: {w: [38, 144], foot: 0, pref: [0, 1]}, an: {w: [110, 140]}, af: {w: [110, 140]}}},
    {p: [96, 128], t: 82, limbs: {ln: {w: [40, 144], foot: 0, pref: [0, 1]}, lf: {w: [38, 144], foot: 0, pref: [0, 1]}, an: {w: [168, 140]}, af: {w: [168, 140]}}},
  ], wheel: true, scene: [['mat', 24, 186]]},
  'cable-crunch': {keys: [
    {p: [96, 110], t: 12, limbs: {ln: {w: [60, 144], foot: 0, pref: [0, 1]}, lf: {w: [58, 144], foot: 0, pref: [0, 1]}, an: {l: [6, 6], pref: [1, .4]}, af: {l: [6, 6], pref: [1, .4]}}},
    {p: [94, 110], t: 78, limbs: {ln: {w: [60, 144], foot: 0, pref: [0, 1]}, lf: {w: [58, 144], foot: 0, pref: [0, 1]}, an: {l: [6, 6], pref: [1, .4]}, af: {l: [6, 6], pref: [1, .4]}}},
  ], anchor: [120, 6], scene: [['post', 150, 6], ['line', 120, 6, 150, 6, 4], ['pulley', 120, 6], ['mat', 40, 130]]},

  // ---------- mobility ----------
  'kneel-lunge': {keys: [
    {p: [92, 106], t: 0, limbs: {ln: {w: [124, G], foot: 90}, lf: {w: [44, 144], foot: 0, pref: [0, 1]}, an: {l: [-8, 14]}, af: {l: [-8, 14]}}},
    {p: [102, 110], t: -6, limbs: {ln: {w: [124, G], foot: 90}, lf: {w: [44, 144], foot: 0, pref: [0, 1]}, an: {l: [-8, 14]}, af: {l: [-8, 14]}}},
  ], scene: [['mat', 30, 150]]},
  pigeon: {keys: [
    {p: [92, 128], t: 2, limbs: {ln: {w: [104, 144], foot: 170, pref: [1, -.2]}, lf: {w: [30, 146], foot: 0, pref: [0, 1]}, an: {w: [112, 148]}, af: {w: [110, 148]}}},
    {p: [92, 130], t: 64, limbs: {ln: {w: [104, 144], foot: 170, pref: [1, -.2]}, lf: {w: [30, 146], foot: 0, pref: [0, 1]}, an: {w: [150, 148]}, af: {w: [148, 148]}}},
  ], scene: [['mat', 20, 170]]},
  'reach-lunge': {keys: [
    {p: [90, 116], t: 62, limbs: {ln: {w: [124, G], foot: 90}, lf: {w: [36, 140], foot: 40, pref: [0, 1]}, an: {w: [118, 148]}, af: {w: [116, 148]}}},
    {p: [90, 116], t: 52, limbs: {ln: {w: [124, G], foot: 90}, lf: {w: [36, 140], foot: 40, pref: [0, 1]}, an: {l: [10, -40]}, af: {w: [116, 148]}}},
  ], scene: [['mat', 24, 160]]},
  ninety: {keys: [
    {p: [96, 136], t: 0, limbs: {ln: {a1: 86, a2: 150, foot: 70}, lf: {a1: -86, a2: -110, foot: -60}, an: {w: [118, 148]}, af: {w: [76, 148]}}},
    {p: [96, 136], t: 34, limbs: {ln: {a1: 86, a2: 150, foot: 70}, lf: {a1: -86, a2: -110, foot: -60}, an: {w: [124, 148]}, af: {w: [120, 148]}}},
  ], scene: [['mat', 40, 160]]},
  child: {keys: [
    {p: [70, 126], t: 82, limbs: {ln: {w: [64, 143], foot: -88, pref: [1, .2]}, lf: {w: [62, 143], foot: -88, pref: [1, .2]}, an: {w: [162, 146]}, af: {w: [160, 146]}}},
    {p: [68, 128], t: 88, limbs: {ln: {w: [64, 143], foot: -88, pref: [1, .2]}, lf: {w: [62, 143], foot: -88, pref: [1, .2]}, an: {w: [166, 146]}, af: {w: [164, 146]}}},
  ], scene: [['mat', 40, 186]]},
  cobra: {keys: [
    {p: [86, 140], t: 90, limbs: {ln: {a1: -90, a2: 0, foot: 0}, lf: {a1: -90, a2: 0, foot: 0}, an: {w: [128, 148], pref: [0, -1]}, af: {w: [126, 148], pref: [0, -1]}}},
    {p: [86, 140], t: 58, limbs: {ln: {a1: -90, a2: 0, foot: 0}, lf: {a1: -90, a2: 0, foot: 0}, an: {w: [128, 148], pref: [-1, 0]}, af: {w: [126, 148], pref: [-1, 0]}}},
  ], scene: [['mat', 20, 170]]},
  'open-book': {keys: [
    {p: [110, 138], t: -90, limbs: {ln: {a1: 150, a2: 120, foot: 120}, lf: {a1: 146, a2: 118, foot: 118}, an: {a1: 92, a2: 0}, af: {a1: 92, a2: 0}}},
    {p: [110, 138], t: -90, limbs: {ln: {a1: 150, a2: 120, foot: 120}, lf: {a1: 146, a2: 118, foot: 118}, an: {a1: 238, a2: 0}, af: {a1: 92, a2: 0}}},
  ], scene: [['mat', 30, 170]]},
  'seated-fold': {keys: [
    {p: [70, 138], t: -4, limbs: {ln: {a1: 90, a2: 0, foot: 176}, lf: {a1: 90, a2: 0, foot: 176}, an: {l: [-20, 22]}, af: {l: [-20, 22]}}},
    {p: [70, 138], t: 66, limbs: {ln: {a1: 90, a2: 0, foot: 176}, lf: {a1: 90, a2: 0, foot: 176}, an: {w: [146, 136]}, af: {w: [144, 136]}}},
  ], scene: [['mat', 40, 170]]},
  butterfly: {view: 'front', keys: [
    {p: [96, 132], t: 0, limbs: {ln: {w: [100, 146], foot: 0, pref: [1, -.3]}, an: {w: [100, 146]}}},
    {p: [96, 132], t: 0, limbs: {ln: {w: [100, 141], foot: 0, pref: [1, .5]}, an: {w: [100, 141]}}},
  ], scene: [['mat', 40, 152]]},
  handstand: {keys: [{p: [104, 58], t: 180, limbs: {ln: {a1: 176, a2: 0, foot: 270}, lf: {a1: 174, a2: 2, foot: 270}, an: {w: [104, 146]}, af: {w: [102, 146]}}}], scene: [['wall', 124]]},

  // ---------- cardio ----------
  run: {keys: [
    {p: [96, 76], t: 12, limbs: {ln: {a1: 40, a2: 84, foot: 110}, lf: {a1: -28, a2: 30, foot: 60}, an: {a1: -36, a2: 84}, af: {a1: 36, a2: 92}}},
    {p: [96, 72], t: 12, limbs: {ln: {a1: -28, a2: 30, foot: 60}, lf: {a1: 40, a2: 84, foot: 110}, an: {a1: 36, a2: 92}, af: {a1: -36, a2: 84}}},
  ], dur: 1.1},
  walk: {keys: [
    {p: [96, 75], t: 3, limbs: {ln: {a1: 22, a2: 6, foot: 100}, lf: {a1: -18, a2: 12, foot: 70}, an: {a1: -18, a2: 14}, af: {a1: 18, a2: 18}}},
    {p: [96, 74], t: 3, limbs: {ln: {a1: -18, a2: 12, foot: 70}, lf: {a1: 22, a2: 6, foot: 100}, an: {a1: 18, a2: 18}, af: {a1: -18, a2: 14}}},
  ], dur: 1.8},
  volleyball: {keys: [
    {p: [95, 82], t: 4, limbs: {...legs(102, 92), an: {r: [10, -16], pref: [-.2, 1]}, af: {r: [10, -16], pref: [-.2, 1]}}},
    {p: [95, 74], t: 0, limbs: {...legs(102, 92), an: {r: [8, -46]}, af: {r: [8, -46]}}},
  ]},
};

// Exercise-specific poses (by id), and pose + equipment combinations that need another pose.
export const aliases = {
  bulgarian: 'bulgarian', goblet: 'goblet-squat', sissy: 'sissy-squat', 'db-fly': 'db-fly', 'seated-db-press': 'seated-press',
  'pull|Kabel': 'pulldown', 'press|Maskin': 'seated-press', 'pullover|Kabel': 'pullover-cable', 'fly|Maskin': 'fly',
  'reverse-fly|Hantlar': 'reverse-fly', 'decline-db': 'bench', 'decline-bench': 'bench',
};
poses['pullover-cable'] = {keys: [
  {p: [86, 76], t: 30, limbs: {...legs(104, 98), an: {a1: 150, a2: 8}, af: {a1: 150, a2: 8}}},
  {p: [86, 76], t: 30, limbs: {...legs(104, 98), an: {a1: 8, a2: 8}, af: {a1: 8, a2: 8}}},
], anchor: [176, 20], scene: [['post', 182, 20], ['pulley', 176, 20]]};

// Hands: fists grip by default. Flat hands rest on the floor, open hands reach or rest, loose hands run.
const palms = {pushup: 'flat', cobra: 'flat', child: 'flat', pigeon: 'flat', handstand: 'flat', 'leg-raise': 'flat', 'reverse-crunch': 'flat', ninety: 'flat',
  situp: 'open', crunch: 'open', 'seated-fold': 'open', 'deep-squat': 'open', 'open-book': 'open', nordic: 'open', volleyball: 'open', 'kneel-lunge': 'open', run: 'loose', walk: 'loose'};
for (const [name, style] of Object.entries(palms)) for (const key of poses[name].keys) key.palms ??= style;
{
  const [a, b] = poses['reach-lunge'].keys;
  for (const k of [a, b]) k.limbs.af = {...k.limbs.af, palm: 'flat'};
  a.limbs.an = {...a.limbs.an, palm: 'flat'};
  b.limbs.an = {...b.limbs.an, palm: 'open'};
}
