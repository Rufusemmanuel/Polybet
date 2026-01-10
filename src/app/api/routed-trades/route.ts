import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trades = await prisma.routedTrade.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        marketId: true,
        conditionId: true,
        outcome: true,
        outcomeTokenId: true,
        side: true,
        size: true,
        price: true,
        orderId: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      trades: trades.map((trade) => ({
        ...trade,
        createdAt: trade.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[routed-trades] error', error);
    return NextResponse.json(
      { error: 'Unable to load routed trades.' },
      { status: 500 },
    );
  }
}
