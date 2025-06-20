import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Parse DATABASE_URL and add connection timeout parameters
function getDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error('DATABASE_URL is not defined');
  }
  
  // Check if URL already has query parameters
  const separator = baseUrl.includes('?') ? '&' : '?';
  
  // Add connection pool and timeout settings
  const timeoutParams = `${separator}connection_limit=5&connect_timeout=10&pool_timeout=10&statement_timeout=5000`;
  
  return baseUrl + timeoutParams;
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

// Simple connection without complex middleware
if (!globalForPrisma.prisma) {
  console.log('🔌 Connecting to database with optimized settings...');
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;