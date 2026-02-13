import { z } from 'zod'

// Common validation patterns
const emailSchema = z.string().email('Invalid email address').toLowerCase().trim()

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .trim()

const uuidSchema = z.string().uuid('Invalid ID format')

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// User roles matching Prisma UserRole enum
const userRoles = [
  'WEB_STEWARD',
  'BOARD_CHAIR',
  'COMMITTEE_LEADER',
  'CONTENT_MODERATOR',
  'SUPPORT_STAFF',
  'STEWARD',
  'PARTNER',
  'RESIDENT',
] as const

// User management schemas
export const createUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(userRoles),
})

export const updateUserSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  role: z.enum(userRoles).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'LOCKED']).optional(),
})

export const userIdSchema = z.object({
  id: uuidSchema,
})

// Moderation schemas
export const moderationActionSchema = z.object({
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
})

export const rejectContentSchema = z.object({
  reason: z
    .string()
    .min(1, 'Rejection reason is required')
    .max(1000, 'Reason must be less than 1000 characters'),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
})

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const userQuerySchema = paginationSchema.extend({
  search: z.string().max(100).optional(),
  role: z.enum(userRoles).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'LOCKED']).optional(),
  sortBy: z.enum(['name', 'email', 'createdAt', 'lastLoginAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const moderationQuerySchema = paginationSchema.extend({
  type: z.enum(['all', 'forum_post', 'media']).default('all'),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
})

export const auditQuerySchema = paginationSchema.extend({
  userId: uuidSchema.optional(),
  action: z.string().optional(),
  resourceType: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

// Type exports
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type ModerationActionInput = z.infer<typeof moderationActionSchema>
export type RejectContentInput = z.infer<typeof rejectContentSchema>
export type UserQueryInput = z.infer<typeof userQuerySchema>
export type ModerationQueryInput = z.infer<typeof moderationQuerySchema>
export type AuditQueryInput = z.infer<typeof auditQuerySchema>
