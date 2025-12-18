# Specification: Events Calendar System

**Feature ID:** F009
**Priority:** High
**Effort:** Large (2 weeks / 14 days)
**Dependencies:** User Authentication (F002), Committee Management (F013), Announcements (F005)
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
Implement a comprehensive events calendar system that enables committee leaders and administrators to create and manage events for committee meetings, workshops, sanctuary events, and virtual webinars. Members can RSVP/register with capacity limits, receive automated email reminders, and export events to their personal calendars via iCal format.

### Key Requirements
- Multiple event types: Committee meetings, workshops, sanctuary events, virtual webinars
- RSVP/registration system with capacity management and waitlist support
- Recurring events support (daily, weekly, monthly, yearly patterns)
- Automated email reminders (24 hours before, 1 hour before event start)
- iCal export for personal calendar synchronization (Google Calendar, Apple Calendar, Outlook)
- Multiple calendar views: Month view, week view, list/agenda view
- Role-based event creation: Committee leaders and admins can create events
- Event search and filtering by type, committee, date range
- Integration with Committee Management system for committee-specific events

### Success Metrics
- All committee meetings tracked in calendar with 100% registration accuracy
- Average registration rate of 70%+ for workshops and sanctuary events
- Email reminder delivery rate of 99%+
- iCal export functionality working across all major calendar platforms
- Zero double-bookings or scheduling conflicts for physical locations
- Mobile-responsive calendar views with smooth navigation

---

## User Flows

### Flow 1: Committee Leader Creates Committee Meeting

```
1. Committee Leader logs in (role: COMMITTEE_LEADER or higher)
2. Leader navigates to /dashboard/events or /dashboard/committees/[slug]/meetings
3. Leader clicks "Create Event" button
4. Event creation form opens with fields:
   - Event Type: COMMITTEE_MEETING (pre-selected if from committee page)
   - Committee: [current committee pre-selected, dropdown of committees user leads]
   - Title: (required, e.g., "Wealth Board Monthly Meeting")
   - Description: (optional, rich text editor with agenda)
   - Start Date & Time: (date/time picker with timezone awareness)
   - End Date & Time: (date/time picker)
   - Location: Physical location OR Virtual link (toggle)
   - Capacity: (optional, number input, default unlimited)
   - Recurring: (optional, checkbox)
     - If checked: Show recurrence options
       - Frequency: Daily/Weekly/Monthly/Yearly
       - Interval: Every N [days/weeks/months/years]
       - Days of week: (for weekly, multi-select)
       - End condition: Never/After N occurrences/On date
5. Leader fills form and clicks "Create Event"
6. POST /api/events with event data + recurrence rules
7. System validates:
   - User has permission to create events for selected committee
   - Start time is before end time
   - No location conflicts (if physical location)
   - Capacity is positive number if specified
8. If recurring:
   - System generates individual Event records based on recurrence rule
   - Limited to next 52 weeks (1 year) of occurrences
   - Each occurrence gets unique ID but shares recurrenceGroupId
9. Event(s) created with auto-registration for committee members
10. System triggers:
    - Email notification to all committee members
    - Calendar invitation attachment (iCal)
11. Leader redirected to event detail page
12. Event appears in:
    - Main events calendar
    - Committee meetings tab
    - Member personal event lists
```

### Flow 2: Member RSVPs to Workshop Event

```
1. Member logs in (any authenticated user)
2. Member navigates to /dashboard/events
3. Member sees calendar in month view (default)
4. Member clicks on event (e.g., "Permaculture Workshop")
5. Event detail modal opens showing:
   - Event title, description, time, location
   - Capacity: "15 spots available (5/20 registered)"
   - Registration status for current user
   - "Register" button (or "Join Waitlist" if at capacity)
6. Member clicks "Register" button
7. POST /api/events/[eventId]/register
8. System validates:
   - User authenticated
   - Event registration is open (not past event)
   - If capacity exists:
     - If spots available: Register as REGISTERED
     - If full: Register as WAITLISTED
9. EventRegistration record created:
   - userId, eventId
   - status: REGISTERED or WAITLISTED
   - registeredAt: timestamp
10. System triggers:
    - Confirmation email to member with iCal attachment
    - Email reminders scheduled (24hrs, 1hr before)
11. Modal updates to show "Registered" status with:
    - "Cancel Registration" button
    - "Add to Calendar" link (downloads iCal)
12. Registration count updates in calendar view
```

### Flow 3: Member Receives Email Reminders

```
1. Event scheduled for 2025-12-20 14:00 UTC
2. Background job runs every 15 minutes checking upcoming events

// 24-Hour Reminder
3. At 2025-12-19 14:00 UTC (24 hours before):
   - Job finds all events starting in 23.75-24.25 hours
   - Queries EventRegistration where status=REGISTERED
   - For each registration, sends email:
     - Subject: "Reminder: [Event Title] Tomorrow"
     - Body: Event details, time, location/link, iCal attachment
   - Updates reminder tracking (prevent duplicate sends)

// 1-Hour Reminder
4. At 2025-12-20 13:00 UTC (1 hour before):
   - Job finds all events starting in 0.75-1.25 hours
   - Queries EventRegistration where status=REGISTERED
   - For each registration, sends email:
     - Subject: "Starting Soon: [Event Title] in 1 Hour"
     - Body: Event details, quick access link
   - Updates reminder tracking

5. Member receives emails with:
   - Event details clearly formatted
   - Timezone-aware times
   - Links to event page
   - Virtual meeting links (if applicable)
   - "Add to Calendar" button/link
```

### Flow 4: Admin Creates Recurring Sanctuary Event

```
1. Admin logs in (role: WEB_STEWARD, BOARD_CHAIR, or CONTENT_MODERATOR)
2. Admin navigates to /dashboard/events
3. Admin clicks "Create Event" button
4. Admin selects:
   - Event Type: SANCTUARY_EVENT
   - Title: "Sunday Community Gathering"
   - Description: "Weekly gathering for meditation and connection"
   - Start Date: 2025-12-21 10:00 AM
   - End Date: 2025-12-21 12:00 PM
   - Location: "Main Sanctuary Hall"
   - Capacity: 50
   - Recurring: ✓ Checked
     - Frequency: Weekly
     - Interval: Every 1 week
     - Days: Sunday (checked)
     - Ends: Never
5. Admin clicks "Create Event"
6. System generates recurring event series:
   - Creates events for next 52 Sundays
   - Each event: Same title, description, time, location, capacity
   - Each event: Unique ID, shared recurrenceGroupId
   - Each event: Independent registration tracking
7. All 52 events appear in calendar
8. Admin can later:
   - Edit single occurrence (breaks from series)
   - Edit entire series (updates all future occurrences)
   - Delete single occurrence
   - Delete entire series
```

### Flow 5: Member Exports Event to Personal Calendar (iCal)

