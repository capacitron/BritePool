# Specification: ActiveCampaign Integration

**Feature ID:** F024
**Priority:** Medium
**Effort:** Small (2-3 days)
**Dependencies:** Authentication (F002), Announcements (F005)
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
Integrate ActiveCampaign API to enable external newsletter management, automated marketing outreach campaigns, and prospect nurturing workflows. This system operates separately from the internal announcement system and provides two-way synchronization between BRITE POOL member data and ActiveCampaign contact lists.

### Key Requirements
- ActiveCampaign API integration for contact management
- Automated contact sync from BRITE POOL to ActiveCampaign
- Campaign trigger automation based on member actions
- Webhook handling for unsubscribe events
- List segmentation by membership tier and role
- Campaign tracking and analytics dashboard
- Manual and automated sync workflows
- Separation from internal announcement system
- Email preference management

### Success Metrics
- 100% of eligible members synced to ActiveCampaign
- Automated contact updates within 5 minutes of data changes
- Unsubscribe events processed immediately via webhooks
- Campaign open/click rates tracked and displayed
- Zero duplicate contacts in ActiveCampaign
- All member opt-in preferences respected

---

## User Flows

### Flow 1: New Member Auto-Sync to ActiveCampaign

```
1. User completes registration and accepts covenant
2. POST /api/auth/register creates User record
3. Background job triggered: syncUserToActiveCampaign(userId)
4. System checks user email preferences (default: opted-in for external marketing)
5. API call to ActiveCampaign:
   POST https://youraccountname.api-us1.com/api/3/contacts
   {
     "contact": {
       "email": "user@example.com",
       "firstName": "John",
       "lastName": "Doe",
       "phone": "555-0100",
       "fieldValues": [
         { "field": "1", "value": "STEWARD" },        // Custom field: Role
         { "field": "2", "value": "FREE" },           // Custom field: Subscription Tier
         { "field": "3", "value": "2025-12-17" }      // Custom field: Covenant Accepted Date
       ]
     }
   }
6. ActiveCampaign returns contact ID
7. System stores mapping in ActiveCampaignContact table:
   - userId → activeCampaignContactId
   - syncStatus: SYNCED
   - lastSyncedAt: now()
8. System adds contact to appropriate lists based on:
   - Membership tier (e.g., "Free Members", "Premium Members")
   - Role (e.g., "Stewards", "Partners", "Residents")
   - Location (if applicable)
9. Automation triggers in ActiveCampaign:
   - Welcome email series
   - Onboarding nurture campaign
```

### Flow 2: Member Updates Profile → Auto-Sync to ActiveCampaign

```
1. User navigates to /dashboard/profile
2. User updates name, phone, or subscription tier
3. PUT /api/user/profile saves changes to database
4. After successful save, trigger sync:
   - Call internal API: POST /api/integrations/activecampaign/sync
   - Pass userId
5. System fetches ActiveCampaignContact record
6. If contact exists in ActiveCampaign:
   PUT https://youraccountname.api-us1.com/api/3/contacts/{contactId}
   - Update changed fields
   - Update custom field values
7. If subscription tier changed:
   - Remove from old tier list
   - Add to new tier list
8. Update ActiveCampaignContact.lastSyncedAt
9. User sees success message: "Profile updated"
```

### Flow 3: Admin Creates Marketing Campaign in ActiveCampaign

```
1. Admin logs into ActiveCampaign dashboard (external)
2. Admin creates email campaign targeting "Premium Members" list
3. Admin schedules campaign for delivery
4. ActiveCampaign sends campaign to all contacts in list
5. Campaign analytics tracked in ActiveCampaign:
   - Opens, clicks, conversions
6. Admin views campaign performance:
   - Option 1: View directly in ActiveCampaign dashboard
   - Option 2: View in BRITE POOL admin panel (via API)
7. BRITE POOL admin panel (/dashboard/admin/marketing) shows:
   - Recent campaigns sent
   - Open rates, click rates
   - Top performing campaigns
   - Link to view full details in ActiveCampaign
```

### Flow 4: Webhook Handling - User Unsubscribes from ActiveCampaign

