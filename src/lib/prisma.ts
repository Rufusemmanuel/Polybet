import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

export const prisma = process.env.DATABASE_URL
  ? globalForPrisma.prisma ??
    new PrismaClient({
      log: ['error', 'warn'],
    })
  : undefined;

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma;
}
