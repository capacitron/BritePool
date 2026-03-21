export interface VisionarySteward {
  id: string
  name: string
  role: string
  contact: string
  notes?: string
}

export interface ProjectDocument {
  id: string
  title: string
  type: string
  url?: string
  dateAdded: string
  notes?: string
}

export interface ProjectMedia {
  id: string
  title: string
  type: string
  thumbnailUrl?: string
  url?: string
  notes?: string
}

export interface MapLocation {
  id: string
  name: string
  address?: string
  coordinates?: { lat: number; lng: number }
  notes?: string
}

export interface ProfessionalContact {
  id: string
  name: string
  organization: string
  role: string
  email?: string
  phone?: string
  notes?: string
}

export interface BudgetItem {
  id: string
  category: string
  estimatedCost: number
  actualCost: number
  status: string
  notes?: string
}
