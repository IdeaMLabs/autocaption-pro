// scripts/test-webhook.js
import fetch from "node-fetch";

const WEBHOOK_URL = "https://autocaption-pro.pages.dev/webhook";

async function testWebhook() {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "evt_test_webhook",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_example",
            customer_email: "test@example.com",
            amount_total: 100,
            currency: "usd"
          }
        }
      })
    });

    const text = await response.text();
    console.log("Webhook Response:", text);
  } catch (err) {
    console.error("Webhook Test Failed:", err);
  }
}

testWebhook();
