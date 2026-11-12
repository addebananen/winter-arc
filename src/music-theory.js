// Music theory used by the music skill tree: spelled notes, intervals, chords, scales, the bass
// fretboard, question generators and the bass line rules. Pure functions only (no DOM, no audio),
// so everything here can be tested in Node.

const LETTERS = 'CDEFGAB';
const NATURAL = [0, 2, 4, 5, 7, 9, 11];
const ACC = {'-2': '𝄫', '-1': '♭', '0': '', '1': '♯', '2': '𝄪'};

// Interval = [letter steps, semitones]. Names follow chord-symbol practice (b3 = liten ters).
export const INTERVALS = {
  '1': [0, 0], 'b2': [1, 1], '2': [1, 2], '#2': [1, 3], 'b3': [2, 3], '3': [2, 4], '4': [3, 5], '#4': [3, 6],
  'b5': [4, 6], '5': [4, 7], '#5': [4, 8], 'b6': [5, 8], '6': [5, 9], 'bb7': [6, 9], 'b7': [6, 10], '7': [6, 11],
  '8': [7, 12], 'b9': [8, 13], '9': [8, 14], '#9': [8, 15], '11': [10, 17], '#11': [10, 18], 'b13': [12, 20], '13': [12, 21],
};
export const semis = iv => INTERVALS[iv][1];

// Swedish interval names as they are taught (stor/liten/ren).
export const intervalNames = {
  'b2': 'Liten sekund', '2': 'Stor sekund', 'b3': 'Liten ters', '3': 'Stor ters', '4': 'Ren kvart', '#4': 'Tritonus',
  'b5': 'Tritonus', '5': 'Ren kvint', 'b6': 'Liten sext', '6': 'Stor sext', 'b7': 'Liten septima', '7': 'Stor septima', '8': 'Oktav',
};
// A familiar song start helps the ear remember an interval (classic ear-training anchors).
export const intervalSongs = {
  'b2': 'Hajen (Jaws)', '2': 'Gubben Noak', 'b3': 'Smoke on the Water', '3': 'När helgonen marschera in', '4': 'Här kommer bruden',
  '#4': 'The Simpsons', '5': 'Blinka lilla stjärna', 'b6': 'The Entertainer (hopp upp)', '6': 'My Way (”And now…”)',
  'b7': 'Star Trek-temat', '7': 'Take On Me (refrängens hopp)', '8': 'Somewhere Over the Rainbow',
};

