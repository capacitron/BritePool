import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasourceUrl: process.env.DATABASE_URL,
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
