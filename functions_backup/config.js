export async function onRequest(context) {
  const { env } = context;
  
  return new Response(JSON.stringify({
    STRIPE_PUBLISHABLE_KEY: env.STRIPE_PUBLISHABLE_KEY || null
  }), {
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}