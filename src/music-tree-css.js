// Styles for the music skill tree and its games. Kept in its own module (injected once) so the
// shared style.css stays untouched by this feature.
export const MUSIC_CSS = String.raw`
svg.mi{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}
.mt-star{width:13px;height:13px;fill:#2f3d3e;stroke:none}
.mt-star.on{fill:var(--gold)}
.mt-stars{display:inline-flex;gap:2px;margin-top:6px}
/* hero */
.mt-hero{position:relative;overflow:hidden;background:radial-gradient(120% 140% at 100% 0%,#33293a 0%,var(--panel) 58%);margin-bottom:16px}
.mt-hero h2{margin:8px 0 6px;font-size:22px;letter-spacing:-.7px;max-width:20ch}
.mt-hero p{font-size:12.5px;line-height:1.6}
.mt-hero-glow{position:absolute;right:-60px;top:-60px;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,#e1b6d855,transparent 65%);animation:mt-breathe 6s ease-in-out infinite;pointer-events:none}
@keyframes mt-breathe{50%{transform:scale(1.15);opacity:.7}}
.mt-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.mt-chips.center{justify-content:center}
.mt-chip{display:inline-flex;align-items:center;gap:6px;background:#202c2e;border:1px solid var(--line);padding:6px 10px;border-radius:20px;font-size:11px;color:#cfdcd8}
.mt-chip svg.mi{width:14px;height:14px}
.mt-chip .mt-star{width:13px;height:13px}
.mt-chip b{color:var(--text)}
.mt-chip.gold{border-color:#4b4738;color:#e9dcbd}
.mt-chip.hot{border-color:#6b4a2f;background:#2e2219;color:#ffcf9a}
.mt-chip.hot svg{color:#ffb36b;animation:mt-flicker 1.4s ease-in-out infinite}
@keyframes mt-flicker{50%{transform:scale(1.15) rotate(-4deg)}}
.mt-hero-actions{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap}
.mt-cta{flex:1 1 220px;justify-content:flex-start;padding:12px 16px;min-height:56px;background:linear-gradient(135deg,var(--mint),#e1d6f2);font-size:13px;text-align:left}
.mt-cta svg.mi{width:22px;height:22px;fill:#182b2b;stroke:none}
.mt-cta-text{display:flex;flex-direction:column;line-height:1.3}
.mt-cta-text small{font-size:9.5px;letter-spacing:1.4px;text-transform:uppercase;opacity:.7}
.mt-mix{flex:0 1 auto;background:#2a2337;color:#e4d9ff;border:1px solid #4a3d63;min-height:56px}
.mt-filter{margin:0 0 14px;overflow-x:auto;flex-wrap:nowrap;display:flex;gap:8px;scrollbar-width:none}
.mt-filter svg.mi{width:14px;height:14px}
/* branches */
.mt-branches{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:16px}
.mt-branch{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:18px 16px 10px}
.mt-branch header{display:flex;align-items:center;gap:12px;margin-bottom:10px}
.mt-branch header h3{font-size:16px}
.mt-branch header small{color:var(--muted);font-size:11px}
.mt-branch-ico{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:color-mix(in srgb,var(--c) 18%,transparent);color:var(--c)}
.mt-branch-count{margin-left:auto;font-size:11px;font-weight:700;color:var(--c);background:color-mix(in srgb,var(--c) 14%,transparent);padding:4px 9px;border-radius:9px}
.mt-path{list-style:none;margin:0;padding:0;position:relative}
.mt-path:before{content:"";position:absolute;left:31px;top:24px;bottom:24px;width:2px;background:repeating-linear-gradient(var(--line) 0 5px,transparent 5px 10px)}
.mt-node{position:relative;animation:mt-in .45s var(--ease-out,ease-out) both;animation-delay:calc(var(--i) * 45ms)}
@keyframes mt-in{from{opacity:0;transform:translateY(8px)}}
.mt-node-btn{width:100%;display:flex;align-items:center;gap:12px;padding:8px 6px;border-radius:16px;text-align:left;transition:background .2s}
.mt-node-btn:hover{background:#1e292b}
.mt-node-ico{position:relative;width:52px;height:52px;flex-shrink:0;display:grid;place-items:center;border-radius:50%;background:#152022;color:var(--c)}
.mt-node-ico.big{width:64px;height:64px}
.mt-node-ico>span{position:absolute;inset:0;display:grid;place-items:center}
.mt-ring{position:absolute;inset:0;transform:rotate(-90deg)}
.mt-ring circle{fill:none;stroke-width:3.2}
.mt-ring-bg{stroke:#2a3739}
.mt-ring-fg{stroke-linecap:round;transition:stroke-dashoffset 1s var(--ease-out,ease-out)}
.mt-node-text{flex:1;min-width:0;display:flex;flex-direction:column}
.mt-node-text strong{font-family:Manrope,sans-serif;font-size:14px;letter-spacing:-.2px}
.mt-node-text small{color:var(--muted);font-size:11px;margin-top:2px}
.mt-node-go{color:var(--muted)}
.mt-node.locked .mt-node-ico{color:#5d6e6f}
.mt-node.locked strong{color:#8b9a9b}
.mt-node.open .mt-node-ico,.mt-node.progress .mt-node-ico{box-shadow:0 0 0 0 color-mix(in srgb,var(--c) 45%,transparent);animation:mt-ping 2.6s ease-out infinite}
@keyframes mt-ping{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--c) 40%,transparent)}70%,100%{box-shadow:0 0 0 12px transparent}}
.mt-node.mastered .mt-node-ico{background:color-mix(in srgb,var(--c) 22%,#152022)}
.mt-about{margin:18px 0 8px;border:1px solid var(--line);border-radius:16px;padding:14px 16px;background:var(--panel)}
.mt-about summary{display:flex;align-items:center;gap:9px;cursor:pointer;font-weight:600;font-size:13px;list-style:none}
.mt-about summary svg{width:16px;height:16px;color:var(--muted)}
.mt-about p{font-size:12px;line-height:1.7;color:#c4d2cf;margin-top:10px}
/* level sheet */
.mt-sheet-head{display:flex;align-items:center;gap:14px;margin-bottom:14px}
.mt-sheet-head p{font-weight:700;margin-top:4px}
.mt-learn{background:#152022;border:1px solid var(--line);border-left:3px solid var(--c);border-radius:14px;padding:14px 16px;margin-bottom:14px}
.mt-learn p{font-size:12.5px;line-height:1.75;color:#d7e3df;margin-top:6px}
.mt-voice{margin:6px 0 14px}
.mt-voice .chips{margin-top:8px;display:flex;flex-wrap:wrap;gap:8px}
.mt-hint{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--muted);margin-top:10px;line-height:1.5}
.mt-hint svg{width:16px;height:16px}
.mt-ladder{list-style:none;margin:6px 0 0;padding:0;display:flex;flex-direction:column;gap:6px}
.mt-rung{display:flex;align-items:center;gap:12px;padding:10px 10px 10px 8px;border-radius:14px;background:#172123;border:1px solid transparent}
.mt-rung.current{border-color:color-mix(in srgb,var(--c) 55%,transparent);background:color-mix(in srgb,var(--c) 8%,#172123)}
.mt-rung.locked{opacity:.55}
.mt-rung-n{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:#223032;font-weight:700;font-size:12px;flex-shrink:0}
.mt-rung.done .mt-rung-n{background:var(--c);color:#1a2426}
.mt-rung-n svg{width:16px;height:16px}
.mt-rung-text{flex:1;min-width:0;display:flex;flex-direction:column}
.mt-rung-text strong{font-size:13px}
.mt-rung-text small{color:var(--muted);font-size:11px;margin-top:2px;line-height:1.45}
.mt-rung-play{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:var(--c);color:#1a2426;flex-shrink:0}
.mt-rung-play svg{fill:#1a2426;stroke:#1a2426}
.mt-rung.done .mt-rung-play{background:#223032;color:var(--c)}
.mt-rung.done .mt-rung-play svg{fill:none;stroke:var(--c)}
.mt-rung-lock{width:42px;display:grid;place-items:center;color:var(--muted)}
/* game overlay */
body.mg-open{overflow:hidden}
.mg{position:fixed;inset:0;z-index:200;background:var(--bg);display:flex;justify-content:center;animation:mg-in .28s var(--ease-out,ease-out) both;overscroll-behavior:contain}
@keyframes mg-in{from{opacity:0;transform:scale(.985)}}
.mg-card{position:relative;width:min(100%,560px);height:100%;display:flex;flex-direction:column;padding:max(14px,env(safe-area-inset-top)) 16px max(16px,env(safe-area-inset-bottom));background:radial-gradient(130% 60% at 50% -10%,color-mix(in srgb,var(--c) 16%,transparent),transparent 70%)}
.mg-head{display:flex;align-items:center;gap:12px;min-height:46px}
.mg-x{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:#1c2729;color:var(--muted);flex-shrink:0}
.mg-title{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.3}
.mg-title small{font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mg-title strong{font-family:Manrope,sans-serif;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mg-combo{display:inline-flex;align-items:center;gap:4px;padding:6px 10px;border-radius:20px;background:#2e2219;color:#ffcf9a;font-size:13px;opacity:0;transform:scale(.6);transition:opacity .2s,transform .25s var(--ease-out,ease-out)}
.mg-combo svg{width:16px;height:16px;color:#ffb36b}
.mg-combo.show{opacity:1;transform:none}
.mg-combo.bump{animation:mg-bump .35s var(--ease-out,ease-out)}
@keyframes mg-bump{40%{transform:scale(1.3)}}
.mg-dots{display:flex;gap:4px;margin:10px 0 4px}
.mg-dots i{flex:1;height:5px;border-radius:5px;background:#243133;transition:background .3s}
.mg-dots i.ok{background:var(--c)}
.mg-dots i.bad{background:#7a4a4a}
.mg-dots i.now{background:#43585a;animation:mg-now 1.2s ease-in-out infinite}
@keyframes mg-now{50%{opacity:.5}}
.mg-body>*{flex-shrink:0}
.mg-body{flex:1;display:flex;flex-direction:column;gap:14px;padding-top:14px;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch}
.mg-prompt{text-align:center;display:flex;flex-direction:column;align-items:center;gap:8px}
.mg-prompt h2{font-size:19px;line-height:1.35}
.mg-prompt p{font-size:12px;line-height:1.6;max-width:42ch}
.mg-big{font-size:34px;color:var(--c);display:inline-block;margin-left:6px;animation:mg-pop .4s var(--ease-out,ease-out)}
.mg-ctx{display:inline-flex;align-items:center;gap:8px;background:#1c2729;border:1px solid var(--line);border-radius:20px;padding:5px 12px;font-size:12px}
.mg-ctx small{color:var(--muted);font-size:10px;letter-spacing:1px;text-transform:uppercase;font-weight:700}
.mg-ctx b{color:var(--c);font-size:14px}
.mg-rule{font-size:12px;line-height:1.6;color:#d7e3df;background:#172123;border-radius:12px;padding:10px 12px}
.mg-listen{position:relative;align-self:center;width:112px;height:112px;border-radius:50%;background:radial-gradient(circle at 35% 30%,color-mix(in srgb,var(--c) 85%,#fff),var(--c));color:#1a2426;display:grid;place-items:center;box-shadow:0 12px 40px color-mix(in srgb,var(--c) 30%,transparent);margin:6px 0}
.mg-listen>svg{width:36px;height:36px;fill:#1a2426;stroke:none;transition:opacity .2s,transform .2s}
.mg-pulse{position:absolute;inset:0;border-radius:50%;border:2px solid var(--c);opacity:0}
.mg-listen.playing .mg-pulse{animation:mg-pulse 1.6s ease-out infinite}
.mg-listen.playing .mg-pulse.two{animation-delay:.8s}
@keyframes mg-pulse{from{transform:scale(1);opacity:.7}to{transform:scale(1.6);opacity:0}}
.mg-eq{position:absolute;display:flex;gap:4px;align-items:flex-end;height:34px;opacity:0;transition:opacity .2s}
.mg-eq i{width:5px;border-radius:3px;background:#1a2426;height:30%;animation:mg-eq .8s ease-in-out infinite}
.mg-eq i:nth-child(2){animation-delay:-.2s}.mg-eq i:nth-child(3){animation-delay:-.45s}.mg-eq i:nth-child(4){animation-delay:-.1s}.mg-eq i:nth-child(5){animation-delay:-.6s}
@keyframes mg-eq{50%{height:100%}}
.mg-listen.playing>svg{opacity:0;transform:scale(.6)}
.mg-listen.playing .mg-eq{opacity:1}
.mg-sub-actions{display:flex;justify-content:center;gap:8px;min-height:0}
.mg-sub-actions .chip svg{width:14px;height:14px}
.mg-options{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.mg-options.many{grid-template-columns:repeat(3,1fr)}
.mg-options.wide{grid-template-columns:1fr}
.mg-opt{position:relative;min-height:62px;border-radius:16px;background:#1c2729;border:1px solid var(--line);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:8px;transition:transform .15s,background .25s,border-color .25s}
.mg-opt strong{font-family:Manrope,sans-serif;font-size:15px}
.mg-opt small{color:var(--muted);font-size:10.5px}
.mg-options.many .mg-opt strong{font-size:13px}
.mg-opt:active:not(:disabled){transform:scale(.96)}
.mg-opt:disabled{opacity:1;cursor:default}
.mg-opt.right{background:color-mix(in srgb,var(--mint) 22%,#1c2729);border-color:var(--mint)}
.mg-opt.wrong{background:#3a2426;border-color:#9c5b5b}
.mg-opt:disabled:not(.right):not(.wrong){opacity:.45}
.pop{animation:mg-pop .45s var(--ease-out,ease-out)}
@keyframes mg-pop{40%{transform:scale(1.08)}}
.shake{animation:mg-shake .4s ease-in-out}
@keyframes mg-shake{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
.mg-float{position:absolute;top:-6px;right:10px;font-weight:800;color:var(--mint);font-size:15px;pointer-events:none;animation:mg-float .9s ease-out forwards}
@keyframes mg-float{to{transform:translateY(-34px);opacity:0}}
.mg-after{display:flex;flex-direction:column;gap:10px}
.mg-reveal{border-radius:16px;padding:12px 14px;background:#172123;border:1px solid var(--line);animation:mg-up .3s var(--ease-out,ease-out) both}
@keyframes mg-up{from{opacity:0;transform:translateY(10px)}}
.mg-reveal.ok{border-color:color-mix(in srgb,var(--mint) 45%,transparent)}
.mg-reveal.bad{border-color:#6e4747}
.mg-reveal strong{display:block;font-family:Manrope,sans-serif;font-size:15px;margin-bottom:8px}
.mg-reveal.ok strong{color:var(--mint)}
.mg-reveal.bad strong{color:#f0b3b3}
.mg-reveal p{font-size:12px;color:#cdd9d6;line-height:1.6}
.mg-facts{display:flex;flex-wrap:wrap;gap:8px}
.mg-facts>span{display:flex;flex-direction:column;background:#1f2b2d;border-radius:10px;padding:6px 10px;min-width:72px}
.mg-facts>span.wide{flex:1 1 100%}
.mg-facts small{font-size:9.5px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);font-weight:700}
.mg-facts b{font-size:14px}
.mg-next{width:100%;min-height:50px;font-size:13px}
.mg-row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;align-items:center}
.mg-row .btn{flex:1 1 140px;min-height:50px;font-size:13px;margin:0}
.mg-row.col{flex-direction:column;align-items:stretch}
.mg-row.col .btn{flex:none}
.mg-row .btn.ghost{background:#1c2729;color:var(--text);padding:12px 17px}
.mg-row .chip svg{width:14px;height:14px}
/* fretboard */
.mg-board{--fw:max(30px,calc((min(100vw,560px) - 74px) / var(--cols)));overflow-x:auto;padding:8px 2px 4px;-webkit-overflow-scrolling:touch;background:linear-gradient(180deg,#1a1512,#15110e);border-radius:16px;border:1px solid #3a2f26}
.mg-frets,.mg-string{display:grid;grid-template-columns:22px repeat(var(--cols),minmax(var(--fw),1fr));align-items:center;min-width:calc(22px + var(--cols) * var(--fw))}
.mg-frets{padding-left:22px;grid-template-columns:repeat(var(--cols),minmax(var(--fw),1fr));font-size:9px;color:#8a7a69;text-align:center;margin-bottom:2px}
.mg-frets span.dot:after,.mg-frets span.dbl:after{content:"•";color:#b39b7f;margin-left:3px}
.mg-frets span.dbl:after{content:"••"}
.mg-string{position:relative;height:46px}
.mg-string b{font-size:11px;color:#c9b59c;text-align:center}
.mg-string:before{content:"";position:absolute;left:22px;right:0;top:50%;height:var(--sw,2px);background:linear-gradient(90deg,#c9c3b4,#8f887a);transform:translateY(-50%);pointer-events:none}
.mg-string.s0{--sw:4px}.mg-string.s1{--sw:3.4px}.mg-string.s2{--sw:2.8px}.mg-string.s3{--sw:2.2px}
.mg-string.off{opacity:.35}
.mg-fret{position:relative;height:46px;border-right:2px solid #6e665a;display:grid;place-items:center;z-index:1}
.mg-fret.open{border-right:5px solid #d8d0c0;background:#0f0c0a}
.mg-fret:disabled{opacity:1}
.mg-fret i{font-style:normal;width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:800;background:#3a332b;color:#f0e6d6;animation:mg-pop .35s var(--ease-out,ease-out)}
.mg-fret.root i{background:var(--c);color:#1a2426;box-shadow:0 0 0 3px color-mix(in srgb,var(--c) 35%,transparent)}
.mg-fret.m-right i{background:var(--mint);color:#16302c}
.mg-fret.m-wrong i{background:#a45c5c;color:#fff}
.mg-fret.miss:after{content:"";position:absolute;width:30px;height:30px;border-radius:50%;background:#a45c5c66}
.mg-fret:active:not(:disabled):after{content:"";position:absolute;width:30px;height:30px;border-radius:50%;background:#ffffff22}
.mg-seq{display:flex;justify-content:center;gap:6px;flex-wrap:wrap}
.mg-seq span{min-width:32px;height:32px;padding:0 6px;border-radius:10px;display:grid;place-items:center;font-weight:700;font-size:12px;background:#1c2729;color:var(--muted);transition:all .25s}
.mg-seq span.done{background:var(--mint);color:#16302c}
.mg-seq span.now{background:color-mix(in srgb,var(--c) 30%,#1c2729);color:var(--text);box-shadow:0 0 0 2px var(--c)}
/* bass line */
.mg-bars{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.mg-bar{background:#172123;border:1px solid var(--line);border-radius:14px;padding:8px}
.mg-chord{display:flex;align-items:baseline;justify-content:space-between;padding:0 4px 6px}
.mg-chord b{font-family:Manrope,sans-serif;font-size:16px;color:var(--c)}
.mg-chord small{font-size:10px;color:var(--muted);font-weight:700}
.mg-slots{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}
.mg-slot{height:48px;border-radius:10px;background:#1f2b2d;border:1px dashed #3a4a4c;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:transform .12s,background .2s,box-shadow .2s}
.mg-slot b{font-size:13px}
.mg-slot small{font-size:9px;color:var(--muted)}
.mg-slot.set{border-style:solid;border-color:#3a4a4c;background:#223133}
.mg-slot.sel{box-shadow:0 0 0 2px var(--c);background:color-mix(in srgb,var(--c) 14%,#1f2b2d)}
.mg-slot.ok{background:color-mix(in srgb,var(--mint) 22%,#1f2b2d);border-color:var(--mint)}
.mg-slot.bad{background:#3a2426;border-color:#9c5b5b}
.mg-slot.beat{transform:translateY(-3px) scale(1.06);box-shadow:0 6px 18px color-mix(in srgb,var(--c) 40%,transparent)}
.mg-choices{background:#141d1f;border-radius:16px;padding:10px;border:1px solid var(--line)}
.mg-chip-row{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px}
.mg-choice{min-height:52px;border-radius:12px;background:#1f2b2d;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:4px}
.mg-choice b{font-size:14px}
.mg-choice small{font-size:9px;color:var(--muted);text-align:center;line-height:1.2}
.mg-choice.chord{border:1px solid color-mix(in srgb,var(--c) 40%,transparent)}
.mg-choice.scale{border:1px solid #3a4a4c}
.mg-choice.approach{border:1px solid #6a5a8a;background:#231f2e}
.mg-listen-btn.on svg{animation:mg-now .6s ease-in-out infinite}
/* rhythm */
.mg-grid{position:relative;display:grid;grid-template-columns:repeat(4,1fr);height:64px;background:#172123;border:1px solid var(--line);border-radius:14px;overflow:hidden}
.mg-beat{border-right:1px solid #2a3739;display:flex;align-items:flex-start;padding:6px;transition:background .1s}
.mg-beat:last-of-type{border-right:0}
.mg-beat small{font-size:10px;color:var(--muted);font-weight:700}
.mg-beat.on{background:#1f2c2e}
.mg-hit{position:absolute;bottom:12px;width:14px;height:14px;margin-left:3px;border-radius:50%;background:var(--c)}
.mg-head-line{position:absolute;top:0;bottom:0;width:2px;background:var(--mint);left:0;box-shadow:0 0 12px var(--mint)}
.mg-pad{position:relative;align-self:center;width:min(70vw,230px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 40% 35%,#2a3a3c,#172123);border:2px solid color-mix(in srgb,var(--c) 50%,transparent);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;touch-action:none;user-select:none;-webkit-user-select:none}
.mg-pad b{font-family:Manrope,sans-serif;font-size:30px;letter-spacing:1px}
.mg-pad-fb{font-size:13px;font-weight:700;min-height:18px;color:#ffcf9a}
.mg-pad-fb.ok{color:var(--mint)}
.mg-pad-fb.bad{color:#f0b3b3}
.mg-pad-ring{position:absolute;inset:-2px;border-radius:50%;border:3px solid var(--c);opacity:0}
.mg-pad.hit .mg-pad-ring{animation:mg-pulse .45s ease-out}
.mg-pad.hit{animation:mg-pop .2s ease-out}
/* breath + singing */
.mg-breath{display:flex;justify-content:center;align-items:center;gap:22px;padding:10px 0}
.mg-orb{position:relative;width:180px;height:180px;border-radius:50%;overflow:hidden;background:#172123;border:2px solid var(--line);display:flex;flex-direction:column;align-items:center;justify-content:center;transition:transform .3s,border-color .3s}
.mg-orb b{position:relative;font-family:Manrope,sans-serif;font-size:38px;z-index:1}
.mg-orb small{position:relative;z-index:1;color:var(--muted)}
.mg-orb-fill{position:absolute;inset:0;background:linear-gradient(0deg,var(--c),color-mix(in srgb,var(--c) 40%,transparent));transform-origin:bottom;transform:scaleY(0);opacity:.55;transition:transform .15s linear}
.mg-orb.live{border-color:var(--c);animation:mg-glow 1.6s ease-in-out infinite}
.mg-orb.goal{border-color:var(--mint)}
@keyframes mg-glow{50%{box-shadow:0 0 30px color-mix(in srgb,var(--c) 40%,transparent)}}
.mg-meter{position:relative;width:14px;height:170px;border-radius:8px;background:#172123;border:1px solid var(--line);overflow:hidden}
.mg-meter-lvl{position:absolute;left:0;right:0;bottom:0;height:0;background:var(--c);transition:height .08s}
.mg-meter-band{position:absolute;left:0;right:0;height:2px;bottom:20%;background:var(--mint);z-index:1}
.mg-status{text-align:center;font-size:12.5px;min-height:20px}
.mg-status .mg-facts{justify-content:center}
.mg-lung{width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--c) 60%,transparent),color-mix(in srgb,var(--c) 15%,transparent));display:grid;place-items:center;transform:scale(.8);transition:transform 1s ease-in-out}
.mg-lung span{display:none}
.mg-lung b{font-family:Manrope,sans-serif;font-size:15px}
.mg-lung.in{transform:scale(1.45);transition-duration:4s}
.mg-lung.hold{transform:scale(1.45)}
.mg-lung.out{transform:scale(.75);transition-duration:6s;transition-timing-function:linear}
.mg-targets{display:flex;justify-content:center;gap:8px}
.mg-targets span{min-width:48px;height:48px;padding:0 8px;border-radius:14px;display:grid;place-items:center;font-family:Manrope,sans-serif;font-weight:800;font-size:16px;background:#1c2729;color:var(--muted);transition:all .25s}
.mg-targets span.now{background:color-mix(in srgb,var(--c) 25%,#1c2729);color:var(--text);box-shadow:0 0 0 2px var(--c);transform:scale(1.08)}
.mg-targets span.done{background:var(--mint);color:#16302c}
.mg-targets span.missed{background:#3a2426;color:#f0b3b3}
.mg-tuner{position:relative;border-radius:18px;background:#141d1f;border:1px solid var(--line);overflow:hidden}
.mg-tuner canvas{display:block;width:100%;height:auto}
.mg-tuner-label{position:absolute;left:14px;top:10px;display:flex;flex-direction:column}
.mg-tuner-label b{font-family:Manrope,sans-serif;font-size:24px}
.mg-tuner-label small{color:var(--muted);font-size:11px}
/* results */
.mg-end .mg-body{align-items:center;text-align:center;justify-content:center}
.mg-end h2{font-size:26px;letter-spacing:-.6px;animation:mg-up .4s .3s var(--ease-out,ease-out) both}
.mg-end p{font-size:13px;max-width:34ch}
.mg-score{position:relative;width:160px;height:160px}
.mg-score svg{width:100%;height:100%;transform:rotate(-90deg)}
.mg-score circle{fill:none;stroke-width:10}
.mg-score .bg{stroke:#223032}
.mg-score .fg{stroke:var(--c);stroke-linecap:round;transition:stroke-dashoffset .9s cubic-bezier(.2,.8,.2,1)}
.mg-score>div{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:2px}
.mg-score b{font-family:Manrope,sans-serif;font-size:44px;letter-spacing:-1px}
.mg-score small{color:var(--muted);font-size:16px;margin-top:12px}
.mg-end-stars{display:flex;gap:12px;margin-top:-4px}
.mg-end-stars .mt-star{width:42px;height:42px}
.mg-end-stars span{transform:scale(.4);opacity:.35}
.mg-end-stars span.won{animation:mg-star .55s calc(.55s + var(--d) * .26s) cubic-bezier(.3,1.6,.5,1) forwards}
@keyframes mg-star{from{transform:scale(.3) rotate(-40deg);opacity:.3}to{transform:none;opacity:1}}
.mg-end .mg-row{width:100%;max-width:360px;margin-top:8px}
.mg-confetti{position:absolute;left:50%;top:32%;pointer-events:none}
.mg-confetti i{position:absolute;width:8px;height:12px;border-radius:2px;opacity:0;animation:mg-confetti 1.6s var(--d) cubic-bezier(.15,.7,.3,1) forwards}
@keyframes mg-confetti{0%{opacity:1;transform:translate(0,0) rotate(0)}100%{opacity:0;transform:translate(var(--x),calc(var(--y) + 260px)) rotate(var(--r))}}
@media(max-width:380px){.mg-options.many{grid-template-columns:1fr 1fr}.mg-listen{width:96px;height:96px}.mg-orb{width:150px;height:150px}}
@media(min-width:761px){.mg-card{height:auto;max-height:100%;margin:auto 0}}
@media(prefers-reduced-motion:reduce){.mt-node,.mt-hero-glow,.mt-node.open .mt-node-ico,.mt-node.progress .mt-node-ico,.mg,.mg-listen.playing .mg-pulse,.mg-confetti{animation:none!important}.mg-lung{transition:none}}
`;
