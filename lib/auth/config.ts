import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { loginSchema } from '@/lib/validations/auth'

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

        const passwordMatch = await bcrypt.compare(password, user.passwordHash)
        if (!passwordMatch) return null

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

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
      if (user) {
        token.id = user.id
        token.role = user.role
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
          select: { onboardingCompleted: true },
        })
        if (freshUser) {
          token.onboardingCompleted = freshUser.onboardingCompleted
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.covenantAcceptedAt = token.covenantAcceptedAt as Date | null
        session.user.covenantVersion = token.covenantVersion as string | null
        session.user.subscriptionTier = token.subscriptionTier as string
        session.user.subscriptionStatus = token.subscriptionStatus as string
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
