# Specification: User Authentication & Role-Based Access Control

**Feature ID:** F002
**Priority:** Critical
**Effort:** Large (2 weeks)
**Dependencies:** Membership Contract (F001), Database schema (Prisma), User model
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
Implement a comprehensive authentication and authorization system using NextAuth.js v5 with JWT-based sessions, role-based access control (RBAC), and user account management features including password reset and email verification.

### Key Requirements
- JWT-based authentication with NextAuth.js v5
- 8 distinct user roles with hierarchical permissions
- Protected routes with role-based middleware
- Password reset flow with email verification
- Email verification for new accounts
- Session management with configurable timeouts
- Secure credential storage with bcrypt hashing
- IP address logging for security audit trails
- Multi-factor authentication preparation (future)

### User Roles

The system implements 8 user roles with hierarchical access levels:

1. **WEB_STEWARD** - Full system administration, user management, all permissions
2. **BOARD_CHAIR** - Executive leadership, governance oversight, strategic decisions
3. **COMMITTEE_LEADER** - Committee management, member coordination, event planning
4. **CONTENT_MODERATOR** - Content review, moderation queue, publication control
5. **SUPPORT_STAFF** - Member support, basic content editing, helpdesk access
6. **STEWARD** - Full member access, community participation, voting rights
7. **PARTNER** - Partner organization access, limited permissions, resource sharing
8. **RESIDENT** - Basic member access, community viewing, limited participation

### Role Hierarchy

```
WEB_STEWARD (Level 8)
    ├── BOARD_CHAIR (Level 7)
    │   └── COMMITTEE_LEADER (Level 6)
    │       └── CONTENT_MODERATOR (Level 5)
    │           └── SUPPORT_STAFF (Level 4)
    └── STEWARD (Level 3)
        ├── PARTNER (Level 2)
        └── RESIDENT (Level 1)
```

### Success Metrics
- 100% of authenticated requests validated with valid JWT tokens
- Zero unauthorized access to protected routes
- Password reset completion rate > 80%
- Email verification completion rate > 90%
- Session timeout working correctly (no stale sessions)
- All role-based permissions enforced consistently

---

## User Flows

### Flow 1: New User Registration with Email Verification

```
1. User visits /register
2. User fills out registration form:
   - Email address
   - Password (min 8 chars, complexity requirements)
   - Full name
   - Optional: Phone number
3. User submits form → POST /api/auth/register
4. Backend validates input:
   - Email not already registered
   - Password meets complexity requirements
   - Required fields present
5. Backend creates User record:
   - Hash password with bcrypt (salt rounds: 12)
   - Set emailVerified = null
   - Set role = RESIDENT (default)
   - Generate verification token (JWT, expires 24 hours)
6. Backend sends verification email:
   - Subject: "Verify Your BRITE POOL Account"
   - Link: https://britepool.org/verify-email?token=xxx
7. User redirected to /check-email page with instructions
8. User clicks verification link in email
9. GET /api/auth/verify-email?token=xxx
10. Backend validates token:
    - Token not expired
    - Token signature valid
    - User exists
11. Backend updates User record:
    - Set emailVerified = now()
12. User redirected to /login with success message
13. User logs in → Proceeds to Flow 2
```

### Flow 2: User Login & Session Creation

```
1. User visits /login
2. User enters email and password
3. User submits form → POST /api/auth/signin
4. NextAuth.js Credentials provider validates:
   - User exists
   - Email is verified (emailVerified != null)
   - Password matches hash (bcrypt.compare)
   - Account not locked/suspended
5. Backend creates session:
   - Generate JWT token with payload:
     {
       userId: user.id,
       email: user.email,
       name: user.name,
       role: user.role,
       covenantAcceptedAt: user.covenantAcceptedAt,
       covenantVersion: user.covenantVersion
     }
   - Set session cookie (httpOnly, secure, sameSite)
   - Token expiry: 30 days (configurable)
6. Middleware checks covenant acceptance:
   - If covenantAcceptedAt is null → Redirect to /contract-review
   - If covenantVersion != active version → Redirect to /contract-review
7. User redirected to /dashboard
8. User has full access based on role permissions
```

### Flow 3: Password Reset Flow

```
1. User visits /forgot-password
2. User enters email address
3. User submits form → POST /api/auth/forgot-password
4. Backend validates email:
   - User exists with this email
   - Email is verified
5. Backend generates reset token:
   - Create PasswordResetToken record:
     - token: crypto.randomBytes(32).toString('hex')
     - userId: user.id
     - expiresAt: now() + 1 hour
6. Backend sends reset email:
   - Subject: "Reset Your BRITE POOL Password"
   - Link: https://britepool.org/reset-password?token=xxx
7. User receives email and clicks link
8. GET /reset-password?token=xxx
9. Frontend validates token → GET /api/auth/validate-reset-token?token=xxx
10. If valid, show password reset form
11. User enters new password (twice for confirmation)
12. User submits → POST /api/auth/reset-password
13. Backend validates:
    - Token exists and not expired
    - New password meets requirements
    - Passwords match
14. Backend updates User record:
    - Hash new password with bcrypt
    - Delete PasswordResetToken record
    - Invalidate all existing sessions (force re-login)
15. User redirected to /login with success message
16. User logs in with new password
```

### Flow 4: Role-Based Route Protection

```
1. User navigates to /dashboard/admin/users
2. Middleware extracts JWT from session cookie
3. Middleware decodes token and extracts role
4. Middleware checks route permissions:
   - Route requires: WEB_STEWARD or BOARD_CHAIR
   - User role: COMMITTEE_LEADER (insufficient)
5. Middleware redirects to /unauthorized (403)
6. User sees "Access Denied" page with reason

Alternative path (authorized):
4. Middleware checks route permissions:
   - Route requires: WEB_STEWARD or BOARD_CHAIR
   - User role: BOARD_CHAIR (sufficient)
5. Middleware allows request to proceed
6. User accesses page normally
```

