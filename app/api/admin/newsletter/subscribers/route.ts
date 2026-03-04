import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/auth-middleware';
import { AuthUser } from '@/lib/auth';

// GET /api/admin/newsletter/subscribers - Get subscriber count
async function handler(request: NextRequest, user: AuthUser) {
  try {
    // Get total and active subscriber counts
    const [totalCount, activeCount] = await Promise.all([
      prisma.newsletterSubscriber.count(),
      prisma.newsletterSubscriber.count({
        where: { isActive: true },
      }),
    ]);

    return NextResponse.json({
      totalCount,
      activeCount,
      inactiveCount: totalCount - activeCount,
    });
  } catch (error) {
    console.error('Failed to fetch subscriber count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriber count' },
      { status: 500 }
    );
  }
}

export const GET = withAdmin(handler);
