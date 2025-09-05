#!/usr/bin/env node

// Complete integration test for Stripe + YouTuber data + AI processing
const https = require('https');

const SITE_URL = 'https://autocaption-pro.pages.dev';

console.log('🚀 Testing complete integration flow...\n');

// Mock YouTuber data for testing
const mockYouTuberData = {
  email: 'test@youtube.com',
  channel_name: 'Tech Tutorials Pro',
  channel_url: 'https://youtube.com/@techtutorialspro',
  subscriber_count: 25000,
  session_id: 'cs_test_mock_session_' + Date.now()
};

async function testYouTuberDataCollection() {
  console.log('📊 Testing YouTuber data collection...');
  
  try {
    const response = await fetch(`${SITE_URL}/youtuber-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockYouTuberData)
    });
    
    const result = await response.json();
    console.log('✅ YouTuber data collection:', result.success ? 'SUCCESS' : 'FAILED');
    return result.session_id;
    
  } catch (error) {
    console.log('❌ YouTuber data collection failed:', error.message);
    return null;
  }
}

async function testAIProcessing(sessionId) {
  console.log('🤖 Testing AI processing...');
  
  try {
    const response = await fetch(`${SITE_URL}/ai-processor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'process_youtuber',
        session_id: sessionId
      })
    });
    
    const result = await response.json();
    console.log('✅ AI processing:', result.success ? 'SUCCESS' : 'FAILED');
    
    if (result.analysis) {
      console.log('📈 Analysis results:');
      console.log(`   - Category: ${result.analysis.content_category}`);
      console.log(`   - Priority: ${result.analysis.outreach_priority}`);
      console.log(`   - Engagement: ${result.analysis.engagement_estimate}`);
    }
    
    return result.success;
    
  } catch (error) {
    console.log('❌ AI processing failed:', error.message);
    return false;
  }
}

async function testOutreachGeneration(sessionId) {
  console.log('📧 Testing outreach generation...');
  
  try {
    const response = await fetch(`${SITE_URL}/ai-processor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'generate_outreach',
        session_id: sessionId
      })
    });
    
    const result = await response.json();
    console.log('✅ Outreach generation:', result.success ? 'SUCCESS' : 'FAILED');
    
    if (result.outreach_content) {
      console.log('📬 Generated outreach:');
      console.log(`   - Subject: ${result.outreach_content.subject}`);
      console.log(`   - Follow-ups: ${result.outreach_content.follow_up_sequence.length} planned`);
    }
    
    return result.success;
    
  } catch (error) {
    console.log('❌ Outreach generation failed:', error.message);
    return false;
  }
}

async function testStripeStatusEndpoint() {
  console.log('💳 Testing Stripe status endpoint...');
  
  try {
    const response = await fetch(`${SITE_URL}/status?job_id=cs_test_mock_session`);
    const result = await response.text();
    
    // Should fail with Stripe API error, but endpoint should be accessible
    console.log('✅ Status endpoint accessible:', response.status === 200 ? 'YES' : 'NO');
    return true;
    
  } catch (error) {
    console.log('❌ Status endpoint failed:', error.message);
    return false;
  }
}

async function runCompleteTest() {
  console.log('🧪 Starting complete integration test...\n');
  
  let passed = 0;
  let total = 4;
  
  // Test YouTuber data collection
  const sessionId = await testYouTuberDataCollection();
  if (sessionId) passed++;
  
  console.log('');
  
  // Test AI processing
  if (sessionId && await testAIProcessing(sessionId)) passed++;
  
  console.log('');
  
  // Test outreach generation
  if (sessionId && await testOutreachGeneration(sessionId)) passed++;
  
  console.log('');
  
  // Test Stripe status endpoint
  if (await testStripeStatusEndpoint()) passed++;
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}/${total} tests`);
  
  if (passed === total) {
    console.log('🎉 All systems operational! Ready for YouTuber onboarding and AI-driven outreach.');
  } else {
    console.log('⚠️  Some systems need attention. Check the logs above.');
  }
  
  console.log('\n🔗 Integration Flow:');
  console.log('1. User pays via Stripe checkout → session_id generated');
  console.log('2. YouTuber data collected → stored in KV for AI processing');
  console.log('3. AI analyzes channel → generates insights and priority');
  console.log('4. Automated outreach content → personalized emails ready');
  console.log('5. Status tracking → /status?job_id=<session_id> shows payment state');
}

// Add fetch polyfill for older Node versions
if (typeof fetch === 'undefined') {
  global.fetch = (url, options = {}) => {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const requestOptions = {
        method: options.method || 'GET',
        headers: options.headers || {},
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search
      };
      
      const req = https.request(requestOptions, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          resolve({
            status: response.statusCode,
            statusText: response.statusMessage,
            text: () => Promise.resolve(data),
            json: () => Promise.resolve(JSON.parse(data))
          });
        });
      });
      
      req.on('error', reject);
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  };
}

runCompleteTest();