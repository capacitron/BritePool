/**
 * Account Lockout Configuration and Utilities
 *
 * Provides centralized configuration for account lockout protection
 * to prevent brute-force login attacks.
 */

export const LOCKOUT_CONFIG = {
  /** Maximum failed login attempts before account is locked */
  MAX_ATTEMPTS: 5,
  /** Lockout duration in milliseconds (15 minutes) */
  LOCKOUT_DURATION_MS: 15 * 60 * 1000,
  /** Lockout duration in minutes (for display purposes) */
  LOCKOUT_DURATION_MINUTES: 15,
} as const

/**
 * Calculates the lockout expiration time from now
 */
export function getLockoutExpiration(): Date {
  return new Date(Date.now() + LOCKOUT_CONFIG.LOCKOUT_DURATION_MS)
}

/**
 * Checks if an account should be locked based on failed attempts
 */
export function shouldLockAccount(loginAttempts: number): boolean {
  return loginAttempts >= LOCKOUT_CONFIG.MAX_ATTEMPTS
}

/**
 * Checks if an account is currently locked
 */
export function isAccountLocked(lockedUntil: Date | null): boolean {
  if (!lockedUntil) return false
  return lockedUntil > new Date()
}

/**
 * Gets the remaining lockout time in minutes
 */
export function getRemainingLockoutMinutes(lockedUntil: Date | null): number {
  if (!lockedUntil) return 0
  const remaining = lockedUntil.getTime() - Date.now()
  if (remaining <= 0) return 0
  return Math.ceil(remaining / (60 * 1000))
}

/**
 * Generates a user-friendly lockout error message
 */
export function getLockoutErrorMessage(lockedUntil: Date | null): string {
  const remainingMinutes = getRemainingLockoutMinutes(lockedUntil)
  if (remainingMinutes <= 1) {
    return 'Account is temporarily locked. Try again in about a minute.'
  }
  return `Account is temporarily locked. Try again in ${remainingMinutes} minutes.`
}

/**
 * Calculates remaining attempts before lockout
 */
export function getRemainingAttempts(currentAttempts: number): number {
  const remaining = LOCKOUT_CONFIG.MAX_ATTEMPTS - currentAttempts
  return Math.max(0, remaining)
}
