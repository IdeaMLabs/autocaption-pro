// utils/generate_dummy_captions.js
const fs = require('fs');
const path = require('path');

function srtContent() {
  return `1
00:00:01,000 --> 00:00:04,000
Welcome to my channel!

2
00:00:04,500 --> 00:00:07,000
Today we're talking about…

3
00:00:07,500 --> 00:00:10,000
Here are the 3 tips…
`;
}

function txtContent() {
  return `00:00:01 → Welcome to my channel!
00:00:04 → Today we're talking about…
00:00:07 → Here are the 3 tips…
`;
}

module.exports = function generateDummy(sessionId) {
  const dir = path.join(__dirname, '..', 'out', sessionId);
  fs.mkdirSync(dir, { recursive: true });
  const srtPath = path.join(dir, 'captions.srt');
  const txtPath = path.join(dir, 'captions.txt');
  fs.writeFileSync(srtPath, srtContent(), 'utf8');
  fs.writeFileSync(txtPath, txtContent(), 'utf8');
  return { srtPath, txtPath };
};
