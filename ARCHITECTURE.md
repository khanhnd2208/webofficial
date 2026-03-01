# 🏗️ Architecture Documentation — My Teaching Platform

> **Last Updated:** 2025-07-27
> **Stack:** Next.js 16 (App Router) · TypeScript · MongoDB/Mongoose · NextAuth v5 · Tailwind CSS v4 · TipTap Editor
> **Domain:** [toiladuykhanh.com](https://toiladuykhanh.com)

---

## 1. High-Level Overview

```
┌──────────────────────────────────────────────────────────┐
│                     Nginx (SSL + reverse proxy)          │
│                        :443 → :4000                      │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│              Next.js App  (PM2 · port 4000)              │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  App Router  │  │ API Routes  │  │   Middleware     │  │
│  │  (RSC + CSR) │  │  /api/*     │  │  (auth guard)   │  │
│  └──────┬───┬──┘  └──────┬──────┘  └─────────────────┘  │
│         │   │            │                               │
│  ┌──────▼───▼────────────▼──────┐                        │
│  │      Services Layer          │                        │
│  │  (business logic + DTOs)     │                        │
│  └──────────────┬───────────────┘                        │
│                 │                                        │
│  ┌──────────────▼───────────────┐                        │
│  │      Models (Mongoose)       │                        │
│  └──────────────┬───────────────┘                        │
└─────────────────┼────────────────────────────────────────┘
                  │
┌─────────────────▼────────────────────────────────────────┐
│                 MongoDB  (localhost:27017)                │
│                 DB: my_teaching_platform                  │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```
src/
├── app/                    # Next.js App Router pages + API routes
│   ├── layout.tsx          # Root layout (Providers, Navbar, ThemeProvider)
│   ├── page.tsx            # Public homepage
│   ├── admin/              # Admin-only pages (guarded by middleware)
│   │   ├── courses/        # Course CRUD
│   │   ├── feedback/       # Feedback management
│   │   ├── learning/       # Learning management
│   │   ├── lessons/        # Lesson + vocabulary CRUD
│   │   └── posts/          # Blog post CMS
│   ├── api/                # REST API routes (all server-side)
│   │   ├── admin/          # Admin-only endpoints
│   │   ├── auth/           # NextAuth [...nextauth] handler
│   │   ├── feedback/       # Public feedback endpoints
│   │   ├── grades/         # Student grade lookup
│   │   ├── lessons/        # Lesson read endpoints
│   │   ├── notifications/  # User notification endpoints
│   │   ├── posts/          # Blog CRUD + reactions/comments/views
│   │   ├── streak/         # Login streak tracking
│   │   ├── uploads/        # Image upload handler
│   │   ├── vocab-sets/     # Vocabulary set CRUD + CSV import
│   │   └── vocab-stats/    # Word statistics
│   ├── blog/               # Public blog pages
│   ├── courses/            # Public course viewer (nested: units → lessons)
│   ├── dashboard/          # Student dashboard
│   ├── feedback/           # Feedback submission page
│   ├── login/              # Login page (Google OAuth)
│   └── vocabulary/         # Vocabulary practice (flashcards, MCQ, etc.)
│
├── components/             # Shared React components
│   ├── Navbar.tsx          # Global navigation bar
│   ├── TiptapEditor.tsx    # Rich-text editor (admin CMS)
│   ├── BilingualArticle.tsx# Dual-language blog renderer
│   ├── ImageCropModal.tsx  # Thumbnail cropper
│   └── ...                 # 20+ components
│
├── constants/              # App-wide constants
│   └── post.ts             # Blog categories & tag presets
│
├── lib/                    # Core infrastructure
│   ├── auth.ts             # NextAuth v5 config + handlers
│   ├── auth.config.ts      # Auth edge config (for middleware)
│   ├── apiAuth.ts          # getApiUser() + isAdmin() helpers
│   ├── dbConnect.ts        # Mongoose connection (singleton)
│   └── mongodbClient.ts    # Raw MongoDB client (for NextAuth adapter)
│
├── models/                 # Mongoose schemas + model registration
│   ├── User.ts             # Users (Google OAuth, role: student/teacher/admin)
│   ├── Post.ts             # Blog posts (bilingual, reactions, SEO)
│   ├── Comment.ts          # Nested comments on posts
│   ├── Course.ts           # Course container
│   ├── Unit.ts             # Course units (ordered sections)
│   ├── CourseUnit.ts       # Join table: Course ↔ Unit (ordering)
│   ├── Lesson.ts           # Lessons with rich content
│   ├── VocabularyItem.ts   # Individual vocabulary words
│   ├── VocabularyCollection.ts # Groups of vocab items per lesson
│   ├── VocabSet.ts         # User-created vocabulary sets
│   ├── Grade.ts            # Student grades per course
│   ├── LoginStreak.ts      # Daily login streak tracking
│   ├── Notification.ts     # In-app notifications
│   ├── FeedbackMessage.ts  # Feedback messages + admin replies
│   └── WordStats.ts        # Per-user word study statistics
│
├── services/               # Business logic layer (lean queries + DTO mapping)
│   ├── postService.ts      # Blog CRUD, slug generation, caching
│   ├── commentService.ts   # Nested comments + notifications
│   ├── courseService.ts     # Course listing + detail
│   ├── courseUnitService.ts # Course-unit relationships
│   ├── unitService.ts      # Unit CRUD + DTO export
│   ├── lessonService.ts    # Lesson CRUD
│   ├── lessonVocabularyService.ts  # Lesson vocab (uses VocabularyItem+Collection)
│   ├── vocabSetService.ts  # User vocab set CRUD
│   ├── wordStatsService.ts # Study progress tracking
│   ├── gradeService.ts     # Grade import (Excel) + lookup
│   ├── streakService.ts    # Login streak logic
│   ├── notificationService.ts     # Notification CRUD (centralized)
│   ├── feedbackMessageService.ts  # Feedback + replies + notifications
│   └── adminDashboardService.ts   # Dashboard aggregations
│
├── types/                  # TypeScript DTO interfaces
│   ├── post.ts             # PostDTO, PostListItemDTO, PostDetailDTO
│   ├── comment.ts          # CommentDTO
│   ├── course.ts           # CourseDTO, CourseDetailDTO
│   ├── unit.ts             # UnitDTO
│   ├── courseUnit.ts        # CourseUnitDTO
│   ├── lesson.ts           # LessonDTO, LessonDetailDTO
│   ├── lessonVocabulary.ts # LessonVocabularyItemDTO
│   ├── vocabSet.ts         # VocabSetDTO
│   ├── vocabulary.ts       # VocabularyItemDTO
│   ├── wordStats.ts        # WordStatsDTO
│   ├── grade.ts            # GradeDTO
│   ├── user.ts             # UserDTO
│   ├── feedbackMessage.ts  # FeedbackMessageDTO
│   ├── notification.ts     # NotificationDTO
│   ├── streak.ts           # StreakDTO
│   └── next-auth.d.ts      # NextAuth session type augmentation
│
└── utils/                  # Pure utility functions
    ├── slugify.ts          # Vietnamese-safe slug generation
    ├── formatDate.ts       # Date formatting helpers
    ├── calculateGPA.ts     # GPA calculator
    └── index.ts            # Shared utilities
```

---

## 3. Architecture Patterns

### 3.1 Service Layer (Repository Pattern)

Every data operation goes through a **service file** — never direct model access from API routes.

```
API Route → Service → Model → MongoDB
                ↓
            DTO (lean)
```

**Key conventions:**
- Services call `dbConnect()` before any DB operation
- All queries use `.lean()` for performance (returns plain objects, not Mongoose docs)
- Each service defines a `*Lean` type (shape from `.lean()`) and a `to*DTO()` mapper
- DTOs convert `ObjectId` → `string` and strip internal fields

### 3.2 Authentication & Authorization

```
Middleware (src/middleware.ts)
  └── Protects /admin/*, /dashboard/*, /api/admin/*
  └── Uses auth.config.ts (edge-compatible, no Mongoose)

API Auth (src/lib/apiAuth.ts)
  └── getApiUser(req)  → returns { id, role, email } or null
  └── isAdmin(req)     → boolean check for admin/teacher role
```

**User roles:** `student` | `teacher` | `admin`
- Admin panel requires `teacher` or `admin` role
- Grade viewing requires authenticated student (sees own data only)

### 3.3 Caching Strategy

```typescript
// Public post listing uses Next.js unstable_cache (60s revalidation)
const cachedGetPosts = unstable_cache(getPostsFromDb, ['posts-public'], {
  revalidate: 60,
  tags: ['posts'],
});
```

- Public reads (blog listing) are cached server-side
- Admin mutations call `revalidateTag('posts')` to bust cache
- No caching on authenticated data (grades, notifications, etc.)

---

## 4. Data Model Relationships

```
User (Google OAuth)
 ├── 1:N → Grade (per course, per semester)
 ├── 1:N → VocabSet (user-created vocabulary sets)
 ├── 1:N → WordStats (per-word study progress)
 ├── 1:N → LoginStreak (daily login tracking)
 ├── 1:N → Notification (in-app messages)
 ├── 1:N → Comment (on blog posts)
 └── 1:N → FeedbackMessage (to admin)

Post (Blog)
 ├── has slug (unique, auto-generated, Vietnamese-safe)
 ├── 1:N → Comment (nested via parentId self-ref)
 ├── embedded → reactions { like, love, fire, clap, think }
 └── embedded → contentVi, contentEn (bilingual)

Course
 └── M:N → Unit (via CourseUnit join table, with sortOrder)
          └── 1:N → Lesson
                    └── 1:1 → VocabularyCollection
                              └── 1:N → VocabularyItem
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| `userId` stored as `String` (not ObjectId) | Google OAuth IDs are strings; consistent with NextAuth session |
| Denormalized `userName`/`userImage` in Comment, FeedbackMessage | Avoids N+1 lookups on read-heavy pages |
| `CourseUnit` as separate join table | Supports ordering + many-to-many without embedding |
| Separate `VocabSet` vs `VocabularyCollection` | VocabSet = user-created; VocabularyCollection = lesson-attached |

---

## 5. API Route Conventions

| Pattern | Auth | Purpose |
|---------|------|---------|
| `GET /api/posts` | Public | Blog listing (cached) |
| `GET /api/posts/[slug]` | Public | Single post detail |
| `POST /api/posts/[slug]/comments` | User | Add comment |
| `POST /api/posts/[slug]/reactions` | User | React to post |
| `GET /api/admin/posts` | Admin | Admin post listing |
| `POST /api/admin/posts` | Admin | Create post |
| `PUT /api/admin/posts/[id]` | Admin | Update post |
| `DELETE /api/admin/posts/[id]` | Admin | Delete post |
| `GET /api/grades` | User | Own grades only |
| `GET /api/vocab-sets` | User | Own vocab sets |
| `POST /api/vocab-sets` | User | Create vocab set (+ CSV upload) |
| `GET /api/streak` | User | Login streak |
| `GET /api/notifications` | User | Own notifications |
| `POST /api/feedback/messages` | User | Send feedback |

---

## 6. Deployment

### Infrastructure

| Component | Detail |
|-----------|--------|
| **VPS** | Ubuntu, `/var/www/webofficial` |
| **Domain** | `toiladuykhanh.com` |
| **Process Manager** | PM2 (`ecosystem.config.js`) |
| **Reverse Proxy** | Nginx (:443 → :4000) |
| **SSL** | Let's Encrypt (certbot auto-renewal) |
| **Database** | MongoDB on localhost:27017 |
| **Auth Provider** | Google OAuth via NextAuth v5 |

### Deploy Commands

```bash
# On VPS:
cd /var/www/webofficial
git pull origin main
npm ci
npm run build
pm2 restart nextjs-app --update-env
```

See **PRODUCTION_SETUP.md** for full first-time setup instructions.

---

## 7. Optimization Changelog (2025-07-27)

### Models
- ✅ Removed redundant `index: true` where `unique: true` already creates an index (User, Course, LoginStreak, Post)
- ✅ Fixed `required: true` + `default` anti-pattern (Course description, VocabularyCollection name/itemCount, Lesson content)
- ✅ Post model now imports shared `slugify()` from `utils/slugify.ts` instead of inline implementation
- ✅ Deleted unused `LessonVocabulary.ts` model (service uses `VocabularyItem` + `VocabularyCollection` instead)

### Services
- ✅ Extracted shared `toUnitDTO()` from `unitService.ts`, reused in `courseUnitService.ts` (eliminated duplication)
- ✅ Merged `ensureUniqueSlug()` and `ensureUniqueSlugForUpdate()` into single function with optional `excludeId` param in `postService.ts`
- ✅ Extracted shared `toWordStatsDTO()` helper in `wordStatsService.ts` (eliminated 2x inline mapping)
- ✅ Centralized notification creation: `commentService.ts` and `feedbackMessageService.ts` now call `createNotification()` from `notificationService` instead of direct `Notification.create()`

### Types
- ✅ Created `types/notification.ts` — extracted `NotificationDTO` interface (shared by notificationService)
- ✅ Created `types/streak.ts` — extracted `StreakDTO` interface (shared by streakService)

### Bug Fixes
- ✅ Fixed CSV Vietnamese encoding: added UTF-8 BOM to sample CSV, data URI downloads, and upload parsing

---

## 8. Known Considerations (Future Work)

| Area | Description | Impact |
|------|-------------|--------|
| **userId type** | Some models use `String`, others `ObjectId` for userId | Low risk currently (Google IDs are strings) — standardize if adding non-OAuth auth |
| **Vocab systems** | Three parallel systems: VocabularyItem+Collection (lessons), VocabSet (user-created), WordStats (tracking) | Working correctly but could be unified in future |
| **Denormalized user data** | `userName`/`userImage` embedded in Comment, FeedbackMessage | No sync mechanism — stale if user changes profile; acceptable trade-off for read perf |
| **toJSON virtuals** | Models don't configure `toJSON: { virtuals: true }` | Not needed since services use `.lean()` exclusively |
| **Middleware deprecation** | Next.js 16 warns: middleware → proxy convention | Monitor for breaking changes in future Next.js versions |
