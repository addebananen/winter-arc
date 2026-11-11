// The Frost mage: a selectable character drawn from five illustrations, from a little boy with a wand to a
// frost mage with a crystal staff, lightning and a fur cape. Like the other characters, a new form unlocks
// every five levels: level 1, 6, 11, 16 and 21. The pictures have transparent backgrounds (src/frost),
// so the character stands on the app's dark background. It breathes slowly, and from form 2 frost sparks
// drift upwards (CSS shared with the hero character, no extra cost).
import {heroForm} from './hero-character.js';

export const FROST_ID = 'frost';
// [level, name] of each form.
export const frostForms = [[1, 'Knatten'], [6, 'Lärlingen'], [11, 'Ismagikern'], [16, 'Stormmagikern'], [21, 'Vinterlegenden']];
export const frostForm = heroForm;

// Picture size of each form (src/frost/lvN.webp) and how tall it stands: the boy is smaller and grows.
const pictures = {1: [431, 720, .8], 2: [397, 720, .92], 3: [446, 720, 1], 4: [474, 720, 1], 5: [462, 720, 1]};
const glow = {1: '#9fd8ff', 2: '#9fd8ff', 3: '#bfe4ff', 4: '#8fc4ff', 5: '#a9dcff'};
let seq = 0;

export function frostCharacter(level = 1, large = false) {
  const form = frostForm(level), id = 'frost' + (++seq), [pw, ph, scale] = pictures[form], color = glow[form];
  const h = 246 * scale, w = pw * h / ph, x = (250 - w) / 2, y = 252 - h;
  const aura = `<radialGradient id="${id}a" cx=".5" cy=".55" r=".5"><stop stop-color="${color}" stop-opacity="${(.1 + form * .05).toFixed(2)}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
  const sparks = form > 1 ? Array.from({length: 4 + form * 2}, (_, i) => `<circle class="hero-spark" cx="${30 + (i * 41) % 190}" cy="${248 - (i * 53) % 120}" r="${(.9 + (i % 3) * .5).toFixed(1)}" fill="${i % 2 ? '#e8f6ff' : color}" style="animation-delay:-${(i * .7).toFixed(1)}s;animation-duration:${4 + i % 4}s"/>`).join('') : '';
  return `<svg class="character frost-character frost-form-${form} ${large ? 'large' : ''} char-${FROST_ID}" viewBox="0 0 250 260" aria-label="${FROST_ID}, evolution ${form}" role="img"><defs>${aura}</defs>`
    + `<ellipse class="hero-aura" cx="125" cy="${(y + h * .55).toFixed(1)}" rx="${(w * .62).toFixed(1)}" ry="${(h * .52).toFixed(1)}" fill="url(#${id}a)"/>`
    + `<ellipse cx="125" cy="251" rx="${(w * .34).toFixed(1)}" ry="5" fill="#0b1817" opacity=".55"/>`
    + `<image class="hero-photo" href="./frost/lv${form}.webp" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" preserveAspectRatio="xMidYMax meet"/>${sparks}</svg>`;
}
