# Specification: Internal Management Software Integration

**Feature ID:** F025
**Priority:** High
**Effort:** Large (2 weeks / 14 days)
**Dependencies:** Authentication System (F002), Admin Panel (F022)
**Status:** Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [User Flows](#user-flows)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Webhook Architecture](#webhook-architecture)
6. [Scheduled Jobs](#scheduled-jobs)
7. [Data Mapping Schemas](#data-mapping-schemas)
8. [Sync Conflict Resolution](#sync-conflict-resolution)
9. [Monitoring & Logging](#monitoring--logging)
10. [UI Components](#ui-components)
11. [Implementation Details](#implementation-details)
12. [Testing Requirements](#testing-requirements)
13. [Deployment Checklist](#deployment-checklist)

---

## Overview

### Purpose
Implement a robust integration layer that enables bidirectional synchronization between the BritePool platform and external internal management systems (project management, time tracking, CRM, etc.). This integration ensures data consistency across platforms, automates progress tracking, and reduces manual data entry while maintaining audit trails and handling edge cases gracefully.

### Key Requirements
- RESTful API integration layer with authentication
- Bidirectional data synchronization for member data, tasks, and participation logs
- Real-time webhook receivers for instant updates from external systems
- Scheduled cron jobs for batch synchronization operations
- Comprehensive error handling with exponential backoff retry logic
- Data conflict resolution with configurable merge strategies
- Complete audit logging of all sync operations
- Admin dashboard for monitoring sync status and troubleshooting
- Support for multiple external systems simultaneously

### Success Metrics
- 99.9% sync success rate across all integrations
- Real-time updates delivered within 30 seconds of external changes
- Zero data loss during conflict resolution
- Complete audit trail for all sync operations
- Admin can diagnose and resolve sync issues without developer intervention
- Batch sync jobs complete within scheduled windows

### Supported External Systems
- **Phase 1:** Generic REST API integration (Asana, Trello, Monday.com, ClickUp)
- **Phase 2:** Time tracking systems (Toggl, Harvest, Clockify)
- **Phase 3:** CRM systems (HubSpot, Salesforce)

---

## User Flows

### Flow 1: Admin Configures New External System Integration

```
1. Admin logs in with WEB_STEWARD or BOARD_CHAIR role
2. Admin navigates to /dashboard/admin/integrations
3. Admin sees list of available integration types
4. Admin clicks "Add Integration" button
5. Admin selects integration type (e.g., "Asana", "Generic REST API")
6. Integration configuration form appears:
   - Integration Name (e.g., "Main Asana Workspace")
   - API Endpoint Base URL
   - Authentication Type (API Key, OAuth2, Basic Auth)
   - Authentication Credentials (encrypted storage)
   - Sync Direction (One-way: External→BritePool, One-way: BritePool→External, Bidirectional)
   - Sync Frequency (Real-time via webhook, Hourly, Daily, Manual only)
   - Data Types to Sync (Tasks, Members, Participation Logs, Events)
   - Conflict Resolution Strategy (Latest wins, Manual review, Custom rules)
7. Admin submits form → POST /api/admin/integrations
8. System validates:
   - API endpoint is reachable
   - Credentials are valid (test API call)
   - Webhook URL can be registered (if applicable)
9. Integration created with status: ACTIVE
10. Webhook receiver endpoint generated: /api/webhooks/integrations/[integrationId]
11. Admin copies webhook URL to configure in external system
12. Initial full sync job scheduled automatically
13. Admin redirected to integration detail page showing sync status
```

### Flow 2: External System Sends Webhook Update (Real-time Sync)

```
1. User updates a task in external system (e.g., Asana)
2. External system sends webhook POST to /api/webhooks/integrations/[integrationId]
3. Webhook receiver validates:
   - Webhook signature (HMAC verification)
   - Integration is ACTIVE
   - Request payload matches expected schema
4. Webhook payload parsed and mapped to BritePool data format:
   - External task ID → internal Task ID (via IntegrationMapping)
   - External field names → BritePool field names
   - External status values → BritePool TaskStatus enum
5. System checks for existing mapped record:
   - If mapping exists → Update existing Task
   - If no mapping → Create new Task and mapping
6. Conflict detection:
   - Compare lastSyncedAt timestamp with Task.updatedAt
   - If local changes exist after lastSyncedAt → CONFLICT
7. If no conflict:
   - Apply changes to Task record
   - Update IntegrationMapping.lastSyncedAt
   - Create SyncLog entry (status: SUCCESS)
8. If conflict:
   - Execute conflict resolution strategy:
     * LATEST_WINS: External change overwrites local
     * MANUAL_REVIEW: Create ConflictResolution record, notify admin
     * CUSTOM_RULES: Apply configured merge logic
   - Create SyncLog entry (status: CONFLICT_RESOLVED or CONFLICT_PENDING)
9. Webhook returns 200 OK response
10. If error occurs:
    - Log detailed error in SyncLog
    - Return appropriate error code (400, 500)
    - External system may retry based on its retry policy
```

### Flow 3: Scheduled Batch Sync Job Executes

```
1. Cron scheduler triggers at configured time (e.g., every hour)
2. System queries for all integrations with:
   - status = ACTIVE
   - syncFrequency = HOURLY (or DAILY for daily jobs)
3. For each integration:
   a. Fetch integration configuration and credentials
   b. Make API call to external system: GET /api/tasks?updated_since=[lastSyncAt]
   c. Parse response and extract updated records
   d. For each external record:
      - Map external ID to internal ID via IntegrationMapping
      - Transform data using data mapping schema
      - Detect conflicts by comparing timestamps
      - Apply changes or queue for manual review
      - Update IntegrationMapping and SyncLog
   e. If bidirectional sync:
      - Fetch local changes since last sync
      - Transform to external format
      - Send batch update to external system
      - Log results
4. Create JobExecution record with:
   - Job type: SCHEDULED_SYNC
   - Total records processed
   - Success count, error count, conflict count
   - Execution duration
   - Error details (if any)
5. If errors exceed threshold (e.g., >10% failure rate):
   - Mark integration as DEGRADED
   - Send notification to admin
6. Update integration.lastSyncAt timestamp
7. Schedule next execution
```

### Flow 4: Admin Resolves Sync Conflict Manually

```
1. Admin receives notification: "Sync conflict detected in Task #123"
2. Admin navigates to /dashboard/admin/integrations/conflicts
3. Admin sees list of pending conflicts with:
   - Affected record (Task, Member, etc.)
   - Conflict timestamp
   - Local version (BritePool data)
   - External version (external system data)
   - Diff visualization showing changes
4. Admin clicks on conflict to view details
5. Conflict resolution panel shows:
   - Side-by-side comparison of fields
   - Highlighted differences
   - Conflict reason (e.g., "Both systems modified 'status' field")
   - Resolution options:
     * Keep Local Version
     * Keep External Version
     * Merge Both (manual field selection)
     * Custom Edit (edit fields directly)
6. Admin selects resolution option
7. If "Merge Both":
   - Admin selects which field values to keep per field
8. Admin clicks "Resolve Conflict"
9. POST /api/admin/integrations/conflicts/[id]/resolve
10. System validates admin has permission
11. Apply chosen resolution:
    - Update Task with resolved data
    - Update IntegrationMapping.lastSyncedAt
    - Mark ConflictResolution.status = RESOLVED
    - Optionally push resolution to external system
12. Create audit log entry
13. Admin redirected back to conflicts list
14. Conflict removed from pending list
```

### Flow 5: Scheduled Job Fails with Retry Logic

```
1. Cron job executes scheduled sync
2. API call to external system fails:
   - Connection timeout
   - 500 Internal Server Error
   - 429 Rate Limit Exceeded
   - 401 Unauthorized (credentials expired)
3. Error handler catches exception
4. System checks retry policy:
   - Max retries: 5
   - Backoff strategy: Exponential (1m, 2m, 4m, 8m, 16m)
   - Retry on: 5xx errors, timeouts, rate limits
   - Don't retry on: 4xx errors (except 429)
5. If retries available:
   - Create retry job with exponential delay
   - Log retry attempt in SyncLog
   - Wait for backoff period
   - Retry API call
6. If retry succeeds:
   - Continue with normal sync flow
   - Mark SyncLog.status = SUCCESS (after retry)
7. If all retries exhausted:
   - Mark integration as ERROR state
   - Create detailed error log with:
     * Error type and message
     * HTTP response (if available)
     * Request details (sanitized, no credentials)
     * Timestamp of each retry attempt
   - Send alert to admin
   - Disable future sync attempts until admin resolves
8. Admin receives email/notification with:
   - Integration name
   - Error summary
   - Link to troubleshooting dashboard
9. Admin can:
   - View error logs
   - Test connection manually
   - Update credentials
   - Re-enable integration
```

### Flow 6: Member Data Bidirectional Sync

```
1. New member registers on BritePool platform
2. After covenant acceptance, sync trigger fires
3. System checks for active integrations with:
   - dataTypes includes "MEMBERS"
   - syncDirection = BIDIRECTIONAL or BRITEPOOL_TO_EXTERNAL
4. For each matching integration:
   a. Transform User data to external format:
      - Map BritePool User fields → External system fields
      - Apply custom field mappings from integration config
      - Format data per external API requirements
   b. Send API request: POST /external/api/contacts
   c. External system creates contact and returns external ID
   d. Create IntegrationMapping:
      - internalId = User.id
      - externalId = returned contact ID
      - resourceType = MEMBER
      - integrationId = current integration
   e. Log success in SyncLog
5. If external system updates member:
   - Webhook received (Flow 2)
   - Update User and UserProfile records
   - Maintain audit trail
6. If local admin updates member:
   - Update trigger fires
   - Push changes to external systems
   - Handle conflicts if external also changed
```

---

## Database Schema

### New Models

```prisma
model Integration {
  id          String   @id @default(cuid())
  name        String
  type        IntegrationType
  status      IntegrationStatus @default(ACTIVE)

  // Connection details
  baseUrl     String
  authType    AuthenticationType
  credentials String   // Encrypted JSON with auth details

  // Sync configuration
  syncDirection    SyncDirection
  syncFrequency    SyncFrequency
  dataTypes        DataType[]
  conflictStrategy ConflictStrategy @default(LATEST_WINS)

  // Webhook configuration
  webhookSecret    String?  // HMAC secret for webhook verification
  webhookEndpoint  String?  // Generated endpoint path

  // State tracking
  lastSyncAt       DateTime?
  lastSuccessAt    DateTime?
  lastErrorAt      DateTime?
  lastErrorMessage String?

  // Relations
  mappings         IntegrationMapping[]
  syncLogs         SyncLog[]
  conflicts        ConflictResolution[]
  jobExecutions    JobExecution[]

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([status])
  @@index([type])
}

model IntegrationMapping {
  id             String   @id @default(cuid())
  integrationId  String
  integration    Integration @relation(fields: [integrationId], references: [id], onDelete: Cascade)

  // Resource identification
  internalId     String   // BritePool record ID
  externalId     String   // External system record ID
  resourceType   ResourceType

  // Sync state
  lastSyncedAt   DateTime @default(now())
  syncStatus     MappingStatus @default(SYNCED)

  // Data snapshot for conflict detection
  lastLocalHash  String?  // Hash of local data at last sync
  lastExternalHash String? // Hash of external data at last sync

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([integrationId, resourceType, internalId])
  @@unique([integrationId, resourceType, externalId])
  @@index([integrationId])
  @@index([internalId])
}

model SyncLog {
  id             String   @id @default(cuid())
  integrationId  String
  integration    Integration @relation(fields: [integrationId], references: [id], onDelete: Cascade)

  // Sync operation details
  operation      SyncOperation
  direction      SyncDirection
  resourceType   ResourceType
  resourceId     String?  // Internal or external ID

  // Result
  status         SyncStatus
  recordsProcessed Int     @default(0)
  recordsSucceeded Int     @default(0)
  recordsFailed    Int     @default(0)

  // Error details
  errorMessage   String?
  errorStack     String?
  httpStatus     Int?

  // Performance metrics
  durationMs     Int?
  retryCount     Int      @default(0)

  // Payload snapshots (for debugging)
  requestPayload  Json?
  responsePayload Json?

  createdAt      DateTime @default(now())

  @@index([integrationId])
  @@index([status])
  @@index([createdAt])
  @@index([resourceType])
}

model ConflictResolution {
  id             String   @id @default(cuid())
  integrationId  String
  integration    Integration @relation(fields: [integrationId], references: [id], onDelete: Cascade)

  // Conflict details
  resourceType   ResourceType
  resourceId     String   // Internal ID
  externalId     String   // External ID

  // Conflicting versions
  localData      Json     // BritePool data
  externalData   Json     // External system data

  // Conflict metadata
  conflictedFields String[]  // List of fields that differ
  conflictReason   String?

  // Resolution
  status         ConflictStatus @default(PENDING)
  resolutionStrategy ConflictStrategy?
  resolvedData   Json?    // Final merged/resolved data
  resolvedById   String?
  resolvedAt     DateTime?

  createdAt      DateTime @default(now())

  @@index([integrationId])
  @@index([status])
  @@index([resourceType])
}

model JobExecution {
  id             String   @id @default(cuid())
  integrationId  String?
  integration    Integration? @relation(fields: [integrationId], references: [id], onDelete: Cascade)

  // Job details
  jobType        JobType
  status         JobStatus @default(RUNNING)

  // Execution metrics
  startedAt      DateTime @default(now())
  completedAt    DateTime?
  durationMs     Int?

  // Results
  totalRecords   Int      @default(0)
  successCount   Int      @default(0)
  errorCount     Int      @default(0)
  conflictCount  Int      @default(0)

  // Error tracking
  errorMessage   String?
  errorDetails   Json?

  // Scheduling
  scheduledFor   DateTime?
  retryCount     Int      @default(0)
  maxRetries     Int      @default(5)

  createdAt      DateTime @default(now())

  @@index([integrationId])
  @@index([jobType])
  @@index([status])
  @@index([startedAt])
}

// Enums

enum IntegrationType {
  ASANA
  TRELLO
  MONDAY
  CLICKUP
  TOGGL
  HARVEST
  CLOCKIFY
  HUBSPOT
  SALESFORCE
  GENERIC_REST
}

enum IntegrationStatus {
  ACTIVE
  PAUSED
  ERROR
  DEGRADED
  DISABLED
}

enum AuthenticationType {
  API_KEY
  OAUTH2
  BASIC_AUTH
  BEARER_TOKEN
}

enum SyncDirection {
  BIDIRECTIONAL
  EXTERNAL_TO_BRITEPOOL
  BRITEPOOL_TO_EXTERNAL
}

enum SyncFrequency {
  REALTIME     // Via webhooks
  EVERY_15MIN
  HOURLY
  DAILY
  WEEKLY
  MANUAL
}

enum DataType {
  TASKS
  MEMBERS
  PARTICIPATION_LOGS
  EVENTS
  COMMITTEES
}

enum ConflictStrategy {
  LATEST_WINS
  EXTERNAL_WINS
  LOCAL_WINS
  MANUAL_REVIEW
  CUSTOM_MERGE
}

enum ResourceType {
  TASK
  MEMBER
  PARTICIPATION_LOG
  EVENT
  COMMITTEE
  COMMITTEE_MEMBER
}

enum MappingStatus {
  SYNCED
  PENDING_SYNC
  ERROR
  CONFLICT
}

enum SyncOperation {
  CREATE
  UPDATE
  DELETE
  BULK_SYNC
  WEBHOOK_RECEIVED
}

enum SyncStatus {
  SUCCESS
  PARTIAL_SUCCESS
  FAILED
  CONFLICT_RESOLVED
  CONFLICT_PENDING
}

enum ConflictStatus {
  PENDING
  RESOLVED
  IGNORED
  AUTO_RESOLVED
}

enum JobType {
  SCHEDULED_SYNC
  MANUAL_SYNC
  INITIAL_IMPORT
  WEBHOOK_BATCH
  RETRY
}

enum JobStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}
```

### Schema Updates to Existing Models

```prisma
// Add to User model
model User {
  // ... existing fields

  // Integration tracking
  externalSyncEnabled Boolean @default(true)
  lastExternalSyncAt  DateTime?

  // ... existing relations
}

// Add to Task model
model Task {
  // ... existing fields

  // Integration tracking
  externalSyncEnabled Boolean @default(true)
  lastExternalSyncAt  DateTime?
  externalMetadata    Json?  // Store external system-specific data

  // ... existing relations
}

// Add to ParticipationLog model
model ParticipationLog {
  // ... existing fields

  // Integration tracking
  externalSource      String?   // Which external system created this
  externalId          String?   // ID in external system
  lastExternalSyncAt  DateTime?

  // ... existing relations
}
```

---

## API Endpoints

### 1. POST /api/admin/integrations

**Purpose:** Create a new integration configuration

**Authentication:** Required, role: WEB_STEWARD or BOARD_CHAIR

**Request Body:**
```json
{
  "name": "Main Asana Workspace",
  "type": "ASANA",
  "baseUrl": "https://app.asana.com/api/1.0",
  "authType": "BEARER_TOKEN",
  "credentials": {
    "token": "0/abc123..."
  },
  "syncDirection": "BIDIRECTIONAL",
  "syncFrequency": "HOURLY",
  "dataTypes": ["TASKS", "MEMBERS"],
  "conflictStrategy": "LATEST_WINS"
}
```

**Response:**
```json
{
  "success": true,
  "integration": {
    "id": "int_123...",
    "name": "Main Asana Workspace",
    "status": "ACTIVE",
    "webhookEndpoint": "https://britepool.org/api/webhooks/integrations/int_123.../receive",
    "webhookSecret": "whsec_abc123..."
  }
}
```

**Error Cases:**
- User not authorized → 403
- Invalid credentials (test connection failed) → 400
- Duplicate integration name → 400

---

### 2. GET /api/admin/integrations

**Purpose:** List all integrations with status

**Authentication:** Required, role: WEB_STEWARD or BOARD_CHAIR

**Query Parameters:**
- `status` (optional): Filter by status
- `type` (optional): Filter by integration type

**Response:**
```json
{
  "integrations": [
    {
      "id": "int_123...",
      "name": "Main Asana Workspace",
      "type": "ASANA",
      "status": "ACTIVE",
      "lastSyncAt": "2025-12-18T14:30:00Z",
      "lastSuccessAt": "2025-12-18T14:30:00Z",
      "syncFrequency": "HOURLY",
      "stats": {
        "totalSyncs": 1240,
        "successRate": 99.2,
        "pendingConflicts": 3,
        "lastErrorCount": 0
      }
    }
  ]
}
```

---

### 3. POST /api/webhooks/integrations/[id]/receive

**Purpose:** Receive webhook from external system

**Authentication:** Webhook signature verification (HMAC)

**Request Headers:**
- `X-Webhook-Signature`: HMAC-SHA256 signature
- `X-Webhook-Event`: Event type (e.g., "task.updated")

**Request Body (example - varies by integration):**
```json
{
  "event": "task.updated",
  "data": {
    "id": "ext_789...",
    "name": "Complete documentation",
    "status": "completed",
    "assigned_to": "ext_user_456...",
    "updated_at": "2025-12-18T14:35:00Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "syncLogId": "log_999...",
  "status": "SUCCESS"
}
```

**Error Cases:**
- Invalid signature → 401
- Integration not found → 404
- Integration not active → 403
- Invalid payload → 400
- Internal sync error → 500 (will retry)

---

### 4. POST /api/admin/integrations/[id]/sync

**Purpose:** Manually trigger sync job

**Authentication:** Required, role: WEB_STEWARD or BOARD_CHAIR

**Request Body:**
```json
{
  "direction": "BIDIRECTIONAL",
  "dataTypes": ["TASKS", "MEMBERS"],
  "fullSync": false
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "job_555...",
  "status": "RUNNING",
  "estimatedDuration": 120
}
```

---

### 5. GET /api/admin/integrations/[id]/logs

**Purpose:** Fetch sync logs for troubleshooting

**Authentication:** Required, role: WEB_STEWARD or BOARD_CHAIR

**Query Parameters:**
- `status` (optional): Filter by sync status
- `operation` (optional): Filter by operation type
- `limit` (default: 50, max: 200)
- `offset` (default: 0)

**Response:**
```json
{
  "logs": [
    {
      "id": "log_123...",
      "operation": "UPDATE",
      "resourceType": "TASK",
      "status": "SUCCESS",
      "recordsProcessed": 1,
      "durationMs": 245,
      "createdAt": "2025-12-18T14:35:00Z"
    }
  ],
  "pagination": {
    "total": 1240,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### 6. GET /api/admin/integrations/conflicts

**Purpose:** List all pending sync conflicts

**Authentication:** Required, role: WEB_STEWARD or BOARD_CHAIR

**Query Parameters:**
- `integrationId` (optional): Filter by integration
- `resourceType` (optional): Filter by resource type
- `status` (default: PENDING)

**Response:**
```json
{
  "conflicts": [
    {
      "id": "conf_789...",
      "integrationName": "Main Asana Workspace",
      "resourceType": "TASK",
      "resourceId": "task_456...",
      "conflictedFields": ["status", "assignedTo"],
      "localData": {
        "status": "IN_PROGRESS",
        "assignedTo": "user_123..."
      },
      "externalData": {
        "status": "completed",
        "assignedTo": "ext_user_789..."
      },
      "createdAt": "2025-12-18T10:00:00Z"
    }
  ]
}
```

---

### 7. POST /api/admin/integrations/conflicts/[id]/resolve

**Purpose:** Resolve a sync conflict

**Authentication:** Required, role: WEB_STEWARD or BOARD_CHAIR

**Request Body:**
```json
{
  "strategy": "CUSTOM_MERGE",
  "resolvedData": {
    "status": "COMPLETED",
    "assignedTo": "user_123..."
  },
  "pushToExternal": true
}
```

**Response:**
```json
{
  "success": true,
  "conflictId": "conf_789...",
  "status": "RESOLVED",
  "appliedChanges": {
    "task": "task_456...",
    "updated": true,
    "syncedToExternal": true
  }
}
```

---

### 8. PUT /api/admin/integrations/[id]

**Purpose:** Update integration configuration

**Authentication:** Required, role: WEB_STEWARD or BOARD_CHAIR

**Request Body:**
```json
{
  "status": "PAUSED",
  "syncFrequency": "DAILY",
  "conflictStrategy": "MANUAL_REVIEW"
}
```

**Response:**
```json
{
  "success": true,
  "integration": {
    "id": "int_123...",
    "status": "PAUSED",
    "updatedAt": "2025-12-18T15:00:00Z"
  }
}
```

---

### 9. DELETE /api/admin/integrations/[id]

**Purpose:** Delete integration and all associated data

**Authentication:** Required, role: WEB_STEWARD or BOARD_CHAIR

**Response:**
```json
{
  "success": true,
  "deleted": {
    "integration": true,
    "mappings": 450,
    "logs": 1240,
    "conflicts": 3
  }
}
```

---

### 10. GET /api/admin/integrations/[id]/test

**Purpose:** Test connection to external system

**Authentication:** Required, role: WEB_STEWARD or BOARD_CHAIR

**Response:**
```json
{
  "success": true,
  "connectionStatus": "OK",
  "responseTime": 145,
  "apiVersion": "1.0",
  "credentialsValid": true
}
```

**Error Cases:**
- Connection failed → 502
- Invalid credentials → 401
- API version incompatible → 400

---

## Webhook Architecture

### Webhook Receiver Design

#### Endpoint Structure
```
POST /api/webhooks/integrations/[integrationId]/receive
```

#### Security
1. **HMAC Signature Verification**
   ```typescript
   function verifyWebhookSignature(
     payload: string,
     signature: string,
     secret: string
   ): boolean {
     const expectedSignature = crypto
       .createHmac('sha256', secret)
       .update(payload)
       .digest('hex');

     return crypto.timingSafeEqual(
       Buffer.from(signature),
       Buffer.from(expectedSignature)
     );
   }
   ```

2. **Timestamp Validation**
   - Reject webhooks older than 5 minutes (replay attack prevention)
   - Check `X-Webhook-Timestamp` header

3. **IP Allowlist** (optional)
   - Configure allowed IP ranges per integration
   - Reject requests from unknown IPs

#### Webhook Processing Pipeline

```
1. Request Received
   ↓
2. Signature Verification
   ↓ (fail → 401 Unauthorized)
3. Timestamp Validation
   ↓ (fail → 400 Bad Request)
4. Integration Status Check
   ↓ (inactive → 403 Forbidden)
5. Payload Parsing & Validation
   ↓ (invalid → 400 Bad Request)
6. Data Transformation
   ↓
7. Conflict Detection
   ↓
8. Apply Changes OR Queue for Review
   ↓
9. Update Mapping & Log
   ↓
10. Return 200 OK
```

#### Webhook Retry Handling

External systems typically implement their own retry logic:
- If we return 5xx error → External system will retry
- If we return 4xx error → External system will NOT retry

**Response Strategy:**
- Validation errors → 400 (don't retry)
- Auth errors → 401 (don't retry)
- Temporary errors (DB connection, rate limit) → 503 (retry)
- Unknown errors → 500 (retry)

#### Idempotency

Ensure webhooks can be processed multiple times safely:
1. Use `externalId` + `updatedAt` timestamp as idempotency key
2. If same webhook received twice → skip processing, return success
3. Store webhook IDs in cache/DB for deduplication (TTL: 24 hours)

---

## Scheduled Jobs

### Cron Job Architecture

#### Job Scheduler
Use Next.js API routes + external cron service (Vercel Cron, AWS EventBridge, or node-cron)

**Cron Routes:**
```
POST /api/cron/sync-integrations
POST /api/cron/retry-failed-syncs
POST /api/cron/cleanup-old-logs
```

#### Job Schedules

| Job Name | Frequency | Description |
|----------|-----------|-------------|
| Hourly Sync | `0 * * * *` | Sync integrations with HOURLY frequency |
| Daily Sync | `0 2 * * *` | Sync integrations with DAILY frequency (2 AM) |
| Retry Failed | `*/15 * * * *` | Retry failed syncs with exponential backoff |
| Cleanup Logs | `0 3 * * 0` | Delete logs older than 90 days (Sunday 3 AM) |
| Health Check | `*/5 * * * *` | Monitor integration health, alert on issues |

#### Scheduled Sync Job Implementation

```typescript
// /api/cron/sync-integrations.ts
export async function POST(request: Request) {
  // Security: Verify cron secret
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const currentHour = new Date().getHours();
  const isHourlyRun = true;
  const isDailyRun = currentHour === 2; // 2 AM

  // Fetch integrations that need syncing
  const integrations = await prisma.integration.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { syncFrequency: isHourlyRun ? 'HOURLY' : undefined },
        { syncFrequency: isDailyRun ? 'DAILY' : undefined }
      ]
    }
  });

  const results = [];

  for (const integration of integrations) {
    try {
      // Create job execution record
      const job = await prisma.jobExecution.create({
        data: {
          integrationId: integration.id,
          jobType: 'SCHEDULED_SYNC',
          status: 'RUNNING',
          startedAt: new Date()
        }
      });

      // Execute sync
      const result = await executeSync(integration, job.id);

      // Update job record
      await prisma.jobExecution.update({
        where: { id: job.id },
        data: {
          status: result.success ? 'COMPLETED' : 'FAILED',
          completedAt: new Date(),
          durationMs: Date.now() - job.startedAt.getTime(),
          totalRecords: result.totalRecords,
          successCount: result.successCount,
          errorCount: result.errorCount,
          conflictCount: result.conflictCount,
          errorMessage: result.error
        }
      });

      results.push({ integrationId: integration.id, ...result });

    } catch (error) {
      console.error(`Sync failed for ${integration.name}:`, error);
      results.push({
        integrationId: integration.id,
        success: false,
        error: error.message
      });
    }
  }

  return Response.json({
    success: true,
    timestamp: new Date().toISOString(),
    processed: results.length,
    results
  });
}
```

#### Exponential Backoff Retry Logic

```typescript
async function scheduleRetry(
  jobId: string,
  retryCount: number,
  maxRetries: number = 5
) {
  if (retryCount >= maxRetries) {
    // Max retries reached, mark as permanently failed
    await prisma.jobExecution.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        errorMessage: 'Max retries exceeded'
      }
    });

    // Alert admin
    await sendAdminAlert({
      type: 'SYNC_FAILED',
      jobId,
      message: 'Integration sync failed after max retries'
    });

    return;
  }

  // Calculate exponential backoff: 2^retryCount minutes
  const delayMinutes = Math.pow(2, retryCount);
  const scheduledFor = new Date(Date.now() + delayMinutes * 60 * 1000);

  // Create retry job
  await prisma.jobExecution.create({
    data: {
      jobType: 'RETRY',
      status: 'PENDING',
      scheduledFor,
      retryCount,
      maxRetries
    }
  });
}
```

#### Job Monitoring Dashboard

Real-time metrics:
- Jobs running now
- Jobs scheduled (upcoming)
- Recent job history (last 24 hours)
- Success/failure rates
- Average execution time
- Longest running jobs

---

## Data Mapping Schemas

### Generic Mapping Configuration

Each integration defines field mappings between external and internal schemas:

```typescript
interface DataMapping {
  resourceType: ResourceType;
  externalToInternal: FieldMapping[];
  internalToExternal: FieldMapping[];
  transformers?: CustomTransformer[];
}

interface FieldMapping {
  externalField: string;
  internalField: string;
  transform?: TransformFunction;
  required?: boolean;
  defaultValue?: any;
}

type TransformFunction =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'enum'
  | 'json'
  | ((value: any) => any);
```

### Task Mapping Example (Asana → BritePool)

```json
{
  "resourceType": "TASK",
  "externalToInternal": [
    {
      "externalField": "gid",
      "internalField": "externalId",
      "transform": "string",
      "required": true
    },
    {
      "externalField": "name",
      "internalField": "title",
      "transform": "string",
      "required": true
    },
    {
      "externalField": "notes",
      "internalField": "description",
      "transform": "string"
    },
    {
      "externalField": "completed",
      "internalField": "status",
      "transform": {
        "type": "enum",
        "mapping": {
          "true": "COMPLETED",
          "false": "IN_PROGRESS"
        }
      }
    },
    {
      "externalField": "due_on",
      "internalField": "dueDate",
      "transform": "date"
    },
    {
      "externalField": "assignee.gid",
      "internalField": "assignedToId",
      "transform": {
        "type": "lookup",
        "resourceType": "MEMBER",
        "lookupField": "externalId"
      }
    }
  ]
}
```

### Member Mapping Example (BritePool → HubSpot)

```json
{
  "resourceType": "MEMBER",
  "internalToExternal": [
    {
      "internalField": "email",
      "externalField": "email",
      "transform": "string",
      "required": true
    },
    {
      "internalField": "name",
      "externalField": "firstname",
      "transform": {
        "type": "custom",
        "function": "splitName",
        "target": "first"
      }
    },
    {
      "internalField": "name",
      "externalField": "lastname",
      "transform": {
        "type": "custom",
        "function": "splitName",
        "target": "last"
      }
    },
    {
      "internalField": "role",
      "externalField": "britepool_role",
      "transform": "string"
    },
    {
      "internalField": "profile.totalEquityUnits",
      "externalField": "britepool_equity_units",
      "transform": "number"
    }
  ]
}
```

### Custom Transformers

```typescript
const customTransformers = {
  splitName: (fullName: string, target: 'first' | 'last') => {
    const parts = fullName.split(' ');
    return target === 'first' ? parts[0] : parts.slice(1).join(' ');
  },

  taskStatusToBool: (status: TaskStatus) => {
    return status === 'COMPLETED';
  },

  dateToTimestamp: (date: Date | string) => {
    return new Date(date).getTime();
  },

  enumMapping: (value: any, mapping: Record<string, string>) => {
    return mapping[value] || value;
  }
};
```

### Nested Field Access

Support dot notation for nested fields:
- `assignee.gid` → Access nested object
- `custom_fields[0].value` → Access array elements

```typescript
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    // Handle array access like "custom_fields[0]"
    const arrayMatch = key.match(/(\w+)\[(\d+)\]/);
    if (arrayMatch) {
      const [, arrayKey, index] = arrayMatch;
      return current?.[arrayKey]?.[parseInt(index)];
    }
    return current?.[key];
  }, obj);
}
```

---

## Sync Conflict Resolution

### Conflict Detection

A conflict occurs when:
1. Both systems modified the same resource since last sync
2. The modifications affect the same field(s)

**Detection Algorithm:**
```typescript
async function detectConflict(
  mapping: IntegrationMapping,
  localRecord: any,
  externalRecord: any
): Promise<ConflictInfo | null> {
  // Compare timestamps
  const localUpdatedAt = localRecord.updatedAt;
  const externalUpdatedAt = new Date(externalRecord.updated_at);
  const lastSyncAt = mapping.lastSyncedAt;

  const localModifiedAfterSync = localUpdatedAt > lastSyncAt;
  const externalModifiedAfterSync = externalUpdatedAt > lastSyncAt;

  if (localModifiedAfterSync && externalModifiedAfterSync) {
    // Both modified since last sync - potential conflict
    const conflictedFields = findConflictedFields(
      localRecord,
      externalRecord,
      mapping
    );

    if (conflictedFields.length > 0) {
      return {
        hasConflict: true,
        conflictedFields,
        localData: localRecord,
        externalData: externalRecord
      };
    }
  }

  return null;
}

