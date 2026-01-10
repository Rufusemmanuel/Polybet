import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getSession, isSessionExpired } from '@/lib/server/session';
import { getMarketDetailsPayload } from '@/lib/polymarket/api';

export const runtime = 'nodejs';

const payloadSchema = z.object({
  marketId: z.string().min(1),
  proxyWalletAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
});

export async function POST(request: NextRequest) {
  const rawHeaderKeys = Array.from(request.headers.keys());
  if (rawHeaderKeys.some((k) => k.toLowerCase().startsWith('poly_'))) {
    return NextResponse.json(
      { ok: false, error: 'Unexpected auth headers.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  let session: Awaited<ReturnType<typeof getSession>>;
  try {
    session = await getSession();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Server session not configured.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  if (!session.l2 || !session.walletAddress || isSessionExpired(session)) {
    if (isSessionExpired(session)) session.destroy();
    return NextResponse.json(
      { ok: false, error: 'Session not initialized.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  let payload: z.infer<typeof payloadSchema>;
  try {
    payload = payloadSchema.parse(await request.json());
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Invalid request body.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const market = await getMarketDetailsPayload(payload.marketId);
    if (!market) {
      return NextResponse.json(
        { ok: false, error: 'Market not found.' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    if (!market.resolved) {
      return NextResponse.json(
        { ok: false, error: 'Market not resolved.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    const conditionId = market.conditionId ?? null;
    const outcomeCount =
      market.outcomeTokenIds?.length ?? market.outcomes?.length ?? null;
    if (!conditionId || !outcomeCount) {
      return NextResponse.json(
        { ok: false, error: 'Market data unavailable for redemption.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    return NextResponse.json(
      { ok: true, conditionId, outcomeCount },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Redeem error.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
