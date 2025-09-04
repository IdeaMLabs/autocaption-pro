// /paypal/notify — single catch-all to avoid 405s
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type',
};

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  // CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  // Simple GET ping so you can test in the browser
  if (method === 'GET') {
    return new Response('notify GET ok', {
      headers: { ...CORS, 'content-type': 'text/plain' }
    });
  }

  // Only POST does work beyond this point
  if (method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: CORS });
  }

  // --- POST logic (same as before) ---
  let body = {};
  try { body = await request.json(); } catch {}
  const { session_id, order_id, capture } = body || {};
  if (!session_id || !order_id || !capture) {
    return json({ error: 'missing_fields' }, 400);
  }

  // Ensure the session exists
  const session = await env.KV_STORE.get(`session:${session_id}`, { type: 'json' });
  if (!session) return json({ error: 'unknown_session' }, 404);

  // Extract useful bits from the PayPal capture (defensive in case fields differ)
  const pu = capture?.purchase_units?.[0];
  const cap = pu?.payments?.captures?.[0];
  const amount   = cap?.amount?.value;
  const currency = cap?.amount?.currency_code;
  const payerEmail = capture?.payer?.email_address;

  // Record job keyed by session_id
  const job = {
    state: 'paid',
    order_id,
    amount,
    currency,
    payer_email: payerEmail,
    session, // original session: email, video_url, tier, etc.
    created_at: Date.now()
  };

  await env.KV_STORE.put(`job:${session_id}`, JSON.stringify(job), {
    expirationTtl: 60 * 60 * 24 // 24h
  });

  // (optional) also mark the session as paid
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
