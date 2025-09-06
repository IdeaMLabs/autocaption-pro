export async function onRequestGet(context) {
  return new Response(JSON.stringify({
    STRIPE_PUBLISHABLE_KEY: context.env.STRIPE_PUBLISHABLE_KEY || null
  }), {
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}