// ---------- notes ----------
// A note is {l: letter index 0–6, a: accidental −2…2, o: octave}. MIDI: C4 = 60.
export function parseNote(name) {
  const m = String(name).match(/^([A-G])(𝄫|♭♭|bb|♭|b|𝄪|##|♯|#)?(-?\d)?$/);
  if (!m) throw Error('Okänd ton: ' + name);
  const a = {'𝄫': -2, '♭♭': -2, bb: -2, '♭': -1, b: -1, '𝄪': 2, '##': 2, '♯': 1, '#': 1}[m[2]] || 0;
  return {l: LETTERS.indexOf(m[1]), a, o: m[3] === undefined ? 4 : Number(m[3])};
}
export const midiOf = n => 12 * (n.o + 1) + NATURAL[n.l] + n.a;
export const nameOf = n => LETTERS[n.l] + ACC[n.a];
export const pcOf = midi => ((midi % 12) + 12) % 12;
export function transpose(note, iv, down = false) {
  const [steps, st] = INTERVALS[iv];
  const s = down ? -steps : steps, total = note.l + s;
  const l = ((total % 7) + 7) % 7, o = note.o + Math.floor(total / 7);
  const target = midiOf(note) + (down ? -st : st), a = target - (12 * (o + 1) + NATURAL[l]);
  return {l, a, o};
}
const SHARP_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
export const pcName = pc => SHARP_NAMES[pcOf(pc)];
export const freqOf = midi => 440 * Math.pow(2, (midi - 69) / 12);
export const midiFromFreq = f => 69 + 12 * Math.log2(f / 440);

// ---------- chords & scales ----------
export const CHORDS = {
  maj: {name: 'Dur', sym: '', tones: ['1', '3', '5']},
  min: {name: 'Moll', sym: 'm', tones: ['1', 'b3', '5']},
  dim: {name: 'Förminskat', sym: '°', tones: ['1', 'b3', 'b5']},
  aug: {name: 'Överstigande', sym: '+', tones: ['1', '3', '#5']},
  sus4: {name: 'Sus4', sym: 'sus4', tones: ['1', '4', '5']},
  maj7: {name: 'Maj7', sym: 'maj7', tones: ['1', '3', '5', '7']},
  dom7: {name: 'Dominant 7', sym: '7', tones: ['1', '3', '5', 'b7']},
  min7: {name: 'Moll 7', sym: 'm7', tones: ['1', 'b3', '5', 'b7']},
  m7b5: {name: 'Halvförminskat', sym: 'm7♭5', tones: ['1', 'b3', 'b5', 'b7']},
};
export const SCALES = {
  major: {name: 'Durskala', steps: ['1', '2', '3', '4', '5', '6', '7', '8']},
  minor: {name: 'Naturlig moll', steps: ['1', '2', 'b3', '4', '5', 'b6', 'b7', '8']},
  minPent: {name: 'Mollpentatonisk', steps: ['1', 'b3', '4', '5', 'b7', '8']},
  majPent: {name: 'Durpentatonisk', steps: ['1', '2', '3', '5', '6', '8']},
  mixo: {name: 'Mixolydisk', steps: ['1', '2', '3', '4', '5', '6', 'b7', '8']},
  dorian: {name: 'Dorisk', steps: ['1', '2', 'b3', '4', '5', '6', 'b7', '8']},
  blues: {name: 'Bluesskala', steps: ['1', 'b3', '4', 'b5', '5', 'b7', '8']},
};
export const chordNotes = (root, q) => CHORDS[q].tones.map(t => transpose(root, t));
export const chordName = (root, q) => nameOf(root) + CHORDS[q].sym;

// What a tone is called relative to the chord, the way a bass player says it.
export const toneLabel = {'1': 'Grundton', 'b3': 'Ters', '3': 'Ters', '5': 'Kvint', 'b5': 'Kvint', '#5': 'Kvint', '4': 'Kvart', 'b7': 'Septima', '7': 'Septima', '9': 'Nona', '11': 'Undecima', '13': 'Tredecima', '6': 'Sext'};
export const degreeLabel = iv => iv.replace('b', '♭').replace('#', '♯');

// Diatonic chords of a major key, used for progressions.
export const DIATONIC = [
  {deg: 'I', iv: '1', q: 'maj'}, {deg: 'ii', iv: '2', q: 'min'}, {deg: 'iii', iv: '3', q: 'min'}, {deg: 'IV', iv: '4', q: 'maj'},
  {deg: 'V', iv: '5', q: 'maj'}, {deg: 'vi', iv: '6', q: 'min'}, {deg: 'vii°', iv: '7', q: 'dim'},
];
export const diatonic = deg => DIATONIC.find(d => d.deg === deg);

// ---------- bass fretboard ----------
// 4-string bass, standard tuning E1 A1 D2 G2. String 0 is the low E.
export const STRINGS = [{name: 'E', midi: 28}, {name: 'A', midi: 33}, {name: 'D', midi: 38}, {name: 'G', midi: 43}];
export const FRETS = 12;
export const fretMidi = (s, f) => STRINGS[s].midi + f;
export const positionsOf = (pc, frets = [0, FRETS], strings = [0, 1, 2, 3]) => {
  const out = [];
  for (const s of strings) for (let f = frets[0]; f <= frets[1]; f++) if (pcOf(fretMidi(s, f)) === pcOf(pc)) out.push([s, f]);
  return out;
};

// ---------- randomness ----------
// Seeded so a round can be replayed in tests.
export function rng(seed = Date.now()) {
  let a = seed >>> 0 || 1;
  const next = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  next.int = n => Math.floor(next() * n);
  next.pick = list => list[Math.floor(next() * list.length)];
  next.shuffle = list => { const c = [...list]; for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; } return c; };
  return next;
}

// Keys that sit well on bass and in most voices.
export const KEYS = ['C', 'G', 'D', 'A', 'E', 'F', 'B♭', 'E♭'];
// Root in octave 3 placed so chords stay between about C3 and C5.
export const keyRoot = (name, octave = 3) => { const n = parseNote(name + octave); return midiOf(n) > 57 ? {...n, o: n.o - 1} : n; };

// ---------- question generators ----------
// Each returns {prompt, options:[{id,label,sub}], answer, play:[audio events], reveal}.
// Audio events: {t: beats from start, notes:[midi], dur: beats, inst:'keys'|'bass'|'click'}.

// Every chord tone placed inside one octave starting at `lo`: a close voicing in a clear register.
const voiceIn = (notes, lo) => notes.map(n => lo + (((n - lo) % 12) + 12) % 12).sort((x, y) => x - y);
export function cadence(root, minor = false) {
  // I–IV–V–I (or i–iv–V–i) to set the key before a functional question. The chords sit around middle C,
  // where a real piano is clear; lower down, close chords turn muddy. The last chord is home: it is
  // longer and stronger and has the key note on top, so the ear lands on it.
  const r = midiOf(root), chord = (iv, q) => CHORDS[q].tones.map(t => r + semis(iv) + semis(t));
  const seq = minor ? [['1', 'min'], ['4', 'min'], ['5', 'maj'], ['1', 'min']] : [['1', 'maj'], ['4', 'maj'], ['5', 'maj'], ['1', 'maj']];
  return seq.flatMap(([iv, q], i) => {
    const last = i === seq.length - 1, top = 64 + (((r - 64) % 12) + 12) % 12;
    const notes = voiceIn(chord(iv, q), last ? top - 11 : 55);
    return [
      {t: i, notes, dur: last ? 1.9 : .9, inst: 'keys', vel: last ? .8 : .5},
      {t: i, notes: [r + semis(iv) - 12 - (semis(iv) > 4 ? 12 : 0)], dur: last ? 1.9 : .9, inst: 'bass', vel: last ? 1 : .8},
    ];
  });
}
// The question note comes after the last chord has rung: this many beats from the start.
const AFTER_CADENCE = 5.4;
// Where a question note is played: in the octave above middle C, sometimes an octave lower.
const noteFor = (R, root, iv) => 60 + pcOf(midiOf(root)) + semis(iv) - (R() < .2 ? 12 : 0);

// How each scale degree feels against the key. This is what to listen for.
export const DEGREE_FEEL = {
  '1': 'Ettan är hemma. Den känns färdig, som sista tonen i en låt.',
  'b2': 'Den låga tvåan ligger tätt över hemma och skaver tills den faller ner till 1.',
  '2': 'Tvåan ligger precis över hemma och vill gärna falla ner till 1.',
  'b3': 'Den låga trean är mörk. Det är den som ger mollfärgen.',
  '3': 'Trean är ljus och mjuk. Den ger durfärgen och vilar nästan, men inte helt.',
  '4': 'Fyran lutar nedåt. Den vill ner ett litet steg till 3.',
  '#4': 'Den höjda fyran är den mest spända tonen. Den vill upp till 5.',
  '5': 'Femman är stark och öppen. Stabil, men inte hemma.',
  'b6': 'Den låga sexan är mörk och vill ner till 5.',
  '6': 'Sexan är mjuk och lite längtande. Den vill ner till 5.',
  'b7': 'Den låga sjuan låter bluesig och drar inte lika hårt hem.',
  '7': 'Sjuan ligger precis under hemma och drar hårt uppåt till 1.',
};

// The way home: from a note, step by step down the scale to the key note. Counting the notes on the
// way gives the scale degree, so this is both the method and the answer key. 7 is the exception: it
// sits just under home and goes up.
export function wayHome(note, iv, minor = false) {
  const scale = minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11], rel = semis(iv) % 12, home = note - rel;
  let path;
  if (iv === '7' && !minor) path = [rel, 12];
  else {
    path = [rel];
    // A note outside the scale first moves to its neighbour in the scale: sharps up, flats down.
    let at = rel; if (!scale.includes(at)) { at += iv.startsWith('#') ? 1 : -1; path.push(at); }
    for (let i = scale.indexOf(at) - 1; i >= 0; i--) path.push(scale[i]);
  }
  return path.map((x, i) => ({t: i * .6, notes: [home + x], dur: i === path.length - 1 ? 1.5 : .55, inst: 'keys', vel: i === path.length - 1 ? .8 : .6}));
}
// The key note (1) to compare with, in the note's own octave, and the way home to play after an answer.
const homeOf = (note, iv, minor) => ({home: [{t: 0, notes: [note - semis(iv) % 12], dur: 1.4, inst: 'keys'}], way: wayHome(note, iv, minor), after: wayHome(note, iv, minor)});
// walk: the way home is played as part of the question (count the notes). help: it is offered as a button.
export function degreeQuestion(R, {pool, minor = false, walk = false, help = false}) {
  const key = R.pick(KEYS), root = keyRoot(key), iv = R.pick(pool), note = noteFor(R, root, iv);
  const ask = [...cadence(root, minor), {t: AFTER_CADENCE, notes: [note], dur: 1.4, inst: 'keys'}], way = wayHome(note, iv, minor);
  return {
    kind: 'degree', prompt: `Tonart: ${key}${minor ? '-moll' : '-dur'}. Vilket skalsteg är tonen?`,
    options: pool.map(id => ({id, label: degreeLabel(id), sub: id === '1' ? 'grundton' : ''})), answer: iv,
    play: walk ? [...ask, ...way.map(e => ({...e, t: e.t + AFTER_CADENCE + 2.2}))] : ask,
    replay: walk ? [{t: 0, notes: [note], dur: 1.4, inst: 'keys'}, ...way.map(e => ({...e, t: e.t + 2.2}))] : [{t: 0, notes: [note], dur: 1.4, inst: 'keys'}],
    ...homeOf(note, iv, minor), help: help || walk,
    reveal: `${degreeLabel(iv)} i ${key}${minor ? '-moll' : '-dur'} är ${nameOf(transpose(root, iv))}.`, why: DEGREE_FEEL[iv] || '',
  };
}