### Flow 5: Session Timeout & Refresh

```
1. User logs in and receives JWT token (expires in 30 days)
2. User remains active on site for 8 hours
3. After 30 minutes of inactivity:
   - Frontend idle detection triggers
   - Warning modal appears: "Your session will expire in 2 minutes"
   - User clicks "Stay Logged In"
   - Frontend → POST /api/auth/refresh-session
   - Backend issues new JWT token (extends 30 days from now)
   - User continues working

Alternative path (timeout):
3. User ignores warning modal
4. After 2 minutes, session expires:
   - Frontend clears local session
   - Redirect to /login with message: "Session expired. Please log in again."
5. User logs in again
```

### Flow 6: Admin User Role Management

```
1. WEB_STEWARD logs in and navigates to /dashboard/admin/users
2. User management dashboard loads:
   - Table showing all users (paginated)
   - Filters: Role, Status, Covenant Acceptance
   - Search: By name, email
3. Admin clicks "Edit" on a user row
4. Edit user modal opens with fields:
   - Name (editable)
   - Email (read-only)
   - Role (dropdown with all roles)
   - Status (Active, Suspended, Locked)
   - Email Verified (checkbox)
5. Admin changes role from RESIDENT to STEWARD
6. Admin clicks "Save Changes"
7. POST /api/admin/users/[userId]
8. Backend validates:
   - Current user has WEB_STEWARD or BOARD_CHAIR role
   - Target user exists
   - Role is valid enum value
9. Backend updates User record:
   - Set role = STEWARD
   - Log change in AuditLog table
10. Frontend refreshes user list
11. User receives email: "Your BRITE POOL role has been updated to Steward"
```

---

## Database Schema

### Updated User Model

```prisma
model User {
  id                    String    @id @default(cuid())
  email                 String    @unique
  emailVerified         DateTime?
  name                  String
  phone                 String?
  password              String    // bcrypt hash
  role                  UserRole  @default(RESIDENT)
  status                UserStatus @default(ACTIVE)

  // Covenant/Contract fields
  covenantAcceptedAt    DateTime?
  covenantVersion       String?
  covenantIpAddress     String?

  // Security fields
  lastLoginAt           DateTime?
  lastLoginIp           String?
  loginAttempts         Int       @default(0)
  lockedUntil           DateTime?

  // Timestamps
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  // Relations
  passwordResets        PasswordResetToken[]
  emailVerifications    EmailVerificationToken[]
  sessions              Session[]
  auditLogs             AuditLog[]

  @@index([email])
  @@index([role])
  @@index([status])
}

enum UserRole {
  WEB_STEWARD
  BOARD_CHAIR
  COMMITTEE_LEADER
  CONTENT_MODERATOR
  SUPPORT_STAFF
  STEWARD
  PARTNER
  RESIDENT
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  LOCKED
  PENDING_VERIFICATION
}
```

### Session Model (NextAuth.js v5)

```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())

  @@index([userId])
  @@index([sessionToken])
}
```

### PasswordResetToken Model

```prisma
model PasswordResetToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())

  @@index([token])
  @@index([userId])
}
```

### EmailVerificationToken Model

```prisma
model EmailVerificationToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  verifiedAt DateTime?
  createdAt DateTime @default(now())

  @@index([token])
  @@index([userId])
}
```

### AuditLog Model

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  action    String   // LOGIN, LOGOUT, PASSWORD_RESET, ROLE_CHANGE, etc.
  details   Json?    // Additional metadata
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([action])
  @@index([createdAt])
}
```

---

## API Endpoints

### 1. POST /api/auth/register

**Purpose:** Register a new user account

**Authentication:** None required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "+1-555-0123"
}
```

**Validation Rules:**
- Email: Valid email format, not already registered
- Password: Min 8 characters, must contain: uppercase, lowercase, number, special char
- Name: Required, min 2 characters, max 100 characters
- Phone: Optional, E.164 format

**Logic:**
1. Validate input data
2. Check if email already exists
3. Hash password with bcrypt (salt rounds: 12)
4. Create User record with status: PENDING_VERIFICATION
5. Generate email verification token (JWT, expires 24h)
6. Create EmailVerificationToken record
7. Send verification email via email service
8. Log audit event: USER_REGISTERED

