import {JSDOM,VirtualConsole} from 'jsdom';
import {build} from 'esbuild';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../src/domain.js';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const bundled=await build({entryPoints:['src/app.js'],bundle:true,write:false,format:'iife',plugins:[{name:'cloud-fault-injection',setup(b){
 b.onLoad({filter:/[\\/]cloud\.js$/},()=>({loader:'js',contents:`
 export const configured=true,googleReady=true,trainingReady=true,skillWorkoutsReady=true,user={id:'owner',created_at:'2026-11-07T12:00:00Z'};
 export const initialize=async()=>user,load=async()=>structuredClone(window.backend.state);
 export const mySquad=async()=>({id:'squad',name:'Test squad'});
 export const social=async()=>{if(window.backend.failFeed)throw Error('PGRST201 ambiguous relationship');return {activityReady:true,posts:structuredClone(window.backend.posts),members:[],missions:[]};};
 export const save=async s=>{if(window.backend.failSave)throw Error('Save unavailable');window.backend.state=structuredClone(s);return structuredClone(s);};
 export const publish=async(squad,body,image_path,id)=>{window.backend.publishCalls++;if(!window.backend.posts.some(p=>p.id===id))window.backend.posts.unshift({id,body,image_path,user_id:user.id,created_at:new Date().toISOString(),reactions:[]});if(window.backend.loseReply)throw Error('Reply lost');return {id};};
 export const react=async(id,kind,active)=>{window.backend.reactionCalls++;await new Promise(r=>setTimeout(r,40));if(window.backend.failReact)throw Error('Reaction unavailable');const p=window.backend.posts.find(p=>p.id===id);p.reactions=p.reactions.filter(r=>r.kind!==kind);if(!active)p.reactions.push({user_id:'owner',kind});};
 export const removePost=async id=>{window.backend.posts=window.backend.posts.filter(p=>p.id!==id);};
 export const upload=async(blob,kind)=>{window.backend.uploads++;return 'owner/'+kind+'/photo'+window.backend.uploads+'.jpg';};
 export const imageUrl=async path=>'https://images.invalid/'+path;
 export const removeImage=async path=>{window.backend.removals.push(path);if(window.backend.failCleanup)throw Error('Storage unavailable');};
 export const attachPostPhoto=async(id,path)=>{window.backend.attachCalls++;window.backend.posts.find(p=>p.id===id).image_path=path;};
 export const friendsOverview=async()=>{if(window.backend.friendsMissing)throw Error('Could not find the function public.friends_overview in the schema cache');return structuredClone(window.backend.friends);},myFriendCode=async()=>'OWNER123';
 export const requestFriend=async code=>{if(code==='NOBODY00')throw Error('Hittade ingen med den vänkoden.');window.backend.friends.push({friendship_id:'f-'+code,user_id:code,display_name:'Ny vän',relation:'outgoing'});return 'pending';};
 export const respondFriend=async(id,accept)=>{const f=window.backend.friends.find(f=>f.friendship_id===id);if(accept)Object.assign(f,{relation:'friend',xp:900,streak:2,training_streak:3,trained_today:true,char_kind:'monk'});else window.backend.friends=window.backend.friends.filter(f=>f.friendship_id!==id);};
 export const removeFriend=async id=>{window.backend.friends=window.backend.friends.filter(f=>f.friendship_id!==id);};
 export const logout=async()=>{},login=async()=>{},invite=async()=>'',createSquad=async()=>{},joinSquad=async()=>{},createMission=async()=>{};
 `}));
}}]});
async function setup(failFeed=false){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM('<div id="app"></div><div id="modal-root"></div><div id="toast"></div>',{url:'https://winter.example/#squad/feed',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window;
 w.structuredClone=structuredClone;w.scrollTo=()=>{};w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};
 w.Image=class{width=100;height=100;async decode(){}};w.HTMLCanvasElement.prototype.getContext=()=>({drawImage(){}});w.HTMLCanvasElement.prototype.toBlob=function(cb){cb(new w.Blob(['JPEG'],{type:'image/jpeg'}));};
 const state=D.normalizeState(D.blankState(),'2026-11-07T12:00:00Z');state.profile.name='Cloud Tester';state.onboarded=true;
 w.backend={state,posts:[],failFeed,publishCalls:0,friends:[{friendship_id:'f-1',user_id:'u1',display_name:'Cleo',relation:'incoming'}],reactionCalls:0,uploads:0,removals:[],attachCalls:0};w.localStorage.getItem('arc-lang')||w.localStorage.setItem('arc-lang','sv');w.eval(bundled.outputFiles[0].text);await sleep(80);
 const q=s=>w.document.querySelector(s),click=async action=>{const el=q(`[data-action="${action}"]`);assert.ok(el,action);el.click();await sleep(80);},submit=async id=>{q('#'+id).dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await sleep(80);},photo=async()=>{const input=q('input[type=file]');Object.defineProperty(input,'files',{value:[new w.File(['test'],'test.jpg',{type:'image/jpeg'})],configurable:true});input.dispatchEvent(new w.Event('change',{bubbles:true}));await sleep(30);};
 return {dom,w,q,click,submit,photo,errors};
}
test('a failed social read keeps cloud profile and lets the user retry',async()=>{const x=await setup(true);try{assert.match(x.q('#app').textContent,/fortfarande inloggad/);assert.equal(x.w.localStorage.getItem('arc-mode'),'cloud');x.w.backend.failFeed=false;await x.click('refresh-social');assert.ok(x.q('[data-action=new-post]'));assert.match(x.q('#app').textContent,/Cloud Tester/);}finally{x.dom.window.close();}});
test('text + photo publishes once even when feed is down; reload shows the saved post',async()=>{const x=await setup();try{
 await x.click('new-post');x.q('[name=body]').value='Saved <b>literally</b>';await x.photo();x.w.backend.failFeed=true;await x.submit('post-form');assert.equal(x.q('.modal'),null);assert.equal(x.w.backend.posts.length,1);assert.equal(x.w.backend.uploads,1);assert.deepEqual(x.w.backend.removals,[]);assert.match(x.q('.post-text').textContent,/<b>literally<\/b>/);assert.equal(x.q('.post-text b'),null);
 x.w.backend.failFeed=false;await x.click('nav:today');await x.click('nav:squad');await x.click('tab:feed');assert.match(x.q('.post-text').textContent,/Saved/);assert.ok(x.q('.post-image'));
 }finally{x.dom.window.close();}});
test('uncertain publish preserves draft and uploaded photo across dialog reopen',async()=>{const x=await setup();try{
 await x.click('new-post');x.q('[name=body]').value='My workout';await x.photo();x.w.backend.loseReply=true;await x.submit('post-form');assert.match(x.q('.form-error').textContent,/Reply lost/);assert.equal(x.w.backend.posts.length,1);assert.equal(x.w.backend.removals.length,0);await x.click('close');await sleep(250);await x.click('new-post');assert.equal(x.q('[name=body]').value,'My workout');assert.equal(x.q('[name=body]').readOnly,true);
 x.w.backend.loseReply=false;await x.submit('post-form');assert.equal(x.w.backend.posts.length,1);assert.equal(x.w.backend.uploads,1);assert.equal(x.q('.modal'),null);
 }finally{x.dom.window.close();}});
test('reaction double taps serialize, failures keep count unchanged, attachment and deletion persist',async()=>{const x=await setup();try{
 await x.click('new-post');x.q('[name=body]').value='Workout completed';await x.submit('post-form');const id=x.w.backend.posts[0].id;
 const button=x.q(`[data-action="react:${id}:heart"]`);button.click();button.click();await sleep(100);assert.equal(x.w.backend.reactionCalls,1);assert.equal(x.w.backend.posts[0].reactions.length,1);
 x.w.backend.failReact=true;await x.click('react:'+id+':heart');assert.equal(x.q(`[data-action="react:${id}:heart"]`).getAttribute('aria-pressed'),'true');x.w.backend.failReact=false;await x.click('react:'+id+':heart');assert.equal(x.w.backend.posts[0].reactions.length,0);
 await x.click('post-photo:'+id);await x.photo();await x.submit('post-photo-form');assert.ok(x.w.backend.posts[0].image_path);assert.equal(x.w.backend.attachCalls,1);
 x.w.backend.failFeed=true;x.w.backend.failCleanup=true;await x.click('delete-post:'+id);await x.click('remove-post:'+id);assert.equal(x.w.backend.posts.length,0);assert.equal(x.q('.post'),null);assert.match(x.q('#toast').textContent,/borttaget/);
 }finally{x.dom.window.close();}});
test('failed habit saves preserve existing account data and keep the form retryable',async()=>{const x=await setup();try{
 await x.click('nav:habits');await x.click('new-habit');x.q('[name=name]').value='Practice';x.q('[name=unit]').value='min';x.w.backend.failSave=true;await x.submit('habit-form');assert.match(x.q('.form-error').textContent,/Save unavailable/);assert.equal(x.w.backend.state.habits.length,0);x.w.backend.failSave=false;await x.submit('habit-form');assert.equal(x.w.backend.state.habits.length,1);assert.equal(x.q('.modal'),null);
 }finally{x.dom.window.close();}});

test('private mirror photo upload survives a failed save and retry without becoming a post',async()=>{const x=await setup();try{
 await x.click('nav:profile');await x.click('tab:body');await x.click('new-body');await x.photo();x.w.backend.failSave=true;await x.submit('body-form');assert.equal(x.w.backend.uploads,1);assert.equal(x.w.backend.removals.length,0);assert.equal(x.w.backend.posts.length,0);
 x.w.backend.failSave=false;await x.submit('body-form');assert.equal(x.w.backend.uploads,1);assert.equal(x.w.backend.state.body.length,1);assert.match(x.w.backend.state.body[0].photo,/owner\/body\//);assert.equal(x.w.backend.posts.length,0);
 }finally{x.dom.window.close();}});
test('profile photo upload survives save failure with the same file on retry',async()=>{const x=await setup();try{
 await x.click('nav:profile');await x.click('edit-profile');await x.photo();x.w.backend.failSave=true;await x.submit('profile-form');assert.equal(x.w.backend.removals.length,0);x.w.backend.failSave=false;await x.submit('profile-form');assert.equal(x.w.backend.uploads,1);assert.match(x.w.backend.state.profile.photo,/owner\/avatar\//);assert.equal(x.q('.modal'),null);
 }finally{x.dom.window.close();}});

test('a slow private photo cannot leak into a newly opened profile form',async()=>{const x=await setup();try{
 let finishDecode;x.w.Image=class{width=100;height=100;decode(){return new Promise(r=>finishDecode=r);}};
 await x.click('nav:profile');await x.click('tab:body');await x.click('new-body');
 const input=x.q('input[type=file]');Object.defineProperty(input,'files',{value:[new x.w.File(['private'],'mirror.jpg',{type:'image/jpeg'})]});input.dispatchEvent(new x.w.Event('change',{bubbles:true}));
 await x.click('close');await sleep(250);await x.click('edit-profile');finishDecode();await sleep(30);await x.submit('profile-form');
 assert.equal(x.w.backend.uploads,0,'The closed mirror form must not supply the avatar image');assert.equal(x.w.backend.state.profile.photo||null,null);
 }finally{x.dom.window.close();}});

test('a failed strength save retains set values and technique confirmation across navigation',async()=>{const x=await setup();try{
 await x.click('nav:training');await x.click('hub:start');await x.click('hub:pick');await x.click('hub:add:sk-wrists-1');
 let f=x.q('#hub-set-sk-wrists-1-0');f.elements.namedItem('reps').value='10';f.elements.namedItem('reps').dispatchEvent(new x.w.Event('input',{bubbles:true}));f.elements.namedItem('quality').checked=true;f.elements.namedItem('quality').dispatchEvent(new x.w.Event('input',{bubbles:true}));
 x.w.backend.failSave=true;await x.submit(f.id);assert.match(x.q('#'+f.id+' .form-error').textContent,/Save unavailable/);await x.click('hub:workout-pane:skills');await x.click('hub:workout-pane:sets');f=x.q('#hub-set-sk-wrists-1-0');
 assert.equal(f.elements.namedItem('reps').value,'10');assert.equal(f.elements.namedItem('quality').checked,true);x.w.backend.failSave=false;await x.submit(f.id);assert.equal(x.w.backend.state.strength.active.exercises[0].sets[0].done,true);
 }finally{x.dom.window.close();}});
test('friends in the cloud: accept a request, send one by code, and show the update notice before migration 016',async()=>{const x=await setup();try{
 await x.click('tab:friends');await new Promise(r=>setTimeout(r,80));assert.equal(x.q('#friend-code').textContent,'OWNER123');assert.match(x.q('#view').textContent,/Cleo/);
 await x.click('friend:accept:f-1');await new Promise(r=>setTimeout(r,80));assert.ok(x.q('.friend-card'));assert.match(x.q('.friend-card').textContent,/Cleo/);
 await x.click('friend:add');x.q('[name=code]').value='nobody00';await x.submit('friend-form');assert.match(x.q('.form-error').textContent,/Hittade ingen/);
 x.q('[name=code]').value='k7q2m9xa';await x.submit('friend-form');await new Promise(r=>setTimeout(r,80));assert.equal(x.q('.modal'),null);assert.match(x.q('#view').textContent,/Väntar på svar/);
 await x.click('friend:remove:f-K7Q2M9XA');await new Promise(r=>setTimeout(r,80));assert.doesNotMatch(x.q('#view').textContent,/Väntar på svar/);
 }finally{x.dom.window.close();}
 const y=await setup();try{y.w.backend.friendsMissing=true;await y.click('tab:friends');await new Promise(r=>setTimeout(r,80));assert.match(y.q('#view').textContent,/databasuppdatering 016/);}finally{y.dom.window.close();}});
