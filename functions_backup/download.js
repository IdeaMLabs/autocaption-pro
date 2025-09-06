// functions/download.js
// Allows downloading transcript as a text file.

export async function onRequestGet(context) {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const job_id = searchParams.get("job_id");

  const transcript = await env.KV_STORE.get("transcript_" + job_id);
  if (!transcript) return new Response("Transcript not found", { status: 404 });

  return new Response(transcript, {
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": `attachment; filename="${job_id}.txt"`
    }
  });
}
