export async function onRequestPost(context) {
  try {
    const { email, video_url, tier } = await context.request.json();
    const price = tier === "1" ? 100 : 1900; // in cents

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${context.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        "payment_method_types[]": "card",
        "customer_email": email,
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][product_data][name]": "AutoCaption Pro Transcript",
        "line_items[0][price_data][product_data][description]": `Video: ${video_url}`,
        "line_items[0][price_data][unit_amount]": price.toString(),
        "line_items[0][quantity]": "1",
        "mode": "payment",
        "success_url": `${new URL(context.request.url).origin}/status?job_id={CHECKOUT_SESSION_ID}`,
        "cancel_url": `${new URL(context.request.url).origin}/`
      })
    });

    const data = await response.json();

    return new Response(JSON.stringify({ id: data.id }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
