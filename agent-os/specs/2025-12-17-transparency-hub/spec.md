# Specification: Transparency Hub - Public Facing

**Feature ID:** F018
**Priority:** High
**Effort:** Medium (1 week / 7 days)
**Dependencies:** Media Gallery (F015), Interactive Maps (F016)
**Status:** Ready for Implementation

---

## Overview

### Purpose
Implement a public-facing transparency dashboard that showcases real-time progress, funding status, ecological impact, and project milestones for BRITE POOL's Aliento De Vida sanctuary project. This page serves as the primary public accountability tool, enabling anyone (members and non-members) to track project development, environmental impact, and financial transparency without requiring authentication.

### Key Requirements
- Public access (no authentication required)
- Real-time project progress tracking with visual indicators
- Funding milestone display with progress bars and goal tracking
- Ecological metrics dashboard (trees planted, carbon offset, wildlife counts, biodiversity indices)
- Interactive timeline of major project milestones
- Impact metrics visualizations using charts and graphs
- Integration with Media Gallery for project photos and updates
- Integration with Interactive Maps for location-based progress
- Mobile-responsive design optimized for sharing on social media
- SEO optimization for public discovery and credibility

### Success Metrics
- Page loads in under 2 seconds on mobile and desktop
- All metrics update in real-time (or near real-time with caching)
- 100% of funding goals, milestones, and ecological metrics visible
- Zero authentication barriers for public viewing
- Shareable metrics cards for social media
- Analytics tracking for public engagement (page views, time on page, shares)

---

## Database Schema

### ProjectMilestone Model
```prisma
model ProjectMilestone {
  id              String          @id @default(cuid())
  title           String
  description     String?
  targetDate      DateTime
  completedDate   DateTime?
  status          MilestoneStatus @default(PLANNED)
  category        MilestoneCategory
  progress        Int             @default(0) // 0-100%
  photos          MediaItem[]     @relation("MilestonePhotos")
  location        MapLocation?    @relation(fields: [locationId], references: [id])
  locationId      String?
  fundingGoals    FundingGoal[]   @relation("MilestoneFunding")
  createdById     String
  createdBy       User            @relation("MilestonesCreated", fields: [createdById], references: [id])
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([status])
  @@index([targetDate])
  @@index([category])
}

enum MilestoneStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  DELAYED
  CANCELLED
}

enum MilestoneCategory {
  LAND_ACQUISITION
  INFRASTRUCTURE
  ECOLOGICAL_RESTORATION
  FACILITY_CONSTRUCTION
  COMMUNITY_DEVELOPMENT
  REGULATORY_APPROVAL
  FUNDRAISING
  TECHNOLOGY_DEPLOYMENT
}
```

### FundingGoal Model
```prisma
model FundingGoal {
  id              String          @id @default(cuid())
  title           String
  description     String?
  targetAmount    Decimal         @db.Decimal(10, 2)
  currentAmount   Decimal         @default(0) @db.Decimal(10, 2)
  currency        String          @default("USD")
  deadline        DateTime?
  status          FundingStatus   @default(ACTIVE)
  category        FundingCategory
  milestone       ProjectMilestone? @relation("MilestoneFunding", fields: [milestoneId], references: [id])
  milestoneId     String?
  contributions   Int             @default(0) // Count of contributions
  isPublic        Boolean         @default(true)
  createdById     String
  createdBy       User            @relation("FundingGoalsCreated", fields: [createdById], references: [id])
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([status])
  @@index([category])
  @@index([deadline])
}

enum FundingStatus {
  ACTIVE
  COMPLETED
  PAUSED
  CANCELLED
}

enum FundingCategory {
  LAND_PAYMENT
  CONSTRUCTION
  EQUIPMENT
  OPERATIONAL
  ECOLOGICAL_RESTORATION
  TECHNOLOGY
  COMMUNITY_PROGRAMS
  EMERGENCY_FUND
}
```

