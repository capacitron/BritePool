# BritePool: Auth Enhancement + Contract Redesign

## Overview

Implement password reset flow, email verification, and redesign the contract/covenant agreement page for better readability. This is a **Phased Parallel** execution with foundation first, then 3 parallel feature sessions.

## Architecture Decisions

See: [decisions.md](./decisions.md)

---

## Phase 1: Foundation (Sequential)

**Session: Main Terminal**
**Must complete before Phase 2 begins**

- [x] 1.1: Add `PasswordResetToken` model to `prisma/schema.prisma`
- [x] 1.2: Add `EmailVerificationToken` model to `prisma/schema.prisma`
- [x] 1.3: Add relations to `User` model (`passwordResetTokens`, `emailVerificationTokens`)
- [ ] 1.4: Run `npx prisma migrate dev --name add_auth_tokens` (requires DATABASE_URL)
- [x] 1.5: Run `npx prisma generate`
- [x] 1.6: Install `react-markdown` dependency (`npm install react-markdown`)

**Verification:** `npx prisma studio` shows new token tables

---

## Phase 2: Features (Parallel — Start after Phase 1)

### Terminal A: Password Reset Flow

**Files to create:**
- [x] 2A.1: `app/api/auth/forgot-password/route.ts` — Generate token, send email
- [x] 2A.2: `app/api/auth/reset-password/route.ts` — Validate token, update password
- [x] 2A.3: `app/(auth)/forgot-password/page.tsx` — Email input form
- [x] 2A.4: `app/(auth)/reset-password/page.tsx` — New password form

**Files to modify:**
- [x] 2A.5: `app/(auth)/login/page.tsx` — Add "Forgot password?" link

