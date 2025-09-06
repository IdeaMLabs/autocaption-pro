export async function onRequestPost(context) {
  const { env } = context;
  
  try {
    const body = await context.request.json().catch(() => ({}));
    const stripeSecret = env.STRIPE_SECRET_KEY;

    if (!stripeSecret) {
      return new Response(JSON.stringify({ error: "Stripe configuration missing. Please contact support." }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Extract form data
    const { email, video_url, tier } = body;
    
    if (!email || !video_url || !tier) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Determine pricing based on tier
    const pricing = {
      test: { amount: 100, name: "AutoCaption Test Tier" },
      standard: { amount: 1900, name: "AutoCaption Standard Tier" }
    };
    
    const selectedTier = pricing[tier];
    if (!selectedTier) {
      return new Response(JSON.stringify({ error: "Invalid tier selected" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Create Stripe checkout session
    const resp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        mode: "payment",
        "payment_method_types[]": "card",
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][unit_amount]": selectedTier.amount.toString(),
        "line_items[0][price_data][product_data][name]": selectedTier.name,
        "line_items[0][price_data][product_data][description]": `YouTube video transcription for: ${video_url}`,
        "line_items[0][quantity]": "1",
        customer_email: email,
        success_url: "https://autocaption-pro.pages.dev/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "https://autocaption-pro.pages.dev/cancel",
        metadata: JSON.stringify({
          video_url: video_url,
          tier: tier,
          email: email
        })
      }),
    });

    const data = await resp.json();
    
    if (!resp.ok) {
      console.error('Stripe API error:', data);
      return new Response(JSON.stringify({ 
        error: data.error?.message || "Payment processing error. Please try again." 
      }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    return new Response(JSON.stringify(data), { 
      headers: { "Content-Type": "application/json" } 
    });
    
  } catch (error) {
    console.error('Checkout session error:', error);
    return new Response(JSON.stringify({ 
      error: "Internal server error. Please try again." 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}