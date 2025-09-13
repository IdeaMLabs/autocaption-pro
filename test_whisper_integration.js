// test_whisper_integration.js - Test the Whisper integration directly
require('dotenv').config();
const generateCaptions = require('./utils/generate_captions');
const sendEmail = require('./send_email');

async function testWhisperIntegration() {
  console.log('🎬 Starting Whisper Integration Test...');
  
  // Use a short test YouTube video (should be under 25MB audio for Whisper API limit)
  const testYouTubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rick Astley - Never Gonna Give You Up (short clip)
  const sessionId = `whisper_test_${Date.now()}`;
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment variables');
    return;
  }
  
  console.log(`🔗 Testing with URL: ${testYouTubeUrl}`);
  console.log(`📋 Session ID: ${sessionId}`);
  
  try {
    console.log('🎙 Starting real Whisper transcription...');
    const { srtPath, txtPath } = await generateCaptions(sessionId, testYouTubeUrl);
    
    console.log('✅ Whisper transcription completed!');
    console.log(`📝 Generated files: ${srtPath}, ${txtPath}`);
    
    // Test email delivery
    const testEmail = process.env.TO_OVERRIDE || 'test@autocaptionpro.com';
    console.log(`📧 Sending email to: ${testEmail}`);
    
    try {
      await sendEmail({
        to: testEmail,
        subject: `Your AutoCaption Pro captions are ready (Whisper Test - ${sessionId})`,
        text: `Your YouTube video has been processed with real Whisper AI!\n\nURL: ${testYouTubeUrl}\nSession: ${sessionId}\n\nThis is a test of the Whisper integration.`,
        attachments: [
          { filename: 'captions.srt', path: srtPath },
          { filename: 'captions.txt', path: txtPath }
        ]
      });
      console.log('✅ Email dispatched with real Whisper captions');
      console.log('🎉 Whisper Integration Test COMPLETED SUCCESSFULLY!');
      
    } catch (e) {
      console.error('❌ Email send failed:', e.message);
      console.log('✅ But Whisper transcription worked! Files generated successfully.');
    }
    
  } catch (err) {
    console.error('❌ Whisper integration failed:', err.message);
    
    if (err.message.includes('ytdl')) {
      console.log('💡 YouTube download error - might need to update ytdl-core or handle age-restricted videos');
    } else if (err.message.includes('OpenAI')) {
      console.log('💡 OpenAI API error - check API key and billing status');
    } else if (err.message.includes('file too large')) {
      console.log('💡 Audio file too large for Whisper API (25MB limit)');
    }
  }
}

// Run the test
if (require.main === module) {
  testWhisperIntegration().catch(console.error);
}

module.exports = testWhisperIntegration;