// Styles for skill goals, ready workouts, the rest timer and the workout summary. Kept in its own
// module (injected once) so the shared style.css stays untouched by this feature.
export const SKILL_PATH_CSS = String.raw`
.sp-goal{position:relative;overflow:hidden;background:radial-gradient(130% 120% at 100% 0%,color-mix(in srgb,var(--cat,var(--mint)) 16%,var(--panel)) 0%,var(--panel) 60%);border-color:color-mix(in srgb,var(--cat,var(--mint)) 30%,var(--line));margin-bottom:18px;padding:20px}
.sp-goal h2{margin:4px 0 2px;font-size:22px}
.sp-goal-top{display:flex;gap:14px;align-items:center}
.sp-goal-title{flex:1;min-width:0}
.sp-change{flex-shrink:0;align-self:flex-start}
.sp-ring{position:relative;width:76px;height:76px;flex-shrink:0;display:block}
.sp-ring svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}
.sp-ring-track{fill:none;stroke:#26323400;stroke:color-mix(in srgb,var(--cat) 14%,#1a2426);stroke-width:5}
.sp-ring-fill{fill:none;stroke:var(--cat);stroke-width:5;stroke-linecap:round;transition:stroke-dashoffset .9s cubic-bezier(.2,.8,.2,1)}
.sp-ring-art{position:absolute;inset:9px;border-radius:50%;background:#132022;display:grid;place-items:center;overflow:hidden}
.sp-ring-art svg{width:100%;height:100%;position:static;transform:none}
.sp-meter{display:flex;align-items:baseline;gap:6px;margin-top:2px}
.sp-meter-count{font-weight:800;font-size:15px;color:var(--text);font-variant-numeric:tabular-nums}
.sp-meter-count b{color:var(--cat,var(--mint));font-size:19px}
.sp-meter-count.big b{font-size:28px}
.sp-pre-left{display:block;margin-top:2px}
.sp-next{display:flex;gap:11px;align-items:flex-start;margin:16px 0 4px;padding:12px 14px;border-radius:14px;background:#122022;border:1px solid var(--line)}
.sp-next>span:first-child{color:var(--cat,var(--mint));padding-top:2px}
.sp-next>span:last-child{display:flex;flex-direction:column;gap:2px;min-width:0}
.sp-next strong{font-size:14px}
.sp-next-label{color:var(--cat,var(--mint));font-size:9px;letter-spacing:1.4px;text-transform:uppercase;font-weight:700}
.sp-today{margin-top:14px}
.sp-today-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:10px}
.sp-plan{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.sp-plan-row{display:flex;align-items:center;gap:10px;padding:6px 10px 6px 6px;border-radius:12px;background:#152224;border:1px solid var(--line);border-left:3px solid var(--role,var(--line))}
.sp-plan-row.warm{--role:#88d3cf}.sp-plan-row.keep{--role:#7f9a96}.sp-plan-row.pre{--role:#a7bcfa}.sp-plan-row.main{--role:var(--gold)}.sp-plan-row.support{--role:#e1b6d8}
.sp-plan-art{width:42px;height:34px;border-radius:8px;background:#101b1d;display:grid;place-items:center;flex-shrink:0;overflow:hidden}
.sp-plan-art svg{width:100%;height:100%}
.sp-plan-text{flex:1;min-width:0;display:flex;flex-direction:column}
.sp-plan-text strong{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sp-role{color:var(--role);font-size:9px;letter-spacing:1.2px;text-transform:uppercase;font-weight:700}
.sp-plan-goal{font-size:11px;color:var(--muted);white-space:nowrap;font-variant-numeric:tabular-nums}
.btn.sp-start{margin-top:14px;min-height:48px;font-size:13px}
.sp-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
.sp-actions .btn{margin-top:0;gap:6px;white-space:nowrap}
.sp-actions .btn small{color:var(--muted);font-weight:600}
.sp-actions .btn:only-child{grid-column:1/-1}
.sp-rest{margin-top:14px}
/* goal picker */
.sp-pick h2{margin-bottom:6px}
.sp-pick-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:14px}
.sp-pick-opt{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 4px;border-radius:14px;border:1px solid var(--line);background:#142022;transition:transform .15s,border-color .15s}
.sp-pick-opt:active{transform:scale(.96)}
.sp-pick-opt:hover{border-color:var(--cat)}
.sp-pick-opt strong{font-size:11px;text-align:center;line-height:1.2}
.sp-pick-opt small{font-size:9px;color:var(--muted)}
.sp-pick-art{width:54px;height:44px;display:grid;place-items:center;overflow:hidden}
.sp-pick-art svg{width:100%;height:100%}
.sp-group{margin:18px 0 8px;font-size:12px;color:var(--muted);letter-spacing:1px;text-transform:uppercase}
.sp-pick-list{display:flex;flex-direction:column;gap:6px}
.sp-pick-row{display:flex;gap:12px;align-items:center;text-align:left;padding:8px 12px 8px 8px;border-radius:14px;border:1px solid var(--line);background:var(--surface)}
.sp-pick-row.selected{border-color:var(--cat);box-shadow:0 0 0 1px var(--cat) inset}
.sp-pick-row>span:last-child{flex:1;display:flex;flex-direction:column;gap:3px}
.sp-pick-row small{color:var(--muted);font-size:10px}
.sp-mini-bar{display:block;height:3px;border-radius:2px;background:#26343a;overflow:hidden}
.sp-mini-bar i{display:block;height:100%;background:var(--cat)}
/* road */
.sp-road-head{display:flex;align-items:center;gap:16px;margin-bottom:14px}
.sp-road-head>div:first-child{display:flex;flex-direction:column}
.sp-road-bar{flex:1;height:8px;border-radius:4px;background:#22302f;overflow:hidden}
.sp-road-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--cat),var(--gold));border-radius:4px}
.sp-road .notice{margin-bottom:12px}
.sp-seg{margin:14px 0 4px}
.sp-seg h4{margin:0 0 8px;font-size:12px;display:flex;align-items:center;gap:6px}
.sp-seg.done h4{color:var(--muted)}
.sp-seg h4 svg{width:14px;height:14px;fill:var(--mint)}
.sp-tag{font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#a7bcfa;border:1px solid #3a4a72;border-radius:8px;padding:2px 6px;font-weight:700}
.sp-seg ol{list-style:none;margin:0;padding:0 0 0 13px;border-left:2px solid #2a3739;display:flex;flex-direction:column;gap:6px}
.sp-step{display:flex;align-items:center;gap:8px;position:relative}
.sp-dot{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:10px;font-weight:800;background:#1b2729;border:1px solid var(--line);color:var(--muted);margin-left:-25px;flex-shrink:0}
.sp-dot svg{width:12px;height:12px}
.sp-step.done .sp-dot{background:var(--mint);border-color:var(--mint);color:#173030}
.sp-step.ready .sp-dot{background:var(--gold);border-color:var(--gold);color:#2b2414;box-shadow:0 0 0 4px color-mix(in srgb,var(--gold) 22%,transparent);animation:sp-pulse 2.2s ease-in-out infinite}
.sp-step-main{flex:1;display:flex;align-items:center;gap:10px;text-align:left;padding:6px 8px;border-radius:12px;border:1px solid transparent;min-width:0}
.sp-step.ready .sp-step-main{border-color:color-mix(in srgb,var(--gold) 45%,var(--line));background:#1f251d}
.sp-step.later .sp-step-main{opacity:.62}
.sp-step-main>span:last-child{display:flex;flex-direction:column;min-width:0}
.sp-step-main strong{font-size:12px}
.sp-step-main small{font-size:10px;color:var(--muted)}
.sp-step-art{width:40px;height:32px;flex-shrink:0;display:grid;place-items:center;overflow:hidden;border-radius:8px;background:#121d1f}
.sp-step-art svg{width:100%;height:100%}
.sp-step-add{flex-shrink:0;color:var(--gold);border-color:color-mix(in srgb,var(--gold) 45%,var(--line))}
@keyframes sp-pulse{50%{box-shadow:0 0 0 7px color-mix(in srgb,var(--gold) 6%,transparent)}}
/* active workout: goal progress on skill exercises */
.sp-goal-chip{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;margin:2px 0 8px;font-size:11px;color:var(--muted)}
.sp-goal-chip b{color:var(--text)}
.sp-pips{display:inline-flex;gap:3px}
.sp-pips i{width:16px;height:5px;border-radius:3px;background:#2c3a3b}
.sp-pips i.on{background:var(--gold)}
.sp-goal-chip.complete{color:var(--gold)}
.sp-goal-chip .sp-unlock{flex-basis:100%}
.sp-note{margin:4px 0 14px}
.sp-note summary{list-style:none;display:flex;align-items:center;gap:8px;cursor:pointer;color:var(--muted);font-size:12px;padding:6px 0}
.sp-note summary::-webkit-details-marker{display:none}
.sp-note summary svg{width:16px;height:16px}
.sp-note[open] summary{color:var(--text)}
.sp-goal-chip.complete svg{width:14px;height:14px}
/* rest timer */
.sp-timer{white-space:nowrap;position:fixed;left:50%;bottom:calc(150px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:40;display:flex;align-items:center;gap:10px;padding:8px 8px 8px 16px;border-radius:30px;background:#1d2a2c;border:1px solid #3a4c4c;box-shadow:0 12px 30px #0009;animation:sp-up .25s ease-out;max-width:calc(100vw - 32px)}
.sp-timer.done{border-color:var(--gold);background:#2a2a1f}
.sp-timer-label{font-size:10px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;font-weight:700}
.sp-timer-time{font-size:18px;font-weight:800;font-variant-numeric:tabular-nums;min-width:48px}
.sp-timer button{border-radius:20px;padding:7px 11px;font-size:11px;font-weight:700;background:#273536;color:var(--text);border:1px solid var(--line)}
.sp-timer-bar{position:absolute;left:16px;right:16px;bottom:3px;height:2px;border-radius:2px;background:#2c3a3b;overflow:hidden}
.sp-timer-bar i{display:block;height:100%;background:var(--mint);transition:width 1s linear}
@keyframes sp-up{from{opacity:0;transform:translate(-50%,12px)}}
@media(min-width:761px){.sp-timer{bottom:28px}}
/* workout summary */
.sp-sum{text-align:center}
.sp-sum-burst{position:relative;width:96px;height:96px;margin:0 auto 6px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle,color-mix(in srgb,var(--gold) 30%,transparent),transparent 70%);animation:sp-pop .5s cubic-bezier(.2,1.4,.4,1)}
.sp-sum-burst svg{width:44px;height:44px;color:var(--gold)}
.sp-sum-xp{font-size:40px;font-weight:800;line-height:1;color:var(--gold);font-variant-numeric:tabular-nums}
.sp-sum-xp small{font-size:14px;margin-left:4px;color:var(--muted)}
.sp-sum-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:16px 0}
.sp-sum-grid>div{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:10px 6px;display:flex;flex-direction:column;gap:2px}
.sp-sum-grid b{font-size:18px}
.sp-sum-grid small{font-size:10px;color:var(--muted)}
.sp-sum-bar{height:8px;border-radius:4px;background:#22302f;overflow:hidden;margin:6px 0 4px}
.sp-sum-bar i{display:block;height:100%;width:var(--from);background:linear-gradient(90deg,var(--mint),var(--gold));border-radius:4px;animation:sp-fill 1.1s .3s cubic-bezier(.2,.8,.2,1) forwards}
.sp-sum-row{display:flex;justify-content:space-between;gap:10px;font-size:11px;color:var(--muted);text-align:left}
.sp-sum-row b{color:var(--text)}
.sp-sum-block{text-align:left;margin-top:14px;padding:12px 14px;border-radius:14px;background:#142123;border:1px solid var(--line)}
.sp-sum-block h4{margin:0 0 6px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--muted)}
.sp-sum-block ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px}
.sp-sum-block li{display:flex;gap:8px;align-items:center;font-size:12px}
.sp-sum-block li svg{width:16px;height:16px;color:var(--gold);flex-shrink:0}
.sp-sum-unlock li{animation:sp-in .4s both}
.sp-sum-unlock li:nth-child(2){animation-delay:.12s}.sp-sum-unlock li:nth-child(3){animation-delay:.24s}
@keyframes sp-pop{from{transform:scale(.3);opacity:0}}
@keyframes sp-fill{to{width:var(--to)}}
@keyframes sp-in{from{opacity:0;transform:translateY(6px)}}
.sp-up{color:var(--gold);font-weight:800}
.sp-make-goal{margin:0 0 16px}
.sp-is-goal{margin:0 0 16px;color:var(--gold)}
/* strength hub: rank hint */
.sp-rank-next{display:flex;gap:12px;align-items:center;margin-top:12px;padding:12px 14px;border-radius:14px;background:#142123;border:1px solid var(--line);font-size:11px;color:var(--muted)}
.sp-rank-next b{color:var(--text)}
.sp-rank-next>div{flex:1;min-width:0}
.sp-rank-fams{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px}
.sp-rank-fams span{display:flex;flex-direction:column;gap:3px;font-size:9px;letter-spacing:.6px;text-transform:uppercase}
.sp-rank-fams span.low{color:var(--gold)}
.sp-rank-fams i{display:block;height:4px;border-radius:2px;background:#2a3739;overflow:hidden}
.sp-rank-fams i b{display:block;height:100%;background:var(--mint)}
.sp-rank-fams span.low i b{background:var(--gold)}
@media(prefers-reduced-motion:reduce){.sp-step.ready .sp-dot,.sp-sum-burst,.sp-sum-unlock li,.sp-timer{animation:none}.sp-sum-bar i{animation:none;width:var(--to)}.sp-ring-fill{transition:none}}
`;
