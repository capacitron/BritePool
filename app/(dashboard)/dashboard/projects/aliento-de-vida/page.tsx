import { ProjectDashboard } from '@/components/projects/ProjectDashboard'
import type {
  VisionarySteward,
  ProjectDocument,
  ProjectMedia,
  MapLocation,
  ProfessionalContact,
  BudgetItem,
} from '@/lib/projects/types'

const stewards: VisionarySteward[] = [
  {
    id: '1',
    name: 'To be assigned',
    role: 'Project Lead',
    contact: '',
    notes: 'Awaiting appointment',
  },
]

const documents: ProjectDocument[] = [
  {
    id: '1',
    title: 'Project Charter',
    type: 'PDF',
    dateAdded: '2024-01-15',
    notes: 'Initial project charter document',
  },
]

const media: ProjectMedia[] = []

const mapLocations: MapLocation[] = [
  {
    id: '1',
    name: 'Aliento De Vida Site',
    address: 'Location to be confirmed',
    notes: 'Primary project location',
  },
]

const contacts: ProfessionalContact[] = []

const budgetItems: BudgetItem[] = [
  {
    id: '1',
    category: 'Land Acquisition',
    estimatedCost: 0,
    actualCost: 0,
    status: 'Planned',
    notes: 'Budget pending approval',
  },
  {
    id: '2',
    category: 'Site Development',
    estimatedCost: 0,
    actualCost: 0,
    status: 'Planned',
    notes: 'Budget pending approval',
  },
  {
    id: '3',
    category: 'Construction',
    estimatedCost: 0,
    actualCost: 0,
    status: 'Planned',
    notes: 'Budget pending approval',
  },
]

export default function AlientoDeVidaPage() {
  return (
    <div className="p-4 sm:p-6">
      <ProjectDashboard
        projectName="Aliento De Vida (Breath of Life)"
        projectDescription="A transformative community project bringing life and renewal. This sanctuary initiative embodies the BRITE Pool mission of collective empowerment through stewardship and regenerative development."
        stewards={stewards}
        documents={documents}
        media={media}
        mapLocations={mapLocations}
        contacts={contacts}
        budgetItems={budgetItems}
      />
    </div>
  )
}
