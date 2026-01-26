import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

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

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Re-export all RBAC functions from the single source of truth
export {
  ROLE_HIERARCHY,
  ROLE_HIERARCHY_ORDERED,
  ADMIN_ROLES,
  PERMISSIONS,
  type PermissionKey,
  hasMinimumRole,
  hasPermission,
  isAdmin,
  isAdminRole,
  canManageUsers,
  canModerateContent,
  canManageCommittees,
  getAssignableRoles,
  canAssignRole,
  getRoleBadgeStyles,
  getRoleDisplayName,
} from '@/lib/auth/roles'
