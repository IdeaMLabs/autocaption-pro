export async function onRequestPost(context) {
  try {
    const body = await context.request.text();
    console.log('Webhook received:', body);
    return new Response("OK");
  } catch (err) {
    return new Response("Error", { status: 500 });
  }
}

export async function onRequestGet() {
  return new Response(JSON.stringify({ message: "Webhook active" }), {
    headers: { "Content-Type": "application/json" }
  });
}