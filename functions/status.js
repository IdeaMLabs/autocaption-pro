export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const jobId = url.searchParams.get("job_id");

  if (!jobId) {
    return new Response(JSON.stringify({ error: "missing job_id" }), {
      headers: { "content-type": "application/json" },
      status: 400,
    });
  }

  try {
    // Query Stripe Checkout Session
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${jobId}`, {
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      },
    });
    const session = await response.json();

    // Check transcript from KV
    const transcript = await env.KV_STORE.get("transcript_" + jobId);

    return new Response(
      JSON.stringify({
        state: session.payment_status,
        email: session.customer_details?.email,
        amount: session.amount_total,
        currency: session.currency,
        transcript: transcript || null,
      }),
      { headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "content-type": "application/json" },
      status: 500,
    });
  }
}
