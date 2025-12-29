import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ReadPayload = {
  ids?: string[];
  all?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as ReadPayload;
    const ids = Array.isArray(body.ids) ? body.ids : [];
    const markAll = body.all === true || ids.length === 0;

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId: user.id, readAt: null },
        data: { readAt: new Date() },
      });
      return NextResponse.json({ ok: true });
    }

    await prisma.notification.updateMany({
      where: { userId: user.id, id: { in: ids } },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const err = error as { message?: string; code?: string };
    console.error('[notifications] POST read error', err);
    return NextResponse.json(
      { error: err?.message ?? 'Unable to update notifications', code: err?.code },
      { status: 500 },
    );
  }
}
