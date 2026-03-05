import { cookies } from 'next/headers'
import { isAdmin } from '@/lib/auth/roles'
import type { UserRole } from '@prisma/client'

const COOKIE_NAME = 'impersonating_user_id'

/**
 * Get the effective user ID, accounting for admin impersonation.
 * Returns the impersonated user's ID if an admin is impersonating,
 * otherwise returns the session user's ID.
 */
export async function getEffectiveUserId(
  sessionUserId: string,
  sessionUserRole: UserRole
): Promise<string> {
  if (!isAdmin(sessionUserRole)) return sessionUserId

  const cookieStore = await cookies()
  const impersonatingId = cookieStore.get(COOKIE_NAME)?.value
  if (impersonatingId && impersonatingId !== sessionUserId) {
    return impersonatingId
  }
  return sessionUserId
}

/**
 * Get the impersonated user ID from the cookie, or null if not impersonating.
 */
export async function getImpersonatingUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value || null
}

/**
 * Check if impersonation is currently active.
 */
export async function isImpersonating(): Promise<boolean> {
  const id = await getImpersonatingUserId()
  return id !== null
}

export { COOKIE_NAME }
