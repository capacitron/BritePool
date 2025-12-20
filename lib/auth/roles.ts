import { UserRole } from '@prisma/client'

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

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function isAdmin(role: UserRole): boolean {
  return hasPermission(role, 'BOARD_CHAIR')
}

export function canManageUsers(role: UserRole): boolean {
  return hasPermission(role, 'BOARD_CHAIR')
}

export function canModerateContent(role: UserRole): boolean {
  return hasPermission(role, 'CONTENT_MODERATOR')
}

export function canManageCommittees(role: UserRole): boolean {
  return hasPermission(role, 'COMMITTEE_LEADER')
}

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

export function getRoleDisplayName(role: UserRole): string {
  return role.replace(/_/g, ' ')
}
