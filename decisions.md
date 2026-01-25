# Architecture Decisions Log

## 2026-01-24 - Auth Token Storage Strategy

**Context:** Need to store password reset and email verification tokens securely.

**Decision:** Create dedicated Prisma models (`PasswordResetToken`, `EmailVerificationToken`) with:

- CUID primary keys
- User relation with cascade delete
- Unique token field for lookup
- Expiration timestamp
- `usedAt` field to mark single-use tokens
- Indexes on `userId`, `token`, and `expiresAt`

**Consequences:**

- Tokens are properly isolated from User model
- Easy to query and clean up expired tokens
- Cascade delete removes tokens when user is deleted

---

## 2026-01-24 - Contract Page Full Redesign

**Context:** Current contract review page has readability issues:

- Modal-like constraint (`max-h-[85vh]`)
- Raw markdown display (not rendered)
- Small text (`text-sm`)
- Aggressive scroll-to-bottom gate

**Decision:** Complete redesign with:

- Full-page layout (remove height constraint)
- ReactMarkdown for proper markdown rendering
- Larger text (`text-base` or `text-lg`)
- `max-w-prose` for comfortable reading width
- Soften scroll gate: unlock at 75% OR after 30 seconds
- Sticky header/footer for progress and actions

**Consequences:**

- Much better mobile experience
- Proper rendering of headings, lists, bold/italic
- Users don't need to scroll through tiny modal
- More accessible (larger text, better contrast)

---

## 2026-01-24 - Email Verification on Registration

**Context:** Users should verify their email before accessing the platform.

**Decision:**

- Set initial user status to `PENDING_VERIFICATION` on registration
- Send verification email immediately after user creation
- Update status to `ACTIVE` upon successful verification
- Existing auth config already blocks `PENDING_VERIFICATION` users from logging in

**Consequences:**

- Prevents fake account creation
- Ensures valid email for password recovery
- Works with existing auth middleware
