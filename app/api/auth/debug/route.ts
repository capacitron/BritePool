import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()

    const session = await auth()

    return NextResponse.json({
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasAuthSecret: !!process.env.AUTH_SECRET,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasAuthUrl: !!process.env.AUTH_URL,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        replSlug: process.env.REPL_SLUG || null,
      },
      cookies: {
        count: allCookies.length,
        names: allCookies.map(c => c.name),
        hasSessionCookie: allCookies.some(c =>
          c.name.includes('session-token') ||
          c.name.includes('authjs') ||
          c.name.includes('next-auth')
        ),
      },
      session: {
        exists: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id || null,
        userEmail: session?.user?.email || null,
      },
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
