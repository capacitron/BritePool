/**
 * BritePool Design System Utilities
 *
 * Centralizes color mappings for consistent UI across the application.
 * Uses the Forest Wealth design system: forest (primary), earth (accent), sand (secondary)
 */

// =============================================================================
// Status Colors - For approval states, content moderation, etc.
// =============================================================================

export type StatusType =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'DRAFT'
  | 'PUBLISHED'
  | 'ARCHIVED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'IN_PROGRESS'
  | 'TODO'

export interface StatusColors {
  bg: string
  text: string
  border: string
  dot: string
}

export const statusColors: Record<StatusType, StatusColors> = {
  // Positive states - Forest green
  APPROVED: {
    bg: 'bg-forest-100',
    text: 'text-forest-700',
    border: 'border-forest-300',
    dot: 'bg-forest-500',
  },
  ACTIVE: {
    bg: 'bg-forest-100',
    text: 'text-forest-700',
    border: 'border-forest-300',
    dot: 'bg-forest-500',
  },
  PUBLISHED: {
    bg: 'bg-forest-100',
    text: 'text-forest-700',
    border: 'border-forest-300',
    dot: 'bg-forest-500',
  },
  COMPLETED: {
    bg: 'bg-forest-100',
    text: 'text-forest-700',
    border: 'border-forest-300',
    dot: 'bg-forest-500',
  },

  // Warning/Pending states - Sand/amber
  PENDING: {
    bg: 'bg-sand-100',
    text: 'text-sand-800',
    border: 'border-sand-300',
    dot: 'bg-sand-500',
  },
  DRAFT: {
    bg: 'bg-sand-100',
    text: 'text-sand-800',
    border: 'border-sand-300',
    dot: 'bg-sand-500',
  },
  IN_PROGRESS: {
    bg: 'bg-sand-100',
    text: 'text-sand-800',
    border: 'border-sand-300',
    dot: 'bg-sand-500',
  },
  TODO: {
    bg: 'bg-sand-50',
    text: 'text-sand-700',
    border: 'border-sand-200',
    dot: 'bg-sand-400',
  },

  // Negative states - Earth (warm red/orange)
  REJECTED: {
    bg: 'bg-earth-100',
    text: 'text-earth-700',
    border: 'border-earth-300',
    dot: 'bg-earth-500',
  },
  CANCELLED: {
    bg: 'bg-earth-100',
    text: 'text-earth-700',
    border: 'border-earth-300',
    dot: 'bg-earth-500',
  },

  // Neutral states - Gray
  INACTIVE: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-300',
    dot: 'bg-gray-400',
  },
  ARCHIVED: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-300',
    dot: 'bg-gray-400',
  },
}

export function getStatusColors(status: string): StatusColors {
  return (
    statusColors[status as StatusType] || {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      border: 'border-gray-300',
      dot: 'bg-gray-400',
    }
  )
}

// =============================================================================
// Priority Colors - For task priorities
// =============================================================================

export type PriorityType = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface PriorityColors {
  bg: string
  text: string
  border: string
}

export const priorityColors: Record<PriorityType, PriorityColors> = {
  LOW: {
    bg: 'bg-forest-50',
    text: 'text-forest-600',
    border: 'border-forest-200',
  },
  MEDIUM: {
    bg: 'bg-sand-100',
    text: 'text-sand-700',
    border: 'border-sand-300',
  },
  HIGH: {
    bg: 'bg-earth-100',
    text: 'text-earth-600',
    border: 'border-earth-300',
  },
  URGENT: {
    bg: 'bg-earth-200',
    text: 'text-earth-800',
    border: 'border-earth-400',
  },
}

export function getPriorityColors(priority: string): PriorityColors {
  return (
    priorityColors[priority as PriorityType] || {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      border: 'border-gray-300',
    }
  )
}

// =============================================================================
// Category Colors - For committees, courses, events, etc.
// =============================================================================

export type CategoryType =
  | 'GOVERNANCE'
  | 'WEALTH'
  | 'EDUCATION'
  | 'HEALTH'
  | 'OPERATIONS'
  | 'COMMUNITY'
  | 'FINANCIAL'
  | 'LEGAL'
  | 'OPERATIONAL'
  | 'EMPOWERMENT'
  | 'LEADERSHIP'
  | 'WELLNESS'
  | 'FINANCE'
  | 'STEWARDSHIP'
  | 'OTHER'

export interface CategoryColors {
  bg: string
  light: string
  text: string
  border: string
  icon: string
}

