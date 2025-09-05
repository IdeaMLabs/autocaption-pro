export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // KV binding
  const kv = env.KV_STORE;

  if (request.method === "GET") {
    return new Response("paypal catch-all GET ok: /paypal/notify");
  }

  if (request.method === "POST") {
    try {
      const body = await request.json();

      // Make sure we have an order id
      if (!body || !body.id) {
        return new Response(JSON.stringify({ error: "missing_fields" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      const orderId = body.id;
      const timestamp = new Date().toISOString();

      // Save record in KV
      await kv.put(
        `paypal_txn:${orderId}`,
        JSON.stringify({
          orderId,
          email: body.payer?.email_address || "unknown",
          amount: body.purchase_units?.[0]?.amount?.value || "unknown",
          currency: body.purchase_units?.[0]?.amount?.currency_code || "USD",
          raw: body,
          timestamp,
        })
      );

      console.log("PayPal transaction saved:", orderId);

      return new Response(
        JSON.stringify({ ok: true, orderId, saved: true }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    } catch (err) {
      console.error("Error handling PayPal notify:", err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
}
