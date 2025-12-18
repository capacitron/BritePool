# Specification: Affiliate Partners Gallery

**Feature ID:** F017
**Priority:** Medium
**Effort:** Small (2-3 days)
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
Implement a comprehensive affiliate partners gallery system that showcases BRITE POOL's network of advisory board members, practitioners, sponsors, vendors, and collaborators. The system enables partners to apply for inclusion, admins to review and approve applications, and approved partners to manage their own profiles through a self-service interface.

### Key Requirements
- Public-facing partner gallery with 3-4 column responsive grid layout
- Five partner categories: Advisory Board, Practitioner, Sponsor, Vendor, Collaborator
- Partner application form accessible to authenticated users
- Admin approval workflow with status tracking (PENDING, ACTIVE, INACTIVE)
- Self-service partner profile management after approval
- Category-based filtering for easy navigation
- Partner profiles include logo, name, description, services offered, website, and contact information
- Integration with Media Gallery for logo uploads and management

### Success Metrics
- Public gallery accessible without authentication
- Partners can submit applications and receive approval notifications
- Admins can efficiently review and approve/reject applications
- Approved partners can update their profiles without admin intervention
- Category filtering enables quick discovery of specific partner types
- All partner logos optimized and delivered via CDN (from Media Gallery integration)

---

## User Flows

### Flow 1: Public User Views Partner Gallery

```
1. User visits /partners (public route, no authentication required)
2. User sees partner gallery page with:
   - Hero section: "Our Partners" heading with description
   - Category filter buttons (All, Advisory Board, Practitioner, Sponsor, Vendor, Collaborator)
   - Responsive grid (3-4 columns) of partner cards
3. User clicks category filter (e.g., "Practitioner")
4. Gallery re-renders showing only partners in that category
5. User clicks on a partner card
6. Partner detail modal/page opens showing:
   - Full-size logo
   - Partner name and category badge
   - Full description
   - Services offered (bulleted list)
   - Website link (opens in new tab)
   - Contact email (mailto link)
7. User closes modal and returns to gallery
```

### Flow 2: Authenticated User Submits Partner Application

```
1. User logs in (must have accepted covenant)
2. User navigates to /partners
3. User sees "Become a Partner" button at top of gallery
4. User clicks "Become a Partner" → Redirects to /partners/apply
5. User sees partner application form:
   - Organization Name (required)
   - Category (dropdown: Advisory Board, Practitioner, Sponsor, Vendor, Collaborator)
   - Description (textarea, required, 200-500 words)
   - Services Offered (textarea, bulleted list or comma-separated)
   - Logo Upload (drag-and-drop image upload, integrated with Media Gallery)
   - Website URL (optional)
   - Contact Email (required, pre-filled with user's email)
   - Additional Notes (textarea, optional - why they want to partner)
6. User fills out form and uploads logo
7. User clicks "Submit Application"
8. POST /api/partners/apply
9. System validates:
   - All required fields present
   - Logo uploaded successfully
   - Email format valid
   - Description within character limits
10. Partner record created with status=PENDING and userId linked
11. User sees confirmation message: "Application submitted! We'll review and notify you."
12. User redirected to /partners
13. (Optional) Email notification sent to admins about new application
```

### Flow 3: Admin Reviews and Approves Partner Application

```
1. Admin logs in (role: WEB_STEWARD, BOARD_CHAIR, or CONTENT_MODERATOR)
2. Admin navigates to /dashboard/admin/partners
3. Admin sees partner management dashboard:
   - Tabs: Pending (badge with count), Active, Inactive
   - Table view with filters and search
4. Admin clicks "Pending" tab
5. Admin sees list of pending partner applications:
   - Organization name, category, submitted date, applicant name
   - "Review" action button
6. Admin clicks "Review" on an application
7. Modal opens showing full application details:
   - All submitted information
   - Logo preview
   - Applicant user details
   - Actions: Approve, Reject, Request Changes
8. Admin reviews application and clicks "Approve"
9. Confirmation dialog: "Approve [Partner Name]?"
10. Admin confirms
11. PATCH /api/admin/partners/[id] with status=ACTIVE
12. Partner record updated:
    - status changed to ACTIVE
    - approvedAt timestamp set
    - approvedBy set to admin's userId
13. Partner now appears in public gallery
14. (Optional) Email notification sent to applicant: "Your partner application has been approved!"
15. Admin returned to pending applications list
```

