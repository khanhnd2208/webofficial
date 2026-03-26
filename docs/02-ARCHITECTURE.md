# 02 — Architecture

> System design, directory structure, data flow, and infrastructure decisions.

---

## 1. High-Level Architecture

HANOICAM follows a **Layered Architecture** adapted for Next.js App Router:

```
┌─────────────────────────────────────────────────────────────┐
│  Presentation Layer (Next.js App Router)                    │
│  ├── Server Components  → call Services directly            │
│  └── Client Components  → fetch /api/* routes              │
├─────────────────────────────────────────────────────────────┤
│  Controller Layer (API Route Handlers)                      │
│  └── src/app/api/**                                         │
│      Wrapped with withAuth / withAdmin / withErrorHandling  │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer (Services)                            │
│  └── src/services/**                                        │
│      Pure TypeScript — no HTTP, no NextRequest              │
├─────────────────────────────────────────────────────────────┤
│  Data Access Layer (Mongoose Models)                        │
│  └── src/models/**                                          │
│      Mongoose schemas + IDocument interfaces                │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                       │
│  ├── src/lib/dbConnect.ts    Mongoose connection pool       │
│  ├── src/lib/mongodbClient.ts  Native MongoClient           │
│  └── MongoDB Atlas                                          │
└─────────────────────────────────────────────────────────────┘
```

**Key design rule:** Server Components call services directly (zero HTTP overhead). Client Components always go through `/api/` routes.

---

## 2. Directory Structure

