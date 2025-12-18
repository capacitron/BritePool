import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'
import { UserRole, SubscriptionTier, SubscriptionStatus } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: UserRole
      covenantAcceptedAt: Date | null
      covenantVersion: string | null
      subscriptionTier: SubscriptionTier
      subscriptionStatus: SubscriptionStatus
      onboardingCompleted: boolean
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    id: string
    role: UserRole
    covenantAcceptedAt: Date | null
    covenantVersion: string | null
    subscriptionTier: SubscriptionTier
    subscriptionStatus: SubscriptionStatus
    onboardingCompleted: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    role: UserRole
    covenantAcceptedAt: Date | null
    covenantVersion: string | null
    subscriptionTier: SubscriptionTier
    subscriptionStatus: SubscriptionStatus
    onboardingCompleted: boolean
  }
}
