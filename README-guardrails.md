# OpenAI Guardrails System

This bundle adds daily cost guardrails to ensure OpenAI spend never exceeds $10/day.

## Features
- **Soft Cap**: $8 → jobs are queued (delayed but not lost)
- **Hard Cap**: $10 → jobs are paused until next day
- **Daily Reset**: spend counter resets at midnight UTC

## Files
- `functions/process.js`: updated process endpoint with guardrail logic
- `functions/reset.js`: resets spend daily (cron-triggered)
- `.github/workflows/guardrail-test.yml`: GitHub Action to test guardrail behavior
- `README-guardrails.md`: instructions and explanations

## Testing
1. Deploy these changes to Cloudflare Pages.
2. Add a cron trigger in Cloudflare: `0 0 * * *` → runs reset.js at midnight UTC.
3. Run `guardrail-test.yml` manually in GitHub Actions to confirm:
   - Near $8 spend → `/process` returns `"queued"`.
   - At $10 spend → `/process` returns `"delayed"`.
