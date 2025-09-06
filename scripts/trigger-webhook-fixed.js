// Simulates sending a Stripe checkout.session.completed event
// Using built-in fetch for Node.js 18+

(async () => {
  try {
    const response = await fetch("https://autocaption-pro.pages.dev/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "evt_test_123",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_123",
            customer_email: "test@example.com",
            amount_total: 100,
            currency: "usd"
          }
        }
      })
    });
    
    const text = await response.text();
    console.log("Webhook Response Status:", response.status);
    console.log("Webhook Response:", text);
  } catch (error) {
    console.error("Error testing webhook:", error);
  }
})();