```
1. User receives marketing email from ActiveCampaign
2. User clicks "Unsubscribe" link in email footer
3. ActiveCampaign processes unsubscribe
4. ActiveCampaign sends webhook to BRITE POOL:
   POST https://britepool.org/api/webhooks/activecampaign
   {
     "type": "unsubscribe",
     "date_time": "2025-12-17T14:30:00Z",
     "initiated_from": "email",
     "initiated_by": "customer",
     "contact": {
       "id": "123",
       "email": "user@example.com"
     },
     "list": "5"
   }
5. BRITE POOL webhook handler receives event
6. System looks up user by email
7. System updates user preferences:
   - externalMarketingOptIn = false
8. System logs event in EmailPreferenceLog table
9. System responds to webhook with 200 OK
10. User no longer synced to future campaigns
11. (Optional) User receives confirmation email via SendGrid (internal)
```

### Flow 5: Admin Triggers Manual Bulk Sync

```
1. Admin navigates to /dashboard/admin/integrations/activecampaign
2. Admin sees sync dashboard:
   - Total contacts synced
   - Last sync timestamp
   - Sync status (success/failed)
   - Out-of-sync contacts count
3. Admin clicks "Sync All Contacts" button
4. Confirmation modal appears: "This will sync 247 members. Continue?"
5. Admin confirms
6. POST /api/admin/activecampaign/sync-all initiated
7. System queues background job (using BullMQ or similar)
8. Job processes users in batches of 50:
   - For each user with externalMarketingOptIn = true:
     - Check if contact exists in ActiveCampaign (GET by email)
     - If exists: Update contact
     - If not exists: Create contact
     - Add to appropriate lists
   - Update ActiveCampaignContact records
9. Progress bar updates in real-time (via polling or WebSocket)
10. Upon completion:
    - Success notification: "Synced 245 contacts, 2 failed"
    - Failed contacts listed with error messages
11. Admin can retry failed syncs individually
```

### Flow 6: Automated Campaign Trigger - New Course Completion

```
1. User completes a course in LMS
2. POST /api/courses/[id]/complete updates CourseProgress
3. After successful save, system checks for campaign triggers:
   - Query CampaignTrigger table for EVENT_TYPE = "COURSE_COMPLETED"
4. If trigger exists and isActive = true:
   - Get associated ActiveCampaign automation ID
   - Add user to automation via API:
     POST /api/3/contactAutomations
     {
       "contactAutomation": {
         "contact": "123",
         "automation": "5"
       }
     }
5. User enters ActiveCampaign automation workflow
6. Automation sends:
   - Congratulations email
   - Certificate of completion
   - Survey request
   - Related course recommendations
7. System logs trigger event in CampaignTriggerLog
```

---

## Database Schema

### New Model: ActiveCampaignContact

```prisma
model ActiveCampaignContact {
  id                      String   @id @default(cuid())
  userId                  String   @unique
  user                    User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  activeCampaignContactId String   @unique  // AC's internal contact ID
  activeCampaignEmail     String   // Stored for quick lookup

  syncStatus              SyncStatus @default(PENDING)
  lastSyncedAt            DateTime?
  lastSyncError           String?

  // Track which lists the contact is in
  listIds                 String[]  // Array of AC list IDs

  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt

  @@index([userId])
  @@index([activeCampaignContactId])
  @@index([syncStatus])
}

enum SyncStatus {
  PENDING
  SYNCED
  FAILED
  OUT_OF_SYNC
}
```

### New Model: CampaignTrigger

```prisma
model CampaignTrigger {
  id                 String   @id @default(cuid())
  name               String
  description        String?
  eventType          TriggerEventType

  // ActiveCampaign automation ID
  automationId       String

  // Conditions (stored as JSON)
  conditions         Json?    // { "role": "STEWARD", "tier": "PREMIUM" }

  isActive           Boolean  @default(true)

  logs               CampaignTriggerLog[]

  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@index([eventType])
  @@index([isActive])
}

enum TriggerEventType {
  USER_REGISTERED
  COVENANT_ACCEPTED
  SUBSCRIPTION_UPGRADED
  SUBSCRIPTION_DOWNGRADED
  COURSE_COMPLETED
  EVENT_REGISTERED
  TASK_COMPLETED
  PROFILE_UPDATED
}
```

### New Model: CampaignTriggerLog

```prisma
model CampaignTriggerLog {
  id               String   @id @default(cuid())
  triggerId        String
  trigger          CampaignTrigger @relation(fields: [triggerId], references: [id], onDelete: Cascade)

  userId           String
  eventType        TriggerEventType

  success          Boolean
  errorMessage     String?

  // ActiveCampaign response data
  responseData     Json?

  triggeredAt      DateTime @default(now())

  @@index([triggerId])
  @@index([userId])
  @@index([triggeredAt])
}
```

### New Model: EmailPreferenceLog

