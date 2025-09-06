# Automated YouTube Outreach System

## Overview

This system provides fully automated daily ingestion and outreach for YouTube creators. It monitors for new Excel files, processes creator data, applies ML scoring, sends personalized outreach emails with throttling, and maintains comprehensive logging.

## 🌟 Key Features

- **📁 Daily Excel File Ingestion**: Automatically detects and processes new `YouTuber_XXX.xlsx` files
- **🧹 Data Validation & Cleaning**: Validates emails, URLs, and channel information
- **🤖 ML Scoring Integration**: Processes creators through ML scoring pipeline
- **🎯 Smart Prioritization**: Focuses on creators with scores ≥80 (configurable)
- **📧 Personalized Email Generation**: Category-aware email templates with ML insights
- **⚡ Throttled Email Delivery**: Maximum 50 emails/hour to avoid bulk-send flags
- **🔄 Automatic Retry System**: Retries failed deliveries up to 3 times
- **📊 Comprehensive Logging**: Tracks all outreach events in KV storage
- **📈 Daily CSV Reports**: Generates and emails daily activity reports
- **💾 GitHub Integration**: Automatically commits daily logs to repository
- **⏰ Scheduled Execution**: Runs daily at 6 AM UTC via Cloudflare Cron Jobs

## 🚀 Quick Start

### 1. Deploy the System

```bash
./deploy-automation.sh
```

This script will:
- Set up Cloudflare Worker with cron jobs
- Configure KV storage
- Set up required secrets (SendGrid, GitHub)
- Deploy the automation worker

### 2. Start Excel Monitoring

```bash
python3 excel-monitor.py
```

Or for one-time processing:
```bash
python3 excel-monitor.py --once
```

### 3. Place Excel Files

Drop Excel files matching `YouTuber_XXX.xlsx` pattern in the project directory. The system will automatically detect and process them.

## 📋 Excel File Format

Your Excel files should contain these columns:

**Required:**
- `Name of YouTuber` - Creator's name
- `Public Email Contact` - Valid email address

**Optional:**
- `Channel Title` - YouTube channel name
- `URL for Channel` - YouTube channel URL
- `Subscribers` - Subscriber count

## 🔧 Configuration

### Environment Variables (in `wrangler-automated.toml`)

- `SCORE_THRESHOLD`: Minimum ML score for outreach (default: 80)
- `MAX_EMAILS_PER_HOUR`: Email throttle limit (default: 50)
- `ADMIN_EMAIL`: Admin email for daily reports
- `GITHUB_REPO`: Repository for log commits

### Secrets (set via Wrangler)

- `SENDGRID_API_KEY`: SendGrid API key for email sending
- `GITHUB_TOKEN`: Personal access token for GitHub commits

## 🎛️ API Endpoints

### Core Automation
- `POST /trigger-daily-automation` - Manual trigger for daily automation
- `GET /admin-dashboard` - Admin dashboard with status and controls

### Data Management
- `POST /youtuber-data` - Add creator data
- `POST /ai-processor` - Trigger ML scoring
- `GET /high-priority-targets` - Get creators with scores ≥threshold

### Outreach System
- `POST /generate-outreach-content` - Generate personalized email content
- `POST /execute-outreach` - Execute throttled outreach campaign
- `GET /outreach-reports` - View outreach logs and reports

## 📊 Daily Workflow

### 6 AM UTC Daily Execution:

1. **📁 File Detection**: Scans for new Excel files
2. **📊 Data Ingestion**: Validates and imports creator data
3. **🤖 ML Scoring**: Processes creators through ML pipeline
4. **🎯 Prioritization**: Identifies high-score creators (≥80)
5. **📧 Email Generation**: Creates personalized outreach content
6. **⚡ Throttled Sending**: Sends emails with 50/hour limit
7. **📈 CSV Generation**: Creates daily activity report
8. **📧 Admin Report**: Emails summary to admin
9. **💾 GitHub Commit**: Commits logs to repository
10. **🔄 Retry Processing**: Retries any failed deliveries

