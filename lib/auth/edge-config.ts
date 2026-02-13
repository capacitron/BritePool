import type { NextAuthConfig } from 'next-auth'
import type { UserRole, SubscriptionTier, SubscriptionStatus } from '@prisma/client'

// Edge-safe auth config - NO Prisma, NO bcrypt imports
// Used by middleware only for JWT session reading
export const edgeAuthConfig: NextAuthConfig = {
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.status = user.status
        token.emailVerified = user.emailVerified
        token.covenantAcceptedAt = user.covenantAcceptedAt
        token.covenantVersion = user.covenantVersion
        token.subscriptionTier = user.subscriptionTier
        token.subscriptionStatus = user.subscriptionStatus
        token.onboardingCompleted = user.onboardingCompleted
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.status = token.status as string
        session.user.emailVerified = token.emailVerified as Date | null
        session.user.covenantAcceptedAt = token.covenantAcceptedAt as Date | null
        session.user.covenantVersion = token.covenantVersion as string | null
        session.user.subscriptionTier = token.subscriptionTier as SubscriptionTier
        session.user.subscriptionStatus = token.subscriptionStatus as SubscriptionStatus
        session.user.onboardingCompleted = token.onboardingCompleted as boolean
      }
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
