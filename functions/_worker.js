export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/diag") {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.pathname === "/config") {
      return new Response(JSON.stringify({ publishableKey: env.STRIPE_PUBLISHABLE_KEY }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response("Not Found", { status: 404 });
  },
};
