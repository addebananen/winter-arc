// The Music mage (id 'arcane', kept so saved choices stay): a selectable character drawn from one five-step
// illustration (src/arcane), from a beginner with a glowing note in his hand to a legend at a keyboard in a storm
// of purple music. Like the other characters, a new form unlocks every five levels: level 1, 6, 11, 16 and 21.
// Each form is cut from the same height, so the boy is small and grows. The black background fades out into the
// app's background; the character breathes and purple sparks rise from form 2 (CSS shared with the hero character).
import {heroForm} from './hero-character.js';

export const ARCANE_ID = 'arcane';
// [level, name] of each form, as written under the illustration.
export const arcaneForms = [[1, 'Nybörjare'], [6, 'Lärling'], [11, 'Magiker'], [16, 'Mästare'], [21, 'Legend']];
export const arcaneForm = heroForm;

// Picture size of each form (src/arcane/lvN.webp).
const pictures = {1: [261, 720], 2: [306, 720], 3: [311, 720], 4: [344, 720], 5: [445, 720]};
let seq = 0;

export function arcaneCharacter(level = 1, large = false) {
  const form = arcaneForm(level), id = 'arcane' + (++seq), [pw, ph] = pictures[form];
  const h = 256, w = pw * h / ph, x = (250 - w) / 2, y = 258 - h;
  const aura = `<radialGradient id="${id}a" cx=".5" cy=".6" r=".5"><stop stop-color="#a66bff" stop-opacity="${(.08 + form * .05).toFixed(2)}"/><stop offset="1" stop-color="#a66bff" stop-opacity="0"/></radialGradient>`;
  const sparks = form > 1 ? Array.from({length: 4 + form * 2}, (_, i) => `<circle class="hero-spark" cx="${30 + (i * 41) % 190}" cy="${248 - (i * 53) % 120}" r="${(.9 + (i % 3) * .5).toFixed(1)}" fill="${i % 2 ? '#e6d4ff' : '#b07cff'}" style="animation-delay:-${(i * .7).toFixed(1)}s;animation-duration:${4 + i % 4}s"/>`).join('') : '';
  return `<svg class="character arcane-character arcane-form-${form} ${large ? 'large' : ''} char-${ARCANE_ID}" viewBox="0 0 250 260" aria-label="${ARCANE_ID}, evolution ${form}" role="img"><defs>${aura}</defs>`
    + `<ellipse class="hero-aura" cx="125" cy="150" rx="${(w * .7).toFixed(1)}" ry="125" fill="url(#${id}a)"/>`
    + `<image class="hero-photo" href="./arcane/lv${form}.webp" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h}" preserveAspectRatio="xMidYMax meet"/>${sparks}</svg>`;
}
