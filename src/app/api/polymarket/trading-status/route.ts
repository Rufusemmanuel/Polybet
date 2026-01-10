import { NextResponse } from 'next/server';
import { resolveTradingStatus } from '@/lib/polymarket/trading';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(resolveTradingStatus());
}
