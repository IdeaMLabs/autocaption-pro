export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { email, video_url, tier } = body;
    
    if (!email || !video_url || !tier) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const amount = tier === "1" ? 100 : 1900;
    
    const resp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${context.env.STRIPE_SECRET_KEY}`,
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
        headers: { "Content-Type": "application/json" }
      });
    }
    
    return new Response(JSON.stringify(data), { 
      headers: { "Content-Type": "application/json" } 
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}