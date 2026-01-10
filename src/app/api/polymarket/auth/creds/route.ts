import { NextResponse } from 'next/server';
import { getSession, isSessionExpired } from '@/lib/server/session';

export const runtime = 'nodejs';

export async function GET() {
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
  return NextResponse.json(
    { ok: true, creds: session.l2 },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
