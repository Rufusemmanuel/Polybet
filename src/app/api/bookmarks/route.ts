import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

type BookmarkPayload = {
  marketId?: string;
};

export async function GET(request: Request) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: user.id },
      select: { marketId: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ marketIds: bookmarks.map((b) => b.marketId) });
  } catch (error) {
    console.error('[bookmarks] GET error', error);
    return NextResponse.json({ error: 'Unable to load bookmarks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as BookmarkPayload;
    const marketId = body.marketId?.trim();
    if (!marketId) {
      return NextResponse.json({ error: 'marketId is required' }, { status: 400 });
    }

    await prisma.bookmark.upsert({
      where: {
        userId_marketId: {
          userId: user.id,
          marketId,
        },
      },
      create: { userId: user.id, marketId },
      update: {},
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[bookmarks] POST error', error);
    return NextResponse.json({ error: 'Unable to add bookmark' }, { status: 500 });
  }
}
