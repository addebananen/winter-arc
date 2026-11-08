import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {createSocialClient,POST_SELECT} from '../src/social-client.js';

function fixture(){
 const calls=[],posts=new Map(),reactions=new Set();let loseReply=false,failRead=false;
 const fetch=async(url,init)=>{
  const u=new URL(url),table=u.pathname.split('/').at(-1),method=init.method||'GET',body=init.body?JSON.parse(init.body):null;
  calls.push({table,method,body,query:u.searchParams});let result=null,status=200;
  if(table==='posts'){
   if(method==='POST'){
    if(posts.has(body.id)){result={code:'23505',message:'duplicate key'};status=409;}
    else{posts.set(body.id,body);if(loseReply){loseReply=false;throw Error('Response lost after commit');}result={id:body.id};}
   }else if(method==='DELETE'){posts.delete(u.searchParams.get('id')?.slice(3));status=204;}
   else{
    if(failRead){result={message:'offline'};status=503;}
    else if(u.searchParams.has('id'))result=posts.has(u.searchParams.get('id').slice(3))?[{id:u.searchParams.get('id').slice(3)}]:[];
    else {assert.equal(u.searchParams.get('select'),POST_SELECT);result=[...posts.values()].map(p=>({...p,profiles:{display_name:'Test'},reactions:[]}));}
   }
  }else if(table==='reactions'){
   const key=method==='POST'?JSON.stringify(body):JSON.stringify({post_id:u.searchParams.get('post_id').slice(3),user_id:u.searchParams.get('user_id').slice(3),kind:u.searchParams.get('kind').slice(3)});
   if(method==='POST'){if(reactions.has(key)){status=409;result={code:'23505',message:'duplicate'};}else{reactions.add(key);status=201;}}
   else{reactions.delete(key);status=204;}
  }
  return new Response(status===204?null:JSON.stringify(result),{status,headers:{'Content-Type':'application/json'}});
 };
 const client=createClient('https://isolated.invalid','test-public-key',{auth:{persistSession:false,autoRefreshToken:false},global:{fetch}});
 return {api:createSocialClient(client,()=>({id:'owner'})),calls,posts,reactions,lose:()=>loseReply=true,offline:v=>failRead=v};
}
test('real Supabase query builder uses explicit author and reaction foreign keys',async()=>{
 const f=fixture();await f.api.publish({id:'squad'},'Hello','owner/posts/photo.jpg','post1');const posts=await f.api.feed({id:'squad'});
 assert.equal(posts[0].profiles.display_name,'Test');assert.equal(f.calls.at(-1).query.get('squad_id'),'eq.squad');assert.match(POST_SELECT,/profiles!posts_user_id_fkey/);
});
test('lost insert response is reconciled without duplicate posts or image loss',async()=>{
 const f=fixture();f.lose();assert.deepEqual(await f.api.publish({id:'squad'},'Hello','owner/posts/photo.jpg','post1'),{id:'post1'});
 await f.api.publish({id:'squad'},'Hello','owner/posts/photo.jpg','post1');assert.equal(f.posts.size,1);assert.equal(f.posts.get('post1').image_path,'owner/posts/photo.jpg');
});
test('uncertain save can be retried after connectivity returns with the same ID',async()=>{
 const f=fixture();f.lose();f.offline(true);await assert.rejects(f.api.publish({id:'squad'},'Hello',null,'post1'));f.offline(false);await f.api.publish({id:'squad'},'Hello',null,'post1');assert.equal(f.posts.size,1);
});
test('feed failure after publishing cannot undo a successful post',async()=>{
 const f=fixture();await f.api.publish({id:'squad'},'Hello','owner/posts/photo.jpg','post1');f.offline(true);await assert.rejects(f.api.feed({id:'squad'}));assert.equal(f.posts.size,1);
});
test('reaction creation and removal tolerate retries and keep per-user filters',async()=>{
 const f=fixture();await f.api.react('post1','heart',false);await f.api.react('post1','heart',false);assert.equal(f.reactions.size,1);await f.api.react('post1','heart',true);await f.api.react('post1','heart',true);assert.equal(f.reactions.size,0);assert.equal(f.calls.at(-1).query.get('user_id'),'eq.owner');
});
test('delete is retry-safe and constrained to author; attachment uses dedicated RPC',async()=>{
 const f=fixture();await f.api.publish({id:'squad'},'Hello',null,'post1');await f.api.remove('post1');await f.api.remove('post1');assert.equal(f.posts.size,0);assert.equal(f.calls.at(-1).query.get('user_id'),'eq.owner');await f.api.attach('post1','owner/posts/photo.jpg');assert.deepEqual(f.calls.at(-1).body,{p_post:'post1',p_path:'owner/posts/photo.jpg'});
});
