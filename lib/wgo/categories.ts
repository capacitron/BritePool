// WGO Category labels and colors
export const WGO_CATEGORY_LABELS: Record<string, string> = {
  PASSIVE_INCOME: 'Passive Income',
  INVESTMENT_FUND: 'Investment Fund',
  STAKING_YIELD: 'Staking & Yield',
  REAL_ESTATE: 'Real Estate',
  BUSINESS_VENTURE: 'Business Venture',
  EDUCATION_PROGRAM: 'Education Program',
  TRADING_PLATFORM: 'Trading Platform',
  SAVINGS_PROGRAM: 'Savings Program',
  OTHER: 'Other',
}

export const WGO_CATEGORY_COLORS: Record<string, string> = {
  PASSIVE_INCOME: 'bg-emerald-100 text-emerald-800',
  INVESTMENT_FUND: 'bg-blue-100 text-blue-800',
  STAKING_YIELD: 'bg-purple-100 text-purple-800',
  REAL_ESTATE: 'bg-amber-100 text-amber-800',
  BUSINESS_VENTURE: 'bg-indigo-100 text-indigo-800',
  EDUCATION_PROGRAM: 'bg-cyan-100 text-cyan-800',
  TRADING_PLATFORM: 'bg-rose-100 text-rose-800',
  SAVINGS_PROGRAM: 'bg-green-100 text-green-800',
  OTHER: 'bg-gray-100 text-gray-800',
}

export const WGO_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Under Review',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  CLOSED: 'Closed',
  SUSPENDED: 'Suspended',
}

export const WGO_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-blue-100 text-blue-800',
  CLOSED: 'bg-gray-100 text-gray-800',
  SUSPENDED: 'bg-red-100 text-red-800',
}

export const WGO_CATEGORIES = [
  'PASSIVE_INCOME',
  'INVESTMENT_FUND',
  'STAKING_YIELD',
  'REAL_ESTATE',
  'BUSINESS_VENTURE',
  'EDUCATION_PROGRAM',
  'TRADING_PLATFORM',
  'SAVINGS_PROGRAM',
  'OTHER',
] as const

export const WGO_STATUSES = [
  'PENDING',
  'ACTIVE',
  'PAUSED',
  'CLOSED',
  'SUSPENDED',
] as const