export const categoryColors: Record<CategoryType, CategoryColors> = {
  // Primary categories - Forest variations
  GOVERNANCE: {
    bg: 'bg-forest-600',
    light: 'bg-forest-50',
    text: 'text-forest-700',
    border: 'border-forest-300',
    icon: 'text-forest-500',
  },
  OPERATIONS: {
    bg: 'bg-forest-500',
    light: 'bg-forest-50',
    text: 'text-forest-700',
    border: 'border-forest-200',
    icon: 'text-forest-500',
  },
  OPERATIONAL: {
    bg: 'bg-forest-500',
    light: 'bg-forest-50',
    text: 'text-forest-700',
    border: 'border-forest-200',
    icon: 'text-forest-500',
  },

  // Financial categories - Earth tones
  WEALTH: {
    bg: 'bg-earth-500',
    light: 'bg-earth-50',
    text: 'text-earth-700',
    border: 'border-earth-300',
    icon: 'text-earth-500',
  },
  FINANCIAL: {
    bg: 'bg-earth-500',
    light: 'bg-earth-50',
    text: 'text-earth-700',
    border: 'border-earth-300',
    icon: 'text-earth-500',
  },
  FINANCE: {
    bg: 'bg-earth-500',
    light: 'bg-earth-50',
    text: 'text-earth-700',
    border: 'border-earth-300',
    icon: 'text-earth-500',
  },

  // Education categories - Sand tones
  EDUCATION: {
    bg: 'bg-sand-500',
    light: 'bg-sand-50',
    text: 'text-sand-800',
    border: 'border-sand-300',
    icon: 'text-sand-600',
  },
  EMPOWERMENT: {
    bg: 'bg-sand-500',
    light: 'bg-sand-50',
    text: 'text-sand-800',
    border: 'border-sand-300',
    icon: 'text-sand-600',
  },
  LEADERSHIP: {
    bg: 'bg-sand-600',
    light: 'bg-sand-50',
    text: 'text-sand-800',
    border: 'border-sand-300',
    icon: 'text-sand-600',
  },
  STEWARDSHIP: {
    bg: 'bg-sand-600',
    light: 'bg-sand-50',
    text: 'text-sand-800',
    border: 'border-sand-300',
    icon: 'text-sand-600',
  },

  // Health/Wellness - Soft forest
  HEALTH: {
    bg: 'bg-forest-400',
    light: 'bg-forest-50',
    text: 'text-forest-600',
    border: 'border-forest-200',
    icon: 'text-forest-400',
  },
  WELLNESS: {
    bg: 'bg-forest-400',
    light: 'bg-forest-50',
    text: 'text-forest-600',
    border: 'border-forest-200',
    icon: 'text-forest-400',
  },

  // Community - Warm earth
  COMMUNITY: {
    bg: 'bg-earth-400',
    light: 'bg-earth-50',
    text: 'text-earth-600',
    border: 'border-earth-200',
    icon: 'text-earth-400',
  },

  // Legal - Dark bark
  LEGAL: {
    bg: 'bg-bark',
    light: 'bg-sand-50',
    text: 'text-bark',
    border: 'border-sand-300',
    icon: 'text-bark',
  },

  // Other/Default
  OTHER: {
    bg: 'bg-gray-500',
    light: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-300',
    icon: 'text-gray-500',
  },
}

export function getCategoryColors(category: string): CategoryColors {
  return (
    categoryColors[category as CategoryType] || {
      bg: 'bg-gray-500',
      light: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-300',
      icon: 'text-gray-500',
    }
  )
}

// =============================================================================
// Pool Colors - Distinct colors for investment pool visualization
// =============================================================================

export type PoolColorType = 'PURPLE' | 'ORANGE' | 'GREEN' | 'BLUE'

export interface PoolColors {
  bg: string
  light: string
  border: string
  text: string
  hover: string
  ring: string
}

export const poolColors: Record<PoolColorType, PoolColors> = {
  PURPLE: {
    bg: 'bg-forest-600',
    light: 'bg-forest-50',
    border: 'border-forest-300',
    text: 'text-forest-700',
    hover: 'hover:bg-forest-50 hover:border-forest-400',
    ring: 'ring-forest-500',
  },
  ORANGE: {
    bg: 'bg-earth-500',
    light: 'bg-earth-50',
    border: 'border-earth-300',
    text: 'text-earth-700',
    hover: 'hover:bg-earth-50 hover:border-earth-400',
    ring: 'ring-earth-500',
  },
  GREEN: {
    bg: 'bg-forest-500',
    light: 'bg-forest-100',
    border: 'border-forest-400',
    text: 'text-forest-800',
    hover: 'hover:bg-forest-100 hover:border-forest-500',
    ring: 'ring-forest-600',
  },
  BLUE: {
    bg: 'bg-sand-500',
    light: 'bg-sand-50',
    border: 'border-sand-300',
    text: 'text-sand-800',
    hover: 'hover:bg-sand-50 hover:border-sand-400',
    ring: 'ring-sand-500',
  },
}

export function getPoolColors(color: string): PoolColors {
  return (
    poolColors[color as PoolColorType] || {
      bg: 'bg-gray-500',
      light: 'bg-gray-50',
      border: 'border-gray-300',
      text: 'text-gray-700',
      hover: 'hover:bg-gray-50 hover:border-gray-400',
      ring: 'ring-gray-500',
    }
  )
}

// =============================================================================
// Event Type Colors
// =============================================================================