### Flow 4: Admin Rejects Partner Application

```
1. Admin follows steps 1-7 from Flow 3
2. Admin clicks "Reject" button
3. Modal prompts for rejection reason (optional textarea)
4. Admin enters reason: "Does not meet partnership criteria at this time"
5. Admin confirms rejection
6. PATCH /api/admin/partners/[id] with status=INACTIVE and rejectionReason
7. Partner record updated with status=INACTIVE
8. (Optional) Email notification sent to applicant with rejection reason
9. Application moves to "Inactive" tab (for audit trail)
10. Admin returned to pending applications list
```

### Flow 5: Approved Partner Updates Their Profile

```
1. Partner user logs in (their partner application was previously approved)
2. User navigates to /dashboard (or /partners)
3. User sees "Manage My Partnership" link/button
4. User clicks → Redirects to /partners/manage
5. User sees their current partner profile information pre-filled:
   - Organization name, category, description, services, logo, website, email
6. User makes edits:
   - Updates description
   - Uploads new logo
   - Changes services offered
   - Updates website URL
7. User clicks "Save Changes"
8. PATCH /api/partners/my-profile
9. System validates changes
10. Partner record updated (updatedAt timestamp refreshed)
11. User sees success message: "Profile updated successfully!"
12. Changes immediately reflected in public gallery
13. (Optional) Note: Status remains ACTIVE; no re-approval needed for profile edits
```

### Flow 6: Admin Deactivates Partner

```
1. Admin navigates to /dashboard/admin/partners
2. Admin clicks "Active" tab
3. Admin finds partner to deactivate (search or filter)
4. Admin clicks "Deactivate" button
5. Confirmation dialog: "Deactivate [Partner Name]? They will no longer appear in the public gallery."
6. Admin confirms
7. PATCH /api/admin/partners/[id] with status=INACTIVE
8. Partner status changed to INACTIVE
9. Partner removed from public gallery (no longer visible)
10. Partner can reapply or admin can reactivate later
11. (Optional) Email notification sent to partner about deactivation
```

---

## Database Schema

### Existing Model (from Prisma schema)

The Partner model already exists and will be utilized:

```prisma
model Partner {
  id          String   @id @default(cuid())
  name        String
  description String?
  logo        String?
  website     String?
  email       String?
  category    PartnerCategory
  status      PartnerStatus @default(PENDING)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([category])
  @@index([status])
}

enum PartnerCategory {
  ADVISORY_BOARD
  PRACTITIONER
  SPONSOR
  VENDOR
  COLLABORATOR
}

enum PartnerStatus {
  PENDING
  ACTIVE
  INACTIVE
}
```

### Schema Enhancements

Add new fields to Partner model for application workflow:

```prisma
model Partner {
  id          String   @id @default(cuid())
  name        String
  description String?
  services    String?  // NEW: Services offered (bulleted list or JSON)
  logo        String?  // URL from Media Gallery
  website     String?
  email       String?
  category    PartnerCategory
  status      PartnerStatus @default(PENDING)

  // Application workflow fields
  userId      String?  // NEW: User who submitted application
  user        User?    @relation("PartnerApplications", fields: [userId], references: [id])

  approvedById String?  // NEW: Admin who approved
  approvedBy   User?    @relation("PartnersApproved", fields: [approvedById], references: [id])
  approvedAt   DateTime?  // NEW: Approval timestamp

  rejectionReason String?  // NEW: Admin reason for rejection
  applicationNotes String?  // NEW: Additional notes from applicant

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([category])
  @@index([status])
  @@index([userId])
}

enum PartnerCategory {
  ADVISORY_BOARD    // Advisory board members and strategic advisors
  PRACTITIONER      // Health practitioners, healers, therapists
  SPONSOR           // Financial sponsors and benefactors
  VENDOR            // Service vendors and suppliers
  COLLABORATOR      // Partner organizations and collaborators
}

enum PartnerStatus {
  PENDING    // Application submitted, awaiting admin review
  ACTIVE     // Approved and displayed in public gallery
  INACTIVE   // Rejected or deactivated
}
```

### User Model Updates

Add relations to User model:

