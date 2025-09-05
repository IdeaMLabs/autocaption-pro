// YouTuber data collection endpoint for AI/ML processing
export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (method === 'POST') {
    try {
      const data = await request.json();
      const { email, channel_name, channel_url, subscriber_count, session_id } = data;

      if (!email || !session_id) {
        return new Response(JSON.stringify({ error: 'Missing required fields: email, session_id' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Store YouTuber data for AI/ML processing
      const youtuberData = {
        email,
        channel_name: channel_name || 'Unknown',
        channel_url: channel_url || '',
        subscriber_count: subscriber_count || 0,
        session_id,
        created_at: new Date().toISOString(),
        status: 'collected',
        ai_processed: false
      };

      // Store in KV with multiple keys for different access patterns
      await Promise.all([
        // By session ID for payment correlation
        env.KV_STORE.put(`youtuber:session:${session_id}`, JSON.stringify(youtuberData), { expirationTtl: 86400 * 30 }),
        // By email for user lookup
        env.KV_STORE.put(`youtuber:email:${email}`, JSON.stringify(youtuberData), { expirationTtl: 86400 * 30 }),
        // For AI processing queue
        env.KV_STORE.put(`ai_queue:${Date.now()}:${session_id}`, JSON.stringify(youtuberData), { expirationTtl: 86400 * 7 })
      ]);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'YouTuber data collected for AI/ML processing',
        session_id 
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid JSON or server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  if (method === 'GET') {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');
    const email = url.searchParams.get('email');

    if (sessionId) {
      const data = await env.KV_STORE.get(`youtuber:session:${sessionId}`, { type: 'json' });
      if (data) {
        return new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    if (email) {
      const data = await env.KV_STORE.get(`youtuber:email:${email}`, { type: 'json' });
      if (data) {
        return new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    return new Response(JSON.stringify({ error: 'YouTuber data not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}