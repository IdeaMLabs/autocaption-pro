// POST /session  body: { email, video_url, tier }
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST,OPTIONS',
  'access-control-allow-headers': 'content-type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestPost({ request, env }) {
  let body = {}; try { body = await request.json(); } catch {}

  const email     = String(body.email || '').trim();
  const video_url = String(body.video_url || '').trim();
  const tier      = String(body.tier || '').trim();

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const ytOk    = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(video_url);
  if (!emailOk || !ytOk || !tier) return json({ error: 'invalid_input' }, 400);

  const session_id = crypto.randomUUID();
  const cf = request.cf || {};
  const locale  = cf.locale  || 'en-US';
  const country = cf.country || 'US';
  const currency = 'USD'; // localize later

  await env.KV_STORE.put(
    `session:${session_id}`,
    JSON.stringify({ email, video_url, tier, locale, country, currency, state:'init', created_at: Date.now() }),
    { expirationTtl: 60 * 60 * 6 } // 6 hours
  );

  return json({ session_id, currency });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...CORS },
  });
}
