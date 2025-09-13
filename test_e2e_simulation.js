// test_e2e_simulation.js - Standalone E2E simulation test
require('dotenv').config();
const sendEmail = require('./send_email');
const generateDummy = require('./utils/generate_dummy_captions');

async function testE2ESimulation() {
  console.log('🎬 Starting E2E Simulation Test...');
  
  const tier = 'Test';
  const sessionId = `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  try {
    console.log(`✅ Simulated checkout session created: ${sessionId}`);
    
    // 1) Generate dummy caption files (simulates Whisper output)
    const { srtPath, txtPath } = generateDummy(sessionId);
    console.log(`📝 Generated files: ${srtPath}, ${txtPath}`);
    
    // 2) Send email with attachments (simulates post-payment webhook)
    const testEmail = process.env.TO_OVERRIDE || 'test@autocaptionpro.com';
    console.log(`📧 Sending email to: ${testEmail}`);
    
    try {
      await sendEmail({
        to: testEmail,
        subject: `Your AutoCaption Pro captions are ready (${tier} - ${sessionId})`,
        text: `Thanks for your purchase! We've attached your captions (SRT + TXT).\n\nTier: ${tier}\nSession: ${sessionId}\n\nThis is a test of the E2E simulation system.`,
        attachments: [
          { filename: 'captions.srt', path: srtPath },
          { filename: 'captions.txt', path: txtPath }
        ]
      });
      console.log('✅ Email dispatched with attachments');
      console.log('🎉 E2E Simulation Test COMPLETED SUCCESSFULLY!');
      
      console.log('\n📋 Test Summary:');
      console.log(`- Session ID: ${sessionId}`);
      console.log(`- Email sent to: ${testEmail}`);
      console.log(`- SRT file: ${srtPath}`);
      console.log(`- TXT file: ${txtPath}`);
      
    } catch (e) {
      console.error('❌ Email send failed:', e.message);
      console.log('📝 Files were still generated:');
      console.log(`- SRT file: ${srtPath}`);
      console.log(`- TXT file: ${txtPath}`);
      console.log('\n💡 Note: Email failure might be expected if no SMTP server is running on localhost:1025');
      console.log('   You can start a local SMTP server with: npx maildev --web-port 1080 --smtp-port 1025');
    }
    
  } catch (err) {
    console.error('❌ E2E simulation failed:', err.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testE2ESimulation().catch(console.error);
}