// GET /status?job_id=...
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,OPTIONS',
  'access-control-allow-headers': 'content-type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const job_id = url.searchParams.get('job_id');
  if (!job_id) return json({ error: 'missing_job_id' }, 400);

  const job = await env.KV_STORE.get(`job:${job_id}`, { type: 'json' });
  if (!job) return json({ state: 'unknown' });
  return json({ state: job.state || 'unknown', result_url: job.result_url || null });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...CORS },
  });
}
