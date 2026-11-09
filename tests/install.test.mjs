import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM, VirtualConsole} from 'jsdom';
import {build} from 'esbuild';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const bundled = await build({entryPoints: ['src/app.js'], bundle: true, write: false, format: 'iife', target: 'es2022', plugins: [{name: 'demo', setup(b) { b.onLoad({filter: /[\\/]config\.js$/}, () => ({contents: "export const config={supabaseUrl:'',supabaseKey:'',googleEnabled:false,developmentModes:true}", loader: 'js'})); }}]});

async function open(standalone) {
  const dom = new JSDOM('<div id="app"></div><div id="modal-root"></div><div id="toast"></div>', {url: 'https://beyond.example/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: new VirtualConsole()});
  const w = dom.window; w.scrollTo = () => {}; w.structuredClone = structuredClone;
  w.localStorage.setItem('arc-mode', 'demo'); w.localStorage.setItem('arc-lang', 'sv');
  w.matchMedia = q => ({matches: standalone && q.includes('standalone'), media: q, addEventListener() {}, removeEventListener() {}});
  w.eval(bundled.outputFiles[0].text); await sleep(150);
  w.document.querySelector('.page-head [data-action="settings"]').click(); await sleep(40);
  return w;
}

test('install prompts are hidden when the app is opened from the home screen', async () => {
  const browser = await open(false);
  assert.ok(browser.document.querySelector('.modal .install-cta'), 'Shown in the browser');
  assert.ok(browser.document.querySelector('.sidebar [data-action="install"]'));
  browser.close();
  const app = await open(true);
  assert.equal(app.document.querySelector('.modal .install-cta'), null);
  assert.equal(app.document.querySelector('[data-action="install"]'), null, 'No install button anywhere');
  assert.ok(app.document.querySelector('.modal .settings-theme'), 'The rest of the settings stay');
  app.close();
});
