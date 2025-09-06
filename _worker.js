// Main Cloudflare Worker that handles all API endpoints
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // Route handling
      switch (path) {
        case '/diag':
          return new Response('diag ok', {
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
          });
          
        case '/config':
          return new Response(JSON.stringify({
            STRIPE_PUBLISHABLE_KEY: env.STRIPE_PUBLISHABLE_KEY || "pk_test_51S41DLK0wxQPIemdaalU9BVg1jjgj9CVioVGDpo76bO9jbAUr8bqACD4j6QA63hJcZX1VlSORYAvGNgtR313hXuX000dSfBOcj"
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
          
        case '/webhook':
          return handleWebhook(request, env);
          
        case '/create-checkout-session':
          if (request.method !== 'POST') {
            return new Response('Method not allowed', { 
              status: 405,
              headers: corsHeaders 
            });
          }
          return handleCheckoutSession(request, env);
          
        default:
          // Serve static files or return 404
          return new Response('Not Found', { 
            status: 404,
            headers: corsHeaders 
          });
      }
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

// Webhook handler
async function handleWebhook(request, env) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };
  
  if (request.method === 'GET') {
    return new Response(JSON.stringify({ 
      message: "Webhook active",
      timestamp: Date.now()
    }), { headers: corsHeaders });
  }
  
  if (request.method === 'POST') {
    try {
      const body = await request.text();
      let payload;
      
      try {
        payload = JSON.parse(body);
      } catch (e) {
        return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
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
      
      return new Response("OK", { status: 200, headers: corsHeaders });
    } catch (err) {
      console.error('Webhook error:', err);
      return new Response("Error", { status: 500, headers: corsHeaders });
    }
  }
  
  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
}

// Checkout session handler
async function handleCheckoutSession(request, env) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };
  
  try {
    const body = await request.json();
    const { email, video_url, tier } = body;
    
    if (!email || !video_url || !tier) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { 
        status: 400,
        headers: corsHeaders
      });
    }

    const amount = tier === "1" ? 100 : 1900;
    
    const resp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        mode: "payment",
        "payment_method_types[]": "card",
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][unit_amount]": amount.toString(),
        "line_items[0][price_data][product_data][name]": "AutoCaption Pro",
        "line_items[0][quantity]": "1",
        customer_email: email,
        success_url: "https://autocaption-pro.pages.dev/success",
        cancel_url: "https://autocaption-pro.pages.dev/cancel",
        "metadata[video_url]": video_url,
        "metadata[tier]": tier,
        "metadata[email]": email
      }),
    });

    const data = await resp.json();
    
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || "Stripe error" }), { 
        status: 400,
        headers: corsHeaders
      });
    }
    
    return new Response(JSON.stringify(data), { headers: corsHeaders });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error" }), { 
      status: 500,
      headers: corsHeaders
    });
  }
}