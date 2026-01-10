import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      ok: false,
      error: 'Deprecated endpoint. Use the client CLOB postOrder flow.',
    },
    { status: 410 },
  );
}