**Response (Success):**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "userId": "clx123..."
}
```

**Error Cases:**
- Email already registered → 409 Conflict
- Password too weak → 400 Bad Request
- Invalid email format → 400 Bad Request
- Missing required fields → 400 Bad Request

---

### 2. GET /api/auth/verify-email

**Purpose:** Verify user's email address

**Authentication:** None required (token-based)

**Query Parameters:**
- `token`: Email verification token (required)

**Logic:**
1. Decode and validate JWT token
2. Find EmailVerificationToken record
3. Check token not expired (< 24 hours old)
4. Check token not already used
5. Update User record: emailVerified = now(), status = ACTIVE
6. Mark token as used: verifiedAt = now()
7. Log audit event: EMAIL_VERIFIED

**Response (Success):**
```json
{
  "success": true,
  "message": "Email verified successfully. You can now log in."
}
```

**Error Cases:**
- Invalid token → 400 Bad Request
- Expired token → 410 Gone
- Token already used → 400 Bad Request
- User not found → 404 Not Found

---

### 3. POST /api/auth/signin (NextAuth.js)

**Purpose:** Authenticate user and create session

**Authentication:** None required (this IS the auth endpoint)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Logic (Credentials Provider):**
1. Find user by email
2. Check user exists and status = ACTIVE
3. Check emailVerified is not null
4. Check account not locked (lockedUntil = null or past)
5. Verify password with bcrypt.compare()
6. If password incorrect:
   - Increment loginAttempts
   - If loginAttempts >= 5: Set lockedUntil = now() + 15 minutes
   - Return error
7. If password correct:
   - Reset loginAttempts = 0
   - Update lastLoginAt = now()
   - Update lastLoginIp = request IP
   - Create session with JWT
   - Log audit event: USER_LOGIN
   - Return user object

**Response (Success):**
```json
{
  "user": {
    "id": "clx123...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "STEWARD",
    "image": null
  },
  "expires": "2026-01-17T12:00:00Z"
}
```

**Error Cases:**
- Invalid credentials → 401 Unauthorized
- Email not verified → 403 Forbidden ("Please verify your email")
- Account locked → 403 Forbidden ("Account locked. Try again in X minutes")
- Account suspended → 403 Forbidden ("Account suspended. Contact support")

---

### 4. POST /api/auth/signout (NextAuth.js)

**Purpose:** Destroy user session and log out

**Authentication:** Required

**Logic:**
1. Get current session
2. Delete Session record from database
3. Clear session cookie
4. Log audit event: USER_LOGOUT

**Response:**
```json
{
  "success": true
}
```

---

### 5. POST /api/auth/forgot-password

**Purpose:** Initiate password reset flow

**Authentication:** None required

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Logic:**
1. Find user by email
2. Check user exists and emailVerified is not null
3. Generate secure random token (32 bytes hex)
4. Create PasswordResetToken record (expires in 1 hour)
5. Send password reset email
6. Log audit event: PASSWORD_RESET_REQUESTED
7. ALWAYS return success (prevent email enumeration)

**Response:**
```json
{
  "success": true,
  "message": "If an account exists with that email, a password reset link has been sent."
}
```

**Security Note:** Always return success even if email doesn't exist to prevent account enumeration attacks.

---

### 6. GET /api/auth/validate-reset-token

**Purpose:** Validate password reset token before showing form

**Authentication:** None required

**Query Parameters:**
- `token`: Password reset token (required)

**Logic:**
1. Find PasswordResetToken by token
2. Check token exists
3. Check not expired (< 1 hour old)
4. Check not already used (usedAt = null)

**Response (Valid):**
```json
{
  "valid": true,
  "email": "use***@example.com"  // Partially masked
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "reason": "Token expired"
}
```

---

### 7. POST /api/auth/reset-password

**Purpose:** Complete password reset with new password

**Authentication:** None required (token-based)

**Request Body:**
```json
{
  "token": "abc123...",
  "password": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

**Validation Rules:**
- Token: Must be valid and not expired
- Password: Same complexity requirements as registration
- Passwords must match

**Logic:**
1. Validate reset token (same as validate-reset-token)
2. Validate new password meets requirements
3. Hash new password with bcrypt
4. Update User record: password = new hash
5. Mark token as used: usedAt = now()
6. Delete all existing sessions for user (force re-login)
7. Send confirmation email
8. Log audit event: PASSWORD_RESET_COMPLETED

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully. Please log in with your new password."
}
```

**Error Cases:**
- Invalid token → 400 Bad Request
- Passwords don't match → 400 Bad Request
- Password too weak → 400 Bad Request
- Token expired → 410 Gone

---

### 8. POST /api/auth/resend-verification

**Purpose:** Resend email verification link

**Authentication:** None required

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Logic:**
1. Find user by email
2. Check user exists and emailVerified = null
3. Invalidate old verification tokens
4. Generate new verification token
5. Send new verification email
6. ALWAYS return success (prevent enumeration)

**Response:**
```json
{
  "success": true,
  "message": "If your account needs verification, a new email has been sent."
}
```

---

### 9. GET /api/auth/session (NextAuth.js)

**Purpose:** Get current session and user data

**Authentication:** Required

**Response:**
```json
{
  "user": {
    "id": "clx123...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "STEWARD",
    "emailVerified": "2025-12-17T10:00:00Z"
  },
  "expires": "2026-01-17T12:00:00Z"
}
```

---

### 10. POST /api/admin/users/[userId] (Admin Only)

**Purpose:** Update user details (role, status, etc.)

**Authentication:** Required - WEB_STEWARD or BOARD_CHAIR only

**Request Body:**
```json
{
  "role": "STEWARD",
  "status": "ACTIVE",
  "name": "John Doe Updated"
}
```

**Authorization Logic:**
1. Check current user role is WEB_STEWARD or BOARD_CHAIR
2. Validate target user exists
3. Prevent role escalation (cannot grant higher role than own)
4. WEB_STEWARD only role that can create other WEB_STEWARDs

**Logic:**
1. Validate authorization
2. Validate input fields
3. Update User record
4. Log audit event: USER_UPDATED with details
5. Send notification email to target user
6. If role changed: Invalidate sessions (force re-login for new permissions)

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "clx123...",
    "email": "user@example.com",
    "name": "John Doe Updated",
    "role": "STEWARD",
    "status": "ACTIVE"
  }
}
```

**Error Cases:**
- Insufficient permissions → 403 Forbidden
- User not found → 404 Not Found
- Invalid role → 400 Bad Request
- Role escalation attempt → 403 Forbidden

---

### 11. GET /api/admin/users

**Purpose:** List all users with filtering and pagination

**Authentication:** Required - WEB_STEWARD, BOARD_CHAIR, or COMMITTEE_LEADER

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `role`: Filter by role
- `status`: Filter by status
- `search`: Search by name or email
- `sortBy`: Field to sort by (default: createdAt)
- `sortOrder`: asc or desc (default: desc)