```
1. Member viewing event detail page
2. Member clicks "Add to Calendar" button
3. GET /api/events/[eventId]/ical
4. Server generates iCal (.ics) file with RFC 5545 format:
   - BEGIN:VCALENDAR
   - VERSION:2.0
   - PRODID:-//BRITE POOL//Events Calendar//EN
   - BEGIN:VEVENT
   - UID:[unique-event-id]@britepool.org
   - DTSTAMP:[created-timestamp]
   - DTSTART:[start-time in UTC]
   - DTEND:[end-time in UTC]
   - SUMMARY:[Event title]
   - DESCRIPTION:[Event description]
   - LOCATION:[Location or virtual link]
   - STATUS:CONFIRMED
   - SEQUENCE:0
   - ORGANIZER:mailto:events@britepool.org
   - ATTENDEE:mailto:[member-email]
   - END:VEVENT
   - END:VCALENDAR
5. Browser downloads file: "[event-title].ics"
6. Member opens file with default calendar app:
   - Google Calendar: Import automatically
   - Apple Calendar: Add to calendar
   - Outlook: Add to calendar
7. Event synced to personal calendar
8. If event updated later:
   - System sends email with updated iCal (SEQUENCE incremented)
   - Calendar app updates event automatically
```

### Flow 6: Member Browses Calendar in Different Views

```
1. Member navigates to /dashboard/events
2. Default view: Month view
   - Calendar grid showing current month
   - Events displayed as colored badges on date cells
   - Different colors for event types (meetings, workshops, etc.)
   - Click date to see all events that day
   - Click event to open detail modal
   - Navigation: Previous/Next month arrows, "Today" button

3. Member switches to Week view:
   - 7-day column layout (Sunday-Saturday)
   - Time slots in 30-minute increments
   - Events positioned by start time and duration
   - Multi-day events span columns
   - Current time indicator (live updating)
   - Scroll to current time on load

4. Member switches to List/Agenda view:
   - Chronological list of upcoming events
   - Grouped by date (Today, Tomorrow, This Week, etc.)
   - Each event shows: Title, time, location, registration status
   - Infinite scroll or pagination
   - Filters: Event type, committee, registered only

5. All views have:
   - Search bar (filter by title/description)
   - Filter dropdown: Event type
   - Filter dropdown: Committee (if member)
   - Date range selector
   - "My Events" toggle (registered only)
```

### Flow 7: Handling Capacity and Waitlist

```
1. Workshop event created with capacity: 20
2. Members register until capacity reached (20 REGISTERED)
3. 21st member attempts to register:
   - System checks: registrations.count() >= event.capacity
   - Status set to WAITLISTED instead of REGISTERED
   - Member receives waitlist confirmation email
   - Modal shows: "Added to Waitlist (Position: 1)"

4. Existing member cancels registration:
   - DELETE /api/events/[eventId]/register
   - EventRegistration status updated to CANCELLED
   - Spot becomes available

5. System automatically promotes from waitlist:
   - Query: First waitlisted registration (oldest registeredAt)
   - Update status: WAITLISTED → REGISTERED
   - Send email: "You've been moved off the waitlist!"
   - Include iCal attachment and reminders

6. Waitlist ordering:
   - First-come-first-served (registeredAt timestamp)
   - Transparent position shown to waitlisted members
   - Auto-promotion happens immediately on cancellation
```

### Flow 8: Committee Leader Edits Recurring Event

```
1. Committee leader viewing recurring event
2. Leader clicks "Edit" button
3. Modal asks: "Edit this occurrence or entire series?"
   - Option A: "This event only"
   - Option B: "This and all future events"

If Option A (single occurrence):
4. Event form pre-filled with current values
5. Leader makes changes (e.g., move time by 1 hour)
6. PATCH /api/events/[eventId] with isException=true
7. Event updated, recurrenceGroupId preserved but marked as exception
8. Only this occurrence affected
9. Registrants receive update email

If Option B (series):
10. Event form pre-filled with current values
11. Leader makes changes (e.g., change location)
12. PATCH /api/events/[eventId]?updateSeries=true
13. System updates all future events in recurrenceGroupId:
    - WHERE recurrenceGroupId = X AND startTime >= now()
    - SET location = newLocation (or other changed fields)
14. All future occurrences updated
15. All registrants for all future events receive update email
```

---

## Database Schema

### Existing Models (from Prisma schema)

The following models already exist and will be enhanced:

```prisma
model Event {
  id          String   @id @default(cuid())
  title       String
  description String?
  type        EventType

  startTime   DateTime
  endTime     DateTime
  location    String?
  virtualLink String?

  capacity    Int?

  committeeId String?
  committee   Committee? @relation(fields: [committeeId], references: [id])

  registrations EventRegistration[]

  // NEW FIELDS FOR RECURRING EVENTS
  isRecurring       Boolean  @default(false)
  recurrenceRule    Json?    // RRULE data: { freq, interval, byweekday, until, count }
  recurrenceGroupId String?  // Groups all occurrences of same series
  isException       Boolean  @default(false) // True if edited individually

  // NEW FIELDS FOR REMINDERS
  reminder24hSent   Boolean  @default(false)
  reminder1hSent    Boolean  @default(false)

  createdById String
  createdBy   User   @relation("EventsCreated", fields: [createdById], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([startTime])
  @@index([endTime])
  @@index([type])
  @@index([committeeId])
  @@index([recurrenceGroupId])
  @@index([createdById])
}

model EventRegistration {
  id        String   @id @default(cuid())
  userId    String
  eventId   String
  status    RegistrationStatus @default(REGISTERED)

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)

  registeredAt DateTime @default(now())
  cancelledAt  DateTime? // NEW: Track cancellation time for waitlist ordering

  @@unique([userId, eventId])
  @@index([eventId])
  @@index([userId])
  @@index([status])
}

enum EventType {
  COMMITTEE_MEETING
  WORKSHOP
  SANCTUARY_EVENT
  VIRTUAL_WEBINAR
}

enum RegistrationStatus {
  REGISTERED
  WAITLISTED
  CANCELLED
  ATTENDED  // Future: Check-in system
}
```

### New Relation in User Model

```prisma
model User {
  // ... existing fields

  eventsCreated EventRegistration[] @relation("EventsCreated")

  // ... existing relations
}
```

### Recurrence Rule Format (JSON)

The `recurrenceRule` field stores structured data following iCalendar RRULE specification:

```typescript
interface RecurrenceRule {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;           // Every N [freq units]
  byweekday?: number[];       // [0-6] for Sun-Sat, used with WEEKLY
  bymonthday?: number[];      // [1-31] for day of month, used with MONTHLY
  bymonth?: number[];         // [1-12] for month, used with YEARLY
  until?: string;             // ISO date string, end date
  count?: number;             // Number of occurrences
}

// Example: Every 2 weeks on Monday and Wednesday, 10 times
{
  "freq": "WEEKLY",
  "interval": 2,
  "byweekday": [1, 3],
  "count": 10
}

// Example: Monthly on the 15th, until Dec 31 2026
{
  "freq": "MONTHLY",
  "interval": 1,
  "bymonthday": [15],
  "until": "2026-12-31T00:00:00Z"
}
```

### Database Migration

Run Prisma migration:

```bash
npx prisma migrate dev --name add-recurring-events-and-reminders
```

---

## API Endpoints

### 1. GET /api/events

**Purpose:** List events with filtering and pagination

**Authentication:** Required (any authenticated user)