### EcologicalMetric Model
```prisma
model EcologicalMetric {
  id              String          @id @default(cuid())
  metricType      EcologicalMetricType
  value           Decimal         @db.Decimal(10, 2)
  unit            String          // "trees", "tons CO2", "hectares", "species count"
  measurementDate DateTime        @default(now())
  location        MapLocation?    @relation(fields: [locationId], references: [id])
  locationId      String?
  notes           String?
  verifiedBy      String?         // Name of verifying organization/person
  verificationDate DateTime?
  photos          MediaItem[]     @relation("MetricPhotos")
  createdById     String
  createdBy       User            @relation("EcologicalMetricsCreated", fields: [createdById], references: [id])
  createdAt       DateTime        @default(now())

  @@index([metricType])
  @@index([measurementDate])
}

enum EcologicalMetricType {
  TREES_PLANTED
  CARBON_OFFSET
  WILDLIFE_COUNT
  SPECIES_DIVERSITY
  WATER_CONSERVATION
  SOIL_RESTORATION
  HABITAT_CREATED
  NATIVE_SPECIES_REINTRODUCED
  INVASIVE_SPECIES_REMOVED
}
```

---

## API Endpoints

### Public Endpoints (No Authentication Required)

#### GET /api/public/transparency/overview
Fetch high-level summary of all transparency metrics

**Response:**
```json
{
  "fundingSummary": {
    "totalRaised": 1250000,
    "totalGoal": 2000000,
    "percentComplete": 62.5,
    "activeGoals": 5,
    "contributorCount": 247
  },
  "milestoneSummary": {
    "total": 25,
    "completed": 12,
    "inProgress": 8,
    "planned": 5,
    "percentComplete": 48
  },
  "ecologicalSummary": {
    "treesPlanted": 5420,
    "carbonOffset": 127.5,
    "wildlifeCount": 89,
    "habitatCreated": 45.2
  },
  "lastUpdated": "2025-12-17T10:30:00Z"
}
```

---

#### GET /api/public/transparency/funding
Fetch all public funding goals with progress

**Query Parameters:**
- `status` (optional): Filter by FundingStatus
- `category` (optional): Filter by FundingCategory
- `limit` (optional): Number of results (default: 50)

**Response:**
```json
{
  "goals": [
    {
      "id": "clx123",
      "title": "Land Acquisition - Final Payment",
      "description": "Complete final payment for 415-acre property",
      "targetAmount": 500000,
      "currentAmount": 425000,
      "currency": "USD",
      "percentComplete": 85,
      "deadline": "2026-03-01T00:00:00Z",
      "status": "ACTIVE",
      "category": "LAND_PAYMENT",
      "contributions": 142,
      "daysRemaining": 73
    }
  ],
  "totalCount": 5
}
```

---

#### GET /api/public/transparency/milestones
Fetch all project milestones with timeline data

**Query Parameters:**
- `status` (optional): Filter by MilestoneStatus
- `category` (optional): Filter by MilestoneCategory
- `year` (optional): Filter by year (2025, 2026, etc.)

**Response:**
```json
{
  "milestones": [
    {
      "id": "clx456",
      "title": "Water System Installation",
      "description": "Install rainwater harvesting and filtration system",
      "targetDate": "2026-02-15T00:00:00Z",
      "completedDate": null,
      "status": "IN_PROGRESS",
      "category": "INFRASTRUCTURE",
      "progress": 65,
      "location": {
        "id": "loc123",
        "name": "Main Facility Site",
        "latitude": 10.1234,
        "longitude": -84.5678
      },
      "photos": [
        {
          "id": "med789",
          "thumbnailUrl": "https://cdn.../thumb.jpg",
          "caption": "Progress as of Dec 2025"
        }
      ]
    }
  ],
  "totalCount": 25
}
```

---

#### GET /api/public/transparency/ecological
Fetch ecological impact metrics

