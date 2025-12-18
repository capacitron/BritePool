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

  if (isStaticRoute || isApiRoute) {
    return NextResponse.next()
  }

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  if (isLoggedIn && !isPublicRoute && path !== '/contract-review') {
    const covenantAccepted = req.auth?.user?.covenantAcceptedAt
    if (!covenantAccepted) {
      return NextResponse.redirect(new URL('/contract-review', nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
