#!/usr/bin/env node

// Automated Stripe testing script
const https = require('https');

const SITE_URL = 'https://autocaption-pro.pages.dev';
const TEST_CARD = '4242424242424242';

// Test configuration
const testData = {
  card: TEST_CARD,
  exp_month: '12',
  exp_year: '2025',
  cvc: '123',
  zip: '12345'
};

console.log('🧪 Starting automated Stripe integration test...\n');

// Wait for deployment to complete
function waitForDeployment() {
  return new Promise((resolve) => {
    console.log('⏳ Waiting 60 seconds for Cloudflare deployment...');
    setTimeout(resolve, 60000);
  });
}

// Test basic endpoints
async function testEndpoints() {
  console.log('🔍 Testing basic endpoints...');
  
  const endpoints = [
    '/diag',
    '/status?job_id=test_session_123'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${SITE_URL}${endpoint}`);
      console.log(`✅ ${endpoint}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
}

// Simulate Stripe checkout (this would normally be done via browser)
function simulateCheckout() {
  console.log('\n💳 Stripe Checkout Simulation:');
  console.log('To test the full flow:');
  console.log('1. Visit your site: https://autocaption-pro.pages.dev');
  console.log('2. Start a checkout process');
  console.log(`3. Use test card: ${TEST_CARD}`);
  console.log('4. Use exp: 12/25, CVC: 123, ZIP: 12345');
  console.log('5. Copy the returned session_id');
  console.log('6. Test: /status?job_id=<session_id>');
  console.log('\nExpected result: {"state":"paid","email":"...","amount":...,"currency":"usd"}');
}

// Test status endpoint with mock session
async function testStatusEndpoint() {
  console.log('\n🔗 Testing status endpoint...');
  
  // This will fail with Stripe API error, but verifies the endpoint structure
  try {
    const response = await fetch(`${SITE_URL}/status?job_id=cs_test_mock_session_id`);
    const data = await response.text();
    console.log(`📊 Status endpoint response: ${response.status}`);
    console.log(`📄 Response body: ${data.substring(0, 200)}...`);
  } catch (error) {
    console.log(`❌ Status test failed: ${error.message}`);
  }
}

// Main test execution
async function runTests() {
  try {
    await waitForDeployment();
    await testEndpoints();
    await testStatusEndpoint();
    simulateCheckout();
    
    console.log('\n🎉 Automated testing complete!');
    console.log('\n📋 Next manual steps:');
    console.log('1. Perform actual Stripe checkout on your site');
    console.log('2. Verify payment flow works end-to-end');
    console.log('3. Check Cloudflare logs for any errors');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Add fetch polyfill for older Node versions
if (typeof fetch === 'undefined') {
  global.fetch = (url) => {
    return new Promise((resolve, reject) => {
      const request = https.get(url, (response) => {
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
      request.on('error', reject);
    });
  };
}

runTests();