**Query Parameters:**
- `metricType` (optional): Filter by EcologicalMetricType
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "metrics": [
    {
      "id": "clx789",
      "metricType": "TREES_PLANTED",
      "value": 5420,
      "unit": "trees",
      "measurementDate": "2025-12-15T00:00:00Z",
      "location": {
        "id": "loc456",
        "name": "Reforestation Zone A"
      },
      "notes": "Native species including Guanacaste, Ceiba, and Pochote",
      "verifiedBy": "Costa Rica Forest Conservation Alliance",
      "verificationDate": "2025-12-16T00:00:00Z",
      "photos": []
    }
  ],
  "aggregates": {
    "TREES_PLANTED": 5420,
    "CARBON_OFFSET": 127.5,
    "WILDLIFE_COUNT": 89,
    "SPECIES_DIVERSITY": 34,
    "HABITAT_CREATED": 45.2
  }
}
```

---

#### GET /api/public/transparency/timeline
Fetch chronological timeline of all milestones and major events

**Response:**
```json
{
  "timeline": [
    {
      "date": "2025-03-15",
      "type": "milestone",
      "title": "Land Purchase Initiated",
      "description": "Began process to acquire 415-acre property",
      "status": "COMPLETED",
      "category": "LAND_ACQUISITION"
    },
    {
      "date": "2025-06-01",
      "type": "ecological",
      "title": "First Reforestation Phase",
      "description": "Planted 2,000 native trees",
      "metricType": "TREES_PLANTED",
      "value": 2000
    },
    {
      "date": "2025-09-10",
      "type": "funding",
      "title": "Infrastructure Fund Launched",
      "description": "Fundraising campaign for water and power systems",
      "targetAmount": 150000,
      "currentAmount": 98000
    }
  ]
}
```

---

### Protected Endpoints (Admin Only)

#### POST /api/admin/transparency/milestones
Create new project milestone

**Authentication:** Required (role: PROJECT_COORDINATOR or higher)

**Request Body:**
```json
{
  "title": "Solar Panel Installation",
  "description": "Install 50kW solar array for facility power",
  "targetDate": "2026-04-01T00:00:00Z",
  "category": "INFRASTRUCTURE",
  "locationId": "loc123"
}
```

---

#### PATCH /api/admin/transparency/milestones/[id]
Update milestone progress or status

**Authentication:** Required (role: PROJECT_COORDINATOR or higher)

**Request Body:**
```json
{
  "progress": 75,
  "status": "IN_PROGRESS",
  "notes": "On schedule, 75% complete"
}
```

---

#### POST /api/admin/transparency/funding
Create new funding goal

**Authentication:** Required (role: FINANCE_STEWARD or higher)

**Request Body:**
```json
{
  "title": "Emergency Equipment Fund",
  "description": "Medical and safety equipment for sanctuary",
  "targetAmount": 25000,
  "currency": "USD",
  "deadline": "2026-01-31T00:00:00Z",
  "category": "EQUIPMENT",
  "isPublic": true
}
```

---

#### PATCH /api/admin/transparency/funding/[id]
Update funding goal progress

**Authentication:** Required (role: FINANCE_STEWARD or higher)

**Request Body:**
```json
{
  "currentAmount": 18500,
  "contributions": 47
}
```

---

#### POST /api/admin/transparency/ecological
Record new ecological metric

**Authentication:** Required (role: ECOLOGICAL_STEWARD or higher)

**Request Body:**
```json
{
  "metricType": "WILDLIFE_COUNT",
  "value": 12,
  "unit": "species",
  "measurementDate": "2025-12-15T00:00:00Z",
  "locationId": "loc789",
  "notes": "New species identified: Resplendent Quetzal, White-faced Capuchin",
  "verifiedBy": "Dr. Maria Rodriguez, Wildlife Biologist"
}
```

---

## UI Components

### Public Components

#### 1. TransparencyDashboard
Main public-facing dashboard page

**Features:**
- Hero section with live metrics counters
- Tabbed navigation: Overview, Funding, Milestones, Impact, Timeline
- Real-time data updates (with caching)
- Share buttons for social media
- Mobile-optimized layout

**Component Structure:**
```tsx
export default function TransparencyDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { data, isLoading } = useSWR('/api/public/transparency/overview');

  return (
    <div className="min-h-screen bg-earth-light">
      <TransparencyHero metrics={data} />
      <TabNavigation activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && <OverviewPanel data={data} />}
      {activeTab === 'funding' && <FundingPanel />}
      {activeTab === 'milestones' && <MilestonesPanel />}
      {activeTab === 'impact' && <ImpactPanel />}
      {activeTab === 'timeline' && <TimelinePanel />}
    </div>
  );
}
```

---

#### 2. TransparencyHero
Hero section with animated metric counters

**Features:**
- Large animated counters for key metrics
- Progress circle animations
- Real-time "last updated" timestamp
- Eye-catching gradient background

```tsx
function TransparencyHero({ metrics }) {
  return (
    <section className="bg-gradient-to-br from-earth-green to-earth-brown text-white py-16">
      <div className="container mx-auto px-4">
        <h1 className="text-5xl font-serif mb-4">Project Transparency</h1>
        <p className="text-xl mb-12">Real-time progress toward our vision</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <MetricCard
            icon={<DollarSign />}
            value={metrics.fundingSummary.totalRaised}
            label="Raised"
            format="currency"
          />
          <MetricCard
            icon={<CheckCircle />}
            value={metrics.milestoneSummary.percentComplete}
            label="Milestones Complete"
            format="percent"
          />
          <MetricCard
            icon={<Trees />}
            value={metrics.ecologicalSummary.treesPlanted}
            label="Trees Planted"
            format="number"
          />
          <MetricCard
            icon={<Leaf />}
            value={metrics.ecologicalSummary.carbonOffset}
            label="Tons CO₂ Offset"
            format="decimal"
          />
        </div>
      </div>
    </section>
  );
}
```

---

#### 3. FundingProgressCard
Individual funding goal display with progress bar

**Features:**
- Animated progress bar
- Countdown timer for deadline
- Contribution count
- Visual status indicators

```tsx
function FundingProgressCard({ goal }) {
  const percentComplete = (goal.currentAmount / goal.targetAmount) * 100;
  const daysRemaining = differenceInDays(new Date(goal.deadline), new Date());

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-earth-green">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-earth-dark">{goal.title}</h3>
          <p className="text-sm text-earth-brown">{goal.category}</p>
        </div>
        <Badge status={goal.status} />
      </div>

      <p className="text-earth-brown mb-4">{goal.description}</p>

      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-2xl font-bold text-earth-green">
            ${goal.currentAmount.toLocaleString()}
          </span>
          <span className="text-lg text-earth-brown">
            of ${goal.targetAmount.toLocaleString()}
          </span>
        </div>
        <ProgressBar percent={percentComplete} color="green" />
      </div>

      <div className="flex justify-between text-sm text-earth-brown">
        <span>{goal.contributions} contributions</span>
        {daysRemaining > 0 && (
          <span>{daysRemaining} days remaining</span>
        )}
      </div>
    </div>
  );
}
```

---

#### 4. MilestoneTimeline
Visual timeline of project milestones

**Features:**
- Vertical timeline layout on desktop, horizontal on mobile
- Color-coded status indicators
- Photo attachments
- Expandable detail views
- Filter by category and status

```tsx
function MilestoneTimeline({ milestones }) {
  const [filter, setFilter] = useState('all');
  const filteredMilestones = useMemo(() => {
    return filter === 'all'
      ? milestones
      : milestones.filter(m => m.status === filter);
  }, [milestones, filter]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-serif text-earth-dark">Project Timeline</h2>
        <MilestoneFilter value={filter} onChange={setFilter} />
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-earth-light" />

        {filteredMilestones.map((milestone, index) => (
          <TimelineItem key={milestone.id} milestone={milestone} index={index} />
        ))}
      </div>
    </div>
  );
}

