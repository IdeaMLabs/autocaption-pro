export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const job_id = url.searchParams.get('job_id');
  if(!job_id){
    return new Response(JSON.stringify({error:'missing_job_id'}),{status:400,headers:{'content-type':'application/json'}});
  }
  const job = await env.KV_STORE.get(`job:${job_id}`, {type:'json'});
  if(!job){
    return new Response(JSON.stringify({error:'not_found'}),{status:404,headers:{'content-type':'application/json'}});
  }
  return new Response(JSON.stringify(job),{headers:{'content-type':'application/json'}});
}
