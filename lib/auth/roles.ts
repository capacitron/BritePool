import { UserRole } from '@prisma/client'

/**
 * RBAC (Role-Based Access Control) - Single Source of Truth
 * All role and permission logic should be defined here.
 */

// Role hierarchy - higher number = more permissions
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  WEB_STEWARD: 8,
  BOARD_CHAIR: 7,
  COMMITTEE_LEADER: 6,
  CONTENT_MODERATOR: 5,
  SUPPORT_STAFF: 4,
  STEWARD: 3,
  PARTNER: 2,
  RESIDENT: 1,
}

// Ordered role array for iteration (lowest to highest)
export const ROLE_HIERARCHY_ORDERED: UserRole[] = [
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

export type PermissionKey = keyof typeof PERMISSIONS

/**
 * Check if a user has at least the required role level
 */
export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userRole: UserRole, permission: PermissionKey): boolean {
  return PERMISSIONS[permission].includes(userRole)
}

/**
 * Check if role is an admin role (BOARD_CHAIR or higher)
 */
export function isAdmin(role: UserRole): boolean {
  return hasMinimumRole(role, 'BOARD_CHAIR')
}

/**
 * Alias for isAdmin - backward compatibility
 */
export function isAdminRole(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role)
}

/**
 * Check if role can manage users
 */
export function canManageUsers(role: UserRole): boolean {
  return hasMinimumRole(role, 'BOARD_CHAIR')
}

/**
 * Check if role can moderate content
 */
export function canModerateContent(role: UserRole): boolean {
  return hasMinimumRole(role, 'CONTENT_MODERATOR')
}

/**
 * Check if role can manage committees
 */
export function canManageCommittees(role: UserRole): boolean {
  return hasMinimumRole(role, 'COMMITTEE_LEADER')
}

/**
 * Get roles that a user with a given role can assign to others
 */
export function getAssignableRoles(userRole: UserRole): UserRole[] {
  switch (userRole) {
    case 'WEB_STEWARD':
      return ROLE_HIERARCHY_ORDERED // Can assign any role
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

/**
 * Check if a user can assign a specific role to another user
 */
export function canAssignRole(assignerRole: UserRole, targetRole: UserRole): boolean {
  return getAssignableRoles(assignerRole).includes(targetRole)
}

/**
 * Get CSS classes for role badge styling
 */
export function getRoleBadgeStyles(role: UserRole): string {
  const styles: Record<UserRole, string> = {
    WEB_STEWARD: 'bg-earth-100 text-earth-700 border-earth-300',
    BOARD_CHAIR: 'bg-sand-200 text-sand-800 border-sand-400',
    COMMITTEE_LEADER: 'bg-forest-100 text-forest-700 border-forest-300',
    CONTENT_MODERATOR: 'bg-forest-50 text-forest-600 border-forest-200',
    SUPPORT_STAFF: 'bg-sand-100 text-sand-700 border-sand-300',
    STEWARD: 'bg-forest-100 text-forest-800 border-forest-300',
    PARTNER: 'bg-earth-50 text-earth-600 border-earth-200',
    RESIDENT: 'bg-sand-50 text-sand-600 border-sand-200',
  }
  return styles[role] || 'bg-sand-100 text-sand-700 border-sand-200'
}

/**
 * Get display name for role (replaces underscores with spaces)
 */
export function getRoleDisplayName(role: UserRole): string {
  return role.replace(/_/g, ' ')
}