// The gentlest ear games: no names to learn, only "what happened between the notes?".
// direction: is the second note higher or lower? same: the same note twice or not? step: a step to the
// neighbour or a leap? home: after a cadence, does the note rest on the key note or want to move on?
export function compareQuestion(R, {mode, gaps = [7, 12], leaps = [5, 7, 9, 12]}) {
  const two = (a, b) => [{t: 0, notes: [a], dur: 1, inst: 'keys'}, {t: 1.2, notes: [b], dur: 1.4, inst: 'keys'}];
  const names = (a, b) => `${pcName(a)} → ${pcName(b)}`, first = 55 + R.int(10);
  if (mode === 'home') {
    const key = R.pick(KEYS), root = keyRoot(key), home = R() < .5, iv = home ? '1' : R.pick(['2', '4', '7']);
    const note = noteFor(R, root, iv);
    return {kind: 'compare', prompt: 'Vilar tonen hemma, eller vill den vidare?',
      options: [{id: 'home', label: 'Hemma', sub: 'vilar'}, {id: 'away', label: 'Borta', sub: 'vill vidare'}], answer: home ? 'home' : 'away', why: home ? 'Tonen var tonartens grundton. Den känns färdig, som slutet på en låt.' : 'Tonen ligger utanför vilan och vill röra sig till en ton i närheten.',
      play: [...cadence(root, false), {t: AFTER_CADENCE, notes: [note], dur: 1.6, inst: 'keys'}], replay: [{t: 0, notes: [note], dur: 1.6, inst: 'keys'}], ...homeOf(note, iv, false),
      facts: [['Tonart', key], ['Ton', nameOf(transpose(root, iv))], ['Skalsteg', degreeLabel(iv)]]};
  }
  if (mode === 'same') {
    const same = R() < .5, gap = same ? 0 : R.pick(gaps) * R.pick([1, -1]), play = two(first, first + gap);
    return {kind: 'compare', prompt: 'Är det samma ton två gånger?',
      options: [{id: 'same', label: 'Samma', sub: 'samma ton'}, {id: 'diff', label: 'Olika', sub: 'tonen ändras'}], answer: same ? 'same' : 'diff', why: same ? 'Det var samma ton två gånger. Ingenting rörde sig.' : 'Tonen flyttade sig. Nynna båda, så känner du att rösten byter läge.', play, replay: play,
      facts: [['Toner', names(first, first + gap)]]};
  }
  if (mode === 'step') {
    const step = R() < .5, gap = (step ? R.pick([1, 2]) : R.pick(leaps)) * R.pick([1, -1]), play = two(first, first + gap);
    return {kind: 'compare', prompt: 'Går melodin ett steg eller gör den ett hopp?',
      options: [{id: 'step', label: 'Ett steg', sub: 'till grannen'}, {id: 'leap', label: 'Ett hopp', sub: 'längre bort'}], answer: step ? 'step' : 'leap', why: step ? 'Tonerna är grannar, som två toner i rad i en skala.' : 'Melodin hoppade över flera toner på vägen.', play, replay: play,
      facts: [['Toner', names(first, first + gap)], ['Halvtoner', String(Math.abs(gap))]]};
  }
  const up = R() < .5, gap = R.pick(gaps) * (up ? 1 : -1), play = two(first, first + gap);
  return {kind: 'compare', prompt: 'Är den andra tonen högre eller lägre?',
    options: [{id: 'up', label: 'Högre', sub: 'ljusare'}, {id: 'down', label: 'Lägre', sub: 'mörkare'}], answer: up ? 'up' : 'down', why: up ? 'Den andra tonen låg högre: ljusare och tunnare i klangen.' : 'Den andra tonen låg lägre: mörkare och fylligare i klangen.', play, replay: play,
    facts: [['Toner', names(first, first + gap)], ['Halvtoner', String(Math.abs(gap))]]};
}

