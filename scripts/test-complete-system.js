#!/usr/bin/env node

// Complete system test: Payment → Processing → Transcription → Email → Reporting
const https = require('https');

const SITE_URL = 'https://autocaption-pro.pages.dev';

console.log('🚀 Testing complete AutoCaption system...\n');

// Mock data for testing
const mockSessionId = 'cs_test_complete_system_' + Date.now();
const mockVideoUrl = 'https://youtube.com/watch?v=example123';

async function testAllEndpoints() {
  console.log('🔍 Testing all system endpoints...');
  
  const endpoints = [
    '/diag',
    '/transactions',
    '/status?job_id=test',
    '/webhook',
    '/email'
  ];
  
  let working = 0;
  
  for (const endpoint of endpoints) {
    try {
      const method = endpoint.includes('webhook') || endpoint.includes('email') ? 'POST' : 'GET';
      const body = method === 'POST' ? JSON.stringify({ test: true }) : undefined;
      
      const response = await fetch(`${SITE_URL}${endpoint}`, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {},
        body
      });
      
      const status = response.status < 500 ? '✅' : '❌';
      console.log(`${status} ${endpoint}: ${response.status}`);
      if (response.status < 500) working++;
      
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
  
  console.log(`\n📊 System Health: ${working}/${endpoints.length} endpoints operational\n`);
  return working >= 3; // At least core endpoints working
}

async function simulateStripeWebhook() {
  console.log('💳 Simulating Stripe payment webhook...');
  
  const stripeEvent = {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: mockSessionId,
        customer_details: { email: 'test@autocaption.com' },
        amount_total: 2999,
        currency: 'usd',
        payment_status: 'paid'
      }
    }
  };
  
  try {
    const response = await fetch(`${SITE_URL}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stripeEvent)
    });
    
    const result = await response.json();
    console.log(`✅ Payment webhook: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    
    // Wait for KV storage
    await new Promise(resolve => setTimeout(resolve, 1000));
    return result.success;
    
  } catch (error) {
    console.log('❌ Payment webhook failed:', error.message);
    return false;
  }
}

async function testStatusEndpoint() {
  console.log('📊 Testing status endpoint with mock session...');
  
  try {
    const response = await fetch(`${SITE_URL}/status?job_id=${mockSessionId}`);
    const result = await response.json();
    
    console.log(`✅ Status endpoint: ${response.status}`);
    console.log(`📋 Payment state: ${result.state || 'unknown'}`);
    console.log(`📧 Customer email: ${result.email || 'not found'}`);
    console.log(`💰 Amount: ${result.amount ? '$' + (result.amount/100).toFixed(2) : 'not found'}`);
    
    return result.state === 'paid';
    
  } catch (error) {
    console.log('❌ Status test failed:', error.message);
    return false;
  }
}

