This ZIP contains all necessary files (agent, workflows, functions) to get the Cloudflare Pages Auto-Repair project running. 
To use it, extract the contents into the root of your GitHub repository connected to Cloudflare Pages. Commit and push all files. 
In your GitHub repository settings under Secrets and Variables → Actions, add the required secrets: ANTHROPIC_API_KEY (Claude API key), 
GH_TOKEN (GitHub token with contents:write), and GH_REPO (in owner/repo format). Optionally set SITE_URL as a variable for your production URL. 
After pushing, Cloudflare will deploy. Verify endpoints: /diag should return 'diag ok', and /paypal/notify should return 'paypal notify GET ok' on GET requests 
(and return { "error": "missing_fields" } when POSTed an empty JSON). Workflows inside .github/workflows will then continuously verify and self-heal the project. 
