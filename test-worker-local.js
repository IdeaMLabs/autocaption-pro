// Local test script for the Worker logic
import workerModule from './_worker.js';

// Mock environment
const env = {
  STRIPE_SECRET_KEY: 'sk_test_your_key_here',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_51S41DLK0wxQPIemdaalU9BVg1jjgj9CVioVGDpo76bO9jbAUr8bqACD4j6QA63hJcZX1VlSORYAvGNgtR313hXuX000dSfBOcj'
};

// Test function
async function testWorker() {
  console.log('🧪 Testing Worker Logic Locally...\n');
  
  // Test /diag endpoint
  const diagRequest = new Request('https://test.com/diag');
  const diagResponse = await workerModule.default.fetch(diagRequest, env, {});
  console.log('✅ /diag:', await diagResponse.text());
  
  // Test /config endpoint  
  const configRequest = new Request('https://test.com/config');
  const configResponse = await workerModule.default.fetch(configRequest, env, {});
  console.log('✅ /config:', await configResponse.text());
  
  // Test /webhook GET
  const webhookRequest = new Request('https://test.com/webhook');
  const webhookResponse = await workerModule.default.fetch(webhookRequest, env, {});
  console.log('✅ /webhook GET:', await webhookResponse.text());
  
  // Test /webhook POST
  const webhookPostRequest = new Request('https://test.com/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'evt_test_123',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_123', customer_email: 'test@example.com' }}
    })
  });
  const webhookPostResponse = await workerModule.default.fetch(webhookPostRequest, env, {});
  console.log('✅ /webhook POST:', await webhookPostResponse.text());
  
  console.log('\n🎉 All Worker logic tests completed!');
  console.log('📝 Next step: Deploy with `wrangler deploy`');
}

// Run tests
testWorker().catch(console.error);