**Response:**
```json
{
  "users": [
    {
      "id": "clx123...",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "STEWARD",
      "status": "ACTIVE",
      "emailVerified": "2025-12-17T10:00:00Z",
      "lastLoginAt": "2025-12-17T14:30:00Z",
      "createdAt": "2025-12-15T08:00:00Z"
    }
  ],
  "pagination": {
    "total": 247,
    "page": 1,
    "limit": 20,
    "totalPages": 13
  }
}
```

---

### 12. GET /api/admin/audit-logs

**Purpose:** View security audit logs

**Authentication:** Required - WEB_STEWARD only

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `userId`: Filter by user
- `action`: Filter by action type
- `startDate`: Filter from date
- `endDate`: Filter to date

**Response:**
```json
{
  "logs": [
    {
      "id": "clx456...",
      "userId": "clx123...",
      "userName": "John Doe",
      "action": "USER_LOGIN",
      "details": { "method": "credentials" },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2025-12-17T14:30:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

---

## UI Components

### 1. Registration Page

**Location:** `app/(auth)/register/page.tsx`

**Features:**
- Email, password, name, phone fields
- Real-time password strength indicator
- Password visibility toggle
- Client-side validation with error messages
- Terms and privacy policy checkboxes
- Link to login page
- Biophilic design with earth tones

**Component Structure:**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    // Password validation
    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain an uppercase letter';
    }
    if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Password must contain a lowercase letter';
    }
    if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain a number';
    }
    if (!/[!@#$%^&*]/.test(formData.password)) {
      newErrors.password = 'Password must contain a special character';
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Name validation
    if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/check-email');
      } else {
        setErrors({ submit: data.message || 'Registration failed' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-earth-light flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-earth p-8">
        <h1 className="text-3xl font-serif text-earth-brown mb-2">
          Join BRITE POOL
        </h1>
        <p className="text-earth-dark mb-6">
          Create your account to become part of our community
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-earth-dark mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-stone rounded-md focus:ring-2 focus:ring-earth-brown focus:border-transparent"
              required
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-earth-dark mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-stone rounded-md focus:ring-2 focus:ring-earth-brown focus:border-transparent"
              required
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-earth-dark mb-1">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-stone rounded-md focus:ring-2 focus:ring-earth-brown focus:border-transparent"
              placeholder="+1-555-0123"
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-earth-dark mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-stone rounded-md focus:ring-2 focus:ring-earth-brown focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-earth-dark hover:text-earth-brown"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <PasswordStrengthMeter password={formData.password} />
            {errors.password && (
              <p className="text-red-600 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-earth-dark mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-2 border border-stone rounded-md focus:ring-2 focus:ring-earth-brown focus:border-transparent"
              required
            />
            {errors.confirmPassword && (
              <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.submit}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-earth-brown text-white py-3 rounded-md font-medium hover:bg-earth-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-earth-dark mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-earth-brown hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
```

**Accessibility:**
- ARIA labels on all form fields
- Error messages linked to inputs with aria-describedby
- Keyboard navigation
- Focus management
- Screen reader announcements for errors

---

### 2. Login Page

**Location:** `app/(auth)/login/page.tsx`

**Features:**
- Email and password fields
- Remember me checkbox (extends session)
- Forgot password link
- Sign in with credentials
- Error message display
- Link to registration page

**Component Structure:**

```tsx
'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-earth-light flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-earth p-8">
        <h1 className="text-3xl font-serif text-earth-brown mb-2">
          Welcome Back
        </h1>
        <p className="text-earth-dark mb-6">
          Sign in to your BRITE POOL account
        </p>

        {searchParams.get('verified') === 'true' && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            Email verified successfully! You can now log in.
          </div>
        )}

        {searchParams.get('reset') === 'true' && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            Password reset successfully! Please log in with your new password.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-earth-dark mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-stone rounded-md focus:ring-2 focus:ring-earth-brown focus:border-transparent"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-earth-dark mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-stone rounded-md focus:ring-2 focus:ring-earth-brown focus:border-transparent"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <Link
              href="/forgot-password"
              className="text-sm text-earth-brown hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-earth-brown text-white py-3 rounded-md font-medium hover:bg-earth-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-earth-dark mt-6">
          Don't have an account?{' '}
          <Link href="/register" className="text-earth-brown hover:underline font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
```

---

### 3. Forgot Password Page

**Location:** `app/(auth)/forgot-password/page.tsx`

**Features:**
- Email input field
- Submit button
- Success message
- Link back to login

---

### 4. Reset Password Page

**Location:** `app/(auth)/reset-password/page.tsx`

**Features:**
- Token validation on load
- New password input
- Confirm password input
- Password strength meter
- Submit button
- Error handling for invalid/expired tokens

---

### 5. Email Verification Page

**Location:** `app/(auth)/check-email/page.tsx`

**Features:**
- Informational message to check email
- Resend verification email button
- Countdown timer for resend (60 seconds)
- Link back to login

---

### 6. Middleware: Authentication & Authorization Guard

**Location:** `middleware.ts`

**Purpose:** Protect routes based on authentication status and user roles

**Implementation:**

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Route access rules
const routePermissions = {
  '/dashboard/admin': ['WEB_STEWARD', 'BOARD_CHAIR'],
  '/dashboard/committees': ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER'],
  '/dashboard/content': ['WEB_STEWARD', 'BOARD_CHAIR', 'CONTENT_MODERATOR'],
  '/dashboard/support': ['WEB_STEWARD', 'BOARD_CHAIR', 'SUPPORT_STAFF'],
  '/dashboard': ['WEB_STEWARD', 'BOARD_CHAIR', 'COMMITTEE_LEADER', 'CONTENT_MODERATOR', 'SUPPORT_STAFF', 'STEWARD', 'PARTNER', 'RESIDENT']
};

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/check-email',
  '/unauthorized'
];

