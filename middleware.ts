import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password']
const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password']

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const path = nextUrl.pathname

  const isPublicRoute = publicRoutes.includes(path)
  const isAuthRoute = authRoutes.includes(path)
  const isApiRoute = path.startsWith('/api')
  const isStaticRoute = path.startsWith('/_next') || path.startsWith('/favicon')
  const isOnboardingRoute = path.startsWith('/onboarding')

  // Skip middleware for static and API routes
  if (isStaticRoute || isApiRoute) {
    return NextResponse.next()
  }

  // Redirect logged in users away from auth routes
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn && !isPublicRoute && !isOnboardingRoute) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  if (!isLoggedIn && isOnboardingRoute) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  // Check covenant acceptance and onboarding for authenticated users
  if (isLoggedIn && !isPublicRoute && path !== '/contract-review' && !isOnboardingRoute) {
    const covenantAccepted = req.auth?.user?.covenantAcceptedAt
    if (!covenantAccepted) {
      return NextResponse.redirect(new URL('/contract-review', nextUrl))
    }

    const onboardingCompleted = req.auth?.user?.onboardingCompleted
    if (!onboardingCompleted) {
      return NextResponse.redirect(new URL('/onboarding', nextUrl))
    }
  }

  // Redirect completed users away from onboarding
  if (isLoggedIn && isOnboardingRoute) {
    const onboardingCompleted = req.auth?.user?.onboardingCompleted
    if (onboardingCompleted) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
