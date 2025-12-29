import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, readAt: null },
    });

    return NextResponse.json({
      unreadCount,
      notifications: notifications.map((note) => ({
        id: note.id,
        type: note.type,
        title: note.title,
        body: note.body,
        marketId: note.marketId,
        createdAt: note.createdAt.toISOString(),
        readAt: note.readAt ? note.readAt.toISOString() : null,
      })),
    });
  } catch (error) {
    const err = error as { message?: string; code?: string };
    console.error('[notifications] GET error', err);
    return NextResponse.json(
      { error: err?.message ?? 'Unable to load notifications', code: err?.code },
      { status: 500 },
    );
  }
}