export function intervalQuestion(R, {pool, dir = 'up'}) {
  const iv = R.pick(pool), d = dir === 'both' ? R.pick(['up', 'down']) : dir;
  const low = 48 + R.int(12), a = d === 'down' ? low + semis(iv) : low, b = d === 'down' ? low : low + semis(iv);
  const play = d === 'harm' ? [{t: 0, notes: [a, b], dur: 1.6, inst: 'keys'}] : [{t: 0, notes: [a], dur: .9, inst: 'keys'}, {t: 1, notes: [b], dur: 1.2, inst: 'keys'}];
  return {
    kind: 'interval', prompt: d === 'harm' ? 'Två toner samtidigt. Vilket intervall?' : d === 'down' ? 'Nedåt. Vilket intervall?' : 'Uppåt. Vilket intervall?',
    options: pool.map(id => ({id, label: intervalNames[id], sub: degreeLabel(id)})), answer: iv, play, replay: play,
    reveal: `${intervalNames[iv]} (${semis(iv)} halvtoner). Minnesknep: ${intervalSongs[iv] || '–'}.`,
  };
}

export function qualityQuestion(R, {pool, arp = false}) {
  const q = R.pick(pool), root = 48 + R.int(10), notes = CHORDS[q].tones.map(t => root + semis(t));
  const play = arp ? [...notes.map((n, i) => ({t: i * .45, notes: [n], dur: .5, inst: 'keys'})), {t: notes.length * .45 + .2, notes, dur: 1.6, inst: 'keys'}] : [{t: 0, notes, dur: 1.8, inst: 'keys'}, {t: 0, notes: [root - 12], dur: 1.8, inst: 'bass'}];
  return {
    kind: 'quality', prompt: 'Vilken sorts ackord?', options: pool.map(id => ({id, label: CHORDS[id].name, sub: CHORDS[id].tones.map(degreeLabel).join('·')})), answer: q, play, replay: play,
    reveal: `${CHORDS[q].name}: ${CHORDS[q].tones.map(degreeLabel).join(' – ')}.`,
  };
}

// The ear skill Adrian asked for: hear a chord with its bass, then a note, and name the note's role.
export function chordToneQuestion(R, {chords, pool}) {
  const q = R.pick(chords), key = R.pick(KEYS), root = keyRoot(key), tones = CHORDS[q].tones;
  const candidates = pool.map(p => p === '3' ? tones.find(t => t === '3' || t === 'b3') : p === '5' ? tones.find(t => t.endsWith('5')) : p === '7' ? tones.find(t => t.endsWith('7')) : p).filter(Boolean);
  const iv = R.pick(candidates), r = midiOf(root);
  const target = r + 12 + semis(iv);
  const chord = tones.map(t => r + semis(t));
  const play = [{t: 0, notes: [r - 12], dur: 2.2, inst: 'bass'}, {t: 0, notes: chord, dur: 2.2, inst: 'keys', vel: .55}, {t: 2.4, notes: [target], dur: 1.4, inst: 'keys'}];
  const kind = iv === '1' ? '1' : iv.endsWith('3') ? '3' : iv.endsWith('5') ? '5' : iv.endsWith('7') ? '7' : iv;
  return {
    kind: 'chordtone', prompt: `Ackord: ${chordName(root, q)}. Vilken roll har den sista tonen?`,
    options: pool.map(id => ({id, label: toneLabel[id] || degreeLabel(id), sub: degreeLabel(id)})), answer: kind, play,
    replay: [{t: 0, notes: [r - 12], dur: 1.6, inst: 'bass'}, {t: .1, notes: [target], dur: 1.4, inst: 'keys'}],
    reveal: `${nameOf(transpose(root, iv))} är ${(toneLabel[iv] || degreeLabel(iv)).toLowerCase()} (${degreeLabel(iv)}) i ${chordName(root, q)}. Basen spelar ${nameOf(root)}.`,
  };
}

