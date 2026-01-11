import { prisma } from './prisma'
import type { AuditAction, ResourceType, UserRole, Prisma } from '@prisma/client'

interface AuditLogInput {
  userId: string
  userRole: UserRole
  action: AuditAction
  resourceType: ResourceType
  resourceId?: string
  description: string
  metadata?: Prisma.InputJsonValue
  oldValue?: Prisma.InputJsonValue
  newValue?: Prisma.InputJsonValue
  ipAddress: string
  userAgent?: string
  sessionId?: string
}

export async function createAuditLog(input: AuditLogInput) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: input.userId,
        userRole: input.userRole,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        description: input.description,
        metadata: input.metadata,
        oldValue: input.oldValue,
        newValue: input.newValue,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        sessionId: input.sessionId,
      },
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw - audit logging should not break the main operation
    return null
  }
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() ?? forwardedFor
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return '127.0.0.1'
}

export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined
}

// Helper functions for common audit events
export async function logUserCreated(
  adminId: string,
  adminRole: UserRole,
  newUserId: string,
  newUserEmail: string,
  newUserRole: UserRole,
  request: Request
) {
  return createAuditLog({
    userId: adminId,
    userRole: adminRole,
    action: 'USER_CREATED',
    resourceType: 'USER',
    resourceId: newUserId,
    description: `Created user ${newUserEmail} with role ${newUserRole}`,
    newValue: { email: newUserEmail, role: newUserRole },
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  })
}

export async function logRoleChanged(
  adminId: string,
  adminRole: UserRole,
  targetUserId: string,
  targetUserEmail: string,
  oldRole: UserRole,
  newRole: UserRole,
  request: Request
) {
  return createAuditLog({
    userId: adminId,
    userRole: adminRole,
    action: 'ROLE_CHANGED',
    resourceType: 'USER',
    resourceId: targetUserId,
    description: `Changed role for ${targetUserEmail} from ${oldRole} to ${newRole}`,
    oldValue: { role: oldRole },
    newValue: { role: newRole },
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  })
}

export async function logContentApproved(
  moderatorId: string,
  moderatorRole: UserRole,
  contentType: 'FORUM_POST' | 'MEDIA',
  contentId: string,
  request: Request
) {
  return createAuditLog({
    userId: moderatorId,
    userRole: moderatorRole,
    action: 'CONTENT_APPROVED',
    resourceType: contentType,
    resourceId: contentId,
    description: `Approved ${contentType.toLowerCase().replace('_', ' ')} ${contentId}`,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  })
}

export async function logContentRejected(
  moderatorId: string,
  moderatorRole: UserRole,
  contentType: 'FORUM_POST' | 'MEDIA',
  contentId: string,
  reason: string,
  request: Request
) {
  return createAuditLog({
    userId: moderatorId,
    userRole: moderatorRole,
    action: 'CONTENT_REJECTED',
    resourceType: contentType,
    resourceId: contentId,
    description: `Rejected ${contentType.toLowerCase().replace('_', ' ')} ${contentId}`,
    metadata: { reason },
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  })
}

export async function logLoginSuccess(userId: string, userRole: UserRole, request: Request) {
  return createAuditLog({
    userId,
    userRole,
    action: 'LOGIN_SUCCESS',
    resourceType: 'USER',
    resourceId: userId,
    description: 'User logged in successfully',
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  })
}

export async function logLoginFailed(email: string, request: Request) {
  return createAuditLog({
    userId: 'anonymous',
    userRole: 'RESIDENT',
    action: 'LOGIN_FAILED',
    resourceType: 'USER',
    description: `Failed login attempt for ${email}`,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  })
}

export async function logPoolCreated(
  userId: string,
  userRole: UserRole,
  poolId: string,
  poolName: string,
  request: Request
) {
  return createAuditLog({
    userId,
    userRole,
    action: 'POOL_CREATED',
    resourceType: 'POOL',
    resourceId: poolId,
    description: `Created pool "${poolName}"`,
    newValue: { name: poolName },
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  })
}

export async function logWGOCreated(
  userId: string,
  userRole: UserRole,
  wgoId: string,
  wgoTitle: string,
  wgoCategory: string,
  request: Request
) {
  return createAuditLog({
    userId,
    userRole,
    action: 'WGO_CREATED',
    resourceType: 'WGO',
    resourceId: wgoId,
    description: `Created wealth opportunity "${wgoTitle}"`,
    newValue: { title: wgoTitle, category: wgoCategory },
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  })
}

export async function logUserUpdated(
  adminId: string,
  adminRole: UserRole,
  targetUserId: string,
  targetUserEmail: string,
  changes: Record<string, { old: unknown; new: unknown }>,
  request: Request
) {
  const changeDescriptions = Object.entries(changes)
    .map(([field, { old: oldVal, new: newVal }]) => `${field}: ${oldVal} → ${newVal}`)
    .join(', ')

  return createAuditLog({
    userId: adminId,
    userRole: adminRole,
    action: 'USER_UPDATED',
    resourceType: 'USER',
    resourceId: targetUserId,
    description: `Updated user ${targetUserEmail}: ${changeDescriptions}`,
    oldValue: Object.fromEntries(
      Object.entries(changes).map(([k, v]) => [k, v.old])
    ) as Prisma.InputJsonValue,
    newValue: Object.fromEntries(
      Object.entries(changes).map(([k, v]) => [k, v.new])
    ) as Prisma.InputJsonValue,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  })
}

export async function logUserSuspended(
  adminId: string,
  adminRole: UserRole,
  targetUserId: string,
  targetUserEmail: string,
  request: Request
) {
  return createAuditLog({
    userId: adminId,
    userRole: adminRole,
    action: 'USER_SUSPENDED',
    resourceType: 'USER',
    resourceId: targetUserId,
    description: `Suspended user ${targetUserEmail}`,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  })
}
