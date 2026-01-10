import { NextResponse } from 'next/server';

const DEFAULT_BASE = 'https://data-api.polymarket.com';
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const PASSTHROUGH_KEYS = [
  'limit',
  'offset',
  'sortBy',
  'sortDirection',
  'title',
  'redeemable',
  'mergeable',
] as const;

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const user = url.searchParams.get('user');
    if (!user || !ADDRESS_RE.test(user)) {
      return NextResponse.json(
        { ok: false, error: 'Missing or invalid user address.' },
        { status: 400 },
      );
    }

    const base = process.env.POLYMARKET_DATA_API_BASE_URL ?? DEFAULT_BASE;
    const upstream = new URL('/positions', base);
    upstream.searchParams.set('user', user);
    upstream.searchParams.set('sizeThreshold', '0');
    upstream.searchParams.set('limit', url.searchParams.get('limit') ?? '200');
    PASSTHROUGH_KEYS.forEach((key) => {
      const value = url.searchParams.get(key);
      if (value && key !== 'limit') {
        upstream.searchParams.set(key, value);
      }
    });
    const redeemable = url.searchParams.get('redeemable');
    if (redeemable !== null) {
      upstream.searchParams.set('redeemable', redeemable);
    }

    const res = await fetch(upstream.toString(), { method: 'GET' });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: 'Upstream error', status: res.status },
        { status: res.status },
      );
    }
    const positions = (await res.json()) as Array<Record<string, unknown>>;
    return NextResponse.json(
      { ok: true, positions },
      { headers: { 'Cache-Control': 's-maxage=10, stale-while-revalidate=60' } },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 },
    );
  }
}