**Query Parameters:**
- `view` (optional): `month` | `week` | `list` | `all` (default: `month`)
- `startDate` (optional): ISO date string, filter events >= this date
- `endDate` (optional): ISO date string, filter events <= this date
- `type` (optional): EventType filter
- `committeeId` (optional): Filter by committee
- `myEvents` (optional, boolean): Only events user registered for
- `limit` (optional): Pagination limit (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "events": [
    {
      "id": "evt_123",
      "title": "Wealth Board Monthly Meeting",
      "description": "Review Q1 financials",
      "type": "COMMITTEE_MEETING",
      "startTime": "2025-12-20T14:00:00Z",
      "endTime": "2025-12-20T15:30:00Z",
      "location": null,
      "virtualLink": "https://zoom.us/j/123456",
      "capacity": null,
      "registrationCount": 8,
      "userRegistrationStatus": "REGISTERED",
      "isRecurring": true,
      "recurrenceGroupId": "rec_abc",
      "committee": {
        "id": "com_456",
        "name": "Wealth Board",
        "slug": "wealth"
      },
      "createdBy": {
        "id": "usr_789",
        "name": "Jane Doe"
      }
    }
  ],
  "total": 45,
  "hasMore": false
}
```

**Error Cases:**
- User not authenticated: 401
- Invalid date format: 400

---

### 2. POST /api/events

**Purpose:** Create new event or recurring event series

**Authentication:** Required, role: COMMITTEE_LEADER (for their committees), BOARD_CHAIR, WEB_STEWARD, or CONTENT_MODERATOR

**Request Body:**
```json
{
  "title": "Sunday Community Gathering",
  "description": "Weekly meditation and connection",
  "type": "SANCTUARY_EVENT",
  "startTime": "2025-12-21T10:00:00Z",
  "endTime": "2025-12-21T12:00:00Z",
  "location": "Main Sanctuary Hall",
  "virtualLink": null,
  "capacity": 50,
  "committeeId": null,
  "isRecurring": true,
  "recurrenceRule": {
    "freq": "WEEKLY",
    "interval": 1,
    "byweekday": [0],
    "count": 52
  }
}
```

**Logic:**
1. Validate user has permission to create events
   - If committeeId provided, verify user is leader of that committee
   - Otherwise, verify user has WEB_STEWARD, BOARD_CHAIR, or CONTENT_MODERATOR role
2. Validate event data:
   - startTime < endTime
   - capacity > 0 if provided
   - If physical location, check for conflicts
3. If isRecurring:
   - Generate recurrenceGroupId (cuid)
   - Parse recurrenceRule
   - Generate array of occurrence dates (limit to 52 weeks/1 year max)
   - Create Event record for each occurrence with:
     - Shared: title, description, type, duration, location, capacity, committeeId, recurrenceRule, recurrenceGroupId
     - Unique: id, startTime, endTime (calculated per occurrence)
4. Else (single event):
   - Create single Event record
5. If committeeId provided:
   - Auto-register all committee members with status=REGISTERED
6. Queue email notifications to registrants with iCal attachment
7. Return created event(s)

**Response:**
```json
{
  "success": true,
  "event": {
    "id": "evt_123",
    "title": "Sunday Community Gathering",
    "recurrenceGroupId": "rec_abc",
    "occurrencesCreated": 52
  }
}
```

**Error Cases:**
- User not authorized: 403
- Invalid data: 400
- Location conflict: 409

---

### 3. PATCH /api/events/[eventId]

**Purpose:** Update existing event or event series

**Authentication:** Required, must be event creator or admin

**Query Parameters:**
- `updateSeries` (optional, boolean): If true, update all future occurrences in series

**Request Body:**
```json
{
  "title": "Updated Title",
  "location": "New Location",
  "capacity": 60
}
```

**Logic:**
1. Verify user is event creator or admin
2. If updateSeries=true and event.recurrenceGroupId exists:
   - Update all events WHERE recurrenceGroupId = X AND startTime >= now()
   - Send update emails to all affected registrants
3. Else (single occurrence):
   - Update only this event
   - Set isException = true
   - Send update email to registrants of this event only

**Response:**
```json
{
  "success": true,
  "updatedCount": 1
}
```

---

### 4. DELETE /api/events/[eventId]

**Purpose:** Delete event or event series

**Authentication:** Required, must be event creator or admin

**Query Parameters:**
- `deleteSeries` (optional, boolean): If true, delete all future occurrences

**Logic:**
1. Verify user is event creator or admin
2. If deleteSeries=true and event.recurrenceGroupId exists:
   - Delete all events WHERE recurrenceGroupId = X AND startTime >= now()
   - Cancel all registrations for deleted events
   - Send cancellation emails
3. Else:
   - Delete single event
   - Cancel registrations for this event
   - Send cancellation email

**Response:**
```json
{
  "success": true,
  "deletedCount": 1
}
```

---

### 5. POST /api/events/[eventId]/register

**Purpose:** Register current user for event (RSVP)

**Authentication:** Required

**Request Body:** (none)

**Logic:**
1. Verify user authenticated
2. Check event exists and is future event (startTime > now)
3. Check if user already registered:
   - If existing REGISTERED or WAITLISTED: Return 400 "Already registered"
   - If existing CANCELLED: Update status to REGISTERED/WAITLISTED
4. Check capacity:
   - If no capacity limit: Create REGISTERED
   - If spots available (registrations.count(REGISTERED) < capacity): Create REGISTERED
   - If full: Create WAITLISTED
5. Create/update EventRegistration record
6. Send confirmation email with:
   - Event details
   - Registration status (registered or waitlisted)
   - iCal attachment
   - Add to calendar link
7. Schedule reminder emails (24hr, 1hr before)

**Response:**
```json
{
  "success": true,
  "registration": {
    "id": "reg_123",
    "status": "REGISTERED",
    "registeredAt": "2025-12-18T10:00:00Z",
    "waitlistPosition": null
  }
}
```

**Error Cases:**
- User not authenticated: 401
- Event not found: 404
- Event in past: 400
- Already registered: 400

---

### 6. DELETE /api/events/[eventId]/register

**Purpose:** Cancel user's registration for event

**Authentication:** Required

**Logic:**
1. Find user's EventRegistration for this event
2. If not found: Return 404
3. Update status to CANCELLED, set cancelledAt timestamp
4. If event has capacity and waitlist exists:
   - Find oldest WAITLISTED registration
   - Promote to REGISTERED
   - Send promotion email with iCal
5. Send cancellation confirmation to user

**Response:**
```json
{
  "success": true,
  "promoted": {
    "userId": "usr_456",
    "name": "John Doe"
  }
}
```

---

### 7. GET /api/events/[eventId]

**Purpose:** Get single event details with full registration info

**Authentication:** Required

**Response:**
```json
{
  "event": {
    "id": "evt_123",
    "title": "Permaculture Workshop",
    "description": "Learn sustainable farming techniques",
    "type": "WORKSHOP",
    "startTime": "2025-12-22T09:00:00Z",
    "endTime": "2025-12-22T17:00:00Z",
    "location": "Education Center",
    "virtualLink": null,
    "capacity": 20,
    "registrations": {
      "registered": 15,
      "waitlisted": 3,
      "total": 18
    },
    "userRegistration": {
      "status": "REGISTERED",
      "registeredAt": "2025-12-18T10:00:00Z"
    },
    "isRecurring": false,
    "committee": null,
    "createdBy": {
      "id": "usr_789",
      "name": "Jane Doe",
      "email": "jane@example.com"
    },
    "createdAt": "2025-12-15T08:00:00Z"
  }
}
```

---

### 8. GET /api/events/[eventId]/ical

**Purpose:** Generate iCal file for event (calendar export)

**Authentication:** Optional (public access for sharing)

**Response:**
- Content-Type: `text/calendar; charset=utf-8`
- Content-Disposition: `attachment; filename="[event-title].ics"`
- Body: iCalendar format (RFC 5545)

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BRITE POOL//Events Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:evt_123@britepool.org
DTSTAMP:20251218T100000Z
DTSTART:20251222T090000Z
DTEND:20251222T170000Z
SUMMARY:Permaculture Workshop
DESCRIPTION:Learn sustainable farming techniques\n\nView event: https://britepool.org/events/evt_123
LOCATION:Education Center
STATUS:CONFIRMED
SEQUENCE:0
ORGANIZER;CN=BRITE POOL Events:mailto:events@britepool.org
URL:https://britepool.org/events/evt_123
END:VEVENT
END:VCALENDAR
```

