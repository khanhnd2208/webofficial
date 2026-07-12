# HANOICAM — Personal Publishing & Teaching Platform

> Personal perspectives, teaching materials, and owner-managed tools by NDK.  
> Live: **[toiladuykhanh.com](https://toiladuykhanh.com)**

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/00-PRODUCT_DIRECTION.md](./docs/00-PRODUCT_DIRECTION.md) | Product boundaries, audiences, and access policy |
| [docs/01-BUSINESS_CONTEXT.md](./docs/01-BUSINESS_CONTEXT.md) | Product vision, user personas, core business flows |
| [docs/02-ARCHITECTURE.md](./docs/02-ARCHITECTURE.md) | System design, directory structure, infrastructure decisions |
| [docs/03-CODING_STANDARDS.md](./docs/03-CODING_STANDARDS.md) | API patterns, type safety rules, naming conventions — **read before contributing** |
| [docs/04-ADR_AND_CHANGELOG.md](./docs/04-ADR_AND_CHANGELOG.md) | Architecture Decision Records and refactoring history |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16.1.6 (App Router) + React 19 |
| **Language** | TypeScript 5 |
| **Database** | MongoDB Atlas via Mongoose 9 + native MongoClient |
| **Auth** | Auth.js v5 (NextAuth beta) — Google OAuth, JWT sessions |
| **Styling** | TailwindCSS v4 + `@tailwindcss/typography` |
| **Rich Text** | TipTap v3 (15+ extensions) |
| **Build** | Turbopack (dev) / Webpack (prod) |
| **Runtime** | Node.js (server) + Edge (middleware) |

---

## Local Setup

### 1. Prerequisites

- Node.js ≥ 20
- A MongoDB Atlas connection string
- A Google OAuth app (Client ID + Secret)

### 2. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Environment Variables

Create `.env.local` in the project root:

```bash
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname>

# Auth.js v5
AUTH_SECRET=<generate with: openssl rand -base64 32>
AUTH_URL=http://localhost:3000

# Google OAuth  (create at console.cloud.google.com)
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>

# Admin access — the Google account email that receives the 'admin' role on first sign-in
ADMIN_EMAIL=your@email.com
```

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development server with Turbopack hot-reload |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm run test` | Run all Vitest projects once |
| `npm run test:unit` | Unit tests only (fast, no DB) |
| `npm run test:integration` | Service + API integration tests |
| `npm run test:component` | React hook/component tests (jsdom) |
| `npm run test:coverage` | All tests with coverage report |
| `npm run test:e2e` | Playwright end-to-end smoke tests |
| `npm run test:db:setup` | Create and migrate local test Postgres DB |
| `npm run check` | Full quality gate: typecheck + lint + test + build |

### Testing prerequisites

- **Unit / component tests:** no external services required.
- **Integration tests:** `DATABASE_URL` in `.env.local` (PostgreSQL). MongoDB uses in-memory server automatically.
- **E2E tests:** app built and served (Playwright starts it in CI).

See [docs/03-CODING_STANDARDS.md](./docs/03-CODING_STANDARDS.md) §10 for harness conventions.

---

## API Overview

All API responses use a consistent envelope:

```json
{ "ok": true,  "data": <payload> }
{ "ok": false, "error": "<message>" }
```

### Public Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/posts` | List published posts (pagination, tag/category filter) |
| `GET` | `/api/posts/[slug]` | Get single post by slug |
| `GET` | `/api/posts/search?q=` | Full-text search (≥2 chars) |
| `GET` | `/api/posts/tags` | All tags in use |
| `GET` | `/api/posts/categories` | Predefined + used categories |
| `POST` | `/api/posts/[slug]/reactions` | Increment a reaction (no auth) |
| `GET` | `/api/posts/[slug]/comments` | Get approved comments |
| `GET` | `/api/vocab-sets/store` | List public vocabulary sets |

### Authenticated Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/posts/[slug]/comments` | Submit a comment |
| `PATCH` | `/api/posts/[slug]/comments` | Toggle like / delete own comment |
| `GET/POST` | `/api/vocab-sets` | List / create vocabulary sets |
| `GET/PUT/DELETE` | `/api/vocab-sets/[id]` | Get / edit / delete a set |
| `POST` | `/api/vocab-sets/store` | Clone a public set |
| `GET` | `/api/vocab-sets/all-terms` | Aggregate all terms across user's sets |
| `GET/POST` | `/api/vocab-stats` | Get / record practice results |
| `GET/POST` | `/api/streak` | Get / record login streak |
| `GET/PATCH` | `/api/profile` | Get / update user profile |
| `GET/PATCH` | `/api/notifications` | Get / mark notifications as read |
| `GET/POST` | `/api/feedback/messages` | Get / submit feedback threads |
| `PATCH` | `/api/feedback/messages/[id]/reply` | Reply to or close a thread |

### Admin-Only Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/admin/posts` | List all posts (including drafts) |
| `GET/PATCH/DELETE` | `/api/admin/posts/[id]` | Get / update / delete post |
| `GET` | `/api/admin/users` | List users with pagination/search |
| `GET` | `/api/admin/users/[id]` | Get user detail |
| `PATCH` | `/api/admin/users/[id]/role` | Change user role |
| `GET` | `/api/admin/vocab-sets` | List admin's own sets |
| `POST` | `/api/uploads` | Upload image (stored in `/public/uploads/`) |

---

## Admin Access

1. Go to `/login` and sign in with the Google account matching `ADMIN_EMAIL`.
2. The `admin` role is assigned automatically on first sign-in.
3. Navigate to `/admin` for the full Writer Studio.

Role can also be changed manually via MongoDB or via `/admin/users` in the UI.

---

## Route Guards

`src/middleware.ts` protects `/admin/*` routes at the Edge:

| Condition | Outcome |
|-----------|---------|
| Not signed in | Redirect to `/login?from=<path>` |
| Signed in, role ≠ `admin` | 403 inline HTML response |
| Signed in, role = `admin` | Pass through |

API routes enforce auth independently via `withAuth` / `withAdmin` wrappers — middleware and API-layer guards are both required (defense in depth).

---

## Production Deployment

See [`PRODUCTION_SETUP.md`](./PRODUCTION_SETUP.md) for the full deployment guide (PM2, Nginx, SSL).