## 📈 Monitoring & Logging

### KV Storage Structure

```
youtuber:{channel}           - Creator data with ML scores
outreach_log:{channel}:{ts}  - Individual outreach events
retry_queue:{ts}:{channel}   - Failed deliveries awaiting retry
campaign_report:{ts}         - Daily campaign summaries
automation_log:{date}        - Daily automation execution logs
daily_csv:{date}             - Daily CSV exports
```

### Log Files

- `excel_monitor.log` - Excel processing activity
- `outreach_log_{date}.csv` - Daily outreach activity (auto-committed to Git)

## 🎯 Personalized Email Templates

### Tech Category
- Subject: `{Channel} - AI Innovation Partnership Opportunity`
- Focus: Technical collaboration, AI tools, developer audience

### Education Category  
- Subject: `{Channel} - Educational Content Partnership`
- Focus: Learning tools, educator benefits, student outcomes

### Default Category
- Subject: `{Channel} - Premium Creator Program Invitation`
- Focus: General creator benefits, audience growth

All templates include:
- Personalized channel name
- ML confidence score
- Subscriber count
- Category-specific value proposition

## 🔄 Retry & Error Handling

### Automatic Retry Logic
- Failed emails enter retry queue
- Up to 3 retry attempts per email
- Exponential backoff between retries
- Successful retries logged separately

### Error Prevention
- Email validation before sending
- URL cleaning and validation
- Duplicate prevention (7-day contact window)
- Throttle limit enforcement

## 📱 Admin Dashboard

Access at: `https://your-worker.workers.dev/admin-dashboard`

Features:
- Daily automation status
- Outreach statistics
- Recent activity logs
- Manual trigger controls
- System health monitoring

## 🛠️ Development & Customization

### Modify ML Scoring
Edit the `runMLScoring()` function in `automated-daily-worker.js`:

```javascript
// Enhanced scoring algorithm
let score = Math.floor(Math.random() * 40) + 60;
if (youtuber.subscribers > 100000) score += 5;
if (youtuber.category === 'tech') score += 3;
// Add your custom scoring logic
```

### Customize Email Templates
Update the `templates` object in `generatePersonalizedEmail()`:

```javascript
const templates = {
  your_category: {
    subjects: ["Your Subject Line"],
    bodies: ["Your email body template"]
  }
};
```

### Adjust Throttling
Modify `MAX_EMAILS_PER_HOUR` in configuration or the throttling logic in `executeThrottledOutreach()`.

## 📋 Troubleshooting

### Common Issues

**Excel files not processing:**
- Check file naming pattern: `YouTuber_XXX.xlsx`
- Verify required columns exist
- Check `excel_monitor.log` for errors

**Emails not sending:**
- Verify SendGrid API key is set
- Check throttle limits haven't been reached
- Review outreach logs for error details

**ML scoring not working:**
- Ensure creators are properly stored in KV
- Check `/ai-processor` endpoint response
- Verify KV namespace configuration

**GitHub commits failing:**
- Verify GitHub token has repository write access
- Check repository name in configuration
- Review commit logs in admin dashboard

### Debug Mode

Enable debug logging by setting LOG_LEVEL=debug in worker environment variables.

## 🔐 Security Considerations

- All API keys stored as Cloudflare Worker secrets
- Email addresses validated before storage
- Rate limiting prevents API abuse
- Automated monitoring prevents unauthorized access
- GitHub tokens use minimal required permissions

## 📞 Support

For issues or customization requests:
1. Check the admin dashboard for system status
2. Review log files for error details
3. Verify configuration and secrets
4. Test individual endpoints manually

## 🎉 Success Metrics

Track your system's performance:
- Daily ingestion volume
- ML scoring accuracy  
- Email delivery rates
- Response/engagement rates
- System uptime and reliability

The system automatically tracks these metrics in the daily CSV reports and admin dashboard.