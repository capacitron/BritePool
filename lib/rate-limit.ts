import { NextResponse } from 'next/server'
import { rateLimitError } from './api-utils'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting
// For production, use Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>()

// Default configs for different endpoints
export const RateLimitConfigs = {
  // Auth endpoints - stricter limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 attempts per 15 minutes
  },
  // Login specifically - even stricter
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  },
  // Registration
  register: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 registrations per hour per IP
  },
  // General API - more lenient
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  // Admin endpoints
  admin: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },
} as const

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60 * 1000) // Clean up every minute

// Get client identifier from request
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (when behind proxy)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback - in production this should always have a value
  return '127.0.0.1'
}

// Check rate limit
export function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const key = `${endpoint}:${identifier}`
  const now = Date.now()

  let entry = rateLimitStore.get(key)

  // If no entry or window has passed, create new entry
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    }
    rateLimitStore.set(key, entry)
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime,
    }
  }

  // Increment count
  entry.count += 1
  rateLimitStore.set(key, entry)

  const allowed = entry.count <= config.maxRequests
  const remaining = Math.max(0, config.maxRequests - entry.count)

  return { allowed, remaining, resetTime: entry.resetTime }
}

// Rate limit middleware helper
export function rateLimit(
  request: Request,
  endpoint: string,
  config: RateLimitConfig = RateLimitConfigs.api
): NextResponse | null {
  const identifier = getClientIdentifier(request)
  const result = checkRateLimit(identifier, endpoint, config)

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)
    const response = rateLimitError(`Too many requests. Please try again in ${retryAfter} seconds.`)
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', '0')
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString())
    response.headers.set('Retry-After', retryAfter.toString())
    return response
  }

  return null
}

// Higher-order function to wrap route handlers with rate limiting
export function withRateLimit<T>(
  request: Request,
  endpoint: string,
  config: RateLimitConfig,
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T>> {
  const rateLimitResponse = rateLimit(request, endpoint, config)
  if (rateLimitResponse) {
    return Promise.resolve(rateLimitResponse as NextResponse<T>)
  }
  return handler()
}

// Combined rate limit by IP and user (for authenticated endpoints)
export function rateLimitByUser(
  request: Request,
  userId: string,
  endpoint: string,
  config: RateLimitConfig = RateLimitConfigs.api
): NextResponse | null {
  // Check both IP-based and user-based limits
  const ipIdentifier = getClientIdentifier(request)
  const ipResult = checkRateLimit(ipIdentifier, endpoint, config)

  if (!ipResult.allowed) {
    return rateLimitError('Too many requests from this IP')
  }

  const userResult = checkRateLimit(userId, `user:${endpoint}`, config)

  if (!userResult.allowed) {
    return rateLimitError('Too many requests from this account')
  }

  return null
}
