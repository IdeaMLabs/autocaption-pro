// test_whisper_mock.js - Test Whisper integration with mock (to avoid ytdl-core issues)
require('dotenv').config();
const generateCaptionsMock = require('./utils/generate_captions_mock');
const sendEmail = require('./send_email');

async function testWhisperMock() {
  console.log('🎬 Starting Mock Whisper Integration Test...');
  
  const testYouTubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const sessionId = `whisper_mock_test_${Date.now()}`;
  
  console.log(`🔗 Testing with URL: ${testYouTubeUrl}`);
  console.log(`📋 Session ID: ${sessionId}`);
  
  try {
    const { srtPath, txtPath } = await generateCaptionsMock(sessionId, testYouTubeUrl);
    
    console.log('✅ Mock Whisper transcription completed!');
    console.log(`📝 Generated files: ${srtPath}, ${txtPath}`);
    
    // Test email delivery
    const testEmail = process.env.TO_OVERRIDE || 'test@autocaptionpro.com';
    console.log(`📧 Sending email to: ${testEmail}`);
    
    try {
      await sendEmail({
        to: testEmail,
        subject: `Your AutoCaption Pro captions are ready (Mock Whisper Test - ${sessionId})`,
        text: `Your YouTube video has been processed with Mock Whisper AI (demonstrating the integration flow)!\n\nURL: ${testYouTubeUrl}\nSession: ${sessionId}\n\nThis demonstrates the complete Whisper integration workflow.`,
        attachments: [
          { filename: 'captions.srt', path: srtPath },
          { filename: 'captions.txt', path: txtPath }
        ]
      });
      console.log('✅ Email dispatched with mock Whisper captions');
      console.log('🎉 Mock Whisper Integration Test COMPLETED SUCCESSFULLY!');
      
    } catch (e) {
      console.error('❌ Email send failed:', e.message);
      console.log('✅ But mock Whisper transcription worked! Files generated successfully.');
    }
    
  } catch (err) {
    console.error('❌ Mock Whisper integration failed:', err.message);
  }
}

// Run the test
if (require.main === module) {
  testWhisperMock().catch(console.error);
}

module.exports = testWhisperMock;