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
    WEB_STEWARD: 'bg-purple-100 text-purple-800 border-purple-200',
    BOARD_CHAIR: 'bg-amber-100 text-amber-800 border-amber-200',
    COMMITTEE_LEADER: 'bg-blue-100 text-blue-800 border-blue-200',
    CONTENT_MODERATOR: 'bg-teal-100 text-teal-800 border-teal-200',
    SUPPORT_STAFF: 'bg-gray-100 text-gray-800 border-gray-200',
    STEWARD: 'bg-green-100 text-green-800 border-green-200',
    PARTNER: 'bg-orange-100 text-orange-800 border-orange-200',
    RESIDENT: 'bg-stone-100 text-stone-800 border-stone-200',
  }
  return styles[role] || 'bg-gray-100 text-gray-800'
}

export function getRoleDisplayName(role: UserRole): string {
  return role.replace(/_/g, ' ')
}
