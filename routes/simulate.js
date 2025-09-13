// routes/simulate.js - E2E simulation without real Stripe calls
const express = require('express');
const router = express.Router();
const sendEmail = require('../send_email');
const generateDummy = require('../utils/generate_dummy_captions');

// Simulate the entire E2E flow without Stripe API calls
router.post('/', async (req, res) => {
  const tier = (req.query.tier || req.body.tier || 'Test').trim();
  const sessionId = `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  console.log(`🎬 Starting E2E simulation for tier: ${tier}, session: ${sessionId}`);
  
  try {
    // 1) Simulate checkout session creation (immediate success)
    console.log(`✅ Simulated checkout session created: ${sessionId}`);
    
    // 2) Generate dummy caption files (simulates Whisper output)
    const { srtPath, txtPath } = generateDummy(sessionId);
    console.log(`📝 Generated files: ${srtPath}, ${txtPath}`);
    
    // 3) Send email with attachments (simulates post-payment webhook)
    const testEmail = process.env.TO_OVERRIDE || 'test@autocaptionpro.com';
    try {
      await sendEmail({
        to: testEmail,
        subject: `Your AutoCaption Pro captions are ready (${tier} - ${sessionId})`,
        text: `Thanks for your purchase! We've attached your captions (SRT + TXT).\n\nTier: ${tier}\nSession: ${sessionId}`,
        attachments: [
          { filename: 'captions.srt', path: srtPath },
          { filename: 'captions.txt', path: txtPath }
        ]
      });
      console.log('✅ Email dispatched with attachments');
      
      res.json({ 
        success: true,
        message: `E2E simulation completed for ${tier} tier`,
        sessionId,
        emailSentTo: testEmail,
        files: { srtPath, txtPath }
      });
      
    } catch (e) {
      console.error('❌ Email send failed:', e);
      res.status(500).json({ 
        error: 'Email delivery failed', 
        details: e.message,
        sessionId,
        files: { srtPath, txtPath }
      });
    }
    
  } catch (err) {
    console.error('❌ E2E simulation failed:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;