// Routes that require authentication but not covenant acceptance
const authOnlyRoutes = ['/contract-review'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  // Allow public routes
  if (publicRoutes.some(route => path.startsWith(route))) {
    return NextResponse.next();
  }

  // Require authentication for all other routes
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(loginUrl);
  }

  // Skip covenant check for auth-only routes
  if (authOnlyRoutes.some(route => path.startsWith(route))) {
    return NextResponse.next();
  }

  // Check covenant acceptance for protected routes
  if (!token.covenantAcceptedAt) {
    return NextResponse.redirect(new URL('/contract-review', request.url));
  }

  // Check covenant version matches active version
  const activeVersion = '1.0.0'; // TODO: Fetch from database
  if (token.covenantVersion !== activeVersion) {
    return NextResponse.redirect(new URL('/contract-review', request.url));
  }

  // Check role-based permissions
  for (const [route, allowedRoles] of Object.entries(routePermissions)) {
    if (path.startsWith(route)) {
      if (!allowedRoles.includes(token.role)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

### 7. User Management Dashboard (Admin)

**Location:** `app/dashboard/admin/users/page.tsx`

**Features:**
- User list table with pagination
- Filters: Role, Status, Email Verification
- Search: By name or email
- Actions: Edit, Suspend, Delete (soft delete)
- Bulk actions: Send email, Change role
- Export to CSV
- Real-time updates

**Required Roles:** WEB_STEWARD, BOARD_CHAIR

---

### 8. Role Permission Helper

**Location:** `lib/auth/permissions.ts`

**Purpose:** Centralized permission checking logic

```typescript
export type UserRole =
  | 'WEB_STEWARD'
  | 'BOARD_CHAIR'
  | 'COMMITTEE_LEADER'
  | 'CONTENT_MODERATOR'
  | 'SUPPORT_STAFF'
  | 'STEWARD'
  | 'PARTNER'
  | 'RESIDENT';

export const roleHierarchy: Record<UserRole, number> = {
  WEB_STEWARD: 8,
  BOARD_CHAIR: 7,
  COMMITTEE_LEADER: 6,
  CONTENT_MODERATOR: 5,
  SUPPORT_STAFF: 4,
  STEWARD: 3,
  PARTNER: 2,
  RESIDENT: 1
};

export function hasPermission(
  userRole: UserRole,
  requiredRoles: UserRole[]
): boolean {
  return requiredRoles.includes(userRole);
}

export function hasMinimumRole(
  userRole: UserRole,
  minimumRole: UserRole
): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[minimumRole];
}

export function canManageUser(
  adminRole: UserRole,
  targetUserRole: UserRole
): boolean {
  // Can only manage users with lower role level
  return roleHierarchy[adminRole] > roleHierarchy[targetUserRole];
}

export function canGrantRole(
  adminRole: UserRole,
  roleToGrant: UserRole
): boolean {
  // WEB_STEWARD can grant any role
  if (adminRole === 'WEB_STEWARD') return true;

  // Others can only grant roles lower than their own
  return roleHierarchy[adminRole] > roleHierarchy[roleToGrant];
}
```

---

### 9. Protected API Route Helper

**Location:** `lib/auth/apiAuth.ts`

**Purpose:** Protect API routes with authentication and role checks

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextRequest, NextResponse } from 'next/server';
import { hasPermission } from './permissions';
import type { UserRole } from './permissions';

export async function requireAuth(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return session;
}

export async function requireRole(
  req: NextRequest,
  allowedRoles: UserRole[]
) {
  const session = await requireAuth(req);

  if (session instanceof NextResponse) {
    return session; // Return error response
  }

  if (!hasPermission(session.user.role, allowedRoles)) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient permissions' },
      { status: 403 }
    );
  }

  return session;
}
```

---

## Implementation Details

### Phase 1: Database Setup & Schema (Days 1-2)

**Tasks:**
1. Update Prisma schema with all models:
   - User model with all auth fields
   - Session model (NextAuth.js v5)
   - PasswordResetToken model
   - EmailVerificationToken model
   - AuditLog model
   - UserRole and UserStatus enums
2. Run database migrations:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
3. Create seed script for initial admin user:
   ```typescript
   // prisma/seed.ts
   import { PrismaClient } from '@prisma/client';
   import bcrypt from 'bcryptjs';

   const prisma = new PrismaClient();

   async function main() {
     const hashedPassword = await bcrypt.hash('AdminPass123!', 12);

     await prisma.user.upsert({
       where: { email: 'admin@britepool.org' },
       update: {},
       create: {
         email: 'admin@britepool.org',
         name: 'System Administrator',
         password: hashedPassword,
         role: 'WEB_STEWARD',
         status: 'ACTIVE',
         emailVerified: new Date()
       }
     });
   }

   main()
     .catch(console.error)
     .finally(() => prisma.$disconnect());
   ```
4. Run seed script:
   ```bash
   npx prisma db seed
   ```

**Deliverables:**
- Updated schema.prisma file
- Database migrated with all tables
- Seed script tested and working
- Initial admin account created

---

### Phase 2: NextAuth.js v5 Configuration (Days 3-4)

**Tasks:**
1. Install dependencies:
   ```bash
   npm install next-auth@beta bcryptjs
   npm install -D @types/bcryptjs
   ```
2. Create NextAuth.js configuration file:
   **Location:** `app/api/auth/[...nextauth]/route.ts`

   ```typescript
   import NextAuth, { NextAuthOptions } from 'next-auth';
   import CredentialsProvider from 'next-auth/providers/credentials';
   import { PrismaAdapter } from '@auth/prisma-adapter';
   import { prisma } from '@/lib/prisma';
   import bcrypt from 'bcryptjs';

   export const authOptions: NextAuthOptions = {
     adapter: PrismaAdapter(prisma),
     providers: [
       CredentialsProvider({
         name: 'credentials',
         credentials: {
           email: { label: 'Email', type: 'email' },
           password: { label: 'Password', type: 'password' }
         },
         async authorize(credentials) {
           if (!credentials?.email || !credentials?.password) {
             throw new Error('Invalid credentials');
           }

           const user = await prisma.user.findUnique({
             where: { email: credentials.email }
           });

           if (!user || !user.password) {
             throw new Error('Invalid credentials');
           }

           if (user.status !== 'ACTIVE') {
             throw new Error('Account suspended. Contact support.');
           }

           if (!user.emailVerified) {
             throw new Error('Please verify your email before logging in');
           }

           if (user.lockedUntil && user.lockedUntil > new Date()) {
             const minutesLeft = Math.ceil(
               (user.lockedUntil.getTime() - Date.now()) / 60000
             );
             throw new Error(
               `Account locked. Try again in ${minutesLeft} minutes.`
             );
           }

           const isPasswordValid = await bcrypt.compare(
             credentials.password,
             user.password
           );

           if (!isPasswordValid) {
             // Increment login attempts
             const attempts = user.loginAttempts + 1;
             const lockedUntil = attempts >= 5
               ? new Date(Date.now() + 15 * 60 * 1000)
               : null;

             await prisma.user.update({
               where: { id: user.id },
               data: {
                 loginAttempts: attempts,
                 lockedUntil
               }
             });

             if (attempts >= 5) {
               throw new Error('Too many failed attempts. Account locked for 15 minutes.');
             }

             throw new Error('Invalid credentials');
           }

           // Reset login attempts on successful login
           await prisma.user.update({
             where: { id: user.id },
             data: {
               loginAttempts: 0,
               lockedUntil: null,
               lastLoginAt: new Date(),
               lastLoginIp: '' // TODO: Get IP from request
             }
           });

           // Log successful login
           await prisma.auditLog.create({
             data: {
               userId: user.id,
               action: 'USER_LOGIN',
               ipAddress: '', // TODO: Get IP
               userAgent: '' // TODO: Get user agent
             }
           });

           return {
             id: user.id,
             email: user.email,
             name: user.name,
             role: user.role,
             emailVerified: user.emailVerified,
             covenantAcceptedAt: user.covenantAcceptedAt,
             covenantVersion: user.covenantVersion
           };
         }
       })
     ],
     callbacks: {
       async jwt({ token, user }) {
         if (user) {
           token.id = user.id;
           token.role = user.role;
           token.covenantAcceptedAt = user.covenantAcceptedAt;
           token.covenantVersion = user.covenantVersion;
         }
         return token;
       },
       async session({ session, token }) {
         if (session.user) {
           session.user.id = token.id;
           session.user.role = token.role;
           session.user.covenantAcceptedAt = token.covenantAcceptedAt;
           session.user.covenantVersion = token.covenantVersion;
         }
         return session;
       }
     },
     pages: {
       signIn: '/login',
       error: '/login',
       verifyRequest: '/check-email'
     },
     session: {
       strategy: 'jwt',
       maxAge: 30 * 24 * 60 * 60 // 30 days
     },
     secret: process.env.NEXTAUTH_SECRET
   };

   const handler = NextAuth(authOptions);
   export { handler as GET, handler as POST };
   ```

3. Update environment variables:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=<generate-random-secret>
   ```
