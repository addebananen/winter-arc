// Training streak card: one flame per day with a saved Styrkehub workout.
// One rest day between workouts is fine; two days in a row without a workout resets it.
import {trainingStreak, workoutDays} from './strength.js';

const shift = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const weekday = d => new Intl.DateTimeFormat('sv-SE', {weekday: 'long', timeZone: 'UTC'}).format(new Date(d + 'T12:00:00Z'));
const when = (d, today) => d === today ? 'idag' : d === shift(today, 1) ? 'imorgon' : 'på ' + weekday(d);
const dagar = n => n === 1 ? 'träningsdag' : 'träningsdagar';

export function streakStatus(state, today) {
  const st = trainingStreak(state, today);
  if (!st.days && !st.best) return {...st, tone: 'start', title: 'Tänd din första flamma', text: 'Spara ett pass i Styrkehubben. Sedan räcker det att träna minst varannan dag.'};
  if (!st.days) return {...st, tone: 'start', title: 'Tänd flamman igen', text: `Två dagar utan pass släckte den. Din längsta streak är ${st.best} ${dagar(st.best)}.`};
  if (st.trainedToday) return {...st, tone: 'lit', title: `${st.days} ${dagar(st.days)}`, text: `Dagens pass är sparat. Nästa pass senast ${when(st.deadline, today)}.`};
  if (st.atRisk) return {...st, tone: 'risk', title: 'Träna idag för att behålla streaken', text: 'Igår var vilodag. Spara ett pass i Styrkehubben före midnatt.'};
  return {...st, tone: 'rest', title: 'Vilodag idag är okej', text: `Träna senast ${when(st.deadline, today)} för att hålla flamman vid liv.`};
}

export function streakCard({I, button}, state, today, {cta = true} = {}) {
  const st = streakStatus(state, today), done = new Set(workoutDays(state, today));
  const days = [...Array(7)].map((_, i) => shift(today, i - 6));
  const dots = days.map(d => `<span class="streak-day ${done.has(d) ? 'on' : ''} ${d === today ? 'today' : ''}" title="${d}"><i></i>${weekday(d).slice(0, 1).toUpperCase()}</span>`).join('');
  return `<section class="card streak-card ${st.tone}" aria-label="Träningsstreak: ${st.days} ${dagar(st.days)}">
    <div class="streak-flame">${I('flame')}<strong>${st.days}</strong></div>
    <div class="streak-text"><span class="eyebrow">TRÄNINGSSTREAK</span><h3>${st.title}</h3><p>${st.text}</p>
      <div class="streak-week" aria-hidden="true">${dots}</div></div>
    ${cta && !st.trainedToday ? button(I('dumbbell') + ' Starta pass', 'quick:workout', 'btn streak-cta') : ''}
  </section>`;
}
