// Runs on Cloudflare Pages (same domain as your site).
// Provides API routes and serves static files via env.ASSETS.fetch().
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = (url.pathname.replace(/\/+$/, '') || '/');

    // CORS preflight (so the page JS can POST)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors() });
    }

    // --- Health check: proves Functions are active ---
    if (path === '/ping' && request.method === 'GET') {
      return new Response('pong', { headers: { 'content-type': 'text/plain' } });
    }

    // --- Create a session (stores email/url/tier in KV) ---
    if (path === '/session' && request.method === 'POST') {
      let body = {};
      try { body = await request.json(); } catch {}
      const email = String(body.email || '').trim();
      const video_url = String(body.video_url || '').trim();
      const tier = String(body.tier || '').trim();

      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const ytOk = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(video_url);
      if (!emailOk || !ytOk || !tier) return j({ error: 'invalid_input' }, 400);

      const session_id = crypto.randomUUID();
      const locale  = (request.cf && request.cf.locale)  || 'en-US';
      const country = (request.cf && request.cf.country) || 'US';
      const currency = 'USD'; // (localize later)

      await env.KV_STORE.put(
        `session:${session_id}`,
        JSON.stringify({ email, video_url, tier, locale, country, currency, state: 'init', created_at: Date.now() }),
        { expirationTtl: 60 * 60 * 6 } // 6 hours
      );

      return j({ session_id, currency });
    }

    // --- Minimal job status (stub) ---
    if (path === '/status' && request.method === 'GET') {
      const job_id = url.searchParams.get('job_id');
      if (!job_id) return j({ error: 'missing_job_id' }, 400);
      const job = await env.KV_STORE.get(`job:${job_id}`, { type: 'json' });
      if (!job) return j({ state: 'unknown' });
      return j({ state: job.state || 'unknown', result_url: job.result_url || null });
    }

    // Anything else → serve static files from /public
    return env.ASSETS.fetch(request);
  }
};

function j(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...cors() }
  });
}

function cors() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type'
  };
}

