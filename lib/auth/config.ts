import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { loginSchema } from '@/lib/validations/auth'
import type { UserRole, SubscriptionTier, SubscriptionStatus } from '@prisma/client'

// Detect if running in production/Replit environment
const isProduction = process.env.NODE_ENV === 'production'
const isReplit = !!process.env.REPL_SLUG
// Use simpler cookie names in Replit to avoid proxy issues with __Secure- prefix
const useSecureCookies = isProduction && !isReplit

export const authConfig: NextAuthConfig = {
  trustHost: true,
  // Cookie configuration for Replit/proxy environments
  // Using non-prefixed names in Replit to ensure cookies work with their proxy
  cookies: {
    sessionToken: {
      name: useSecureCookies ? '__Secure-authjs.session-token' : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction || isReplit,
      },
    },
    callbackUrl: {
      name: useSecureCookies ? '__Secure-authjs.callback-url' : 'authjs.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction || isReplit,
      },
    },
    csrfToken: {
      name: useSecureCookies ? '__Host-authjs.csrf-token' : 'authjs.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction || isReplit,
      },
    },
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('Auth: authorize called')
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) {
          console.log('Auth: validation failed')
          return null
        }

        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { profile: true },
        })

        if (!user) {
          console.log('Auth: user not found')
          return null
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash)
        if (!passwordMatch) {
          console.log('Auth: password mismatch')
          return null
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        console.log('Auth: login successful for user:', user.id)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          covenantAcceptedAt: user.covenantAcceptedAt,
          covenantVersion: user.covenantVersion,
          subscriptionTier: user.subscriptionTier,
          subscriptionStatus: user.subscriptionStatus,
          onboardingCompleted: user.onboardingCompleted,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      console.log('Auth JWT callback:', { hasUser: !!user, trigger, tokenId: token.id })
      if (user) {
        token.id = user.id
        token.role = user.role
        token.covenantAcceptedAt = user.covenantAcceptedAt
        token.covenantVersion = user.covenantVersion
        token.subscriptionTier = user.subscriptionTier
        token.subscriptionStatus = user.subscriptionStatus
        token.onboardingCompleted = user.onboardingCompleted
        console.log('Auth JWT: user data stored in token, id:', token.id)
      }
      if (trigger === 'update') {
        const { prisma } = await import('@/lib/prisma')
        const freshUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { 
            onboardingCompleted: true,
            covenantAcceptedAt: true,
            covenantVersion: true,
            subscriptionTier: true,
            subscriptionStatus: true,
          },
        })
        if (freshUser) {
          token.onboardingCompleted = freshUser.onboardingCompleted
          token.covenantAcceptedAt = freshUser.covenantAcceptedAt
          token.covenantVersion = freshUser.covenantVersion
          token.subscriptionTier = freshUser.subscriptionTier
          token.subscriptionStatus = freshUser.subscriptionStatus
        }
      }
      return token
    },
    async session({ session, token }) {
      console.log('Auth session callback:', { hasToken: !!token, tokenId: token?.id, hasSessionUser: !!session?.user })
      // Ensure session.user exists (required for auth() to work in API routes)
      session.user = session.user || {}
      session.user.id = token.id as string
      console.log('Auth session: user.id set to:', session.user.id)
      session.user.role = token.role as UserRole
      session.user.covenantAcceptedAt = token.covenantAcceptedAt as Date | null
      session.user.covenantVersion = token.covenantVersion as string | null
      session.user.subscriptionTier = token.subscriptionTier as SubscriptionTier
      session.user.subscriptionStatus = token.subscriptionStatus as SubscriptionStatus
      session.user.onboardingCompleted = token.onboardingCompleted as boolean
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
}
