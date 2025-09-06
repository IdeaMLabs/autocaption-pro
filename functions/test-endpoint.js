export async function onRequestPost(context) {
  return new Response(JSON.stringify({ 
    message: "Test endpoint working",
    method: "POST",
    timestamp: Date.now()
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequestGet(context) {
  return new Response(JSON.stringify({ 
    message: "Test endpoint working",
    method: "GET",
    timestamp: Date.now()
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}