import { NextRequest } from 'next/server'
import { handlers } from '@/lib/auth'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'
import { logLoginFailed } from '@/lib/audit'

// Force Node.js runtime for bcrypt compatibility
export const runtime = 'nodejs'

const originalPost = handlers.POST

async function rateLimitedPost(request: NextRequest) {
  // Apply rate limiting to login attempts
  const rateLimitResult = await rateLimit(request, 'login', RateLimitConfigs.login)
  if (rateLimitResult) return rateLimitResult

  // Clone request to read body for potential failure logging
  const clonedRequest = request.clone()

  const response = await originalPost(request)

  // Track failed login attempts in audit log
  if (response.status === 401 || response.status === 400) {
    try {
      const body = await clonedRequest.json().catch(() => null)
      const email = body?.email || body?.credentials?.email || 'unknown'
      // Fire and forget - don't block the response
      logLoginFailed(email, clonedRequest).catch(() => {})
    } catch {
      // Ignore errors in audit logging
    }
  }

  return response
}

export const GET = handlers.GET
export const POST = rateLimitedPost
