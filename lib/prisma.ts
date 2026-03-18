import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

// Neon is the primary database; fall back to DATABASE_URL (local Replit DB) if not set
const primaryUrl = process.env.NEON_DB_URL || process.env.DATABASE_URL

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasourceUrl: primaryUrl,
  })
}

// Eagerly initialize connection in production to avoid cold start delays
if (process.env.NODE_ENV === 'production') {
  const client = globalThis.prisma ?? prismaClientSingleton()
  client.$connect().catch(() => {})
  globalThis.prisma = client
}

export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}
