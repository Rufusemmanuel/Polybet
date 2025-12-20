export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    if (!prisma) {
      console.warn('/api/history: DATABASE_URL is not set; returning empty history.');
      return NextResponse.json({ history: [], total: 0 });
    }

    const history = await prisma.historyEntry.findMany({
      orderBy: { resolvedAt: 'desc' },
    });

    return NextResponse.json({
      history: history.map((h) => ({
        ...h,
        resolvedAt: h.resolvedAt.toISOString(),
        closedAt: h.closedAt ? h.closedAt.toISOString() : null,
        appearedAt: h.appearedAt.toISOString(),
      })),
      total: history.length,
    });
  } catch (error) {
    console.error('/api/history error', error);
    console.error('DATABASE_URL', process.env.DATABASE_URL);
    return NextResponse.json(
      {
        history: [],
        total: 0,
        error: 'Failed to load history. Check DATABASE_URL and that ./data/polypicks.db is accessible.',
      },
      { status: 200 },
    );
  }
}
