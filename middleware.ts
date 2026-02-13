import { NextResponse } from 'next/server'
import NextAuth from 'next-auth'
import { edgeAuthConfig } from '@/lib/auth/edge-config'

const { auth } = NextAuth(edgeAuthConfig)

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
  const isLoggedIn = !!req.auth?.user?.id
  const path = nextUrl.pathname

  const isPublicRoute = publicRoutes.includes(path)
  const isAuthRoute = authRoutes.includes(path)
  const isOnboardingRoute = path.startsWith('/onboarding')

  // Redirect logged in users away from auth routes
  if (isAuthRoute && isLoggedIn) {
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

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).+)'],
}