4. Create TypeScript types for NextAuth:
   **Location:** `types/next-auth.d.ts`

   ```typescript
   import { UserRole } from '@prisma/client';
   import 'next-auth';

   declare module 'next-auth' {
     interface User {
       role: UserRole;
       covenantAcceptedAt: Date | null;
       covenantVersion: string | null;
     }

     interface Session {
       user: User & {
         id: string;
       };
     }
   }

   declare module 'next-auth/jwt' {
     interface JWT {
       id: string;
       role: UserRole;
       covenantAcceptedAt: Date | null;
       covenantVersion: string | null;
     }
   }
   ```

**Deliverables:**
- NextAuth.js configured with Credentials provider
- JWT strategy implemented
- Session callbacks working
- Type definitions complete

---

### Phase 3: Registration & Email Verification (Days 5-6)

**Tasks:**
1. Create registration API endpoint:
   **Location:** `app/api/auth/register/route.ts`

2. Create email verification endpoint:
   **Location:** `app/api/auth/verify-email/route.ts`

3. Set up email service (using Resend or Nodemailer):
   **Location:** `lib/email/emailService.ts`

   ```typescript
   import nodemailer from 'nodemailer';

   const transporter = nodemailer.createTransport({
     host: process.env.SMTP_HOST,
     port: parseInt(process.env.SMTP_PORT || '587'),
     secure: false,
     auth: {
       user: process.env.SMTP_USER,
       pass: process.env.SMTP_PASSWORD
     }
   });

   export async function sendVerificationEmail(
     email: string,
     name: string,
     token: string
   ) {
     const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

     await transporter.sendMail({
       from: '"BRITE POOL" <noreply@britepool.org>',
       to: email,
       subject: 'Verify Your BRITE POOL Account',
       html: `
         <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
           <h1 style="color: #6B5344;">Welcome to BRITE POOL, ${name}!</h1>
           <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
           <a href="${verificationUrl}" style="display: inline-block; background: #6B5344; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
             Verify Email Address
           </a>
           <p>Or copy and paste this link into your browser:</p>
           <p style="color: #666; font-size: 14px;">${verificationUrl}</p>
           <p style="color: #999; font-size: 12px; margin-top: 32px;">
             This link will expire in 24 hours. If you didn't create an account, please ignore this email.
           </p>
         </div>
       `
     });
   }

   export async function sendPasswordResetEmail(
     email: string,
     name: string,
     token: string
   ) {
     const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

     await transporter.sendMail({
       from: '"BRITE POOL" <noreply@britepool.org>',
       to: email,
       subject: 'Reset Your BRITE POOL Password',
       html: `
         <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
           <h1 style="color: #6B5344;">Password Reset Request</h1>
           <p>Hello ${name},</p>
           <p>We received a request to reset your password. Click the link below to create a new password:</p>
           <a href="${resetUrl}" style="display: inline-block; background: #6B5344; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
             Reset Password
           </a>
           <p>Or copy and paste this link into your browser:</p>
           <p style="color: #666; font-size: 14px;">${resetUrl}</p>
           <p style="color: #999; font-size: 12px; margin-top: 32px;">
             This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
           </p>
         </div>
       `
     });
   }
   ```