export const PROGRESSIONS = {
  two: [['I', 'IV'], ['I', 'V'], ['I', 'vi']],
  three: [['I', 'IV', 'V'], ['I', 'V', 'vi'], ['I', 'vi', 'IV'], ['I', 'ii', 'V']],
  pop: [['I', 'V', 'vi', 'IV'], ['I', 'vi', 'IV', 'V'], ['vi', 'IV', 'I', 'V'], ['I', 'IV', 'vi', 'V'], ['ii', 'V', 'I', 'vi']],
};
export function progressionPlay(root, degs, beatsPer = 2) {
  const r = midiOf(root);
  return degs.flatMap((deg, i) => {
    const d = diatonic(deg), base = r + semis(d.iv), chord = CHORDS[d.q].tones.map(t => base + semis(t)).map(n => n > r + 9 ? n - 12 : n);
    return [{t: i * beatsPer, notes: chord, dur: beatsPer * .92, inst: 'keys', vel: .5}, {t: i * beatsPer, notes: [base - 12 - (semis(d.iv) > 5 ? 12 : 0)], dur: beatsPer * .92, inst: 'bass'}];
  });
}
export function progressionQuestion(R, {set}) {
  const pool = PROGRESSIONS[set], prog = R.pick(pool), key = R.pick(KEYS), root = keyRoot(key);
  const play = progressionPlay(root, prog);
  return {
    kind: 'progression', prompt: `Tonart ${key}-dur. Följ basen: vilken ackordföljd?`,
    options: pool.map(p => ({id: p.join('-'), label: p.join(' – '), sub: p.map(d => chordName(transpose(root, diatonic(d).iv), diatonic(d).q)).join(' ')})),
    answer: prog.join('-'), play, replay: play,
    reveal: `${prog.join(' – ')}: ${prog.map(d => chordName(transpose(root, diatonic(d).iv), diatonic(d).q)).join(' → ')}.`,
  };
}

// Inversions: which chord tone is in the bass (slash chords).
export function inversionQuestion(R) {
  const q = R.pick(['maj', 'min']), key = R.pick(KEYS), root = keyRoot(key), tones = CHORDS[q].tones, which = R.int(3);
  const r = midiOf(root), bass = r - 12 + semis(tones[which]), chord = tones.map(t => r + semis(t));
  const id = ['1', '3', '5'][which];
  const play = [{t: 0, notes: [bass], dur: 2, inst: 'bass'}, {t: 0, notes: chord, dur: 2, inst: 'keys', vel: .5}];
  return {
    kind: 'inversion', prompt: `${chordName(root, q)}. Vilken ackordton ligger i basen?`,
    options: [['1', 'Grundton', 'grundläge'], ['3', 'Ters', '1:a omvändningen'], ['5', 'Kvint', '2:a omvändningen']].map(([i, label, sub]) => ({id: i, label, sub})), answer: id, play, replay: play,
    reveal: `Basen spelar ${nameOf(transpose(root, tones[which]))}: ${chordName(root, q)}${which ? '/' + nameOf(transpose(root, tones[which])) : ''}.`,
  };
}

// Find a note on the fretboard. Answer is any position with the right pitch class.
export function fretQuestion(R, {strings, frets, naturals = true}) {
  const names = naturals ? ['C', 'D', 'E', 'F', 'G', 'A', 'B'] : ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
  let name, spots;
  do { name = R.pick(names); spots = positionsOf(midiOf(parseNote(name + 4)), frets, strings); } while (!spots.length);
  return {kind: 'fret', prompt: `Hitta ${name}${strings.length === 1 ? ' på ' + STRINGS[strings[0]].name + '-strängen' : ''}`, pc: pcOf(midiOf(parseNote(name + 4))), strings, frets, answer: spots, reveal: `${name}: ${spots.map(([s, f]) => STRINGS[s].name + '-strängen band ' + f).join(', ')}.`};
}

// What each scale and chord is, in one line: the theory shown before you play it.
export const ABOUT = {
  major: 'Grunden för allt annat. Alla andra skalor beskrivs som ändringar av durskalan.',
  minor: 'Durskalan med sänkt 3, 6 och 7. Mörkare och mer vemodig.',
  minPent: 'Mollskalan utan 2 och 6. Fem toner som alltid låter bra i rock och blues.',
  majPent: 'Durskalan utan 4 och 7. Ljus och öppen, vanlig i country, soul och pop.',
  mixo: 'Durskalan med sänkt 7. Passar över 7-ackord i blues och funk.',
  dorian: 'Mollskalan med höjd 6. En mjukare moll, vanlig i funk och jazz.',
  blues: 'Mollpentatonisk med en extra ton: ♭5, den blå tonen.',
  maj: 'Durtreklang: grundton, stor ters och kvint.',
  min: 'Molltreklang: grundton, liten ters och kvint.',
  dom7: 'Durtreklang med liten septima. Spänt, vill vidare.',
  maj7: 'Durtreklang med stor septima. Mjukt och drömmande.',
  min7: 'Molltreklang med liten septima. Mjukt och lite jazzigt.',
};
// The distance between neighbouring scale tones, the way a teacher says it.
export const STEP_NAMES = {1: 'halv', 2: 'hel', 3: '1½'};

// Play a scale or arpeggio on the fretboard from a given root position.
export function patternQuestion(R, {scales, chords}) {
  const s = R.int(2), f = 1 + R.int(7), root = fretMidi(s, f);
  const id = scales ? R.pick(scales) : R.pick(chords), steps = scales ? SCALES[id] : null;
  const ivs = steps ? steps.steps : [...CHORDS[id].tones, '8'];
  const name = pcName(root), rootNote = parseNote(name + '2'), targets = ivs.map(iv => root + semis(iv));
  return {
    kind: 'pattern', id, scale: !!steps, title: steps ? `${name} ${steps.name.toLowerCase()}` : `${name}${CHORDS[id].sym} arpeggio`, prompt: 'Spela tonerna i ordning, nerifrån och upp.',
    root: [s, f], targets, labels: ivs.map(degreeLabel), names: ivs.map(iv => nameOf(transpose(rootNote, iv))),
    gaps: steps ? targets.slice(1).map((m, i) => STEP_NAMES[m - targets[i]] || String(m - targets[i])) : null,
    positions: patternPositions([s, f], targets), frets: [Math.max(0, f - 2), Math.min(FRETS, f + 6)],
  };
}
// The standard one-octave fingering: stay within four frets of the root (one fret below it at most)
// and move to the next string as soon as a note would fall outside that box.
export function patternPositions([s, f], targets) {
  return targets.map(m => {
    for (let st = s; st < STRINGS.length; st++) { const fr = m - STRINGS[st].midi; if (fr >= Math.max(0, f - 1) && fr <= f + 3) return [st, fr]; }
    for (let st = STRINGS.length - 1; st >= 0; st--) { const fr = m - STRINGS[st].midi; if (fr >= 0 && fr <= FRETS) return [st, fr]; }
    return null;
  });
}