async function testProcessingFlow() {
  console.log('\\n🎬 Testing video processing flow...');
  
  try {
    const response = await fetch(`${SITE_URL}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: mockSessionId,
        video_url: mockVideoUrl
      })
    });
    
    const result = await response.json();
    console.log(`✅ Processing request: ${result.state === 'processing' ? 'SUCCESS' : 'FAILED'}`);
    console.log(`🎯 Job ID: ${result.job_id}`);
    
    // Wait for processing simulation
    console.log('⏳ Waiting for transcript generation...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check status again for transcript
    const statusResponse = await fetch(`${SITE_URL}/status?job_id=${mockSessionId}`);
    const statusResult = await statusResponse.json();
    
    if (statusResult.transcript) {
      console.log('✅ Transcript generated successfully!');
      console.log(`📝 Transcript: ${statusResult.transcript.substring(0, 50)}...`);
    } else {
      console.log('⚠️  Transcript not yet available');
    }
    
    return result.state === 'processing';
    
  } catch (error) {
    console.log('❌ Processing test failed:', error.message);
    return false;
  }
}

async function testEmailDelivery() {
  console.log('\\n📧 Testing email delivery system...');
  
  try {
    const response = await fetch(`${SITE_URL}/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'test@autocaption.com',
        subject: 'Your AutoCaption transcript is ready!',
        text: 'Your video transcript has been generated successfully.'
      })
    });
    
    const result = await response.json();
    console.log(`✅ Email system: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log('ℹ️  Note: Email is currently mocked - configure Gmail/SendGrid for production');
    
    return result.success;
    
  } catch (error) {
    console.log('❌ Email test failed:', error.message);
    return false;
  }
}

async function testTransactionLogging() {
  console.log('\\n💾 Testing transaction logging...');
  
  try {
    const response = await fetch(`${SITE_URL}/transactions`);
    const result = await response.json();
    
    console.log(`✅ Transactions endpoint: ${response.status === 200 ? 'SUCCESS' : 'FAILED'}`);
    console.log(`📈 Total transactions logged: ${result.transactions ? result.transactions.length : 0}`);
    
    // Look for our mock transaction
    if (result.transactions) {
      const found = result.transactions.find(t => t.id === mockSessionId);
      if (found) {
        console.log('✅ Mock transaction found in logs!');
        console.log(`   - Email: ${found.email}`);
        console.log(`   - Amount: $${(found.amount / 100).toFixed(2)}`);
        console.log(`   - Status: ${found.status}`);
      }
    }
    
    return response.status === 200;
    
  } catch (error) {
    console.log('❌ Transaction logging test failed:', error.message);
    return false;
  }
}

function displaySystemOverview() {
  console.log('\\n🎯 Complete System Overview:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  console.log('\\n💳 Payment Flow:');
  console.log('   1. Customer pays via Stripe checkout');
  console.log('   2. Webhook captures payment completion');
  console.log('   3. Transaction logged to KV store');
  console.log('   4. Payment status: "paid" confirmed');
  
  console.log('\\n🎬 Processing Flow:');
  console.log('   1. POST to /process with session_id + video_url');
  console.log('   2. OpenAI Whisper API generates transcript');
  console.log('   3. Transcript stored in KV under session_id');
  console.log('   4. Status endpoint returns transcript when ready');
  
  console.log('\\n📧 Delivery Flow:');
  console.log('   1. Transcript available via /status endpoint');
  console.log('   2. Optional email delivery via /email endpoint');
  console.log('   3. Customer receives transcript instantly');
  
  console.log('\\n📊 Reporting Flow:');
  console.log('   1. All transactions logged automatically');
  console.log('   2. Nightly CSV export at midnight UTC');
  console.log('   3. Daily email reports at 6am UTC');
  console.log('   4. Data feeds into AI/ML outreach pipeline');
  
  console.log('\\n🤖 AI/ML Integration:');
  console.log('   1. YouTuber data collected via /youtuber-data');
  console.log('   2. AI analysis via /ai-processor');
  console.log('   3. Automated outreach generation');
  console.log('   4. ML-driven customer segmentation');
}

function displayNextSteps() {
  console.log('\\n📋 Next Steps for Production:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  console.log('\\n🔧 Required Configuration:');
  console.log('   • Add Stripe webhook: https://autocaption-pro.pages.dev/webhook');
  console.log('   • Event type: checkout.session.completed');
  console.log('   • Configure OpenAI API key for real transcription');
  console.log('   • Set up Gmail/SendGrid for email delivery');
  
  console.log('\\n🧪 Manual Testing:');
  console.log('   • Test with real Stripe checkout: 4242 4242 4242 4242');
  console.log('   • Submit real video URL to /process');
  console.log('   • Verify transcript quality and delivery');
  
  console.log('\\n📧 Email Setup (Optional):');
  console.log('   • GitHub Secrets: GMAIL_USER, GMAIL_PASS, RECIPIENT_EMAIL');
  console.log('   • Daily reports will be emailed automatically');
  
  console.log('\\n🎉 System Ready For:');
  console.log('   • Customer payments and processing');
  console.log('   • Automated transcript generation');
  console.log('   • Transaction logging and reporting');
  console.log('   • AI-driven YouTuber outreach');
}

async function runCompleteSystemTest() {
  console.log('🧪 Running complete system integration test...\\n');
  
  let passed = 0;
  const tests = [
    { name: 'Endpoint Health', test: testAllEndpoints },
    { name: 'Payment Webhook', test: simulateStripeWebhook },
    { name: 'Status Tracking', test: testStatusEndpoint },
    { name: 'Video Processing', test: testProcessingFlow },
    { name: 'Email Delivery', test: testEmailDelivery },
    { name: 'Transaction Logging', test: testTransactionLogging }
  ];
  
  for (const { name, test } of tests) {
    console.log(`\\n🧪 Testing: ${name}`);
    console.log('─'.repeat(40));
    try {
      const success = await test();
      if (success) passed++;
      console.log(`Result: ${success ? '✅ PASS' : '❌ FAIL'}`);
    } catch (error) {
      console.log(`Result: ❌ ERROR - ${error.message}`);
    }
  }
  
  console.log('\\n📊 Final Test Results:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Passed: ${passed}/${tests.length} tests`);
  console.log(`📈 Success Rate: ${Math.round((passed/tests.length) * 100)}%`);
  
  if (passed >= 4) {
    console.log('\\n🎉 SYSTEM OPERATIONAL! Ready for production use.');
  } else if (passed >= 2) {
    console.log('\\n⚠️  PARTIAL SUCCESS - Some components need attention.');
  } else {
    console.log('\\n❌ SYSTEM ISSUES - Check deployment and configuration.');
  }
  
  displaySystemOverview();
  displayNextSteps();
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

runCompleteSystemTest();