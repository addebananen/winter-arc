// Explicit FK names are required: reactions also create a posts ↔ profiles route.
export const POST_SELECT='id,user_id,body,image_path,created_at,profiles:profiles!posts_user_id_fkey(display_name),reactions:reactions!reactions_post_id_fkey(user_id,kind)';
const check=({data,error})=>{if(error)throw error;return data;};
export function createSocialClient(client,getUser){
 return {
  async feed(squad){if(!squad)return [];return check(await client.from('posts').select(POST_SELECT).eq('squad_id',squad.id).order('created_at',{ascending:false}).limit(50));},
  async publish(squad,body,image_path,id){
   if(!id)throw Error('Inläggets identifierare saknas.');
   const row={id,user_id:getUser().id,squad_id:squad.id,body:body.trim(),image_path:image_path||null};
   const result=await client.from('posts').insert(row).select('id').single();
   if(!result.error)return result.data;
   // A lost response can follow a successful commit. Retry the same ID, never a new post.
   const existing=await client.from('posts').select('id').eq('id',id).eq('user_id',row.user_id).maybeSingle();
   if(!existing.error&&existing.data)return existing.data;
   throw result.error;
  },
  async react(post,kind,active){
   if(active)return check(await client.from('reactions').delete().eq('post_id',post).eq('user_id',getUser().id).eq('kind',kind));
   const result=await client.from('reactions').insert({post_id:post,user_id:getUser().id,kind});
   if(result.error?.code==='23505')return; // desired reaction already exists
   return check(result);
  },
  async remove(id){return check(await client.from('posts').delete().eq('id',id).eq('user_id',getUser().id));},
  async attach(id,path){return check(await client.rpc('attach_post_photo',{p_post:id,p_path:path}));},
  // Migration 031: a photo on the post of a just-saved workout or run, and photo reactions.
  async attachActivity(event,path){return check(await client.rpc('attach_activity_photo',{p_event:event,p_path:path}));},
  async photoReactions(ids){if(!ids.length)return [];return check(await client.from('photo_reactions').select('post_id,user_id,image_path,created_at').in('post_id',ids).order('created_at'));},
  async photoReact(post,path){const user_id=getUser().id;if(!path)return check(await client.from('photo_reactions').delete().eq('post_id',post).eq('user_id',user_id));return check(await client.from('photo_reactions').upsert({post_id:post,user_id,image_path:path,created_at:new Date().toISOString()},{onConflict:'post_id,user_id'}));}
 };
}
