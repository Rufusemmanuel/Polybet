import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'nodejs';

const RELAYER_BASE =
  process.env.POLY_RELAYER_URL ?? 'https://relayer-v2.polymarket.com';
const RELAYER_AUTH_TOKEN = process.env.POLY_RELAYER_AUTH_TOKEN;

export async function POST(request: NextRequest) {
  if (!RELAYER_AUTH_TOKEN) {
    return NextResponse.json(
      { ok: false, error: 'Relayer not configured' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const rawHeaders = Array.from(request.headers.keys());
  if (rawHeaders.some((key) => key.toLowerCase().startsWith('poly_'))) {
    return NextResponse.json(
      { ok: false, error: 'Unexpected auth headers.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const body = await request.text();
  const relayerUrl = `${RELAYER_BASE.replace(/\/$/, '')}/submit`;

  let upstream: Response;
  try {
    upstream = await fetch(relayerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: RELAYER_AUTH_TOKEN,
      },
      body,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Relayer error.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (upstream.status === 401 || upstream.status === 403) {
    return NextResponse.json(
      { ok: false, error: 'Relayer unauthorized' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
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
