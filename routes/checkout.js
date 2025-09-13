// routes/checkout.js
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PRICE_MAP = {
  "Test": process.env.STRIPE_PRICE_TEST,
  "Standard": process.env.STRIPE_PRICE_STANDARD,
  "Pro": process.env.STRIPE_PRICE_PRO
};

router.post('/', async (req, res) => {
  const tier = (req.query.tier || req.body.tier || 'Test').trim();
  const priceId = PRICE_MAP[tier];
  if (!priceId) return res.status(400).json({ error: `Unknown tier: ${tier}` });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      success_url: 'http://localhost:4242/success',
      cancel_url: 'http://localhost:4242/cancel',
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
