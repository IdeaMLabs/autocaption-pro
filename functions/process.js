export async function onRequestPost(context) {
  const { request, env } = context;
  const { session_id, video_url } = await request.json();
  if(!session_id || !video_url){
    return new Response(JSON.stringify({error:'missing_fields'}),{status:400,headers:{'content-type':'application/json'}});
  }
  // Save job as processing in KV
  const job = {state:'processing', session_id, video_url, created_at:Date.now()};
  await env.KV_STORE.put(`job:${session_id}`, JSON.stringify(job), {expirationTtl:86400});
  // Simulate transcript ready
  const doneJob = {...job, state:'done', transcript:'Hello world transcript'};
  await env.KV_STORE.put(`job:${session_id}`, JSON.stringify(doneJob), {expirationTtl:86400});
  return new Response(JSON.stringify({ok:true, job_id:session_id, state:'processing'}),{headers:{'content-type':'application/json'}});
}
