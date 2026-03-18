import { PrismaClient } from '@prisma/client'

/**
 * Secondary Prisma client for the local Replit database.
 * The primary client (lib/prisma.ts) always targets Neon.
 * This syncs writes to the local DB when it differs from Neon.
 */

declare global {
  var localPrisma: PrismaClient | undefined
}

function shouldSync(): boolean {
  const neonUrl = process.env.NEON_DB_URL
  const localUrl = process.env.DATABASE_URL
  // Only sync if both exist and differ (i.e., primary is Neon, local is separate)
  return !!(neonUrl && localUrl && neonUrl !== localUrl)
}

function getLocalClient(): PrismaClient | null {
  if (!shouldSync()) return null

  if (!globalThis.localPrisma) {
    globalThis.localPrisma = new PrismaClient({
      log: ['error'],
      datasourceUrl: process.env.DATABASE_URL,
    })
  }

  return globalThis.localPrisma
}

/**
 * Sync a user profile update to the local Replit database.
 * Fails silently — the primary write to Neon has already succeeded.
 */
export async function syncProfileToLocal(
  userId: string,
  updateData: Record<string, unknown>,
  profileUpdateData: Record<string, unknown>
): Promise<void> {
  const local = getLocalClient()
  if (!local) return

  try {
    await local.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        ...(Object.keys(profileUpdateData).length > 0
          ? {
              profile: {
                upsert: {
                  create: profileUpdateData,
                  update: profileUpdateData,
                },
              },
            }
          : {}),
      },
    })
  } catch (error) {
    console.error('[Local DB Sync] Failed to sync profile update:', error)
  }
}
