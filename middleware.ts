import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

// TEMPORARY: Set to true to bypass all authentication checks
// TODO: Set back to false when done testing
const BYPASS_AUTH = true

const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
]
const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email']

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const path = nextUrl.pathname

  const isPublicRoute = publicRoutes.includes(path)
  const isAuthRoute = authRoutes.includes(path)
  const isApiRoute = path.startsWith('/api')
  const isStaticRoute = path.startsWith('/_next') || path.startsWith('/favicon')
  const isOnboardingRoute = path.startsWith('/onboarding')
  const isContractCheckRoute = path === '/api/auth/check-covenant'

  // TEMPORARY: Bypass all auth checks when enabled
  if (BYPASS_AUTH) {
    // Redirect away from login/auth pages when bypass is active
    if (isAuthRoute) {
      return NextResponse.redirect(new URL('/dashboard/admin', nextUrl))
    }
    return NextResponse.next()
  }

  // Skip middleware for static and API routes
  if (isStaticRoute || isApiRoute || isContractCheckRoute) {
    return NextResponse.next()
  }

  // Redirect logged in users away from auth routes
  if (isAuthRoute && isLoggedIn) {
    // Redirect admins to admin dashboard
    const userRole = req.auth?.user?.role
    if (userRole === 'WEB_STEWARD' || userRole === 'BOARD_CHAIR') {
      return NextResponse.redirect(new URL('/dashboard/admin', nextUrl))
    }
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn && !isPublicRoute && !isOnboardingRoute) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  if (!isLoggedIn && isOnboardingRoute) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  // TEMPORARILY DISABLED: Covenant check causing redirect loops
  // TODO: Re-enable after fixing session/JWT role propagation
  // const isAdminRoute = path.startsWith('/dashboard/admin')
  // const userRole = req.auth?.user?.role
  // const isAdminUser = userRole === 'WEB_STEWARD' || userRole === 'BOARD_CHAIR'
  // if (isLoggedIn && !isPublicRoute && path !== '/contract-review' && !isOnboardingRoute && !isAdminRoute && !isAdminUser) {
  //   const agreementAcceptedAt = req.auth?.user?.covenantAcceptedAt
  //   if (!agreementAcceptedAt) {
  //     return NextResponse.redirect(new URL('/contract-review', nextUrl))
  //   }
  // }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