**Logic:**
1. Fetch event by ID
2. Generate iCal formatted string with proper encoding
3. Set appropriate headers for download
4. Return file

---

### 9. GET /api/events/[eventId]/registrations (Admin/Creator only)

**Purpose:** Get list of registrations for event (for organizers)

**Authentication:** Required, must be event creator, committee leader, or admin

**Response:**
```json
{
  "registrations": [
    {
      "id": "reg_123",
      "status": "REGISTERED",
      "registeredAt": "2025-12-18T10:00:00Z",
      "user": {
        "id": "usr_456",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "summary": {
    "registered": 15,
    "waitlisted": 3,
    "cancelled": 2,
    "capacity": 20
  }
}
```

---

### 10. POST /api/admin/events/send-reminders (Background Job)

**Purpose:** Background cron job to send email reminders

**Authentication:** Internal only (API key or system token)

**Request Body:**
```json
{
  "reminderType": "24h" | "1h"
}
```

**Logic:**
1. Calculate time window:
   - 24h: Events starting in 23.75-24.25 hours
   - 1h: Events starting in 0.75-1.25 hours
2. Find events in window WHERE reminder not yet sent:
   - 24h: reminder24hSent = false
   - 1h: reminder1hSent = false
3. For each event:
   - Query registrations WHERE status = REGISTERED
   - For each registrant:
     - Generate reminder email with event details
     - Include virtual link if applicable
     - Include iCal attachment
     - Send email
   - Update event: Set reminder flag to true
4. Return count of emails sent

**Response:**
```json
{
  "success": true,
  "emailsSent": 47,
  "eventsProcessed": 6
}
```

**Cron Schedule:**
- Run every 15 minutes: `*/15 * * * *`
- Use job queue (BullMQ, AWS SQS, etc.) for reliability

---

## UI Components

### 1. Events Calendar Page (Main View)

**Location:** `app/dashboard/events/page.tsx`

**Features:**
- Tabbed interface for view switching: Month | Week | List
- Toolbar with:
  - Date navigation (prev/next, today button)
  - View selector (month/week/list)
  - Search/filter controls
  - "Create Event" button (for authorized users)
- Calendar component using FullCalendar or react-big-calendar
- Event color coding by type
- Click event to open detail modal
- Mobile-responsive with touch gestures

**Technology Choice: FullCalendar vs react-big-calendar**

**Recommendation: FullCalendar** (MIT licensed)

**Reasons:**
- More feature-complete out of the box
- Better mobile responsiveness
- Built-in recurring events support
- Excellent documentation
- Active maintenance
- Drag-and-drop event editing (future feature)
- Timezone support
- Plugin ecosystem

**Installation:**
```bash
npm install @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/list
```

**Component Structure:**

```tsx
'use client';

import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { useQuery } from '@tanstack/react-query';

export default function EventsCalendarPage() {
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');
  const [dateRange, setDateRange] = useState({ start: new Date(), end: null });
  const [filters, setFilters] = useState({ type: null, committeeId: null, myEvents: false });

  // Fetch events based on current view and filters
  const { data: events, isLoading } = useQuery({
    queryKey: ['events', dateRange, filters],
    queryFn: () => fetchEvents(dateRange, filters)
  });

  const handleEventClick = (info) => {
    // Open event detail modal
    openEventModal(info.event.id);
  };

  const fullCalendarView = {
    month: 'dayGridMonth',
    week: 'timeGridWeek',
    list: 'listWeek'
  }[view];

  return (
    <div className="h-screen flex flex-col bg-earth-light">
      {/* Toolbar */}
      <div className="bg-white border-b border-stone p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-serif text-earth-brown">Events Calendar</h1>

          {/* View Tabs */}
          <div className="flex gap-1 bg-stone-light rounded-lg p-1">
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 rounded-md transition ${
                view === 'month' ? 'bg-white shadow' : 'hover:bg-white/50'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 rounded-md transition ${
                view === 'week' ? 'bg-white shadow' : 'hover:bg-white/50'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-md transition ${
                view === 'list' ? 'bg-white shadow' : 'hover:bg-white/50'
              }`}
            >
              List
            </button>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search events..."
            className="px-4 py-2 border border-stone rounded-lg"
          />

          <select
            className="px-4 py-2 border border-stone rounded-lg"
            onChange={(e) => setFilters({ ...filters, type: e.target.value || null })}
          >
            <option value="">All Types</option>
            <option value="COMMITTEE_MEETING">Committee Meetings</option>
            <option value="WORKSHOP">Workshops</option>
            <option value="SANCTUARY_EVENT">Sanctuary Events</option>
            <option value="VIRTUAL_WEBINAR">Virtual Webinars</option>
          </select>

          <label className="flex items-center gap-2 text-earth-dark">
            <input
              type="checkbox"
              checked={filters.myEvents}
              onChange={(e) => setFilters({ ...filters, myEvents: e.target.checked })}
              className="w-4 h-4 accent-earth-brown"
            />
            My Events
          </label>

          <button className="btn-primary">+ Create Event</button>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-hidden p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
          initialView={fullCalendarView}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
          }}
          events={events?.map(event => ({
            id: event.id,
            title: event.title,
            start: event.startTime,
            end: event.endTime,
            backgroundColor: getEventColor(event.type),
            borderColor: getEventColor(event.type),
            extendedProps: {
              type: event.type,
              location: event.location,
              virtualLink: event.virtualLink,
              registrationCount: event.registrationCount,
              capacity: event.capacity,
              userRegistrationStatus: event.userRegistrationStatus
            }
          }))}
          eventClick={handleEventClick}
          height="100%"
          nowIndicator={true}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          eventDisplay="block"
          displayEventTime={true}
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short'
          }}
          datesSet={(dateInfo) => {
            setDateRange({ start: dateInfo.start, end: dateInfo.end });
          }}
        />
      </div>
    </div>
  );
}

