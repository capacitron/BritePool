import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Recreate validation schemas for testing
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueDate: z.string().datetime().optional(),
})

describe('Login Validation', () => {
  it('should accept valid login credentials', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'invalid-email',
      password: 'password123',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid email address')
    }
  })

  it('should reject empty password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('Registration Validation', () => {
  const validData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'Password123',
    confirmPassword: 'Password123',
  }

  it('should accept valid registration data', () => {
    const result = registerSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should reject short first name', () => {
    const result = registerSchema.safeParse({
      ...validData,
      firstName: 'J',
    })
    expect(result.success).toBe(false)
  })

  it('should reject password without uppercase', () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: 'password123',
      confirmPassword: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('should reject password without number', () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: 'PasswordABC',
      confirmPassword: 'PasswordABC',
    })
    expect(result.success).toBe(false)
  })

  it('should reject mismatched passwords', () => {
    const result = registerSchema.safeParse({
      ...validData,
      confirmPassword: 'DifferentPassword123',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const confirmError = result.error.issues.find((i) => i.path[0] === 'confirmPassword')
      expect(confirmError?.message).toBe('Passwords do not match')
    }
  })
})

describe('Task Validation', () => {
  it('should accept valid task data', () => {
    const result = taskSchema.safeParse({
      title: 'Complete project documentation',
      description: 'Write comprehensive docs for the API',
      status: 'PENDING',
      priority: 'HIGH',
    })
    expect(result.success).toBe(true)
  })

  it('should reject empty title', () => {
    const result = taskSchema.safeParse({
      title: '',
      status: 'PENDING',
      priority: 'MEDIUM',
    })
    expect(result.success).toBe(false)
  })

  it('should reject title over 200 characters', () => {
    const result = taskSchema.safeParse({
      title: 'A'.repeat(201),
      status: 'PENDING',
      priority: 'MEDIUM',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid status', () => {
    const result = taskSchema.safeParse({
      title: 'Valid title',
      status: 'INVALID_STATUS',
      priority: 'MEDIUM',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid priority', () => {
    const result = taskSchema.safeParse({
      title: 'Valid title',
      status: 'PENDING',
      priority: 'INVALID_PRIORITY',
    })
    expect(result.success).toBe(false)
  })

  it('should allow optional description', () => {
    const result = taskSchema.safeParse({
      title: 'Task without description',
      status: 'IN_PROGRESS',
      priority: 'LOW',
    })
    expect(result.success).toBe(true)
  })
})
