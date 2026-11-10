import {build} from 'esbuild';
import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await mkdir('dist',{recursive:true});
await build({entryPoints:['src/app.js'],bundle:true,minify:true,format:'esm',target:['safari16'],outfile:'dist/app.js'});
for(const file of ['index.html','style.css','icon.svg','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png','manifest.webmanifest'])await copyFile('src/'+file,'dist/'+file);
const fingerprint=createHash('sha256');
for(const file of ['app.js','style.css','index.html','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'])fingerprint.update(await readFile('dist/'+file));
fingerprint.update(await readFile('scripts/build.mjs'));
const version=fingerprint.digest('hex').slice(0,12);
const html=(await readFile('dist/index.html','utf8')).replace('./app.js','./app.js?v='+version).replace('./style.css','./style.css?v='+version)
 // Versioned icon URLs so phones and browsers fetch the current app icon instead of an old cached one.
 .replace('href="./apple-touch-icon.png"','href="./apple-touch-icon.png?v='+version+'"').replace('href="./icon.svg"','href="./icon.svg?v='+version+'"');
const manifest=JSON.parse(await readFile('dist/manifest.webmanifest','utf8'));for(const icon of manifest.icons)icon.src+='?v='+version;await writeFile('dist/manifest.webmanifest',JSON.stringify(manifest));
await writeFile('dist/index.html',html);
// Home screen icons are never cached or intercepted by the service worker: iOS shows a letter instead of
// the icon when the service worker answers the touch-icon request. The manifest is left to the browser too.
const assets=['./','./index.html','./app.js?v='+version,'./style.css?v='+version,'./icon-192.png'];
await writeFile('dist/sw.js',`const CACHE='winter-arc-${version}';const ASSETS=${JSON.stringify(assets)};const URLS=new Set(ASSETS.map(a=>new URL(a,self.location.href).href));
async function installShell(){const cache=await caches.open(CACHE);await cache.addAll(ASSETS.map(a=>new Request(new URL(a,self.location.href),{cache:'reload'})));}
self.addEventListener('install',e=>e.waitUntil(installShell()));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('winter-arc-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin||!URLS.has(u.href))return;
e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{if(r.ok&&!r.redirected){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r}).catch(()=>caches.match(e.request).then(r=>r||new Response('Offline',{status:503}))));});`);
await writeFile('dist/_headers',`/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: geolocation=(), microphone=()\n  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' blob: data: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co; object-src 'none'; base-uri 'self'\n/index.html\n  Cache-Control: no-cache\n/sw.js\n  Cache-Control: no-cache\n/app.js\n  Cache-Control: no-cache\n/style.css\n  Cache-Control: no-cache\n`);
console.log('Built Beyond Self '+version);