function getEventColor(type: EventType): string {
  const colors = {
    COMMITTEE_MEETING: '#8B7355', // Earth brown
    WORKSHOP: '#6B9B8E', // Sage green
    SANCTUARY_EVENT: '#9B8B6B', // Sand
    VIRTUAL_WEBINAR: '#6B8B9B' // Sky blue
  };
  return colors[type] || '#666666';
}
```

---

### 2. Event Detail Modal

**Location:** `app/components/events/EventDetailModal.tsx`

**Features:**
- Event title, description (rendered as markdown)
- Date, time, timezone
- Location (with map link) or virtual link
- Capacity and registration count
- Current user's registration status
- Action buttons:
  - Register / Join Waitlist / Cancel Registration
  - Add to Calendar (download iCal)
  - Share event (copy link)
- Organizer information
- Edit/Delete buttons (for creator/admin)

---

### 3. Event Creation Form

**Location:** `app/components/events/EventCreateForm.tsx`

**Features:**
- Multi-step form or single page
- Fields:
  - Event type (dropdown)
  - Committee (if applicable, dropdown)
  - Title (text input)
  - Description (rich text editor: TipTap or Lexical)
  - Start date & time (date/time picker with timezone)
  - End date & time
  - Location toggle (Physical / Virtual)
    - If physical: Text input
    - If virtual: URL input (Zoom, Google Meet, etc.)
  - Capacity (number input with "unlimited" option)
  - Recurring event toggle
    - If checked: Recurrence options form
- Validation:
  - All required fields
  - End time > start time
  - Capacity >= 0
  - Valid URL for virtual link
- Preview section showing first few occurrences (if recurring)
- Submit button

---

### 4. Recurrence Options Form

**Location:** `app/components/events/RecurrenceForm.tsx`

**Features:**
- Frequency dropdown: Daily / Weekly / Monthly / Yearly
- Interval input: "Every [N] [frequency]"
- Conditional fields based on frequency:
  - Weekly: Day of week checkboxes (Sun-Sat)
  - Monthly: Day of month selector (1-31) or "Last day"
  - Yearly: Month and day selectors
- End condition radio buttons:
  - Never (default)
  - After [N] occurrences
  - On [date]
- Preview: "Creates events on: [list of first 5 dates]"
- Visual timeline preview

**Example UI:**

```
Repeat: [Weekly ▼]  every [1] week(s)

On: ☑ Monday  ☐ Tuesday  ☑ Wednesday  ☐ Thursday  ☑ Friday  ☐ Saturday  ☐ Sunday

Ends:
  ○ Never
  ● After [10] occurrences
  ○ On [date picker]

Preview:
This will create 10 events:
  - Mon, Dec 23, 2025 at 2:00 PM
  - Wed, Dec 25, 2025 at 2:00 PM
  - Fri, Dec 27, 2025 at 2:00 PM
  ... (7 more)
```

---

### 5. Email Templates

**Location:** `app/lib/email/templates/`

#### a. Event Confirmation Email

**Template:** `event-confirmation.tsx` (React Email)

**Variables:**
- eventTitle, eventDescription
- startTime, endTime (formatted with timezone)
- location or virtualLink
- registrationStatus (REGISTERED or WAITLISTED)
- waitlistPosition (if applicable)
- icalAttachment (base64 encoded)
- eventUrl (link to event page)
- unsubscribeUrl

**Content:**
```
Subject: You're registered: [Event Title]

Hi [User Name],

You've successfully registered for:

[Event Title]
[Date] at [Time] ([Timezone])
[Location or Virtual Link]

[If REGISTERED]
  Your spot is confirmed! We look forward to seeing you there.

[If WAITLISTED]
  You're currently on the waitlist (position: [N]).
  We'll notify you if a spot opens up.

[Event Description Preview]

📅 Add to Calendar
You can add this event to your personal calendar using the attached file.

[View Event Details Button]

---
BRITE POOL Ministerium
```

#### b. 24-Hour Reminder Email

**Template:** `event-reminder-24h.tsx`

**Content:**
```
Subject: Reminder: [Event Title] Tomorrow

Hi [User Name],

This is a friendly reminder that you're registered for:

[Event Title]
Tomorrow at [Time] ([Timezone])
[Location or Virtual Link]

[If Virtual]
  Join here: [Virtual Link Button]

See you there!

[View Event Details]

---
To cancel your registration, click here: [Cancel Link]
```

#### c. 1-Hour Reminder Email

**Template:** `event-reminder-1h.tsx`

**Content:**
```
Subject: Starting Soon: [Event Title] in 1 Hour

Hi [User Name],

[Event Title] starts in 1 hour!

Time: [Time] ([Timezone])
[Location or Virtual Link]

[If Virtual]
  [Join Now Button - Large, Prominent]

See you soon!

---
[View Event Details] | [Cancel Registration]
```

#### d. Waitlist Promotion Email

**Template:** `event-waitlist-promotion.tsx`

**Content:**
```
Subject: Great news! You're off the waitlist for [Event Title]

Hi [User Name],

Good news! A spot has opened up and you've been moved from the waitlist to confirmed registration for:

[Event Title]
[Date] at [Time] ([Timezone])
[Location or Virtual Link]

Your spot is now confirmed. We look forward to seeing you!

📅 Add to Calendar (attached)

[View Event Details]

---
If you can no longer attend, please cancel your registration so we can offer the spot to someone else.
```

---

## Implementation Details

### Phase 1: Database & Core API (Days 1-4)

**Tasks:**
1. Update Prisma schema with new Event fields (isRecurring, recurrenceRule, recurrenceGroupId, isException, reminder flags)
2. Add User relation for eventsCreated
3. Run database migration: `npx prisma migrate dev`
4. Implement API endpoints:
   - GET /api/events (with filtering)
   - POST /api/events (single and recurring)
   - PATCH /api/events/[eventId]
   - DELETE /api/events/[eventId]
   - GET /api/events/[eventId]
5. Add permission checks for event creation:
   - Committee leaders can create events for their committees
   - Admins can create any events
6. Implement recurring event generation logic:
   - Parse recurrenceRule JSON
   - Generate array of DateTime instances
   - Limit to 52 weeks (1 year)
   - Create Event records in bulk
7. Add unit tests for recurrence logic

---

### Phase 2: Registration & Capacity Management (Days 5-6)

**Tasks:**
1. Implement API endpoints:
   - POST /api/events/[eventId]/register
   - DELETE /api/events/[eventId]/register
   - GET /api/events/[eventId]/registrations
2. Add capacity checking logic:
   - Count current REGISTERED status
   - Compare against event.capacity
   - Set WAITLISTED if at capacity
3. Implement waitlist promotion:
   - On registration cancellation
   - Find oldest WAITLISTED (by registeredAt)
   - Update to REGISTERED
   - Trigger email notification
4. Add unit tests for capacity and waitlist logic

---

### Phase 3: iCal Export (Day 7)

**Tasks:**
1. Implement GET /api/events/[eventId]/ical endpoint
2. Create iCal generation utility function:
   - Use library: `ics` (npm package) or manual RFC 5545 formatting
   - Format: BEGIN:VCALENDAR...END:VCALENDAR
   - Include all required properties: UID, DTSTAMP, DTSTART, DTEND, SUMMARY, DESCRIPTION, LOCATION
   - Handle timezones correctly (convert to UTC)
   - Set proper content headers
3. Test export with:
   - Google Calendar
   - Apple Calendar (macOS/iOS)
   - Outlook (web and desktop)
4. Add iCal attachment to confirmation emails

**iCal Generation Library:**
```bash
npm install ics
```

**Usage:**
```typescript
import { createEvent } from 'ics';

const icalData = createEvent({
  start: [2025, 12, 22, 9, 0], // [year, month, day, hour, minute]
  end: [2025, 12, 22, 17, 0],
  title: 'Permaculture Workshop',
  description: 'Learn sustainable farming techniques',
  location: 'Education Center',
  url: 'https://britepool.org/events/evt_123',
  status: 'CONFIRMED',
  organizer: { name: 'BRITE POOL', email: 'events@britepool.org' },
  attendees: [{ name: 'John Doe', email: 'john@example.com' }]
});

