// Page descriptions for header sections
// Based on BRITE Pool Ministerium of Empowerment documentation

export const PAGE_DESCRIPTIONS: Record<
  string,
  { title: string; description: string; terms?: string[] }
> = {
  // Dashboard
  dashboard: {
    title: 'Welcome to BRITE Pool',
    description:
      'Your central hub for community engagement, transparency, and empowerment. Access real-time project progress, manage your participation, and connect with fellow stewards.',
  },

  // Events
  events: {
    title: 'Community Events',
    description:
      'Gatherings that strengthen our fellowship through shared experiences. Committee meetings, workshops, and sanctuary events where stewards come together to build, learn, and grow.',
    terms: ['Committee Meeting', 'Workshop', 'Sanctuary Event', 'Virtual Webinar'],
  },

  'events/approvals': {
    title: 'Event Approvals',
    description:
      'Review and approve event requests from committee members. Leaders ensure events align with committee objectives and community values.',
  },

  // Committees
  committees: {
    title: 'Committees',
    description:
      "Active participation in BRITE Pool's mission through governance, wealth management, education, health, or operations. Each committee is guided by appointed stewards working toward collective empowerment.",
    terms: ['Committee', 'Leader', 'Member', 'Participation'],
  },

  // WGO - Wealth Generation Opportunities
  wgo: {
    title: 'Wealth Generation Opportunities (WGO)',
    description:
      'Partnering platforms for wealth generation, vetted through intensive protocol to offer private members increase and personal sovereignty. These opportunities are separate from BRITE Pool but available through membership.',
    terms: ['Risk Tolerance', 'Compounding', 'Affiliate', 'Passive Income'],
  },

  // Partners
  partners: {
    title: 'Affiliate Partners',
    description:
      'Organizations and practitioners aligned with our mission. Advisory board members, sponsors, vendors, and collaborators who support the BRITE Pool ecosystem.',
    terms: ['Advisory Board', 'Practitioner', 'Sponsor', 'Vendor', 'Collaborator'],
  },

  // Communal Seat
  'communal-seat': {
    title: 'Communal Seat Submissions',
    description:
      'Submit your service offerings to become part of the Ministerial Marketplace. A private directory of stewards offering services, products, or educational tools that foster regenerative economic exchange within the community.',
    terms: ['Service Category', 'Communal Seat', 'Ministerial Marketplace'],
  },

  'communal-seat/submissions': {
    title: 'Review Submissions',
    description:
      'Administrative review of communal seat applications. Evaluate service offerings and approve qualified stewards to join the Ministerial Marketplace.',
  },

  // Gratitude
  gratitude: {
    title: 'Declaration of Gratitude',
    description:
      'A founding aspirational declaration honoring the vision, purpose, and sacred mission of Brite Pool and the Healing Centers. Authored by Rebecca Richelle.',
  },

  // Forum
  forum: {
    title: 'Community Forum',
    description:
      'A space for stewards to connect, share insights, and support one another. Discuss opportunities, ask questions, and build relationships within our private fellowship.',
  },

  forums: {
    title: 'Community Forums',
    description:
      'A space for stewards to connect, share insights, and support one another. Discuss opportunities, ask questions, and build relationships within our private fellowship.',
  },

  // Announcements
  announcements: {
    title: 'Announcements',
    description:
      'Important updates and communications from the Board of Chairs and committee leaders. Stay informed about community initiatives, milestones, and opportunities.',
  },

  // Tasks
  tasks: {
    title: 'Tasks & Participation',
    description:
      'Track your contributions to the BRITE Pool mission. Participation involves working with any Ministerial Board or Committee including governance, wealth management, education, and more.',
    terms: ['Equity Unit', 'Participation', 'Sacred Ledger'],
  },

  // Gallery
  gallery: {
    title: 'Media Gallery',
    description:
      'Visual documentation of our journey including project progress, sanctuary development, community events, and construction updates. Media-rich sections with photography and drone footage.',
  },

  media: {
    title: 'Media Gallery',
    description:
      'Visual documentation of our journey including project progress, sanctuary development, community events, and construction updates. Media-rich sections with photography and drone footage.',
    terms: ['Photo', 'Video', 'Drone Footage', 'Timelapse'],
  },

  // Maps
  maps: {
    title: 'Interactive Maps',
    description:
      'Explore sanctuary locations, development zones, and points of interest. Geographic visualization of our healing centers, land-based communities, and economic hubs.',
  },

  map: {
    title: 'Interactive Map',
    description:
      'Explore sanctuary locations, development zones, and points of interest. Geographic visualization of our healing centers, land-based communities, and economic hubs.',
    terms: ['Location', 'Sanctuary', 'Development Zone'],
  },

  // Learning
  learning: {
    title: 'Learning Portal',
    description:
      'Educational gateway offering e-learning modules on regenerative practices, wellness programs, and stewardship principles. Empowerment through knowledge and skill development.',
    terms: ['Course', 'Module', 'Empowerment', 'Leadership'],
  },

  courses: {
    title: 'Learning Center',
    description:
      'Educational gateway offering e-learning modules on regenerative practices, wellness programs, and stewardship principles. Empowerment through knowledge and skill development.',
    terms: ['Course', 'Module', 'Empowerment', 'Leadership'],
  },

  // Documents
  documents: {
    title: 'Document Library',
    description:
      'Access governance documents, educational materials, and operational resources. All documents are stored and maintained with transparency and accessibility for all stewards.',
  },

  // Maintenance
  maintenance: {
    title: 'Maintenance Requests',
    description:
      'Submit and track facility maintenance requests for sanctuary properties. Ensure our shared spaces remain functional, safe, and aligned with our mission of healing and restoration.',
  },

  // Profile
  profile: {
    title: 'Your Profile',
    description:
      'Manage your steward profile, track your equity units, and view your contributions to the BRITE Pool mission. Update your covenant status and personal information.',
    terms: ['Steward', 'Equity Unit', 'Sacred Ledger', 'Covenant'],
  },

  // Stakeholder Pool
  pool: {
    title: 'Stakeholder Pool',
    description:
      'Private placement pooling where members contribute to a shared fund. Trust-based treasury governed by transparency and stewardship principles for collective financial empowerment.',
    terms: ['Pool', 'Cut', 'Pledge', 'Private Placement Pooling'],
  },

  // Settings
  settings: {
    title: 'Account Settings',
    description:
      'Configure your account preferences, notification settings, and security options. Maintain control over your digital presence within the BRITE Pool ecosystem.',
  },

  // Admin
  admin: {
    title: 'Administration',
    description:
      'Administrative tools for Board Chairs and stewards with oversight responsibilities. Manage members, review submissions, and maintain community operations.',
  },
}

// Helper function to get page description
export function getPageDescription(
  path: string
): { title: string; description: string; terms?: string[] } | null {
  // Normalize path (remove leading/trailing slashes)
  const normalizedPath = path.replace(/^\/+|\/+$/g, '').replace(/^dashboard\//, '')

  return PAGE_DESCRIPTIONS[normalizedPath] || null
}

// Component-ready description with formatted terms
export function formatPageDescription(
  path: string
): { title: string; description: string; termsDisplay?: string } | null {
  const desc = getPageDescription(path)
  if (!desc) return null

  return {
    title: desc.title,
    description: desc.description,
    termsDisplay: desc.terms ? `Key Terms: ${desc.terms.join(' | ')}` : undefined,
  }
}
