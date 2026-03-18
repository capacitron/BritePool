import { z } from 'zod'

const RESERVED_USERNAMES = [
  'api',
  'login',
  'register',
  'dashboard',
  'onboarding',
  'forgot-password',
  'reset-password',
  'contract-review',
  'admin',
  'profile',
  'about',
  'contact',
  'help',
  'terms',
  'privacy',
  'support',
  'account',
  'settings',
  'covenant',
  'events',
  'committees',
  'forum',
  'wgo',
  'pools',
  'resources',
]

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(
    /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/,
    'Username must start and end with a letter or number, and can only contain letters, numbers, and hyphens'
  )
  .regex(/^(?!.*--)/, 'Username cannot contain consecutive hyphens')
  .refine((val) => !RESERVED_USERNAMES.includes(val.toLowerCase()), 'This username is reserved')