// Returns { error: null, value: 'BEGIN:VCALENDAR...' }
```

---

### Phase 4: Email Reminders System (Days 8-9)

**Tasks:**
1. Set up email service provider:
   - Recommendation: Resend (developer-friendly, good free tier)
   - Alternative: SendGrid, AWS SES, Postmark
2. Create email templates using React Email:
   - Install: `npm install react-email @react-email/components`
   - Create templates in `app/lib/email/templates/`
   - Build: Render React components to HTML
3. Implement reminder cron job:
   - POST /api/admin/events/send-reminders endpoint
   - Logic: Find events in time window, send emails, update flags
   - Use job queue for reliability (BullMQ recommended)
4. Set up cron schedule:
   - Option A: Vercel Cron Jobs (if deployed on Vercel)
   - Option B: GitHub Actions (schedule: every 15 minutes)
   - Option C: External service (EasyCron, cron-job.org)
5. Add email sending utility:
   - Queue emails (don't send synchronously)
   - Handle failures and retries
   - Log all sends for debugging
6. Test reminder flow end-to-end

**Cron Job Configuration (Vercel):**

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/admin/events/send-reminders?reminderType=24h",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/admin/events/send-reminders?reminderType=1h",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

**Email Service Setup (Resend):**

```typescript
// app/lib/email/send.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEventEmail(
  to: string,
  subject: string,
  template: React.ReactElement,
  icalAttachment?: string
) {
  const attachments = icalAttachment
    ? [{
        filename: 'event.ics',
        content: Buffer.from(icalAttachment).toString('base64'),
      }]
    : [];

  const { data, error } = await resend.emails.send({
    from: 'BRITE POOL Events <events@britepool.org>',
    to,
    subject,
    react: template,
    attachments
  });

  if (error) {
    console.error('Failed to send email:', error);
    throw error;
  }

  return data;
}
```

---

### Phase 5: Calendar UI with FullCalendar (Days 10-12)

**Tasks:**
1. Install FullCalendar dependencies:
   ```bash
   npm install @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/list
   ```
2. Create EventsCalendarPage component:
   - Integrate FullCalendar with Next.js (client component)
   - Implement view switching (month/week/list)
   - Add toolbar with filters and search
   - Style to match biophilic design system
3. Implement event fetching:
   - Use React Query for data fetching
   - Fetch events based on current date range
   - Cache results for performance
4. Add event click handler:
   - Open detail modal
   - Show registration status
   - Display action buttons
5. Implement EventDetailModal component:
   - Full event details
   - Register/cancel buttons
   - Add to calendar button
   - Share functionality
6. Style calendar events:
   - Color code by event type
   - Show registration count on hover
   - Visual indicator for user's registered events
   - Responsive design for mobile
7. Add loading states and error handling

---

### Phase 6: Event Creation & Editing (Days 13-14)

**Tasks:**
1. Create EventCreateForm component:
   - Multi-field form with validation
   - Rich text editor for description (TipTap)
   - Date/time pickers (react-datepicker)
   - Location/virtual link toggle
   - Capacity input
   - Committee selector (if applicable)
2. Implement RecurrenceForm component:
   - Frequency selector
   - Interval input
   - Day/month selectors (conditional)
   - End condition options
   - Preview of generated occurrences
3. Add form validation:
   - Client-side validation with zod
   - Server-side validation in API
   - Error messages
4. Implement event editing:
   - Pre-populate form with existing data
   - Handle single occurrence vs. series updates
   - Show "Edit this event" vs "Edit series" dialog
5. Implement event deletion:
   - Confirmation dialog
   - Single occurrence vs. series deletion
   - Handle cascade (registrations cancelled)
6. Add permission checks in UI:
   - Show create button only for authorized users
   - Show edit/delete only for creator or admin
7. Final UI polish and accessibility improvements
8. End-to-end testing of full event lifecycle

---

## Testing Requirements

### Unit Tests

**API Endpoint Tests:**

```typescript
// tests/api/events.test.ts

describe('POST /api/events - Create recurring event', () => {
  it('should create 52 weekly events', async () => {
    const response = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Weekly Gathering',
        type: 'SANCTUARY_EVENT',
        startTime: '2025-12-21T10:00:00Z',
        endTime: '2025-12-21T12:00:00Z',
        isRecurring: true,
        recurrenceRule: {
          freq: 'WEEKLY',
          interval: 1,
          byweekday: [0],
          count: 52
        }
      });

    expect(response.status).toBe(201);
    expect(response.body.occurrencesCreated).toBe(52);

    const events = await prisma.event.findMany({
      where: { recurrenceGroupId: response.body.event.recurrenceGroupId }
    });

    expect(events.length).toBe(52);
    expect(events[0].startTime).toBe('2025-12-21T10:00:00Z');
    expect(events[1].startTime).toBe('2025-12-28T10:00:00Z');
  });
});

