// send_email.js
const nodemailer = require('nodemailer');

async function sendEmail({ to, subject, text, attachments = [] }) {
  const host = process.env.SMTP_HOST || 'localhost';
  const port = Number(process.env.SMTP_PORT || 1025);
  const secure = String(process.env.SMTP_SECURE || 'false') === 'true';
  const user = process.env.SMTP_USER || undefined;
  const pass = process.env.SMTP_PASS || undefined;
  const from = process.env.FROM_EMAIL || 'AutoCaption Pro <noreply@autocaptionpro.com>';
  const toOverride = process.env.TO_OVERRIDE;

  // If credentials provided, use auth; else try no-auth (MailHog/maildev)
  const transportConfig = { host, port, secure };
  if (user && pass) transportConfig.auth = { user, pass };
  const transporter = nodemailer.createTransport(transportConfig);

  const mail = {
    from,
    to: toOverride || to,
    subject,
    text,
    attachments
  };

  const info = await transporter.sendMail(mail);
  console.log(`📧 Email sent: ${info.messageId} → ${mail.to}`);
  return info;
}

module.exports = sendEmail;
