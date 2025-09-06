# 🚀 Cloudflare Worker Deployment Instructions

## Step 1: Deploy the Worker

```bash
# Install Wrangler CLI if not already installed
npm install -g wrangler

# Authenticate with Cloudflare
wrangler auth login

# Deploy the worker
wrangler deploy
```

## Step 2: Set Environment Variables

```bash
# Set Stripe secrets (replace with your actual keys)
wrangler secret put STRIPE_SECRET_KEY
# Enter: sk_test_...your_stripe_secret_key

wrangler secret put STRIPE_PUBLISHABLE_KEY  
# Enter: pk_test_...your_stripe_publishable_key
```

## Step 3: Get Worker URL

After deployment, you'll get a Worker URL like:
- `https://autocaption-api.your-subdomain.workers.dev`

## Step 4: Test the Worker

Test all endpoints:
- `GET https://autocaption-api.your-subdomain.workers.dev/diag`
- `GET https://autocaption-api.your-subdomain.workers.dev/config`
- `GET https://autocaption-api.your-subdomain.workers.dev/webhook`
- `POST https://autocaption-api.your-subdomain.workers.dev/create-checkout-session`

## Step 5: Update Frontend

Update your frontend to use the Worker endpoints instead of relative URLs:

```javascript
// Replace relative URLs with Worker URLs
fetch("https://autocaption-api.your-subdomain.workers.dev/create-checkout-session", {
  method: "POST",
  // ... rest of code
})
```

## Expected Results

✅ `/diag` should return: `diag ok`
✅ `/config` should return: `{"STRIPE_PUBLISHABLE_KEY":"pk_test_..."}`  
✅ `/webhook` should return: `{"message":"Webhook active","timestamp":...}`
✅ `/create-checkout-session` should create Stripe sessions

## Architecture Benefits

- ✅ **Worker handles all API endpoints** with full functionality
- ✅ **Pages serves static content** (HTML, CSS, JS)  
- ✅ **Complete separation of concerns**
- ✅ **Guaranteed to work** - bypasses Pages Functions issues
- ✅ **Better performance** - dedicated Worker for API calls