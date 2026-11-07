import {createClient} from '@supabase/supabase-js';
import {config} from './config.js';
export const configured = Boolean(config.supabaseUrl && config.supabaseKey);
export const client = configured ? createClient(config.supabaseUrl,config.supabaseKey,{auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}}) : null;
export let user = null;
let revision=0;
const check = ({data,error})=>{if(error)throw error;return data;};
export async function initialize(){if(!client)return null;const session=check(await client.auth.getSession());user=session.session?.user||null;return user;}
export async function login(){if(!client)throw Error('Google-inloggning är redo i koden. Anslut först ett Supabase-projekt.');check(await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname,queryParams:{prompt:'select_account'}}}));}
export async function logout(){if(client)check(await client.auth.signOut());user=null;}
export async function load(){const row=check(await client.from('user_states').select('payload,revision').eq('user_id',user.id).maybeSingle());revision=row?.revision||0;return row?.payload||null;}
export async function save(payload){const result=check(await client.rpc('save_arc_state',{p_payload:payload,p_expected_revision:revision}));revision=result;}
export async function mySquad(){const memberships=check(await client.from('squad_members').select('squad_id').eq('user_id',user.id));if(!memberships?.length)return null;return check(await client.from('squads').select('id,name,created_by').eq('id',memberships[0].squad_id).single());}
export async function createSquad(name){return check(await client.rpc('create_squad',{p_name:name}));}
export async function joinSquad(code){return check(await client.rpc('join_squad',{p_code:code.trim()}));}
export async function invite(squadId){return check(await client.rpc('get_squad_code',{p_squad:squadId}));}
export async function social(squad){if(!squad)return {posts:[],members:[],missions:[]};const [posts,members,missions,missionCounts]=await Promise.all([
 client.from('posts').select('id,user_id,body,image_path,created_at,profiles(display_name),reactions(user_id,kind)').eq('squad_id',squad.id).order('created_at',{ascending:false}).limit(50),
 client.rpc('squad_progress',{p_squad:squad.id}),
 client.from('missions').select('*').eq('squad_id',squad.id).order('created_at',{ascending:false}),client.rpc('mission_progress',{p_squad:squad.id})]);const counts=check(missionCounts);return {posts:check(posts),members:check(members),missions:check(missions).map(m=>({...m,completed:counts.find(c=>c.id===m.id)?.completed||0}))};}
export async function publish(squad,body,image_path){return check(await client.from('posts').insert({user_id:user.id,squad_id:squad.id,body,image_path}).select('id').single());}
export async function react(post,kind,active){if(active)return check(await client.from('reactions').delete().eq('post_id',post).eq('user_id',user.id).eq('kind',kind));return check(await client.from('reactions').insert({post_id:post,user_id:user.id,kind}));}
export async function upload(blob,kind){const path=`${user.id}/${kind}/${crypto.randomUUID()}.jpg`;check(await client.storage.from('arc-photos').upload(path,blob,{contentType:'image/jpeg',upsert:false}));return path;}
const signed=new Map();
export async function imageUrl(path){if(!path)return '';const cached=signed.get(path);if(cached&&cached.expires>Date.now())return cached.url;const data=check(await client.storage.from('arc-photos').createSignedUrl(path,300));signed.set(path,{url:data.signedUrl,expires:Date.now()+240000});return data.signedUrl;}
export async function removeImage(path){check(await client.storage.from('arc-photos').remove([path]));signed.delete(path);}
export async function createMission(squad,name,target,deadline){return check(await client.from('missions').insert({squad_id:squad.id,created_by:user.id,name,target,deadline}).select().single());}