describe('POST /api/events/[eventId]/register - Capacity management', () => {
  it('should register user when capacity available', async () => {
    const event = await createEvent({ capacity: 2 });

    const response = await request(app)
      .post(`/api/events/${event.id}/register`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.registration.status).toBe('REGISTERED');
  });

  it('should waitlist user when capacity full', async () => {
    const event = await createEvent({ capacity: 1 });
    await registerUser(event.id, user1.id); // Fill capacity

    const response = await request(app)
      .post(`/api/events/${event.id}/register`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(response.status).toBe(200);
    expect(response.body.registration.status).toBe('WAITLISTED');
  });

  it('should promote from waitlist on cancellation', async () => {
    const event = await createEvent({ capacity: 1 });
    await registerUser(event.id, user1.id); // Fill capacity
    await registerUser(event.id, user2.id); // Waitlist

    await request(app)
      .delete(`/api/events/${event.id}/register`)
      .set('Authorization', `Bearer ${user1Token}`);

    const registration = await prisma.eventRegistration.findUnique({
      where: { userId_eventId: { userId: user2.id, eventId: event.id } }
    });

    expect(registration.status).toBe('REGISTERED');
  });
});
```

**Recurrence Logic Tests:**

```typescript
// tests/lib/recurrence.test.ts

describe('generateRecurringDates', () => {
  it('should generate correct weekly dates', () => {
    const rule = {
      freq: 'WEEKLY',
      interval: 1,
      byweekday: [1, 3, 5], // Mon, Wed, Fri
      count: 6
    };

    const startDate = new Date('2025-12-22T10:00:00Z'); // Monday
    const dates = generateRecurringDates(startDate, rule);

    expect(dates.length).toBe(6);
    expect(dates[0]).toBe('2025-12-22T10:00:00Z'); // Mon
    expect(dates[1]).toBe('2025-12-24T10:00:00Z'); // Wed
    expect(dates[2]).toBe('2025-12-26T10:00:00Z'); // Fri
    expect(dates[3]).toBe('2025-12-29T10:00:00Z'); // Mon
  });

  it('should respect until date', () => {
    const rule = {
      freq: 'DAILY',
      interval: 1,
      until: '2025-12-25T00:00:00Z'
    };

    const startDate = new Date('2025-12-20T10:00:00Z');
    const dates = generateRecurringDates(startDate, rule);

    expect(dates.length).toBe(6); // Dec 20-25
    expect(dates[dates.length - 1]).toBe('2025-12-25T10:00:00Z');
  });

  it('should limit to 52 weeks max', () => {
    const rule = {
      freq: 'WEEKLY',
      interval: 1,
      byweekday: [0],
      count: 100 // Request 100 but should cap at 52
    };

    const startDate = new Date('2025-12-21T10:00:00Z');
    const dates = generateRecurringDates(startDate, rule);

    expect(dates.length).toBe(52);
  });
});
```

**iCal Generation Tests:**

```typescript
// tests/lib/ical.test.ts

describe('generateICalFile', () => {
  it('should generate valid iCal format', () => {
    const event = {
      id: 'evt_123',
      title: 'Test Event',
      description: 'Test description',
      startTime: new Date('2025-12-22T10:00:00Z'),
      endTime: new Date('2025-12-22T12:00:00Z'),
      location: 'Test Location'
    };

    const ical = generateICalFile(event);

    expect(ical).toContain('BEGIN:VCALENDAR');
    expect(ical).toContain('VERSION:2.0');
    expect(ical).toContain('BEGIN:VEVENT');
    expect(ical).toContain('SUMMARY:Test Event');
    expect(ical).toContain('DTSTART:20251222T100000Z');
    expect(ical).toContain('DTEND:20251222T120000Z');
    expect(ical).toContain('LOCATION:Test Location');
    expect(ical).toContain('END:VEVENT');
    expect(ical).toContain('END:VCALENDAR');
  });
});
```

---

### Integration Tests

**Full Event Lifecycle:**

```typescript
describe('Event lifecycle integration', () => {
  it('should complete full event flow', async () => {
    // 1. Admin creates event
    const createResponse = await createEvent({
      title: 'Workshop',
      type: 'WORKSHOP',
      capacity: 2
    });
    const eventId = createResponse.body.event.id;

    // 2. User registers
    await registerForEvent(eventId, user1.id);

    // 3. Check registration status
    const event = await getEvent(eventId);
    expect(event.registrations.registered).toBe(1);

    // 4. Export iCal
    const icalResponse = await request(app)
      .get(`/api/events/${eventId}/ical`);
    expect(icalResponse.status).toBe(200);
    expect(icalResponse.headers['content-type']).toContain('text/calendar');

    // 5. User cancels
    await cancelRegistration(eventId, user1.id);

    // 6. Check updated status
    const updatedEvent = await getEvent(eventId);
    expect(updatedEvent.registrations.registered).toBe(0);
  });
});
```

---

### Manual Testing Checklist

**Calendar Views:**
- [ ] Month view displays events correctly
- [ ] Week view shows time slots and events
- [ ] List view shows chronological list
- [ ] Navigation (prev/next/today) works in all views
- [ ] Events are color-coded by type
- [ ] Current time indicator shows in week view
- [ ] Clicking event opens detail modal
- [ ] Mobile responsive (touch gestures work)

**Event Creation:**
- [ ] Form validation works (required fields, time validation)
- [ ] Committee leaders can create events for their committees
- [ ] Admins can create all event types
- [ ] Physical location and virtual link toggle works
- [ ] Recurring event options display correctly
- [ ] Preview shows correct occurrence dates
- [ ] Events created successfully appear in calendar
- [ ] Committee members auto-registered for committee meetings

**Registration:**
- [ ] User can register for events
- [ ] Capacity limit enforced
- [ ] Waitlist activated when full
- [ ] Waitlist position displayed correctly
- [ ] Confirmation email received with iCal
- [ ] User can cancel registration
- [ ] Waitlisted user promoted on cancellation
- [ ] Cannot register twice for same event
- [ ] Cannot register for past events

**iCal Export:**
- [ ] iCal file downloads correctly
- [ ] Opens in Google Calendar successfully
- [ ] Opens in Apple Calendar successfully
- [ ] Opens in Outlook successfully
- [ ] Event details correct (title, time, location)
- [ ] Timezone handled correctly
- [ ] Email attachments include iCal

**Email Reminders:**
- [ ] 24-hour reminder sent at correct time
- [ ] 1-hour reminder sent at correct time
- [ ] Reminders only sent to REGISTERED users
- [ ] No duplicate reminders sent
- [ ] Virtual link included in reminders
- [ ] Unsubscribe link works
- [ ] Email formatting correct on desktop and mobile

**Recurring Events:**
- [ ] Weekly recurrence generates correct dates
- [ ] Monthly recurrence works
- [ ] "Until date" end condition respected
- [ ] "After N occurrences" end condition respected
- [ ] Limited to 52 weeks max
- [ ] Edit single occurrence works
- [ ] Edit entire series works
- [ ] Delete single occurrence works
- [ ] Delete entire series works
- [ ] Registrations independent per occurrence

**Permissions:**
- [ ] Only authorized users see "Create Event" button
- [ ] Committee leaders restricted to their committees
- [ ] Only creator/admin can edit events
- [ ] Only creator/admin can delete events
- [ ] Regular users cannot access admin endpoints

---

## Deployment Checklist

### Pre-Deployment

**Database:**
- [ ] Prisma schema updated with new fields
- [ ] Migration file generated: `npx prisma migrate dev`
- [ ] Migration tested on staging database
- [ ] Backup production database before migration

**Dependencies:**
- [ ] Install FullCalendar: `npm install @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/list`
- [ ] Install iCal library: `npm install ics`
- [ ] Install email service: `npm install resend` (or chosen provider)
- [ ] Install React Email: `npm install react-email @react-email/components`
- [ ] All dependencies in package.json
- [ ] Lock file updated

**Environment Variables:**
- [ ] `RESEND_API_KEY` (or email service API key)
- [ ] `NEXT_PUBLIC_APP_URL` (for email links)
- [ ] `CRON_SECRET` (for securing cron endpoints)
- [ ] Email sender domain configured (SPF, DKIM records)

**Code:**
- [ ] All API endpoints implemented and tested
- [ ] All UI components completed
- [ ] Email templates created and tested
- [ ] Cron job endpoint secured (API key check)
- [ ] Error handling in place
- [ ] Logging configured
- [ ] TypeScript compilation successful: `npm run build`

**Testing:**
- [ ] All unit tests passing: `npm test`
- [ ] Integration tests passing
- [ ] Manual testing checklist completed
- [ ] Load testing for high registration volume
- [ ] Email delivery tested in production mode

---

### Deployment Steps

**1. Database Migration:**
```bash
# On production
npx prisma migrate deploy
npx prisma generate
```

**2. Deploy Application:**
```bash
# Vercel
vercel --prod

# Or other platform
npm run build
[deploy command]
```

**3. Set Up Cron Jobs:**

**Option A: Vercel Cron (Recommended if using Vercel)**
- Add `vercel.json` with cron configuration
- Redeploy to activate crons

**Option B: GitHub Actions**
```yaml
# .github/workflows/event-reminders.yml
name: Event Reminders
on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger reminder endpoint
        run: |
          curl -X POST https://britepool.org/api/admin/events/send-reminders?reminderType=24h \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
          curl -X POST https://britepool.org/api/admin/events/send-reminders?reminderType=1h \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

**Option C: External Cron Service**
- Sign up for cron-job.org or EasyCron
- Add two jobs:
  - POST https://britepool.org/api/admin/events/send-reminders?reminderType=24h
  - POST https://britepool.org/api/admin/events/send-reminders?reminderType=1h
- Schedule: Every 15 minutes
- Add auth header with CRON_SECRET

**4. Email Service Configuration:**
- Configure sending domain in email provider
- Add SPF record: `v=spf1 include:_spf.resend.com ~all`
- Add DKIM record (provided by email service)
- Verify domain
- Test email delivery from production

**5. Smoke Tests:**
- [ ] Visit /dashboard/events - calendar loads
- [ ] Create test event - appears in calendar
- [ ] Register for event - confirmation email received
- [ ] Download iCal - file valid
- [ ] Trigger reminder cron manually - emails sent
- [ ] Check error logs - no critical errors

---

### Post-Deployment

**Monitoring:**
- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Monitor email delivery rates (Resend dashboard)
- [ ] Monitor cron job execution (logs)
- [ ] Monitor database performance (slow queries)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)

