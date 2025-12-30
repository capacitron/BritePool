// Communal Seat Service Categories and Labels

export const COMMUNAL_SEAT_CATEGORY_LABELS: Record<string, string> = {
  HEALING_SERVICE: 'Healing Service',
  ORGANIZATIONAL_SERVICE: 'Organizational Service',
  CUSTOMER_SERVICE: 'Customer Service',
  TECHNOLOGY_PROVISION: 'Technology Provision Service',
  CULINARY_SERVICE: 'Culinary Service',
  UTILITY_SERVICE: 'Utility Service',
  OCCUPATIONAL_SERVICES: 'Occupational Services',
  AGRICULTURAL_SERVICES: 'Agricultural Services',
  ASSOCIATION_SERVICES: 'Association Services',
}

export const COMMUNAL_SEAT_CATEGORY_COLORS: Record<string, string> = {
  HEALING_SERVICE: 'bg-emerald-100 text-emerald-800',
  ORGANIZATIONAL_SERVICE: 'bg-blue-100 text-blue-800',
  CUSTOMER_SERVICE: 'bg-purple-100 text-purple-800',
  TECHNOLOGY_PROVISION: 'bg-indigo-100 text-indigo-800',
  CULINARY_SERVICE: 'bg-amber-100 text-amber-800',
  UTILITY_SERVICE: 'bg-cyan-100 text-cyan-800',
  OCCUPATIONAL_SERVICES: 'bg-rose-100 text-rose-800',
  AGRICULTURAL_SERVICES: 'bg-green-100 text-green-800',
  ASSOCIATION_SERVICES: 'bg-violet-100 text-violet-800',
}

export const COMMUNAL_SEAT_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  HEALING_SERVICE: 'Practitioners offering healing modalities, wellness services, and therapeutic care',
  ORGANIZATIONAL_SERVICE: 'Administrative, management, and coordination services for the community',
  CUSTOMER_SERVICE: 'Member support, communication, and community relations services',
  TECHNOLOGY_PROVISION: 'IT services, digital platforms, and technical infrastructure support',
  CULINARY_SERVICE: 'Food preparation, catering, and nutritional services',
  UTILITY_SERVICE: 'Essential services including maintenance, utilities, and facility management',
  OCCUPATIONAL_SERVICES: 'Skilled trades and professional occupational services',
  AGRICULTURAL_SERVICES: 'Farming, gardening, and sustainable agriculture practices',
  ASSOCIATION_SERVICES: 'Governance, legal, and association management services',
}

export const COMMUNAL_SEAT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Not Approved',
}

export const COMMUNAL_SEAT_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
}

export const COMMUNAL_SEAT_CATEGORIES = [
  'HEALING_SERVICE',
  'ORGANIZATIONAL_SERVICE',
  'CUSTOMER_SERVICE',
  'TECHNOLOGY_PROVISION',
  'CULINARY_SERVICE',
  'UTILITY_SERVICE',
  'OCCUPATIONAL_SERVICES',
  'AGRICULTURAL_SERVICES',
  'ASSOCIATION_SERVICES',
] as const

export const COMMUNAL_SEAT_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
] as const
