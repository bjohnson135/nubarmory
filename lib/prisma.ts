import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create a new instance with proper connection management
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    // Force transaction mode to avoid prepared statement conflicts
    __internal: {
      useUds: false,
    }
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Graceful shutdown
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}