```prisma
model EmailPreferenceLog {
  id                String   @id @default(cuid())
  userId            String

  preferenceType    String   // "external_marketing", "internal_announcements", etc.
  oldValue          Boolean
  newValue          Boolean

  source            String   // "user_dashboard", "activecampaign_webhook", "admin_override"
  reason            String?

  changedAt         DateTime @default(now())

  @@index([userId])
  @@index([changedAt])
}
```

### Updates to Existing Models

**User Model** - Add email preference fields:

```prisma
model User {
  // ... existing fields

  // Email Preferences
  externalMarketingOptIn  Boolean  @default(true)
  internalAnnouncementsOptIn Boolean @default(true)
  eventNotificationsOptIn Boolean @default(true)

  // Relations
  activeCampaignContact ActiveCampaignContact?
}
```

---

## API Endpoints

### 1. POST /api/integrations/activecampaign/sync

**Purpose:** Sync a single user to ActiveCampaign

**Authentication:** Required (user syncing self) OR admin/system

**Request Body:**
```json
{
  "userId": "user_clx123..."
}
```

**Logic:**
1. Fetch user data from database
2. Check if user has externalMarketingOptIn = true
3. If user already synced (ActiveCampaignContact exists):
   - Update contact via PUT /api/3/contacts/{contactId}
4. If not synced:
   - Create contact via POST /api/3/contacts
   - Save ActiveCampaignContact record
5. Update list memberships based on tier/role
6. Return sync status

**Response:**
```json
{
  "success": true,
  "contactId": "123",
  "syncedAt": "2025-12-17T14:30:00Z",
  "listsAdded": ["5", "12"],
  "listsRemoved": ["3"]
}
```

**Error Cases:**
- User not found → 404
- ActiveCampaign API error → 500
- User opted out → 400

---

### 2. POST /api/admin/activecampaign/sync-all

**Purpose:** Trigger bulk sync of all eligible users

**Authentication:** Required, role: WEB_STEWARD or BOARD_CHAIR

**Request Body:**
```json
{
  "force": false,  // If true, sync all; if false, only sync out-of-sync contacts
  "dryRun": false  // If true, return what would be synced without actually syncing
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "sync_job_123",
  "totalUsers": 247,
  "toSync": 245,
  "skipped": 2,
  "estimatedDuration": "5 minutes"
}
```

**Progress Polling:**
- Frontend polls GET /api/admin/activecampaign/sync-status/{jobId}
- Returns: { progress: 75, completed: 185, failed: 3, status: "in_progress" }

---

### 3. POST /api/webhooks/activecampaign

**Purpose:** Receive webhook events from ActiveCampaign

**Authentication:** Webhook signature verification (HMAC)

**Supported Events:**
- `unsubscribe` - User unsubscribed from list
- `subscribe` - User subscribed to list
- `contact_update` - Contact data updated
- `automation_complete` - User completed automation

**Request Body (example - unsubscribe):**
```json
{
  "type": "unsubscribe",
  "date_time": "2025-12-17T14:30:00Z",
  "initiated_from": "email",
  "contact": {
    "id": "123",
    "email": "user@example.com"
  },
  "list": "5"
}
```

**Logic:**
1. Verify webhook signature
2. Parse event type
3. Handle based on type:
   - **unsubscribe**: Set user.externalMarketingOptIn = false, log event
   - **subscribe**: Set user.externalMarketingOptIn = true
   - **contact_update**: Update local user data if needed
4. Return 200 OK quickly (process in background if needed)

**Response:**
```json
{
  "received": true
}
```

---

### 4. GET /api/admin/activecampaign/campaigns

**Purpose:** Fetch recent campaigns from ActiveCampaign with stats

**Authentication:** Required, role: WEB_STEWARD or BOARD_CHAIR

**Query Parameters:**
- `limit` (optional, default: 10): Number of campaigns to return
- `status` (optional): Filter by status (draft, scheduled, sending, sent)

**Response:**
```json
{
  "campaigns": [
    {
      "id": "1",
      "name": "December Newsletter",
      "subject": "Welcome to December!",
      "status": "sent",
      "sentAt": "2025-12-01T10:00:00Z",
      "stats": {
        "sent": 245,
        "opens": 180,
        "uniqueOpens": 165,
        "clicks": 45,
        "uniqueClicks": 38,
        "openRate": "67.3%",
        "clickRate": "15.5%"
      }
    }
  ]
}
```

---

### 5. POST /api/admin/activecampaign/triggers

**Purpose:** Create or update campaign trigger

**Authentication:** Required, role: WEB_STEWARD or BOARD_CHAIR

