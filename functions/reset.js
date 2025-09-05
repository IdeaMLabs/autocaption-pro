export async function onRequest(context) {
  const { env } = context;
  await env.KV_STORE.put("openai_spend", "0");
  return new Response("OpenAI spend reset at midnight.");
}
