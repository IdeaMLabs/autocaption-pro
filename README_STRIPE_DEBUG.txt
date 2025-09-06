📦 Stripe Debug Bundle Setup

1. Ensure STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET are set in Cloudflare.
2. Deploy index.html and functions/.
3. Test the button: load https://autocaption-pro.pages.dev and click Pay $1.
4. Run GitHub Action "Stripe Debug Workflow" to simulate webhook.
5. Logs should show "Webhook Response: OK".
6. Check /status endpoint to confirm "paid".

✅ Files created:
- index.html: Simple checkout page
- functions/create-checkout-session.js: Creates Stripe sessions
- functions/webhook.js: Handles Stripe webhooks
- .github/workflows/stripe-debug.yml: Automated testing workflow