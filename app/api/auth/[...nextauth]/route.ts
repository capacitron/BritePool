import { NextRequest } from 'next/server'
import { handlers } from '@/lib/auth'
import { rateLimit, RateLimitConfigs } from '@/lib/rate-limit'

// Force Node.js runtime for bcrypt compatibility
export const runtime = 'nodejs'

const originalPost = handlers.POST

async function rateLimitedPost(request: NextRequest) {
  // Apply rate limiting to login attempts
  const rateLimitResult = rateLimit(request, 'login', RateLimitConfigs.login)
  if (rateLimitResult) return rateLimitResult

  return originalPost(request)
}

export const GET = handlers.GET
export const POST = rateLimitedPost
