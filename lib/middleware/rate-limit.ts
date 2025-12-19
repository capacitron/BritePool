import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  message?: string // Custom error message
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (use Redis in production for multi-instance deployments)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

export const rateLimitConfigs: Record<string, RateLimitConfig> = {
  // Strict limits for auth endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    message: 'Too many authentication attempts. Please try again later.',
  },
  // Moderate limits for general API
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Too many requests. Please slow down.',
  },
  // Strict limits for registration
  register: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    message: 'Too many registration attempts. Please try again later.',
  },
  // Limits for payment endpoints
  payment: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many payment requests. Please try again later.',
  },
}

function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  return cfConnectingIp || realIp || forwardedFor?.split(',')[0]?.trim() || 'unknown'
}

export function rateLimit(
  request: NextRequest,
  configKey: keyof typeof rateLimitConfigs = 'api'
): { success: boolean; response?: NextResponse } {
  const config = rateLimitConfigs[configKey]
  const clientId = getClientIdentifier(request)
  const key = `${configKey}:${clientId}`
  const now = Date.now()

  let entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired one
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    }
    rateLimitStore.set(key, entry)
    return { success: true }
  }

  entry.count++

  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)

    logger.warn({
      type: 'rate_limit_exceeded',
      clientId,
      configKey,
      count: entry.count,
      maxRequests: config.maxRequests,
      path: request.nextUrl.pathname,
    })

    return {
      success: false,
      response: NextResponse.json(
        {
          error: config.message,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(config.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(entry.resetTime / 1000)),
          },
        }
      ),
    }
  }

  return { success: true }
}

// Middleware helper for API routes
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  configKey: keyof typeof rateLimitConfigs = 'api'
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { success, response } = rateLimit(request, configKey)

    if (!success && response) {
      return response
    }

    return handler(request)
  }
}