**Request Body:**
```json
{
  "name": "Course Completion Automation",
  "description": "Trigger when user completes any course",
  "eventType": "COURSE_COMPLETED",
  "automationId": "5",
  "conditions": {
    "tier": "PREMIUM"
  },
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "trigger": {
    "id": "trigger_123",
    "name": "Course Completion Automation",
    "eventType": "COURSE_COMPLETED",
    "isActive": true
  }
}
```

---

### 6. PUT /api/user/email-preferences

**Purpose:** Update user's email preferences

**Authentication:** Required (user updating own preferences)

**Request Body:**
```json
{
  "externalMarketingOptIn": true,
  "internalAnnouncementsOptIn": true,
  "eventNotificationsOptIn": false
}
```

**Logic:**
1. Update user preferences in database
2. Log change in EmailPreferenceLog
3. If externalMarketingOptIn changed to false:
   - Mark user for removal from ActiveCampaign lists
   - Trigger sync to update AC status
4. If changed to true:
   - Re-sync user to ActiveCampaign

**Response:**
```json
{
  "success": true,
  "preferences": {
    "externalMarketingOptIn": true,
    "internalAnnouncementsOptIn": true,
    "eventNotificationsOptIn": false
  }
}
```

---

## UI Components

### 1. Admin - ActiveCampaign Integration Dashboard

**Location:** `app/dashboard/admin/integrations/activecampaign/page.tsx`

**Features:**
- Overview statistics:
  - Total contacts synced
  - Sync success rate
  - Last sync timestamp
  - Out-of-sync contacts count
- "Sync All Contacts" button with progress indicator
- Recent sync activity log
- Failed syncs list with retry button
- Link to ActiveCampaign dashboard (external)
- Campaign triggers management section

**Component Structure:**

```tsx
export default function ActiveCampaignDashboard() {
  const [stats, setStats] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    const res = await fetch('/api/admin/activecampaign/sync-all', {
      method: 'POST'
    });
    const { jobId } = await res.json();

    // Poll for progress
    const interval = setInterval(async () => {
      const status = await fetch(`/api/admin/activecampaign/sync-status/${jobId}`);
      const data = await status.json();
      setSyncProgress(data.progress);

      if (data.status === 'completed') {
        clearInterval(interval);
        setIsSyncing(false);
        // Refresh stats
      }
    }, 2000);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-serif mb-6">ActiveCampaign Integration</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Contacts" value={stats?.totalContacts} />
        <StatCard title="Synced" value={stats?.synced} />
        <StatCard title="Failed" value={stats?.failed} />
        <StatCard title="Last Sync" value={stats?.lastSync} />
      </div>

      {/* Sync Button */}
      <div className="mb-8">
        <button
          onClick={handleSyncAll}
          disabled={isSyncing}
          className="btn-primary"
        >
          {isSyncing ? 'Syncing...' : 'Sync All Contacts'}
        </button>

        {isSyncing && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-earth-brown h-2 rounded-full transition-all"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">{syncProgress}% complete</p>
          </div>
        )}
      </div>

      {/* Campaign Triggers */}
      <section className="mb-8">
        <h2 className="text-2xl font-serif mb-4">Campaign Triggers</h2>
        <CampaignTriggersList />
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-2xl font-serif mb-4">Recent Sync Activity</h2>
        <SyncActivityLog />
      </section>
    </div>
  );
}
```

---

### 2. Admin - Marketing Campaigns View

**Location:** `app/dashboard/admin/marketing/campaigns/page.tsx`

**Features:**
- List of recent campaigns from ActiveCampaign
- Campaign stats (opens, clicks, conversions)
- Filter by status (sent, scheduled, draft)
- Link to view/edit in ActiveCampaign
- Visual charts for open/click rates

---

### 3. User - Email Preferences Page

**Location:** `app/dashboard/settings/email-preferences/page.tsx`

**Features:**
- Toggle switches for:
  - External marketing emails (ActiveCampaign)
  - Internal announcements
  - Event notifications
- Clear descriptions of what each preference controls
- Save button with success/error feedback
- Note: "You can always resubscribe later"

**Component Structure:**

