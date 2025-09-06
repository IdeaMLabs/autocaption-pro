export default {
  async fetch(request, env, ctx) {
    return new Response(JSON.stringify({
      STRIPE_PUBLISHABLE_KEY: env.STRIPE_PUBLISHABLE_KEY || "pk_test_51S41DLK0wxQPIemdaalU9BVg1jjgj9CVioVGDpo76bO9jbAUr8bqACD4j6QA63hJcZX1VlSORYAvGNgtR313hXuX000dSfBOcj"
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}