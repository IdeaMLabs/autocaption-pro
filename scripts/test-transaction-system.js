#!/usr/bin/env node

// Test script for Stripe transaction tracking system
const https = require('https');

const SITE_URL = 'https://autocaption-pro.pages.dev';

console.log('💰 Testing Stripe transaction tracking system...\n');

async function testTransactionsEndpoint() {
  console.log('📊 Testing /transactions endpoint...');
  
  try {
    const response = await fetch(`${SITE_URL}/transactions`);
    const result = await response.json();
    
    console.log(`✅ Transactions endpoint: ${response.status} ${response.statusText}`);
    console.log(`📈 Found ${result.transactions ? result.transactions.length : 0} transactions`);
    
    if (result.transactions && result.transactions.length > 0) {
      const sample = result.transactions[0];
      console.log('📋 Sample transaction structure:');
      console.log(`   - ID: ${sample.id || 'N/A'}`);
      console.log(`   - Email: ${sample.email || 'N/A'}`);
      console.log(`   - Amount: ${sample.amount || 'N/A'}`);
      console.log(`   - Currency: ${sample.currency || 'N/A'}`);
      console.log(`   - Status: ${sample.status || 'N/A'}`);
    } else {
      console.log('ℹ️  No transactions found yet - this is expected before first payment');
    }
    
    return response.status === 200;
    
  } catch (error) {
    console.log('❌ Transactions endpoint failed:', error.message);
    return false;
  }
}

async function testWebhookEndpoint() {
  console.log('\n🔗 Testing /webhook endpoint...');
  
  try {
    // Test POST to webhook (should handle it gracefully)
    const response = await fetch(`${SITE_URL}/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'test_event',
        data: { object: { id: 'test_session' } }
      })
    });
    
    const result = await response.json();
    console.log(`✅ Webhook endpoint: ${response.status} ${response.statusText}`);
    console.log(`📝 Response: ${JSON.stringify(result)}`);
    
    return response.status === 200;
    
  } catch (error) {
    console.log('❌ Webhook endpoint failed:', error.message);
    return false;
  }
}

async function simulateStripeWebhook() {
  console.log('\n🎭 Simulating Stripe checkout.session.completed webhook...');
  
  const mockStripeEvent = {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_simulation_' + Date.now(),
        customer_details: {
          email: 'test@example.com'
        },
        amount_total: 2999, // $29.99
        currency: 'usd',
        payment_status: 'paid'
      }
    }
  };
  
  try {
    const response = await fetch(`${SITE_URL}/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockStripeEvent)
    });
    
    const result = await response.json();
    console.log(`✅ Mock webhook processed: ${response.status}`);
    console.log(`📝 Response: ${JSON.stringify(result)}`);
    
    if (result.success) {
      console.log('🎉 Transaction should now be stored in KV!');
      
      // Wait a moment then check transactions
      console.log('⏳ Waiting 2 seconds then checking transactions...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const txnResponse = await fetch(`${SITE_URL}/transactions`);
      const txnResult = await txnResponse.json();
      
      const found = txnResult.transactions?.find(t => t.id === mockStripeEvent.data.object.id);
      if (found) {
        console.log('✅ Mock transaction found in /transactions endpoint!');
        console.log(`   - Email: ${found.email}`);
        console.log(`   - Amount: $${(found.amount / 100).toFixed(2)}`);
      } else {
        console.log('❌ Mock transaction not found in transactions list');
      }
    }
    
    return result.success;
    
  } catch (error) {
    console.log('❌ Mock webhook failed:', error.message);
    return false;
  }
}

function displayNextSteps() {
  console.log('\n📋 Next Steps for Complete Setup:');
  console.log('\n1. 🎯 Configure Stripe Webhook:');
  console.log('   - Go to Stripe Dashboard → Developers → Webhooks');
  console.log('   - Add endpoint: https://autocaption-pro.pages.dev/webhook');
  console.log('   - Select event: checkout.session.completed');
  console.log('   - Save webhook configuration');
  
  console.log('\n2. 💳 Test Real Payment:');
  console.log('   - Use test card: 4242 4242 4242 4242');
  console.log('   - Any future expiry, any 3-digit CVC, any ZIP');
  console.log('   - Complete checkout flow');
  console.log('   - Verify transaction appears at /transactions');
  
  console.log('\n3. 📧 Configure Email Reporting (Optional):');
  console.log('   - Add GitHub secrets:');
  console.log('     • GMAIL_USER: your Gmail address');
  console.log('     • GMAIL_PASS: Gmail app password');
  console.log('     • RECIPIENT_EMAIL: destination email');
  console.log('   - GitHub Actions will email CSV reports daily at 6am UTC');
  
  console.log('\n4. 🤖 Automated Features:');
  console.log('   - Nightly CSV export: runs at midnight UTC');
  console.log('   - Daily email reports: runs at 6am UTC');
  console.log('   - All transactions stored permanently in KV');
}

async function runTransactionTests() {
  let passed = 0;
  let total = 3;
  
  if (await testTransactionsEndpoint()) passed++;
  if (await testWebhookEndpoint()) passed++;
  if (await simulateStripeWebhook()) passed++;
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 Transaction tracking system is fully operational!');
  } else {
    console.log('⚠️  Some tests failed - check the deployment status');
  }
  
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

runTransactionTests();