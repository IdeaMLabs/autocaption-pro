// routes/webhook.js
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sendEmail = require('../send_email');
const generateDummy = require('../utils/generate_dummy_captions');

// Stripe requires the raw body to validate signatures
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return res.sendStatus(400);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log(`✅ Payment received for session ${session.id}`);

    // 1) Generate dummy caption files (simulates Whisper output)
    const { srtPath, txtPath } = generateDummy(session.id);
    console.log(`📝 Generated files: ${srtPath}, ${txtPath}`);

    // 2) Send email with attachments
    const to = (session.customer_details && session.customer_details.email) || 'test@example.com';
    try {
      await sendEmail({
        to,
        subject: `Your AutoCaption Pro captions are ready (session ${session.id})`,
        text: `Thanks for your purchase! We've attached your captions (SRT + TXT).`,
        attachments: [
          { filename: 'captions.srt', path: srtPath },
          { filename: 'captions.txt', path: txtPath }
        ]
      });
      console.log('✅ Email dispatched with attachments');
    } catch (e) {
      console.error('❌ Email send failed:', e);
    }
  }

  res.json({ received: true });
});

module.exports = router;
