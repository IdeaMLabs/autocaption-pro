# AutoCaption Pro - AI-Powered Spend Control System

## 🚀 OpenAI Spend Control & Processing System

AutoCaption Pro now includes comprehensive OpenAI spending controls that ensure **users never lose jobs and you never overspend**. The system implements daily caps, smart queuing, and automatic replay functionality.

## 💰 Spend Control Features

### Daily Spending Caps
- **Soft Cap**: $8.00 USD (jobs get queued for later processing)
- **Hard Cap**: $10.00 USD (jobs get delayed until midnight UTC reset)
- **Automatic Reset**: Every midnight UTC, spend resets and all queued jobs process

### Smart Job Queue System
- Jobs over soft cap are **queued** (not lost)
- Jobs over hard cap are **delayed** until reset
- Automatic replay every 10 minutes if under soft cap
- FIFO processing ensures fairness

### Cost Estimation
- **Whisper Transcription**: $0.006 per minute
- **GPT Text Processing**: $0.002 per 1000 tokens
- **Default Jobs**: $0.01 fallback cost
- Real-time cost tracking with ±20% actual variance

## 🛡️ Spend Guard System

### How It Works
1. **Pre-Processing Check**: Every job checks current daily spend before OpenAI calls
2. **Cost Estimation**: Jobs estimate upfront costs based on duration/tokens
3. **Guard Logic**:
   - `spend < $8.00` → Process immediately
   - `$8.00 ≤ spend < $10.00` → Queue for later (state: "queued")
   - `spend ≥ $10.00` → Delay until reset (state: "delayed")
4. **Post-Processing**: Add actual costs to daily spend tracker

### Queue & Replay System
- **Every 10 minutes**: Check if spend < soft cap, then process up to 5 queued jobs
- **Midnight UTC**: Reset daily spend to $0 and process ALL queued jobs
- **Job States**: `pending` → `paid` → `processing`/`queued`/`delayed` → `done`

## 🔧 Environment Variables

### Required Secrets (Cloudflare Workers)
```bash
OPENAI_API_KEY=sk-...                    # Your OpenAI API key
STRIPE_PUBLISHABLE_KEY=pk_live_...       # Stripe publishable key  
STRIPE_SECRET_KEY=sk_live_...            # Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...          # Stripe webhook secret
```

### Environment Variables (wrangler.toml)
```toml
[vars]
DAILY_OPENAI_CAP_USD = "10"            # Hard cap - blocks processing
SOFT_CAP_USD = "8"                      # Soft cap - queues processing  
COST_PER_MIN_EST_USD = "0.006"          # Whisper cost per minute
COST_PER_1K_TOKENS_USD = "0.002"       # GPT cost per 1k tokens
ADMIN_EMAIL = "admin@example.com"       # Alert recipient
```

## 📊 API Endpoints

### Processing Endpoints
```bash
POST /process                           # Main processing endpoint
POST /process?mode=mock                 # Mock mode for testing (no OpenAI calls)
GET /status?job_id=<id>                # Check job status
```

### Admin Spend Control
```bash
GET /admin/spend                        # Get current spend status
POST /admin/spend/reset                 # Reset daily spend to $0 (admin only)  
POST /admin/spend/add {"usd": 5.0}      # Add synthetic spend (testing)
POST /admin/replay                      # Force replay queued jobs
```

### Monitoring & Dashboard
```bash
GET /diag                              # System diagnostics + spend status
GET /admin-dashboard                   # Admin dashboard with spend monitoring
GET /                                  # Interactive spend control dashboard
```

## 🧪 Testing & Validation

### GitHub Action Guardrails
The `guardrail-test.yml` workflow runs comprehensive tests:

1. **Reset Test**: Verify spend reset functionality
2. **Soft Cap Test**: Add $7.90, verify job processes
3. **Queue Test**: Add $0.20, verify job queues at soft cap  
4. **Hard Cap Test**: Add $2.00, verify job delays at hard cap
5. **Validation**: Confirm spend tracking and queue counts

### Manual Testing
```bash
# Reset spend
curl -X POST https://autocaption-worker.ideamlabs.workers.dev/admin/spend/reset

# Test soft cap (should queue)
curl -X POST https://autocaption-worker.ideamlabs.workers.dev/admin/spend/add -d '{"usd": 8.5}'
curl -X POST https://autocaption-worker.ideamlabs.workers.dev/process -d '{"type":"transcription","duration":60}'

# Check status  
curl https://autocaption-worker.ideamlabs.workers.dev/admin/spend
```