4. Build registration page UI
5. Build email verification page UI
6. Build check-email page UI

**Environment Variables:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Deliverables:**
- Registration flow complete
- Email verification working
- Email service configured
- All UI pages built

---

### Phase 4: Password Reset Flow (Days 7-8)

**Tasks:**
1. Create forgot-password API endpoint:
   **Location:** `app/api/auth/forgot-password/route.ts`

2. Create validate-reset-token endpoint:
   **Location:** `app/api/auth/validate-reset-token/route.ts`

3. Create reset-password endpoint:
   **Location:** `app/api/auth/reset-password/route.ts`

4. Build forgot-password page UI
5. Build reset-password page UI
6. Test complete password reset flow

**Deliverables:**
- Password reset flow complete
- Email notifications working
- All edge cases handled (expired tokens, etc.)

---

### Phase 5: Middleware & Route Protection (Days 9-10)

**Tasks:**
1. Implement Next.js middleware (middleware.ts)
2. Add route permission rules
3. Implement permission helper functions (lib/auth/permissions.ts)
4. Implement API auth helpers (lib/auth/apiAuth.ts)
5. Create Unauthorized page (app/unauthorized/page.tsx)
6. Test all protected routes
7. Test role-based access control

**Deliverables:**
- Middleware protecting all routes
- Role-based permissions enforced
- Helper functions tested
- Unauthorized page styled

---

### Phase 6: Admin User Management (Days 11-12)

**Tasks:**
1. Create admin users list API:
   **Location:** `app/api/admin/users/route.ts`

2. Create update user API:
   **Location:** `app/api/admin/users/[userId]/route.ts`

3. Create audit logs API:
   **Location:** `app/api/admin/audit-logs/route.ts`

4. Build user management dashboard UI
5. Build user edit modal/form
6. Add pagination, filtering, search
7. Add bulk actions
8. Test admin workflows

**Deliverables:**
- Admin dashboard complete
- User management working
- Audit logs viewable
- All CRUD operations tested

---

### Phase 7: Testing & Polish (Days 13-14)

**Tasks:**
1. Write unit tests for API endpoints
2. Write integration tests for auth flows
3. Manual testing of all user flows
4. Security audit:
   - SQL injection prevention (Prisma handles this)
   - XSS prevention
   - CSRF protection (NextAuth.js handles this)
   - Rate limiting (consider adding)
5. Performance testing:
   - Session lookup speed
   - Database query optimization
6. Documentation:
   - API documentation
   - Role permission matrix
   - Admin user guide
7. Final bug fixes and polish

**Deliverables:**
- All tests passing
- Security audit complete
- Performance optimized
- Documentation written

---

## Testing Requirements

### Unit Tests

**Location:** `__tests__/api/auth/`

```typescript
// Example: Registration endpoint test
import { POST } from '@/app/api/auth/register/route';
import { prisma } from '@/lib/prisma';

describe('POST /api/auth/register', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  test('creates new user with valid data', async () => {
    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.userId).toBeDefined();

    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });

    expect(user).toBeDefined();
    expect(user?.name).toBe('Test User');
    expect(user?.emailVerified).toBeNull();
    expect(user?.role).toBe('RESIDENT');
  });

  test('rejects weak password', async () => {
    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User'
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  test('rejects duplicate email', async () => {
    await prisma.user.create({
      data: {
        email: 'existing@example.com',
        password: 'hashedpass',
        name: 'Existing User',
        role: 'RESIDENT',
        status: 'ACTIVE'
      }
    });

    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'existing@example.com',
        password: 'SecurePass123!',
        name: 'New User'
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(409);
  });
});
```

### Integration Tests

**Test Scenarios:**

1. **Complete Registration Flow**
   - User registers
   - Receives verification email
   - Clicks verification link
   - Email verified successfully
   - User can log in

2. **Complete Password Reset Flow**
   - User requests password reset
   - Receives reset email
   - Clicks reset link
   - Submits new password
   - Old sessions invalidated
   - Can log in with new password

3. **Role-Based Access Control**
   - RESIDENT cannot access admin routes
   - COMMITTEE_LEADER can access committee routes
   - WEB_STEWARD can access all routes
   - Unauthorized users redirected to /unauthorized

4. **Account Lockout**
   - User enters wrong password 5 times
   - Account locked for 15 minutes
   - Login attempts reset after successful login

### Manual Testing Checklist

**Authentication:**
- [ ] New user can register successfully
- [ ] Registration validates all fields correctly
- [ ] Email verification link works
- [ ] Cannot log in before email verified
- [ ] Can log in after email verified
- [ ] Session persists across page refreshes
- [ ] Session expires after configured timeout
- [ ] Logout works correctly

**Password Reset:**
- [ ] Forgot password sends email
- [ ] Reset link works within 1 hour
- [ ] Reset link expires after 1 hour
- [ ] Can set new password successfully
- [ ] Old password no longer works
- [ ] All sessions invalidated after reset