```prisma
model User {
  // ... existing fields

  partnerApplications Partner[] @relation("PartnerApplications")
  partnersApproved    Partner[] @relation("PartnersApproved")
}
```

### Database Migration

Run Prisma migrations:
```bash
npx prisma db push
```

---

## API Endpoints

### 1. GET /api/partners

**Purpose:** Fetch all active partners for public gallery

**Authentication:** None required (public endpoint)

**Query Parameters:**
- `category` (optional): Filter by PartnerCategory (e.g., "PRACTITIONER")
- `status` (optional, admin-only): Filter by PartnerStatus (defaults to "ACTIVE" for public)

**Response:**
```json
{
  "partners": [
    {
      "id": "clx123...",
      "name": "Green Valley Health Center",
      "description": "Holistic health services integrating traditional and alternative medicine...",
      "services": "Acupuncture, Herbal Medicine, Wellness Counseling",
      "logo": "https://cdn.britepool.org/logos/green-valley.webp",
      "website": "https://greenvalleyhealth.com",
      "email": "info@greenvalleyhealth.com",
      "category": "PRACTITIONER"
    }
  ]
}
```

**Error Cases:**
- Invalid category → 400

---

### 2. POST /api/partners/apply

**Purpose:** Submit a partner application

**Authentication:** Required (any authenticated user with covenant acceptance)

**Request Body:**
```json
{
  "name": "Green Valley Health Center",
  "category": "PRACTITIONER",
  "description": "We are a holistic health center...",
  "services": "Acupuncture, Herbal Medicine, Wellness Counseling",
  "logo": "media_item_clx789...",
  "website": "https://greenvalleyhealth.com",
  "email": "info@greenvalleyhealth.com",
  "applicationNotes": "We're excited to collaborate with BRITE POOL..."
}
```

**Logic:**
1. Verify user is authenticated and has accepted covenant
2. Validate all required fields
3. Verify logo exists in MediaItem table (if provided)
4. Create Partner record with status=PENDING and userId
5. (Optional) Send email notification to admins

**Response:**
```json
{
  "success": true,
  "partnerId": "clx123...",
  "status": "PENDING",
  "message": "Application submitted successfully! We'll review and notify you."
}
```

**Error Cases:**
- User not authenticated → 401
- Missing required fields → 400
- Invalid category → 400
- Logo media item not found → 404

---

### 3. GET /api/partners/my-profile

**Purpose:** Fetch authenticated user's partner profile (if exists)

**Authentication:** Required

**Response:**
```json
{
  "partner": {
    "id": "clx123...",
    "name": "Green Valley Health Center",
    "description": "...",
    "services": "...",
    "logo": "...",
    "website": "...",
    "email": "...",
    "category": "PRACTITIONER",
    "status": "ACTIVE",
    "approvedAt": "2025-12-15T10:00:00Z"
  }
}
```

**Error Cases:**
- User not authenticated → 401
- No partner profile found → 404

---

### 4. PATCH /api/partners/my-profile

**Purpose:** Update authenticated user's own partner profile

**Authentication:** Required (must be the user who created the partner application)

**Request Body:**
```json
{
  "description": "Updated description...",
  "services": "Updated services list...",
  "logo": "new_media_item_clx...",
  "website": "https://newwebsite.com",
  "email": "newemail@example.com"
}
```

**Logic:**
1. Verify user is authenticated
2. Verify user owns this partner record (userId matches)
3. Validate provided fields
4. Update Partner record (updatedAt refreshed)
5. Status remains unchanged (no re-approval needed)

**Response:**
```json
{
  "success": true,
  "partner": {
    "id": "clx123...",
    "name": "Green Valley Health Center",
    "updatedAt": "2025-12-17T14:30:00Z"
  }
}
```

**Error Cases:**
- User not authenticated → 401
- User doesn't own partner profile → 403
- Partner not found → 404
- Invalid data → 400

---

### 5. GET /api/admin/partners (Admin Only)

**Purpose:** Fetch all partners with filtering for admin dashboard

**Authentication:** Required, role: WEB_STEWARD, BOARD_CHAIR, or CONTENT_MODERATOR

**Query Parameters:**
- `status` (optional): Filter by PENDING, ACTIVE, INACTIVE
- `category` (optional): Filter by category
- `search` (optional): Search by name or email