```tsx
export default function EmailPreferencesPage() {
  const [preferences, setPreferences] = useState({
    externalMarketingOptIn: true,
    internalAnnouncementsOptIn: true,
    eventNotificationsOptIn: true
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await fetch('/api/user/email-preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences)
    });
    setIsSaving(false);
    // Show success toast
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-serif mb-6">Email Preferences</h1>

      <div className="space-y-6">
        <PreferenceToggle
          label="External Marketing Emails"
          description="Receive newsletters, course updates, and promotional content via ActiveCampaign"
          checked={preferences.externalMarketingOptIn}
          onChange={(checked) => setPreferences({ ...preferences, externalMarketingOptIn: checked })}
        />

        <PreferenceToggle
          label="Internal Announcements"
          description="Receive important updates from BRITE POOL leadership and committees"
          checked={preferences.internalAnnouncementsOptIn}
          onChange={(checked) => setPreferences({ ...preferences, internalAnnouncementsOptIn: checked })}
        />

        <PreferenceToggle
          label="Event Notifications"
          description="Receive reminders for events you've registered for"
          checked={preferences.eventNotificationsOptIn}
          onChange={(checked) => setPreferences({ ...preferences, eventNotificationsOptIn: checked })}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="btn-primary mt-8"
      >
        {isSaving ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  );
}
```

---

### 4. Campaign Trigger Management Component

**Location:** `app/components/admin/CampaignTriggersManager.tsx`

**Features:**
- List of all configured triggers
- Create new trigger modal
- Edit/delete existing triggers
- Enable/disable toggle
- Test trigger button (sends test event)

---

## Implementation Details

### Phase 1: Database & API Setup (Day 1)

1. Update Prisma schema with new models:
   - ActiveCampaignContact
   - CampaignTrigger
   - CampaignTriggerLog
   - EmailPreferenceLog
   - User model updates (email preferences)

2. Run database migrations:
   ```bash
   npx prisma db push
   ```

3. Create ActiveCampaign API client:
   ```typescript
   // lib/activecampaign.ts
   import axios from 'axios';

   const AC_API_URL = process.env.ACTIVECAMPAIGN_API_URL;
   const AC_API_KEY = process.env.ACTIVECAMPAIGN_API_KEY;

   const activeCampaignClient = axios.create({
     baseURL: AC_API_URL,
     headers: {
       'Api-Token': AC_API_KEY,
       'Content-Type': 'application/json'
     }
   });

   export async function createContact(contactData: any) {
     const response = await activeCampaignClient.post('/api/3/contacts', {
       contact: contactData
     });
     return response.data;
   }

   export async function updateContact(contactId: string, contactData: any) {
     const response = await activeCampaignClient.put(`/api/3/contacts/${contactId}`, {
       contact: contactData
     });
     return response.data;
   }

   export async function addContactToList(contactId: string, listId: string) {
     const response = await activeCampaignClient.post('/api/3/contactLists', {
       contactList: {
         contact: contactId,
         list: listId,
         status: 1  // 1 = active subscription
       }
     });
     return response.data;
   }

   export async function removeContactFromList(contactId: string, listId: string) {
     // First get the contactList ID
     const lists = await activeCampaignClient.get(`/api/3/contacts/${contactId}/contactLists`);
     const contactList = lists.data.contactLists.find(cl => cl.list === listId);

     if (contactList) {
       await activeCampaignClient.delete(`/api/3/contactLists/${contactList.id}`);
     }
   }

   export async function getCampaigns(params?: any) {
     const response = await activeCampaignClient.get('/api/3/campaigns', { params });
     return response.data;
   }

   export async function addContactToAutomation(contactId: string, automationId: string) {
     const response = await activeCampaignClient.post('/api/3/contactAutomations', {
       contactAutomation: {
         contact: contactId,
         automation: automationId
       }
     });
     return response.data;
   }
   ```

4. Implement API endpoints:
   - `/api/integrations/activecampaign/sync`
   - `/api/admin/activecampaign/sync-all`
   - `/api/webhooks/activecampaign`
   - `/api/admin/activecampaign/campaigns`
   - `/api/user/email-preferences`

### Phase 2: Sync Logic & Background Jobs (Day 1-2)

