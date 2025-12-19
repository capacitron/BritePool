import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import {
  applySecurityHeaders,
  generateRequestId,
  withRequestId,
} from '@/lib/middleware/security-headers'
import { rateLimit } from '@/lib/middleware/rate-limit'

const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password']
const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password']

// Rate-limited API paths
const rateLimitedPaths: Record<string, 'auth' | 'register' | 'payment' | 'api'> = {
  '/api/auth': 'auth',
  '/api/register': 'register',
  '/api/payments': 'payment',
}

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const path = nextUrl.pathname

  const isPublicRoute = publicRoutes.includes(path)
  const isAuthRoute = authRoutes.includes(path)
  const isApiRoute = path.startsWith('/api')
  const isStaticRoute = path.startsWith('/_next') || path.startsWith('/favicon')
  const isOnboardingRoute = path.startsWith('/onboarding')

  // Generate request ID for tracing
  const requestId = generateRequestId()

  // Apply rate limiting to API routes
  if (isApiRoute) {
    for (const [pathPrefix, configKey] of Object.entries(rateLimitedPaths)) {
      if (path.startsWith(pathPrefix)) {
        const { success, response } = rateLimit(req, configKey)
        if (!success && response) {
          return withRequestId(response, requestId)
        }
        break
      }
    }

    // Default API rate limiting
    const { success, response } = rateLimit(req, 'api')
    if (!success && response) {
      return withRequestId(response, requestId)
    }
  }

  // Skip auth checks for static routes
  if (isStaticRoute) {
    return NextResponse.next()
  }

  // Apply security headers to API responses
  if (isApiRoute) {
    const response = NextResponse.next()
    return withRequestId(applySecurityHeaders(response), requestId)
  }

  // Redirect logged in users away from auth routes
  if (isAuthRoute && isLoggedIn) {
    const response = NextResponse.redirect(new URL('/dashboard', nextUrl))
    return withRequestId(applySecurityHeaders(response), requestId)
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn && !isPublicRoute && !isOnboardingRoute) {
    const response = NextResponse.redirect(new URL('/login', nextUrl))
    return withRequestId(applySecurityHeaders(response), requestId)
  }

  if (!isLoggedIn && isOnboardingRoute) {
    const response = NextResponse.redirect(new URL('/login', nextUrl))
    return withRequestId(applySecurityHeaders(response), requestId)
  }

  // Check covenant acceptance and onboarding for authenticated users
  if (isLoggedIn && !isPublicRoute && path !== '/contract-review' && !isOnboardingRoute) {
    const covenantAccepted = req.auth?.user?.covenantAcceptedAt
    if (!covenantAccepted) {
      const response = NextResponse.redirect(new URL('/contract-review', nextUrl))
      return withRequestId(applySecurityHeaders(response), requestId)
    }

    const onboardingCompleted = req.auth?.user?.onboardingCompleted
    if (!onboardingCompleted) {
      const response = NextResponse.redirect(new URL('/onboarding', nextUrl))
      return withRequestId(applySecurityHeaders(response), requestId)
    }
  }

  // Redirect completed users away from onboarding
  if (isLoggedIn && isOnboardingRoute) {
    const onboardingCompleted = req.auth?.user?.onboardingCompleted
    if (onboardingCompleted) {
      const response = NextResponse.redirect(new URL('/dashboard', nextUrl))
      return withRequestId(applySecurityHeaders(response), requestId)
    }
  }

  const response = NextResponse.next()
  return withRequestId(applySecurityHeaders(response), requestId)
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
