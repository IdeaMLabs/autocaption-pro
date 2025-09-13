// utils/generate_captions.js
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function downloadAudio(youtubeUrl, outPath) {
  return new Promise((resolve, reject) => {
    const yt = spawn('yt-dlp', ['-x', '--audio-format', 'mp3', '-o', outPath, youtubeUrl]);
    yt.on('close', code => {
      if (code === 0) resolve(outPath);
      else reject(new Error(`yt-dlp failed with code ${code}`));
    });
    yt.on('error', reject);
  });
}

function formatSRT(text) {
  const lines = text.split('\n').filter(Boolean);
  return lines.map((line, idx) =>
    `${idx+1}\n00:00:${String(idx*5).padStart(2,'0')},000 --> 00:00:${String(idx*5+4).padStart(2,'0')},000\n${line}\n`
  ).join('\n');
}

module.exports = async function generateCaptions(sessionId, youtubeUrl) {
  const dir = path.join(__dirname, '..', 'out', sessionId);
  fs.mkdirSync(dir, { recursive: true });
  const audioPattern = path.join(dir, 'audio.%(ext)s');
  const finalAudio = path.join(dir, 'audio.mp3');
  const srtPath = path.join(dir, 'captions.srt');
  const txtPath = path.join(dir, 'captions.txt');

  try {
    console.log(`⬇️ Using yt-dlp to download audio from ${youtubeUrl}...`);
    await downloadAudio(youtubeUrl, audioPattern);
  } catch (err) {
    console.error('❌ yt-dlp failed, falling back to mock captions:', err);
    fs.writeFileSync(txtPath, "Mock caption: transcription unavailable", 'utf8');
    fs.writeFileSync(srtPath, "1\n00:00:00,000 --> 00:00:04,000\nMock caption: transcription unavailable\n", 'utf8');
    return { srtPath, txtPath };
  }

  console.log('🎙 Sending audio to Whisper API...');
  const resp = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file: fs.createReadStream(finalAudio),
    response_format: "text"
  });

  const transcript = resp;
  fs.writeFileSync(txtPath, transcript, 'utf8');
  fs.writeFileSync(srtPath, formatSRT(transcript), 'utf8');
  console.log('✅ Captions generated');

  return { srtPath, txtPath };
};
