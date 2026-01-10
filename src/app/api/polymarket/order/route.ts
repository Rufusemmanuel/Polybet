import type { NextRequest } from 'next/server';
import { buildHmacSignature } from '@polymarket/builder-signing-sdk';
import { BUILDER_CREDS } from '@/lib/server/builderCreds';
import { getSession, isSessionExpired } from '@/lib/server/session';
import { buildL2Headers } from '@/lib/server/polymarketHeaders';
import { createOrderHandler } from '@/lib/server/polymarketOrderHandler';

export const runtime = 'nodejs';

const CLOB_HOST = process.env.POLYMARKET_CLOB_URL ?? 'https://clob.polymarket.com';
const DEBUG_BUILDER = process.env.POLY_BUILDER_DEBUG === '1';

const getBuilderHeaders = async ({
  method,
  path,
  body,
}: {
  method: string;
  path: string;
  body: string;
  request: Request;
}) => {
  const timestamp = Date.now();
  const signature = buildHmacSignature(
    BUILDER_CREDS.secret,
    timestamp,
    method,
    path,
    body,
  );
  if (DEBUG_BUILDER) {
    console.info('[polymarket] builder headers', {
      hasBuilderHeaders: Boolean(signature),
    });
  }
  return {
    POLY_BUILDER_SIGNATURE: signature,
    POLY_BUILDER_TIMESTAMP: String(timestamp),
    POLY_BUILDER_API_KEY: BUILDER_CREDS.apiKey,
    POLY_BUILDER_PASSPHRASE: BUILDER_CREDS.passphrase,
  };
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
