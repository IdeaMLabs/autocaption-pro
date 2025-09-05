export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { to, subject, text } = await request.json();
    if (!to || !subject || !text) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        headers: { "content-type": "application/json" },
        status: 400,
      });
    }

    // Placeholder: In production, integrate with Gmail API or SendGrid
    console.log(`Email sent to ${to}: ${subject}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "content-type": "application/json" },
      status: 500,
    });
  }
}
