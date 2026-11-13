// Language layer: English by default, Swedish as an option.
//
// The app's source texts are written in Swedish (and a few exercise names in English). Instead of
// rewriting every template, this module translates what is rendered: text nodes and a few
// attributes are looked up in a dictionary when they appear in the DOM.
//
// To translate a new text, add it to src/i18n-en.js (Swedish → English). English exercise names
// that should read in Swedish go in src/i18n-sv.js (English → Swedish). Numbers are written as {#}
// in the keys, so "12 dagar" and "3 dagar" share the entry "{#} dagar".
import en from './i18n-en.js';
import sv from './i18n-sv.js';

const STORE = 'arc-lang';
export const languages = {en: 'English', sv: 'Svenska'};
const read = () => { try { return localStorage.getItem(STORE); } catch { return null; } };
export let lang = languages[read()] ? read() : 'en';

const NUM = /\d+(?:[.,]\d+)?/g;
const weekdays = {måndag: 'Monday', tisdag: 'Tuesday', onsdag: 'Wednesday', torsdag: 'Thursday', fredag: 'Friday', lördag: 'Saturday', söndag: 'Sunday'};
const months = {januari: 'January', februari: 'February', mars: 'March', april: 'April', maj: 'May', juni: 'June', juli: 'July', augusti: 'August', september: 'September', oktober: 'October', november: 'November', december: 'December'};
const shortMonths = {jan: 'Jan', feb: 'Feb', mars: 'Mar', apr: 'Apr', maj: 'May', juni: 'Jun', juli: 'Jul', aug: 'Aug', sep: 'Sep', okt: 'Oct', nov: 'Nov', dec: 'Dec'};
// Verb + name ("Redigera Läs en bok"): the name is translated on its own.
const prefixes = {en: [['Redigera ', 'Edit '], ['Registrera ', 'Log '], ['Ångra ', 'Undo '], ['Öppna ', 'Open '], ['Välj ', 'Choose '], ['Ta bort ', 'Remove '], ['Lägg till ', 'Add '], ['Byt till ', 'Switch to '], ['Spara ', 'Save ']], sv: []};
const patterns = {
  en: [
    [/^Välkommen tillbaka, (.+)\. Varje litet steg räknas\.$/, (m, name) => `Welcome back, ${name}. Every small step counts.`],
    [/^Välkommen tillbaka, (.+)\.$/, (m, name) => `Welcome back, ${name}.`],
    [/^(.+), här är spåren av alla små beslut som gjorde dig till en starkare version av dig själv\.$/, (m, name) => `${name}, here are the traces of all the small decisions that made you a stronger version of yourself.`],
    [/^Var är du i (.+)\?$/, (m, tree) => `Where are you in ${translate(tree)}?`],
    [/^Vill du ta bort (.+) som vän\?$/, (m, name) => `Remove ${name} as a friend?`],
    [/^Visa profil för (.+)$/, (m, name) => `View ${name}'s profile`],
    [/^Lägg till vanan (.+)$/, (m, name) => `Add the habit ${translate(name)}`],
    [/^(.+) för att låsa upp (.+)\.$/, (m, req, item) => `${translate(req)} to unlock ${translate(item)}.`],
    [/^Alternativ för (.+)$/, (m, name) => `Options for ${translate(name)}`],
    [/^Ta bort (.+) från passet$/, (m, name) => `Remove ${translate(name)} from the workout`],
    [/^(.+) har (\d+) loggade set\.$/, (m, name, n) => `${translate(name)} has ${n} logged ${n === '1' ? 'set' : 'sets'}.`],
    [/^Ta bort (.+) som vän$/, (m, name) => `Remove ${name} as a friend`],
    [/^Saknar ([0-9, ]+)\. Kör de filerna i supabase\/ i ordning\.$/, (m, list) => `Missing ${list}. Run those files in supabase/ in order.`],
    [/^Startnivå sparad: (.+)\.$/, (m, level) => `Starting level saved: ${translate(level)}.`],
    [/^Nästa pass senast (idag|imorgon|på [a-zåäö]+)\.$/, (m, when) => `Next workout by ${whenEn(when)}.`],
    [/^Träna senast (idag|imorgon|på [a-zåäö]+) för att hålla flamman vid liv\.$/, (m, when) => `Train by ${whenEn(when)} to keep the flame alive.`],
    [/^Förkunskap krävs: (.+)$/, (m, rest) => 'Prerequisite: ' + rest.split(/, (?![^(]*\))/).map(part => part.replace(/^(.+) nivå (\d+) \((.+)\)(\.?)$/, (x, tree, n, level, dot) => `${translate(tree)} level ${n} (${translate(level)})${dot}`)).join(', ')],
  ],
  sv: [],
};