**Role-Based Access:**
- [ ] RESIDENT can access dashboard
- [ ] RESIDENT cannot access admin pages
- [ ] COMMITTEE_LEADER can access committee pages
- [ ] WEB_STEWARD can access all pages
- [ ] Unauthorized access shows proper error page
- [ ] API endpoints enforce role permissions

**Security:**
- [ ] Passwords are hashed in database
- [ ] JWT tokens are signed and validated
- [ ] Session cookies are httpOnly and secure
- [ ] CSRF protection working
- [ ] Account lockout after failed attempts
- [ ] No password in error messages or logs

**Admin Features:**
- [ ] Admin can view all users
- [ ] Admin can change user roles
- [ ] Admin can suspend accounts
- [ ] Admin cannot escalate to higher role than own
- [ ] Audit logs record all actions
- [ ] Email sent when role changed

---

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured in production:
  - [ ] NEXTAUTH_URL (production URL)
  - [ ] NEXTAUTH_SECRET (strong random secret)
  - [ ] DATABASE_URL (production database)
  - [ ] SMTP credentials (production email service)
- [ ] Database schema migrated to production
- [ ] Initial admin user created via seed script
- [ ] All tests passing (unit + integration)
- [ ] Security audit completed
- [ ] SSL/TLS certificates configured
- [ ] Rate limiting configured (consider Vercel Edge Config or Upstash)

### Deployment Steps

1. **Database Migration**
   ```bash
   npx prisma migrate deploy
   ```

2. **Seed Initial Data**
   ```bash
   npx prisma db seed
   ```

3. **Deploy Application**
   - Push code to production branch
   - Trigger deployment pipeline
   - Monitor build logs for errors

4. **Verify Deployment**
   - Test registration flow in production
   - Test login flow
   - Test password reset
   - Test email delivery
   - Verify SSL working
   - Check all protected routes

5. **Monitor**
   - Watch error logs for first 24 hours
   - Monitor email delivery rates
   - Check session creation metrics
   - Review audit logs for anomalies

### Post-Deployment

- [ ] Registration flow tested in production
- [ ] Email verification emails delivered
- [ ] Password reset emails delivered
- [ ] Login working correctly
- [ ] Sessions persisting correctly
- [ ] Role-based access working
- [ ] Admin dashboard accessible to WEB_STEWARD
- [ ] Audit logs being created
- [ ] No console errors or warnings
- [ ] Performance metrics acceptable (< 500ms auth checks)

### Rollback Plan

If critical issues found after deployment:

1. **Immediate Actions**
   - Revert to previous deployment
   - Disable user registration (if needed)
   - Notify users of maintenance

2. **Database Rollback**
   - If schema changes cause issues, run rollback migration
   - Restore database from backup if necessary

3. **Communication**
   - Post status update on status page
   - Email affected users if needed
   - Document issue in incident log

---

## Security Considerations

### Password Security
- Passwords hashed with bcrypt (12 salt rounds)
- Minimum complexity requirements enforced
- No password exposed in logs or error messages
- Password reset tokens expire after 1 hour
- All sessions invalidated on password change

### Session Security
- JWT tokens signed with NEXTAUTH_SECRET
- Session cookies are httpOnly, secure, sameSite=lax
- Token expiry: 30 days (configurable)
- Tokens include minimal payload (no sensitive data)
- Session validation on every request

### Account Protection
- Account lockout after 5 failed login attempts (15 min)
- Email verification required before login
- IP address logged for all auth events
- Audit trail of all security events
- Rate limiting on auth endpoints (implement in Phase 7)

### API Security
- All API routes protected with authentication
- Role-based authorization enforced
- Input validation on all endpoints
- SQL injection prevented by Prisma
- XSS prevention via React (escapes by default)
- CSRF protection via NextAuth.js

### Email Security
- Verification tokens expire after 24 hours
- Reset tokens expire after 1 hour
- Tokens are single-use only
- No sensitive data in email content
- SPF, DKIM, DMARC configured for email domain

---

## Future Enhancements

### Phase 2 Features (Post-Launch)

1. **Multi-Factor Authentication (MFA)**
   - TOTP (Time-based One-Time Password)
   - SMS verification
   - Backup codes
   - QR code setup

2. **OAuth Providers**
   - Google Sign-In
   - Microsoft Sign-In
   - Apple Sign-In

3. **Advanced Security**
   - Device fingerprinting
   - Suspicious login detection
   - Geographic IP restrictions
   - Login notification emails

4. **Session Management**
   - View active sessions
   - Revoke individual sessions
   - "Sign out all devices" feature

5. **Enhanced Audit Logging**
   - Export audit logs
   - Advanced filtering
   - Anomaly detection
   - Security reports

6. **API Rate Limiting**
   - Per-user rate limits
   - Per-IP rate limits
   - DDoS protection
   - Throttling on sensitive endpoints

7. **Password Policies**
   - Password expiration (90 days)
   - Password history (no reuse of last 5)
   - Forced password reset on security events

8. **Account Recovery**
   - Security questions
   - Alternative email
   - Phone number verification
   - Admin-assisted recovery

---

## Role Permission Matrix

| Feature/Route | WEB_STEWARD | BOARD_CHAIR | COMMITTEE_LEADER | CONTENT_MODERATOR | SUPPORT_STAFF | STEWARD | PARTNER | RESIDENT |
|--------------|-------------|-------------|------------------|-------------------|---------------|---------|---------|----------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage Users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Audit Logs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Committees | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Moderate Content | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Access Support Queue | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Vote in Governance | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| View Sacred Ledger | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit Sacred Ledger | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Publish Contract Version | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Access Partner Resources | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Create Events | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| RSVP to Events | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Upload Media | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| View Media Gallery | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

**Spec Complete**

Next step: Run `/create-tasks` to generate implementation task list.
