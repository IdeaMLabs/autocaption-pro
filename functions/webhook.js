export async function onRequest(context) {
  const { request, env } = context;
  
  // Handle GET requests for testing
  if (request.method === 'GET') {
    return new Response(JSON.stringify({
      message: "Webhook endpoint active",
      methods: ["POST"],
      timestamp: Date.now()
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  
  // Handle POST requests from Stripe
  if (request.method === 'POST') {
    try {
      const body = await request.text();
      let payload;
      
      try {
        payload = JSON.parse(body);
      } catch (parseError) {
        return new Response("Invalid JSON", { status: 400 });
      }
      
      console.log('Webhook received:', payload.type);
      
      if (payload.type === "checkout.session.completed") {
        const session = payload.data.object;
        console.log('Processing checkout session:', session.id);
        
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
        
        return new Response("OK", { status: 200 });
      }
      
      return new Response("OK", { status: 200 });
      
    } catch (err) {
      console.error('Webhook error:', err);
      return new Response("Error", { status: 500 });
    }
  }
  
  return new Response("Method not allowed", { status: 405 });
}

