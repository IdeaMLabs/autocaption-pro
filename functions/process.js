const DAILY_CAP = 10; // hard stop in USD
const SOFT_CAP = 8;   // soft stop in USD

async function getSpend(env) {
  const spend = await env.KV_STORE.get("openai_spend");
  return parseFloat(spend || "0");
}

async function updateSpend(env, amount) {
  const spend = await getSpend(env);
  await env.KV_STORE.put("openai_spend", (spend + amount).toString());
}

export async function onRequest(context) {
  const { env } = context;

  const spend = await getSpend(env);

  if (spend >= DAILY_CAP) {
    return new Response(JSON.stringify({
      state: "delayed",
      reason: "Daily OpenAI cap reached. Job queued until tomorrow."
    }), { headers: { "content-type": "application/json" }, status: 429 });
  }

  if (spend >= SOFT_CAP) {
    return new Response(JSON.stringify({
      state: "queued",
      reason: "Soft cap reached. Job will run later today if budget allows."
    }), { headers: { "content-type": "application/json" } });
  }

  // Here you would call OpenAI API for transcription
  // Example: assume cost per job = $0.05
  await updateSpend(env, 0.05);

  return new Response(JSON.stringify({ state: "processing" }), {
    headers: { "content-type": "application/json" }
  });
}