**Response:**
```json
{
  "partners": [
    {
      "id": "clx123...",
      "name": "Green Valley Health Center",
      "category": "PRACTITIONER",
      "status": "PENDING",
      "email": "info@greenvalleyhealth.com",
      "createdAt": "2025-12-15T09:00:00Z",
      "user": {
        "id": "user_456...",
        "name": "Jane Doe",
        "email": "jane@example.com"
      }
    }
  ],
  "counts": {
    "pending": 5,
    "active": 23,
    "inactive": 7
  }
}
```

**Error Cases:**
- User not authorized → 403

---

### 6. PATCH /api/admin/partners/[id] (Admin Only)

**Purpose:** Admin approval, rejection, or status change

**Authentication:** Required, role: WEB_STEWARD, BOARD_CHAIR, or CONTENT_MODERATOR

**Request Body:**
```json
{
  "status": "ACTIVE",
  "rejectionReason": null
}
```

OR

```json
{
  "status": "INACTIVE",
  "rejectionReason": "Does not meet partnership criteria at this time"
}
```

**Logic:**
1. Verify user has admin permissions
2. Verify partner exists
3. Update Partner record:
   - status = provided status
   - approvedById = admin's userId (if approving)
   - approvedAt = now() (if approving)
   - rejectionReason = provided reason (if rejecting)
4. (Optional) Send email notification to partner applicant

**Response:**
```json
{
  "success": true,
  "partner": {
    "id": "clx123...",
    "status": "ACTIVE",
    "approvedAt": "2025-12-17T10:00:00Z",
    "approvedBy": {
      "name": "Admin User"
    }
  }
}
```

**Error Cases:**
- User not authorized → 403
- Partner not found → 404
- Invalid status → 400

---

### 7. DELETE /api/admin/partners/[id] (Admin Only)

**Purpose:** Permanently delete a partner record (use sparingly)

**Authentication:** Required, role: WEB_STEWARD or BOARD_CHAIR

**Response:**
```json
{
  "success": true,
  "message": "Partner deleted permanently"
}
```

**Error Cases:**
- User not authorized → 403
- Partner not found → 404

---

## UI Components

### 1. Public Partner Gallery Page

**Location:** `app/partners/page.tsx`

**Features:**
- Hero section with "Our Partners" heading and description
- Category filter buttons (All, Advisory Board, Practitioner, Sponsor, Vendor, Collaborator)
- Responsive grid layout (3-4 columns on desktop, 2 on tablet, 1 on mobile)
- Partner cards with:
  - Logo image (optimized from Media Gallery)
  - Partner name
  - Category badge
  - Truncated description (3-4 lines)
  - "Learn More" link
- Click to open partner detail modal/page
- "Become a Partner" CTA button (if authenticated)
- SEO optimized (meta tags, structured data)
- Loading states and error handling
- Empty state: "No partners found in this category"

**Component Structure:**

