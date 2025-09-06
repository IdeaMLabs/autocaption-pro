// Simulates sending a Stripe checkout.session.completed event
const fetch = require("node-fetch");

(async () => {
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
  console.log("Webhook Response:", text);
})();