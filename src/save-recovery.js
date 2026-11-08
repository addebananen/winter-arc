// Compare user intent while retaining server authority over workout clocks.
function intent(state){
 const copy=structuredClone(state);
 for(const kind of ['training','strength']){
  const workouts=[copy[kind]?.active,...(copy[kind]?.sessions||[])].filter(Boolean);
  for(const w of workouts){
   for(const key of ['startedAt','finishedAt','pausedAt'])if(key in w)w[key]=w[key]==null?null:'server-time';
   if(kind==='strength')delete w.pausedMs;
  }
 }
 const sorted=v=>Array.isArray(v)?v.map(sorted):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sorted(v[k])])):v;
 return JSON.stringify(sorted(copy));
}
export async function saveWithRecovery(candidate,{save,load,mutate,normalize}){
 try{return await save(candidate);}catch(error){
  let latest;try{latest=await load();}catch{throw error;}
  if(!latest)throw error;
  if(intent(latest)===intent(candidate))return latest;
  if(!/revision|conflict/i.test(error.message))throw error;
  mutate(latest);normalize(latest);return await save(latest);
 }
}
