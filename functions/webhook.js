// Handle GET requests to webhook endpoint
export async function onRequestGet(context) {
  return new Response(JSON.stringify({ 
    message: "Webhook endpoint is active",
    methods: ["POST"],
    purpose: "Stripe webhook handler"
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

// Handle POST requests from Stripe
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    // Get the raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    // Basic signature check (if webhook secret is available)
    if (env.STRIPE_WEBHOOK_SECRET && signature) {
      // In a full implementation, you'd verify the signature here
      // For now, we'll log that we received it
      console.log('Received webhook with signature:', signature);
    }
    
    // Parse the webhook payload
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (parseError) {
      console.error('Invalid JSON payload:', parseError);
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    console.log('Webhook received:', payload.type);
    
    // Handle checkout.session.completed events
    if (payload.type === "checkout.session.completed") {
      const session = payload.data.object;
      console.log('Processing checkout session:', session.id);
      
      // Prepare transaction data
      const txn = {
        id: session.id,
        email: session.customer_details?.email || session.customer_email || "unknown@example.com",
        amount: session.amount_total || 0,
        currency: session.currency || "usd",
        status: session.payment_status || "paid",
        video_url: session.metadata?.video_url || "unknown",
        tier: session.metadata?.tier || "unknown",
        timestamp: Date.now()
      };
      
      // Store transaction data (with fallback if KV_STORE not available)
      if (env.KV_STORE) {
        try {
          await env.KV_STORE.put(`txn_${session.id}`, JSON.stringify(txn));
          await env.KV_STORE.put(session.id, JSON.stringify({
            state: "paid",
            email: txn.email,
            amount: txn.amount / 100,
            currency: txn.currency,
            video_url: txn.video_url,
            tier: txn.tier
          }));
          console.log('Transaction stored in KV:', session.id);
        } catch (kvError) {
          console.error('KV storage error:', kvError);
        }
      } else {
        console.log('KV_STORE not available, transaction data:', txn);
      }
      
      return new Response("OK", {
        status: 200,
        headers: { "Content-Type": "text/plain" }
      });
    }
    
    // Handle other webhook types
    console.log('Webhook type not handled:', payload.type);
    return new Response("OK", {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });
    
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(JSON.stringify({ 
      error: "Webhook processing error",
      details: err.message 
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}

// Handle unsupported methods
export async function onRequest(context) {
  const method = context.request.method;
  if (method === 'GET') return onRequestGet(context);
  if (method === 'POST') return onRequestPost(context);
  
  return new Response(JSON.stringify({ 
    error: "Method not allowed",
    allowed: ["GET", "POST"]
  }), {
    status: 405,
    headers: { "Content-Type": "application/json" }
  });
}
