// Keeps the bottom menu (dock) at the bottom of the screen on phones.
// iOS Safari sometimes leaves fixed elements where they were while the keyboard was open, so after typing
// kg or reps the menu could end up in the middle of the page. While a text field has focus the menu is hidden
// (the keyboard covers that area anyway). When the keyboard closes the page is nudged so iOS lays fixed
// elements out again, and the menu follows the visible area (visualViewport) if it is still out of place.
const TEXT = 'input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=file]):not([type=range]),textarea,select';

export function keepDockInPlace(win = window) {
  const doc = win.document, root = doc.documentElement, vv = win.visualViewport;
  if (!win.matchMedia?.('(pointer: coarse)').matches) return;
  const typing = () => !!doc.activeElement?.matches?.(TEXT);
  const place = () => {
    // Where the bottom of what you see is, compared with the bottom the fixed menu is attached to.
    const gap = vv ? Math.round(win.innerHeight - vv.height - vv.offsetTop) : 0;
    root.style.setProperty('--dock-shift', !typing() && gap > 1 ? -gap + 'px' : '0px');
  };
  doc.addEventListener('focusin', () => { root.classList.toggle('keyboard-open', typing()); place(); });
  doc.addEventListener('focusout', () => setTimeout(() => {
    root.classList.toggle('keyboard-open', typing());
    if (!typing()) win.scrollTo(win.scrollX, win.scrollY);
    place();
  }, 60));
  vv?.addEventListener('resize', place);
  vv?.addEventListener('scroll', place);
  win.addEventListener('orientationchange', () => setTimeout(place, 300));
}
