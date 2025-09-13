// Visitor tracking for Cloudflare Pages
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  try {
    // Track the visitor
    const now = new Date();
    const timestamp = now.toISOString();
    const today = now.toISOString().split('T')[0];
    const visitorId = `pages_visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get visitor info from Cloudflare
    const userAgent = request.headers.get('User-Agent') || 'Unknown';
    const referer = request.headers.get('Referer') || 'Direct';
    const cfCountry = request.headers.get('CF-IPCountry') || 'Unknown';
    const cfRay = request.headers.get('CF-Ray') || '';
    const ip = request.headers.get('CF-Connecting-IP') || 'Unknown';
    
    // Create visitor record for Pages site
    const visitorData = {
      id: visitorId,
      site: 'pages',
      timestamp: timestamp,
      date: today,
      path: url.pathname,
      query: url.search,
      userAgent: userAgent,
      referer: referer,
      country: cfCountry,
      ip: ip.substring(0, 12) + '***', // Partial IP for privacy
      cfRay: cfRay
    };
    
    // Store visitor data in KV (if available)
    if (env.YOUTUBER_KV) {
      await env.YOUTUBER_KV.put(`pages_visit_${visitorId}`, JSON.stringify(visitorData));
      
      // Update counters
      const counterKey = `pages_visitor_count_${today}`;
      const currentCount = await env.YOUTUBER_KV.get(counterKey);
      const newCount = (parseInt(currentCount) || 0) + 1;
      await env.YOUTUBER_KV.put(counterKey, newCount.toString());
      
      // Update total Pages counter
      const totalCount = await env.YOUTUBER_KV.get('pages_visitor_count_total');
      const newTotal = (parseInt(totalCount) || 0) + 1;
      await env.YOUTUBER_KV.put('pages_visitor_count_total', newTotal.toString());
    }
    
    // Return analytics data if requested
    if (url.pathname === '/analytics') {
      const todayCount = await env.YOUTUBER_KV?.get(`pages_visitor_count_${today}`) || '0';
      const totalCount = await env.YOUTUBER_KV?.get('pages_visitor_count_total') || '0';
      
      return new Response(JSON.stringify({
        success: true,
        site: 'pages',
        visitors: {
          today: parseInt(todayCount),
          total: parseInt(totalCount)
        },
        timestamp: timestamp
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    console.log(`Pages visitor tracked: ${visitorId} from ${cfCountry} to ${url.pathname}`);
    
    // Continue to next function/page
    return new Response(null, { status: 200 });
    
  } catch (error) {
    console.error('Pages visitor tracking error:', error);
    // Don't block the request if tracking fails
    return new Response(null, { status: 200 });
  }
}