// Keeps the text field you are typing in when the app redraws itself in the background, for example
// when a cloud save finishes or the squad feed refreshes. Without this the field is replaced by a new one,
// which loses focus (the phone keyboard closes) in the middle of a word.
// Only focus and the cursor are restored, and only when the redrawn field holds the same text, so a field
// that is cleared on purpose (after posting, for example) stays cleared.
const TEXT = /^(INPUT|TEXTAREA)$/;
const SKIP_TYPES = /^(button|submit|checkbox|radio|file|range|color|hidden|reset|image)$/;

function locate(el, root) {
  if (el.id) return () => root.querySelector('#' + CSS.escape(el.id));
  if (!el.name) return null;
  const form = el.form, scope = form && root.contains(form) ? form : root;
  const formKey = form && scope === form ? (form.id ? '#' + CSS.escape(form.id) : null) : '';
  if (formKey === null) return null;
  const sel = `[name="${CSS.escape(el.name)}"]`, index = [...scope.querySelectorAll(sel)].indexOf(el);
  return () => {
    const s = formKey ? root.querySelector(formKey) : root;
    return s?.querySelectorAll(sel)[index] || null;
  };
}

export function keepFocus(root, doc = document) {
  const el = doc.activeElement;
  if (!root || !el || !root.contains(el) || !TEXT.test(el.tagName) || SKIP_TYPES.test(el.type || '')) return () => {};
  const find = locate(el, root);
  if (!find) return () => {};
  const value = el.value, start = el.selectionStart, end = el.selectionEnd, direction = el.selectionDirection;
  return () => {
    const next = find();
    if (!next || next === el || next.value !== value || doc.activeElement === next) return;
    next.focus({preventScroll: true});
    try { if (start !== null) next.setSelectionRange(start, end, direction || 'none'); } catch {}
  };
}

// True while a text field inside root has focus, i.e. the user may be typing there.
export function isTyping(root, doc = document) {
  const el = doc.activeElement;
  return !!root && !!el && root.contains(el) && TEXT.test(el.tagName) && !SKIP_TYPES.test(el.type || '');
}
