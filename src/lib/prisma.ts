import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to initialize Prisma');
}
if (
  databaseUrl.startsWith('file:') ||
  (!databaseUrl.startsWith('postgres://') && !databaseUrl.startsWith('postgresql://'))
) {
  throw new Error('DATABASE_URL must be a Postgres connection string');
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma;
}
