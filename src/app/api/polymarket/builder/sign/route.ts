import { NextResponse, type NextRequest } from 'next/server';
import { buildHmacSignature } from '@polymarket/builder-signing-sdk';
import { BUILDER_CREDS } from '@/lib/server/builderCreds';

export const runtime = 'nodejs';

type SignPayload = {
  method?: string;
  path?: string;
  body?: unknown;
};

const normalizeBody = (body: unknown) => {
  if (body == null) return '';
  if (typeof body === 'string') return body;
  try {
    return JSON.stringify(body);
  } catch {
    return '';
  }
};

export async function POST(request: NextRequest) {
  let payload: SignPayload;
  try {
    payload = (await request.json()) as SignPayload;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request', details: { message: 'Malformed JSON' } },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const method = typeof payload.method === 'string' ? payload.method.toUpperCase() : '';
  const path = typeof payload.path === 'string' ? payload.path : '';
  if (!method || !path) {
    return NextResponse.json(
      { error: 'Invalid request', details: { missing: ['method', 'path'] } },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const timestamp = Date.now().toString();
  const body = normalizeBody(payload.body);

  const signature = buildHmacSignature(
    BUILDER_CREDS.secret,
    Number.parseInt(timestamp, 10),
    method,
    path,
    body,
  );

  return NextResponse.json(
    {
      POLY_BUILDER_SIGNATURE: signature,
      POLY_BUILDER_TIMESTAMP: timestamp,
      POLY_BUILDER_API_KEY: BUILDER_CREDS.apiKey,
      POLY_BUILDER_PASSPHRASE: BUILDER_CREDS.passphrase,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