const whenEn = w => w === 'idag' ? 'today' : w === 'imorgon' ? 'tomorrow' : (weekdays[w.slice(3)] || w.slice(3));
const cache = {en: new Map(), sv: new Map()};

function lookup(text, dict) {
  if (dict[text] !== undefined) return dict[text];
  const nums = text.match(NUM);
  if (nums) {
    const hit = dict[text.replace(NUM, '{#}')];
    if (hit !== undefined) { let i = 0; return hit.replace(/\{#\}/g, () => nums[i++] ?? ''); }
  }
  return null;
}

function date(text) {
  const m = text.match(/^(?:(måndag|tisdag|onsdag|torsdag|fredag|lördag|söndag) )?(\d{1,2}) ([a-zåäö]+)(\.?)(?: (\d{4}))?$/);
  if (!m || !(months[m[3]] || shortMonths[m[3]])) return null;
  const month = months[m[3]] || shortMonths[m[3]];
  return `${m[1] ? weekdays[m[1]] + ' ' : ''}${m[2]} ${month}${m[5] ? ' ' + m[5] : ''}`;
}

// Translates one visible string. Unknown text is returned unchanged.
export function translate(text, to = lang) {
  if (to === 'sv' && !Object.keys(sv).length) return text;
  const dict = to === 'en' ? en : sv, memo = cache[to];
  if (memo.has(text)) return memo.get(text);
  let out = lookup(text, dict);
  if (out === null) for (const [re, fn] of patterns[to]) if (re.test(text)) { out = text.replace(re, fn); break; }
  if (out === null && to === 'en') out = date(text);
  // Long texts are often several known sentences or " · "-joined parts.
  if (out === null) out = joinParts(text, /(?<=[.!?])\s+/, ' ', to) ?? joinParts(text, ' · ', ' · ', to);
  // A verb followed by a known name, e.g. "Redigera Läs en bok".
  if (out === null) for (const [from, into] of prefixes[to]) if (text.startsWith(from)) {
    const rest = text.slice(from.length), t = lookup(rest, to === 'en' ? en : sv);
    if (t !== null) { out = into + t; break; }
  }
  if (out === null) out = joinParts(text, ', ', ', ', to) ?? joinParts(text, ' → ', ' → ', to);
  if (out === null) out = text;
  if (memo.size < 20000) memo.set(text, out);
  return out;
}

function joinParts(text, splitter, glue, to) {
  const parts = text.split(splitter);
  if (parts.length < 2) return null;
  let changed = false;
  const done = parts.map(p => { const t = p.trim() ? translate(p.trim(), to) : p; if (t !== p.trim()) changed = true; return t; });
  return changed ? done.join(glue) : null;
}

// User-written content is never translated; placeholders and option labels are.
const SKIP = 'script,style,textarea,[data-no-translate],.post-text,.journal-text';
const SKIP_ATTRS = '[data-no-translate],.post-text,.journal-text';
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt', 'data-label'];

function translateText(node) {
  const raw = node.nodeValue;
  if (!raw || !/[A-Za-zÅÄÖåäö]/.test(raw) || node.parentElement?.closest(SKIP)) return;
  const lead = raw.match(/^\s*/)[0], trail = raw.match(/\s*$/)[0], core = raw.trim().replace(/\s+/g, ' ');
  const t = translate(core);
  if (t !== core) node.nodeValue = lead + t + trail;
}

function translateElement(el) {
  if (el.closest?.(SKIP_ATTRS)) return;
  for (const a of ATTRS) {
    const v = el.getAttribute?.(a);
    if (v && /[A-Za-zÅÄÖåäö]/.test(v)) { const t = translate(v.trim()); if (t !== v.trim()) el.setAttribute(a, t); }
  }
}

export function translateTree(root) {
  if (!root) return;
  if (root.nodeType === 3) return translateText(root);
  if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
  if (root.nodeType === 1) translateElement(root);
  const doc = root.ownerDocument || root;
  const walker = doc.createTreeWalker(root, 1 | 4);
  let n;
  while ((n = walker.nextNode())) n.nodeType === 3 ? translateText(n) : translateElement(n);
}

let observer = null;
// Starts translating everything that is rendered from now on.
export function startTranslating(doc = document) {
  doc.documentElement.lang = lang;
  if (lang === 'sv' && !Object.keys(sv).length) return;
  translateTree(doc.body);
  doc.title = translate(doc.title);
  observer?.disconnect();
  observer = new doc.defaultView.MutationObserver(list => {
    for (const m of list) {
      if (m.type === 'characterData') translateText(m.target);
      else if (m.type === 'attributes') translateElement(m.target);
      else for (const n of m.addedNodes) translateTree(n);
    }
  });
  observer.observe(doc.body, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS});
}

export function setLanguage(next) {
  if (!languages[next] || next === lang) return false;
  try { localStorage.setItem(STORE, next); } catch {}
  lang = next;
  return true;
}
