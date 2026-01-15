import { NextResponse } from 'next/server'
import { ZodError, type ZodSchema } from 'zod'
import { auth } from './auth'
import type { UserRole } from '@prisma/client'

// TEMPORARY: Set to true to bypass all API authentication checks
// TODO: Set back to false when done testing
const BYPASS_API_AUTH = true

// Mock admin user for bypass mode
const BYPASS_USER = {
  id: 'bypass-admin-user',
  email: 'admin@bypass.local',
  name: 'Bypass Admin',
  role: 'WEB_STEWARD' as UserRole,
  status: 'ACTIVE',
}

// Standard API response types
interface ApiSuccessResponse<T> {
  success: true
  data: T
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// HTTP Status codes
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const

// Error codes
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

// Success response helper
export function successResponse<T>(
  data: T,
  meta?: ApiSuccessResponse<T>['meta'],
  status: number = HttpStatus.OK
): NextResponse<ApiResponse<T>> {
  const response: ApiSuccessResponse<T> = { success: true, data }
  if (meta) response.meta = meta
  return NextResponse.json(response, { status })
}

// Error response helper
export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, string[]>
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error: { code, message },
  }
  if (details) response.error.details = details
  return NextResponse.json(response, { status })
}

// Common error responses
export function validationError(errors: Record<string, string[]>) {
  return errorResponse(
    ErrorCode.VALIDATION_ERROR,
    'Validation failed',
    HttpStatus.BAD_REQUEST,
    errors
  )
}

export function unauthorizedError(message = 'Authentication required') {
  return errorResponse(ErrorCode.UNAUTHORIZED, message, HttpStatus.UNAUTHORIZED)
}

export function forbiddenError(message = 'You do not have permission to perform this action') {
  return errorResponse(ErrorCode.FORBIDDEN, message, HttpStatus.FORBIDDEN)
}

export function notFoundError(resource = 'Resource') {
  return errorResponse(ErrorCode.NOT_FOUND, `${resource} not found`, HttpStatus.NOT_FOUND)
}

export function conflictError(message: string) {
  return errorResponse(ErrorCode.CONFLICT, message, HttpStatus.CONFLICT)
}

export function rateLimitError(message = 'Too many requests. Please try again later.') {
  return errorResponse(ErrorCode.RATE_LIMITED, message, HttpStatus.TOO_MANY_REQUESTS)
}

export function internalError(message = 'An unexpected error occurred') {
  return errorResponse(ErrorCode.INTERNAL_ERROR, message, HttpStatus.INTERNAL_SERVER_ERROR)
}

// Zod validation helper
export function parseZodError(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const path = issue.path.join('.')
    if (!errors[path]) errors[path] = []
    errors[path].push(issue.message)
  }
  return errors
}

// Validate request body with Zod schema
export async function validateBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse<ApiErrorResponse> }> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { data, error: null }
  } catch (error) {
    if (error instanceof ZodError) {
      return { data: null, error: validationError(parseZodError(error)) }
    }
    if (error instanceof SyntaxError) {
      return { data: null, error: validationError({ body: ['Invalid JSON'] }) }
    }
    throw error
  }
}

// Validate query parameters with Zod schema
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): { data: T; error: null } | { data: null; error: NextResponse<ApiErrorResponse> } {
  try {
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })
    const data = schema.parse(params)
    return { data, error: null }
  } catch (error) {
    if (error instanceof ZodError) {
      return { data: null, error: validationError(parseZodError(error)) }
    }
    throw error
  }
}

// Auth middleware helper
interface AuthResult {
  user: {
    id: string
    email: string
    name: string
    role: UserRole
    status: string
  }
}

export async function requireAuth(): Promise<
  { auth: AuthResult; error: null } | { auth: null; error: NextResponse<ApiErrorResponse> }
> {
  // TEMPORARY: Bypass authentication when enabled
  if (BYPASS_API_AUTH) {
    return { auth: { user: BYPASS_USER }, error: null }
  }

  const session = await auth()

  if (!session?.user) {
    return { auth: null, error: unauthorizedError() }
  }

  return { auth: { user: session.user }, error: null }
}

// Role-based auth helper
export async function requireRole(
  allowedRoles: UserRole[]
): Promise<
  { auth: AuthResult; error: null } | { auth: null; error: NextResponse<ApiErrorResponse> }
> {
  const { auth: authResult, error } = await requireAuth()

  if (error) return { auth: null, error }

  if (!allowedRoles.includes(authResult.user.role)) {
    return { auth: null, error: forbiddenError() }
  }

  return { auth: authResult, error: null }
}

// Admin role check
export async function requireAdmin(): Promise<
  { auth: AuthResult; error: null } | { auth: null; error: NextResponse<ApiErrorResponse> }
> {
  return requireRole(['WEB_STEWARD', 'BOARD_CHAIR'])
}

// Moderator role check (includes admins)
export async function requireModerator(): Promise<
  { auth: AuthResult; error: null } | { auth: null; error: NextResponse<ApiErrorResponse> }
> {
  return requireRole(['CONTENT_MODERATOR', 'WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER'])
}

// Safe error logging (removes sensitive data)
export function logError(error: unknown, context?: Record<string, unknown>) {
  const sanitizedContext = context ? { ...context } : {}

  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization']
  for (const field of sensitiveFields) {
    if (field in sanitizedContext) {
      sanitizedContext[field] = '[REDACTED]'
    }
  }

  console.error('API Error:', {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    context: sanitizedContext,
    timestamp: new Date().toISOString(),
  })
}

// Wrap async handler with error handling
export function withErrorHandling<T>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ApiErrorResponse>> {
  return handler().catch((error) => {
    logError(error)
    return internalError()
  })
}
