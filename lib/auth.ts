import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { comparePassword } from './auth-utils';
import type { UserRole } from '@prisma/client';

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      status: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: string;
  }
}

const config: NextAuthConfig = {
  // Using JWT strategy - no adapter needed for credentials-only auth
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          throw new Error('Invalid email or password');
        }

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error('Account is temporarily locked. Try again later.');
        }

        // Check if account is suspended
        if (user.status === 'SUSPENDED') {
          throw new Error('Account has been suspended');
        }

        // Check if account is pending verification
        if (user.status === 'PENDING_VERIFICATION') {
          throw new Error('Please verify your email before logging in');
        }

        const isValidPassword = await comparePassword(password, user.passwordHash);

        if (!isValidPassword) {
          // Increment login attempts
          const newAttempts = user.loginAttempts + 1;
          const updateData: { loginAttempts: number; lockedUntil?: Date } = {
            loginAttempts: newAttempts,
          };

          // Lock account after 5 failed attempts for 15 minutes
          if (newAttempts >= 5) {
            updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
          }

          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });

          throw new Error('Invalid email or password');
        }

        // Reset login attempts on successful login
        await prisma.user.update({
          where: { id: user.id },
          data: {
            loginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as UserRole;
        token.status = user.status as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.status = token.status as string;
      }
      return session;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(config);
