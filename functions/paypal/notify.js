const CORS={'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type'};
export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();
  if (method === 'OPTIONS') return new Response(null,{headers:CORS});
  if (method === 'GET') return new Response('paypal notify GET ok',{headers:{...CORS,'content-type':'text/plain'}});
  if (method !== 'POST') return new Response('Method Not Allowed',{status:405,headers:CORS});

  let body={}; try { body=await request.json(); } catch {}
  const { session_id, order_id, capture } = body || {};
  if(!session_id||!order_id||!capture){
    return new Response(JSON.stringify({error:'missing_fields'}),{status:400,headers:{'content-type':'application/json',...CORS}});
  }

  // Mark job as paid in KV
  const job = {state:'paid', session_id, order_id, created_at:Date.now()};
  await env.KV_STORE.put(`job:${session_id}`, JSON.stringify(job), {expirationTtl:86400});
  return new Response(JSON.stringify({ok:true}),{headers:{'content-type':'application/json',...CORS}});
}
