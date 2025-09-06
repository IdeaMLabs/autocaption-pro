# Worker Webhook Checkout Bundle

## Setup

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Authenticate with Cloudflare:
   ```bash
   wrangler login
   ```

3. Deploy the Worker:
   ```bash
   wrangler deploy
   ```

4. Set Secrets (replace with your real Stripe keys):
   ```bash
   wrangler secret put STRIPE_SECRET_KEY
   wrangler secret put STRIPE_PUBLISHABLE_KEY
   ```

5. Test Endpoints:
   - `/diag` → should return `{ "status": "ok" }`
   - `/create-checkout-session` → returns mock Stripe session JSON
   - `/webhook` → responds with `{ "status": "webhook ok" }` or echoes event
   - `index.html` → click Pay $1 button to simulate checkout
