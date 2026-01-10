import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'nodejs';

const RELAYER_BASE =
  process.env.POLY_RELAYER_URL ?? 'https://relayer-v2.polymarket.com';
const ALLOWED_PATHS = new Set([
  'nonce',
  'relay-payload',
  'transaction',
  'transactions',
  'deployed',
]);

export async function GET(
  request: NextRequest,
  { params }: { params: { path?: string[] } },
) {
  const rawHeaders = Array.from(request.headers.keys());
  if (rawHeaders.some((key) => key.toLowerCase().startsWith('poly_'))) {
    return NextResponse.json(
      { ok: false, error: 'Unexpected auth headers.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const pathParts = params.path ?? [];
  if (pathParts.length !== 1 || !ALLOWED_PATHS.has(pathParts[0])) {
    return NextResponse.json(
      { ok: false, error: 'Not found.' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const endpoint = pathParts[0];
  const search = request.nextUrl.search;
  const relayerUrl = `${RELAYER_BASE.replace(/\/$/, '')}/${endpoint}${search}`;

  let upstream: Response;
  try {
    upstream = await fetch(relayerUrl, { method: 'GET' });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Relayer error.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