1. Create sync service:
   ```typescript
   // lib/services/activecampaign-sync.ts
   import prisma from '@/lib/prisma';
   import * as ac from '@/lib/activecampaign';

   export async function syncUserToActiveCampaign(userId: string) {
     const user = await prisma.user.findUnique({
       where: { id: userId },
       include: { profile: true, activeCampaignContact: true }
     });

     if (!user || !user.externalMarketingOptIn) {
       return { success: false, reason: 'User opted out' };
     }

     try {
       const contactData = {
         email: user.email,
         firstName: user.name.split(' ')[0],
         lastName: user.name.split(' ').slice(1).join(' '),
         phone: user.profile?.phone || '',
         fieldValues: [
           { field: '1', value: user.role },
           { field: '2', value: user.subscriptionTier },
           { field: '3', value: user.covenantAcceptedAt?.toISOString().split('T')[0] }
         ]
       };

       let acContactId: string;

       if (user.activeCampaignContact) {
         // Update existing contact
         await ac.updateContact(user.activeCampaignContact.activeCampaignContactId, contactData);
         acContactId = user.activeCampaignContact.activeCampaignContactId;
       } else {
         // Create new contact
         const result = await ac.createContact(contactData);
         acContactId = result.contact.id;

         // Save mapping
         await prisma.activeCampaignContact.create({
           data: {
             userId: user.id,
             activeCampaignContactId: acContactId,
             activeCampaignEmail: user.email,
             syncStatus: 'SYNCED',
             lastSyncedAt: new Date()
           }
         });
       }

       // Sync list memberships
       await syncListMemberships(acContactId, user);

       // Update sync status
       await prisma.activeCampaignContact.update({
         where: { userId: user.id },
         data: {
           syncStatus: 'SYNCED',
           lastSyncedAt: new Date(),
           lastSyncError: null
         }
       });

       return { success: true, contactId: acContactId };
     } catch (error) {
       // Log error
       await prisma.activeCampaignContact.update({
         where: { userId: user.id },
         data: {
           syncStatus: 'FAILED',
           lastSyncError: error.message
         }
       });

       return { success: false, error: error.message };
     }
   }

   async function syncListMemberships(acContactId: string, user: any) {
     // List IDs (configured in environment or database)
     const LIST_FREE_MEMBERS = '1';
     const LIST_PREMIUM_MEMBERS = '2';
     const LIST_STEWARDS = '3';
     const LIST_PARTNERS = '4';

     // Remove from all tier lists first
     await ac.removeContactFromList(acContactId, LIST_FREE_MEMBERS);
     await ac.removeContactFromList(acContactId, LIST_PREMIUM_MEMBERS);

     // Add to appropriate tier list
     if (user.subscriptionTier === 'FREE') {
       await ac.addContactToList(acContactId, LIST_FREE_MEMBERS);
     } else if (user.subscriptionTier === 'PREMIUM' || user.subscriptionTier === 'PLATINUM') {
       await ac.addContactToList(acContactId, LIST_PREMIUM_MEMBERS);
     }

     // Add to role list
     if (user.role === 'STEWARD') {
       await ac.addContactToList(acContactId, LIST_STEWARDS);
     } else if (user.role === 'PARTNER') {
       await ac.addContactToList(acContactId, LIST_PARTNERS);
     }
   }
   ```

2. Set up background job queue (optional, recommended):
   - Use BullMQ or similar for reliable background processing
   - Create jobs for bulk sync operations

3. Add post-save hooks to trigger syncs:
   ```typescript
   // In user update API route
   await prisma.user.update({ where: { id }, data: updatedData });

   // Trigger sync in background (non-blocking)
   fetch('/api/integrations/activecampaign/sync', {
     method: 'POST',
     body: JSON.stringify({ userId: id })
   }).catch(err => console.error('Sync failed:', err));
   ```

### Phase 3: Webhook Handling (Day 2)

1. Implement webhook endpoint:
   ```typescript
   // app/api/webhooks/activecampaign/route.ts
   import { NextResponse } from 'next/server';
   import prisma from '@/lib/prisma';

   export async function POST(request: Request) {
     try {
       const body = await request.json();

       // Verify webhook signature (important for security)
       // const signature = request.headers.get('X-AC-Signature');
       // if (!verifySignature(body, signature)) {
       //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
       // }

       const { type, contact } = body;

       switch (type) {
         case 'unsubscribe':
           await handleUnsubscribe(contact);
           break;
         case 'subscribe':
           await handleSubscribe(contact);
           break;
         case 'contact_update':
           await handleContactUpdate(contact);
           break;
         default:
           console.log('Unhandled webhook type:', type);
       }

       return NextResponse.json({ received: true });
     } catch (error) {
       console.error('Webhook error:', error);
       return NextResponse.json({ error: 'Internal error' }, { status: 500 });
     }
   }

   async function handleUnsubscribe(contact: any) {
     const user = await prisma.user.findUnique({
       where: { email: contact.email }
     });

     if (user) {
       await prisma.user.update({
         where: { id: user.id },
         data: { externalMarketingOptIn: false }
       });

       await prisma.emailPreferenceLog.create({
         data: {
           userId: user.id,
           preferenceType: 'external_marketing',
           oldValue: true,
           newValue: false,
           source: 'activecampaign_webhook',
           reason: 'User unsubscribed via email'
         }
       });
     }
   }

   async function handleSubscribe(contact: any) {
     const user = await prisma.user.findUnique({
       where: { email: contact.email }
     });

     if (user) {
       await prisma.user.update({
         where: { id: user.id },
         data: { externalMarketingOptIn: true }
       });

       await prisma.emailPreferenceLog.create({
         data: {
           userId: user.id,
           preferenceType: 'external_marketing',
           oldValue: false,
           newValue: true,
           source: 'activecampaign_webhook',
           reason: 'User resubscribed'
         }
       });
     }
   }

   async function handleContactUpdate(contact: any) {
     // Optional: Sync updated data back to BRITE POOL
     console.log('Contact updated in ActiveCampaign:', contact);
   }
   ```

