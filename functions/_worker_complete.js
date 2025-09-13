export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Enable CORS for all requests
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Diagnostic endpoint
      if (url.pathname === "/diag") {
        return new Response(JSON.stringify({ status: "ok" }), { headers: corsHeaders });
      }

      // Config endpoint - returns Stripe publishable key
      if (url.pathname === "/config") {
        return new Response(JSON.stringify({ 
          publishableKey: env.STRIPE_PUBLISHABLE_KEY || "pk_test_51S41DLK0wxQPIemdaalU9BVg1jjgj9CVioVGDpo76bO9jbAUr8bqACD4j6QA63hJcZX1VlSORYAvGNgtR313hXuX000dSfBOcj"
        }), { headers: corsHeaders });
      }

      // Create checkout session endpoint
      if (url.pathname === "/create-checkout-session" && request.method === "POST") {
        const body = await request.json();
        const { email, video_url, tier } = body;

        if (!email || !video_url || !tier) {
          return new Response(JSON.stringify({ 
            error: "Missing required fields: email, video_url, tier" 
          }), { 
            status: 400, 
            headers: corsHeaders 
          });
        }

        // Map tiers to price IDs (using test prices)
        const priceMap = {
          test: 'price_1234567890test',
          standard: 'price_1234567890standard'
        };

        const price_id = priceMap[tier];
        if (!price_id) {
          return new Response(JSON.stringify({ 
            error: "Invalid tier selected" 
          }), { 
            status: 400, 
            headers: corsHeaders 
          });
        }

        const stripeData = new URLSearchParams({
          'mode': 'payment',
          'success_url': 'https://autocaptionpro.com/success.html',
          'cancel_url': 'https://autocaptionpro.com/cancel.html',
          'customer_email': email,
          'line_items[0][price]': price_id,
          'line_items[0][quantity]': '1',
          [`metadata[video_url]`]: video_url,
          [`metadata[tier]`]: tier,
          [`metadata[email]`]: email,
        });

        const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: stripeData.toString(),
        });

        const session = await stripeResponse.json();

        if (!stripeResponse.ok) {
          console.error('Stripe API Error:', session);
          return new Response(JSON.stringify({ 
            error: 'Failed to create checkout session',
            details: session 
          }), { 
            status: 500, 
            headers: corsHeaders 
          });
        }

        return new Response(JSON.stringify({ 
          id: session.id,
          url: session.url 
        }), { headers: corsHeaders });
      }

      // Webhook endpoint
      if (url.pathname === "/webhook") {
        if (request.method === "GET") {
          return new Response(JSON.stringify({ 
            message: "Webhook endpoint is ready", 
            timestamp: new Date().toISOString() 
          }), { headers: corsHeaders });
        }

        if (request.method === "POST") {
          try {
            const body = await request.text();
            let event;
            try {
              event = JSON.parse(body);
            } catch (err) {
              console.error('Invalid JSON:', err);
              return new Response('Invalid JSON', { status: 400 });
            }

            console.log('Received webhook event:', event.type);

            // Handle the event
            switch (event.type) {
              case 'checkout.session.completed':
                const session = event.data.object;
                console.log('Checkout session completed:', session.id);
                break;
              
              default:
                console.log('Unhandled event type:', event.type);
            }

            return new Response(JSON.stringify({ received: true }), { headers: corsHeaders });
          } catch (err) {
            console.error('Webhook error:', err);
            return new Response('Webhook error', { status: 500 });
          }
        }
      }

      // 404 for unknown routes
      return new Response(JSON.stringify({ error: "Not Found" }), { 
        status: 404, 
        headers: corsHeaders 
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: "Internal server error",
        message: error.message 
      }), { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  },
};