function TimelineItem({ milestone, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative pl-12 pb-8">
      {/* Timeline dot */}
      <div className={`absolute left-2.5 w-3 h-3 rounded-full ${
        milestone.status === 'COMPLETED' ? 'bg-earth-green' :
        milestone.status === 'IN_PROGRESS' ? 'bg-earth-orange' :
        'bg-earth-brown'
      }`} />

      <div className="bg-stone-warm rounded-lg p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-earth-dark">{milestone.title}</h3>
            <p className="text-sm text-earth-brown">
              {format(new Date(milestone.targetDate), 'MMM d, yyyy')}
            </p>
          </div>
          <StatusBadge status={milestone.status} />
        </div>

        {milestone.progress > 0 && (
          <div className="mt-3">
            <ProgressBar percent={milestone.progress} color="green" size="sm" />
          </div>
        )}

        {expanded && (
          <div className="mt-4 pt-4 border-t border-stone">
            <p className="text-earth-brown mb-3">{milestone.description}</p>
            {milestone.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {milestone.photos.map(photo => (
                  <img
                    key={photo.id}
                    src={photo.thumbnailUrl}
                    alt={photo.caption}
                    className="rounded w-full h-24 object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-earth-green mt-2 hover:underline"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      </div>
    </div>
  );
}
```

---

#### 5. ImpactMetricsGrid
Ecological impact metrics with visualizations

**Features:**
- Large metric cards with icons
- Interactive charts (line charts for trends over time)
- Verification badges for third-party verified data
- Photo galleries for each metric type

```tsx
function ImpactMetricsGrid() {
  const { data } = useSWR('/api/public/transparency/ecological');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ImpactCard
        icon={<TreeIcon />}
        title="Trees Planted"
        value={data?.aggregates.TREES_PLANTED}
        unit="native trees"
        color="green"
        trendData={data?.trends?.TREES_PLANTED}
      />
      <ImpactCard
        icon={<CloudIcon />}
        title="Carbon Offset"
        value={data?.aggregates.CARBON_OFFSET}
        unit="tons CO₂"
        color="blue"
        trendData={data?.trends?.CARBON_OFFSET}
      />
      <ImpactCard
        icon={<ButterflyIcon />}
        title="Wildlife Species"
        value={data?.aggregates.WILDLIFE_COUNT}
        unit="species observed"
        color="purple"
        trendData={data?.trends?.WILDLIFE_COUNT}
      />
      <ImpactCard
        icon={<SproutIcon />}
        title="Biodiversity Index"
        value={data?.aggregates.SPECIES_DIVERSITY}
        unit="unique species"
        color="green"
        trendData={data?.trends?.SPECIES_DIVERSITY}
      />
      <ImpactCard
        icon={<WaterIcon />}
        title="Water Conserved"
        value={data?.aggregates.WATER_CONSERVATION}
        unit="liters/month"
        color="blue"
        trendData={data?.trends?.WATER_CONSERVATION}
      />
      <ImpactCard
        icon={<MountainIcon />}
        title="Habitat Restored"
        value={data?.aggregates.HABITAT_CREATED}
        unit="hectares"
        color="brown"
        trendData={data?.trends?.HABITAT_CREATED}
      />
    </div>
  );
}

function ImpactCard({ icon, title, value, unit, color, trendData }) {
  const [showChart, setShowChart] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-earth-green">
      <div className="flex items-center mb-4">
        <div className={`p-3 rounded-full bg-earth-${color}-light mr-4`}>
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-earth-dark">{title}</h3>
      </div>

      <div className="mb-2">
        <div className="text-4xl font-bold text-earth-green">
          {value?.toLocaleString()}
        </div>
        <div className="text-sm text-earth-brown">{unit}</div>
      </div>

      {trendData && (
        <button
          onClick={() => setShowChart(!showChart)}
          className="text-sm text-earth-green hover:underline"
        >
          {showChart ? 'Hide trend' : 'View trend'}
        </button>
      )}

      {showChart && trendData && (
        <div className="mt-4">
          <MiniLineChart data={trendData} color={color} />
        </div>
      )}
    </div>
  );
}
```

---

#### 6. MiniLineChart
Compact trend visualization using Recharts

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function MiniLineChart({ data, color }) {
  return (
    <ResponsiveContainer width="100%" height={100}>
      <LineChart data={data}>
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="value"
          stroke={`var(--earth-${color})`}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

---

### Admin Components

#### 7. AdminTransparencyManager
Admin dashboard for managing transparency data

**Features:**
- Tabs for milestones, funding, and ecological metrics
- CRUD operations for all entities
- Photo upload integration
- Progress tracking tools
- Verification workflows

```tsx
function AdminTransparencyManager() {
  const [activeTab, setActiveTab] = useState('milestones');

  return (
    <div className="p-6">
      <h1 className="text-3xl font-serif mb-6">Transparency Management</h1>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tab label="Milestones" value="milestones" />
        <Tab label="Funding Goals" value="funding" />
        <Tab label="Ecological Metrics" value="ecological" />
      </Tabs>

      {activeTab === 'milestones' && <MilestoneManager />}
      {activeTab === 'funding' && <FundingGoalManager />}
      {activeTab === 'ecological' && <EcologicalMetricManager />}
    </div>
  );
}
```

---

#### 8. MilestoneManager
Admin interface for managing milestones

**Features:**
- Create/edit/delete milestones
- Drag-and-drop reordering
- Progress slider
- Photo attachment from Media Gallery
- Location picker from Interactive Maps

```tsx
function MilestoneManager() {
  const [milestones, setMilestones] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const handleCreate = async (data) => {
    await fetch('/api/admin/transparency/milestones', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    // Refresh list
  };

  const handleUpdate = async (id, updates) => {
    await fetch(`/api/admin/transparency/milestones/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    // Refresh list
  };

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-semibold">Project Milestones</h2>
        <button onClick={() => setEditingId('new')} className="btn-primary">
          Add Milestone
        </button>
      </div>

      <div className="space-y-4">
        {milestones.map(milestone => (
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            onEdit={() => setEditingId(milestone.id)}
            onUpdate={handleUpdate}
          />
        ))}
      </div>

      {editingId && (
        <MilestoneFormModal
          milestoneId={editingId}
          onClose={() => setEditingId(null)}
          onSave={editingId === 'new' ? handleCreate : handleUpdate}
        />
      )}
    </div>
  );
}
```

---

## Implementation Details

### Phase 1: Database & Schema (Days 1-2)

**Day 1: Schema Setup**
1. Add new models to Prisma schema:
   - ProjectMilestone
   - FundingGoal
   - EcologicalMetric
2. Add relations to existing models:
   - User → milestones, funding goals, ecological metrics
   - MediaItem → milestone photos, metric photos
   - MapLocation → milestones, ecological metrics
3. Run `npx prisma db push` to sync schema
4. Create seed data for testing:
   - 10-15 sample milestones across different categories
   - 5-7 funding goals with varying progress
   - 20+ ecological metrics with historical data

**Day 2: API Implementation**
1. Implement public API endpoints:
   - `/api/public/transparency/overview`
   - `/api/public/transparency/funding`
   - `/api/public/transparency/milestones`
   - `/api/public/transparency/ecological`
   - `/api/public/transparency/timeline`
2. Implement admin API endpoints:
   - Milestone CRUD operations
   - Funding goal CRUD operations
   - Ecological metric CRUD operations
3. Add response caching (Redis or Next.js built-in cache)
4. Test all endpoints with Postman/Thunder Client

---

### Phase 2: Public UI Components (Days 3-4)

**Day 3: Dashboard Layout & Hero**
1. Create base page: `app/transparency/page.tsx`
2. Implement TransparencyHero component
3. Implement animated metric counters
4. Add tab navigation
5. Style with biophilic design system
6. Test mobile responsiveness

**Day 4: Content Panels**
1. Implement FundingPanel with progress cards
2. Implement MilestonesPanel with timeline
3. Implement ImpactPanel with metrics grid
4. Add chart visualizations using Recharts:
   - Install: `npm install recharts`
   - Create MiniLineChart component
   - Add trend data to impact cards
5. Implement TimelinePanel with chronological view
6. Add loading states and error handling

---

### Phase 3: Charts & Visualizations (Day 5)

**Day 5: Advanced Visualizations**
1. Install charting library:
   ```bash
   npm install recharts date-fns
   ```
2. Create reusable chart components:
   - LineChart for trends over time
   - BarChart for comparative metrics
   - PieChart for category breakdowns
   - AreaChart for cumulative progress
3. Implement interactive tooltips
4. Add chart export functionality (PNG download)
5. Add "Share This Metric" buttons for social media
6. Test performance with large datasets

---

### Phase 4: Admin Tools (Day 6)

**Day 6: Admin Dashboard**
1. Create admin page: `app/dashboard/admin/transparency/page.tsx`
2. Implement MilestoneManager component
3. Implement FundingGoalManager component
4. Implement EcologicalMetricManager component
5. Add form validation using Zod:
   ```bash
   npm install zod react-hook-form @hookform/resolvers
   ```
6. Create modal forms for CRUD operations
7. Integrate MediaGallery photo picker
8. Integrate MapLocation picker
9. Add real-time preview of public page

---

### Phase 5: Integration & Polish (Day 7)

**Day 7: Testing & Launch Prep**
1. Integration testing:
   - Test Media Gallery photo attachments
   - Test Map Location linking
   - Test funding goal calculations
   - Test milestone progress tracking
2. SEO optimization:
   - Add meta tags for social sharing
   - Generate Open Graph images for metrics
   - Add JSON-LD structured data
   - Create sitemap entry
3. Performance optimization:
   - Implement response caching
   - Add image lazy loading
   - Optimize chart rendering
   - Test with Lighthouse (target: 90+ score)
4. Accessibility audit:
   - ARIA labels for charts
   - Keyboard navigation
   - Screen reader testing
   - Color contrast validation
5. Final polish and deployment

---

## Integration Points

### Media Gallery Integration (F015)

**Usage:**
- Milestone photos display in timeline
- Ecological metric verification photos
- Admin photo picker for attachments

**Implementation:**
```tsx
// In MilestoneFormModal
import { MediaPicker } from '@/components/media/MediaPicker';

function MilestoneFormModal() {
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  return (
    <form>
      {/* ... other fields ... */}

      <div className="mb-4">
        <label>Attach Photos</label>
        <MediaPicker
          multiple
          category="PROJECT_PROGRESS"
          selected={selectedPhotos}
          onChange={setSelectedPhotos}
        />
      </div>
    </form>
  );
}
```

---

### Interactive Maps Integration (F016)

**Usage:**
- Link milestones to map locations
- Display ecological metrics by location
- Show progress on sanctuary map

**Implementation:**
```tsx
// In MilestoneFormModal
import { LocationPicker } from '@/components/map/LocationPicker';

function MilestoneFormModal() {
  const [selectedLocation, setSelectedLocation] = useState(null);

  return (
    <form>
      {/* ... other fields ... */}

      <div className="mb-4">
        <label>Location (Optional)</label>
        <LocationPicker
          selected={selectedLocation}
          onChange={setSelectedLocation}
        />
      </div>
    </form>
  );
}
```

**Map Enhancement:**
Add milestone markers to interactive map:
```tsx
// In InteractiveMap component
function InteractiveMap() {
  const { data: milestones } = useSWR('/api/public/transparency/milestones');

  return (
    <Map>
      {milestones?.filter(m => m.location).map(milestone => (
        <MilestoneMarker
          key={milestone.id}
          milestone={milestone}
          position={[milestone.location.latitude, milestone.location.longitude]}
        />
      ))}
    </Map>
  );
}
```

---

## Testing Requirements

### Unit Tests

```typescript
// Test funding goal calculation
test('calculates funding progress percentage correctly', () => {
  const goal = {
    targetAmount: 100000,
    currentAmount: 65000
  };
  const percent = (goal.currentAmount / goal.targetAmount) * 100;
  expect(percent).toBe(65);
});

// Test milestone status logic
test('determines milestone status based on dates and progress', () => {
  const milestone = {
    targetDate: new Date('2025-12-31'),
    completedDate: null,
    progress: 50
  };
  const status = getMilestoneStatus(milestone);
  expect(status).toBe('IN_PROGRESS');
});

// Test ecological metric aggregation
test('aggregates ecological metrics by type', () => {
  const metrics = [
    { metricType: 'TREES_PLANTED', value: 1000 },
    { metricType: 'TREES_PLANTED', value: 1500 },
    { metricType: 'CARBON_OFFSET', value: 25.5 }
  ];
  const aggregates = aggregateMetrics(metrics);
  expect(aggregates.TREES_PLANTED).toBe(2500);
  expect(aggregates.CARBON_OFFSET).toBe(25.5);
});
```

---

### Integration Tests

```typescript
// Test public transparency overview endpoint
test('GET /api/public/transparency/overview returns summary', async () => {
  const res = await fetch('/api/public/transparency/overview');
  const data = await res.json();

  expect(res.status).toBe(200);
  expect(data).toHaveProperty('fundingSummary');
  expect(data).toHaveProperty('milestoneSummary');
  expect(data).toHaveProperty('ecologicalSummary');
  expect(data.fundingSummary.totalRaised).toBeGreaterThanOrEqual(0);
});

// Test milestone creation with admin auth
test('POST /api/admin/transparency/milestones creates milestone', async () => {
  const res = await fetch('/api/admin/transparency/milestones', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Test Milestone',
      targetDate: '2026-06-01',
      category: 'INFRASTRUCTURE'
    })
  });

  expect(res.status).toBe(201);
  const milestone = await res.json();
  expect(milestone.title).toBe('Test Milestone');
  expect(milestone.status).toBe('PLANNED');
});
```

---

### Manual Testing Checklist

- [ ] Public page loads without authentication
- [ ] All metrics display correctly
- [ ] Funding progress bars animate smoothly
- [ ] Timeline renders chronologically
- [ ] Charts display trend data accurately
- [ ] Mobile layout is fully responsive
- [ ] Share buttons work for social media
- [ ] Admin can create new milestones
- [ ] Admin can update funding goals
- [ ] Admin can record ecological metrics
- [ ] Photo attachments work from Media Gallery
- [ ] Location picker works from Interactive Maps
- [ ] Page loads in under 2 seconds
- [ ] Lighthouse score is 90+
- [ ] Screen reader navigation works
- [ ] Keyboard navigation functional

---

## SEO & Social Sharing

### Meta Tags

```tsx
// app/transparency/page.tsx
export const metadata = {
  title: 'Project Transparency | BRITE POOL Sanctuary',
  description: 'Real-time progress tracking for the Aliento De Vida 415-acre sanctuary project in Costa Rica. View funding milestones, ecological impact, and project timeline.',
  openGraph: {
    title: 'BRITE POOL Sanctuary - Real-Time Transparency',
    description: '5,420 trees planted, 127.5 tons CO₂ offset, 89 wildlife species observed. Track our progress toward regenerative sanctuary development.',
    images: [
      {
        url: '/api/og-image/transparency',
        width: 1200,
        height: 630,
        alt: 'BRITE POOL Transparency Dashboard'
      }
    ],
    type: 'website',
    url: 'https://britepool.com/transparency'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BRITE POOL Project Transparency',
    description: 'Real-time sanctuary project metrics and ecological impact.',
    images: ['/api/og-image/transparency']
  }
};
```

---

### Structured Data (JSON-LD)

```tsx
// Add to transparency page
export default function TransparencyPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Project",
    "name": "Aliento De Vida Sanctuary",
    "description": "415-acre regenerative sanctuary in Costa Rica",
    "url": "https://britepool.com/transparency",
    "fundingModel": "Community-funded",
    "location": {
      "@type": "Place",
      "name": "Guanacaste, Costa Rica"
    },
    "sustainability": {
      "@type": "QuantitativeValue",
      "value": 5420,
      "unitText": "trees planted"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {/* ... page content ... */}
    </>
  );
}
```

---

## Performance Optimization

### Caching Strategy

```typescript
// API route with caching
export async function GET() {
  const cacheKey = 'transparency:overview';

  // Check cache first (Redis or Next.js cache)
  const cached = await cache.get(cacheKey);
  if (cached) {
    return Response.json(JSON.parse(cached), {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
  }

  // Fetch fresh data
  const data = await prisma./* query */;

  // Cache for 5 minutes
  await cache.set(cacheKey, JSON.stringify(data), 300);

  return Response.json(data);
}
```

---

### Image Optimization

```tsx
// Use Next.js Image component for all media
import Image from 'next/image';

function MilestonePhoto({ photo }) {
  return (
    <Image
      src={photo.url}
      alt={photo.caption}
      width={400}
      height={300}
      loading="lazy"
      placeholder="blur"
      blurDataURL={photo.thumbnailUrl}
    />
  );
}
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Database schema synced (`npx prisma db push`)
- [ ] Seed data created for all models
- [ ] All API endpoints tested
- [ ] Public page tested without auth
- [ ] Admin tools tested with auth
- [ ] Charts render correctly
- [ ] Mobile layout tested
- [ ] SEO meta tags configured
- [ ] Caching implemented
- [ ] All dependencies installed

### Deployment Steps

1. Deploy database migrations
2. Seed initial transparency data
3. Deploy application code
4. Test public page in production
5. Test admin tools in production
6. Verify integrations with Media Gallery and Maps
7. Monitor performance metrics

### Post-Deployment

- [ ] Verify public access (no auth required)
- [ ] Check Lighthouse score (target: 90+)
- [ ] Test social media sharing
- [ ] Monitor API response times
- [ ] Verify chart rendering on various devices
- [ ] Check accessibility with screen reader
- [ ] Monitor cache hit rates
- [ ] Verify data updates in real-time

---

## Future Enhancements

1. **Export Functionality:** Generate PDF reports of transparency data
2. **Comparison Views:** Year-over-year comparisons for ecological metrics
3. **Goal Projections:** Predictive analytics for funding goal completion
4. **Interactive Filters:** Advanced filtering by date range, category, location
5. **Embedded Widgets:** Shareable widget for embedding metrics on external sites
6. **Email Notifications:** Subscribe to milestone updates
7. **Multi-Language:** Spanish translations for Costa Rican audience
8. **API Webhooks:** Real-time updates via webhooks for third-party integrations
9. **Blockchain Integration:** Immutable ledger for funding transparency
10. **Carbon Credit Tracking:** Integration with carbon offset marketplaces

---

**Spec Complete** ✓

Next step: Run `/create-tasks` to generate implementation task list.
