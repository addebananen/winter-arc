import {createSocialClient} from './social-client.js';
import {createClient} from '@supabase/supabase-js';
import {config} from './config.js';
export const configured = Boolean(config.supabaseUrl && config.supabaseKey);
export const googleReady = configured && config.googleEnabled === true;
export const client = configured ? createClient(config.supabaseUrl,config.supabaseKey,{auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}}) : null;
export let user = null;
export let trainingReady=false,skillWorkoutsReady=false,coreCatalogReady=false,skillStartReady=false,mobilityReady=false;
let revision=0;
const check = ({data,error})=>{if(error)throw error;return data;};
export async function initialize(){if(!client)return null;const session=check(await client.auth.getSession());user=session.session?.user||null;if(user){try{const result=await client.rpc('training_expansion_ready');trainingReady=result.data>=9;skillWorkoutsReady=result.data>=10;coreCatalogReady=result.data>=14;skillStartReady=result.data>=15;mobilityReady=result.data>=20;}catch{trainingReady=false;}}return user;}
export async function login(){if(!googleReady)throw Error('Google-inloggningen väntar på att OAuth-klienten aktiveras i Supabase.');check(await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname,queryParams:{prompt:'select_account'}}}));}
export async function logout(){if(client)check(await client.auth.signOut());user=null;}
export async function load(){const row=check(await client.from('user_states').select('payload,revision').eq('user_id',user.id).maybeSingle());revision=row?.revision||0;return row?.payload||null;}
export async function save(payload){const result=check(await client.rpc('save_arc_state_v3',{p_payload:payload,p_expected_revision:revision}));revision=result.revision;return result.payload;}
export async function mySquad(){const memberships=check(await client.from('squad_members').select('squad_id').eq('user_id',user.id));if(!memberships?.length)return null;return check(await client.from('squads').select('id,name,created_by').eq('id',memberships[0].squad_id).single());}
export async function friendsOverview(){return check(await client.rpc('friends_overview'))||[];}
export async function myFriendCode(){return check(await client.rpc('my_friend_code'));}
export async function requestFriend(code){return check(await client.rpc('request_friend',{p_code:code}));}
export async function respondFriend(id,accept){return check(await client.rpc('respond_friend',{p_id:id,p_accept:accept}));}
export async function memberProfile(id){return check(await client.rpc('member_profile',{p_user:id}))?.[0]||null;}
export async function removeFriend(id){return check(await client.rpc('remove_friend',{p_id:id}));}
export async function createSquad(name){return check(await client.rpc('create_squad',{p_name:name}));}
export async function joinSquad(code){return check(await client.rpc('join_squad',{p_code:code.trim()}));}
export async function invite(squadId){return check(await client.rpc('get_squad_code',{p_squad:squadId}));}
const socialClient=createSocialClient(client,()=>user);
export async function social(squad){if(!squad)return {posts:[],members:[],missions:[]};const [posts,members,missions,missionCounts,activityStatus,trainingStatus,avatarStatus]=await Promise.all([
 socialClient.feed(squad),
 client.rpc('squad_progress',{p_squad:squad.id}),
 client.from('missions').select('*').eq('squad_id',squad.id).order('created_at',{ascending:false}),client.rpc('mission_progress',{p_squad:squad.id}),client.rpc('squad_activity_ready'),client.rpc('squad_training_streaks',{p_squad:squad.id}),client.rpc('squad_avatars',{p_squad:squad.id})]);const counts=check(missionCounts),training=trainingStatus.error?[]:trainingStatus.data||[],avatars=avatarStatus.error?[]:avatarStatus.data||[];return {activityReady:activityStatus.data===true,posts,members:check(members).map(m=>({...m,...(training.find(t=>t.user_id===m.user_id)||{}),photo:avatars.find(a=>a.user_id===m.user_id)?.photo||null})),missions:check(missions).map(m=>({...m,completed:counts.find(c=>c.id===m.id)?.completed||0}))};}
export const publish=(...args)=>socialClient.publish(...args);
export const react=(...args)=>socialClient.react(...args);
export const removePost=id=>socialClient.remove(id);
export const attachPostPhoto=(id,path)=>socialClient.attach(id,path);
export async function upload(blob,kind){const path=`${user.id}/${kind}/${crypto.randomUUID()}.jpg`;check(await client.storage.from('arc-photos').upload(path,blob,{contentType:'image/jpeg',upsert:false}));return path;}
const signed=new Map();
export async function imageUrl(path,refresh=false){if(!path)return '';const cached=signed.get(path);if(!refresh&&cached&&cached.expires>Date.now())return cached.url;const data=check(await client.storage.from('arc-photos').createSignedUrl(path,300));signed.set(path,{url:data.signedUrl,expires:Date.now()+240000});return data.signedUrl;}
export async function removeImage(path){check(await client.storage.from('arc-photos').remove([path]));signed.delete(path);}
export async function createMission(squad,name,target,deadline){return check(await client.from('missions').insert({squad_id:squad.id,created_by:user.id,name,target,deadline}).select().single());}
