/**
 * Account Lockout Configuration and Utilities
 *
 * Uses a self-healing approach: lockout counters automatically become
 * irrelevant once the lockout window expires. No manual reset needed.
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
 * Checks if an account is currently locked (lockout has NOT yet expired)
 */
export function isAccountLocked(lockedUntil: Date | null): boolean {
  if (!lockedUntil) return false
  return lockedUntil > new Date()
}

/**
 * Checks if a previous lockout has expired and attempts need clearing.
 * Returns true when lockedUntil is in the past and loginAttempts >= MAX_ATTEMPTS.
 */
export function isLockoutExpired(lockedUntil: Date | null, loginAttempts: number): boolean {
  if (!lockedUntil) return false
  return lockedUntil <= new Date() && loginAttempts >= LOCKOUT_CONFIG.MAX_ATTEMPTS
}

/**
 * Returns the effective login attempts, accounting for expired lockouts.
 * If the lockout window has passed, attempts are effectively 0.
 */
export function getEffectiveAttempts(loginAttempts: number, lockedUntil: Date | null): number {
  if (isLockoutExpired(lockedUntil, loginAttempts)) return 0
  return loginAttempts
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
    return 'LOCKOUT_ACTIVE:1'
  }
  return `LOCKOUT_ACTIVE:${remainingMinutes}`
}

/**
 * Calculates remaining attempts before lockout
 */
export function getRemainingAttempts(currentAttempts: number): number {
  const remaining = LOCKOUT_CONFIG.MAX_ATTEMPTS - currentAttempts
  return Math.max(0, remaining)
}
