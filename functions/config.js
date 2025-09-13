export default {
  async fetch(request, env, ctx) {
    return new Response(JSON.stringify({
      STRIPE_PUBLISHABLE_KEY: env.STRIPE_PUBLISHABLE_KEY
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}