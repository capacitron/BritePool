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

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

// ============================================
// Rate Limiting Backend Interface
// Supports both in-memory (dev) and Redis (production)
// ============================================

interface RateLimitBackend {
  check(key: string, config: RateLimitConfig): Promise<RateLimitResult>
  cleanup?(): void
}

// In-memory backend for development
class InMemoryBackend implements RateLimitBackend {
  private store = new Map<string, RateLimitEntry>()

  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now()
    let entry = this.store.get(key)

    // If no entry or window has passed, create new entry
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 1,
        resetTime: now + config.windowMs,
      }
      this.store.set(key, entry)
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: entry.resetTime,
      }
    }

    // Increment count
    entry.count += 1
    this.store.set(key, entry)

    const allowed = entry.count <= config.maxRequests
    const remaining = Math.max(0, config.maxRequests - entry.count)

    return { allowed, remaining, resetTime: entry.resetTime }
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key)
      }
    }
  }
}

// Redis backend for production (Upstash-ready)
// To enable:
// 1. Install: npm install @upstash/redis @upstash/ratelimit
// 2. Set env vars: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
// 3. The system will automatically use Redis when configured
//
// Redis provides:
// - Persistent rate limit state across restarts
// - Horizontal scaling support
// - Sliding window algorithm for smoother rate limiting
// - Analytics and monitoring via Upstash dashboard
//
// Until packages are installed, in-memory rate limiting will be used.

// Placeholder interface for Redis backend (implementation added when packages installed)
interface RedisRateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

class RedisBackend implements RateLimitBackend {
  private initialized = false
  private initPromise: Promise<void> | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private Ratelimit: any = null

  constructor() {
    // Lazily initialize on first use
  }

  private async initialize(): Promise<boolean> {
    if (this.initialized) return this.client !== null

    if (!this.initPromise) {
      this.initPromise = this.doInitialize()
    }

    await this.initPromise
    return this.client !== null
  }

  private async doInitialize(): Promise<void> {
    try {
      // Try to require the packages - they may not be installed
      // Using eval to prevent TypeScript from checking the import
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const upstashRedis = await (new Function('return import("@upstash/redis")'))() as { Redis: new (config: { url: string; token: string }) => unknown }
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const upstashRatelimit = await (new Function('return import("@upstash/ratelimit")'))() as { Ratelimit: { slidingWindow: (count: number, window: string) => unknown } & (new (config: { redis: unknown; limiter: unknown; analytics: boolean; prefix: string }) => { limit: (key: string) => Promise<RedisRateLimitResult> }) }

      const { Redis } = upstashRedis
      this.Ratelimit = upstashRatelimit.Ratelimit

      this.client = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      })

      console.log('Upstash Redis rate limiting initialized')
    } catch {
      // Package not installed - using in-memory fallback
      console.log('Upstash Redis not available, using in-memory rate limiting')
      this.client = null
    } finally {
      this.initialized = true
    }
  }

  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const isReady = await this.initialize()

    if (!isReady || !this.client || !this.Ratelimit) {
      // Fallback to in-memory
      return inMemoryBackend.check(key, config)
    }

    try {
      // Create ratelimit instance for this specific check
      const ratelimit = new this.Ratelimit({
        redis: this.client,
        limiter: this.Ratelimit.slidingWindow(
          config.maxRequests,
          `${Math.floor(config.windowMs / 1000)}s`
        ),
        analytics: true,
        prefix: 'britepool:ratelimit',
      })

      const result: RedisRateLimitResult = await ratelimit.limit(key)

      return {
        allowed: result.success,
        remaining: result.remaining,
        resetTime: result.reset,
      }
    } catch (error) {
      console.error('Redis rate limit check failed:', error)
      // Fallback to in-memory on error
      return inMemoryBackend.check(key, config)
    }
  }
}

// Singleton backends
const inMemoryBackend = new InMemoryBackend()
let redisBackend: RedisBackend | null = null

// Get the appropriate backend based on environment
function getBackend(): RateLimitBackend {
  // Use Redis in production when configured
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (!redisBackend) {
      redisBackend = new RedisBackend()
    }
    return redisBackend
  }
  return inMemoryBackend
}

// Legacy in-memory store for backward compatibility
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
  // Moderate limit for standard API operations (30 req/min)
  moderate: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
  },
  // Strict limit for sensitive submissions (10 req/min)
  submissions: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
  },
  // Lenient limit for realtime/SSE connections (60 req/min)
  realtime: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
} as const

// Clean up expired entries periodically (in-memory only)
// Redis handles its own TTL-based cleanup
setInterval(() => {
  inMemoryBackend.cleanup?.()
}, 60 * 1000) // Clean up every minute

// Get client identifier from request
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (when behind proxy)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() ?? forwardedFor
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback - in production this should always have a value
  return '127.0.0.1'
}

// Check rate limit (async for Redis support)
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `${endpoint}:${identifier}`
  const backend = getBackend()
  return backend.check(key, config)
}

// Synchronous version for backward compatibility (uses in-memory only)
export function checkRateLimitSync(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): RateLimitResult {
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

// Rate limit middleware helper (async for Redis support)
export async function rateLimit(
  request: Request,
  endpoint: string,
  config: RateLimitConfig = RateLimitConfigs.api
): Promise<NextResponse | null> {
  const identifier = getClientIdentifier(request)
  const result = await checkRateLimit(identifier, endpoint, config)

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

// Synchronous rate limit for middleware (uses in-memory only)
export function rateLimitSync(
  request: Request,
  endpoint: string,
  config: RateLimitConfig = RateLimitConfigs.api
): NextResponse | null {
  const identifier = getClientIdentifier(request)
  const result = checkRateLimitSync(identifier, endpoint, config)

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

// Higher-order function to wrap route handlers with rate limiting (async)
export async function withRateLimit<T>(
  request: Request,
  endpoint: string,
  config: RateLimitConfig,
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T>> {
  const rateLimitResponse = await rateLimit(request, endpoint, config)
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse<T>
  }
  return handler()
}

// Combined rate limit by IP and user (for authenticated endpoints, async)
export async function rateLimitByUser(
  request: Request,
  userId: string,
  endpoint: string,
  config: RateLimitConfig = RateLimitConfigs.api
): Promise<NextResponse | null> {
  // Check both IP-based and user-based limits
  const ipIdentifier = getClientIdentifier(request)
  const ipResult = await checkRateLimit(ipIdentifier, endpoint, config)

  if (!ipResult.allowed) {
    return rateLimitError('Too many requests from this IP')
  }

  const userResult = await checkRateLimit(userId, `user:${endpoint}`, config)

  if (!userResult.allowed) {
    return rateLimitError('Too many requests from this account')
  }

  return null
}

// Synchronous combined rate limit for middleware (uses in-memory only)
export function rateLimitByUserSync(
  request: Request,
  userId: string,
  endpoint: string,
  config: RateLimitConfig = RateLimitConfigs.api
): NextResponse | null {
  // Check both IP-based and user-based limits
  const ipIdentifier = getClientIdentifier(request)
  const ipResult = checkRateLimitSync(ipIdentifier, endpoint, config)

  if (!ipResult.allowed) {
    return rateLimitError('Too many requests from this IP')
  }

  const userResult = checkRateLimitSync(userId, `user:${endpoint}`, config)

  if (!userResult.allowed) {
    return rateLimitError('Too many requests from this account')
  }

  return null
}