```tsx
export default function PartnersPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartners(selectedCategory);
  }, [selectedCategory]);

  const fetchPartners = async (category?: string) => {
    setLoading(true);
    const query = category ? `?category=${category}` : '';
    const res = await fetch(`/api/partners${query}`);
    const data = await res.json();
    setPartners(data.partners);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-earth-light">
      {/* Hero Section */}
      <section className="bg-stone-warm py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-serif text-earth-brown mb-4">
            Our Partners
          </h1>
          <p className="text-xl text-earth-dark max-w-3xl mx-auto">
            BRITE POOL collaborates with a diverse network of advisors, practitioners,
            sponsors, vendors, and organizations committed to regenerative living
            and community empowerment.
          </p>
          <button className="btn-primary mt-6">Become a Partner</button>
        </div>
      </section>

      {/* Category Filter */}
      <section className="bg-white border-b border-stone py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`btn-filter ${!selectedCategory ? 'active' : ''}`}
          >
            All Partners
          </button>
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`btn-filter ${selectedCategory === cat.value ? 'active' : ''}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Partner Grid */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <PartnerCardSkeleton key={i} />
              ))}
            </div>
          ) : partners.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-earth-brown">
                No partners found in this category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {partners.map(partner => (
                <PartnerCard key={partner.id} partner={partner} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
```

**Accessibility:**
- Semantic HTML (heading hierarchy, sections, articles)
- Keyboard navigation for filters and cards
- Alt text for all partner logos
- ARIA labels for interactive elements
- Focus management for modal/dialog

---

### 2. Partner Card Component

**Location:** `app/components/partners/PartnerCard.tsx`

**Features:**
- Card with hover effects (subtle scale, shadow)
- Partner logo with fallback placeholder
- Partner name (truncated if too long)
- Category badge with color coding
- Description truncated to 3-4 lines
- "Learn More" button/link
- Click anywhere on card to open detail modal

```tsx
interface PartnerCardProps {
  partner: Partner;
}

export function PartnerCard({ partner }: PartnerCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="bg-white rounded-lg border border-stone overflow-hidden
                   hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
      >
        {/* Logo */}
        <div className="aspect-video bg-stone-warm flex items-center justify-center p-6">
          {partner.logo ? (
            <img
              src={partner.logo}
              alt={`${partner.name} logo`}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="w-24 h-24 bg-earth-brown/20 rounded-full" />
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg text-earth-brown line-clamp-2">
              {partner.name}
            </h3>
            <CategoryBadge category={partner.category} />
          </div>

          <p className="text-sm text-earth-dark line-clamp-3 mb-4">
            {partner.description}
          </p>

          <button className="text-earth-brown font-medium hover:underline">
            Learn More →
          </button>
        </div>
      </div>

      {/* Partner Detail Modal */}
      <PartnerDetailModal
        partner={partner}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
```

---

### 3. Partner Application Form

**Location:** `app/partners/apply/page.tsx`

**Features:**
- Multi-step form or single-page form with sections
- Form fields:
  - Organization Name (text input, required)
  - Category (dropdown select, required)
  - Description (rich textarea, 200-500 words, required)
  - Services Offered (textarea or tag input)
  - Logo Upload (drag-and-drop, integrates with Media Gallery)
  - Website URL (text input, optional)
  - Contact Email (text input, required, pre-filled)
  - Application Notes (textarea, optional)
- Real-time validation with error messages
- Character counters for text fields
- Image preview for uploaded logo
- Submit button with loading state
- Success confirmation and redirect

**Component Structure:**

```tsx
export default function PartnerApplicationPage() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    services: '',
    logo: '',
    website: '',
    email: session?.user?.email || '',
    applicationNotes: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/partners/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success('Application submitted successfully!');
        router.push('/partners');
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to submit application');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-earth-light py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-serif text-earth-brown mb-2">
          Become a Partner
        </h1>
        <p className="text-earth-dark mb-8">
          Join our network of collaborators supporting regenerative community building.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Organization Name */}
          <div>
            <label className="block text-sm font-medium text-earth-brown mb-2">
              Organization Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-text"
              required
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-earth-brown mb-2">
              Partner Category <span className="text-red-600">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input-select"
              required
            >
              <option value="">Select a category...</option>
              <option value="ADVISORY_BOARD">Advisory Board</option>
              <option value="PRACTITIONER">Practitioner</option>
              <option value="SPONSOR">Sponsor</option>
              <option value="VENDOR">Vendor</option>
              <option value="COLLABORATOR">Collaborator</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-earth-brown mb-2">
              Description <span className="text-red-600">*</span>
              <span className="text-sm text-earth-dark ml-2">
                ({formData.description.length}/500 characters)
              </span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-textarea"
              rows={6}
              maxLength={500}
              required
            />
          </div>

          {/* Services */}
          <div>
            <label className="block text-sm font-medium text-earth-brown mb-2">
              Services Offered
            </label>
            <textarea
              value={formData.services}
              onChange={(e) => setFormData({ ...formData, services: e.target.value })}
              className="input-textarea"
              rows={4}
              placeholder="List services separated by commas or as bullet points"
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-earth-brown mb-2">
              Logo
            </label>
            <MediaUploader
              onUpload={(mediaItemId) => setFormData({ ...formData, logo: mediaItemId })}
              currentImage={formData.logo}
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-earth-brown mb-2">
              Website URL
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="input-text"
              placeholder="https://example.com"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-earth-brown mb-2">
              Contact Email <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-text"
              required
            />
          </div>

          {/* Application Notes */}
          <div>
            <label className="block text-sm font-medium text-earth-brown mb-2">
              Why do you want to partner with BRITE POOL?
            </label>
            <textarea
              value={formData.applicationNotes}
              onChange={(e) => setFormData({ ...formData, applicationNotes: e.target.value })}
              className="input-textarea"
              rows={4}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

### 4. Admin Partner Management Dashboard

**Location:** `app/dashboard/admin/partners/page.tsx`

**Features:**
- Tabbed interface (Pending, Active, Inactive)
- Badge count on Pending tab
- Table view with columns:
  - Logo (thumbnail)
  - Name
  - Category
  - Status
  - Submitted Date / Approved Date
  - Applicant (for pending)
  - Actions (Review, Edit, Deactivate, Delete)
- Search and filter functionality
- Bulk actions (approve multiple, export to CSV)
- Partner detail/review modal

**Component Structure:**

```tsx
export default function AdminPartnersPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'inactive'>('pending');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [counts, setCounts] = useState({ pending: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartners(activeTab);
  }, [activeTab]);

  const fetchPartners = async (status: string) => {
    setLoading(true);
    const res = await fetch(`/api/admin/partners?status=${status.toUpperCase()}`);
    const data = await res.json();
    setPartners(data.partners);
    setCounts(data.counts);
    setLoading(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-serif text-earth-brown">Partner Management</h1>
        <button className="btn-secondary">Export to CSV</button>
      </div>

      {/* Tabs */}
      <div className="border-b border-stone mb-6">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          >
            Pending
            {counts.pending > 0 && (
              <span className="ml-2 bg-earth-brown text-white px-2 py-1 rounded-full text-xs">
                {counts.pending}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          >
            Active ({counts.active})
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            className={`tab ${activeTab === 'inactive' ? 'active' : ''}`}
          >
            Inactive ({counts.inactive})
          </button>
        </nav>
      </div>

      {/* Partner Table */}
      {loading ? (
        <LoadingSpinner />
      ) : partners.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-earth-brown">
            No {activeTab} partners found.
          </p>
        </div>
      ) : (
        <PartnerTable
          partners={partners}
          status={activeTab}
          onUpdate={() => fetchPartners(activeTab)}
        />
      )}
    </div>
  );
}
```

---

### 5. Partner Profile Management Page

**Location:** `app/partners/manage/page.tsx`

**Features:**
- Pre-filled form with current partner data
- Same fields as application form (except category may be locked)
- Real-time save with optimistic updates
- "View Public Profile" link
- Status indicator (ACTIVE, PENDING, INACTIVE)
- Success/error toast notifications

---

## Implementation Details

### Phase 1: Database & API (Day 1)

1. Update Prisma schema with Partner model enhancements:
   - Add services, userId, approvedById, approvedAt, rejectionReason, applicationNotes fields
   - Add relations to User model
2. Run `npx prisma db push` to sync schema
3. Implement API endpoints:
   - `/api/partners` (GET - public)
   - `/api/partners/apply` (POST - authenticated)
   - `/api/partners/my-profile` (GET/PATCH - authenticated)
   - `/api/admin/partners` (GET - admin)
   - `/api/admin/partners/[id]` (PATCH/DELETE - admin)
4. Add permission checks and validation middleware
5. Test all endpoints with Postman/Thunder Client

### Phase 2: Public Gallery & Application Form (Day 2)

1. Create public partners gallery page (`/partners`)
2. Implement PartnerCard component with responsive grid
3. Add category filtering functionality
4. Create PartnerDetailModal component
5. Build partner application form (`/partners/apply`)
6. Integrate Media Gallery for logo uploads
7. Add form validation and error handling
8. Test user flow: view gallery → apply → submit

### Phase 3: Admin Dashboard & Partner Management (Day 3)

1. Create admin partner management dashboard (`/dashboard/admin/partners`)
2. Implement tabbed interface (Pending, Active, Inactive)
3. Build PartnerTable component with actions
4. Create partner review modal for approvals/rejections
5. Implement partner status update functionality
6. Add search and filter capabilities
7. Create partner profile management page (`/partners/manage`)
8. Test admin workflow: review → approve → partner updates profile
9. Final UI polish and responsive testing
10. Add email notifications (optional enhancement)

---

## Testing Requirements

### Unit Tests

```typescript
// Test partner application API
test('POST /api/partners/apply creates pending partner', async () => {
  const res = await fetch('/api/partners/apply', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${userToken}` },
    body: JSON.stringify({
      name: 'Test Partner',
      category: 'PRACTITIONER',
      description: 'Test description',
      email: 'test@example.com'
    })
  });

  expect(res.status).toBe(201);
  const data = await res.json();
  expect(data.status).toBe('PENDING');

  const partner = await prisma.partner.findUnique({ where: { id: data.partnerId } });
  expect(partner.status).toBe('PENDING');
  expect(partner.userId).toBeTruthy();
});

