// Pages Functions entry: serves API + your static site.
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = (url.pathname.replace(/\/+$/, '') || '/');

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors() });
    }

    // Create a session (stores email/url/tier)
    if (path === '/session' && request.method === 'POST') {
      let body = {}; try { body = await request.json(); } catch {}
      const email = String(body.email || '').trim();
      const video_url = String(body.video_url || '').trim();
      const tier = String(body.tier || '').trim();

      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const ytOk = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(video_url);
      if (!emailOk || !ytOk || !tier) return j({ error: 'invalid_input' }, 400);

      const session_id = crypto.randomUUID();
      const locale  = (request.cf && request.cf.locale)  || 'en-US';
      const country = (request.cf && request.cf.country) || 'US';
      const currency = 'USD'; // localize later

      await env.KV_STORE.put(
        `session:${session_id}`,
        JSON.stringify({ email, video_url, tier, locale, country, currency, state:'init', created_at:Date.now() }),
        { expirationTtl: 60 * 60 * 6 }
      );
      return j({ session_id, currency });
    }

    // Minimal status stub
    if (path === '/status' && request.method === 'GET') {
      const job_id = url.searchParams.get('job_id');
      if (!job_id) return j({ error: 'missing_job_id' }, 400);
      const job = await env.KV_STORE.get(`job:${job_id}`, { type: 'json' });
      if (!job) return j({ state: 'unknown' });
      return j({ state: job.state || 'unknown', result_url: job.result_url || null });
    }

    // Serve static files from /public
    return env.ASSETS.fetch(request);
  }
};

function j(obj, status=200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type':'application/json; charset=utf-8', ...cors() }
  });
}
function cors() {
  return {
    'access-control-allow-origin':'*',
    'access-control-allow-methods':'GET,POST,OPTIONS',
    'access-control-allow-headers':'content-type'
  };
}
