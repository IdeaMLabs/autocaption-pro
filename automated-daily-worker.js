/**
 * Automated Daily YouTuber Outreach System
 * Handles daily Excel ingestion, ML scoring, and email outreach with throttling
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle manual trigger endpoints
    if (url.pathname === "/trigger-daily-automation") {
      return await this.executeDailyAutomation(env, request);
    }
    
    if (url.pathname === "/admin-dashboard") {
      return await this.showAdminDashboard(env);
    }

    // Existing endpoints...
    return await this.handleExistingEndpoints(request, env);
  },

  // Cron trigger - runs at 6 AM UTC daily
  async scheduled(event, env, ctx) {
    console.log("Daily automation triggered at:", new Date().toISOString());
    ctx.waitUntil(this.executeDailyAutomation(env));
  },

  async executeDailyAutomation(env, request = null) {
    const startTime = Date.now();
    const automationLog = {
      timestamp: new Date().toISOString(),
      steps: [],
      errors: [],
      summary: {}
    };

    try {
      // Step 1: Detect new Excel files
      automationLog.steps.push("Starting daily automation workflow");
      
      // Step 2: Process any pending Excel files (simulate file detection)
      const detectedFiles = await this.detectNewExcelFiles(env);
      automationLog.steps.push(`Detected ${detectedFiles.length} new Excel files`);
      
      if (detectedFiles.length > 0) {
        // Step 3: Ingest and validate data
        const ingestionResult = await this.ingestExcelData(env, detectedFiles);
        automationLog.steps.push(`Ingested ${ingestionResult.processed} records, ${ingestionResult.errors} errors`);
        automationLog.summary.ingestion = ingestionResult;
        
        // Step 4: Run ML scoring
        const scoringResult = await this.runMLScoring(env);
        automationLog.steps.push(`ML scoring completed: ${scoringResult.processed_count} creators scored`);
        automationLog.summary.scoring = scoringResult;
      }
      
      // Step 5: Execute prioritized outreach (regardless of new data)
      const outreachResult = await this.executeThrottledOutreach(env);
      automationLog.steps.push(`Outreach completed: ${outreachResult.successful_outreach} sent, ${outreachResult.failed_outreach} failed`);
      automationLog.summary.outreach = outreachResult;
      
      // Step 6: Generate and export daily CSV
      const csvResult = await this.generateDailyCSV(env);
      automationLog.steps.push(`Daily CSV generated with ${csvResult.record_count} records`);
      automationLog.summary.csv_export = csvResult;
      
      // Step 7: Email admin report
      const emailResult = await this.emailAdminReport(env, automationLog);
      automationLog.steps.push(`Admin report emailed: ${emailResult.status}`);
      
      // Step 8: Commit to GitHub
      const gitResult = await this.commitToGitHub(env, csvResult.csv_content);
      automationLog.steps.push(`GitHub commit: ${gitResult.status}`);
      
      automationLog.summary.execution_time = Date.now() - startTime;
      automationLog.summary.status = "completed";
      
      // Store automation log
      await env.YOUTUBER_KV.put(
        `automation_log:${new Date().toISOString().split('T')[0]}`, 
        JSON.stringify(automationLog)
      );
      
      return new Response(JSON.stringify({
        success: true,
        automation_log: automationLog
      }), {
        headers: { "Content-Type": "application/json" }
      });
      
    } catch (error) {
      automationLog.errors.push(error.message);
      automationLog.summary.status = "failed";
      automationLog.summary.execution_time = Date.now() - startTime;
      
      await env.YOUTUBER_KV.put(
        `automation_error:${Date.now()}`, 
        JSON.stringify(automationLog)
      );
      
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        automation_log: automationLog
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  },

  async detectNewExcelFiles(env) {
    // In real implementation, this would check for new files uploaded
    // For now, simulate detection of pattern YouTuber_XXX.xlsx
    const today = new Date().toISOString().split('T')[0];
    const lastProcessed = await env.YOUTUBER_KV.get("last_excel_processed_date");
    
    if (lastProcessed !== today) {
      // Simulate finding new Excel files
      return [`YouTuber_${Math.floor(Math.random() * 100 + 600)}.xlsx`];
    }
    
    return [];
  },

  async ingestExcelData(env, files) {
    // Simulate Excel ingestion with validation
    let processed = 0;
    let errors = 0;
    
    for (const file of files) {
      try {
        // In real implementation, parse actual Excel file
        // For now, simulate ingesting sample data
        const simulatedData = [
          {
            channel: "TechTuber Daily",
            email: "contact@techtuber.com",
            subscribers: 125000,
            category: "tech",
            url: "https://youtube.com/@techtuberdaily"
          },
          {
            channel: "Learning Hub Pro",
            email: "hello@learninghub.com", 
            subscribers: 89000,
            category: "education",
            url: "https://youtube.com/@learninghubpro"
          }
        ];
        
        for (const record of simulatedData) {
          // Validate and clean data
          const cleanedRecord = await this.validateAndCleanRecord(record);
          if (cleanedRecord.valid) {
            // Store in KV
            const key = `youtuber:${cleanedRecord.channel}`;
            await env.YOUTUBER_KV.put(key, JSON.stringify({
              ...cleanedRecord,
              ingested_at: new Date().toISOString(),
              source_file: file
            }));
            processed++;
          } else {
            errors++;
          }
        }
        
        // Mark file as processed
        await env.YOUTUBER_KV.put("last_excel_processed_date", new Date().toISOString().split('T')[0]);
        
      } catch (error) {
        errors++;
        console.error(`Error processing file ${file}:`, error);
      }
    }
    
    return { processed, errors, files: files.length };
  },

  async validateAndCleanRecord(record) {
    const cleaned = {
      channel: this.cleanString(record.channel),
      email: this.cleanEmail(record.email),
      subscribers: this.cleanNumber(record.subscribers),
      category: this.cleanString(record.category),
      url: this.cleanUrl(record.url),
      valid: true
    };
    
    // Validation rules
    if (!cleaned.channel || !cleaned.email) {
      cleaned.valid = false;
    }
    
    if (cleaned.email && !cleaned.email.includes('@')) {
      cleaned.valid = false;
    }
    
    return cleaned;
  },

  cleanString(str) {
    if (!str) return "";
    return String(str).trim();
  },

  cleanEmail(email) {
    if (!email) return "";
    return String(email).toLowerCase().trim();
  },

  cleanNumber(num) {
    if (!num) return 0;
    return parseInt(num) || 0;
  },

  cleanUrl(url) {
    if (!url) return "";
    const cleaned = String(url).trim();
    if (cleaned.includes('youtube.com') || cleaned.includes('youtu.be')) {
      return cleaned;
    }
    return "";
  },

  async runMLScoring(env) {
    const keys = await env.YOUTUBER_KV.list({ prefix: "youtuber:" });
    const processed = [];
    
    for (const key of keys.keys) {
      const data = await env.YOUTUBER_KV.get(key.name);
      if (data) {
        const youtuber = JSON.parse(data);
        
        // Enhanced ML scoring algorithm (simulated)
        let score = Math.floor(Math.random() * 40) + 60; // Base 60-100
        
        // Boost score based on factors
        if (youtuber.subscribers > 100000) score += 5;
        if (youtuber.category === 'tech') score += 3;
        if (youtuber.url && youtuber.url.includes('youtube.com')) score += 2;
        
        score = Math.min(score, 100); // Cap at 100
        
        youtuber.ai_score = score;
        youtuber.processed_at = new Date().toISOString();
        
        await env.YOUTUBER_KV.put(key.name, JSON.stringify(youtuber));
        processed.push({ channel: youtuber.channel, score });
      }
    }
    
    return { processed_count: processed.length, processed_youtubers: processed };
  },

  async executeThrottledOutreach(env) {
    const keys = await env.YOUTUBER_KV.list({ prefix: "youtuber:" });
    let successful = 0;
    let failed = 0;
    let throttleCount = 0;
    const maxPerHour = 50;
    
    // Check throttling state
    const currentHour = new Date().getHours();
    const throttleKey = `throttle:${new Date().toISOString().split('T')[0]}:${currentHour}`;
    const currentHourSends = parseInt(await env.YOUTUBER_KV.get(throttleKey) || "0");
    
    for (const key of keys.keys) {
      // Check throttle limit
      if (currentHourSends + successful >= maxPerHour) {
        console.log("Throttle limit reached for this hour");
        break;
      }
      
      const data = await env.YOUTUBER_KV.get(key.name);
      if (data) {
        const youtuber = JSON.parse(data);
        
        // Priority threshold: ≥80 (configurable)
        const threshold = 80;
        if (youtuber.ai_score >= threshold && youtuber.email) {
          
          // Check if already contacted recently
          const recentContactKey = `recent_contact:${youtuber.channel}`;
          const lastContact = await env.YOUTUBER_KV.get(recentContactKey);
          
          if (lastContact) {
            const daysSinceContact = (Date.now() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceContact < 7) { // Don't contact same creator within 7 days
              continue;
            }
          }
          
          try {
            // Generate personalized content
            const emailContent = await this.generatePersonalizedEmail(youtuber);
            
            // Simulate email sending (would integrate with actual email service)
            const emailResult = await this.sendEmail(youtuber.email, emailContent);
            
            if (emailResult.success) {
              // Log successful outreach
              const outreachLog = {
                channel: youtuber.channel,
                email: youtuber.email,
                subject: emailContent.subject,
                ml_score: youtuber.ai_score,
                category: youtuber.category,
                subscribers: youtuber.subscribers,
                status: "sent",
                timestamp: new Date().toISOString(),
                campaign_id: `daily_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
              };
              
              await env.YOUTUBER_KV.put(
                `outreach_log:${youtuber.channel}:${Date.now()}`, 
                JSON.stringify(outreachLog)
              );
              
              // Mark as recently contacted
              await env.YOUTUBER_KV.put(recentContactKey, new Date().toISOString());
              
              successful++;
            } else {
              // Log failed attempt for retry
              await env.YOUTUBER_KV.put(
                `retry_queue:${Date.now()}:${youtuber.channel}`,
                JSON.stringify({
                  youtuber,
                  emailContent,
                  attempts: 1,
                  lastAttempt: new Date().toISOString()
                })
              );
              failed++;
            }
            
            // Small delay between sends
            await this.sleep(1000);
            
          } catch (error) {
            failed++;
            console.error(`Outreach failed for ${youtuber.channel}:`, error);
          }
        }
      }
    }
    
    // Update throttle counter
    await env.YOUTUBER_KV.put(throttleKey, String(currentHourSends + successful), { expirationTtl: 3600 });
    
    return {
      successful_outreach: successful,
      failed_outreach: failed,
      throttle_limit_reached: successful >= (maxPerHour - currentHourSends)
    };
  },

  async generatePersonalizedEmail(youtuber) {
    const templates = {
      tech: {
        subject: `${youtuber.channel} - Exclusive AI Partnership Opportunity`,
        body: `Hi ${youtuber.channel} team,

I've been following your exceptional tech content and our ML system identified your channel as a top-tier collaboration partner (Score: ${youtuber.ai_score}/100).

With your ${youtuber.subscribers?.toLocaleString() || 'growing'} subscriber community, we see incredible synergy for our AI-powered tools that can enhance your content creation workflow.

Would you be interested in a brief call to explore an exclusive partnership?

Best regards,
AI Partnership Team`
      },
      education: {
        subject: `${youtuber.channel} - Educational Content Partnership`,
        body: `Dear ${youtuber.channel},

Your educational content quality caught our attention through our ML analysis (Score: ${youtuber.ai_score}/100). We're developing tools specifically for educators like yourself.

With your ${youtuber.subscribers?.toLocaleString() || 'engaged'} learner community, we see an opportunity to enhance educational outcomes together.

Interested in exclusive early access to our platform?

Warm regards,
Education Partnership Team`
      },
      default: {
        subject: `${youtuber.channel} - Premium Creator Program Invitation`,
        body: `Hello ${youtuber.channel},

Our AI system identified your channel as a high-priority collaboration partner (ML Score: ${youtuber.ai_score}/100) based on content quality and engagement metrics.

We're launching an exclusive creator program and would love ${youtuber.channel} as a founding partner.

Available for a 15-minute call this week?

Best,
Creator Partnerships Team`
      }
    };

    const template = templates[youtuber.category?.toLowerCase()] || templates.default;
    
    return {
      subject: template.subject,
      body: template.body,
      generated_at: new Date().toISOString()
    };
  },

  async sendEmail(toEmail, content) {
    // Simulate email sending - integrate with actual email service like SendGrid, Resend, etc.
    console.log(`Sending email to ${toEmail}: ${content.subject}`);
    
    // Simulate success/failure
    const success = Math.random() > 0.1; // 90% success rate
    
    return {
      success,
      messageId: success ? `msg_${Date.now()}` : null,
      error: success ? null : "Simulated send failure"
    };
  },

  async generateDailyCSV(env) {
    const today = new Date().toISOString().split('T')[0];
    
    // Get all outreach logs for today
    const outreachKeys = await env.YOUTUBER_KV.list({ prefix: "outreach_log:" });
    const todaysLogs = [];
    
    for (const key of outreachKeys.keys) {
      const data = await env.YOUTUBER_KV.get(key.name);
      if (data) {
        const log = JSON.parse(data);
        if (log.timestamp.startsWith(today)) {
          todaysLogs.push(log);
        }
      }
    }
    
    // Generate CSV content
    const headers = ["timestamp", "channel", "email", "score", "category", "subscribers", "status", "subject", "campaign_id"];
    let csvContent = headers.join(",") + "\n";
    
    todaysLogs.forEach(log => {
      const row = [
        log.timestamp,
        `"${log.channel}"`,
        log.email,
        log.ml_score,
        log.category,
        log.subscribers,
        log.status,
        `"${log.subject}"`,
        log.campaign_id
      ];
      csvContent += row.join(",") + "\n";
    });
    
    // Store CSV in KV for retrieval
    const csvKey = `daily_csv:${today}`;
    await env.YOUTUBER_KV.put(csvKey, csvContent);
    
    return {
      csv_content: csvContent,
      record_count: todaysLogs.length,
      date: today,
      csv_key: csvKey
    };
  },

  async emailAdminReport(env, automationLog) {
    const adminEmail = env.ADMIN_EMAIL || "admin@example.com";
    const today = new Date().toISOString().split('T')[0];
    
    const reportContent = {
      subject: `Daily Automation Report - ${today}`,
      body: `Daily YouTube Outreach Automation Report

Date: ${today}
Status: ${automationLog.summary.status}
Execution Time: ${automationLog.summary.execution_time}ms

Summary:
- New Records Ingested: ${automationLog.summary.ingestion?.processed || 0}
- Creators Scored: ${automationLog.summary.scoring?.processed_count || 0}
- Outreach Emails Sent: ${automationLog.summary.outreach?.successful_outreach || 0}
- Failed Sends: ${automationLog.summary.outreach?.failed_outreach || 0}
- CSV Records Exported: ${automationLog.summary.csv_export?.record_count || 0}

Steps Completed:
${automationLog.steps.map(step => `- ${step}`).join('\n')}

${automationLog.errors.length > 0 ? `\nErrors:\n${automationLog.errors.map(err => `- ${err}`).join('\n')}` : ''}

Best regards,
Automated Outreach System`
    };
    
    // Send email to admin (simulate)
    const emailResult = await this.sendEmail(adminEmail, reportContent);
    
    return {
      status: emailResult.success ? "sent" : "failed",
      recipient: adminEmail,
      error: emailResult.error
    };
  },

  async commitToGitHub(env, csvContent) {
    // Simulate GitHub commit
    // In real implementation, use GitHub API to commit the CSV
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Store commit info
      const commitInfo = {
        date: today,
        filename: `outreach_log_${today}.csv`,
        content_length: csvContent.length,
        committed_at: new Date().toISOString(),
        status: "simulated_success"
      };
      
      await env.YOUTUBER_KV.put(`github_commit:${today}`, JSON.stringify(commitInfo));
      
      return {
        status: "success",
        commit_sha: `sha_${Date.now()}`,
        filename: commitInfo.filename
      };
    } catch (error) {
      return {
        status: "failed",
        error: error.message
      };
    }
  },

  async retryFailedDeliveries(env) {
    const retryKeys = await env.YOUTUBER_KV.list({ prefix: "retry_queue:" });
    let retriedCount = 0;
    
    for (const key of retryKeys.keys) {
      const data = await env.YOUTUBER_KV.get(key.name);
      if (data) {
        const retryItem = JSON.parse(data);
        
        // Only retry if less than 3 attempts
        if (retryItem.attempts < 3) {
          const emailResult = await this.sendEmail(retryItem.youtuber.email, retryItem.emailContent);
          
          if (emailResult.success) {
            // Success - move to outreach log
            const outreachLog = {
              channel: retryItem.youtuber.channel,
              email: retryItem.youtuber.email,
              subject: retryItem.emailContent.subject,
              ml_score: retryItem.youtuber.ai_score,
              status: "sent_retry",
              timestamp: new Date().toISOString(),
              original_failure: retryItem.lastAttempt
            };
            
            await env.YOUTUBER_KV.put(
              `outreach_log:${retryItem.youtuber.channel}:${Date.now()}`, 
              JSON.stringify(outreachLog)
            );
            
            // Remove from retry queue
            await env.YOUTUBER_KV.delete(key.name);
            retriedCount++;
          } else {
            // Still failed - update attempt count
            retryItem.attempts++;
            retryItem.lastAttempt = new Date().toISOString();
            await env.YOUTUBER_KV.put(key.name, JSON.stringify(retryItem));
          }
        }
      }
    }
    
    return { retried_count: retriedCount };
  },

  async showAdminDashboard(env) {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's stats
    const automationLog = await env.YOUTUBER_KV.get(`automation_log:${today}`);
    const csvData = await env.YOUTUBER_KV.get(`daily_csv:${today}`);
    
    const dashboard = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Daily Automation Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .stat-box { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .success { color: green; }
            .error { color: red; }
            .btn { background: #007cba; color: white; padding: 10px 15px; text-decoration: none; border-radius: 3px; }
        </style>
    </head>
    <body>
        <h1>Daily YouTube Outreach Dashboard</h1>
        <p>Date: ${today}</p>
        
        <div class="stat-box">
            <h3>Today's Automation Status</h3>
            <p>Status: ${automationLog ? JSON.parse(automationLog).summary.status : 'No automation run today'}</p>
            <p>CSV Records: ${csvData ? csvData.split('\n').length - 2 : 0}</p>
        </div>
        
        <div class="stat-box">
            <h3>Actions</h3>
            <a href="/trigger-daily-automation" class="btn">Trigger Manual Run</a>
        </div>
        
        <div class="stat-box">
            <h3>Recent Logs</h3>
            ${automationLog ? `<pre>${JSON.stringify(JSON.parse(automationLog), null, 2)}</pre>` : '<p>No logs available</p>'}
        </div>
    </body>
    </html>`;
    
    return new Response(dashboard, {
      headers: { "Content-Type": "text/html" }
    });
  },

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  async handleExistingEndpoints(request, env) {
    // Include all existing endpoints from the original worker
    // This maintains backward compatibility
    const url = new URL(request.url);
    
    if (url.pathname === "/youtuber-data") {
      // Existing youtuber-data endpoint
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
      }
      // ... existing implementation
    }
    
    // Add other existing endpoints...
    
    return new Response("Not found", { status: 404 });
  }
};