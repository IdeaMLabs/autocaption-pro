// scripts/test-end-to-end-ml.js
import fetch from "node-fetch";

const BASE_URL = "https://autocaption-pro.pages.dev";

async function runEndToEndMLTest() {
  try {
    // Step 1: Simulate Stripe checkout.session.completed event
    console.log("Step 1: Sending webhook event...");
    await fetch(`${BASE_URL}/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "evt_test_fullpipeline_ml",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_full456",
            customer_email: "mltest@example.com",
            amount_total: 500,
            currency: "usd",
            payment_status: "paid"
          }
        }
      })
    });

    // Step 2: Check status → should be "paid"
    console.log("Step 2: Checking status...");
    const statusPaid = await fetch(`${BASE_URL}/status?job_id=cs_test_full456`);
    console.log("Status (paid):", await statusPaid.text());

    // Step 3: Call process endpoint
    console.log("Step 3: Calling /process...");
    await fetch(`${BASE_URL}/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: "cs_test_full456",
        video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      })
    });

    // Step 4: Check status again → should be "done"
    console.log("Step 4: Checking status for completion...");
    const statusDone = await fetch(`${BASE_URL}/status?job_id=cs_test_full456`);
    console.log("Status (done):", await statusDone.text());

    // Step 5: Test AI/ML endpoints
    console.log("Step 5: Sending YouTuber data...");
    await fetch(`${BASE_URL}/youtuber-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel_name: "Demo Channel",
        email: "creator@example.com",
        subscribers: 1000
      })
    });

    console.log("Step 6: Running AI Processor...");
    const aiRes = await fetch(`${BASE_URL}/ai-processor`, { method: "GET" });
    console.log("AI Processor Response:", await aiRes.text());

    // Step 7: Test download endpoint
    console.log("Step 7: Testing /download...");
    const downloadRes = await fetch(`${BASE_URL}/download?job_id=cs_test_full456`);
    console.log("Download Response Status:", downloadRes.status);

  } catch (err) {
    console.error("End-to-End ML Test Failed:", err);
  }
}

runEndToEndMLTest();
