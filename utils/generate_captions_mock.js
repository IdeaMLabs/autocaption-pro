// utils/generate_captions_mock.js - Mock Whisper integration for testing
const fs = require('fs');
const path = require('path');

// Mock function that simulates Whisper API response for testing
function simulateWhisperResponse() {
  return "Hello, this is a test transcription from the Whisper API. The system is working correctly and generating real captions from YouTube audio. This would normally contain the actual spoken content from your YouTube video.";
}

function formatSRT(text) {
  const sentences = text.split('.').filter(s => s.trim());
  return sentences.map((sentence, idx) => {
    const startTime = idx * 5;
    const endTime = startTime + 4;
    const startTimestamp = `00:00:${String(startTime).padStart(2,'0')},000`;
    const endTimestamp = `00:00:${String(endTime).padStart(2,'0')},000`;
    return `${idx+1}\n${startTimestamp} --> ${endTimestamp}\n${sentence.trim()}\n`;
  }).join('\n');
}

module.exports = async function generateCaptionsMock(sessionId, youtubeUrl) {
  const dir = path.join(__dirname, '..', 'out', sessionId);
  fs.mkdirSync(dir, { recursive: true });
  const srtPath = path.join(dir, 'captions.srt');
  const txtPath = path.join(dir, 'captions.txt');

  console.log(`🔗 Mock processing URL: ${youtubeUrl}`);
  console.log('🎙 Simulating Whisper API call...');
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const transcript = simulateWhisperResponse();
  fs.writeFileSync(txtPath, transcript, 'utf8');
  fs.writeFileSync(srtPath, formatSRT(transcript), 'utf8');
  
  console.log('✅ Mock Whisper transcription completed');
  return { srtPath, txtPath };
};