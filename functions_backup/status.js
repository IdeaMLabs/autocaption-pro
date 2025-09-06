// functions/status.js
// Checks transcript status and returns download link.

export async function onRequestGet(context) {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const job_id = searchParams.get("job_id");

  if (!job_id) {
    return new Response(JSON.stringify({ error: "missing_job_id" }), { status: 400 });
  }

  const transcript = await env.KV_STORE.get("transcript_" + job_id);
  if (transcript) {
    return new Response(JSON.stringify({
      state: "done",
      job_id,
      transcript,
      download: `/download?job_id=${job_id}`
    }), { headers: { "content-type": "application/json" } });
  }

  return new Response(JSON.stringify({ state: "waiting", job_id }), {
    headers: { "content-type": "application/json" }
  });
}