**Alerts:**
- [ ] Alert on failed email sends (>5% failure rate)
- [ ] Alert on cron job failures
- [ ] Alert on API errors (>1% error rate)
- [ ] Alert on database connection issues

**Analytics:**
- [ ] Track event creation count
- [ ] Track registration rates
- [ ] Track email open rates (if supported)
- [ ] Track calendar view usage (month/week/list)
- [ ] Track iCal export usage

**User Communication:**
- [ ] Announce new events calendar feature
- [ ] Create user guide with screenshots
- [ ] Train committee leaders on event creation
- [ ] Provide support email for issues

**Documentation:**
- [ ] Update internal docs with deployment steps
- [ ] Document cron job setup
- [ ] Document email template customization
- [ ] Document troubleshooting common issues

---

## Future Enhancements

### Phase 2 Features (Post-MVP)

**1. Advanced Recurring Patterns:**
- "Every 2nd Tuesday of the month"
- "Last Friday of the month"
- Complex patterns with multiple days

**2. Check-In System:**
- QR code for event check-in
- Mark registrations as ATTENDED
- Attendance reports for organizers

**3. Event Comments/Discussion:**
- Comment thread on event detail page
- Q&A section for registrants
- Post-event feedback

**4. Event Series/Programs:**
- Group related events (e.g., "6-Week Course")
- Register for entire series
- Track completion progress

**5. Waitlist Notifications:**
- SMS notifications when promoted from waitlist
- Configurable notification preferences

**6. Calendar Subscriptions:**
- Generate calendar feed URL (webcal://)
- Subscribe in calendar app for auto-sync
- Personal calendar for user's registered events

**7. Event Templates:**
- Save event as template
- Reuse for similar events
- Committee-specific templates

**8. Advanced Filtering:**
- Filter by date range
- Filter by tags/categories
- Filter by location
- Saved filter presets

**9. Event Recommendations:**
- AI-based recommendations based on interests
- "You might also like..." section
- Email digest of upcoming events

**10. Social Features:**
- See which friends are registered
- Invite friends to events
- Event sharing on social media

**11. Integration Enhancements:**
- Sync with external calendar systems (CalDAV)
- Integration with project management (connect events to tasks)
- Zoom/Google Meet auto-creation

**12. Analytics Dashboard:**
- Event attendance trends
- Popular event types
- Registration conversion rates
- User engagement metrics

---

## Technical Debt & Considerations

**Performance Optimization:**
- Implement pagination for large event lists
- Add database indexes for frequently queried fields
- Cache calendar data with short TTL (5 minutes)
- Optimize recurrence generation for large counts
- Consider background job for creating recurring events (>20 occurrences)

**Security:**
- Rate limiting on registration endpoints (prevent spam)
- CAPTCHA for public event registration (if enabled)
- Validate all user inputs (XSS prevention)
- Sanitize event descriptions (prevent malicious content)
- Secure cron endpoints with API key or IP whitelist

**Scalability:**
- Use job queue for email sending (handle spikes)
- Consider separate service for reminder processing
- Database connection pooling
- Monitor query performance as event count grows
- Archive old events (>1 year past) to separate table

**Accessibility:**
- WCAG 2.1 AA compliance for calendar UI
- Keyboard navigation for all calendar interactions
- Screen reader support (ARIA labels)
- High contrast mode support
- Focus management in modals

**i18n (Internationalization):**
- Support multiple timezones (already planned)
- Translate event types and UI labels
- Locale-aware date formatting
- RTL language support (if needed)

**Backup & Recovery:**
- Regular database backups (automated)
- Event deletion soft delete option (recovery window)
- Email send logs (audit trail)
- Registration history (track changes)

---

## Dependencies & Integration Points

**Dependent Features:**

**F002: User Authentication**
- User authentication required for all event actions
- Role-based permissions (committee leaders, admins)
- User profile data for emails

**F013: Committee Management**
- Event creation integrated with committees
- Committee members auto-registered for committee meetings
- Committee-specific event filtering

**F005: Announcements (Assumed)**
- Event creation may trigger announcement
- Upcoming events widget on dashboard
- Email integration for notifications

**External Dependencies:**

**Email Service Provider:**
- Resend, SendGrid, AWS SES, or Postmark
- Deliverability: SPF, DKIM, DMARC configuration
- Bounce handling and unsubscribe management

**Calendar Library:**
- FullCalendar (MIT license)
- Regular updates required
- Documentation: https://fullcalendar.io/docs

**iCal Library:**
- `ics` package (RFC 5545 compliant)
- Compatibility with major calendar apps

**Background Jobs:**
- Job queue for email reminders (BullMQ, Agenda, etc.)
- Cron service (Vercel Cron, GitHub Actions, external)

**Database:**
- PostgreSQL (required for Prisma)
- Ensure timezone support enabled

---

## Success Criteria

**Functional:**
- [ ] All event types can be created by authorized users
- [ ] Recurring events generate correctly up to 52 weeks
- [ ] Registration system works with capacity enforcement
- [ ] Waitlist promotes automatically on cancellation
- [ ] Email reminders delivered at correct times (24h, 1h)
- [ ] iCal export works with Google, Apple, Outlook calendars
- [ ] All three calendar views (month, week, list) functional
- [ ] Mobile responsive on iOS and Android devices

**Performance:**
- [ ] Calendar page loads in <2 seconds
- [ ] Event creation completes in <3 seconds (single or recurring)
- [ ] Registration action completes in <1 second
- [ ] Email reminders sent within 5-minute window of target time
- [ ] Handles 100+ concurrent users without degradation

**Usability:**
- [ ] Event creation form intuitive (no training needed)
- [ ] Calendar navigation smooth and responsive
- [ ] Registration process: 2 clicks or less
- [ ] Email reminders clear and actionable
- [ ] Mobile experience equivalent to desktop

**Adoption:**
- [ ] 80% of committee meetings tracked in calendar within 1 month
- [ ] 50+ events created within first month
- [ ] Average registration rate: 60%+ for workshops
- [ ] Email open rate: 40%+ for reminders
- [ ] Calendar viewed by 70%+ of active users weekly

---

**Spec Complete**

**Estimated Effort:** 14 days (2 weeks) for 1 full-stack developer

**Next Step:** Run `/create-tasks` to generate implementation task list and begin Phase 1.

---

**Document Version:** 1.0
**Last Updated:** 2025-12-18
**Author:** AI Specification Generator
**Reviewed By:** [Pending]