```
/
├── docs/                         # 📚 Living documentation (this folder)
├── public/
│   ├── uploads/                  # Local image uploads (admin-only)
│   └── sample-*.csv              # Example CSV formats for vocabulary import
├── src/
│   ├── app/                      # Next.js App Router — pages + API routes
│   │   ├── globals.css           # Design tokens (CSS custom properties)
│   │   ├── layout.tsx            # Root layout — Navbar, Providers, fonts
│   │   ├── page.tsx              # Homepage (Server Component)
│   │   ├── admin/                # Admin Studio — role-gated
│   │   │   ├── layout.tsx        # Admin shell with sidebar
│   │   │   ├── page.tsx          # Dashboard overview
│   │   │   ├── posts/            # Post management
│   │   │   ├── vocabulary/       # Vocab set management
│   │   │   ├── users/            # User management + role assignment
│   │   │   ├── feedback/         # Feedback thread management
│   │   │   └── tools/            # Admin utilities (Lucky Card, etc.)
│   │   ├── api/                  # REST API — all routes use apiUtils wrappers
│   │   │   ├── auth/             # Auth.js handler (re-export only)
│   │   │   ├── admin/            # Admin-only endpoints
│   │   │   │   ├── posts/        # CRUD for posts
│   │   │   │   ├── users/        # User list + role management
│   │   │   │   └── vocab-sets/   # Admin-owned sets
│   │   │   ├── posts/            # Public + admin post APIs
│   │   │   ├── vocab-sets/       # Vocabulary set CRUD
│   │   │   ├── vocab-stats/      # Practice result recording
│   │   │   ├── feedback/         # Feedback threads
│   │   │   ├── notifications/    # In-app notifications
│   │   │   ├── streak/           # Login streak
│   │   │   ├── profile/          # User profile
│   │   │   └── uploads/          # Image upload (admin only)
│   │   ├── blog/                 # Public blog pages
│   │   ├── vocabulary/           # Vocabulary practice pages
│   │   ├── dashboard/            # Authenticated user dashboard
│   │   ├── profile/              # Profile edit page
│   │   ├── feedback/             # Feedback submission page
│   │   └── login/                # Google OAuth sign-in page
│   │
│   ├── components/               # Reusable UI components (flat — no sub-grouping yet)
│   │   ├── Navbar.tsx            # Main navigation (client component)
│   │   ├── Providers.tsx         # NextAuth + Theme providers
│   │   ├── ThemeProvider.tsx     # next-themes wrapper
│   │   ├── ThemeToggle.tsx       # Dark/light mode toggle
│   │   ├── TiptapEditor.tsx      # Rich text editor (15+ extensions)
│   │   ├── DualLanguageEditor.tsx # Side-by-side VI/EN editor
│   │   ├── BilingualArticle.tsx  # Bilingual article renderer
│   │   ├── CommentSection.tsx    # Comment tree + like/reply
│   │   ├── ReactionBar.tsx       # Emoji reaction bar
│   │   ├── BlogSearch.tsx        # Full-text search bar
│   │   ├── BlogFilterBar.tsx     # Tag/category filter
│   │   ├── CodeBlock.tsx         # Syntax highlighted code + copy button
│   │   ├── FeedbackMessages.tsx  # Feedback thread viewer
│   │   ├── ImageCropModal.tsx    # Profile picture crop
│   │   ├── StreakFire.tsx        # Login streak flame indicator
│   │   ├── TableOfContents.tsx   # Auto-generated ToC for articles
│   │   ├── TagInput.tsx          # Multi-tag input
│   │   ├── ThumbnailUpload.tsx   # Admin thumbnail uploader
│   │   ├── ThumbnailPreview.tsx  # Thumbnail display
│   │   ├── ViewTracker.tsx       # Post view count incrementer
│   │   ├── ShareBar.tsx          # Social share buttons
│   │   └── ScrollToTop.tsx       # Back-to-top button
│   │
│   ├── config/                   # ⚙️ Centralized configuration
│   │   ├── constants.ts          # ALL magic numbers (limits, TTLs, sizes)
│   │   └── navigation.ts         # NAV_LINKS, USER_MENU_LINKS arrays
│   │
│   ├── constants/
│   │   └── post.ts               # POST_CATEGORIES (client-safe, no server deps)
│   │
│   ├── lib/                      # Infrastructure & cross-cutting concerns
│   │   ├── auth.config.ts        # Edge-safe Auth.js config (middleware only)
│   │   ├── auth.ts               # Full Auth.js config (Node.js — MongoDBAdapter)
│   │   ├── apiAuth.ts            # getApiUser(), isAdmin() helpers
│   │   ├── apiUtils.ts           # withAuth, withAdmin, withErrorHandling wrappers
│   │   ├── dbConnect.ts          # Mongoose connection singleton
│   │   └── mongodbClient.ts      # Native MongoClient (for Auth.js adapter)
│   │
│   ├── middleware.ts             # Edge Middleware — guards /admin/* routes
│   │
│   ├── models/                   # Mongoose schemas + TypeScript interfaces
│   │   ├── Post.ts               # IPost, PostSchema
│   │   ├── User.ts               # IUser, UserSchema
│   │   ├── UserProfile.ts        # IUserProfile
│   │   ├── Comment.ts            # IComment, CommentStatus
│   │   ├── VocabSet.ts           # IVocabSet, IVocabTerm
│   │   ├── WordStats.ts          # IWordStats, IPracticeEntry
│   │   ├── LoginStreak.ts        # ILoginStreak
│   │   ├── FeedbackMessage.ts    # IFeedbackMessage, IFeedbackReply
│   │   └── Notification.ts       # INotification, NotificationType
│   │
│   ├── services/                 # Business logic — pure TypeScript, no HTTP
│   │   ├── postService.ts        # Post CRUD + caching
│   │   ├── commentService.ts     # Comment tree + moderation
│   │   ├── vocabSetService.ts    # VocabSet CRUD + clone
│   │   ├── wordStatsService.ts   # Practice result recording + retrieval
│   │   ├── streakService.ts      # Login streak recording
│   │   ├── userProfileService.ts # Profile sync + updates
│   │   ├── userManagementService.ts  # Admin user list + role management
│   │   ├── feedbackMessageService.ts # Feedback threads
│   │   ├── notificationService.ts    # In-app notifications
│   │   └── adminDashboardService.ts  # Aggregated admin stats
│   │
│   ├── types/                    # TypeScript type definitions
│   │   ├── mongoose.ts           # LeanDoc<T>, WithId<T> utilities
│   │   ├── post.ts               # PostListItemDTO, PostDetailDTO, etc.
│   │   ├── vocabSet.ts           # VocabSetDTO, VocabTermDTO
│   │   ├── user.ts               # UserRole, UserDTO
│   │   ├── comment.ts            # CommentDTO
│   │   ├── userProfile.ts        # UserProfileDTO
│   │   ├── streak.ts             # StreakDTO
│   │   ├── notification.ts       # NotificationDTO
│   │   ├── feedbackMessage.ts    # FeedbackMessageDTO, FeedbackStatus
│   │   ├── wordStats.ts          # WordStatsDTO
│   │   └── next-auth.d.ts        # Module augmentation for JWT + Session
│   │
│   └── utils/                    # Pure utility functions — no side effects
│       ├── index.ts              # Barrel export (re-exports all utils)
│       ├── formatDate.ts         # formatDate, formatDateTime, formatDistanceToNow, timeAgo, formatDateShort
│       ├── formatNumber.ts       # formatNumber (k/M suffix)
│       └── slugify.ts            # URL-safe slug generation
```

