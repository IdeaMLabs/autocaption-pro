📦 Full Pipeline Test Setup

1. Extract this ZIP into the repository root.
2. Commit and push changes to GitHub.
3. This workflow runs on every push, PR, or manual dispatch.

✅ What it tests:
- /diag endpoint availability
- Stripe payment simulation via test-stripe.js
- Webhook event handling via trigger-webhook.js
- End-to-end ML pipeline with test-end-to-end-ml.js

🔎 Where to check results:
- GitHub → Actions tab → "Deploy and Test Full Pipeline"

If all steps succeed, your deployment is fully production-ready.
