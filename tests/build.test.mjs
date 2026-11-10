import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
test('release assets are versioned and updates bypass stale HTTP caches',async()=>{
 execFileSync(process.execPath,['scripts/build.mjs'],{stdio:'pipe'});
 const html=await readFile('dist/index.html','utf8'),script=await readFile('dist/sw.js','utf8'),version=html.match(/app\.js\?v=([a-f0-9]{12})/)[1];
 assert.ok(html.includes('style.css?v='+version));assert.ok(html.includes('apple-touch-icon.png?v='+version),'Home screen icon URL changes with each release');const manifest=JSON.parse(await readFile('dist/manifest.webmanifest','utf8'));assert.ok(manifest.icons.every(i=>i.src.endsWith('?v='+version)));assert.equal(manifest.name,'Beyond Self');assert.ok(!script.includes('apple-touch-icon'),'The service worker never touches the home screen icon (iOS shows a letter then)');assert.ok(script.includes('winter-arc-'+version));
 const events={},requests=[],fetched=[],stored=[];const cache={addAll:async reqs=>requests.push(...reqs),put:async(req)=>stored.push(req.url)};
 const url=new URL('https://winter.example/winter-arc/sw.js');
 vm.runInNewContext(script,{self:{location:url,addEventListener:(name,fn)=>events[name]=fn,clients:{claim:async()=>{}},skipWaiting:()=>{}},location:url,caches:{open:async()=>cache,match:async()=>new Response('offline shell')},Request,Response,URL,Set,fetch:async(req,opts)=>{fetched.push({url:req.url,cache:opts.cache});return new Response('current build');}});
 let install;events.install({waitUntil:p=>install=p});await install;
 assert.ok(requests.every(r=>r.cache==='reload'));assert.ok(requests.some(r=>r.url.endsWith('app.js?v='+version)));
 let response;events.fetch({request:new Request('https://winter.example/winter-arc/app.js?v='+version),respondWith:p=>response=p});assert.equal(await(await response).text(),'current build');assert.equal(fetched[0].cache,'no-store');
 for(const icon of ['apple-touch-icon.png','apple-touch-icon.png?v='+version,'icon-512.png?v='+version,'icon-maskable-512.png?v='+version]){let intercepted=false;events.fetch({request:new Request('https://winter.example/winter-arc/'+icon),respondWith:()=>intercepted=true});assert.equal(intercepted,false,icon);}
 for(const privateUrl of ['https://project.supabase.co/rest/v1/user_states','https://winter.example/winter-arc/?code=secret','https://winter.example/another-app/app.js?v='+version]){let intercepted=false;events.fetch({request:new Request(privateUrl),respondWith:()=>intercepted=true});assert.equal(intercepted,false);}
});
