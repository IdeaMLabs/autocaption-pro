// functions/process.js
// Handles video/audio URL processing and Whisper transcription with language detection.

export async function onRequestPost(context) {
  const { request, env } = context;
  const { session_id, video_url, target_lang } = await request.json();

  if (!session_id || !video_url) {
    return new Response(JSON.stringify({ error: "missing_fields" }), { status: 400 });
  }

  // Basic: treat video_url as direct audio
  const audioResp = await fetch(video_url);
  const audioBlob = await audioResp.arrayBuffer();

  const formData = new FormData();
  formData.append("file", new Blob([audioBlob]), "audio.mp3");
  formData.append("model", "whisper-1");

  const whisperResp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${env.OPENAI_API_KEY}` },
    body: formData
  });

  const data = await whisperResp.json();
  let transcript = data.text || "transcription_failed";

  // Optional translation (if target_lang provided)
  if (target_lang && target_lang !== "en") {
    const transResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: `Translate this transcript into ${target_lang}` },
          { role: "user", content: transcript }
        ]
      })
    });
    const transData = await transResp.json();
    transcript = transData.choices?.[0]?.message?.content || transcript;
  }

  await env.KV_STORE.put("transcript_" + session_id, transcript);
  return new Response(JSON.stringify({ state: "processing", job_id: session_id }), {
    headers: { "content-type": "application/json" }
  });
}
