import { z } from 'zod'

// Pool schemas
export const createPoolSchema = z.object({
  name: z.string().min(1, 'Pool name is required').max(200),
  description: z.string().max(2000).optional(),
  goalAmount: z.number().positive('Goal amount must be positive'),
})

export const updatePoolSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['OPEN', 'GOAL_REACHED', 'CLOSED']).optional(),
})

// Cut schemas
export const createCutSchema = z.object({
  color: z.enum(['PURPLE', 'ORANGE', 'GREEN']),
  password: z.string().min(6, 'Password must be at least 6 characters').max(50),
  overseerId: z.string().cuid('Invalid overseer ID'),
})

export const verifyCutPasswordSchema = z.object({
  password: z.string().min(1, 'Password is required'),
})

// Invitation schemas
export const createInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  expiresInDays: z.number().int().min(1).max(30).default(7),
})

// Pledge schemas
export const createPledgeSchema = z.object({
  cutId: z.string().cuid('Invalid cut ID'),
  amount: z.number().positive('Pledge amount must be positive'),
})

export const updatePledgeSchema = z.object({
  status: z.enum(['PENDING', 'COMMITTED', 'PAID', 'CANCELLED']),
  paymentRef: z.string().optional(),
})

// Type exports
export type CreatePoolInput = z.infer<typeof createPoolSchema>
export type UpdatePoolInput = z.infer<typeof updatePoolSchema>
export type CreateCutInput = z.infer<typeof createCutSchema>
export type VerifyCutPasswordInput = z.infer<typeof verifyCutPasswordSchema>
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>
export type CreatePledgeInput = z.infer<typeof createPledgeSchema>
export type UpdatePledgeInput = z.infer<typeof updatePledgeSchema>
