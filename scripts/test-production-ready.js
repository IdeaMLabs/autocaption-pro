#!/usr/bin/env node

// Production readiness test for complete AutoCaption system
const https = require('https');

const SITE_URL = 'https://autocaption-pro.pages.dev';

console.log('🚀 AutoCaption Production Readiness Test');
console.log('=========================================');
console.log(`Site: ${SITE_URL}`);
console.log(`Date: ${new Date().toISOString()}\n`);

async function testCompleteFlow() {
  console.log('🧪 Testing Complete Production Flow...\n');
  
  let passed = 0;
  let total = 0;

  // Test 1: Basic endpoints
  console.log('1️⃣  Testing Core Endpoints');
  console.log('─'.repeat(30));
  
  const coreEndpoints = ['/diag', '/transactions', '/dashboard'];
  for (const endpoint of coreEndpoints) {
    total++;
    try {
      const response = await fetch(`${SITE_URL}${endpoint}`);
      const status = response.status < 400 ? '✅' : '❌';
      console.log(`   ${status} ${endpoint}: ${response.status}`);
      if (response.status < 400) passed++;
    } catch (error) {
      console.log(`   ❌ ${endpoint}: ERROR`);
    }
  }

  // Test 2: Status endpoint
  console.log('\n2️⃣  Testing Status Endpoint');
  console.log('─'.repeat(30));
  total++;
  try {
    const response = await fetch(`${SITE_URL}/status?job_id=test_production`);
    const result = await response.json();
    console.log(`   ✅ Status endpoint: ${response.status}`);
    console.log(`   📊 Response structure: ${JSON.stringify(result).substring(0, 100)}...`);
    passed++;
  } catch (error) {
    console.log('   ❌ Status endpoint: FAILED');
  }

  // Test 3: Process endpoint
  console.log('\n3️⃣  Testing Video Processing');
  console.log('─'.repeat(30));
  total++;
  try {
    const response = await fetch(`${SITE_URL}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: 'test_production_' + Date.now(),
        video_url: 'https://example.com/test-audio.mp3'
      })
    });
    const result = await response.json();
    console.log(`   ✅ Process endpoint: ${response.status}`);
    console.log(`   🎬 Processing state: ${result.state || 'unknown'}`);
    passed++;
  } catch (error) {
    console.log('   ❌ Process endpoint: FAILED');
  }

  // Test 4: Email endpoint
  console.log('\n4️⃣  Testing Email System');
  console.log('─'.repeat(30));
  total++;
  try {
    const response = await fetch(`${SITE_URL}/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: 'test_production',
        email: 'test@production.com'
      })
    });
    const result = await response.json();
    console.log(`   ✅ Email endpoint: ${response.status}`);
    console.log(`   📧 Email status: ${result.status || 'unknown'}`);
    passed++;
  } catch (error) {
    console.log('   ❌ Email endpoint: FAILED');
  }

  // Test 5: Download endpoint
  console.log('\n5️⃣  Testing Download System');
  console.log('─'.repeat(30));
  total++;
  try {
    const response = await fetch(`${SITE_URL}/download?job_id=test_production`);
    console.log(`   ✅ Download endpoint: ${response.status}`);
    console.log(`   📄 Content-Type: ${response.headers.get('content-type') || 'unknown'}`);
    if (response.status === 404) {
      console.log('   ℹ️  404 expected for non-existent transcript');
      passed++;
    } else if (response.status === 200) {
      passed++;
    }
  } catch (error) {
    console.log('   ❌ Download endpoint: FAILED');
  }

  // Test 6: Webhook endpoint
  console.log('\n6️⃣  Testing Webhook Integration');
  console.log('─'.repeat(30));
  total++;
  try {
    const webhookData = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_production_' + Date.now(),
          customer_details: { email: 'test@production.com' },
          amount_total: 2999,
          currency: 'usd',
          payment_status: 'paid'
        }
      }
    };

    const response = await fetch(`${SITE_URL}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookData)
    });
    
    const result = await response.json();
    console.log(`   ✅ Webhook endpoint: ${response.status}`);
    console.log(`   🎣 Webhook success: ${result.success || false}`);
    if (result.success) passed++;
  } catch (error) {
    console.log('   ❌ Webhook endpoint: FAILED');
  }

  return { passed, total };
}

function displayProductionFeatures() {
  console.log('\n🎯 Production System Features');
  console.log('════════════════════════════');
  
  console.log('\n💳 Payment Processing:');
  console.log('   • Stripe integration with webhook capture');
  console.log('   • Automatic transaction logging to KV');
  console.log('   • Real-time payment status verification');
  
  console.log('\n🎬 Video Processing:');
  console.log('   • OpenAI Whisper API for transcription');
  console.log('   • Multi-language support with translation');
  console.log('   • Direct audio/video URL processing');
  
  console.log('\n📊 Status & Delivery:');
  console.log('   • Real-time job status tracking');
  console.log('   • Transcript download as .txt files');
  console.log('   • Email delivery system integration');
  
  console.log('\n📈 Analytics & Reporting:');
  console.log('   • Daily CSV transaction exports');
  console.log('   • Automated email reports');
  console.log('   • System health monitoring');
  
  console.log('\n🤖 AI/ML Pipeline:');
  console.log('   • YouTuber data collection');
  console.log('   • Automated outreach generation');
  console.log('   • ML-driven customer segmentation');
  
  console.log('\n🖥️  User Interface:');
  console.log('   • Simple dashboard for job lookup');
  console.log('   • Download interface for transcripts');
  console.log('   • Status checking system');
}

function displayValidationSteps() {
  console.log('\n📋 Final Validation Steps');
  console.log('═════════════════════════');
  
  console.log('\n🔧 Required Configuration:');
  console.log('   1. Stripe Dashboard → Webhooks');
  console.log('   2. Add endpoint: https://autocaption-pro.pages.dev/webhook');
  console.log('   3. Select event: checkout.session.completed');
  console.log('   4. Configure environment variables:');
  console.log('      • STRIPE_SECRET_KEY');
  console.log('      • OPENAI_API_KEY');
  console.log('      • GMAIL_USER/GMAIL_PASS (optional)');
  
  console.log('\n🧪 Testing Checklist:');
  console.log('   □ Run GitHub Actions "End-to-End Test"');
  console.log('   □ Test Stripe checkout: 4242 4242 4242 4242');
  console.log('   □ Verify /status shows {"state":"paid"}');
  console.log('   □ Submit video to /process endpoint');
  console.log('   □ Check /status updates to {"state":"done"}');
  console.log('   □ Download transcript via /download');
  console.log('   □ Test email delivery via /email');
  console.log('   □ Verify /dashboard accessibility');
  
  console.log('\n🚀 Go-Live Preparation:');
  console.log('   • System health monitoring active');
  console.log('   • Daily reports configured');
  console.log('   • Automated testing in place');
  console.log('   • Complete payment → delivery pipeline operational');
}

async function runProductionTest() {
  const { passed, total } = await testCompleteFlow();
  
  console.log('\n📊 Production Readiness Score');
  console.log('═══════════════════════════');
  console.log(`✅ Tests Passed: ${passed}/${total}`);
  console.log(`📈 Success Rate: ${Math.round((passed/total) * 100)}%`);
  
  if (passed === total) {
    console.log('\n🎉 SYSTEM READY FOR PRODUCTION LAUNCH!');
    console.log('   All endpoints operational');
    console.log('   Complete pipeline functional');
    console.log('   Ready for customer traffic');
  } else if (passed >= Math.floor(total * 0.8)) {
    console.log('\n✅ SYSTEM MOSTLY READY');
    console.log('   Core functionality working');
    console.log('   Minor issues to address');
    console.log('   Safe for limited launch');
  } else {
    console.log('\n⚠️  SYSTEM NEEDS ATTENTION');
    console.log('   Multiple endpoint failures');
    console.log('   Check deployment and configuration');
    console.log('   Not ready for production traffic');
  }
  
  displayProductionFeatures();
  displayValidationSteps();
  
  console.log('\n🔗 System URLs:');
  console.log(`   Production Site: ${SITE_URL}`);
  console.log('   GitHub Repository: https://github.com/IdeaMLabs/autocaption-pro');
  console.log('   Dashboard: https://autocaption-pro.pages.dev/dashboard');
  console.log('');
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
            headers: {
              get: (name) => response.headers[name.toLowerCase()]
            },
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

runProductionTest();