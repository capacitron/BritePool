import { CommitteeType } from '@prisma/client'

// Event categories by committee type
export const EVENT_CATEGORIES_BY_COMMITTEE: Record<CommitteeType, readonly string[]> = {
  GOVERNANCE: ['AGREEMENTS', 'VOTING', 'MEETINGS'] as const,
  WEALTH: ['STAKEHOLDER', 'INVESTMENT_REVIEW', 'TREASURER'] as const,
  EDUCATION: ['WORKSHOP_COORDINATION', 'TEACHER_ORIENTATION', 'LECTURES_TOPIC_REVIEWS'] as const,
  HEALTH: ['WELLNESS_ACTIVITIES', 'WELLNESS_OFFERINGS'] as const,
  OPERATIONS: ['FACILITY_MAINTENANCE', 'LOGISTICS_COORDINATION', 'VOLUNTEER_MANAGEMENT', 'SAFETY_COMPLIANCE', 'RESOURCE_ALLOCATION'] as const,
}

// Human-readable labels for categories
export const CATEGORY_LABELS: Record<string, string> = {
  // Governance
  AGREEMENTS: 'Agreements',
  VOTING: 'Voting',
  MEETINGS: 'Meetings',
  // Wealth
  STAKEHOLDER: 'Stakeholder',
  INVESTMENT_REVIEW: 'Investment Review',
  TREASURER: 'Treasurer',
  // Education
  WORKSHOP_COORDINATION: 'Workshop Coordination',
  TEACHER_ORIENTATION: 'Teacher Orientation',
  LECTURES_TOPIC_REVIEWS: 'Lectures & Topic Reviews',
  // Health
  WELLNESS_ACTIVITIES: 'Wellness Activities',
  WELLNESS_OFFERINGS: 'Wellness Offerings',
  // Operations
  FACILITY_MAINTENANCE: 'Facility Maintenance',
  LOGISTICS_COORDINATION: 'Logistics Coordination',
  VOLUNTEER_MANAGEMENT: 'Volunteer Management',
  SAFETY_COMPLIANCE: 'Safety & Compliance',
  RESOURCE_ALLOCATION: 'Resource Allocation',
}

// Get all valid categories (flattened)
export const ALL_CATEGORIES = Object.values(EVENT_CATEGORIES_BY_COMMITTEE).flat()

// Validate that a category is valid for a given committee type
export function isValidCategoryForCommittee(category: string, committeeType: CommitteeType): boolean {
  return EVENT_CATEGORIES_BY_COMMITTEE[committeeType].includes(category)
}

// Get categories for multiple committee types (for multi-committee events)
export function getCategoriesForCommittees(committeeTypes: CommitteeType[]): string[] {
  const categoriesSet = new Set<string>()
  for (const type of committeeTypes) {
    for (const category of EVENT_CATEGORIES_BY_COMMITTEE[type]) {
      categoriesSet.add(category)
    }
  }
  return Array.from(categoriesSet)
}

// Get the committee type that a category belongs to
export function getCommitteeTypeForCategory(category: string): CommitteeType | null {
  for (const [type, categories] of Object.entries(EVENT_CATEGORIES_BY_COMMITTEE)) {
    if (categories.includes(category)) {
      return type as CommitteeType
    }
  }
  return null
}

// Category colors for UI
export const CATEGORY_COLORS: Record<string, string> = {
  // Governance - Blue tones
  AGREEMENTS: 'bg-blue-100 text-blue-800',
  VOTING: 'bg-blue-100 text-blue-800',
  MEETINGS: 'bg-blue-100 text-blue-800',
  // Wealth - Green tones
  STAKEHOLDER: 'bg-emerald-100 text-emerald-800',
  INVESTMENT_REVIEW: 'bg-emerald-100 text-emerald-800',
  TREASURER: 'bg-emerald-100 text-emerald-800',
  // Education - Purple tones
  WORKSHOP_COORDINATION: 'bg-purple-100 text-purple-800',
  TEACHER_ORIENTATION: 'bg-purple-100 text-purple-800',
  LECTURES_TOPIC_REVIEWS: 'bg-purple-100 text-purple-800',
  // Health - Rose tones
  WELLNESS_ACTIVITIES: 'bg-rose-100 text-rose-800',
  WELLNESS_OFFERINGS: 'bg-rose-100 text-rose-800',
  // Operations - Amber tones
  FACILITY_MAINTENANCE: 'bg-amber-100 text-amber-800',
  LOGISTICS_COORDINATION: 'bg-amber-100 text-amber-800',
  VOLUNTEER_MANAGEMENT: 'bg-amber-100 text-amber-800',
  SAFETY_COMPLIANCE: 'bg-amber-100 text-amber-800',
  RESOURCE_ALLOCATION: 'bg-amber-100 text-amber-800',
}
