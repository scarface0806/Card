import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/auth-middleware';
import { AuthUser } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

import { z } from 'zod';
import { withRateLimit } from '@/lib/rate-limit';
import { errorResponse, successResponse } from '@/lib/responses';

const newsletterSchema = z.object({
  subject: z.string().min(1),
  content: z.string().min(1),
  previewText: z.string().optional(),
});

// Generate slug from subject
function generateSlug(subject: string): string {
  const baseSlug = subject
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  const timestamp = Date.now();
  return `${baseSlug}-${timestamp}`;
}

// Background email sending function (non-blocking)
async function sendNewsletterEmails(
  newsletterId: string,
  subject: string,
  content: string,
  subscribers: Array<{ email: string; name: string | null }>
) {
  let sentCount = 0;
  let failedCount = 0;

  for (const subscriber of subscribers) {
    try {
      const emailHtml = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 32px 40px; background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);">
                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; text-align: center;">
                          ${subject}
                        </h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        ${content}
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; text-align: center;">
                        <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px;">
                          You're receiving this email because you subscribed to our newsletter.
                        </p>
                        <p style="margin: 0; font-size: 12px;">
                          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/newsletter/subscribe?email=${encodeURIComponent(subscriber.email)}" style="color: #06b6d4; text-decoration: none;">
                            Unsubscribe
                          </a>
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

      const plainText = content.replace(/<[^>]*>/g, '');

      const sent = await sendEmail({
        to: subscriber.email,
        subject,
        html: emailHtml,
        text: plainText,
      });

      if (sent) {
        sentCount++;
      } else {
        failedCount++;
      }
    } catch (error) {
      failedCount++;
      console.error(`Failed to send to ${subscriber.email}:`, error);
    }
  }

  // Update newsletter record with final stats
  try {
    await prisma.newsletter.update({
      where: { id: newsletterId },
      data: {
        isSent: true,
        sentAt: new Date(),
        sentCount,
      },
    });
    // Newsletter send complete — sentCount/failedCount tracked in DB
  } catch (error) {
    console.error(`Failed to update newsletter ${newsletterId}:`, error);
  }
}

// POST /api/admin/newsletters/send - Send newsletter (non-blocking)
async function handler(request: NextRequest, user: AuthUser) {
  try {
    const parsed = newsletterSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(parsed.error.issues.map(e => e.message).join(', '), 400);
    }
    const { subject, content, previewText } = parsed.data;

    // Fetch all active subscribers
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { isActive: true },
      select: { email: true, name: true },
    });

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No active subscribers found' },
        { status: 400 }
      );
    }

    // Create newsletter record
    const newsletter = await prisma.newsletter.create({
      data: {
        subject: subject.trim(),
        slug: generateSlug(subject.trim()),
        content: content.trim(),
        previewText: previewText?.trim() || null,
        isSent: false,
        sentCount: 0,
      },
    });

    // Start sending emails in background (non-blocking)
    // The function will update the newsletter record when complete
    sendNewsletterEmails(
      newsletter.id,
      subject.trim(),
      content.trim(),
      subscribers
    ).catch((error) => {
      console.error('Background email sending failed:', error);
    });

    // Return immediately without waiting for emails to send
    return successResponse({
      success: true,
      message: 'Newsletter is being sent to subscribers',
      summary: {
        totalSent: 0,
        failedCount: 0,
        totalSubscribers: subscribers.length,
        status: 'processing',
      },
      newsletterId: newsletter.id,
    });
  } catch (error) {
    console.error('Newsletter send error:', error);
    return errorResponse('Failed to send newsletter', 500);
  }
}

export const POST = withAdmin(handler);
