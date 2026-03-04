import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/auth-middleware';
import { AuthUser } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

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

// POST /api/admin/newsletter/send - Send newsletter to all active subscribers
async function handler(request: NextRequest, user: AuthUser) {
  try {
    const body = await request.json();
    const { subject, content, previewText } = body;

    // Validate inputs
    if (!subject || !subject.trim()) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Get all active subscribers
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

    // Send emails to all subscribers
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const subscriber of subscribers) {
      try {
        const emailHtml = `
          <!DOCTYPE html>
          <html>
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
                            You're receiving this because you subscribed to our newsletter.
                          </p>
                          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
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

        const sent = await sendEmail({
          to: subscriber.email,
          subject,
          html: emailHtml,
          text: content.replace(/<[^>]*>/g, ''), // Strip HTML tags for plain text
        });

        if (sent) {
          successCount++;
        } else {
          failedCount++;
          errors.push(`Failed to send to ${subscriber.email}`);
        }
      } catch (error) {
        failedCount++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Error sending to ${subscriber.email}: ${errorMsg}`);
        console.error(`Error sending to ${subscriber.email}:`, error);
      }
    }

    // Update newsletter record with stats
    await prisma.newsletter.update({
      where: { id: newsletter.id },
      data: {
        isSent: true,
        sentAt: new Date(),
        sentCount: successCount,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Newsletter sent to ${successCount} of ${subscribers.length} subscribers`,
      newsletterId: newsletter.id,
      stats: {
        total: subscribers.length,
        sent: successCount,
        failed: failedCount,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Failed to send newsletter:', error);
    return NextResponse.json(
      { error: 'Failed to send newsletter' },
      { status: 500 }
    );
  }
}

export const POST = withAdmin(handler);
