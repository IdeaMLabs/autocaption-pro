export default {
  async fetch(request, env, ctx) {
    if (request.method === 'GET') {
      return new Response(JSON.stringify({ 
        message: "Webhook active",
        timestamp: Date.now()
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
    if (request.method === 'POST') {
      try {
        const body = await request.text();
        let payload;
        
        try {
          payload = JSON.parse(body);
        } catch (e) {
          return new Response("Invalid JSON", { status: 400 });
        }
        
        console.log('Webhook received:', payload.type);
        
        if (payload.type === "checkout.session.completed") {
          const session = payload.data.object;
          
          // Store in KV if available
          if (env.KV_STORE) {
            try {
              await env.KV_STORE.put(session.id, JSON.stringify({
                state: "paid",
                email: session.customer_email || "unknown",
                amount: (session.amount_total || 0) / 100,
                video_url: session.metadata?.video_url || "unknown",
                tier: session.metadata?.tier || "unknown"
              }));
            } catch (kvError) {
              console.error('KV error:', kvError);
            }
          }
        }
        
        return new Response("OK", { status: 200 });
      } catch (err) {
        console.error('Webhook error:', err);
        return new Response("Error", { status: 500 });
      }
    }
    
    return new Response("Method not allowed", { status: 405 });
  }
}