function findConflictedFields(
  local: any,
  external: any,
  mapping: IntegrationMapping
): string[] {
  const conflicts: string[] = [];

  // Compare each mapped field
  for (const fieldMap of mapping.fieldMappings) {
    const localValue = getNestedValue(local, fieldMap.internalField);
    const externalValue = getNestedValue(external, fieldMap.externalField);

    // Transform external value for comparison
    const transformedExternal = applyTransform(
      externalValue,
      fieldMap.transform
    );

    if (!isEqual(localValue, transformedExternal)) {
      conflicts.push(fieldMap.internalField);
    }
  }

  return conflicts;
}
```

### Resolution Strategies

#### 1. LATEST_WINS (Default)
```typescript
async function resolveLatestWins(conflict: ConflictInfo) {
  const localTime = new Date(conflict.localData.updatedAt);
  const externalTime = new Date(conflict.externalData.updated_at);

  if (externalTime > localTime) {
    // External is newer, apply external changes
    return {
      strategy: 'LATEST_WINS',
      winner: 'EXTERNAL',
      resolvedData: conflict.externalData
    };
  } else {
    // Local is newer, keep local changes and push to external
    return {
      strategy: 'LATEST_WINS',
      winner: 'LOCAL',
      resolvedData: conflict.localData,
      pushToExternal: true
    };
  }
}
```

#### 2. EXTERNAL_WINS
```typescript
async function resolveExternalWins(conflict: ConflictInfo) {
  // Always prefer external system data
  return {
    strategy: 'EXTERNAL_WINS',
    resolvedData: conflict.externalData
  };
}
```

#### 3. LOCAL_WINS
```typescript
async function resolveLocalWins(conflict: ConflictInfo) {
  // Always prefer BritePool data, push to external
  return {
    strategy: 'LOCAL_WINS',
    resolvedData: conflict.localData,
    pushToExternal: true
  };
}
```

#### 4. MANUAL_REVIEW
```typescript
async function resolveManualReview(conflict: ConflictInfo) {
  // Create ConflictResolution record for admin review
  const conflictRecord = await prisma.conflictResolution.create({
    data: {
      integrationId: conflict.integrationId,
      resourceType: conflict.resourceType,
      resourceId: conflict.resourceId,
      externalId: conflict.externalId,
      localData: conflict.localData,
      externalData: conflict.externalData,
      conflictedFields: conflict.conflictedFields,
      status: 'PENDING'
    }
  });

  // Send notification to admin
  await sendAdminNotification({
    type: 'CONFLICT_DETECTED',
    conflictId: conflictRecord.id,
    resourceType: conflict.resourceType
  });

  return {
    strategy: 'MANUAL_REVIEW',
    conflictId: conflictRecord.id,
    requiresAction: true
  };
}
```

#### 5. CUSTOM_MERGE
```typescript
async function resolveCustomMerge(conflict: ConflictInfo) {
  const merged = {};

  // Apply field-specific rules
  for (const field of conflict.conflictedFields) {
    const rule = conflict.integration.customMergeRules[field];

    switch (rule?.strategy) {
      case 'prefer_external':
        merged[field] = conflict.externalData[field];
        break;
      case 'prefer_local':
        merged[field] = conflict.localData[field];
        break;
      case 'concatenate':
        merged[field] = `${conflict.localData[field]} | ${conflict.externalData[field]}`;
        break;
      case 'max':
        merged[field] = Math.max(
          conflict.localData[field],
          conflict.externalData[field]
        );
        break;
      case 'min':
        merged[field] = Math.min(
          conflict.localData[field],
          conflict.externalData[field]
        );
        break;
      default:
        // Default to external for this field
        merged[field] = conflict.externalData[field];
    }
  }

  return {
    strategy: 'CUSTOM_MERGE',
    resolvedData: { ...conflict.localData, ...merged }
  };
}
```

### Conflict Resolution Flow

```
Conflict Detected
  ↓
