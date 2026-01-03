import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { loginSchema } from '@/lib/validations/auth'
import type { UserRole, SubscriptionTier, SubscriptionStatus } from '@prisma/client'

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { profile: true },
        })

        if (!user) return null

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error('Account is temporarily locked. Try again later.')
        }

        // Check if account is suspended
        if (user.status === 'SUSPENDED') {
          throw new Error('Account has been suspended')
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash)

        if (!passwordMatch) {
          // Increment login attempts
          const newAttempts = (user.loginAttempts || 0) + 1
          const updateData: { loginAttempts: number; lockedUntil?: Date } = {
            loginAttempts: newAttempts,
          }

          // Lock account after 5 failed attempts for 15 minutes
          if (newAttempts >= 5) {
            updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000)
          }

          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          })

          return null
        }

        // Reset login attempts on successful login
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            loginAttempts: 0,
            lockedUntil: null,
          },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
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
      if (user) {
        token.id = user.id
        token.role = user.role
        token.status = user.status
        token.covenantAcceptedAt = user.covenantAcceptedAt
        token.covenantVersion = user.covenantVersion
        token.subscriptionTier = user.subscriptionTier
        token.subscriptionStatus = user.subscriptionStatus
        token.onboardingCompleted = user.onboardingCompleted
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
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.status = token.status as string
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
