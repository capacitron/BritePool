# Specification: Document Management & Timestamp Verification

**Feature ID:** F020
**Priority:** High
**Effort:** Large (2 weeks / 14 days)
**Dependencies:** User Authentication (F002), Media Gallery (F015)
**Status:** Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [User Flows](#user-flows)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [UI Components](#ui-components)
6. [Implementation Details](#implementation-details)
7. [Testing Requirements](#testing-requirements)
8. [Deployment Checklist](#deployment-checklist)

---

## Overview

### Purpose
Implement a secure, blockchain-ready document management system for BRITE POOL that handles critical organizational documents including stakeholder reports, covenant agreements, official records, and meeting minutes. The system provides cryptographic timestamp verification using SHA-256 hashing, comprehensive version control, granular access permissions, and complete audit logging of all document interactions.

### Key Requirements
- **Secure Storage:** AWS S3 integration with encrypted document storage
- **Blockchain-Ready Verification:** SHA-256 timestamp hashing for document authenticity
- **Version Control:** Complete version history with diff tracking and rollback capability
- **Access Control:** Role-based permissions with granular document-level access control
- **Audit Logging:** Immutable audit trail of all document access, modifications, and downloads
- **Document Organization:** Categories, tags, and metadata-based organization
- **Search & Discovery:** Full-text search with advanced filtering
- **Compliance:** Support for legal and regulatory document requirements

### Success Metrics
- 100% of uploaded documents have SHA-256 timestamp verification
- Zero unauthorized document access incidents
- Complete audit trail for all document interactions
- All document versions tracked with full history
- Search returns relevant results in under 2 seconds
- All sensitive documents encrypted at rest and in transit
- Role-based access enforced on all document operations

---

## User Flows

### Flow 1: Upload New Document with Timestamp Verification

```
1. User navigates to /documents
2. User clicks "Upload Document" button
3. Upload modal appears with form:
   - File selection (drag-and-drop or browse)
   - Document name
   - Description
   - Category selection (dropdown)
   - Tags (multi-select)
   - Access level (public/member-only/role-specific/private)
4. User selects file and fills metadata
5. User clicks "Upload"
6. Frontend validates file (size, type, required fields)
7. POST /api/documents/upload with multipart form data
8. Backend:
   - Generates unique document ID
   - Uploads file to S3 with encryption
   - Calculates SHA-256 hash of file content
   - Creates timestamp record with hash
   - Creates Document record with metadata
   - Creates initial DocumentVersion (v1.0)
   - Creates AuditLog entry (ACTION: UPLOAD)
   - Returns document details with hash
9. Frontend displays success with verification hash
10. Document appears in user's document list
```

### Flow 2: Upload New Version of Existing Document

```
1. User views document details page
2. User clicks "Upload New Version"
3. Version upload modal appears:
   - File selection
   - Version notes (required)
   - Change summary
4. User selects file and adds notes
5. POST /api/documents/{id}/versions
6. Backend:
   - Validates user has EDIT permission
   - Uploads new file to S3
   - Calculates new SHA-256 hash
   - Increments version number (e.g., v1.0 → v1.1)
   - Creates new DocumentVersion record
   - Links to parent Document
   - Creates timestamp verification
   - Creates AuditLog entry (ACTION: VERSION_UPLOAD)
   - Marks new version as current
7. Frontend updates document view with new version
8. Previous versions remain accessible in version history
```

### Flow 3: View Document with Access Control Check

```
1. User clicks on document in list
2. GET /api/documents/{id}
3. Backend:
   - Checks if document exists
   - Validates user has READ permission based on:
     * Document access level
     * User role
     * Document-specific access grants
   - If authorized:
     * Returns document metadata
     * Returns current version info
     * Creates AuditLog entry (ACTION: VIEW)
   - If unauthorized:
     * Returns 403 Forbidden
4. Frontend displays document details:
   - File preview (if supported)
   - Metadata (name, category, tags, upload date)
   - SHA-256 verification hash
   - Timestamp verification status
   - Version history
   - Download button
   - Edit/Delete buttons (if has permission)
```

### Flow 4: Download Document with Audit Logging

```
1. User clicks "Download" button on document
2. GET /api/documents/{id}/download?version={versionId}
3. Backend:
   - Validates user has DOWNLOAD permission
   - Creates AuditLog entry (ACTION: DOWNLOAD)
   - Generates pre-signed S3 URL (expires in 5 minutes)
   - Returns download URL
4. Frontend initiates download via pre-signed URL
5. Document downloads to user's device
6. Audit log records: user, timestamp, IP address, version
```

### Flow 5: Grant/Revoke Document Access

```
1. Document owner/admin navigates to document settings
2. Clicks "Manage Access"
3. Access management panel displays:
   - Current access level
   - List of users/roles with access
   - Add access button
4. Admin clicks "Add Access"
5. Modal appears:
   - User/Role selector
   - Permission level (READ, DOWNLOAD, EDIT, DELETE, ADMIN)
   - Expiration date (optional)
6. Admin selects user and permissions
7. POST /api/documents/{id}/access
8. Backend:
   - Validates admin has ADMIN permission
   - Creates DocumentAccess record
   - Creates AuditLog entry (ACTION: ACCESS_GRANTED)
9. User now has granted permissions
10. To revoke: DELETE /api/documents/{id}/access/{accessId}
```

### Flow 6: Search and Filter Documents

```
1. User enters search query in search bar
2. Applies filters:
   - Category
   - Date range
   - Tags
   - Access level
   - Uploaded by
3. GET /api/documents/search?q={query}&filters={...}
4. Backend:
   - Builds query with full-text search on name/description
   - Applies filters
   - Only returns documents user has READ access to
   - Sorts by relevance or date
5. Frontend displays results with:
   - Document previews
   - Highlighted search terms
   - Relevant metadata
   - Quick actions (view, download)
```

### Flow 7: Verify Document Timestamp Integrity

```
1. User views document details
2. Clicks "Verify Timestamp"
3. GET /api/documents/{id}/verify
4. Backend:
   - Retrieves document file from S3
   - Calculates current SHA-256 hash
   - Compares with stored hash from timestamp
   - Returns verification result
5. Frontend displays:
   - Original timestamp and hash
   - Current hash
   - Verification status (VERIFIED / MODIFIED / FAILED)
   - Timestamp date and time
   - Blockchain-ready hash for future integration
```

---

## Database Schema

### Document Model

```prisma
model Document {
  id               String   @id @default(cuid())
  name             String
  description      String?
  category         DocumentCategory
  tags             String[]

  // Storage
  s3Key            String   @unique  // S3 object key
  s3Bucket         String              // S3 bucket name
  fileSize         Int                 // Size in bytes
  mimeType         String
  originalFilename String

  // Ownership & Access
  uploadedById     String
  uploadedBy       User     @relation("DocumentsUploaded", fields: [uploadedById], references: [id])
  accessLevel      DocumentAccessLevel @default(MEMBER_ONLY)

  // Versioning
  currentVersionId String?  @unique
  currentVersion   DocumentVersion? @relation("CurrentVersion", fields: [currentVersionId], references: [id])
  versions         DocumentVersion[] @relation("DocumentVersions")

  // Audit & Access
  accessGrants     DocumentAccess[]
  auditLogs        AuditLog[]

  // Timestamps
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([uploadedById])
  @@index([category])
  @@index([accessLevel])
  @@index([createdAt])
  @@index([tags])
}

model DocumentVersion {
  id               String   @id @default(cuid())
  documentId       String
  document         Document @relation("DocumentVersions", fields: [documentId], references: [id], onDelete: Cascade)

  // Version Info
  versionNumber    String              // e.g., "1.0", "1.1", "2.0"
  versionNotes     String?
  changeSummary    String?

  // Storage
  s3Key            String   @unique
  s3Bucket         String
  fileSize         Int
  mimeType         String

  // Timestamp Verification (Blockchain-ready)
  sha256Hash       String              // SHA-256 hash of file content
  timestampedAt    DateTime @default(now())

  // Version metadata
  uploadedById     String
  uploadedBy       User     @relation("DocumentVersionsUploaded", fields: [uploadedById], references: [id])

  // Status
  isCurrent        Boolean  @default(false)

  // Link to current version
  currentFor       Document? @relation("CurrentVersion")

  createdAt        DateTime @default(now())

  @@index([documentId])
  @@index([versionNumber])
  @@index([sha256Hash])
  @@index([timestampedAt])
}

model DocumentAccess {
  id               String   @id @default(cuid())
  documentId       String
  document         Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

  // Grant can be to specific user OR role
  userId           String?
  user             User?    @relation("DocumentAccessGrants", fields: [userId], references: [id], onDelete: Cascade)
  role             UserRole?

  // Permission level
  permission       DocumentPermission

  // Optional expiration
  expiresAt        DateTime?

  // Audit
  grantedById      String
  grantedBy        User     @relation("DocumentAccessGrantedBy", fields: [grantedById], references: [id])
  grantedAt        DateTime @default(now())

  @@unique([documentId, userId])
  @@unique([documentId, role])
  @@index([documentId])
  @@index([userId])
  @@index([role])
  @@index([expiresAt])
}

model AuditLog {
  id               String   @id @default(cuid())

  // Action details
  action           AuditAction
  resourceType     String              // "Document", "DocumentVersion", "DocumentAccess"
  resourceId       String

  // Optional document link
  documentId       String?
  document         Document? @relation(fields: [documentId], references: [id], onDelete: SetNull)

  // Actor
  userId           String
  user             User     @relation("AuditLogs", fields: [userId], references: [id])

  // Context
  ipAddress        String?
  userAgent        String?
  metadata         Json?               // Additional context (version number, old/new values, etc.)

  // Timestamp
  createdAt        DateTime @default(now())

  @@index([documentId])
  @@index([userId])
  @@index([action])
  @@index([createdAt])
  @@index([resourceType, resourceId])
}

enum DocumentCategory {
  STAKEHOLDER_REPORT
  COVENANT_AGREEMENT
  OFFICIAL_RECORD
  MEETING_MINUTES
  FINANCIAL_DOCUMENT
  LEGAL_DOCUMENT
  POLICY_PROCEDURE
  PROJECT_DOCUMENTATION
  CORRESPONDENCE
  OTHER
}

enum DocumentAccessLevel {
  PUBLIC              // Anyone can view (even unauthenticated)
  MEMBER_ONLY         // All authenticated members can view
  ROLE_SPECIFIC       // Only specific roles (defined in DocumentAccess)
  PRIVATE             // Only owner + explicitly granted users
}

enum DocumentPermission {
  READ                // View document details
  DOWNLOAD            // Download document file
  EDIT                // Upload new versions, edit metadata
  DELETE              // Delete document
  ADMIN               // Grant/revoke access, all permissions
}

enum AuditAction {
  UPLOAD
  VIEW
  DOWNLOAD
  VERSION_UPLOAD
  EDIT_METADATA
  DELETE
  ACCESS_GRANTED
  ACCESS_REVOKED
  VERIFY_TIMESTAMP
}
```

### Schema Updates to Existing Models

```prisma
model User {
  // ... existing fields ...

  // Add document relations
  documentsUploaded      Document[] @relation("DocumentsUploaded")
  documentVersions       DocumentVersion[] @relation("DocumentVersionsUploaded")
  documentAccessGrants   DocumentAccess[] @relation("DocumentAccessGrants")
  documentAccessGrantedBy DocumentAccess[] @relation("DocumentAccessGrantedBy")
  auditLogs              AuditLog[] @relation("AuditLogs")
}
```

---

## API Endpoints

### 1. POST /api/documents/upload

**Purpose:** Upload a new document with timestamp verification

**Authentication:** Required (CONTENT_MODERATOR role or higher)

**Request:**
```typescript
// Multipart form data
{
  file: File,
  name: string,
  description?: string,
  category: DocumentCategory,
  tags?: string[],
  accessLevel: DocumentAccessLevel
}
```

**Logic:**
1. Validate user has permission to upload
2. Validate file type and size (max 100MB)
3. Generate unique document ID
4. Calculate SHA-256 hash of file content
5. Upload to S3 with server-side encryption:
   - Bucket: `britepool-documents-{env}`
   - Key: `documents/{year}/{month}/{documentId}/{filename}`
6. Create Document record
7. Create initial DocumentVersion (v1.0) with hash and timestamp
8. Set currentVersionId to new version
9. Create AuditLog entry (UPLOAD)
10. Return document with verification details

**Response:**
```json
{
  "id": "doc_123",
  "name": "Q4 2025 Stakeholder Report",
  "category": "STAKEHOLDER_REPORT",
  "s3Key": "documents/2025/12/doc_123/report.pdf",
  "currentVersion": {
    "id": "ver_456",
    "versionNumber": "1.0",
    "sha256Hash": "a3b2c1d4e5f6...",
    "timestampedAt": "2025-12-18T10:30:00Z",
    "fileSize": 2458624
  },
  "uploadedBy": {
    "id": "user_789",
    "name": "Jane Smith"
  },
  "createdAt": "2025-12-18T10:30:00Z"
}
```

**Error Cases:**
- User lacks permission → 403 Forbidden
- Invalid file type → 400 Bad Request
- File too large → 413 Payload Too Large
- S3 upload fails → 500 Internal Server Error

---

### 2. GET /api/documents

**Purpose:** List documents with filtering and pagination

**Authentication:** Required

**Query Parameters:**
```typescript
{
  page?: number,          // Default: 1
  limit?: number,         // Default: 20, Max: 100
  category?: DocumentCategory,
  tags?: string[],
  search?: string,        // Full-text search on name/description
  uploadedBy?: string,    // User ID
  dateFrom?: string,      // ISO date
  dateTo?: string,        // ISO date
  sortBy?: 'createdAt' | 'name' | 'updatedAt',
  sortOrder?: 'asc' | 'desc'
}
```

**Logic:**
1. Build query based on filters
2. Only include documents user has READ access to:
   - PUBLIC documents
   - MEMBER_ONLY documents (if authenticated)
   - ROLE_SPECIFIC where user's role matches
   - PRIVATE with explicit DocumentAccess grant
3. Apply pagination
4. Return document list with metadata

**Response:**
```json
{
  "documents": [
    {
      "id": "doc_123",
      "name": "Q4 2025 Stakeholder Report",
      "description": "Quarterly update for stakeholders",
      "category": "STAKEHOLDER_REPORT",
      "tags": ["quarterly", "2025", "stakeholders"],
      "accessLevel": "MEMBER_ONLY",
      "currentVersion": {
        "versionNumber": "1.2",
        "sha256Hash": "a3b2c1...",
        "timestampedAt": "2025-12-18T10:30:00Z",
        "fileSize": 2458624
      },
      "uploadedBy": {
        "id": "user_789",
        "name": "Jane Smith"
      },
      "createdAt": "2025-12-01T09:00:00Z",
      "updatedAt": "2025-12-18T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 145,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

---

### 3. GET /api/documents/{id}

**Purpose:** Get detailed document information

**Authentication:** Required

**Response:**
```json
{
  "id": "doc_123",
  "name": "Q4 2025 Stakeholder Report",
  "description": "Quarterly update for stakeholders",
  "category": "STAKEHOLDER_REPORT",
  "tags": ["quarterly", "2025", "stakeholders"],
  "accessLevel": "MEMBER_ONLY",
  "mimeType": "application/pdf",
  "originalFilename": "Q4-2025-Report.pdf",
  "currentVersion": {
    "id": "ver_456",
    "versionNumber": "1.2",
    "sha256Hash": "a3b2c1d4e5f6...",
    "timestampedAt": "2025-12-18T10:30:00Z",
    "fileSize": 2458624,
    "versionNotes": "Updated financial projections",
    "uploadedBy": {
      "id": "user_789",
      "name": "Jane Smith"
    }
  },
  "versions": [
    {
      "id": "ver_456",
      "versionNumber": "1.2",
      "timestampedAt": "2025-12-18T10:30:00Z",
      "isCurrent": true
    },
    {
      "id": "ver_455",
      "versionNumber": "1.1",
      "timestampedAt": "2025-12-15T14:20:00Z",
      "isCurrent": false
    }
  ],
  "uploadedBy": {
    "id": "user_789",
    "name": "Jane Smith",
    "role": "BOARD_CHAIR"
  },
  "userPermissions": ["READ", "DOWNLOAD", "EDIT"],
  "createdAt": "2025-12-01T09:00:00Z",
  "updatedAt": "2025-12-18T10:30:00Z"
}
```

**Logic:**
1. Check user has READ permission
2. Create audit log entry (VIEW)
3. Return document details with version history
4. Include user's effective permissions

**Error Cases:**
- Document not found → 404 Not Found
- User lacks READ permission → 403 Forbidden

---

### 4. GET /api/documents/{id}/download

**Purpose:** Download document file (generates pre-signed S3 URL)

**Authentication:** Required

**Query Parameters:**
```typescript
{
  versionId?: string  // Optional: download specific version (default: current)
}
```

**Logic:**
1. Validate user has DOWNLOAD permission
2. Get requested version (or current if not specified)
3. Generate pre-signed S3 URL (expires in 5 minutes)
4. Create audit log entry (DOWNLOAD)
5. Return download URL

**Response:**
```json
{
  "downloadUrl": "https://britepool-documents.s3.amazonaws.com/...",
  "expiresAt": "2025-12-18T10:35:00Z",
  "filename": "Q4-2025-Report.pdf",
  "fileSize": 2458624,
  "mimeType": "application/pdf"
}
```

**Error Cases:**
- Document not found → 404 Not Found
- Version not found → 404 Not Found
- User lacks DOWNLOAD permission → 403 Forbidden
- S3 error → 500 Internal Server Error

---

### 5. POST /api/documents/{id}/versions

**Purpose:** Upload new version of existing document

**Authentication:** Required (EDIT permission)

**Request:**
```typescript
// Multipart form data
{
  file: File,
  versionNotes?: string,
  changeSummary?: string
}
```

**Logic:**
1. Validate user has EDIT permission
2. Validate file type matches original document
3. Parse previous version number and increment (e.g., "1.2" → "1.3")
4. Calculate SHA-256 hash
5. Upload to S3
6. Create DocumentVersion record
7. Update Document.currentVersionId
8. Create audit log entry (VERSION_UPLOAD)
9. Return new version details

**Response:**
```json
{
  "id": "ver_457",
  "versionNumber": "1.3",
  "sha256Hash": "b4c3d2e1f0...",
  "timestampedAt": "2025-12-19T11:00:00Z",
  "fileSize": 2460000,
  "versionNotes": "Added appendix with Q1 projections",
  "uploadedBy": {
    "id": "user_789",
    "name": "Jane Smith"
  }
}
```

---

### 6. GET /api/documents/{id}/verify

**Purpose:** Verify document timestamp integrity

**Authentication:** Required (READ permission)

**Query Parameters:**
```typescript
{
  versionId?: string  // Optional: verify specific version
}
```

**Logic:**
1. Validate user has READ permission
2. Get requested version
3. Download file from S3
4. Calculate current SHA-256 hash
5. Compare with stored hash
6. Create audit log entry (VERIFY_TIMESTAMP)
7. Return verification result

**Response:**
```json
{
  "verified": true,
  "versionId": "ver_456",
  "versionNumber": "1.2",
  "originalHash": "a3b2c1d4e5f6...",
  "currentHash": "a3b2c1d4e5f6...",
  "timestampedAt": "2025-12-18T10:30:00Z",
  "verifiedAt": "2025-12-19T12:00:00Z",
  "message": "Document integrity verified. Hash matches original timestamp."
}
```

If hash mismatch:
```json
{
  "verified": false,
  "versionId": "ver_456",
  "versionNumber": "1.2",
  "originalHash": "a3b2c1d4e5f6...",
  "currentHash": "different123...",
  "timestampedAt": "2025-12-18T10:30:00Z",
  "verifiedAt": "2025-12-19T12:00:00Z",
  "message": "WARNING: Document has been modified since timestamp. Hash mismatch detected."
}
```

---

### 7. PUT /api/documents/{id}

**Purpose:** Update document metadata

**Authentication:** Required (EDIT permission)

**Request:**
```json
{
  "name": "Q4 2025 Stakeholder Report - FINAL",
  "description": "Updated description",
  "category": "STAKEHOLDER_REPORT",
  "tags": ["quarterly", "2025", "stakeholders", "final"],
  "accessLevel": "MEMBER_ONLY"
}
```

**Logic:**
1. Validate user has EDIT permission
2. Update Document record
3. Create audit log entry (EDIT_METADATA) with old/new values
4. Return updated document

**Response:** Same as GET /api/documents/{id}

---

### 8. DELETE /api/documents/{id}

**Purpose:** Delete document (soft delete with audit trail)

**Authentication:** Required (DELETE permission)

**Logic:**
1. Validate user has DELETE permission
2. Mark document as deleted (soft delete) OR permanently delete from S3 and DB
3. Create audit log entry (DELETE)
4. Return success

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

---

### 9. POST /api/documents/{id}/access

**Purpose:** Grant access to user or role

**Authentication:** Required (ADMIN permission)

**Request:**
```json
{
  "userId": "user_123",      // OR
  "role": "COMMITTEE_LEADER",
  "permission": "READ",
  "expiresAt": "2026-01-01T00:00:00Z"  // Optional
}
```

**Logic:**
1. Validate user has ADMIN permission
2. Create DocumentAccess record
3. Create audit log entry (ACCESS_GRANTED)
4. Return access grant details

**Response:**
```json
{
  "id": "access_789",
  "documentId": "doc_123",
  "userId": "user_123",
  "permission": "READ",
  "expiresAt": "2026-01-01T00:00:00Z",
  "grantedBy": {
    "id": "user_456",
    "name": "Admin User"
  },
  "grantedAt": "2025-12-19T13:00:00Z"
}
```

---

### 10. DELETE /api/documents/{id}/access/{accessId}

**Purpose:** Revoke access grant

**Authentication:** Required (ADMIN permission)

**Logic:**
1. Validate user has ADMIN permission
2. Delete DocumentAccess record
3. Create audit log entry (ACCESS_REVOKED)
4. Return success

**Response:**
```json
{
  "success": true,
  "message": "Access revoked successfully"
}
```

---

### 11. GET /api/documents/search

**Purpose:** Full-text search with advanced filtering

**Authentication:** Required

**Query Parameters:**
```typescript
{
  q: string,              // Search query
  category?: DocumentCategory[],
  tags?: string[],
  dateFrom?: string,
  dateTo?: string,
  uploadedBy?: string,
  page?: number,
  limit?: number
}
```

**Logic:**
1. Perform full-text search on name and description
2. Apply filters
3. Only return documents user has READ access to
4. Rank by relevance score
5. Return paginated results

**Response:** Same structure as GET /api/documents

---

### 12. GET /api/audit-logs

**Purpose:** Get audit logs (admin only)

**Authentication:** Required (WEB_STEWARD or BOARD_CHAIR)

**Query Parameters:**
```typescript
{
  documentId?: string,
  userId?: string,
  action?: AuditAction,
  dateFrom?: string,
  dateTo?: string,
  page?: number,
  limit?: number
}
```

**Response:**
```json
{
  "logs": [
    {
      "id": "log_123",
      "action": "DOWNLOAD",
      "resourceType": "Document",
      "resourceId": "doc_123",
      "document": {
        "id": "doc_123",
        "name": "Q4 2025 Stakeholder Report"
      },
      "user": {
        "id": "user_456",
        "name": "John Doe",
        "role": "STEWARD"
      },
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "metadata": {
        "versionNumber": "1.2"
      },
      "createdAt": "2025-12-19T14:30:00Z"
    }
  ],
  "pagination": {
    "total": 1247,
    "page": 1,
    "limit": 50,
    "pages": 25
  }
}
```

---

## UI Components

### 1. Document List Page

**Location:** `app/dashboard/documents/page.tsx`

**Features:**
- Responsive grid/list view toggle
- Document cards with:
  - Icon based on file type
  - Name and description
  - Category badge
  - Tags
  - Upload date and author
  - Quick actions (view, download, edit if permitted)
- Advanced filters sidebar:
  - Category multi-select
  - Tag cloud/multi-select
  - Date range picker
  - Uploaded by selector
- Search bar with debounced search
- Pagination controls
- "Upload Document" button (if has permission)

**Component Structure:**
```tsx
export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [filters, setFilters] = useState({});
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  return (
    <div className="flex gap-6">
      <DocumentFilters
        filters={filters}
        onChange={setFilters}
      />

      <div className="flex-1">
        <DocumentListHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <DocumentGrid
          documents={documents}
          viewMode={viewMode}
        />

        <Pagination />
      </div>
    </div>
  );
}
```

---

### 2. Document Details Page

**Location:** `app/dashboard/documents/[id]/page.tsx`

**Features:**
- Document preview (if supported format)
- Metadata display:
  - Name, description, category
  - Tags
  - File size, type
  - Upload date and author
- Current version info:
  - Version number
  - SHA-256 hash (with copy button)
  - Timestamp date
  - Verification status badge
- Action buttons:
  - Download
  - Upload New Version (if has EDIT)
  - Edit Metadata (if has EDIT)
  - Manage Access (if has ADMIN)
  - Verify Timestamp
  - Delete (if has DELETE)
- Version History section:
  - List of all versions
  - Download specific version
  - View version details
- Access Control section (if has ADMIN):
  - Current access grants
  - Add/revoke access
- Activity Log section:
  - Recent audit log entries for this document

**Component:**
```tsx
export default function DocumentDetailsPage({ params }: { params: { id: string } }) {
  const { data: document } = useDocument(params.id);
  const { data: versions } = useDocumentVersions(params.id);
  const { data: auditLogs } = useDocumentAuditLogs(params.id);

  const handleVerifyTimestamp = async () => {
    const result = await verifyDocumentTimestamp(params.id);
    // Display verification result
  };

  return (
    <div className="max-w-6xl mx-auto">
      <DocumentHeader document={document} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DocumentPreview document={document} />
          <DocumentMetadata document={document} />
          <VersionHistory versions={versions} />
        </div>

        <div className="space-y-6">
          <DocumentActions
            document={document}
            onVerify={handleVerifyTimestamp}
          />
          <TimestampVerification document={document} />
          {hasPermission('ADMIN') && (
            <AccessControl documentId={params.id} />
          )}
          <ActivityLog logs={auditLogs} />
        </div>
      </div>
    </div>
  );
}
```

---

### 3. Upload Document Modal

**Component:** `DocumentUploadModal`

**Features:**
- Drag-and-drop file upload
- File type validation
- Progress bar during upload
- Form fields:
  - Document name (auto-filled from filename)
  - Description (textarea)
  - Category (select)
  - Tags (multi-select with autocomplete)
  - Access level (radio buttons)
- SHA-256 hash display after upload
- Success message with verification details

**Component:**
```tsx
export function DocumentUploadModal({ isOpen, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUpload = async (formData: DocumentFormData) => {
    setUploading(true);

    const result = await uploadDocument({
      file,
      ...formData
    }, {
      onProgress: (progress) => setUploadProgress(progress)
    });

    if (result.success) {
      toast.success(`Document uploaded successfully! SHA-256: ${result.sha256Hash.slice(0, 16)}...`);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <FileDropzone onFileSelected={setFile} />

      {file && (
        <form onSubmit={handleUpload}>
          <Input name="name" defaultValue={file.name} />
          <Textarea name="description" />
          <Select name="category" options={documentCategories} />
          <TagInput name="tags" />
          <RadioGroup name="accessLevel" options={accessLevels} />

          <Button type="submit" disabled={uploading}>
            {uploading ? `Uploading... ${uploadProgress}%` : 'Upload Document'}
          </Button>
        </form>
      )}
    </Dialog>
  );
}
```

---

### 4. Version History Component

**Component:** `VersionHistory`

**Features:**
- Timeline view of all versions
- Each version shows:
  - Version number
  - Upload date and author
  - File size
  - Version notes
  - SHA-256 hash
  - Download button
  - "View Details" button
- Current version highlighted
- Diff view between versions (optional enhancement)

---

### 5. Timestamp Verification Badge

**Component:** `TimestampVerificationBadge`

**Features:**
- Visual badge showing verification status
- Click to verify/re-verify
- Display verification result:
  - Green checkmark: Verified
  - Red X: Hash mismatch
  - Yellow warning: Not yet verified
- Show timestamp date
- Blockchain-ready indicator

---

### 6. Access Control Panel

**Component:** `AccessControlPanel`

**Features:**
- List current access grants:
  - User/role name
  - Permission level
  - Expiration date (if set)
  - Granted by and date
  - Revoke button
- "Add Access" button
- Add access modal:
  - Search users or select role
  - Permission level selector
  - Optional expiration date
  - Submit to grant access

---

### 7. Document Search Component

**Component:** `DocumentSearch`

**Features:**
- Search input with autocomplete suggestions
- Advanced filters toggle
- Filter panel with:
  - Category checkboxes
  - Tag cloud
  - Date range picker
  - Uploaded by selector
- Active filters display with remove buttons
- Clear all filters button
- Search result count

---

### 8. Audit Log Viewer (Admin)

**Location:** `app/dashboard/admin/audit-logs/page.tsx`

**Features:**
- Filterable audit log table:
  - Action type
  - Document name
  - User
  - IP address
  - Timestamp
- Export to CSV
- Date range filter
- Action type filter
- User filter
- Document filter
- Pagination

---

## Implementation Details

### Phase 1: AWS S3 Setup & Infrastructure (Days 1-2)

**Tasks:**
1. Create S3 bucket: `britepool-documents-{env}`
2. Configure bucket settings:
   - Enable server-side encryption (AES-256)
   - Enable versioning
   - Set lifecycle policies (optional: archive after 1 year)
   - Configure CORS for browser uploads
3. Create IAM role for application with permissions:
   - `s3:PutObject`
   - `s3:GetObject`
   - `s3:DeleteObject`
   - `s3:ListBucket`
4. Install AWS SDK: `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
5. Create S3 utility functions:
   ```typescript
   // lib/s3.ts
   import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
   import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

   export async function uploadToS3(file: Buffer, key: string) {
     const client = new S3Client({ region: process.env.AWS_REGION });
     const command = new PutObjectCommand({
       Bucket: process.env.S3_BUCKET,
       Key: key,
       Body: file,
       ServerSideEncryption: 'AES256'
     });
     return await client.send(command);
   }

   export async function getDownloadUrl(key: string, expiresIn = 300) {
     const client = new S3Client({ region: process.env.AWS_REGION });
     const command = new GetObjectCommand({
       Bucket: process.env.S3_BUCKET,
       Key: key
     });
     return await getSignedUrl(client, command, { expiresIn });
   }
   ```
6. Create SHA-256 hashing utility:
   ```typescript
   // lib/hash.ts
   import crypto from 'crypto';

   export function calculateSHA256(buffer: Buffer): string {
     return crypto.createHash('sha256').update(buffer).digest('hex');
   }
   ```
7. Environment variables:
   - `AWS_REGION`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `S3_BUCKET`

---

### Phase 2: Database Schema & Models (Days 3-4)

**Tasks:**
1. Update `prisma/schema.prisma` with new models
2. Run migration: `npx prisma migrate dev --name add-document-management`
3. Generate Prisma client: `npx prisma generate`
4. Create seed data for testing:
   ```typescript
   // prisma/seed-documents.ts
   async function seedDocuments() {
     // Create sample documents
     // Create sample versions
     // Create sample access grants
     // Create sample audit logs
   }
   ```
5. Create Prisma query helpers:
   ```typescript
   // lib/db/documents.ts
   export async function getUserDocumentPermissions(
     userId: string,
     documentId: string
   ): Promise<DocumentPermission[]> {
     // Check access level
     // Check role-based access
     // Check explicit grants
     // Return effective permissions
   }
   ```

---

### Phase 3: API Routes (Days 5-8)

**Tasks:**
1. Create API route handlers:
   - `app/api/documents/upload/route.ts`
   - `app/api/documents/route.ts` (list)
   - `app/api/documents/[id]/route.ts` (get, update, delete)
   - `app/api/documents/[id]/download/route.ts`
   - `app/api/documents/[id]/versions/route.ts`
   - `app/api/documents/[id]/verify/route.ts`
   - `app/api/documents/[id]/access/route.ts`
   - `app/api/documents/search/route.ts`
   - `app/api/audit-logs/route.ts`

2. Implement permission checking middleware:
   ```typescript
   // lib/middleware/document-permissions.ts
   export async function checkDocumentPermission(
     userId: string,
     documentId: string,
     requiredPermission: DocumentPermission
   ): Promise<boolean> {
     const permissions = await getUserDocumentPermissions(userId, documentId);
     return permissions.includes(requiredPermission);
   }
   ```

3. Implement audit logging helper:
   ```typescript
   // lib/audit.ts
   export async function logAudit(params: {
     action: AuditAction,
     resourceType: string,
     resourceId: string,
     userId: string,
     documentId?: string,
     ipAddress?: string,
     userAgent?: string,
     metadata?: any
   }) {
     await prisma.auditLog.create({ data: params });
   }
   ```

4. File upload handling with multipart form data
5. Version number increment logic
6. SHA-256 verification implementation
7. Access control enforcement on all routes

---

### Phase 4: Frontend Components (Days 9-11)

**Tasks:**
1. Create document list page with filters
2. Create document details page
3. Create upload modal component
4. Create version history component
5. Create timestamp verification badge
6. Create access control panel
7. Create search component
8. Implement file preview for supported formats (PDF, images)
9. Create audit log viewer (admin)
10. Add document icons based on file type
11. Implement drag-and-drop upload with progress tracking
12. Add toast notifications for success/error states

**Key Libraries:**
- `react-dropzone` for file uploads
- `react-day-picker` for date range filters
- `react-pdf` for PDF preview
- `@headlessui/react` for modals and dropdowns

---

### Phase 5: Search & Filtering (Day 12)

**Tasks:**
1. Implement full-text search in database:
   ```prisma
   // Add to schema
   @@fulltext([name, description])
   ```
2. Create search API with relevance ranking
3. Implement tag autocomplete
4. Add category filters
5. Add date range filtering
6. Implement result highlighting
7. Add search debouncing on frontend
8. Create saved search filters (optional)

---

### Phase 6: Testing & Security Hardening (Days 13-14)

**Tasks:**
1. Unit tests for:
   - SHA-256 hash calculation
   - Permission checking logic
   - Version increment logic
   - Access control rules
2. Integration tests for:
   - Document upload flow
   - Version upload flow
   - Access grant/revoke flow
   - Timestamp verification
3. E2E tests for:
   - Complete document lifecycle
   - Search and filtering
   - Multi-user access scenarios
4. Security audit:
   - SQL injection prevention (Prisma handles this)
   - XSS prevention in document names/descriptions
   - CSRF protection on all mutations
   - Rate limiting on upload endpoints
   - File type validation
   - File size limits
   - S3 bucket security review
5. Performance testing:
   - Load testing for concurrent uploads
   - Search performance with large datasets
   - Download URL generation time
6. Accessibility audit:
   - Keyboard navigation
   - Screen reader support
   - ARIA labels
   - Color contrast

---

## Testing Requirements

### Unit Tests

```typescript
// tests/lib/hash.test.ts
test('calculateSHA256 returns consistent hash', () => {
  const buffer = Buffer.from('test content');
  const hash1 = calculateSHA256(buffer);
  const hash2 = calculateSHA256(buffer);
  expect(hash1).toBe(hash2);
  expect(hash1).toHaveLength(64); // SHA-256 is 64 hex chars
});

// tests/lib/permissions.test.ts
test('getUserDocumentPermissions returns correct permissions', async () => {
  // Test PUBLIC document
  // Test MEMBER_ONLY document
  // Test ROLE_SPECIFIC document
  // Test PRIVATE document with grant
  // Test PRIVATE document without grant
});

// tests/lib/version.test.ts
test('incrementVersionNumber works correctly', () => {
  expect(incrementVersion('1.0')).toBe('1.1');
  expect(incrementVersion('1.9')).toBe('1.10');
  expect(incrementVersion('2.5')).toBe('2.6');
});
```

### Integration Tests

```typescript
// tests/api/documents.test.ts
test('POST /api/documents/upload creates document with version and hash', async () => {
  const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', 'Test Document');
  formData.append('category', 'OTHER');

  const res = await fetch('/api/documents/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });

  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.currentVersion.sha256Hash).toBeTruthy();
  expect(data.currentVersion.versionNumber).toBe('1.0');
});

test('Access control prevents unauthorized download', async () => {
  const res = await fetch(`/api/documents/${privateDocId}/download`, {
    headers: { 'Authorization': `Bearer ${unauthorizedToken}` }
  });

  expect(res.status).toBe(403);
});
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/document-lifecycle.spec.ts
test('complete document lifecycle', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'admin@britepool.org');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Navigate to documents
  await page.goto('/dashboard/documents');

  // Upload document
  await page.click('text=Upload Document');
  await page.setInputFiles('input[type="file"]', 'test-files/sample.pdf');
  await page.fill('[name="name"]', 'E2E Test Document');
  await page.selectOption('[name="category"]', 'OTHER');
  await page.click('button:has-text("Upload")');

  // Verify success
  await expect(page.locator('text=Document uploaded successfully')).toBeVisible();

  // Click on document
  await page.click('text=E2E Test Document');

  // Verify timestamp
  await page.click('text=Verify Timestamp');
  await expect(page.locator('text=Document integrity verified')).toBeVisible();

  // Upload new version
  await page.click('text=Upload New Version');
  await page.setInputFiles('input[type="file"]', 'test-files/sample-v2.pdf');
  await page.fill('[name="versionNotes"]', 'Second version');
  await page.click('button:has-text("Upload Version")');

  // Verify version history
  await expect(page.locator('text=Version 1.1')).toBeVisible();
  await expect(page.locator('text=Version 1.0')).toBeVisible();

  // Download document
  await page.click('text=Download');
  // Verify download started

  // Delete document
  await page.click('text=Delete');
  await page.click('text=Confirm');
  await expect(page.locator('text=Document deleted')).toBeVisible();
});
```

### Manual Testing Checklist

- [ ] Upload document with all required fields
- [ ] Upload document with optional fields
- [ ] Upload fails with invalid file type
- [ ] Upload fails when file too large
- [ ] Download document generates valid S3 URL
- [ ] Download URL expires after 5 minutes
- [ ] Upload new version increments version number
- [ ] Version history shows all versions
- [ ] Timestamp verification works for unmodified file
- [ ] Timestamp verification fails for modified file
- [ ] PUBLIC documents accessible without login
- [ ] MEMBER_ONLY documents require authentication
- [ ] PRIVATE documents require explicit access grant
- [ ] Access grant works for specific user
- [ ] Access grant works for role
- [ ] Access revoke removes permissions
- [ ] Search returns relevant results
- [ ] Filters work correctly
- [ ] Pagination works
- [ ] Audit logs capture all actions
- [ ] Admin can view all audit logs
- [ ] Non-admin cannot access audit logs
- [ ] Metadata editing works
- [ ] Document deletion works (soft delete)
- [ ] UI is responsive on mobile
- [ ] Drag-and-drop upload works
- [ ] File type icons display correctly

---

## Deployment Checklist

### Pre-Deployment

- [ ] AWS S3 bucket created and configured
- [ ] IAM roles and policies configured
- [ ] Environment variables set in production:
  - `AWS_REGION`
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `S3_BUCKET`
- [ ] Database migration run: `npx prisma migrate deploy`
- [ ] Prisma client generated: `npx prisma generate`
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance testing completed
- [ ] Accessibility audit completed

### Deployment Steps

1. Deploy database migrations
2. Deploy application code
3. Verify environment variables
4. Test S3 upload/download in production
5. Test permissions and access control
6. Test timestamp verification
7. Monitor error logs
8. Monitor S3 costs

### Post-Deployment

- [ ] Verify document upload works
- [ ] Verify document download works
- [ ] Verify version control works
- [ ] Verify timestamp verification works
- [ ] Verify access control enforced
- [ ] Verify audit logging working
- [ ] Monitor S3 storage usage
- [ ] Monitor API performance
- [ ] Set up alerts for errors
- [ ] Document admin procedures
- [ ] Train users on document management features

---

## Security Considerations

### Data Security
- All documents encrypted at rest (S3 server-side encryption)
- All documents encrypted in transit (HTTPS/TLS)
- Pre-signed URLs expire after 5 minutes
- No direct S3 access (all through API with auth)

### Access Control
- Role-based access control (RBAC)
- Document-level permissions
- User-specific access grants
- Permission expiration support
- Admin-only access to audit logs

### Audit Trail
- Immutable audit logs
- All actions logged with timestamp, user, IP
- Cannot delete or modify audit logs
- Audit logs include metadata for context

### File Upload Security
- File type validation (whitelist)
- File size limits (100MB max)
- Virus scanning (optional: integrate ClamAV)
- Filename sanitization
- CSRF protection
- Rate limiting on upload endpoints

### Authentication & Authorization
- All API routes require authentication
- JWT token validation
- Permission checks on all document operations
- Session management

---

## Future Enhancements

### Phase 2 Features (Post-MVP)

1. **Blockchain Integration**
   - Submit SHA-256 hashes to blockchain (Ethereum, Polygon)
   - Immutable timestamp proof
   - Public verification portal
   - Smart contract for document registry

2. **Advanced Search**
   - OCR for PDF text extraction
   - Full-content search (not just metadata)
   - Semantic search with AI
   - Search within document content

3. **Collaboration Features**
   - Document comments and annotations
   - Real-time collaborative editing (for supported formats)
   - Document approval workflows
   - Review and sign-off tracking

4. **Enhanced Previews**
   - In-browser PDF viewer with annotations
   - Video player for media files
   - Office document preview (Word, Excel, PowerPoint)
   - 3D model viewer

5. **Automation**
   - Automatic document categorization (AI)
   - Auto-tagging based on content
   - OCR and metadata extraction
   - Duplicate detection

6. **Notifications**
   - Email alerts for new documents
   - Notification when access granted
   - Reminders for document expiration
   - Weekly digest of new documents

7. **Advanced Analytics**
   - Document usage statistics
   - Popular documents dashboard
   - User engagement metrics
   - Storage usage trends

8. **Templates & Forms**
   - Document templates
   - Form generation from templates
   - Electronic signatures
   - Form submission tracking

9. **Integration**
   - Google Drive sync
   - Dropbox sync
   - OneDrive sync
   - Email integration (attach documents)

10. **Mobile App**
    - Native mobile app for iOS/Android
    - Mobile document scanning
    - Offline access
    - Push notifications

---

## Performance Optimization

### Caching Strategy
- Cache document metadata (Redis)
- Cache user permissions (5 minute TTL)
- CDN for document downloads (CloudFront)
- Client-side caching of document list

### Database Optimization
- Indexes on frequently queried fields
- Pagination for large result sets
- Eager loading of relations
- Connection pooling

### S3 Optimization
- Use S3 Transfer Acceleration for large uploads
- Multipart upload for files > 5MB
- Pre-signed URLs for downloads (avoid proxy)
- Lifecycle policies to archive old versions

### Frontend Optimization
- Lazy loading for document list
- Virtual scrolling for large lists
- Image optimization for thumbnails
- Code splitting for upload modal

---

**Spec Complete** ✓

Next step: Run `/create-tasks` to generate implementation task list.
