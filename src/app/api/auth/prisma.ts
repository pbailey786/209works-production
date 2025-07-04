import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'],
    errorFormat: 'pretty',
  });

// Simple connection without complex middleware
if (!globalForPrisma.prisma) {
  console.log('Connecting to database.');
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
