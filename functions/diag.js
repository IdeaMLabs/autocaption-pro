export default {
  async fetch(request, env, ctx) {
    return new Response('diag ok', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}