// Test admin approval
test('PATCH /api/admin/partners/[id] approves partner', async () => {
  const partner = await createTestPartner({ status: 'PENDING' });

  const res = await fetch(`/api/admin/partners/${partner.id}`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'ACTIVE' })
  });

  expect(res.status).toBe(200);

  const updated = await prisma.partner.findUnique({ where: { id: partner.id } });
  expect(updated.status).toBe('ACTIVE');
  expect(updated.approvedAt).not.toBeNull();
  expect(updated.approvedById).toBeTruthy();
});

// Test filtering
test('GET /api/partners filters by category', async () => {
  await createTestPartner({ category: 'PRACTITIONER', status: 'ACTIVE' });
  await createTestPartner({ category: 'SPONSOR', status: 'ACTIVE' });

  const res = await fetch('/api/partners?category=PRACTITIONER');
  const data = await res.json();

  expect(data.partners).toHaveLength(1);
  expect(data.partners[0].category).toBe('PRACTITIONER');
});
```

### Integration Tests

- User applies for partnership → Admin reviews → Approval → Partner updates profile
- Public user views gallery → Filters by category → Views partner detail
- Admin deactivates partner → Partner removed from public gallery
- Partner uploads new logo → Logo appears in gallery immediately

### Manual Testing Checklist

- [ ] Public gallery displays active partners only
- [ ] Category filtering works correctly
- [ ] Partner application form validates all fields
- [ ] Logo upload integrates with Media Gallery
- [ ] Admin can see pending applications count
- [ ] Admin can approve/reject applications
- [ ] Email notifications sent (if implemented)
- [ ] Partner can update own profile after approval
- [ ] Deactivated partners hidden from public gallery
- [ ] Responsive design works on mobile/tablet
- [ ] SEO meta tags present on public gallery
- [ ] Accessibility features work (keyboard nav, screen readers)

---

## Deployment Checklist

### Pre-Deployment

- [ ] Prisma schema updated and synced
- [ ] Database migrations tested in staging
- [ ] All API endpoints implemented and tested
- [ ] Admin permissions verified
- [ ] Media Gallery integration working
- [ ] All tests passing
- [ ] Environment variables configured

### Deployment Steps

1. Run database migrations: `npx prisma db push`
2. Build application: `npm run build`
3. Deploy to hosting platform (Vercel/Netlify)
4. Smoke test in production:
   - Visit `/partners` (public gallery)
   - Submit test application
   - Admin login and approve
   - Verify partner appears in gallery
5. Monitor error logs for first 24 hours

### Post-Deployment

- [ ] Public gallery accessible and performant
- [ ] Partner application submissions working
- [ ] Admin dashboard functional
- [ ] Email notifications working (if implemented)
- [ ] No console errors on frontend
- [ ] API response times under 500ms
- [ ] CDN delivering logos correctly
- [ ] Monitor user feedback and bug reports

---

## Future Enhancements

1. **Featured Partners:** Ability to feature select partners on homepage
2. **Partner Search:** Full-text search across partner names and descriptions
3. **Partner Analytics:** Track partner profile views and engagement
4. **Testimonials:** Partners can add testimonials about BRITE POOL
5. **Partnership Tiers:** Different partnership levels with benefits
6. **Partner Portal:** Dedicated dashboard for partners with additional features
7. **Auto-Renewal:** Annual partnership renewal workflow
8. **Partner Directory Export:** Public downloadable PDF of all partners
9. **Social Media Integration:** Pull partner social media feeds
10. **Multi-Language Support:** Translate partner profiles to Spanish

---

**Spec Complete**

**Next Step:** Run `/create-tasks` to generate implementation task list.
