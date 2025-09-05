export async function onRequest(context) {
  const { request, env } = context;
  const kv = env.KV_STORE;

  const url = new URL(request.url);
  const format = url.searchParams.get("format") || "csv"; // default CSV

  // List all keys for PayPal transactions
  const { keys } = await kv.list({ prefix: "paypal_txn:" });

  let rows = [];
  for (const key of keys) {
    const data = await kv.get(key.name);
    if (data) {
      const txn = JSON.parse(data);
      rows.push(txn);
    }
  }

  if (format === "json") {
    return new Response(JSON.stringify(rows, null, 2), {
      headers: { "content-type": "application/json" },
    });
  }

  // CSV export
  let csv = "orderId,email,amount,currency,timestamp\n";
  for (const txn of rows) {
    csv += `${txn.orderId},${txn.email},${txn.amount},${txn.currency},${txn.timestamp}\n`;
  }

  return new Response(csv, {
    headers: {
      "content-type": "text/csv",
      "content-disposition": 'attachment; filename="transactions.csv"',
    },
  });
}
