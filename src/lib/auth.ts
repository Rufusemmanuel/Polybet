import 'server-only';
import { createHash, randomBytes } from 'crypto';
import { prisma } from './prisma';

const SESSION_COOKIE = 'pp_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

const ensurePrisma = () => {
  if (!prisma) {
    throw new Error('Database unavailable');
  }
  return prisma;
};

export const createSession = async (userId: string) => {
  const db = ensurePrisma();
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await db.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return { token, expiresAt };
};

export const getUserFromRequest = async (request: Request) => {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = ensurePrisma();
  const tokenHash = hashToken(token);
  const session = await db.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await db.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
};

export const sessionCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
});

export { SESSION_COOKIE };