2. Register webhook URL in ActiveCampaign dashboard:
   - Go to ActiveCampaign → Settings → Webhooks
   - Add webhook URL: `https://britepool.org/api/webhooks/activecampaign`
   - Select events to receive: `unsubscribe`, `subscribe`, `contact_update`
   - Save webhook

### Phase 4: UI Components (Day 2-3)

1. Create admin dashboard page
2. Implement sync controls and progress indicators
3. Create campaign triggers management UI
4. Build user email preferences page
5. Style with biophilic design system

### Phase 5: Campaign Triggers (Day 3)

1. Implement trigger system:
   ```typescript
   // lib/services/campaign-triggers.ts
   import prisma from '@/lib/prisma';
   import * as ac from '@/lib/activecampaign';

   export async function checkAndFireTriggers(eventType: string, userId: string, eventData?: any) {
     const triggers = await prisma.campaignTrigger.findMany({
       where: {
         eventType,
         isActive: true
       }
     });

     for (const trigger of triggers) {
       // Check conditions
       if (await evaluateConditions(trigger.conditions, userId, eventData)) {
         await fireTrigger(trigger, userId);
       }
     }
   }

   async function evaluateConditions(conditions: any, userId: string, eventData: any): Promise<boolean> {
     if (!conditions) return true;

     const user = await prisma.user.findUnique({ where: { id: userId } });
     if (!user) return false;

     // Evaluate conditions (simple example)
     if (conditions.role && user.role !== conditions.role) return false;
     if (conditions.tier && user.subscriptionTier !== conditions.tier) return false;

     return true;
   }

   async function fireTrigger(trigger: CampaignTrigger, userId: string) {
     try {
       const acContact = await prisma.activeCampaignContact.findUnique({
         where: { userId }
       });

       if (!acContact) {
         throw new Error('User not synced to ActiveCampaign');
       }

       await ac.addContactToAutomation(
         acContact.activeCampaignContactId,
         trigger.automationId
       );

       await prisma.campaignTriggerLog.create({
         data: {
           triggerId: trigger.id,
           userId,
           eventType: trigger.eventType,
           success: true,
           responseData: { automationId: trigger.automationId }
         }
       });

       return { success: true };
     } catch (error) {
       await prisma.campaignTriggerLog.create({
         data: {
           triggerId: trigger.id,
           userId,
           eventType: trigger.eventType,
           success: false,
           errorMessage: error.message
         }
       });

       return { success: false, error: error.message };
     }
   }
   ```

2. Add trigger checks to relevant event handlers:
   ```typescript
   // In course completion handler
   await prisma.courseProgress.update({ ... });
   await checkAndFireTriggers('COURSE_COMPLETED', userId, { courseId });
   ```

---

## Testing Requirements

### Unit Tests

```typescript
// __tests__/lib/activecampaign-sync.test.ts
import { syncUserToActiveCampaign } from '@/lib/services/activecampaign-sync';

jest.mock('@/lib/activecampaign');

test('syncUserToActiveCampaign creates new contact', async () => {
  const result = await syncUserToActiveCampaign('user_123');

  expect(result.success).toBe(true);
  expect(result.contactId).toBeTruthy();
});

test('syncUserToActiveCampaign skips opted-out users', async () => {
  const result = await syncUserToActiveCampaign('opted_out_user');

  expect(result.success).toBe(false);
  expect(result.reason).toBe('User opted out');
});

test('webhook handler updates user preferences on unsubscribe', async () => {
  await handleUnsubscribe({ email: 'test@example.com' });

  const user = await prisma.user.findUnique({ where: { email: 'test@example.com' } });
  expect(user.externalMarketingOptIn).toBe(false);
});
```

### Integration Tests