export type EventType =
  | 'COMMITTEE_MEETING'
  | 'WORKSHOP'
  | 'SANCTUARY_EVENT'
  | 'VIRTUAL_WEBINAR'

export const eventTypeColors: Record<EventType, CategoryColors> = {
  COMMITTEE_MEETING: {
    bg: 'bg-forest-500',
    light: 'bg-forest-50',
    text: 'text-forest-700',
    border: 'border-forest-300',
    icon: 'text-forest-500',
  },
  WORKSHOP: {
    bg: 'bg-sand-500',
    light: 'bg-sand-50',
    text: 'text-sand-800',
    border: 'border-sand-300',
    icon: 'text-sand-600',
  },
  SANCTUARY_EVENT: {
    bg: 'bg-earth-500',
    light: 'bg-earth-50',
    text: 'text-earth-700',
    border: 'border-earth-300',
    icon: 'text-earth-500',
  },
  VIRTUAL_WEBINAR: {
    bg: 'bg-forest-400',
    light: 'bg-forest-50',
    text: 'text-forest-600',
    border: 'border-forest-200',
    icon: 'text-forest-400',
  },
}

export function getEventTypeColors(type: string): CategoryColors {
  return (
    eventTypeColors[type as EventType] || {
      bg: 'bg-gray-500',
      light: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-300',
      icon: 'text-gray-500',
    }
  )
}

// =============================================================================
// Subscription Tier Colors
// =============================================================================

export type SubscriptionTier = 'FREE' | 'BASIC' | 'PREMIUM' | 'PLATINUM'

export const subscriptionTierColors: Record<SubscriptionTier, CategoryColors> = {
  FREE: {
    bg: 'bg-gray-500',
    light: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-300',
    icon: 'text-gray-500',
  },
  BASIC: {
    bg: 'bg-forest-500',
    light: 'bg-forest-50',
    text: 'text-forest-700',
    border: 'border-forest-300',
    icon: 'text-forest-500',
  },
  PREMIUM: {
    bg: 'bg-earth-500',
    light: 'bg-earth-50',
    text: 'text-earth-700',
    border: 'border-earth-300',
    icon: 'text-earth-500',
  },
  PLATINUM: {
    bg: 'bg-sand-700',
    light: 'bg-sand-100',
    text: 'text-sand-900',
    border: 'border-sand-400',
    icon: 'text-sand-700',
  },
}

export function getSubscriptionTierColors(tier: string): CategoryColors {
  return (
    subscriptionTierColors[tier as SubscriptionTier] || {
      bg: 'bg-gray-500',
      light: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-300',
      icon: 'text-gray-500',
    }
  )
}

// =============================================================================
// User Role Colors
// =============================================================================

export type UserRoleType =
  | 'WEB_STEWARD'
  | 'BOARD_CHAIR'
  | 'COMMITTEE_LEADER'
  | 'CONTENT_MODERATOR'
  | 'SUPPORT_STAFF'
  | 'STEWARD'
  | 'PARTNER'
  | 'RESIDENT'

export const userRoleColors: Record<UserRoleType, CategoryColors> = {
  WEB_STEWARD: {
    bg: 'bg-forest-700',
    light: 'bg-forest-50',
    text: 'text-forest-800',
    border: 'border-forest-400',
    icon: 'text-forest-600',
  },
  BOARD_CHAIR: {
    bg: 'bg-earth-600',
    light: 'bg-earth-50',
    text: 'text-earth-800',
    border: 'border-earth-400',
    icon: 'text-earth-600',
  },
  COMMITTEE_LEADER: {
    bg: 'bg-sand-600',
    light: 'bg-sand-50',
    text: 'text-sand-800',
    border: 'border-sand-400',
    icon: 'text-sand-600',
  },
  CONTENT_MODERATOR: {
    bg: 'bg-forest-500',
    light: 'bg-forest-50',
    text: 'text-forest-700',
    border: 'border-forest-300',
    icon: 'text-forest-500',
  },
  SUPPORT_STAFF: {
    bg: 'bg-sand-500',
    light: 'bg-sand-50',
    text: 'text-sand-700',
    border: 'border-sand-300',
    icon: 'text-sand-500',
  },
  STEWARD: {
    bg: 'bg-forest-400',
    light: 'bg-forest-50',
    text: 'text-forest-600',
    border: 'border-forest-200',
    icon: 'text-forest-400',
  },
  PARTNER: {
    bg: 'bg-earth-400',
    light: 'bg-earth-50',
    text: 'text-earth-600',
    border: 'border-earth-200',
    icon: 'text-earth-400',
  },
  RESIDENT: {
    bg: 'bg-sand-400',
    light: 'bg-sand-50',
    text: 'text-sand-600',
    border: 'border-sand-200',
    icon: 'text-sand-400',
  },
}

export function getUserRoleColors(role: string): CategoryColors {
  return (
    userRoleColors[role as UserRoleType] || {
      bg: 'bg-gray-500',
      light: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-300',
      icon: 'text-gray-500',
    }
  )
}
