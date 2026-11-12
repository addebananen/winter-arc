// Colour themes, chosen under Settings and saved on this device.
//
// The app's CSS is written in one cool teal palette ("Nordljus"). Instead of maintaining a copy of
// every rule per theme, this module reads the loaded stylesheet once and recolours each colour
// value with the theme's transform. Warm accents (gold, flame, reds, pinks) are kept so streaks,
// ranks and stats stay recognisable. New CSS is themed automatically.
const STORE = 'arc-theme';

// h: 0–360, s/l: 0–1. Only cool colours (teal, green, blue-grey) and near-greys are transformed.
const cool = c => c.s < 0.12 || (c.h >= 100 && c.h <= 220);
export const themes = {
  aurora: {name: 'Nordljus', hint: 'Mint och djupt havsgrönt', swatch: ['#101719', '#1e292b', '#c6e7df'], bg: '#101719'},
  frost: {name: 'Frost', hint: 'Isblått och kall morgon', swatch: ['#0d1520', '#1a2636', '#bfe0ff'], bg: '#0d1520',
    map: c => cool(c) ? {...c, h: c.s < 0.12 ? 212 : c.h + 34, s: Math.min(1, Math.max(c.s, 0.18) * 1.15)} : c},
  midnight: {name: 'Polarnatt', hint: 'Mörkt indigo och norrsken', swatch: ['#0f0f1d', '#1d1c33', '#c9bcff'], bg: '#0f0f1d',
    map: c => cool(c) ? {...c, h: 248, s: Math.min(1, Math.max(c.s, 0.16) * 1.25)} : c},
  beyond: {name: 'Beyond Self', hint: 'Svart, snövitt och rött som appikonen', swatch: ['#0a0a0a', '#1a1a1a', '#ff4545'], bg: '#0a0a0a',
    map: c => cool(c) ? {...c, s: 0, l: c.l < 0.35 ? c.l * 0.72 : c.l} : c,
    accent: '#ff4545'},
};

const read = () => { try { return localStorage.getItem(STORE); } catch { return null; } };
export let theme = themes[read()] ? read() : 'aurora';

function toHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (!d) return {h: 0, s: 0, l};
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? 60 * (((g - b) / d) % 6) : max === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4);
  return {h: (h + 360) % 360, s: Math.min(1, s), l};
}
function toRgb({h, s, l}) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r, g, b].map(v => Math.round((v + m) * 255));
}

const COLOR = /#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|rgba?\(([^)]+)\)/gi;
// Recolours every colour inside a CSS value, keeping alpha.
export function recolor(value, id = theme) {
  const t = themes[id];
  if (!t?.map) return value;
  return value.replace(COLOR, (m, hex, args) => {
    let r, g, b, a = 1;
    if (hex) {
      const h = hex.length <= 4 ? [...hex].map(x => x + x).join('') : hex;
      [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
      if (h.length === 8) a = parseInt(h.slice(6, 8), 16) / 255;
    } else {
      const p = args.split(/[\s,/]+/).filter(Boolean).map(Number);
      if (p.length < 3 || p.some(Number.isNaN)) return m;
      [r, g, b] = p; if (p.length > 3) a = p[3];
    }
    const [nr, ng, nb] = toRgb(t.map(toHsl(r, g, b)));
    return a < 1 ? `rgba(${nr}, ${ng}, ${nb}, ${+a.toFixed(3)})` : `rgb(${nr}, ${ng}, ${nb})`;
  });
}

function themedRules(rules, id) {
  let css = '';
  for (const rule of rules) {
    if (rule.cssRules && rule.media) { const inner = themedRules(rule.cssRules, id); if (inner) css += `@media ${rule.media.mediaText}{${inner}}`; continue; }
    if (rule.cssRules && rule.conditionText) { const inner = themedRules(rule.cssRules, id); if (inner) css += `@supports ${rule.conditionText}{${inner}}`; continue; }
    if (!rule.style || !rule.selectorText) continue;
    let decl = '';
    for (let i = 0; i < rule.style.length; i++) {
      const prop = rule.style[i], value = rule.style.getPropertyValue(prop);
      if (!value || !/#|rgb/i.test(value)) continue;
      const next = recolor(value, id);
      if (next !== value) decl += `${prop}:${next}${rule.style.getPropertyPriority(prop) ? ' !important' : ''};`;
    }
    if (decl) css += `${rule.selectorText}{${decl}}`;
  }
  return css;
}

// Builds the override stylesheet for a theme from the app's own stylesheet(s).
export function themeCss(id = theme, doc = document) {
  const t = themes[id];
  if (!t?.map) return '';
  let css = '';
  for (const sheet of doc.styleSheets) {
    if (sheet.ownerNode?.id === 'theme-style') continue;
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    css += themedRules(rules, id);
  }
  // Dark text on the red accent keeps buttons readable (white on red is too low contrast).
  if (t.accent) css += `:root{--mint:${t.accent}}.quick-link{color:var(--text)}.quick-link .i{color:var(--mint)}`;
  return css;
}

export function applyTheme(id = theme, doc = document) {
  if (!themes[id]) id = 'aurora';
  theme = id;
  doc.documentElement.dataset.theme = id;
  let style = doc.getElementById('theme-style');
  const css = themeCss(id, doc);
  if (!css) { style?.remove(); } else {
    if (!style) { style = doc.createElement('style'); style.id = 'theme-style'; doc.head.append(style); }
    style.textContent = css;
  }
  doc.querySelector('meta[name="theme-color"]')?.setAttribute('content', themes[id].bg);
}

export function setTheme(id) {
  if (!themes[id]) return false;
  try { localStorage.setItem(STORE, id); } catch {}
  applyTheme(id);
  return true;
}
