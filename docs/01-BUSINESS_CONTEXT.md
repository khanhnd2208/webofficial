# 01 — Business Context

> **HANOICAM** — Personal teaching platform by NDK.  
> This document covers the product vision, user personas, and core domain logic.

---

## 1. Project Vision

HANOICAM is a **personal publishing and learning platform** built for a single admin author (NDK) to publish bilingual Vietnamese/English articles and interactive learning tools for a Vietnamese student audience.

The platform is intentionally lean — no multi-author, no open registration for writers. The author has full control over what is published and when. Students discover content passively (blog) or actively (vocabulary practice, feedback).

**Core value propositions:**

1. A **bilingual blog** (Vietnamese + English side-by-side) that makes technical and educational content accessible.
2. A **vocabulary practice system** (flashcards, MCQ, fill-in-blank, matching) tied to user-created or admin-published word sets.
3. A **feedback channel** between students and the admin — a lightweight threaded messaging system (not a general comment section).
4. A **login streak** gamification layer to encourage daily visits.

---

## 2. User Personas

### 2.1 Admin / Author (NDK)
- **Access:** Authenticated via Google OAuth with the email configured in `ADMIN_EMAIL` env var.
- **Capabilities:** Full CRUD on posts, manage all vocabulary sets (including public ones), approve/reject comments, reply to feedback messages, view dashboard overview stats, change user roles.
- **Primary surface:** `/admin` — protected by Edge Middleware + API-level role checks.

### 2.2 Authenticated Student
- **Access:** Authenticated via Google OAuth (any Google account).
- **Role:** `student` (default). Can be promoted to `teacher` by admin.
- **Capabilities:** Comment on posts (pending moderation), react to posts (emoji reactions), create private vocabulary sets, track personal learning streak, submit feedback to admin.
- **Primary surfaces:** `/dashboard`, `/vocabulary`, `/profile`, `/feedback`.

### 2.3 Public Visitor (Unauthenticated)
- **Access:** No login required.
- **Capabilities:** Read all published blog posts, browse public vocabulary sets in the store, view reactions and comments (approved only).
- **Primary surfaces:** `/`, `/blog`, `/blog/[slug]`, `/vocabulary/store`.

---

## 3. Core Business Flows

### 3.1 Content Publishing Flow
```
Admin creates post (/admin/posts/create)
  → Rich text editor (TipTap) with optional English translation
  → Thumbnail upload → stored in /public/uploads/
  → Auto-generated slug from title (via slugify util)
  → Save as Draft (isPublished: false) OR Publish immediately
  → On publish: revalidatePath('/', 'layout') clears Next.js cache
  → Post visible at /blog/[slug] and homepage
```

### 3.2 Authentication & Authorization Flow
```
User visits /login
  → Signs in with Google OAuth (Auth.js v5)
  → JWT callback: role fetched from MongoDB users collection
  → Admin emails (ADMIN_EMAIL env) always get role: 'admin'
  → Token.role written into JWT (persists for 30 days)
  → Edge Middleware reads token.role to guard /admin routes
  → API routes re-check via getApiUser() on every request
```

### 3.3 Vocabulary Learning Flow
```
Student creates VocabSet (manually or via CSV upload)
  → Supports UTF-8 BOM CSVs for Vietnamese terms
  → CSV columns: word, definition (required) + partOfSpeech, example (optional)
  → Terms capped at MAX_TERMS_PER_SET (2,000)
Admin can publish sets to the public store (isPublic: true)
  → Any authenticated user can clone a public set to their own account
Student practices with chosen set
  → POST /api/vocab-stats records each attempt (correct/wrong, mode)
  → WordStats model tracks per-word accuracy and history
```

### 3.4 Feedback & Moderation Flow
```
Authenticated user submits feedback (/feedback page)
  → POST /api/feedback/messages creates a thread
  → Admin receives in-app notification (Notification model)
Admin replies to thread in /admin/feedback
  → PATCH /api/feedback/messages/[id]/reply adds reply
  → User receives in-app notification
Admin can close thread (status: 'closed')
Comments on blog posts follow same pattern:
  → New comment → status: 'pending'
  → Admin approves → status: 'approved', notifications sent
```

### 3.5 Login Streak Flow
```
On authenticated page load: POST /api/streak
  → streakService.recordLogin(userId)
  → Records today's date in loginDays (capped at 90 days)
  → Calculates currentStreak and longestStreak
  → StreakFire component displays current streak in Navbar
```

---

## 4. Domain Model Overview

| Model | Purpose | Key Constraints |
|-------|---------|----------------|
| `User` | OAuth identity, role | Unique email, role: student/teacher/admin |
| `UserProfile` | Extended profile info | 1-to-1 with User, auto-created on sign-in |
| `Post` | Blog article | Unique slug, auto-generated from title |
| `Comment` | Post comments | Status: pending/approved/hidden, max 2,000 chars |
| `VocabSet` | Vocabulary collection | Max 2,000 terms per set, owned by user |
| `WordStats` | Practice history | Per-user per-word, max 500 history entries |
| `LoginStreak` | Daily login tracking | Max 90 days stored, rolling window |
| `FeedbackMessage` | Admin↔User threads | Max 200 replies per thread |
| `Notification` | In-app alerts | TTL: auto-deleted after 90 days |

---

## 5. Post Category Taxonomy

Defined in `src/constants/post.ts` — safe to import in both client and server components:

```
Uncategorized | Tech & Programming | English Learning |
Tutorial | Life & Thoughts | Review | Tips & Tricks
```
