import type { NextRequest } from 'next/server';
import { getSession, isSessionExpired } from '@/lib/server/session';
import { buildL2Headers } from '@/lib/server/polymarketHeaders';
import { createOrderHandler } from '@/lib/server/polymarketOrderHandler';

export const runtime = 'nodejs';

const CLOB_HOST = process.env.POLYMARKET_CLOB_URL ?? 'https://clob.polymarket.com';

const getBuilderHeaders = async ({
  method,
  path,
  body,
  request,
}: {
  method: string;
  path: string;
  body: string;
  request: Request;
}) => {
  const signUrl = new URL('/api/polymarket/builder/sign', request.url);
  try {
    const res = await fetch(signUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, path, body }),
    });
    if (!res.ok) {
      return undefined;
    }
    const data = (await res.json()) as Record<string, string>;
    return {
      POLY_BUILDER_SIGNATURE: data.POLY_BUILDER_SIGNATURE,
      POLY_BUILDER_TIMESTAMP: data.POLY_BUILDER_TIMESTAMP,
      POLY_BUILDER_API_KEY: data.POLY_BUILDER_API_KEY,
      POLY_BUILDER_PASSPHRASE: data.POLY_BUILDER_PASSPHRASE,
    };
  } catch {
    return undefined;
  }
};

const handleOrder = createOrderHandler({
  getSession,
  isSessionExpired,
  buildL2Headers,
  getBuilderHeaders,
  clobHost: CLOB_HOST,
});

export async function POST(request: NextRequest) {
  return handleOrder(request);
}
