// Motion never owns application state. Unsupported/reduced-motion clients close immediately.
export function dismissWithMotion(overlay, complete, env = window) {
 const panel = overlay.querySelector('.modal');
 if (!panel?.animate || env.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { complete(); return; }
 if (overlay.dataset.closing) return;
 overlay.dataset.closing = 'true';
 const mobile = env.matchMedia?.('(max-width: 760px)').matches;
 let finished = false, timer, animations = [];
 const finish = () => {
  if (finished) return;
  finished = true; env.clearTimeout(timer);
  complete();
  for (const animation of animations) animation.cancel();
 };
 try {
  // Start from the visible position, including an interrupted entrance animation.
  const start = env.getComputedStyle(panel).transform;
  const opacity = env.getComputedStyle(overlay).opacity;
  animations = [
   panel.animate([{transform:start === 'none' ? 'none' : start}, {transform:mobile ? 'translateY(18px) scale(.995)' : 'scale(.975)'}], {duration:150,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'}),
   overlay.animate([{opacity},{opacity:0}], {duration:150,easing:'ease-out',fill:'forwards'})
  ];
  // A background tab or a cancelled animation must never leave a locked dialog.
  timer = env.setTimeout(finish, 220);
  Promise.all(animations.map(a => a.finished)).then(finish, finish);
 } catch { finish(); }
}