// ---------- the whole neck, by playing ----------
// A level is two passes over the same notes: `learn` in order with the map showing, then `test` shuffled
// without it. Each target is {s, f, name, pc}. No two targets in a row share a note name, so a string
// that is still ringing can never count for the next one.
const NATURALS = new Set([0, 2, 4, 5, 7, 9, 11]);
export function neckTargets(R, {strings = [0], notes = 'natural', across = false, count}) {
  const spot = (s, f) => ({s, f, midi: fretMidi(s, f), pc: pcOf(fretMidi(s, f)), name: pcName(fretMidi(s, f))});
  // Swap a repeated note with a later (or, at the end of the list, an earlier) one that fits in both places.
  const apart = list => {
    const clash = (i, x) => (i > 0 && list[i - 1].pc === x.pc) || (i + 1 < list.length && list[i + 1].pc === x.pc);
    for (let i = 1; i < list.length; i++) {
      if (list[i].pc !== list[i - 1].pc) continue;
      const j = list.findIndex((x, k) => Math.abs(k - i) > 1 && !clash(i, x) && !clash(k, list[i]));
      if (j >= 0) [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  if (across) {
    // The same few notes on every string: their lowest position on each, one string at a time from the E string up.
    const picks = R.shuffle(['A', 'C', 'D', 'E', 'F', 'G', 'B']).slice(0, count || 4).map(name => pcOf(midiOf(parseNote(name + 4)))), test = [];
    for (const s of [0, 1, 2, 3]) for (const pc of picks) test.push(spot(s, (((pc - STRINGS[s].midi) % 12) + 12) % 12));
    return {learn: [], test};
  }
  const all = strings.flatMap(s => Array.from({length: FRETS + 1}, (_, f) => spot(s, f)).filter(x => notes === 'all' || NATURALS.has(x.pc)));
  const learn = notes === 'all' ? [] : all;
  const n = count || (notes === 'all' ? 16 : Math.max(10, all.length));
  // Every note once in random order first, then extra draws, so nothing on the string is skipped.
  let test = R.shuffle(all.filter(x => !(notes !== 'all' && x.f === 12)));
  while (test.length < n) test.push(R.pick(all));
  test = apart(test.slice(0, n));
  return {learn, test};
}

// ---------- bass line builder ----------
// Each chord gets 4 beats. Rules grow from roots only to a walking line with approach notes.
export const BASS_RULES = {
  root: {name: 'Bara grundtoner', text: 'Spela ackordets grundton på alla fyra slag.'},
  root5: {name: 'Grundton och kvint', text: 'Slag 1 är grundton. De andra slagen är grundton eller kvint.'},
  triad: {name: 'Treklangen', text: 'Slag 1 är grundton. Övriga slag är ackordtoner: grundton, ters, kvint eller oktav.'},
  approach: {name: 'Närmande ton', text: 'Slag 1 grundton, slag 2–3 ackordtoner. Slag 4 leder in i nästa grundton: ett halvt eller helt tonsteg ifrån.'},
  walk: {name: 'Walking bass', text: 'Slag 1 grundton. Varje ton är en ackordton, en skalton eller ett närmande. Inga hopp större än en kvint, och slag 4 leder vidare.'},
};

export function bassChords(R, set = 'pop') {
  const key = R.pick(['C', 'G', 'D', 'A', 'E', 'F']), root = keyRoot(key, 2), prog = R.pick(PROGRESSIONS[set]);
  return {key, root, chords: prog.map(deg => { const d = diatonic(deg), r = transpose(root, d.iv); return {deg, q: d.q, root: r, name: chordName(r, d.q)}; })};
}
// Note choices for one beat: chord tones plus approach notes into the next root, in bass range (E1–G2).
export function beatChoices(line, bar, beat) {
  const c = line.chords[bar], next = line.chords[(bar + 1) % line.chords.length];
  const low = n => 28 + ((pcOf(midiOf(n)) - 4 + 12) % 12), r = low(c.root), nr = low(next.root);
  const tones = CHORDS[c.q].tones;
  const list = [
    {id: 'R', label: nameOf(c.root), sub: 'grundton', midi: r, role: 'chord'},
    {id: '3', label: nameOf(transpose(c.root, tones[1])), sub: 'ters', midi: r + semis(tones[1]), role: 'chord'},
    {id: '5', label: nameOf(transpose(c.root, tones[2])), sub: 'kvint', midi: r + semis(tones[2]), role: 'chord'},
    {id: '8', label: nameOf(c.root), sub: 'oktav', midi: r + 12, role: 'chord'},
  ];
  if (beat >= 1) {
    // Scale tones come from the key, so ii gets a natural 6th (dorian) and vi a minor 6th (aeolian).
    const idx = DIATONIC.findIndex(d => d.deg === c.deg), major = ['1', '2', '3', '4', '5', '6', '7'];
    for (const [id, off] of [['2', 1], ['6', 5]]) {
      const n = transpose(line.root, major[(idx + off) % 7]), up = ((pcOf(midiOf(n)) - pcOf(r)) + 12) % 12;
      list.push({id, label: nameOf(n), sub: 'skalton', midi: r + up, role: 'scale'});
    }
  }
  if (beat === 3) {
    list.push({id: 'a-', label: nameOf(transpose(next.root, '7')), sub: '→ ' + nameOf(next.root), midi: nr - 1 < 28 ? nr + 11 : nr - 1, role: 'approach'});
    list.push({id: 'a+', label: nameOf(transpose(next.root, 'b2')), sub: '→ ' + nameOf(next.root), midi: nr + 1, role: 'approach'});
  }
  return list;
}
// Grade a line: returns per-beat ok flags and a score 0–1.
export function gradeBassLine(line, picks, rule) {
  const flags = [], notes = [];
  line.chords.forEach((c, bar) => {
    for (let beat = 0; beat < 4; beat++) {
      const id = picks[bar * 4 + beat], choice = beatChoices(line, bar, beat).find(x => x.id === id);
      notes.push(choice?.midi ?? null);
      let ok = !!choice;
      if (ok && beat === 0) ok = id === 'R' || (rule === 'walk' && id === '8');
      else if (ok && rule === 'root') ok = id === 'R' || id === '8';
      else if (ok && rule === 'root5') ok = ['R', '5', '8'].includes(id);
      else if (ok && rule === 'triad') ok = choice.role === 'chord';
      else if (ok && rule === 'approach') ok = beat < 3 ? choice.role === 'chord' : approaches(choice.midi, line, bar);
      else if (ok && rule === 'walk') ok = beat < 3 || approaches(choice.midi, line, bar);
      flags.push(ok);
    }
  });
  const played = rule === 'walk' ? voiceLine(notes) : notes;
  // Beat 1 always lands on the root in the low register, so the barline itself is not judged as a leap.
  if (rule === 'walk') for (let i = 1; i < played.length; i++) if (i % 4 && played[i] != null && played[i - 1] != null && Math.abs(played[i] - played[i - 1]) > 7) flags[i] = false;
  return {flags, notes: played, score: flags.filter(Boolean).length / flags.length};
}
// A walking bass plays the approach on beat 4 in the octave nearest the note before it, like a bassist
// would, instead of dropping an octave to reach it. Beat 1 stays on the low root.
export function voiceLine(notes) {
  return notes.map((n, i) => {
    const prev = notes[i - 1];
    if (i % 4 !== 3 || n == null || prev == null) return n;
    let m = n; while (m - prev > 6 && m - 12 >= 28) m -= 12; while (prev - m > 6 && m + 12 <= 52) m += 12;
    return m;
  });
}

// A note on beat 4 "approaches" when it is a half or whole step from the next chord's root.
function approaches(midi, line, bar) {
  const next = line.chords[(bar + 1) % line.chords.length], d = Math.abs(((pcOf(midi) - pcOf(midiOf(next.root)) + 6) % 12 + 12) % 12 - 6);
  return d === 1 || d === 2;
}

// ---------- rhythm ----------
// Patterns in beats within one 4/4 bar, repeated. Taps are graded against the nearest target.
export const RHYTHMS = {
  quarters: {name: 'Fjärdedelar', hits: [0, 1, 2, 3]},
  eighths: {name: 'Åttondelar', hits: [0, .5, 1, 1.5, 2, 2.5, 3, 3.5]},
  rock: {name: 'Rockgroove', hits: [0, 1.5, 2, 3]},
  push: {name: 'Synkop', hits: [0, .5, 1.5, 2.5, 3]},
  motown: {name: 'Motown-push', hits: [0, .75, 1.5, 2, 3.5]},
};
export function gradeTaps(taps, targets, beatMs) {
  // taps and targets in ms. Each target is matched once with the closest unused tap.
  const used = new Set(), win = Math.min(160, beatMs * .3);
  let hit = 0, perfect = 0, err = 0;
  for (const t of targets) {
    let best = -1, bd = Infinity;
    taps.forEach((x, i) => { const d = Math.abs(x - t); if (!used.has(i) && d < bd) { bd = d; best = i; } });
    if (best >= 0 && bd <= win) { used.add(best); hit++; err += bd; if (bd <= win * .4) perfect++; }
  }
  const extra = taps.length - used.size;
  return {hit, perfect, extra, total: targets.length, avg: hit ? Math.round(err / hit) : null, score: Math.max(0, (hit - extra * .5) / targets.length)};
}

// ---------- pitch detection ----------
// Below this a signal is digital silence. Everything else is judged against the room noise, never a fixed level.
export const QUIET = .00005;
// Autocorrelation with parabolic interpolation (a simplified McLeod/YIN approach).
// Returns {freq, clarity} or null when there is no clear pitch.
export function detectPitch(buf, sampleRate, minF = 70, maxF = 1100, decimate = 1) {
  // Averaging neighbouring samples halves the work for low instruments and acts as a mild low-pass.
  const n = Math.floor(buf.length / decimate), sr = sampleRate / decimate;
  const x = scratch(n, 0);
  let mean = 0;
  for (let i = 0; i < n; i++) { let v = 0; for (let j = 0; j < decimate; j++) v += buf[i * decimate + j]; x[i] = v / decimate; mean += x[i]; }
  mean /= n;
  // Prefix sums of squares give the NSDF denominator for every lag without another loop.
  const sq = scratch(n + 1, 1); sq[0] = 0;
  for (let i = 0; i < n; i++) { x[i] -= mean; sq[i + 1] = sq[i] + x[i] * x[i]; }
  const rms = Math.sqrt(sq[n] / n);
  if (rms < QUIET) return null;
  const minLag = Math.max(2, Math.floor(sr / maxF)), maxLag = Math.min(Math.ceil(sr / minF), (n >> 1) - 1);
  const nsdf = scratch(maxLag + 2, 2);
  for (let lag = 1; lag <= maxLag + 1; lag++) {
    let ac = 0; const end = n - lag;
    for (let i = 0; i < end; i++) ac += x[i] * x[i + lag];
    const m = sq[end] + sq[n] - sq[lag];
    nsdf[lag] = m > 0 ? 2 * ac / m : 0;
  }
  // McLeod: skip the lobe around lag 0, then take the highest point of each positive region (a "key
  // maximum"). The first key maximum close to the best one is the fundamental; later ones are octaves below.
  let lag = 1; while (lag <= maxLag && nsdf[lag] > 0) lag++;
  const peaks = []; let top = 0, cur = -1;
  for (; lag <= maxLag; lag++) {
    if (nsdf[lag] > 0) { if (nsdf[lag] > nsdf[lag - 1] && nsdf[lag] >= nsdf[lag + 1] && (cur < 0 || nsdf[lag] > nsdf[cur])) cur = lag; }
    else if (cur >= 0) { if (cur >= minLag) { peaks.push(cur); if (nsdf[cur] > top) top = nsdf[cur]; } cur = -1; }
  }
  if (cur >= minLag) { peaks.push(cur); if (nsdf[cur] > top) top = nsdf[cur]; }
  if (top < .5) return null;
  const pick = peaks.find(l => nsdf[l] >= .9 * top);
  const a = nsdf[pick - 1], b = nsdf[pick], c = nsdf[pick + 1], shift = (a - c) / (2 * (a - 2 * b + c) || 1);
  return {freq: sr / (pick + (Number.isFinite(shift) && Math.abs(shift) < 1 ? shift : 0)), clarity: b, rms};
}
const pads = [];
function scratch(n, slot) { if (!pads[slot] || pads[slot].length < n) pads[slot] = new Float32Array(n); return pads[slot]; }
export const midiFloat = freq => 69 + 12 * Math.log2(freq / 440);

// Turns a stream of pitch frames into "a new note was played" events, for playing an instrument into
// the microphone. A note counts once it has held the same pitch for `hold` seconds. A ringing note
// that slips to its own octave as it fades is not a new note unless the level jumps (a new pluck).
// `floor` follows the room noise, so it works with a quiet phone microphone as well as a loud one.
export function createNoteTracker({hold = .06, clarity = .82} = {}) {
  let floor = null, prevT = 0, cand = null, candT = 0, candN = 0, last = null, lastT = 0, quietT = null, peak = 0;
  const levels = [];
  return {
    get candidate() { return cand; },
    get floor() { return floor; },
    push(f) {
      // The floor drops to the quietest level at once and rises slowly (it doubles in 20 seconds), so long
      // unbroken playing never raises it above the notes.
      floor = floor == null ? f.rms : Math.min(f.rms, floor * Math.pow(2, Math.max(0, f.t - prevT) / 20)); prevT = f.t;
      levels.push(f.rms); if (levels.length > 10) levels.shift();
      const voiced = f.freq && f.clarity >= clarity && f.rms > Math.max(floor * 2.5, QUIET);
      if (!voiced) {
        cand = null;
        if (quietT == null) quietT = f.t; else if (f.t - quietT > .2) { last = null; peak = 0; }
        return null;
      }
      quietT = null; peak = Math.max(peak * .995, f.rms);
      const m = midiFloat(f.freq), near = Math.round(m);
      if (near !== cand) { cand = near; candT = f.t; candN = 1; return null; }
      candN++;
      const attack = f.rms > 1.5 * Math.min(...levels);
      // The same note plucked again (on another string, say): only a clear new attack counts.
      if (near === last) { if (f.rms < 2.5 * Math.min(...levels) || f.rms < .45 * peak || f.t - lastT < .3 || f.t - candT < hold) return null; lastT = f.t; return {midi: near, pc: pcOf(near), cents: Math.round((m - near) * 100), t: f.t, again: true}; }
      if (candN < 2 || f.t - candT < hold) return null;
      // The dying tail of a note can flicker to one of its overtones for a moment: far below the note's own
      // level and with no rise in level, so skip it. A softly plucked note after a loud one either rises
      // or simply stays, so it still counts, a little later.
      if (f.rms < .25 * peak && !attack && f.t - candT < .2) return null;
      // Out of silence a real note always starts with a rise in level; a blip in a fading tail does not.
      if (last == null && !attack) return null;
      const echo = last != null && pcOf(near) === pcOf(last) && !attack;
      last = near; lastT = f.t;
      if (!echo) peak = f.rms; // from here on, "loud" is measured against this note, not the one before
      return echo ? null : {midi: near, pc: pcOf(near), cents: Math.round((m - near) * 100), t: f.t};
    },
  };
}
// Cents between a frequency and a MIDI note.
export const centsOff = (freq, midi) => 1200 * Math.log2(freq / freqOf(midi));
// Fold a sung note to the target's octave, so a man singing an octave below a reference still counts.
export function foldCents(freq, midi) { let c = centsOff(freq, midi); while (c > 600) c -= 1200; while (c < -600) c += 1200; return c; }

// Comfortable singing ranges as MIDI (low, high).
export const VOICES = {
  low: {name: 'Mörk röst', sub: 'bas / baryton', range: [43, 57], home: 48},
  mid: {name: 'Mellanröst', sub: 'tenor / alt', range: [48, 64], home: 53},
  high: {name: 'Ljus röst', sub: 'sopran / mezzo', range: [57, 72], home: 62},
};