Check Integration.conflictStrategy
  ↓
┌────────────────────────────────────┐
│ LATEST_WINS                        │ → Apply newer version
│ EXTERNAL_WINS                      │ → Apply external version
│ LOCAL_WINS                         │ → Apply local version, push to external
│ MANUAL_REVIEW                      │ → Create ConflictResolution record
│ CUSTOM_MERGE                       │ → Apply custom merge rules
└────────────────────────────────────┘
  ↓
Apply Resolution
  ↓
Update IntegrationMapping.lastSyncedAt
  ↓
Log Resolution in SyncLog
  ↓
(Optional) Push to External System
```

---

## Monitoring & Logging

### Logging Levels

1. **DEBUG**: Detailed sync operations, field mappings
2. **INFO**: Successful syncs, normal operations
3. **WARN**: Retries, degraded performance, non-critical errors
4. **ERROR**: Failed syncs, unhandled conflicts, system errors
5. **FATAL**: Integration completely broken, manual intervention required

### Structured Logging Format

```typescript
interface LogEntry {
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  timestamp: string;
  integrationId: string;
  integrationName: string;
  operation: SyncOperation;
  resourceType: ResourceType;
  resourceId?: string;
  message: string;
  metadata?: {
    durationMs?: number;
    recordsProcessed?: number;
    errorCode?: string;
    httpStatus?: number;
    retryCount?: number;
  };
  error?: {
    message: string;
    stack: string;
    type: string;
  };
}
```

### Monitoring Dashboard Metrics

#### Real-time Metrics
- Active integrations count
- Syncs in progress
- Recent sync success rate (last 1 hour, 24 hours)
- Average sync duration
- Pending conflicts count
- Failed syncs (last 24 hours)

#### Per-Integration Metrics
- Total syncs (all time)
- Success rate (%)
- Average response time
- Last successful sync timestamp
- Last error timestamp
- Total records synced
- Conflicts resolved
- Current status (ACTIVE, PAUSED, ERROR, DEGRADED)

#### Health Indicators

```typescript
interface IntegrationHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  score: number; // 0-100
  indicators: {
    successRate: {
      value: number;
      status: 'PASS' | 'WARN' | 'FAIL';
      threshold: number;
    };
    responseTime: {
      value: number;
      status: 'PASS' | 'WARN' | 'FAIL';
      threshold: number;
    };
    errorRate: {
      value: number;
      status: 'PASS' | 'WARN' | 'FAIL';
      threshold: number;
    };
    lastSync: {
      value: string;
      status: 'PASS' | 'WARN' | 'FAIL';
      threshold: number;
    };
  };
}
```

**Health Score Calculation:**
```typescript
function calculateHealthScore(integration: Integration): number {
  const weights = {
    successRate: 0.4,
    responseTime: 0.2,
    errorRate: 0.3,
    lastSync: 0.1
  };

  const scores = {
    successRate: getSuccessRate(integration), // 0-100
    responseTime: getResponseTimeScore(integration), // 0-100
    errorRate: getErrorRateScore(integration), // 0-100
    lastSync: getLastSyncScore(integration) // 0-100
  };

  return Object.entries(weights).reduce((total, [key, weight]) => {
    return total + (scores[key] * weight);
  }, 0);
}
```

### Alerting Rules

```typescript
interface AlertRule {
  name: string;
  condition: AlertCondition;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  channels: ('email' | 'slack' | 'dashboard')[];
  cooldown: number; // minutes before re-alerting
}

