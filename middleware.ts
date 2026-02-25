import { NextResponse } from 'next/server'
import NextAuth from 'next-auth'
import { edgeAuthConfig } from '@/lib/auth/edge-config'

const { auth } = NextAuth(edgeAuthConfig)

const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password']
const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password']

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth?.user?.id
  const path = nextUrl.pathname

  const isPublicRoute = publicRoutes.includes(path)
  const isAuthRoute = authRoutes.includes(path)
  const isOnboardingRoute = path.startsWith('/onboarding')

  // Allow /<username> referral links (single path segment, not a known route prefix)
  const knownPrefixes = [
    '/dashboard',
    '/onboarding',
    '/api',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/_next',
  ]
  const isReferralRoute =
    path !== '/' && !knownPrefixes.some((p) => path.startsWith(p)) && /^\/[a-z0-9-]+$/.test(path)

  // Redirect logged in users away from auth routes
  if (isAuthRoute && isLoggedIn) {
    const userRole = req.auth?.user?.role
    if (userRole === 'WEB_STEWARD' || userRole === 'BOARD_CHAIR') {
      return NextResponse.redirect(new URL('/dashboard/admin', nextUrl))
    }
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  // Allow referral links through for unauthenticated users (e.g. /capacitron -> /register?ref=capacitron)
  if (isReferralRoute && !isLoggedIn) {
    return NextResponse.next()
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn && !isPublicRoute && !isOnboardingRoute) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  if (!isLoggedIn && isOnboardingRoute) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).+)'],
}
