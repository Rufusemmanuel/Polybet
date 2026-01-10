import { NextResponse, type NextRequest } from 'next/server';
import { AssetType, Chain, ClobClient } from '@polymarket/clob-client';
import { getSession, isSessionExpired } from '@/lib/server/session';

export const runtime = 'nodejs';

const CLOB_HOST = process.env.POLYMARKET_CLOB_URL ?? 'https://clob.polymarket.com';

export async function POST(request: NextRequest) {
  const rawHeaders = Array.from(request.headers.keys());
  if (rawHeaders.some((key) => key.toLowerCase().startsWith('poly_'))) {
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
  if (!session.l2 || isSessionExpired(session)) {
    if (isSessionExpired(session)) session.destroy?.();
    return NextResponse.json(
      { ok: false, error: 'Session not initialized.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const client = new ClobClient(
      CLOB_HOST,
      Chain.POLYGON,
      undefined,
      {
        key: session.l2.apiKey,
        secret: session.l2.secret,
        passphrase: session.l2.passphrase,
      },
    );
    await client.updateBalanceAllowance({ asset_type: AssetType.COLLATERAL });
    return NextResponse.json(
      { ok: true },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Upstream error.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