const alertRules: AlertRule[] = [
  {
    name: 'High Error Rate',
    condition: {
      metric: 'errorRate',
      operator: '>',
      threshold: 10, // >10% errors
      window: '1h'
    },
    severity: 'WARNING',
    channels: ['email', 'dashboard'],
    cooldown: 60
  },
  {
    name: 'Integration Down',
    condition: {
      metric: 'consecutiveFailures',
      operator: '>=',
      threshold: 3
    },
    severity: 'CRITICAL',
    channels: ['email', 'slack', 'dashboard'],
    cooldown: 30
  },
  {
    name: 'Sync Lag',
    condition: {
      metric: 'lastSyncAge',
      operator: '>',
      threshold: 120, // >2 hours since last sync
      frequency: 'HOURLY'
    },
    severity: 'WARNING',
    channels: ['dashboard'],
    cooldown: 120
  },
  {
    name: 'Many Pending Conflicts',
    condition: {
      metric: 'pendingConflicts',
      operator: '>',
      threshold: 10
    },
    severity: 'INFO',
    channels: ['dashboard'],
    cooldown: 180
  }
];
```

### Admin Notifications

**Email Template:**
```
Subject: [BritePool] Integration Alert: {integrationName} - {alertSeverity}

Integration: {integrationName}
Status: {status}
Alert: {alertName}

