// Complete test script for the Worker endpoints
const WORKER_URL = 'https://autocaption-worker.ideamlabs.workers.dev';

async function testWorkerComplete() {
  console.log('🧪 Testing Complete Worker Implementation...\n');
  
  try {
    // Test /diag endpoint
    console.log('Testing /diag endpoint...');
    const diagResponse = await fetch(`${WORKER_URL}/diag`);
    const diagData = await diagResponse.json();
    console.log('✅ /diag:', diagData);
    
    // Test /config endpoint
    console.log('\nTesting /config endpoint...');
    const configResponse = await fetch(`${WORKER_URL}/config`);
    const configData = await configResponse.json();
    console.log('✅ /config:', configData);
    
    // Test /webhook GET
    console.log('\nTesting /webhook GET endpoint...');
    const webhookGetResponse = await fetch(`${WORKER_URL}/webhook`);
    const webhookGetData = await webhookGetResponse.json();
    console.log('✅ /webhook GET:', webhookGetData);
    
    // Test /create-checkout-session POST
    console.log('\nTesting /create-checkout-session POST endpoint...');
    const checkoutResponse = await fetch(`${WORKER_URL}/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        video_url: 'https://youtube.com/watch?v=test123',
        tier: 'test'
      })
    });
    
    if (checkoutResponse.ok) {
      const checkoutData = await checkoutResponse.json();
      console.log('✅ /create-checkout-session:', checkoutData);
    } else {
      const errorText = await checkoutResponse.text();
      console.log('❌ /create-checkout-session error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n🎉 Worker endpoint testing completed!');
}

// Run tests
testWorkerComplete().catch(console.error);