import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/auth-middleware';
import { AuthUser } from '@/lib/auth';

// GET /api/admin/newsletter/history - Get sent newsletters
async function handler(request: NextRequest, user: AuthUser) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get sent newsletters
    const [newsletters, totalCount] = await Promise.all([
      prisma.newsletter.findMany({
        where: { isSent: true },
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          subject: true,
          sentCount: true,
          openCount: true,
          clickCount: true,
          sentAt: true,
          createdAt: true,
        },
      }),
      prisma.newsletter.count({
        where: { isSent: true },
      }),
    ]);

    return NextResponse.json({
      newsletters,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit,
      },
    });
  } catch (error) {
    console.error('Failed to fetch newsletter history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch newsletter history' },
      { status: 500 }
    );
  }
}

export const GET = withAdmin(handler);
