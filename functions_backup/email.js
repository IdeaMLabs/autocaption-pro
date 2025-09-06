// functions/email.js
// Sends transcript to user via Gmail SMTP or SendGrid.

export async function onRequestPost(context) {
  const { request, env } = context;
  const { job_id, email } = await request.json();

  if (!job_id || !email) {
    return new Response(JSON.stringify({ error: "missing_fields" }), { status: 400 });
  }

  const transcript = await env.KV_STORE.get("transcript_" + job_id);
  if (!transcript) return new Response(JSON.stringify({ error: "not_found" }), { status: 404 });

  // Stubbed email send: would connect to SendGrid/Gmail API.
  console.log(`Emailing transcript for ${job_id} to ${email}`);

  return new Response(JSON.stringify({ status: "sent", job_id, email }));
}
