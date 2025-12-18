# Specification: Media Gallery System

**Feature ID:** F015  
**Priority:** Medium  
**Effort:** Medium (1 week / 7 days)  
**Dependencies:** User Authentication (F002), Cloud Storage Setup (AWS S3/Cloudinary)  
**Status:** Ready for Implementation

---

## Overview

### Purpose
Implement a comprehensive media gallery system for managing and displaying photography, drone footage, and project visuals from BRITE POOL's sanctuary projects. The system enables authenticated users with appropriate roles to upload, organize, and share visual documentation while providing a responsive, performant viewing experience for all members and public visitors.

### Key Requirements
- Cloud-based media storage (AWS S3 + CloudFront OR Cloudinary)
- Multi-file drag-and-drop upload with progress tracking
- Automatic image optimization (WebP conversion, multiple sizes, lazy loading)
- Categorization by project, media type, and custom tags
- Album/collection organization for themed galleries
- Responsive masonry/justified grid layout
- Full-screen lightbox viewer with keyboard navigation
- Public gallery view (no authentication required)
- Permission-based upload and management (CONTENT_MODERATOR and above)

### Success Metrics
- All uploaded media automatically optimized to 3+ sizes (thumbnail, medium, full)
- Gallery page loads in under 2 seconds with lazy loading
- 100% of uploads tracked with metadata
- Public gallery accessible without login for transparency
- All media stored with CDN delivery for global performance

---

## Database Schema

### MediaItem Model
```prisma
model MediaItem {
  id          String   @id @default(cuid())
  url         String
  thumbnailUrl String
  mediumUrl   String?
  filename    String
  filesize    Int
  mimeType    String
  type        MediaType
  category    MediaCategory
  tags        String[]
  uploadedById String
  uploadedBy   User @relation("MediaUploads", fields: [uploadedById], references: [id])
  albumItems  AlbumItem[]
  createdAt   DateTime @default(now())
}

enum MediaType {
  PHOTO
  VIDEO
  DRONE_FOOTAGE
  TIMELAPSE
}

enum MediaCategory {
  PROJECT_PROGRESS
  EVENTS
  SANCTUARY_NATURE
  CONSTRUCTION
  COMMUNITY
  AERIAL
}
```

---

## API Endpoints

### POST /api/media/upload
Upload media files with automatic optimization

### GET /api/media
Fetch media with filtering (category, type, date range, search)

### GET /api/media/public
Public gallery endpoint (no authentication required)

---

## UI Components

1. **MediaUploader** - Drag-and-drop upload with progress tracking
2. **MediaGallery** - Responsive masonry grid using react-photo-album
3. **MediaLightbox** - Full-screen viewer using yet-another-react-lightbox
4. **MediaFilters** - Category, type, date range filtering
5. **AlbumManager** - Create and organize albums

---

## Implementation Details

### Phase 1: Cloud Storage Setup (Days 1-2)
- Configure AWS S3 + CloudFront OR Cloudinary
- Install dependencies (react-photo-album, yet-another-react-lightbox)
- Create upload API with automatic optimization

### Phase 2: Gallery Grid & Filtering (Days 3-4)
- Implement masonry layout
- Add lazy loading
- Create filtering system

### Phase 3: Lightbox Viewer (Days 5-6)
- Integrate lightbox component
- Add keyboard navigation
- Optimize image delivery

### Phase 4: Albums & Public Gallery (Day 7)
- Album management
- Public gallery page
- Final testing and polish

---

**Spec Complete** ✓
