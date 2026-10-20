# Duy Khánh — Website cá nhân của một giảng viên

> Giảng dạy quản trị, ứng dụng AI và cố vấn doanh nghiệp dựa trên nghiên cứu.
> Live: **[toiladuykhanh.com](https://toiladuykhanh.com)**

---

## Documentation

| Document                                                       | Description                                                                        |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [docs/00-PRODUCT_DIRECTION.md](./docs/00-PRODUCT_DIRECTION.md) | Product boundaries, audiences, and access policy                                   |
| [docs/01-BUSINESS_CONTEXT.md](./docs/01-BUSINESS_CONTEXT.md)   | Product vision, user personas, core business flows                                 |
| [docs/01-ROUTE_MAP.md](./docs/01-ROUTE_MAP.md)                 | Public/learner/admin routes and publish gates                                      |
| [docs/02-ARCHITECTURE.md](./docs/02-ARCHITECTURE.md)           | System design, directory structure, infrastructure decisions                       |
| [docs/03-CODING_STANDARDS.md](./docs/03-CODING_STANDARDS.md)   | API patterns, type safety rules, naming conventions — **read before contributing** |
| [docs/04-ADR_AND_CHANGELOG.md](./docs/04-ADR_AND_CHANGELOG.md) | Architecture Decision Records and refactoring history                              |
| [docs/05-BRAND_BRIEF.md](./docs/05-BRAND_BRIEF.md)             | Current editorial brand and visual direction                                       |
| [docs/09-DESIGN_SYSTEM.md](./docs/09-DESIGN_SYSTEM.md)         | Editorial vs My Class Study Tool visual grammars                                   |
| [docs/06-CONTENT_INVENTORY.md](./docs/06-CONTENT_INVENTORY.md) | Current public content and preserved internal domains                              |
| [docs/areas.md](./docs/areas.md) | Area map (Classroom, Portfolio, Tools) and import rules |
| [docs/10-AI_AGENTS.md](./docs/10-AI_AGENTS.md) | How AI agents are guided here: AGENTS.md, rules, skills, permissions |
| [AGENTS.md](./AGENTS.md) | Rules every AI agent follows in this repo |

---

## Tech Stack

| Layer         | Technology                                                          |
| ------------- | ------------------------------------------------------------------- |
| **Framework** | Next.js 16.1.6 (App Router) + React 19                              |
| **Language**  | TypeScript 5                                                        |
| **Database**  | Hybrid: MongoDB/Mongoose + native MongoClient, PostgreSQL/Prisma 7  |
| **Auth**      | Auth.js v5 (NextAuth beta) — Google OAuth, JWT sessions             |
| **Styling**   | TailwindCSS v4 + `@tailwindcss/typography`                          |
| **Rich Text** | TipTap v3 (15+ extensions)                                          |
| **Build**     | Turbopack (dev) / Webpack (prod)                                    |
| **Runtime**   | Node.js server components/route handlers; no active middleware file |

---

## Local Setup

### 1. Prerequisites

- Node.js ≥ 20
- A MongoDB connection string
- A PostgreSQL database for learning-domain data
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
# MongoDB — auth, users, profiles, posts, messages, inquiries, streaks
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname>

# PostgreSQL — vocabulary, courses, enrollments, progress, My Space tests
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<dbname>

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

| Script                     | Description                                        |
| -------------------------- | -------------------------------------------------- |
| `npm run dev`              | Development server with Turbopack hot-reload       |
| `npm run build`            | Production build                                   |
| `npm run start`            | Serve production build                             |
| `npm run lint`             | ESLint check                                       |
| `npm run typecheck`        | TypeScript check (`tsc --noEmit`)                  |
| `npm run test`             | Run all Vitest projects once                       |
| `npm run test:unit`        | Unit tests only (fast, no DB)                      |
| `npm run test:integration` | Service + API integration tests                    |
| `npm run test:component`   | React hook/component tests (jsdom)                 |
| `npm run test:coverage`    | All tests with coverage report                     |
| `npm run test:e2e`         | Playwright end-to-end smoke tests                  |
| `npm run test:db:setup`    | Create and migrate local test Postgres DB          |
| `npm run check`            | Full gate: typecheck, lint, format, areas, tests, audit, build |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting (CI) |
| `npm run areas:sync` | Regenerate CI area filters from `scripts/areas/areas.mjs` |
| `npm run areas:check` | Verify the area map (CI) |

### Testing prerequisites

- **Unit / component tests:** no external services required.
- **Integration tests:** MongoDB uses MongoDB Memory Server automatically. PostgreSQL tests require an explicit `TEST_DATABASE_URL`; they fail fast and never fall back to a development or production `DATABASE_URL`. Run `npm run test:db:setup` first when using the local PostgreSQL test database.
- **E2E tests:** require a running app locally. GitHub Actions starts the production build and runs the release-critical Playwright specs; a change limited to one area skips the other areas' specs.

See [docs/03-CODING_STANDARDS.md](./docs/03-CODING_STANDARDS.md) §10 for harness conventions.

---

## API Overview

All API responses use a consistent envelope:

```json
{ "ok": true,  "data": <payload> }
{ "ok": false, "error": "<message>" }
```

### Public Endpoints

| Method | Route                         | Description                                            |
| ------ | ----------------------------- | ------------------------------------------------------ |
| `GET`  | `/api/posts`                  | List published posts (pagination, tag/category filter) |
| `GET`  | `/api/posts/[slug]`           | Get single post by slug                                |
| `GET`  | `/api/posts/search?q=`        | Full-text search (≥2 chars)                            |
| `GET`  | `/api/posts/tags`             | All tags in use                                        |
| `GET`  | `/api/posts/categories`       | Predefined + used categories                           |
| `POST` | `/api/posts/[slug]/reactions` | Increment a reaction (no auth)                         |
| `GET`  | `/api/vocab-sets/store`       | List public vocabulary sets                            |

### Authenticated Endpoints

| Method           | Route                       | Description                            |
| ---------------- | --------------------------- | -------------------------------------- |
| `GET/POST`       | `/api/vocab-sets`           | List / create vocabulary sets          |
| `GET/PUT/DELETE` | `/api/vocab-sets/[id]`      | Get / edit / delete a set              |
| `POST`           | `/api/vocab-sets/store`     | Clone a public set                     |
| `GET`            | `/api/vocab-sets/all-terms` | Aggregate all terms across user's sets |
| `GET/POST`       | `/api/streak`               | Get / record login streak              |
| `GET/PATCH`      | `/api/profile`              | Get / update user profile              |

### Admin-Only Endpoints

| Method             | Route                        | Description                                 |
| ------------------ | ---------------------------- | ------------------------------------------- |
| `GET`              | `/api/admin/posts`           | List all posts (including drafts)           |
| `GET/PATCH/DELETE` | `/api/admin/posts/[id]`      | Get / update / delete post                  |
| `GET`              | `/api/admin/users`           | List users with pagination/search           |
| `GET`              | `/api/admin/users/[id]`      | Get user detail                             |
| `PATCH`            | `/api/admin/users/[id]/role` | Change user role                            |
| `GET`              | `/api/admin/vocab-sets`      | List admin's own sets                       |
| `POST`             | `/api/uploads`               | Upload image (stored in `/public/uploads/`) |

---

## Admin Access

1. Go to `/dang-nhap` and sign in with the Google account matching `ADMIN_EMAIL`.
2. The `admin` role is assigned automatically on first sign-in.
3. Navigate to `/admin` for the full Writer Studio.

Role can also be changed manually via MongoDB or via `/admin/users` in the UI.

---

## Route Guards

`src/app/admin/layout.tsx` protects `/admin/*` pages with the server-side Auth.js session:

| Condition                 | Outcome                              |
| ------------------------- | ------------------------------------ |
| Not signed in             | Redirect to `/dang-nhap?from=/admin` |
| Signed in, role ≠ `admin` | Redirect to `/`                      |
| Signed in, role = `admin` | Render the admin page                |

API routes enforce auth independently via `withAuth` / `withAdmin` wrappers — page guards and API-layer guards remain separate defense-in-depth boundaries.

## Project boundaries

- `src/app/`: Next.js routes, pages, layouts, route handlers and route-local client components.
- `src/components/`: reusable UI and marketing primitives.
- `src/features/`: newer vertical slices with schemas, repositories, services and types.
- `src/services/`: established cross-route business services.
- `src/models/`: Mongoose models for Mongo-backed domains.
- `prisma/schema.prisma` and `prisma/migrations/`: PostgreSQL schema and migrations.
- Retired code that used to live in `src/_archived/` is in git history; see [docs/archive/src-archived.md](./docs/archive/src-archived.md).

---

## Production Deployment

See [`docs/deployment/VPS.md`](./docs/deployment/VPS.md) for the app deploy pipeline. Server access, security controls, the change log, and the Nginx baseline live in the private `khanhnd2208/vps-infra` repo (`docs/SECURITY.md` and `docs/SERVER-WEBOFFICIAL.md`).
