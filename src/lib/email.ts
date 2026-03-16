/**
 * Email utility for sending notifications
 * 
 * Configure these environment variables:
 * - EMAIL_HOST: SMTP server host (e.g., smtp.gmail.com)
 * - EMAIL_PORT: SMTP server port (e.g., 587)
 * - EMAIL_USER: SMTP username/email
 * - EMAIL_PASS: SMTP password or app password
 * Optional (fallback/compat):
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 * - SMTP_FROM, SMTP_FROM_NAME
 */

interface LeadNotificationData {
  to: string;
  cardOwnerName: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  leadCompany?: string;
  leadMessage?: string;
  cardSlug: string;
}

interface CustomerLeadNotificationData {
  to: string;
  customerName: string;
  customerSlug: string;
  visitorName: string;
  visitorPhone: string;
  visitorMessage: string;
  visitorEmail?: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Check if email is configured
function isEmailConfigured(): boolean {
  return !!(
    (process.env.EMAIL_HOST || process.env.SMTP_HOST) &&
    (process.env.EMAIL_USER || process.env.SMTP_USER) &&
    (process.env.EMAIL_PASS || process.env.SMTP_PASS)
  );
}

/**
 * Send an email using SMTP
 * Uses dynamic import to avoid issues when nodemailer isn't installed
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.log("Email not configured. Skipping email send.");
    console.log("To enable emails, set EMAIL_HOST, EMAIL_USER, EMAIL_PASS in .env");
    return false;
  }

  try {
    // Dynamic import of nodemailer
    const nodemailer = await import("nodemailer");

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || process.env.SMTP_HOST,
      port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true" || process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER || process.env.SMTP_USER,
        pass: process.env.EMAIL_PASS || process.env.SMTP_PASS,
      },
    });

    const fromName = process.env.SMTP_FROM_NAME || "Tapvyo";
    const fromEmail = process.env.SMTP_FROM || process.env.EMAIL_USER || process.env.SMTP_USER;

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

/**
 * Send lead notification email to card owner
 */
export async function sendLeadNotificationEmail(
  data: LeadNotificationData
): Promise<boolean> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tapvyo.com";
  const cardUrl = `${siteUrl}/card/${data.cardSlug}`;

  const subject = `New Contact from Your Digital Card - ${data.leadName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Lead</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                New Contact Lead! 🎉
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi ${data.cardOwnerName},
              </p>
              <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                Someone just contacted you through your digital business card!
              </p>
              
              <!-- Lead Details -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Name</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 500;">${data.leadName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Email</span><br>
                          <a href="mailto:${data.leadEmail}" style="color: #06b6d4; font-size: 16px; font-weight: 500; text-decoration: none;">${data.leadEmail}</a>
                        </td>
                      </tr>
                      ${data.leadPhone ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Phone</span><br>
                          <a href="tel:${data.leadPhone}" style="color: #06b6d4; font-size: 16px; font-weight: 500; text-decoration: none;">${data.leadPhone}</a>
                        </td>
                      </tr>
                      ` : ""}
                      ${data.leadCompany ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Company</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 500;">${data.leadCompany}</span>
                        </td>
                      </tr>
                      ` : ""}
                      ${data.leadMessage ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Message</span><br>
                          <p style="margin: 8px 0 0; color: #374151; font-size: 14px; line-height: 1.6; background-color: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">${data.leadMessage.replace(/\n/g, "<br>")}</p>
                        </td>
                      </tr>
                      ` : ""}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="mailto:${data.leadEmail}?subject=Re: Your inquiry from my digital card" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Reply to ${data.leadName}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                This lead was captured from your digital card
              </p>
              <p style="margin: 0 0 8px; color: #9ca3af; font-size: 12px;">
                Received: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
              <a href="${cardUrl}" style="color: #06b6d4; font-size: 14px; text-decoration: none;">
                View your card →
              </a>
            </td>
          </tr>
        </table>
        
        <!-- Branding -->
        <p style="margin: 24px 0 0; text-align: center; color: #9ca3af; font-size: 12px;">
          Powered by <a href="${siteUrl}" style="color: #06b6d4; text-decoration: none;">Tapvyo</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
New Contact Lead!

Hi ${data.cardOwnerName},

Someone just contacted you through your digital business card!

Contact Details:
- Name: ${data.leadName}
- Email: ${data.leadEmail}
${data.leadPhone ? `- Phone: ${data.leadPhone}` : ""}
${data.leadCompany ? `- Company: ${data.leadCompany}` : ""}
${data.leadMessage ? `\nMessage:\n${data.leadMessage}` : ""}

Reply to them by emailing: ${data.leadEmail}

