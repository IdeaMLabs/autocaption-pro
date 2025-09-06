export async function onRequestPost(context) {
  const { env } = context;
  const body = await context.request.json().catch(() => ({}));
  const stripeSecret = env.STRIPE_SECRET_KEY;

  if (!stripeSecret) {
    return new Response(JSON.stringify({ error: "Stripe key missing" }), { status: 500 });
  }

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
      "line_items[0][price_data][unit_amount]": "100",
      "line_items[0][price_data][product_data][name]": "AutoCaption Transcript",
      "line_items[0][quantity]": "1",
      success_url: "https://autocaption-pro.pages.dev/success",
      cancel_url: "https://autocaption-pro.pages.dev/cancel",
    }),
  });

  const data = await resp.json();
  return new Response(JSON.stringify(data), { 
    headers: { "Content-Type": "application/json" } 
  });
}