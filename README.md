Instruction for Deployment (ML-Ready Bundle):

1. Extract this ZIP into the root of your GitHub repository linked to Cloudflare Pages.
2. Commit and push all files to your `main` branch.
3. In GitHub → Settings → Secrets and Variables → Actions, add:
   - ANTHROPIC_API_KEY (Claude API key)
   - GH_TOKEN (GitHub token with contents:write access)
   - GH_REPO (format: owner/repo)
   - (Optional) SITE_URL (your production URL)
4. Cloudflare will auto-deploy when it sees the /functions folder.
5. Verify endpoints:
   - GET /diag → should return "diag ok"
   - GET /paypal/notify → should return "paypal notify GET ok"
   - POST /paypal/notify with {} → should return { "error": "missing_fields" }
   - POST /process with {session_id, video_url} → should return { state: "processing" }
   - GET /status?job_id=<id> → should return { state: "done", transcript: "Hello world transcript" }
6. The workflows in .github/workflows will continuously monitor and self-heal endpoints automatically.
