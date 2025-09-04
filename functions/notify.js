// /paypal/notify  — supports GET (ping), POST (notify), and OPTIONS (CORS)
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

// Tiny GET ping so we can prove the route works in the browser
export async function onRequestGet() {
  return new Response('notify GET ok', { headers: { ...CORS, 'content-type': 'text/plain' } });
}

export async function onRequestPost({ request, env }) {
  let body = {};
  try { body = await request.json(); } catch {}
  const { session_id, order_id, capture } = body || {};
  if (!session_id || !order_id || !capture) return json({ error: 'missing_fields' }, 400);

  // Ensure the session exists
  const session = await env.KV_STORE.get(`session:${session_id}`, { type: 'json' });
  if (!session) return json({ error: 'unknown_session' }, 404);

  // Extract a few useful fields from the PayPal capture
  const pu = capture?.purchase_units?.[0];
  const cap = pu?.payments?.captures?.[0];
  const amount   = cap?.amount?.value;
  const currency = cap?.amount?.currency_code;
  const payerEmail = capture?.payer?.email_address;

  // Store job under the same id
  const job = {
    state: 'paid',
    order_id,
    amount,
    currency,
    payer_email: payerEmail,
    session, // includes email, video_url, tier, locale/country
    created_at: Date.now()
  };

  await env.KV_STORE.put(`job:${session_id}`, JSON.stringify(job), {
    expirationTtl: 60 * 60 * 24 // 24h
  });

  // (optional) also mark session as paid
  session.state = 'paid';
  await env.KV_STORE.put(`session:${session_id}`, JSON.stringify(session), {
    expirationTtl: 60 * 60 * 24
  });

  return json({ ok: true });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...CORS },
  });
}
