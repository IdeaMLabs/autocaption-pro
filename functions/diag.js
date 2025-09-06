export async function onRequest() {
  return new Response('diag ok', { 
    headers: { 'content-type': 'text/plain' } 
  });
}
