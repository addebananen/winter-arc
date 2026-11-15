// Styles for the squad page header, member cards, habit cards, photo reactions, the photo step after
// a workout and the share bar after a check-in. Injected once so the shared style.css stays untouched.
export const SQUAD_CSS = String.raw`
.sq-hero{position:relative;overflow:hidden;border-radius:26px;padding:22px 20px 18px;background:linear-gradient(150deg,#22403b 0%,#1a2a2d 48%,#171f22 100%);border:1px solid #3a5752;margin-bottom:14px;animation:sq-rise .5s cubic-bezier(.2,.8,.2,1) both}
.sq-hero-glow{position:absolute;inset:-40% -30% auto auto;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,#c6e7df2e,transparent 65%);pointer-events:none;animation:sq-breathe 6s ease-in-out infinite}
.sq-hero-head{position:relative;display:flex;gap:14px;align-items:flex-start;justify-content:space-between}
.sq-hero h2{font-size:27px;margin:6px 0 6px;letter-spacing:-.6px;line-height:1.1}
.sq-tagline{margin:0;color:#cfe0da;font-size:13px;line-height:1.6;max-width:30ch}
.sq-today{position:relative;flex:0 0 66px;width:66px;height:66px}
.sq-today svg{width:100%;height:100%;transform:rotate(-90deg)}
.sq-today-track{fill:none;stroke:#ffffff14;stroke-width:4}
.sq-today-fill{fill:none;stroke:var(--mint);stroke-width:4;stroke-linecap:round;transition:stroke-dasharray .9s cubic-bezier(.2,.8,.2,1);filter:drop-shadow(0 0 6px #c6e7df66)}
.sq-today b{position:absolute;inset:0;display:grid;place-items:center;font-size:19px;font-weight:700;letter-spacing:-.5px}
.sq-today b small{font-size:11px;color:var(--muted);font-weight:600;margin-left:1px}
.sq-today b{display:flex;align-items:center;justify-content:center}
.sq-faces{position:relative;display:flex;align-items:center;margin:16px 0 4px;padding-left:4px}
.sq-face{background:none;border:0;padding:0;margin-left:-8px;cursor:pointer;border-radius:50%;transition:transform .2s}
.sq-face:first-child{margin-left:0}.sq-face:hover,.sq-face:focus-visible{transform:translateY(-3px);z-index:1}
.sq-faces-label{margin-left:12px;font-size:11.5px;color:#b9cbc6}
.sq-ring{position:relative;display:inline-grid;place-items:center;border-radius:50%;padding:2px;background:#ffffff12}
.sq-ring .avatar{margin:0!important;width:34px;height:34px;font-size:12px;border:2px solid #1b2b2d!important;box-shadow:none!important}
.sq-ring.lit{background:conic-gradient(from 200deg,#c6e7df,#e0c799,#c6e7df);animation:sq-glow 3s ease-in-out infinite}
.sq-ring.big .avatar{width:50px;height:50px;font-size:17px}
.sq-ring-dot{position:absolute;right:-2px;bottom:-2px;width:16px;height:16px;border-radius:50%;background:var(--mint);color:#1c3930;display:grid;place-items:center;border:2px solid #1b2b2d}
.sq-ring-dot svg{width:9px;height:9px;stroke-width:3}
.sq-stats{position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:16px 0 12px}
.sq-stats>div{background:#0f181a66;border:1px solid #ffffff10;border-radius:16px;padding:11px 10px;min-width:0}
.sq-stats b{display:block;font-size:21px;letter-spacing:-.5px;line-height:1.1}
.sq-stats small{display:block;font-size:10px;line-height:1.35;color:#a9bbb7;margin-top:3px;overflow-wrap:anywhere}
.sq-week{position:relative;display:grid;grid-template-columns:repeat(7,1fr);gap:6px;height:84px;align-items:end;padding:8px 2px 0}
.sq-day{display:flex;flex-direction:column;align-items:center;gap:5px;height:100%;justify-content:flex-end}
.sq-day i{position:relative;display:block;width:100%;max-width:26px;height:var(--h);min-height:4px;border-radius:8px;background:linear-gradient(180deg,#c6e7df,#7fb3a6);transform-origin:bottom;animation:sq-bar .7s cubic-bezier(.2,.8,.2,1) both}
.sq-day i:not([style*="--h:0%"]){box-shadow:0 0 14px #c6e7df33}
.sq-day i[style*="--h:0%"]{background:#ffffff14;height:4px}
.sq-day em{position:absolute;top:-17px;left:0;right:0;text-align:center;font-style:normal;font-size:10px;font-weight:700;color:var(--mint)}
.sq-day small{font-size:10px;color:var(--muted);font-weight:600}
.sq-day.today small{color:var(--text);background:#c6e7df22;border-radius:6px;padding:0 5px}
.sq-day.future i{opacity:.35}
.sq-day:nth-child(2) i{animation-delay:.04s}.sq-day:nth-child(3) i{animation-delay:.08s}.sq-day:nth-child(4) i{animation-delay:.12s}.sq-day:nth-child(5) i{animation-delay:.16s}.sq-day:nth-child(6) i{animation-delay:.2s}.sq-day:nth-child(7) i{animation-delay:.24s}
.sq-invite{position:relative;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px;padding-top:13px;border-top:1px dashed #ffffff1c}
.sq-invite>div{min-width:0}
.sq-invite small{display:block;font-size:10px;color:var(--muted);margin-bottom:2px}
.sq-invite code{font:600 14px/1.4 ui-monospace,Menlo,monospace;color:var(--mint);letter-spacing:1px;-webkit-user-select:all;user-select:all;word-break:break-all}
.sq-members{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding:2px 2px 12px;margin:0 -2px 8px;scrollbar-width:none}
.sq-members::-webkit-scrollbar{display:none}
.sq-member{position:relative;flex:0 0 132px;scroll-snap-align:start;display:flex;flex-direction:column;align-items:center;gap:4px;padding:15px 10px 12px;border-radius:20px;background:var(--panel);border:1px solid var(--line);color:var(--text);cursor:pointer;text-align:center;transition:transform .2s,border-color .2s;animation:sq-rise .45s cubic-bezier(.2,.8,.2,1) both}
.sq-member:nth-child(2){animation-delay:.05s}.sq-member:nth-child(3){animation-delay:.1s}.sq-member:nth-child(4){animation-delay:.15s}.sq-member:nth-child(5){animation-delay:.2s}
.sq-member:hover,.sq-member:focus-visible{transform:translateY(-2px);border-color:#4f7d72}
.sq-member.me{border-color:#4f7d72;background:linear-gradient(180deg,#1f3330,var(--panel))}
.sq-member strong{font-size:13px;margin-top:5px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sq-member small{font-size:10px;color:var(--muted)}
.sq-member-status{display:inline-flex;align-items:center;gap:4px;margin-top:6px;font-size:10px;color:var(--muted);background:#ffffff08;border-radius:99px;padding:3px 8px}
.sq-member-status svg{width:12px;height:12px}
.sq-member-status b{color:var(--text)}
.sq-member-status.lit{color:#f3d6a0;background:#e0c79918}
.sq-member-status.lit svg{color:#f0b766}
.sq-crown{position:absolute;top:9px;right:10px;color:var(--gold)}.sq-crown svg{width:13px;height:13px}
.sq-member-add{justify-content:center;border-style:dashed;background:transparent;color:var(--muted)}
.sq-member-add>svg{width:22px;height:22px;padding:13px;box-sizing:content-box;border-radius:50%;background:#ffffff08}
.sq-habit{display:flex;align-items:center;gap:12px;margin-top:4px;padding:13px 14px;border-radius:18px;background:linear-gradient(120deg,color-mix(in srgb,var(--cat) 16%,#1b2224),#1b2224);border:1px solid color-mix(in srgb,var(--cat) 30%,#343b3c)}
.sq-habit-icon{flex:0 0 38px;height:38px;border-radius:12px;display:grid;place-items:center;background:color-mix(in srgb,var(--cat) 24%,transparent);color:var(--cat)}
.sq-habit-icon svg{width:19px;height:19px}
.sq-habit-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.sq-habit-text small{font-size:9px;letter-spacing:1.4px;color:var(--cat);font-weight:700}
.sq-habit-text strong{font-size:15px;letter-spacing:-.2px}
.sq-habit-bar{display:block;height:4px;border-radius:4px;background:#ffffff12;overflow:hidden;margin-top:3px}
.sq-habit-bar i{display:block;height:100%;background:var(--cat);border-radius:4px;animation:sq-grow .8s cubic-bezier(.2,.8,.2,1) both;transform-origin:left}
.sq-habit-count{text-align:right;font-size:12px;color:var(--muted)}
.sq-habit-count b{font-size:18px;color:var(--text)}
.sq-habit-count small{display:block;font-size:10px}
.post-head .sq-action{display:block;color:#c3d2ce;font-size:12px;line-height:1.4}
.sq-photo-reacts{display:flex;align-items:center;margin-top:12px;padding-left:4px;min-height:40px}
.sq-photo-react{width:36px;height:36px;border-radius:50%;padding:0;margin-left:-9px;border:2px solid #1b2224;background:#2a3436;overflow:hidden;cursor:pointer;transition:transform .2s;animation:sq-pop .4s cubic-bezier(.3,1.6,.5,1) both}
.sq-photo-react:first-child{margin-left:0}
.sq-photo-react:hover,.sq-photo-react:focus-visible{transform:scale(1.12);z-index:1}
.sq-photo-react img,.sq-sticker img{width:100%;height:100%;object-fit:cover;display:block}
.sq-photo-names{margin-left:10px;font-size:11.5px;color:#a2acab}
.sq-photo-names b{color:var(--text);font-weight:650}
.sq-sticker-pick{margin-top:12px;padding-top:12px;border-top:1px solid #ffffff10}
.sq-stickers{display:flex;flex-wrap:wrap;gap:8px;margin-top:9px}
.sq-sticker{position:relative;width:48px;height:48px;border-radius:50%;padding:0;border:2px solid #ffffff1a;background:#ffffff08;overflow:hidden;cursor:pointer;display:grid;place-items:center;color:var(--muted);transition:transform .15s,border-color .15s}
.sq-sticker:active{transform:scale(.9)}
.sq-sticker.active{border-color:var(--mint);box-shadow:0 0 0 3px #c6e7df33}
.sq-sticker-new{border-style:dashed;display:flex;flex-direction:column;gap:1px;font-size:9px}
.sq-sticker-new svg{width:16px;height:16px}
.sq-sticker-clear svg{width:14px;height:14px}
.sq-photo-step{display:flex;align-items:center;gap:13px;margin:16px 0 4px;padding:14px;border-radius:18px;border:1px dashed #5d7f77;background:linear-gradient(120deg,#1f3330,#182326);cursor:pointer;text-align:left;transition:border-color .2s,transform .15s}
.sq-photo-step:hover{border-color:var(--mint)}.sq-photo-step:active{transform:scale(.98)}
.sq-photo-step>span:nth-of-type(2){flex:1;min-width:0}
.sq-photo-step b{display:block;font-size:14px}
.sq-photo-step small{display:block;font-size:11px;color:var(--muted);margin-top:2px;line-height:1.45}
.sq-photo-step>svg{width:18px;height:18px;color:var(--mint)}
.sq-photo-icon{flex:0 0 42px;height:42px;border-radius:14px;display:grid;place-items:center;background:#c6e7df1f;color:var(--mint)}
.sq-photo-icon svg{width:20px;height:20px}
.sq-photo-step.busy{opacity:.7;pointer-events:none}.sq-photo-step.busy .sq-photo-icon{animation:sq-breathe 1.2s ease-in-out infinite}
.sq-photo-step.done{border-style:solid;cursor:default;align-items:center}
.sq-photo-step.done img{width:64px;height:64px;border-radius:14px;object-fit:cover;flex-shrink:0;animation:sq-pop .45s cubic-bezier(.3,1.6,.5,1) both}
.sq-photo-step.done b{display:flex;align-items:center;gap:6px;color:var(--mint);font-size:13px}
.sq-photo-step.done b svg{width:15px;height:15px}
.sq-photo-change{display:inline-flex;align-items:center;gap:6px;margin-top:8px;font-size:12px;color:var(--muted);cursor:pointer;min-height:32px}
.sq-photo-change svg{width:14px;height:14px}
#sq-share-root{position:fixed;left:0;right:0;bottom:calc(98px + env(safe-area-inset-bottom));z-index:120;display:flex;justify-content:center;padding:0 14px;pointer-events:none}
@media(min-width:701px){#sq-share-root{bottom:28px}}
.sq-share-bar{pointer-events:auto;position:relative;display:grid;grid-template-columns:1fr auto auto;gap:6px 8px;align-items:center;width:100%;max-width:440px;padding:14px 8px 10px 16px;border-radius:22px;background:#203431f2;border:1px solid #4f7d72;box-shadow:0 18px 40px #050b0caa;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);animation:sq-up .35s cubic-bezier(.2,.9,.3,1.2) both}
.sq-share-bar.leaving{animation:sq-down .25s ease-in both}
.sq-share-text{min-width:0}
.sq-share-text small{display:block;font-size:11px;color:var(--gold);font-weight:650}
.sq-share-text strong{display:block;font-size:14px}
.sq-share-name{display:block;font-size:12px;color:#c3d2ce;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sq-share-btn{min-height:42px;padding:0 16px}
.sq-share-bar.shared .sq-share-btn{color:var(--mint);border-color:#4f7d72}
.sq-share-always{grid-column:1/-1;display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--muted);cursor:pointer;min-height:28px}
.sq-share-always input{width:18px;height:18px;accent-color:var(--mint);margin:0}
.sq-share-close{width:38px;height:38px;grid-column:3;grid-row:1}
.sq-photo-big{display:block;width:100%;max-height:60vh;object-fit:contain;border-radius:18px;background:#0d1415}
.sq-share-field{display:flex!important;align-items:center;gap:10px;padding:12px 0 2px;font-size:12.5px;color:var(--text)}
.sq-share-field input{width:20px!important;height:20px;flex:0 0 20px;accent-color:var(--mint);margin:0}
.sq-share-field small{display:block;color:var(--muted);font-size:11px}
.sq-composer-hints{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin:-4px 0 14px}
.sq-composer-hints::-webkit-scrollbar{display:none}
.sq-composer-hints .chip{flex-shrink:0}
@keyframes sq-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes sq-breathe{0%,100%{opacity:.7;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}
@keyframes sq-glow{0%,100%{filter:drop-shadow(0 0 0 #c6e7df00)}50%{filter:drop-shadow(0 0 5px #c6e7df88)}}
@keyframes sq-bar{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes sq-grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes sq-pop{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}
@keyframes sq-up{from{opacity:0;transform:translateY(24px) scale(.96)}to{opacity:1;transform:none}}
@keyframes sq-down{to{opacity:0;transform:translateY(18px)}}
@media(prefers-reduced-motion:reduce){.sq-hero,.sq-member,.sq-day i,.sq-habit-bar i,.sq-photo-react,.sq-share-bar,.sq-hero-glow,.sq-ring.lit{animation:none!important}}
`;
