import bcrypt from 'bcryptjs'
import type { UserRole } from '@prisma/client'

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Role hierarchy - higher index = more permissions
const ROLE_HIERARCHY: UserRole[] = [
  'RESIDENT',
  'PARTNER',
  'STEWARD',
  'SUPPORT_STAFF',
  'CONTENT_MODERATOR',
  'COMMITTEE_LEADER',
  'BOARD_CHAIR',
  'WEB_STEWARD',
]

// Admin roles that can access /dashboard/admin
export const ADMIN_ROLES: UserRole[] = [
  'WEB_STEWARD',
  'BOARD_CHAIR',
  'COMMITTEE_LEADER',
  'CONTENT_MODERATOR',
  'SUPPORT_STAFF',
]

export function isAdminRole(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role)
}

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole)
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole)
  return userIndex >= requiredIndex
}

// Permission definitions for specific actions
export const PERMISSIONS = {
  // User management
  viewUsers: ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER', 'SUPPORT_STAFF'] as UserRole[],
  createUsers: ['WEB_STEWARD', 'BOARD_CHAIR'] as UserRole[],
  editUsers: ['WEB_STEWARD', 'BOARD_CHAIR'] as UserRole[],
  deleteUsers: ['WEB_STEWARD'] as UserRole[],
  changeRoles: ['WEB_STEWARD', 'BOARD_CHAIR'] as UserRole[],

  // Content moderation
  viewModeration: ['WEB_STEWARD', 'BOARD_CHAIR', 'CONTENT_MODERATOR'] as UserRole[],
  approveContent: ['WEB_STEWARD', 'BOARD_CHAIR', 'CONTENT_MODERATOR'] as UserRole[],
  editContent: ['WEB_STEWARD', 'BOARD_CHAIR', 'CONTENT_MODERATOR'] as UserRole[],
  deleteContent: ['WEB_STEWARD', 'BOARD_CHAIR'] as UserRole[],

  // Audit logs
  viewAuditLogs: ['WEB_STEWARD', 'BOARD_CHAIR'] as UserRole[],
  exportAuditLogs: ['WEB_STEWARD'] as UserRole[],

  // System settings
  viewSettings: ['WEB_STEWARD'] as UserRole[],
  editSettings: ['WEB_STEWARD'] as UserRole[],

  // Committees
  viewCommittees: ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER'] as UserRole[],
  manageCommittees: ['WEB_STEWARD', 'BOARD_CHAIR'] as UserRole[],
} as const

export function hasPermission(userRole: UserRole, permission: keyof typeof PERMISSIONS): boolean {
  return PERMISSIONS[permission].includes(userRole)
}

// Roles that a user with a given role can assign to others
export function getAssignableRoles(userRole: UserRole): UserRole[] {
  switch (userRole) {
    case 'WEB_STEWARD':
      return ROLE_HIERARCHY // Can assign any role
    case 'BOARD_CHAIR':
      return [
        'RESIDENT',
        'PARTNER',
        'STEWARD',
        'SUPPORT_STAFF',
        'CONTENT_MODERATOR',
        'COMMITTEE_LEADER',
      ]
    case 'COMMITTEE_LEADER':
      return ['RESIDENT', 'PARTNER', 'STEWARD'] // Committee members only
    default:
      return []
  }
}

export function canAssignRole(assignerRole: UserRole, targetRole: UserRole): boolean {
  return getAssignableRoles(assignerRole).includes(targetRole)
}

// Password validation
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
