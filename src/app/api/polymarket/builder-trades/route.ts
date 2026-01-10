import { NextResponse, type NextRequest } from 'next/server';
import { getBuilderClient } from '@/lib/server/polymarketBuilderClient';

export const runtime = 'nodejs';

const ALLOWED_PARAMS = new Set(['limit', 'next_cursor', 'after', 'before', 'market', 'asset_id']);

export async function GET(request: NextRequest) {
  const rawHeaders = Array.from(request.headers.keys());
  if (rawHeaders.some((key) => key.toLowerCase().startsWith('poly_'))) {
    return NextResponse.json(
      { ok: false, error: 'Unexpected auth headers.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const params: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    if (ALLOWED_PARAMS.has(key)) {
      params[key] = value;
    }
  });

  try {
    const client = getBuilderClient();
    const trades = await client.getBuilderTrades(
      params as Parameters<typeof client.getBuilderTrades>[0],
      params.next_cursor ?? undefined,
    );
    return NextResponse.json(
      { ok: true, trades },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Upstream error.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