---

## 3. Data Flow

### 3.1 Server Component → Service (zero HTTP overhead)
```
/app/admin/page.tsx (Server Component)
  → import { getAdminOverviewStats } from '@/services/adminDashboardService'
  → adminDashboardService calls dbConnect() then queries Mongoose models
  → Returns plain DTO objects (no Mongoose Document leaked)
  → Rendered as static HTML on the server
```

### 3.2 Client Component → API Route → Service
```
Client fetch('/api/vocab-sets')
  → src/app/api/vocab-sets/route.ts
  → export const GET = withAuth(async (_req, user) => { ... })
  → withAuth: validates session via getApiUser() → 401 if missing
  → vocabSetService.listMyVocabSets(user.id)
  → Returns { ok: true, data: { items, total } }
```

### 3.3 Authentication Data Flow
```
Google OAuth callback
  → Auth.js jwt() callback fires (server-side, Node.js)
  → Fetches role from MongoDB users collection
  → Writes token.role into JWT
  → JWT stored in httpOnly cookie (authjs.session-token)
  
Subsequent request to /admin/*
  → Edge Middleware reads JWT via auth.config.ts (no Node.js)
  → Checks token.role === 'admin'
  → 401 redirect or 403 inline HTML

API request with session cookie
  → getApiUser(request) → auth() → reads JWT → returns ApiUser
  → withAuth/withAdmin wrappers consume ApiUser
```

---

## 4. Infrastructure Decisions

### 4.1 Dual MongoDB Client

Two separate MongoDB connection mechanisms coexist intentionally:

| Client | File | Purpose |
|--------|------|---------|
| **Mongoose** | `src/lib/dbConnect.ts` | All application data (posts, users, vocab, etc.) |
| **Native MongoClient** | `src/lib/mongodbClient.ts` | Auth.js `MongoDBAdapter` (manages `users`, `accounts`, `sessions` collections) |

**Why two?** Auth.js requires its adapter to use the native MongoClient. Mongoose is used for all application models. Sharing the connection requires two pool configurations — keeping them separate avoids coupling and simplifies each driver's lifecycle.

### 4.2 Auth.js Split Config Pattern

Auth.js v5 is split across two files:

| File | Runtime | Purpose |
|------|---------|---------|
| `auth.config.ts` | **Edge** | Google provider config, session/cookie options. Used by `middleware.ts`. No Node.js deps. |
| `auth.ts` | **Node.js** | Extends `auth.config.ts` + MongoDBAdapter + jwt/events callbacks. Used by API routes and server components. |

This is the [official Auth.js edge-compatibility pattern](https://authjs.dev/guides/edge-compatibility).

### 4.3 Post Caching Strategy

Public post queries use `unstable_cache` (Next.js) with a 60-second revalidation window (`PUBLIC_CACHE_REVALIDATE_SECONDS`). Admin mutations call `revalidatePath('/', 'layout')` to invalidate the cache immediately on publish/update/delete.

### 4.4 Local File Uploads

Images are stored in `public/uploads/` on disk. This is intentional for the current single-server deployment. **Not suitable for multi-instance deployments** — migrate to S3/Cloudinary before scaling horizontally.

### 4.5 Turbopack (Development)

`next.config.ts` enables Turbopack for `next dev`. Production builds (`next build`) use Webpack as standard.