- User registration → automatic sync to ActiveCampaign
- User updates profile → sync updates in ActiveCampaign
- User opts out → removed from ActiveCampaign lists
- Webhook received → user preferences updated
- Campaign trigger fired → user added to automation

### Manual Testing Checklist

- [ ] New user syncs to ActiveCampaign automatically
- [ ] User appears in correct lists based on tier/role
- [ ] Profile updates sync to ActiveCampaign
- [ ] Webhook unsubscribe event updates user preferences
- [ ] Manual bulk sync completes successfully
- [ ] Campaign trigger adds user to automation
- [ ] Admin dashboard shows accurate stats
- [ ] Email preferences page saves correctly
- [ ] Failed syncs are logged and can be retried
- [ ] No duplicate contacts created in ActiveCampaign

---

## Deployment Checklist

### Pre-Deployment

- [ ] ActiveCampaign account created and configured
- [ ] API keys generated and added to environment variables
- [ ] Custom fields created in ActiveCampaign:
  - Field 1: Role (UserRole enum)
  - Field 2: Subscription Tier
  - Field 3: Covenant Accepted Date
- [ ] Lists created in ActiveCampaign:
  - Free Members
  - Premium Members
  - Stewards
  - Partners
  - Residents
  - (Add more as needed)
- [ ] Automations created in ActiveCampaign:
  - Welcome series
  - Course completion
  - Subscription upgrade
  - (Add more as needed)
- [ ] Database schema updated (`npx prisma db push`)
- [ ] All API endpoints tested
- [ ] Webhook URL registered in ActiveCampaign
- [ ] All tests passing

### Deployment Steps

1. Deploy database migrations
2. Deploy application code
3. Verify environment variables in production
4. Test webhook endpoint with ActiveCampaign test webhook
5. Run initial bulk sync for existing users
6. Monitor sync logs for errors
7. Verify contacts appear in ActiveCampaign

### Post-Deployment

- [ ] Verify new users sync automatically
- [ ] Test webhook events (send test unsubscribe)
- [ ] Check admin dashboard loads correctly
- [ ] Verify campaign triggers fire correctly
- [ ] Monitor ActiveCampaign API rate limits
- [ ] Set up alerts for sync failures
- [ ] Document list IDs and automation IDs for reference

---

## Security Considerations

### API Key Management
- Store ActiveCampaign API key in environment variables (never in code)
- Rotate keys periodically
- Use read-only keys where possible

### Webhook Security
- Verify webhook signatures to prevent spoofing
- Use HTTPS for webhook endpoint
- Rate limit webhook endpoint to prevent abuse

### Data Privacy
- Respect user opt-out preferences (GDPR/CCPA compliance)
- Only sync data necessary for marketing purposes
- Provide clear opt-out mechanisms
- Log all preference changes for audit trail

### Error Handling
- Never expose API errors to end users
- Log errors securely for admin review
- Implement retry logic with exponential backoff
- Set up monitoring for repeated failures

---

## ActiveCampaign API Reference

### Base URL Structure
```
https://youraccountname.api-us1.com/api/3/
```

### Authentication
All requests require `Api-Token` header:
```
Api-Token: your_api_key_here
```

### Key Endpoints Used

**Contacts:**
- `POST /api/3/contacts` - Create contact
- `PUT /api/3/contacts/{id}` - Update contact
- `GET /api/3/contacts/{id}` - Get contact
- `GET /api/3/contacts?email={email}` - Find by email

**Lists:**
- `POST /api/3/contactLists` - Subscribe contact to list
- `DELETE /api/3/contactLists/{id}` - Unsubscribe contact

**Automations:**
- `POST /api/3/contactAutomations` - Add contact to automation
- `GET /api/3/automations` - List automations

**Campaigns:**
- `GET /api/3/campaigns` - List campaigns
- `GET /api/3/campaigns/{id}` - Get campaign details

### Rate Limits
- 5 requests per second per account
- Implement exponential backoff on 429 errors

---

## Future Enhancements

1. **Advanced Segmentation:** Create dynamic lists based on member behavior
2. **A/B Testing:** Track campaign variants and performance
3. **Lead Scoring:** Implement scoring based on engagement
4. **SMS Integration:** Add ActiveCampaign SMS capabilities
5. **Event Tracking:** Send custom events to ActiveCampaign for deeper analytics
6. **Predictive Sending:** Use AC's predictive sending for optimal delivery times
7. **Win Probability:** Track deal/conversion probability for partnerships
8. **Custom Integrations:** Connect with Zapier for extended functionality

---

**Spec Complete** ✓

**Next Step:** Run `/create-tasks` to generate implementation task list.
