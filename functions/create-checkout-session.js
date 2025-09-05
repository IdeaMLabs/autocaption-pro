import Stripe from 'stripe';

export async function onRequestPost(context) {
  const stripe = new Stripe(context.env.STRIPE_SECRET_KEY);

  try {
    const { email, video_url, tier } = await context.request.json();

    // Simple pricing (in cents)
    const price = tier === "1" ? 100 : 1900;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'AutoCaption Pro Transcript',
            description: `Video: ${video_url}`
          },
          unit_amount: price,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${new URL(context.request.url).origin}/status?job_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${new URL(context.request.url).origin}/`,
    });

    return new Response(JSON.stringify({ id: session.id }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
