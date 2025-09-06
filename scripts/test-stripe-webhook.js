// Test stripe-webhook endpoint
(async () => {
  try {
    const response = await fetch("https://autocaption-pro.pages.dev/stripe-webhook", {
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
    
    console.log("Stripe Webhook Response Status:", response.status);
    const text = await response.text();
    console.log("Stripe Webhook Response:", text);
  } catch (error) {
    console.error("Error testing stripe-webhook:", error);
  }
})();