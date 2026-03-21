'use client'

import type {
  VisionarySteward,
  ProjectDocument,
  ProjectMedia,
  MapLocation,
  ProfessionalContact,
  BudgetItem,
} from '@/lib/projects/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VisionaryStewards } from './tabs/VisionaryStewards'
import { Documents } from './tabs/Documents'
import { Media } from './tabs/Media'
import { MapView } from './tabs/MapView'
import { ProfessionalContacts } from './tabs/ProfessionalContacts'
import { Budget } from './tabs/Budget'
import { CommunityMembers } from './tabs/CommunityMembers'
import { Tasks } from './tabs/Tasks'
import {
  Users,
  FileText,
  Image,
  MapPin,
  Contact,
  DollarSign,
  CreditCard,
  CheckSquare,
} from 'lucide-react'

interface ProjectDashboardProps {
  projectName: string
  projectDescription?: string
  stewards: VisionarySteward[]
  documents: ProjectDocument[]
  media: ProjectMedia[]
  mapLocations: MapLocation[]
  contacts: ProfessionalContact[]
  budgetItems: BudgetItem[]
}

const tabs = [
  { value: 'stewards', label: 'Stewards', icon: Users },
  { value: 'documents', label: 'Documents', icon: FileText },
  { value: 'media', label: 'Media', icon: Image },
  { value: 'map', label: 'Map', icon: MapPin },
  { value: 'contacts', label: 'Contacts', icon: Contact },
  { value: 'budget', label: 'Budget', icon: DollarSign },
  { value: 'members', label: 'Members', icon: CreditCard },
  { value: 'tasks', label: 'Tasks', icon: CheckSquare },
]

export function ProjectDashboard({
  projectName,
  projectDescription,
  stewards,
  documents,
  media,
  mapLocations,
  contacts,
  budgetItems,
}: ProjectDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-forest-800 via-forest-700 to-forest-800 rounded-xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 400 200">
            <circle cx="350" cy="50" r="120" fill="currentColor" />
            <circle cx="50" cy="180" r="80" fill="currentColor" />
          </svg>
        </div>
        <div className="relative">
          <h1 className="text-2xl font-display font-bold">{projectName}</h1>
          {projectDescription && (
            <p className="text-forest-200 mt-2 font-body text-sm max-w-2xl">{projectDescription}</p>
          )}
        </div>
      </div>

      <Tabs defaultValue="stewards" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-sand-100 p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-1.5 text-sm data-[state=active]:bg-white data-[state=active]:text-forest-700 data-[state=active]:shadow-warm"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="stewards">
          <VisionaryStewards stewards={stewards} />
        </TabsContent>

        <TabsContent value="documents">
          <Documents documents={documents} />
        </TabsContent>

        <TabsContent value="media">
          <Media media={media} />
        </TabsContent>

        <TabsContent value="map">
          <MapView locations={mapLocations} />
        </TabsContent>

        <TabsContent value="contacts">
          <ProfessionalContacts contacts={contacts} />
        </TabsContent>

        <TabsContent value="budget">
          <Budget items={budgetItems} />
        </TabsContent>

        <TabsContent value="members">
          <CommunityMembers />
        </TabsContent>

        <TabsContent value="tasks">
          <Tasks />
        </TabsContent>
      </Tabs>
    </div>
  )
}
