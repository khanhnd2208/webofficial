# 🏗️ Architecture Documentation — My Teaching Platform

> **Last Updated:** 2026-03-02
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
├── app/
│   ├── layout.tsx          # Root layout (Providers, Navbar, ThemeProvider)
│   ├── page.tsx            # Public homepage
│   ├── admin/
│   │   ├── AdminSidebar.tsx
│   │   ├── layout.tsx      # Admin layout (sidebar + content)
│   │   ├── page.tsx        # Admin dashboard overview
│   │   ├── feedback/       # Feedback management
│   │   ├── posts/          # Blog post CMS (create, edit, comments)
│   │   └── vocabulary/     # Admin vocab store management
│   ├── api/
│   │   ├── admin/
│   │   │   ├── comments/   # Comment moderation
│   │   │   ├── posts/      # Blog CRUD
│   │   │   └── vocab-sets/ # Admin vocab set listing
│   │   ├── auth/           # NextAuth handler
│   │   ├── feedback/       # Feedback message endpoints
│   │   ├── notifications/  # User notification endpoints
│   │   ├── posts/          # Blog CRUD + reactions/comments/views
│   │   ├── streak/         # Login streak tracking
│   │   ├── uploads/        # Image upload handler
│   │   ├── vocab-sets/     # Vocab set CRUD + CSV import + store + clone
│   │   └── vocab-stats/    # Word statistics tracking
│   ├── blog/               # Public blog pages
│   ├── dashboard/          # Student dashboard
│   ├── feedback/           # Feedback submission page
│   ├── login/              # Login page (Google OAuth)
│   └── vocabulary/
│       ├── page.tsx        # My vocab sets
│       ├── create/         # Create new set (manual or CSV)
│       ├── database/       # All terms database view
│       ├── store/          # Public vocab store (browse & clone)
│       └── [id]/
│           ├── page.tsx    # Set detail + practice mode selector
│           ├── edit/       # Edit vocab set
│           ├── flashcards/ # Flashcard practice
│           ├── mcq/        # Multiple choice
│           ├── fill-blank/ # Fill in the blank
│           └── matching/   # Word matching
│
├── components/             # Shared React components
├── constants/              # App-wide constants
├── lib/                    # Core infrastructure (auth, db)
├── models/                 # Mongoose schemas
│   ├── User.ts, Post.ts, Comment.ts
│   ├── VocabSet.ts, WordStats.ts
│   ├── LoginStreak.ts, Notification.ts, FeedbackMessage.ts
│
├── services/               # Business logic (lean queries + DTOs)
│   ├── postService.ts, commentService.ts
│   ├── vocabSetService.ts, wordStatsService.ts
│   ├── streakService.ts, notificationService.ts
│   ├── feedbackMessageService.ts, adminDashboardService.ts
│
├── types/                  # TypeScript DTO interfaces
└── utils/                  # Pure utility functions (slugify, formatDate)
```

---

## 3. Architecture Patterns

### 3.1 Service Layer
```
API Route → Service → Model → MongoDB → DTO (lean)
```
- Services call `dbConnect()` before any DB operation
- All queries use `.lean()` for performance
- DTOs convert `ObjectId` → `string` and strip internal fields

### 3.2 Authentication & Authorization
- **Middleware:** Protects `/admin/*` (edge-compatible, uses `auth.config.ts`)
- **API Auth:** `getApiUser(req)` → `{ id, role, name, email }`, `isAdmin(req)` → boolean
- **Roles:** `student` | `admin`

### 3.3 Caching
- Public blog listing: `unstable_cache` with 60s revalidation
- Admin mutations bust cache via `revalidateTag('posts')`
- No caching on authenticated data

---

## 4. Data Models

```
User (Google OAuth)
 ├── 1:N → VocabSet
 ├── 1:N → WordStats
 ├── 1:N → LoginStreak
 ├── 1:N → Notification
 ├── 1:N → Comment
 └── 1:N → FeedbackMessage

Post (Blog)
 ├── slug (unique, Vietnamese-safe)
 ├── 1:N → Comment (nested via parentId)
 └── embedded → reactions, contentVi, contentEn

VocabSet
 ├── ownerId → User
 ├── isPublic (admin toggles for store)
 └── embedded → terms[]
```

---

## 5. API Routes

| Pattern | Auth | Purpose |
|---------|------|---------|
| `GET /api/posts` | Public | Blog listing |
| `GET /api/posts/[slug]` | Public | Post detail |
| `POST /api/posts/[slug]/comments` | User | Add comment |
| `POST /api/posts/[slug]/reactions` | User | React to post |
| `GET /api/admin/posts` | Admin | Admin post listing |
| `POST /api/admin/posts` | Admin | Create post |
| `PUT/DELETE /api/admin/posts/[id]` | Admin | Update/delete post |
| `GET /api/admin/vocab-sets` | Admin | Admin's own sets (all) |
| `GET /api/vocab-sets` | User | Own vocab sets |
| `POST /api/vocab-sets` | User | Create set (JSON or CSV) |
| `GET/PUT/DELETE /api/vocab-sets/[id]` | Owner/Admin | Set CRUD |
| `GET /api/vocab-sets/store` | Public | Public store listing |
| `POST /api/vocab-sets/store` | User | Clone public set |
| `GET /api/vocab-sets/all-terms` | User | All terms aggregation |
| `GET/POST /api/vocab-stats` | User | Word statistics |
| `GET /api/streak` | User | Login streak |
| `GET /api/notifications` | User | Notifications |
| `POST /api/feedback/messages` | User | Send feedback |

---

## 6. Deployment

| Component | Detail |
|-----------|--------|
| **VPS** | Ubuntu, `/var/www/webofficial` |
| **Domain** | `toiladuykhanh.com` |
| **Process Manager** | PM2 (`ecosystem.config.js`) |
| **Reverse Proxy** | Nginx (:443 → :4000) |
| **SSL** | Let's Encrypt |
| **Database** | MongoDB localhost:27017 |
| **Auth** | Google OAuth via NextAuth v5 |

```bash
cd /var/www/webofficial
git pull origin main && npm ci && npm run build && pm2 restart nextjs-app --update-env
```
