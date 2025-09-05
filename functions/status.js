export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const jobId = url.searchParams.get("job_id");

    if (!jobId) {
      return new Response(JSON.stringify({ error: "missing job_id" }), {
        headers: { "content-type": "application/json" },
        status: 400,
      });
    }

    try {
      // Call Stripe's API directly
      const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${jobId}`, {
        headers: {
          Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        },
      });

      if (!res.ok) {
        const err = await res.text();
        return new Response(JSON.stringify({ error: "Stripe error", details: err }), {
          headers: { "content-type": "application/json" },
          status: 500,
        });
      }

      const data = await res.json();

      // Return useful info
      return new Response(JSON.stringify({
        state: data.payment_status,
        email: data.customer_details?.email || null,
        amount: data.amount_total / 100,
        currency: data.currency,
      }), {
        headers: { "content-type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "server error", details: err.message }), {
        headers: { "content-type": "application/json" },
        status: 500,
      });
    }
  },
};

