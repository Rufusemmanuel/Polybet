import { NextResponse, type NextRequest } from 'next/server';
import { buildHmacSignature } from '@polymarket/builder-signing-sdk';
import { BUILDER_CREDS } from '@/lib/server/builderCreds';
import { getSession, isSessionExpired } from '@/lib/server/session';

export const runtime = 'nodejs';

type SignPayload = {
  method?: string;
  path?: string;
  body?: unknown;
  timestamp?: number;
};

const normalizeBody = (body: unknown) => {
  if (body == null) return undefined;
  if (typeof body === 'string') return body;
  try {
    return JSON.stringify(body);
  } catch {
    return undefined;
  }
};

export async function POST(request: NextRequest) {
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
    if (isSessionExpired(session)) session.destroy();
    return NextResponse.json(
      { ok: false, error: 'Session not initialized.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  let payload: SignPayload;
  try {
    payload = (await request.json()) as SignPayload;
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Invalid request', details: { message: 'Malformed JSON' } },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const method = typeof payload.method === 'string' ? payload.method.toUpperCase() : '';
  const path = typeof payload.path === 'string' ? payload.path : '';
  if (!method || !path) {
    return NextResponse.json(
      { ok: false, error: 'Invalid request', details: { missing: ['method', 'path'] } },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const timestamp = Number.isFinite(payload.timestamp)
    ? Number(payload.timestamp)
    : Date.now();
  const body = normalizeBody(payload.body);

  const signature = buildHmacSignature(
    BUILDER_CREDS.secret,
    timestamp,
    method,
    path,
    body,
  );

  return NextResponse.json(
    {
      POLY_BUILDER_SIGNATURE: signature,
      POLY_BUILDER_TIMESTAMP: String(timestamp),
      POLY_BUILDER_API_KEY: BUILDER_CREDS.apiKey,
      POLY_BUILDER_PASSPHRASE: BUILDER_CREDS.passphrase,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
