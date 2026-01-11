import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock next/server before any imports
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, init) => new Response(JSON.stringify(data), init)),
  },
}))

// Mock api-utils to avoid Next.js import issues
vi.mock('@/lib/api-utils', () => ({
  rateLimitError: vi.fn((message) =>
    new Response(JSON.stringify({ error: message }), { status: 429 })
  ),
}))

// Reset modules before tests
beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Rate Limiting - In-Memory Backend', () => {
  it('allows requests within limit', async () => {
    // Import fresh module
    const { checkRateLimitSync, RateLimitConfigs } = await import('@/lib/rate-limit')

    const config = RateLimitConfigs.api // 60 requests per minute

    // First request should be allowed
    const result1 = checkRateLimitSync('test-ip-1', 'test-endpoint', config)
    expect(result1.allowed).toBe(true)
    expect(result1.remaining).toBe(config.maxRequests - 1)

    // Second request should also be allowed
    const result2 = checkRateLimitSync('test-ip-1', 'test-endpoint', config)
    expect(result2.allowed).toBe(true)
    expect(result2.remaining).toBe(config.maxRequests - 2)
  })

  it('blocks requests after limit exceeded', async () => {
    const { checkRateLimitSync } = await import('@/lib/rate-limit')

    // Use a very restrictive limit for testing
    const testConfig = { windowMs: 60000, maxRequests: 3 }

    // Make 3 requests (should all succeed)
    for (let i = 0; i < 3; i++) {
      const result = checkRateLimitSync('test-ip-2', 'blocked-endpoint', testConfig)
      expect(result.allowed).toBe(true)
    }

    // 4th request should be blocked
    const blockedResult = checkRateLimitSync('test-ip-2', 'blocked-endpoint', testConfig)
    expect(blockedResult.allowed).toBe(false)
    expect(blockedResult.remaining).toBe(0)
  })

  it('allows requests from different IPs independently', async () => {
    const { checkRateLimitSync } = await import('@/lib/rate-limit')

    const testConfig = { windowMs: 60000, maxRequests: 2 }

    // IP 1 makes 2 requests
    checkRateLimitSync('ip-a', 'shared-endpoint', testConfig)
    checkRateLimitSync('ip-a', 'shared-endpoint', testConfig)

    // IP 1 is now blocked
    expect(checkRateLimitSync('ip-a', 'shared-endpoint', testConfig).allowed).toBe(false)

    // IP 2 should still be allowed (fresh limit)
    expect(checkRateLimitSync('ip-b', 'shared-endpoint', testConfig).allowed).toBe(true)
  })

  it('tracks different endpoints independently', async () => {
    const { checkRateLimitSync } = await import('@/lib/rate-limit')

    const testConfig = { windowMs: 60000, maxRequests: 2 }

    // Exhaust limit on endpoint A
    checkRateLimitSync('same-ip', 'endpoint-a', testConfig)
    checkRateLimitSync('same-ip', 'endpoint-a', testConfig)
    expect(checkRateLimitSync('same-ip', 'endpoint-a', testConfig).allowed).toBe(false)

    // Endpoint B should still have fresh limit
    expect(checkRateLimitSync('same-ip', 'endpoint-b', testConfig).allowed).toBe(true)
  })

  it('provides correct reset time', async () => {
    const { checkRateLimitSync } = await import('@/lib/rate-limit')

    const testConfig = { windowMs: 60000, maxRequests: 5 }
    const beforeTime = Date.now()

    const result = checkRateLimitSync('reset-test', 'reset-endpoint', testConfig)

    expect(result.resetTime).toBeGreaterThan(beforeTime)
    expect(result.resetTime).toBeLessThanOrEqual(beforeTime + testConfig.windowMs + 100) // 100ms tolerance
  })
})

describe('Rate Limiting Configurations', () => {
  it('has stricter limits for auth endpoints', async () => {
    const { RateLimitConfigs } = await import('@/lib/rate-limit')

    expect(RateLimitConfigs.auth.maxRequests).toBeLessThan(RateLimitConfigs.api.maxRequests)
    expect(RateLimitConfigs.login.maxRequests).toBeLessThanOrEqual(RateLimitConfigs.auth.maxRequests)
    expect(RateLimitConfigs.register.maxRequests).toBeLessThanOrEqual(RateLimitConfigs.auth.maxRequests)
  })

  it('has appropriate window sizes', async () => {
    const { RateLimitConfigs } = await import('@/lib/rate-limit')

    // Auth windows should be longer (15 mins or more)
    expect(RateLimitConfigs.auth.windowMs).toBeGreaterThanOrEqual(15 * 60 * 1000)
    expect(RateLimitConfigs.login.windowMs).toBeGreaterThanOrEqual(15 * 60 * 1000)

    // Registration should have very long window (1 hour)
    expect(RateLimitConfigs.register.windowMs).toBe(60 * 60 * 1000)

    // API should have short window (1 minute)
    expect(RateLimitConfigs.api.windowMs).toBe(60 * 1000)
  })

  it('has admin-specific limits', async () => {
    const { RateLimitConfigs } = await import('@/lib/rate-limit')

    // Admin should have higher limits than regular API
    expect(RateLimitConfigs.admin.maxRequests).toBeGreaterThanOrEqual(RateLimitConfigs.api.maxRequests)
  })
})

describe('Client Identifier Extraction', () => {
  it('extracts IP from x-forwarded-for header', async () => {
    const { getClientIdentifier } = await import('@/lib/rate-limit')

    const request = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '192.168.1.100, 10.0.0.1',
      },
    })

    const ip = getClientIdentifier(request)
    expect(ip).toBe('192.168.1.100')
  })

  it('extracts IP from x-real-ip header', async () => {
    const { getClientIdentifier } = await import('@/lib/rate-limit')

    const request = new Request('http://localhost', {
      headers: {
        'x-real-ip': '172.16.0.50',
      },
    })

    const ip = getClientIdentifier(request)
    expect(ip).toBe('172.16.0.50')
  })

  it('prefers x-forwarded-for over x-real-ip', async () => {
    const { getClientIdentifier } = await import('@/lib/rate-limit')

    const request = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '192.168.1.100',
        'x-real-ip': '172.16.0.50',
      },
    })

    const ip = getClientIdentifier(request)
    expect(ip).toBe('192.168.1.100')
  })

  it('falls back to localhost when no IP headers', async () => {
    const { getClientIdentifier } = await import('@/lib/rate-limit')

    const request = new Request('http://localhost')

    const ip = getClientIdentifier(request)
    expect(ip).toBe('127.0.0.1')
  })
})