**Implementation notes:**
- Use `crypto.randomUUID()` for token generation
- Use existing `sendPasswordResetEmail()` from `lib/email.ts`
- Use existing `forgotPasswordSchema` and `resetPasswordSchema` from `lib/validations/auth.ts`
- Use `hashPassword()` from `lib/auth-utils.ts`
- Rate limit: 5 requests/hour per IP
- Token expiration: 1 hour
- Always return generic success (don't reveal if email exists)

---

### Terminal B: Email Verification Flow

**Files to create:**
- [x] 2B.1: `app/api/auth/verify-email/route.ts` — Validate token, set emailVerified
- [x] 2B.2: `app/api/auth/resend-verification/route.ts` — Resend verification email
- [x] 2B.3: `app/(auth)/verify-email/page.tsx` — Auto-verify on mount, show result

**Files to modify:**
- [x] 2B.4: `lib/email.ts` — Add `sendVerificationEmail()` function
- [x] 2B.5: `app/api/auth/register/route.ts` — Generate token & send verification on signup
- [x] 2B.6: `middleware.ts` — Add `/verify-email` to public routes

**Implementation notes:**
- Token expiration: 24 hours
- Set user status to `PENDING_VERIFICATION` on registration
- Update to `ACTIVE` after verification
- Rate limit resend: 3 requests/15 minutes

---

### Terminal C: Contract/Covenant Redesign

**Files to modify:**
- [x] 2C.1: `app/(auth)/contract-review/page.tsx` — Complete UI redesign

**Key changes:**
1. Remove `max-h-[85vh]` — use full page layout
2. Replace `whitespace-pre-wrap` with `<ReactMarkdown>`
3. Increase text: `text-base` or `text-lg` (16-18px)
4. Add `max-w-prose mx-auto` for readable line width
5. Soften scroll requirement: unlock after 75% scroll OR 30 seconds
6. Sticky header with progress bar
7. Sticky footer with agreement checkbox and button
8. Mobile-friendly: responsive padding

**Component structure:**
```tsx
<div className="min-h-screen flex flex-col bg-gradient-to-b from-sand-50 to-cream">
  <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b">
    {/* Progress bar */}
  </header>
  <main className="flex-1 py-8 md:py-12">
    <article className="max-w-prose mx-auto px-4 md:px-6">
      <ReactMarkdown>{contract.content}</ReactMarkdown>
    </article>
  </main>
  <footer className="sticky bottom-0 bg-white border-t p-6">
    {/* Checkbox + Accept button */}
  </footer>
</div>
```

---

## Phase 3: Verification (Sequential)

**Session: Main Terminal (or Virgin Session)**

- [ ] 3.1: Test password reset flow end-to-end
- [ ] 3.2: Test email verification flow end-to-end
- [ ] 3.3: Test contract page on desktop and mobile viewports
- [ ] 3.4: Run existing tests: `npm run test`
- [ ] 3.5: Run type check: `npm run typecheck`
- [ ] 3.6: Run linter: `npm run lint`

---

## Session Prompts

### Phase 1 Prompt (Main Terminal)

```
cd ~/BritePool

Read plan.md. Execute Phase 1: Foundation.

Tasks:
1. Add PasswordResetToken and EmailVerificationToken models to prisma/schema.prisma
2. Add relations to User model
3. Run migrations
4. Install react-markdown

Check off tasks in plan.md when done. Stop when Phase 1 is complete.
```

### Phase 2A Prompt (Password Reset — New Terminal)

```
cd ~/BritePool

Read plan.md. Execute Phase 2A: Password Reset Flow.

Database schema is already set up. Create:
- app/api/auth/forgot-password/route.ts
- app/api/auth/reset-password/route.ts
- app/(auth)/forgot-password/page.tsx
- app/(auth)/reset-password/page.tsx
- Modify app/(auth)/login/page.tsx to add forgot password link

Use existing utilities:
- sendPasswordResetEmail() from lib/email.ts
- forgotPasswordSchema, resetPasswordSchema from lib/validations/auth.ts
- hashPassword() from lib/auth-utils.ts

Check off tasks in plan.md when done.
```

### Phase 2B Prompt (Email Verification — New Terminal)

```
cd ~/BritePool

Read plan.md. Execute Phase 2B: Email Verification Flow.

Database schema is already set up. Create:
- app/api/auth/verify-email/route.ts
- app/api/auth/resend-verification/route.ts
- app/(auth)/verify-email/page.tsx

Modify:
- lib/email.ts — add sendVerificationEmail()
- app/api/auth/register/route.ts — send verification on signup
- middleware.ts — add /verify-email to public routes

Check off tasks in plan.md when done.
```

### Phase 2C Prompt (Contract Redesign — New Terminal)

```
cd ~/BritePool

Read plan.md. Execute Phase 2C: Contract/Covenant Redesign.

Completely redesign app/(auth)/contract-review/page.tsx:
- Full-page layout (remove max-h-[85vh])
- Use ReactMarkdown to render content
- Larger text (text-base or text-lg)
- max-w-prose for readable line width
- Sticky header with progress bar
- Sticky footer with checkbox and button
- Soften scroll gate: unlock at 75% OR after 30 seconds
- Mobile-friendly responsive design

react-markdown is already installed.

Check off tasks in plan.md when done.
```

### Phase 3 Prompt (Verification)

```
cd ~/BritePool

Read plan.md. Execute Phase 3: Verification.

Test all features:
1. Password reset flow (forgot → email → reset → login)
2. Email verification (register → email → verify)
3. Contract page (desktop + mobile, markdown rendering, scroll behavior)

Run: npm run test && npm run typecheck && npm run lint

Check off tasks in plan.md when done.
```

---

## Execution Order

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: Foundation (Main Terminal)                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Schema + Migrations + Dependencies                       │ │
│ └─────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼ (Wait for Phase 1 to complete)
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: Features (3 Parallel Terminals)                     │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │
│ │ Terminal A  │ │ Terminal B  │ │ Terminal C  │             │
│ │ Password    │ │ Email       │ │ Contract    │             │
│ │ Reset       │ │ Verification│ │ Redesign    │             │
│ └─────────────┘ └─────────────┘ └─────────────┘             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼ (Wait for all Phase 2 to complete)
┌─────────────────────────────────────────────────────────────┐
│ Phase 3: Verification (Main Terminal)                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Test all features + Run test suite                       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Files Summary

| Phase | Create | Modify |
|-------|--------|--------|
| 1 | — | `prisma/schema.prisma` |
| 2A | 4 files | 1 file |
| 2B | 3 files | 3 files |
| 2C | — | 1 file |
| **Total** | **7 files** | **5 files** |