---
This lead was captured from your digital card: ${cardUrl}
Powered by Tapvyo
`;

  return sendEmail({
    to: data.to,
    subject,
    html,
    text,
  });
}

export async function sendCustomerLeadNotificationEmail(
  data: CustomerLeadNotificationData
): Promise<boolean> {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const profileUrl = `${siteUrl}/card/${data.customerSlug}`;
  const subject = `New NFC Profile Message from ${data.visitorName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New NFC Profile Message</title>
</head>
<body style="margin:0;padding:0;background:#f6f2ea;font-family:Segoe UI,Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:640px;margin:0 auto;padding:32px 16px;">
    <tr>
      <td style="background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #eadfce;">
        <div style="background:linear-gradient(135deg,#dc6b2f 0%,#f2a24c 100%);padding:28px 32px;color:#ffffff;">
          <h1 style="margin:0;font-size:26px;font-weight:700;">New visitor message</h1>
          <p style="margin:8px 0 0;font-size:14px;opacity:0.92;">Your NFC profile just received a new enquiry.</p>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 20px;color:#382d21;font-size:16px;line-height:1.6;">Hi ${data.customerName},</p>
          <p style="margin:0 0 24px;color:#5a4938;font-size:15px;line-height:1.6;">A visitor submitted the contact form on your NFC digital profile.</p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#fbf7f0;border:1px solid #eadfce;border-radius:14px;">
            <tr><td style="padding:20px;">
              <p style="margin:0 0 10px;color:#8a725c;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Visitor Name</p>
              <p style="margin:0 0 18px;color:#221b14;font-size:18px;font-weight:600;">${data.visitorName}</p>
              <p style="margin:0 0 10px;color:#8a725c;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Phone</p>
              <p style="margin:0 0 18px;color:#221b14;font-size:16px;font-weight:600;">${data.visitorPhone}</p>
              ${data.visitorEmail ? `<p style="margin:0 0 10px;color:#8a725c;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Email</p><p style="margin:0 0 18px;color:#221b14;font-size:16px;font-weight:600;">${data.visitorEmail}</p>` : ""}
              <p style="margin:0 0 10px;color:#8a725c;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Message</p>
              <p style="margin:0;color:#3a2f24;font-size:15px;line-height:1.7;white-space:pre-line;">${data.visitorMessage}</p>
            </td></tr>
          </table>
          <p style="margin:24px 0 0;">
            <a href="${profileUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#221b14;color:#ffffff;text-decoration:none;font-weight:600;">Open NFC profile</a>
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `New visitor message\n\nHi ${data.customerName},\n\nA visitor submitted the contact form on your NFC profile.\n\nVisitor Name: ${data.visitorName}\nPhone: ${data.visitorPhone}${data.visitorEmail ? `\nEmail: ${data.visitorEmail}` : ""}\nMessage: ${data.visitorMessage}\n\nProfile: ${profileUrl}`;

  return sendEmail({
    to: data.to,
    subject,
    html,
    text,
  });
}

/**
 * Newsletter email types and functions
 */

interface NewsletterEmailData {
  subject: string;
  content: string;
  previewText?: string;
  newsletterId: string;
}

interface BulkEmailResult {
  total: number;
  sent: number;
  failed: number;
  errors: string[];
}

/**
 * Send newsletter to a single subscriber
 */
export async function sendNewsletterEmail(
  to: string,
  data: NewsletterEmailData
): Promise<boolean> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tapvyo.com";
  const unsubscribeUrl = `${siteUrl}/api/newsletter/subscribe?email=${encodeURIComponent(to)}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  ${data.previewText ? `<!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]--><span style="display:none!important;visibility:hidden;mso-hide:all;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${data.previewText}</span>` : ""}
  <title>${data.subject}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; }
    img { max-width: 100%; height: auto; }
    a { color: #06b6d4; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td style="padding: 40px 20px 20px;">
        <!-- Header -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border-radius: 12px 12px 0 0; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                Tapvyo
              </h1>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 20px;">
        <!-- Content -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">
          <tr>
            <td style="padding: 40px;">
              ${data.content}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 20px 40px;">
        <!-- Footer -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border-radius: 0 0 12px 12px;">
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px;">
                You received this email because you subscribed to Tapvyo newsletter.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
                &nbsp;|&nbsp;
                <a href="${siteUrl}" style="color: #6b7280; text-decoration: underline;">Visit Website</a>
              </p>
              <p style="margin: 16px 0 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Tapvyo. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  // Create plain text version by stripping HTML
  const text = `${data.subject}\n\n${data.content.replace(/<[^>]*>/g, "")}\n\n---\nYou received this email because you subscribed to Tapvyo newsletter.\nUnsubscribe: ${unsubscribeUrl}`;

  return sendEmail({
    to,
    subject: data.subject,
    html,
    text,
  });
}

/**
 * Send newsletter to all active subscribers (bulk send)
 * Uses batching to avoid overwhelming the SMTP server
 */
export async function sendBulkNewsletter(
  data: NewsletterEmailData,
  subscribers: { email: string }[],
  batchSize: number = 10,
  delayBetweenBatches: number = 1000
): Promise<BulkEmailResult> {
  const result: BulkEmailResult = {
    total: subscribers.length,
    sent: 0,
    failed: 0,
    errors: [],
  };

  if (!isEmailConfigured()) {
    result.errors.push("Email not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env");
    return result;
  }

  // Process in batches
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (subscriber) => {
      try {
        const success = await sendNewsletterEmail(subscriber.email, data);
        if (success) {
          result.sent++;
        } else {
          result.failed++;
          result.errors.push(`Failed to send to ${subscriber.email}`);
        }
      } catch (error) {
        result.failed++;
        result.errors.push(`Error sending to ${subscriber.email}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    });

    await Promise.all(batchPromises);

    // Delay between batches to avoid rate limiting
    if (i + batchSize < subscribers.length) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return result;
}

/**
 * Check if email is configured (exported for use in other modules)
 */
export { isEmailConfigured };
