import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSession, sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth';

type SignupPayload = {
  name?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const body = (await request.json()) as SignupPayload;
    const name = body.name?.trim() ?? '';
    const password = body.password ?? '';

    if (name.length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: 'Name already taken' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        passwordHash,
      },
    });

    const session = await createSession(user.id);
    const response = NextResponse.json({ user: { id: user.id, name: user.name } }, { status: 201 });
    response.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions());

    return response;
  } catch (error) {
    console.error('[auth/signup] error', error);
    return NextResponse.json({ error: 'Unable to create account' }, { status: 500 });
  }
}