Details:
- Error Rate: {errorRate}%
- Last Successful Sync: {lastSuccessAt}
- Pending Conflicts: {conflictCount}

Recent Errors:
{recentErrors}

View Details: {dashboardUrl}

---
This is an automated alert from BritePool Integration System
```

---

## UI Components

### 1. Integrations Dashboard

**Location:** `app/dashboard/admin/integrations/page.tsx`

**Features:**
- List of all integrations with status indicators
- Health score visualization (gauge or progress bar)
- Quick stats: Total syncs, success rate, pending conflicts
- Action buttons: Add Integration, Refresh All, View Logs
- Filter by status, type
- Search by integration name

**Component Structure:**
```tsx
export default function IntegrationsDashboard() {
  const { integrations, stats } = useIntegrations();

  return (
    <div className="p-8">
      <DashboardHeader
        title="Integration Management"
        stats={stats}
        actions={[
          { label: 'Add Integration', onClick: openAddModal },
          { label: 'Refresh All', onClick: refreshAll }
        ]}
      />

      <IntegrationsList integrations={integrations} />

      <RecentActivity limit={10} />
    </div>
  );
}
```

---

### 2. Integration Detail Page

**Location:** `app/dashboard/admin/integrations/[id]/page.tsx`

**Features:**
- Tabbed interface:
  - Overview (status, config, health metrics)
  - Sync Logs (filterable, searchable)
  - Mappings (view all resource mappings)
  - Conflicts (pending conflicts list)
  - Settings (edit configuration)
- Real-time sync status
- Manual sync trigger button
- Test connection button
- Pause/Resume integration
- Delete integration (with confirmation)

---

### 3. Conflict Resolution Interface

**Location:** `app/dashboard/admin/integrations/conflicts/page.tsx`

**Features:**
- List of pending conflicts grouped by integration
- Conflict detail modal with side-by-side comparison
- Diff highlighting (colored changes)
- Resolution action buttons:
  - Keep Local
  - Keep External
  - Merge Both
  - Custom Edit
- Bulk resolution options
- Conflict history log

**Diff Visualization:**
```tsx
function ConflictDiff({ localData, externalData, conflictedFields }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="border-r pr-4">
        <h3 className="font-semibold mb-2">Local (BritePool)</h3>
        {conflictedFields.map(field => (
          <div key={field} className="mb-4">
            <label className="text-sm text-gray-600">{field}</label>
            <div className="bg-red-50 p-2 rounded">
              {localData[field]}
            </div>
          </div>
        ))}
      </div>

      <div className="pl-4">
        <h3 className="font-semibold mb-2">External System</h3>
        {conflictedFields.map(field => (
          <div key={field} className="mb-4">
            <label className="text-sm text-gray-600">{field}</label>
            <div className="bg-green-50 p-2 rounded">
              {externalData[field]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### 4. Add Integration Modal

**Location:** `app/components/admin/AddIntegrationModal.tsx`

**Features:**
- Step 1: Select integration type (cards with logos)
- Step 2: Basic configuration (name, URL, auth type)
- Step 3: Authentication credentials (secure input)
- Step 4: Sync settings (direction, frequency, data types)
- Step 5: Review and test connection
- Progress indicator
- Form validation
- Test connection before saving

---

### 5. Sync Logs Viewer

**Location:** `app/components/admin/SyncLogsViewer.tsx`

**Features:**
- Table view with columns:
  - Timestamp
  - Operation
  - Resource Type
  - Status (icon + label)
  - Duration
  - Records Processed
  - Actions (view details)
- Filters:
  - Status (success, failed, conflict)
  - Date range
  - Resource type
  - Operation type
- Search by resource ID
- Pagination
- Export to CSV
- Log detail modal with full payload

---

### 6. Health Monitoring Widget

**Location:** `app/components/admin/IntegrationHealthWidget.tsx`

**Features:**
- Real-time health score gauge (0-100)
- Status indicator (colored dot)
- Key metrics cards:
  - Success Rate (% with trend)
  - Avg Response Time (ms with trend)
  - Last Sync (relative time)
  - Pending Conflicts (count)
- Mini sparkline charts for trends
- Alert indicator if issues detected

---

## Implementation Details

### Phase 1: Core Infrastructure (Days 1-3)

**Day 1: Database Schema & Models**
1. Add new Prisma models:
   - Integration
   - IntegrationMapping
   - SyncLog
   - ConflictResolution
   - JobExecution
2. Run `npx prisma db push`
3. Create seed data for testing
4. Set up database indexes for performance

**Day 2: API Foundation**
1. Implement API endpoints:
   - POST /api/admin/integrations (create)
   - GET /api/admin/integrations (list)
   - PUT /api/admin/integrations/[id] (update)
   - DELETE /api/admin/integrations/[id] (delete)
   - GET /api/admin/integrations/[id]/test (test connection)
2. Add authentication middleware
3. Create utility functions for encryption (credentials)

**Day 3: Data Mapping Engine**
1. Implement field mapping transformation logic
2. Create custom transformers
3. Build nested field accessor
4. Add validation for mapping schemas
5. Write unit tests for transformations

---

### Phase 2: Webhook System (Days 4-6)

**Day 4: Webhook Receiver**
1. Implement webhook endpoint: POST /api/webhooks/integrations/[id]/receive
2. Add HMAC signature verification
3. Implement timestamp validation
4. Add request logging

**Day 5: Webhook Processing Pipeline**
1. Build payload parser and validator
2. Implement data transformation (external → internal)
3. Add conflict detection logic
4. Integrate with database (create/update records)
5. Add idempotency handling

**Day 6: Error Handling & Testing**
1. Implement comprehensive error handling
2. Add webhook retry response codes
3. Create test webhooks for each integration type
4. Test with mock external systems
5. Document webhook configuration for external systems

---

### Phase 3: Scheduled Jobs (Days 7-9)

**Day 7: Cron Job Setup**
1. Create cron API routes:
   - POST /api/cron/sync-integrations
   - POST /api/cron/retry-failed-syncs
   - POST /api/cron/cleanup-old-logs
2. Implement job execution tracking
3. Add job scheduling logic
4. Configure Vercel Cron or external scheduler

**Day 8: Batch Sync Logic**
1. Implement batch fetch from external APIs
2. Build bulk transformation pipeline
3. Add conflict detection for batch operations
4. Implement transaction management for batch updates
5. Add progress tracking

**Day 9: Retry & Recovery**
1. Implement exponential backoff retry logic
2. Add job failure handling
3. Create retry scheduling system
4. Add max retry limits
5. Implement admin notifications for permanent failures

---

### Phase 4: Conflict Resolution (Days 10-11)

**Day 10: Resolution Strategies**
1. Implement all resolution strategies:
   - LATEST_WINS
   - EXTERNAL_WINS
   - LOCAL_WINS
   - MANUAL_REVIEW
   - CUSTOM_MERGE
2. Add conflict detection algorithm
3. Build field-level diff comparison
4. Create ConflictResolution records

**Day 11: Admin Resolution Interface**
1. Build conflict resolution API endpoints
2. Implement resolution application logic
3. Add audit logging for resolutions
4. Test all resolution strategies
5. Create conflict notification system

---

### Phase 5: Monitoring & UI (Days 12-14)

**Day 12: Monitoring System**
1. Implement health score calculation
2. Build alerting rules engine
3. Add alert notification system (email, Slack)
4. Create sync log endpoints with filtering
5. Add performance metrics tracking

**Day 13: Admin Dashboard UI**
1. Create integrations list page
2. Build integration detail page with tabs
3. Implement add integration modal
4. Add health monitoring widgets
5. Style with biophilic design system

**Day 14: Conflict UI & Final Testing**
1. Build conflict resolution interface
2. Add diff visualization components
3. Implement sync logs viewer
4. Create job execution history page
5. End-to-end integration testing
6. Performance optimization
7. Documentation finalization

---

## Testing Requirements

### Unit Tests

```typescript
// Test data transformation
test('transforms external task to internal format', () => {
  const externalTask = {
    gid: 'ext_123',
    name: 'Complete documentation',
    completed: true,
    due_on: '2025-12-25'
  };

  const mapping = getTaskMapping('ASANA');
  const internal = transformExternalToInternal(externalTask, mapping);

  expect(internal.title).toBe('Complete documentation');
  expect(internal.status).toBe('COMPLETED');
  expect(internal.dueDate).toEqual(new Date('2025-12-25'));
});

// Test conflict detection
test('detects conflict when both systems modified same field', () => {
  const local = { status: 'IN_PROGRESS', updatedAt: new Date('2025-12-18T14:00:00Z') };
  const external = { status: 'completed', updated_at: '2025-12-18T14:30:00Z' };
  const lastSync = new Date('2025-12-18T12:00:00Z');

  const conflict = detectConflict(local, external, lastSync);

  expect(conflict).not.toBeNull();
  expect(conflict.conflictedFields).toContain('status');
});

// Test webhook signature verification
test('verifies webhook signature correctly', () => {
  const payload = JSON.stringify({ event: 'task.updated', data: {} });
  const secret = 'whsec_test123';
  const signature = generateHmacSignature(payload, secret);

  const isValid = verifyWebhookSignature(payload, signature, secret);

  expect(isValid).toBe(true);
});

// Test exponential backoff calculation
test('calculates exponential backoff correctly', () => {
  expect(calculateBackoff(0)).toBe(60000); // 1 minute
  expect(calculateBackoff(1)).toBe(120000); // 2 minutes
  expect(calculateBackoff(2)).toBe(240000); // 4 minutes
  expect(calculateBackoff(3)).toBe(480000); // 8 minutes
});
```

### Integration Tests

```typescript
// Test full sync workflow
test('completes full sync workflow successfully', async () => {
  const integration = await createTestIntegration();
  const mockExternalData = generateMockTasks(10);

  mockExternalAPI.getTasks.mockResolvedValue(mockExternalData);

  const result = await executeSync(integration.id);

  expect(result.success).toBe(true);
  expect(result.successCount).toBe(10);
  expect(result.errorCount).toBe(0);

  // Verify records created
  const tasks = await prisma.task.findMany({
    where: { lastExternalSyncAt: { not: null } }
  });
  expect(tasks.length).toBe(10);

  // Verify mappings created
  const mappings = await prisma.integrationMapping.findMany({
    where: { integrationId: integration.id }
  });
  expect(mappings.length).toBe(10);
});

// Test webhook processing
test('processes webhook and updates record', async () => {
  const integration = await createTestIntegration();
  const task = await createTestTask();
  await createMapping(integration.id, task.id, 'ext_123');

  const webhookPayload = {
    event: 'task.updated',
    data: {
      gid: 'ext_123',
      name: 'Updated title',
      completed: true
    }
  };

  const response = await POST(`/api/webhooks/integrations/${integration.id}/receive`, {
    body: webhookPayload,
    headers: {
      'X-Webhook-Signature': generateSignature(webhookPayload, integration.webhookSecret)
    }
  });

  expect(response.status).toBe(200);

  // Verify task updated
  const updatedTask = await prisma.task.findUnique({ where: { id: task.id } });
  expect(updatedTask.title).toBe('Updated title');
  expect(updatedTask.status).toBe('COMPLETED');
});
```

### Manual Testing Checklist

**Integration Setup:**
- [ ] Admin can create new integration
- [ ] Credentials are encrypted in database
- [ ] Test connection validates API access
- [ ] Webhook URL is generated correctly
- [ ] Integration appears in list with correct status

**Webhook Processing:**
- [ ] Webhook receiver validates signature
- [ ] Invalid signature returns 401
- [ ] Valid webhook creates/updates record
- [ ] Duplicate webhooks are idempotent
- [ ] Webhook errors are logged

**Scheduled Sync:**
- [ ] Cron job executes at scheduled time
- [ ] Batch sync processes all records
- [ ] Failed syncs trigger retries
- [ ] Max retries trigger admin alert
- [ ] Job execution is logged

**Conflict Resolution:**
- [ ] Conflicts are detected correctly
- [ ] LATEST_WINS resolves automatically
- [ ] MANUAL_REVIEW creates conflict record
- [ ] Admin can view conflict details
- [ ] Resolution applies changes correctly
- [ ] Resolved conflicts are logged

**Monitoring:**
- [ ] Dashboard shows real-time metrics
- [ ] Health score updates correctly
- [ ] Alerts trigger at thresholds
- [ ] Email notifications sent
- [ ] Sync logs are searchable and filterable

**Error Handling:**
- [ ] Network errors trigger retries
- [ ] Rate limits are respected
- [ ] Expired credentials are detected
- [ ] Error messages are clear
- [ ] Admin is notified of failures

---

## Deployment Checklist

### Pre-Deployment

**Database:**
- [ ] Prisma schema updated with new models
- [ ] Database migrations tested in staging
- [ ] Indexes created for performance
- [ ] Backup of production database taken

**Environment Variables:**
- [ ] `CRON_SECRET` set (for cron job authentication)
- [ ] `ENCRYPTION_KEY` set (for encrypting credentials)
- [ ] `WEBHOOK_BASE_URL` set (public URL for webhooks)
- [ ] Integration-specific API keys configured (if any)

**Dependencies:**
- [ ] All npm packages installed
- [ ] No security vulnerabilities (`npm audit`)
- [ ] TypeScript compiles without errors

**Testing:**
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] Load testing completed (simulate 1000 syncs)

---

### Deployment Steps

1. **Deploy Database Changes**
   ```bash
   npx prisma db push
   ```

2. **Deploy Application Code**
   - Build application: `npm run build`
   - Deploy to hosting platform (Vercel, AWS, etc.)

3. **Configure Cron Jobs**
   - Set up cron schedules in hosting platform
   - Test cron authentication with `CRON_SECRET`

4. **Verify Webhook Endpoints**
   - Test webhook endpoint is publicly accessible
   - Verify SSL certificate is valid

5. **Monitor Initial Sync**
   - Watch logs for errors
   - Monitor database for new records
   - Check integration health scores

---

### Post-Deployment

**Verification:**
- [ ] All integrations show ACTIVE status
- [ ] Test webhook from external system succeeds
- [ ] Scheduled sync job executes successfully
- [ ] No errors in application logs
- [ ] Database queries are performant (<100ms)

**Monitoring:**
- [ ] Set up alerting rules
- [ ] Configure admin notification email
- [ ] Add Slack webhook for critical alerts
- [ ] Monitor health scores daily for first week

**Documentation:**
- [ ] Update admin guide with new integration features
- [ ] Document webhook configuration for each integration type
- [ ] Create troubleshooting guide
- [ ] Record demo video for admin training

---

## Future Enhancements

1. **Advanced Mapping UI:** Visual drag-and-drop field mapper in admin panel
2. **Sync Preview:** Preview changes before applying sync
3. **Rollback Capability:** Revert sync if issues detected
4. **Multi-tenant Support:** Separate integration configs per committee
5. **GraphQL Support:** Add GraphQL query/mutation support for integrations
6. **Real-time Dashboard:** WebSocket updates for live sync monitoring
7. **AI-Powered Conflict Resolution:** ML suggestions for conflict resolution
8. **Audit Trail Export:** Export full audit trail to PDF/CSV
9. **Integration Marketplace:** Pre-built integration templates
10. **Performance Optimization:** Redis caching for frequently accessed mappings

---

**Spec Complete**

**Next Step:** Run `/create-tasks` to generate implementation task list.
