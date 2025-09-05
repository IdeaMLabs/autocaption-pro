export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const payload = await request.json();
    if (payload.type === "checkout.session.completed") {
      const session = payload.data.object;

      const txn = {
        id: session.id,
        email: session.customer_details?.email,
        amount: session.amount_total,
        currency: session.currency,
        status: session.payment_status,
        timestamp: Date.now()
      };

      await env.KV_STORE.put("txn_" + session.id, JSON.stringify(txn));
      return new Response(JSON.stringify({ success: true }), {
        headers: { "content-type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ ignored: true }), {
      headers: { "content-type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "content-type": "application/json" },
      status: 500
    });
  }
}
