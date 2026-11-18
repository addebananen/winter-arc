import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {keepFocus, isTyping} from '../src/keep-focus.js';

function page(html) {
  const dom = new JSDOM(`<div id="app">${html}</div><button id="outside">x</button>`);
  globalThis.CSS ??= {escape: s => String(s).replace(/["\\#.[\]]/g, '\\$&')};
  return {doc: dom.window.document, app: dom.window.document.querySelector('#app')};
}

test('a redraw keeps focus and the cursor in the field being typed in', () => {
  const html = '<form id="hub-set-1"><input name="kg" value=""><input name="reps" value="8"></form><textarea id="note">Bra pass</textarea>';
  const {doc, app} = page(html);
  const reps = doc.querySelector('[name=reps]');
  reps.focus(); reps.setSelectionRange(1, 1);
  assert.equal(isTyping(app, doc), true);
  const restore = keepFocus(app, doc);
  app.innerHTML = html;
  restore();
  const next = doc.activeElement;
  assert.notEqual(next, reps);
  assert.equal(next.name, 'reps');
  assert.equal(next.selectionStart, 1);

  doc.querySelector('#note').focus();
  const again = keepFocus(app, doc);
  app.innerHTML = html;
  again();
  assert.equal(doc.activeElement.id, 'note');
});

test('a field cleared on purpose is not focused again, and buttons are not typing', () => {
  const {doc, app} = page('<form id="post-form"><textarea name="body">Hej squad</textarea></form>');
  doc.querySelector('[name=body]').focus();
  const restore = keepFocus(app, doc);
  app.innerHTML = '<form id="post-form"><textarea name="body"></textarea></form>';
  restore();
  assert.notEqual(doc.activeElement?.name, 'body');

  doc.querySelector('#outside').focus();
  assert.equal(isTyping(app, doc), false);
});
