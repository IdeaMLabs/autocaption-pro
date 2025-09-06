// Test the create-checkout-session endpoint directly
(async () => {
  try {
    console.log('Testing create-checkout-session endpoint...');
    
    const testData = {
      email: "test@example.com",
      video_url: "https://youtube.com/watch?v=test123",
      tier: "test"
    };
    
    console.log('Sending test data:', testData);
    
    const response = await fetch("https://autocaption-pro.pages.dev/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    try {
      const data = JSON.parse(responseText);
      console.log('Parsed response:', data);
      
      if (data.error) {
        console.error('❌ Server error:', data.error);
      } else if (data.id) {
        console.log('✅ Checkout session created:', data.id);
        console.log('Session URL:', data.url);
      } else {
        console.log('⚠️ Unexpected response format');
      }
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError);
      console.log('Response was:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
})();