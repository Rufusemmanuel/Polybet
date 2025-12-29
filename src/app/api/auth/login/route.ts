import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createSession, sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth';

type LoginPayload = {
  name?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginPayload;
    const name = body.name?.trim() ?? '';
    const password = body.password ?? '';

    if (!name || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { name } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const session = await createSession(user.id);
    const response = NextResponse.json({ user: { id: user.id, name: user.name } });
    response.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions());
    return response;
  } catch (error) {
    console.error('[auth/login] error', error);
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Unable to login' }, { status: 500 });
  }
}
