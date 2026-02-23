// WGO Category labels and colors — must match Prisma WGOCategory enum
export const WGO_CATEGORY_LABELS: Record<string, string> = {
  REAL_ESTATE: 'Real Estate',
  BUSINESS: 'Business',
  INVESTMENT: 'Investment',
  EDUCATION: 'Education',
  COMMUNITY: 'Community',
}

export const WGO_CATEGORY_COLORS: Record<string, string> = {
  REAL_ESTATE: 'bg-amber-100 text-amber-800',
  BUSINESS: 'bg-indigo-100 text-indigo-800',
  INVESTMENT: 'bg-green-100 text-green-800',
  EDUCATION: 'bg-cyan-100 text-cyan-800',
  COMMUNITY: 'bg-pink-100 text-pink-800',
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
  'REAL_ESTATE',
  'BUSINESS',
  'INVESTMENT',
  'EDUCATION',
  'COMMUNITY',
] as const

export const WGO_STATUSES = ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'] as const
