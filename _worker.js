// Main Cloudflare Worker that handles all API endpoints
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // Route handling
      switch (path) {
        case '/diag':
          return new Response('diag ok', {
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
          });
          
        case '/config':
          return new Response(JSON.stringify({
            STRIPE_PUBLISHABLE_KEY: env.STRIPE_PUBLISHABLE_KEY || "pk_test_51S41DLK0wxQPIemdaalU9BVg1jjgj9CVioVGDpo76bO9jbAUr8bqACD4j6QA63hJcZX1VlSORYAvGNgtR313hXuX000dSfBOcj"
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
          
        case '/webhook':
          return handleWebhook(request, env);
          
        case '/create-checkout-session':
          if (request.method !== 'POST') {
            return new Response('Method not allowed', { 
              status: 405,
              headers: corsHeaders 
            });
          }
          return handleCheckoutSession(request, env);
          
        case '/discover':
          return handleDiscover(request, env);
          
        case '/status':
          return handleStatus(request, env);
          
        case '/process':
          return handleProcess(request, env);
          
        case '/outreach/send':
          return handleOutreach(request, env);
          
        default:
          // Serve static files or return 404
          return new Response('Not Found', { 
            status: 404,
            headers: corsHeaders 
          });
      }
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

// Webhook handler
async function handleWebhook(request, env) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };
  
  if (request.method === 'GET') {
    return new Response(JSON.stringify({ 
      message: "Webhook active",
      timestamp: Date.now()
    }), { headers: corsHeaders });
  }
  
  if (request.method === 'POST') {
    try {
      const body = await request.text();
      let payload;
      
      try {
        payload = JSON.parse(body);
      } catch (e) {
        return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
      }
      
      console.log('Webhook received:', payload.type);
      
      if (payload.type === "checkout.session.completed") {
        const session = payload.data.object;
        
        // Store in KV if available
        if (env.KV_STORE) {
          try {
            await env.KV_STORE.put(session.id, JSON.stringify({
              state: "paid",
              email: session.customer_email || "unknown",
              amount: (session.amount_total || 0) / 100,
              video_url: session.metadata?.video_url || "unknown",
              tier: session.metadata?.tier || "unknown",
              spoken_lang: session.metadata?.spoken_lang || "auto",
              caption_lang: session.metadata?.caption_lang || "en"
            }));
          } catch (kvError) {
            console.error('KV error:', kvError);
          }
        }
      }
      
      return new Response("OK", { status: 200, headers: corsHeaders });
    } catch (err) {
      console.error('Webhook error:', err);
      return new Response("Error", { status: 500, headers: corsHeaders });
    }
  }
  
  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
}

// YouTube Discovery handler
async function handleDiscover(request, env) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };
  
  const url = new URL(request.url);
  const topic = url.searchParams.get('topic') || 'english subtitles';
  const lang = url.searchParams.get('lang') || 'en';
  const region = url.searchParams.get('region') || 'US';
  const limit = parseInt(url.searchParams.get('limit') || '5');
  
  try {
    const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(topic)}&regionCode=${region}&maxResults=${limit}&key=${env.YOUTUBE_API_KEY}`;
    
    const res = await fetch(ytUrl);
    const data = await res.json();
    
    if (!data.items) {
      return new Response(JSON.stringify({ error: 'No channels found' }), { 
        status: 400, 
        headers: corsHeaders 
      });
    }
    
    // Store in KV if available
    if (env.YOUTUBER_KV) {
      for (const item of data.items) {
        await env.YOUTUBER_KV.put(
          `channel:${item.id.channelId}`,
          JSON.stringify(item.snippet)
        );
      }
    }
    
    return new Response(JSON.stringify({ 
      saved: data.items.length,
      channels: data.items.map(item => ({
        id: item.id.channelId,
        title: item.snippet.title,
        description: item.snippet.description
      }))
    }), { headers: corsHeaders });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: 'YouTube API error' }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

// Status handler
async function handleStatus(request, env) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };
  
  const url = new URL(request.url);
  const jobId = url.searchParams.get('job_id');
  
  if (!jobId) {
    return new Response(JSON.stringify({ error: 'Missing job_id parameter' }), {
      status: 400,
      headers: corsHeaders
    });
  }
  
  try {
    // Check KV store for job status
    if (env.KV_STORE) {
      const status = await env.KV_STORE.get(jobId);
      if (status) {
        return new Response(status, { headers: corsHeaders });
      }
    }
    
    return new Response(JSON.stringify({ error: 'Job not found' }), {
      status: 404,
      headers: corsHeaders
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// Process handler
async function handleProcess(request, env) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };
  
  try {
    const body = await request.json();
    const { video_url, job_id, spoken_lang, caption_lang } = body;
    
    if (!video_url) {
      return new Response(JSON.stringify({ error: 'Missing video_url' }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    const spokenLanguage = spoken_lang || "auto";
    const captionLanguage = caption_lang || "en";
    
    // Simulate processing with OpenAI Whisper
    let captions = 'Processing with OpenAI Whisper...';
    let status = 'processing';
    
    // If auto-detect, let Whisper decide the language
    if (spokenLanguage === "auto") {
      captions = `Auto-detecting language and transcribing to ${captionLanguage} captions...`;
    } else {
      captions = `Transcribing ${spokenLanguage} audio to ${captionLanguage} captions...`;
    }
    
    // If spoken and caption languages differ, indicate translation will occur
    if (spokenLanguage !== "auto" && spokenLanguage !== captionLanguage) {
      captions += ` (Translation from ${spokenLanguage} to ${captionLanguage} required)`;
    }
    
    const processResult = {
      job_id: job_id || Date.now().toString(),
      status,
      video_url,
      captions,
      spoken_lang: spokenLanguage,
      caption_lang: captionLanguage,
      timestamp: new Date().toISOString()
    };
    
    // Simulate async processing for demo
    setTimeout(async () => {
      try {
        const transcript = await processWithWhisperAndTranslate(video_url, spokenLanguage, captionLanguage, env);
        const updatedResult = {
          ...processResult,
          status: 'completed',
          captions: transcript,
          processed_at: new Date().toISOString()
        };
        
        if (env.KV_STORE) {
          await env.KV_STORE.put(processResult.job_id, JSON.stringify(updatedResult));
        }
      } catch (error) {
        const errorResult = {
          ...processResult,
          status: 'failed',
          error: error.message,
          processed_at: new Date().toISOString()
        };
        
        if (env.KV_STORE) {
          await env.KV_STORE.put(processResult.job_id, JSON.stringify(errorResult));
        }
      }
    }, 5000); // Process after 5 seconds for demo
    
    // Store in KV
    if (env.KV_STORE && processResult.job_id) {
      await env.KV_STORE.put(processResult.job_id, JSON.stringify(processResult));
    }
    
    // Audit logging
    await logJobAudit(processResult.job_id, processResult, env);
    
    return new Response(JSON.stringify(processResult), { headers: corsHeaders });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Processing error' }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// Outreach handler
async function handleOutreach(request, env) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };
  
  try {
    const body = await request.json();
    const { channel, lang = 'en' } = body;
    
    if (!channel || !channel.email) {
      return new Response(JSON.stringify({ error: 'Missing channel email' }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Simulate outreach email sending
    const emailResult = {
      status: 'sent',
      to: channel.email,
      subject: lang === 'es' ? 'Impulsa tu canal con subtítulos' : 'Boost your channel with captions',
      timestamp: new Date().toISOString()
    };
    
    console.log('Outreach email sent:', emailResult);
    
    return new Response(JSON.stringify(emailResult), { headers: corsHeaders });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Outreach error' }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// Checkout session handler
async function handleCheckoutSession(request, env) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };
  
  try {
    const body = await request.json();
    const { email, video_url, tier, spoken_lang, caption_lang } = body;
    
    // For now, allow checkout without email/video_url/tier for language testing
    const spokenLanguage = spoken_lang || "auto";
    const captionLanguage = caption_lang || "en";

    const amount = tier === "1" ? 100 : 1900;
    
    const resp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        mode: "payment",
        "payment_method_types[]": "card",
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][unit_amount]": amount.toString(),
        "line_items[0][price_data][product_data][name]": "AutoCaption Pro",
        "line_items[0][quantity]": "1",
        customer_email: email,
        success_url: "https://autocaption-pro.pages.dev/success",
        cancel_url: "https://autocaption-pro.pages.dev/cancel",
        "metadata[video_url]": video_url || "test",
        "metadata[tier]": tier || "1",
        "metadata[email]": email || "test@example.com",
        "metadata[spoken_lang]": spokenLanguage,
        "metadata[caption_lang]": captionLanguage
      }),
    });

    const data = await resp.json();
    
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || "Stripe error" }), { 
        status: 400,
        headers: corsHeaders
      });
    }
    
    return new Response(JSON.stringify(data), { headers: corsHeaders });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error" }), { 
      status: 500,
      headers: corsHeaders
    });
  }
}

// Process video with Whisper and translate if needed
async function processWithWhisperAndTranslate(videoUrl, spokenLang, captionLang, env) {
  try {
    // Step 1: Extract audio from video URL (simulated)
    console.log(`Extracting audio from: ${videoUrl}`);
    
    // Step 2: Transcribe with Whisper
    let transcript = await transcribeWithWhisper(videoUrl, spokenLang, env);
    let detectedLang = transcript.detected_language || spokenLang;
    
    // Step 3: Translate if needed
    if (captionLang !== detectedLang && captionLang !== "auto") {
      console.log(`Translating from ${detectedLang} to ${captionLang}`);
      transcript = await translateWithGPT(transcript.text, detectedLang, captionLang, env);
      return `${transcript}\n\n(Translated from ${detectedLang} → ${captionLang})`;
    }
    
    return transcript.text || transcript;
    
  } catch (error) {
    console.error('Processing error:', error);
    throw new Error(`Processing failed: ${error.message}`);
  }
}

// Transcribe audio using OpenAI Whisper
async function transcribeWithWhisper(videoUrl, spokenLang, env) {
  try {
    // This would normally use the OpenAI Whisper API
    // For demo purposes, we'll simulate the response
    
    const whisperParams = {
      model: "whisper-1",
      response_format: "json",
      language: spokenLang === "auto" ? undefined : spokenLang
    };
    
    // Simulate Whisper API call
    console.log('Calling Whisper API with params:', whisperParams);
    
    // Simulated response
    const mockTranscript = {
      text: `This is a simulated transcript for ${videoUrl}. The content would be transcribed by Whisper AI.`,
      detected_language: spokenLang === "auto" ? "en" : spokenLang
    };
    
    // Add cost tracking for guardrails
    const estimatedCost = 0.006; // $0.006 per minute
    console.log(`Whisper processing cost: $${estimatedCost}`);
    
    if (estimatedCost > 0.50) {
      console.warn(`High Whisper cost detected: $${estimatedCost}`);
    }
    
    return mockTranscript;
    
  } catch (error) {
    console.error('Whisper error:', error);
    throw new Error(`Whisper transcription failed: ${error.message}`);
  }
}

// Translate text using GPT
async function translateWithGPT(text, fromLang, toLang, env) {
  try {
    // This would normally use the OpenAI GPT API
    // For demo purposes, we'll simulate the response
    
    const gptParams = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text from ${fromLang} to ${toLang}. Maintain the original formatting and timing cues if present.`
        },
        {
          role: "user",
          content: text
        }
      ],
      max_tokens: 2000
    };
    
    console.log('Calling GPT API for translation:', { fromLang, toLang });
    
    // Simulated translation
    const translatedText = `[TRANSLATED] ${text} [FROM ${fromLang.toUpperCase()} TO ${toLang.toUpperCase()}]`;
    
    // Add cost tracking for guardrails
    const estimatedCost = 0.025; // Estimated cost
    console.log(`GPT translation cost: $${estimatedCost}`);
    
    if (estimatedCost > 0.50) {
      console.warn(`High translation cost detected: $${estimatedCost}`);
    }
    
    return translatedText;
    
  } catch (error) {
    console.error('GPT translation error:', error);
    throw new Error(`Translation failed: ${error.message}`);
  }
}

// Admin alerts and audit logging
async function logJobAudit(jobId, data, env) {
  try {
    const auditLog = {
      job_id: jobId,
      timestamp: new Date().toISOString(),
      spoken_lang: data.spoken_lang,
      caption_lang: data.caption_lang,
      video_url: data.video_url,
      status: data.status
    };
    
    console.log('AUDIT LOG:', auditLog);
    
    // Store audit log in separate KV namespace if available
    if (env.AUDIT_KV) {
      await env.AUDIT_KV.put(`audit:${jobId}`, JSON.stringify(auditLog));
    }
    
    // Check for admin alerts
    if (data.status === 'failed') {
      await sendAdminAlert(`Job ${jobId} failed: ${data.error}`, env);
    }
    
    return auditLog;
    
  } catch (error) {
    console.error('Audit logging error:', error);
  }
}

// Send admin alerts
async function sendAdminAlert(message, env) {
  try {
    console.log('ADMIN ALERT:', message);
    
    // In production, this would send email/Slack notification
    // For now, just log to console
    
    return true;
  } catch (error) {
    console.error('Admin alert error:', error);
  }
}