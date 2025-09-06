📦 Webhook Trigger Test Bundle

This bundle contains files to simulate a Stripe checkout.session.completed event against your deployed webhook.

Steps:
1. Extract this ZIP into your project root.
2. Commit and push changes to GitHub.
3. Go to GitHub → Actions → Run "Webhook Trigger Test".
4. The script will POST a fake Stripe event to https://autocaption-pro.pages.dev/webhook.
5. Logs will show the response from your Cloudflare function.

Expected result: "Webhook Response: OK" or similar confirmation.