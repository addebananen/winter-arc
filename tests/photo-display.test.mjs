import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {displayPhoto} from '../src/photo-display.js';
function fixture(){const dom=new JSDOM('<div class="post-media"><img data-photo="owner/posts/test.jpg"><div class="photo-fallback" hidden>Försök igen</div></div>');return {dom,image:dom.window.document.querySelector('img'),fallback:dom.window.document.querySelector('.photo-fallback')};}
test('missing storage object displays an actionable fallback without broken-image UI',async()=>{const f=fixture();try{await displayPhoto(f.image,async()=>{throw Error('Object not found');});assert.equal(f.image.hidden,true);assert.equal(f.fallback.hidden,false);}finally{f.dom.window.close();}});
test('a signed URL that fails to load uses the same fallback and retry can recover',async()=>{const f=fixture();try{await displayPhoto(f.image,async()=> 'https://example.test/expired');f.image.dispatchEvent(new f.dom.window.Event('error'));assert.equal(f.fallback.hidden,false);await displayPhoto(f.image,async()=> 'https://example.test/fresh');f.image.dispatchEvent(new f.dom.window.Event('load'));assert.equal(f.image.hidden,false);assert.equal(f.fallback.hidden,true);assert.match(f.image.src,/fresh/);}finally{f.dom.window.close();}});
test('late image responses cannot mutate a removed card',async()=>{const f=fixture();try{let resolve;const done=displayPhoto(f.image,()=>new Promise(r=>resolve=r));f.image.remove();resolve('https://example.test/photo');await done;assert.equal(f.image.getAttribute('src'),null);}finally{f.dom.window.close();}});
