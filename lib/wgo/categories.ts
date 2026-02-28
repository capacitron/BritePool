// WGO Category labels and colors — must match Prisma WGOCategory enum
export const WGO_CATEGORY_LABELS: Record<string, string> = {
  CRYPTO_AI_TRADING: 'Crypto / AI Trading',
  NODES: 'Nodes',
  MEMBERSHIP: 'Membership',
  AI_MARKETING: 'AI Marketing',
  GOLD_RWA: 'Gold / RWA',
  CROWD_FUNDING: 'Crowd Funding',
}

export const WGO_CATEGORY_COLORS: Record<string, string> = {
  CRYPTO_AI_TRADING: 'bg-indigo-100 text-indigo-800',
  NODES: 'bg-cyan-100 text-cyan-800',
  MEMBERSHIP: 'bg-emerald-100 text-emerald-800',
  AI_MARKETING: 'bg-violet-100 text-violet-800',
  GOLD_RWA: 'bg-amber-100 text-amber-800',
  CROWD_FUNDING: 'bg-pink-100 text-pink-800',
}

// Must match Prisma WGOStatus enum
export const WGO_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export const WGO_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-amber-100 text-amber-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export const WGO_CATEGORIES = [
  'CRYPTO_AI_TRADING',
  'NODES',
  'MEMBERSHIP',
  'AI_MARKETING',
  'GOLD_RWA',
  'CROWD_FUNDING',
] as const

export const WGO_STATUSES = ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'] as const
