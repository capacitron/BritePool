# Specification: Interactive Project Maps

**Feature ID:** F016  
**Priority:** High  
**Effort:** Medium (1 week / 7 days)  
**Dependencies:** User Authentication (F002), Media Gallery System (F015)  
**Status:** Ready for Implementation

---

## Overview

### Purpose
Implement an interactive mapping system that showcases the Aliento De Vida 415-acre sanctuary property in Costa Rica using Mapbox GL JS. Enable public users and members to explore sanctuary locations through custom markers representing facilities, development zones, points of interest, natural features, and infrastructure.

### Key Requirements
- Interactive map with Mapbox GL JS (react-map-gl wrapper)
- Custom marker system for five location types
- Location detail popups with photos and descriptions
- Property boundary visualization using GeoJSON polygon
- Map filtering by location type
- Mobile-optimized touch controls (pinch zoom, swipe pan)
- Admin interface for CRUD operations on map markers
- Satellite/street view toggle and search functionality
- Cluster markers when zoomed out for performance

### Success Metrics
- Map loads within 2 seconds on desktop and mobile
- 100% of sanctuary locations accurately placed
- All location types visually distinguishable
- Smooth performance with 50+ markers (using clustering)
- Mobile touch controls work seamlessly
- Admin can add/edit locations without developer intervention

---

## Database Schema

### MapLocation Model
```prisma
model MapLocation {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  latitude    Float
  longitude   Float
  type        LocationType
  status      LocationStatus @default(PLANNED)
  photos      MediaItem[]
  createdById String
  createdBy   User @relation("MapLocationsCreated", fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
}

enum LocationType {
  FACILITY
  DEVELOPMENT_ZONE
  POINT_OF_INTEREST
  NATURAL_FEATURE
  INFRASTRUCTURE
}

enum LocationStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  OPERATIONAL
}
```

---

## API Endpoints

### GET /api/map/locations
Fetch all map locations with optional filtering

### POST /api/map/locations
Create new map location (admin only)

### PATCH /api/map/locations/[id]
Update existing location (admin only)

### GET /api/map/bounds
Get property boundary GeoJSON polygon

---

## UI Components

1. **InteractiveMap** - Main map component with Mapbox GL JS
2. **MapMarker** - Custom marker icons color-coded by type
3. **LocationPopup** - Info popup when clicking markers
4. **MapControls** - Zoom, layer toggle, filter buttons
5. **AdminMapEditor** - Admin interface for managing locations

---

## Implementation Details

### Phase 1: Map Setup (Days 1-2)
- Install Mapbox GL JS and react-map-gl
- Configure Mapbox token
- Create base map component
- Add property boundary

### Phase 2: Database & API (Days 3-4)
- Create MapLocation schema
- Implement API endpoints
- Seed sample locations

### Phase 3: Markers & Popups (Days 5-6)
- Custom marker components
- Location popups
- Filtering and clustering
- Search functionality

### Phase 4: Admin Editor (Day 7)
- Click-to-place markers
- Drag-to-update coordinates
- Photo upload integration
- Mobile optimization

---

**Spec Complete** ✓