## 🔄 Cron Automation

### Scheduled Triggers
- **Every 10 minutes**: Replay queued jobs if under soft cap
- **Daily 6 AM UTC**: Execute daily automation workflows  
- **Midnight UTC**: Reset spend and process all queued jobs

### Job Lifecycle
```
Payment → paid → processing → [guard check] → queued/delayed/done
                                    ↓
                              [10min replay or midnight reset]
                                    ↓
                              processing → done
```

## 🚨 Alerting System

### Automatic Alerts
- **Soft Cap Alert**: Triggered at $8.00 (jobs now queue)
- **Hard Cap Alert**: Triggered at $10.00 (jobs now delay)
- **Alert Data**: Current spend, queue count, next replay time
- **Deduplication**: One alert per cap per day

### Alert Logs
```bash
# Check alert logs
GET /admin/alerts                       # View recent alerts (if implemented)
```

## 🏗️ Deployment Instructions

### 1. Environment Setup
```bash
# Add secrets to Cloudflare Worker
wrangler secret put OPENAI_API_KEY
wrangler secret put STRIPE_SECRET_KEY  
wrangler secret put STRIPE_WEBHOOK_SECRET

# Deploy with updated configuration
wrangler deploy
```

### 2. Stripe Webhook Configuration
1. Go to Stripe Dashboard → Developers → Webhooks
2. Create endpoint: `https://autocaption-worker.ideamlabs.workers.dev/webhook`
3. Subscribe to: `checkout.session.completed`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### 3. Verification Endpoints
```bash
GET /diag                              # Should return spend_control object
GET /admin/spend                       # Should return today's spend data
GET /                                  # Interactive dashboard
```

### 4. GitHub Actions
- Push to trigger guardrail tests automatically
- Manual trigger via GitHub Actions tab
- Tests validate all spend control functionality

## 📈 Monitoring Dashboard

### Real-Time Metrics
- **Today's Spend**: Current daily OpenAI spending
- **Queue Count**: Jobs waiting to process  
- **Cap Status**: Green (under soft), Yellow (queue mode), Red (delay mode)
- **Auto-refresh**: Dashboard updates every 5 seconds

### Admin Controls
- **Reset Spend**: Emergency reset to $0
- **Add Synthetic Spend**: Test cap behavior
- **Replay Jobs**: Force queue processing
- **View Logs**: Spend events and alerts

## 🎯 Production Guarantees

### For Users
- ✅ **Never lose jobs**: Queuing system preserves all paid work
- ✅ **Predictable processing**: Clear status updates (`queued`, `delayed`, `done`)  
- ✅ **Automatic recovery**: Jobs process when capacity available

### For Operators  
- ✅ **Never overspend**: Hard caps prevent budget overruns
- ✅ **Cost visibility**: Real-time spend tracking and estimates
- ✅ **Automated management**: Self-healing queue and replay systems
- ✅ **Alert notifications**: Proactive cap violation warnings

## 🔍 Troubleshooting

### Common Issues
1. **Jobs stuck in queue**: Check if spend > soft cap, wait for 10min replay
2. **Jobs stuck delayed**: Wait for midnight UTC reset or admin reset
3. **Spend not tracking**: Verify KV namespace binding and TTL settings
4. **Alerts not firing**: Check admin email configuration

### Debug Commands  
```bash
# Check spend status
curl https://autocaption-worker.ideamlabs.workers.dev/admin/spend

# View system diagnostics
curl https://autocaption-worker.ideamlabs.workers.dev/diag

# Test processing (mock mode)
curl -X POST https://autocaption-worker.ideamlabs.workers.dev/process?mode=mock \
  -H "Content-Type: application/json" \
  -d '{"type": "transcription", "duration": 60}'
```

---

## 🏆 System Architecture Summary

**AutoCaption Pro** combines payment processing, OpenAI integration, and spend controls into a bulletproof system:

- 💳 **Stripe Integration**: Live payment processing with webhook validation
- 🤖 **OpenAI Processing**: Whisper + GPT with cost tracking
- 🛡️ **Spend Guards**: Soft/hard caps prevent overruns  
- ⏱️ **Smart Queuing**: No jobs lost, automatic replay
- 📊 **Real-Time Monitoring**: Live dashboards and alerts
- 🧪 **Automated Testing**: CI/CD guardrails ensure reliability

**Result**: A production-ready system where users never lose work and operators never overspend. 🚀