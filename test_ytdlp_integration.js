// test_ytdlp_integration.js - Test the improved yt-dlp Whisper integration
require('dotenv').config();
const generateCaptions = require('./utils/generate_captions');
const sendEmail = require('./send_email');

async function testYtDlpIntegration() {
  console.log('🎬 Starting yt-dlp Whisper Integration Test...');
  
  // Use a short test YouTube video 
  const testYouTubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rick Astley - Never Gonna Give You Up
  const sessionId = `ytdlp_test_${Date.now()}`;
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment variables');
    return;
  }
  
  console.log(`🔗 Testing with URL: ${testYouTubeUrl}`);
  console.log(`📋 Session ID: ${sessionId}`);
  
  try {
    console.log('🎙 Starting yt-dlp + Whisper transcription...');
    const { srtPath, txtPath } = await generateCaptions(sessionId, testYouTubeUrl);
    
    console.log('✅ yt-dlp + Whisper transcription completed!');
    console.log(`📝 Generated files: ${srtPath}, ${txtPath}`);
    
    // Test email delivery
    const testEmail = process.env.TO_OVERRIDE || 'test@autocaptionpro.com';
    console.log(`📧 Sending email to: ${testEmail}`);
    
    try {
      await sendEmail({
        to: testEmail,
        subject: `Your AutoCaption Pro captions are ready (yt-dlp Test - ${sessionId})`,
        text: `Your YouTube video has been processed with yt-dlp + Whisper AI!\n\nURL: ${testYouTubeUrl}\nSession: ${sessionId}\n\nThis demonstrates the complete yt-dlp integration workflow with graceful fallback.`,
        attachments: [
          { filename: 'captions.srt', path: srtPath },
          { filename: 'captions.txt', path: txtPath }
        ]
      });
      console.log('✅ Email dispatched with yt-dlp + Whisper captions');
      console.log('🎉 yt-dlp Integration Test COMPLETED SUCCESSFULLY!');
      
    } catch (e) {
      console.error('❌ Email send failed:', e.message);
      console.log('✅ But yt-dlp + Whisper transcription worked! Files generated successfully.');
    }
    
  } catch (err) {
    console.error('❌ yt-dlp integration failed:', err.message);
    
    if (err.message.includes('yt-dlp failed')) {
      console.log('💡 yt-dlp download failed - but system should have fallen back to mock captions');
    } else if (err.message.includes('OpenAI')) {
      console.log('💡 OpenAI API error - check API key and billing status');
    }
  }
}

// Run the test
if (require.main === module) {
  testYtDlpIntegration().catch(console.error);
}

module.exports = testYtDlpIntegration;