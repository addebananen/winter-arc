import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createSocialUI,reactions} from '../src/social-ui.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ui=createSocialUI({esc,I:()=>'<svg></svg>',selfId:()=> 'me',button:(t,a,c,x)=>`<button class="${c}" data-action="${a}" ${x||''}>${t}</button>`});
const post={id:'p',profiles:{display_name:'Friend <script>'},reactions:[],workout:{kind:'strength',title:'Styrkepass',minutes:25,exercises:[{id:'bench',sets:[{kg:60,reps:8,type:'failure'},{kg:50,reps:12,type:'drop'}]},{id:'sk-oahs-7',sets:[{reps:10}]}]}};
test('workout cards open complete set details with correct units, types and escaped names',()=>{
 const dom=new JSDOM(ui.workoutCard(post)+ui.details(post)),d=dom.window.document;
 assert.ok(d.querySelector('[data-action="post-workout:p"]'));assert.match(d.body.textContent,/25/);assert.equal(d.querySelectorAll('.shared-exercise').length,2);
 assert.match(d.querySelector('.shared-sets').textContent,/60 kg.*8.*Failure.*50 kg.*12.*Drop-set/s);assert.match(d.querySelectorAll('.shared-sets')[1].textContent,/Tid.*10 s/s);assert.equal(d.querySelector('script'),null);dom.window.close();
});
test('cardio details include distance, duration and pace, without invented set rows',()=>{
 const dom=new JSDOM(ui.details({...post,workout:{kind:'cardio',activity:'run',km:5,seconds:1515}}));const text=dom.window.document.body.textContent;
 assert.match(text,/Löpning/);assert.match(text,/25[.,]3/);assert.match(text,/5:03/);assert.equal(dom.window.document.querySelector('table'),null);dom.window.close();
});
test('eight labeled reactions expose accessible toggles and legacy servers get only supported choices',()=>{
 const p={...post,reactions:[{user_id:'me',kind:'rocket'},{user_id:'friend',kind:'rocket'}]};const dom=new JSDOM(ui.reactionBar(p,'rocket')),d=dom.window.document;
 assert.equal(reactions.length,8);assert.equal(d.querySelectorAll('.reaction-option').length,8);assert.equal(d.querySelector('[data-action="react:p:rocket"]').getAttribute('aria-pressed'),'true');assert.equal(d.querySelector('.reaction-pop .reaction-count').textContent,'2');
 const legacy=createSocialUI({esc,I:()=>'',selfId:()=> 'me',expanded:()=>false,button:(t,a)=>`<button data-action="${a}">${t}</button>`});assert.doesNotMatch(legacy.reactionBar(post),/rocket|respect|strong/);dom.window.close();
});
test('unavailable historical workouts explain the limitation instead of displaying zero results',()=>{
 const html=ui.details({...post,body:'Old workout',workout:{kind:'strength',unavailable:true}});assert.match(html,/finns inte längre/);assert.doesNotMatch(html,/shared-metrics|shared-sets/);
});
