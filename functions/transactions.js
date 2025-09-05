export async function onRequestGet(context) {
  const { env } = context;
  const list = await env.KV_STORE.list({ prefix: "txn_" });
  const transactions = [];

  for (const key of list.keys) {
    const record = await env.KV_STORE.get(key.name, "json");
    if (record) {
      transactions.push(record);
    }
  }

  return new Response(JSON.stringify({ transactions }), {
    headers: { "content-type": "application/json" }
  });
}
