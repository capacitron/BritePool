import { logger } from '@/lib/logger'

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

interface CacheOptions {
  ttl?: number // Time to live in seconds
  staleWhileRevalidate?: number // Additional time to serve stale data
}

const DEFAULT_TTL = 60 * 5 // 5 minutes
const DEFAULT_SWR = 60 // 1 minute stale-while-revalidate

/**
 * Simple in-memory cache with TTL support
 * For production multi-instance deployments, replace with Redis
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private revalidating = new Set<string>()

  constructor() {
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000)
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined

    if (!entry) {
      return null
    }

    const now = Date.now()

    if (now > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl ?? DEFAULT_TTL
    const expiresAt = Date.now() + ttl * 1000

    this.cache.set(key, {
      data,
      expiresAt,
    })

    logger.debug({ key, ttl, expiresAt }, 'Cache set')
  }

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key)

    if (cached !== null) {
      logger.debug({ key }, 'Cache hit')
      return cached
    }

    logger.debug({ key }, 'Cache miss')
    const data = await fetcher()
    await this.set(key, data, options)

    return data
  }

  async invalidate(key: string): Promise<void> {
    this.cache.delete(key)
    logger.debug({ key }, 'Cache invalidated')
  }

  async invalidatePattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern)
    let count = 0

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        count++
      }
    }

    logger.debug({ pattern, count }, 'Cache pattern invalidated')
    return count
  }

  async clear(): Promise<void> {
    this.cache.clear()
    logger.info('Cache cleared')
  }

  private cleanup(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      logger.debug({ cleaned }, 'Cache cleanup completed')
    }
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// Export singleton instance
export const cache = new MemoryCache()

// Cache key generators for common patterns
export const cacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userProfile: (userId: string) => `user:${userId}:profile`,
  tasks: (userId: string, filters?: string) => `tasks:${userId}${filters ? `:${filters}` : ''}`,
  events: (page: number, limit: number) => `events:${page}:${limit}`,
  committees: () => 'committees:all',
  dashboard: (userId: string) => `dashboard:${userId}`,
  announcements: (limit: number) => `announcements:${limit}`,
}

// Cache TTL presets (in seconds)
export const cacheTTL = {
  short: 60, // 1 minute
  medium: 60 * 5, // 5 minutes
  long: 60 * 30, // 30 minutes
  hour: 60 * 60, // 1 hour
  day: 60 * 60 * 24, // 24 hours
}

export default cache
