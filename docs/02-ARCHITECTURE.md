# 02 — Architecture

> Current architecture of the active application. Historical designs and retired
> routes live under `docs/archive/` (retired source: `docs/archive/src-archived.md`).

## 1. High-level architecture

```text
Next.js App Router (`src/app`)
├── Server Components ───────────────┐
├── Client Components ── fetch ──────┼──> `src/app/api/**`
└── Layouts / route-local UI          │       └── auth + validation
                                     │
                                     └──> services / feature services
                                              ├── MongoDB access
                                              └── Prisma/PostgreSQL access
```

The application uses a hybrid data strategy:

| Domain                                                                                        | Storage    | Main access layer                                                   |
| --------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------- |
| Auth.js users/accounts, profiles, posts, inquiries, messages, streaks                         | MongoDB    | Native MongoClient, Mongoose models and `src/services`              |
| Vocabulary sets, words, library entries, game scores                                          | PostgreSQL | Prisma 7 + `@prisma/adapter-pg`                                     |
| Courses, modules, lessons, enrollments, lesson progress                                       | PostgreSQL | Prisma-backed repositories/services in `src/features`               |
| My Space subjects, MCQ questions, tests, sessions, personal progress                          | PostgreSQL | Prisma-backed repositories/services in `src/features/myspace-tests` |
| My Class courses, knowledge units, question bank, test library, placements, cohorts, attempts | PostgreSQL | Prisma-backed repositories/services in `src/features/my-class`      |

User IDs in PostgreSQL are strings that reference the MongoDB Auth.js user ID;
there is no cross-database foreign key.

## 2. Active directory structure

```text
src/
├── app/                 Next.js pages, layouts and API route handlers
│   ├── admin/           server-guarded Admin Studio
│   ├── api/             HTTP boundary; auth and response wrappers
│   ├── vocabulary/      learner vocabulary UI and game modes
│   ├── hoc/             course/lesson learner surfaces
│   ├── my-space/        personal experiments and MCQ tests
│   ├── messages/, m/    private message management and public unlock view
│   └── public routes     marketing, notes, projects, services, policies, contact
├── components/          UI by area (myclass, teaching, learn, vocab, messages…)
│                        and shared UI: ui/, forms/, site/, admin/, motion/
├── config/              routes, navigation, site metadata and shared constants
├── content/             editorial and marketing content kept separate from UI
├── features/            vertical slices: courses, enrollments, progress,
│                        myspace-tests, my-class, teaching, active-recall,
│                        portfolio, posts, services, and the board games
│                        (board-game-shared, spy-fall, cheese-thief, werewolf)
├── lib/                 auth, database clients, API wrappers, validation and utilities
├── models/              Mongoose schemas for MongoDB-backed domains
├── services/            established business services shared by routes/components
├── types/               DTOs and shared TypeScript declarations
├── utils/               side-effect-free formatting and URL helpers

prisma/
├── schema.prisma        PostgreSQL models and enums
└── migrations/          committed Prisma migration history

src/test/                Vitest setup, database helpers, mocks and fixtures
e2e/                     Playwright tests
scripts/areas/           area map (areas.mjs) and its CI filter generator
```

## 3. Request and data flow

### Server-rendered page

```text
`src/app/**/page.tsx`
  → feature/service function
  → MongoDB or Prisma
  → serializable DTO
  → rendered HTML/RSC payload
```

Server Components should call services directly when no browser interaction is
needed. This avoids an unnecessary internal HTTP request.

### Client interaction

```text
Client Component
  → `fetch('/api/...')`
  → route handler in `src/app/api/**`
  → `withErrorHandling` / `withAuth` / `withAdmin`
  → schema validation and service/repository
  → `{ ok: true, data }` or `{ ok: false, error }`
```

### Authentication and admin access

`src/lib/auth.config.ts` is the shared Auth.js configuration and defines the
JWT/session shape and custom Vietnamese sign-in page. `src/lib/auth.ts` adds the
MongoDB adapter and server-side callbacks. Active page protection is in
`src/app/admin/layout.tsx`; API protection is independent and uses
`src/lib/apiUtils.ts` plus `src/lib/apiAuth.ts`. There is currently no active
`src/middleware.ts`.

The admin role is read from the MongoDB `users` collection during sign-in and
stored in the JWT. The configured admin email is a first-sign-in fallback; the
database role is the source used by normal authorization checks.

## 4. Database clients and boundaries

### MongoDB

- `src/lib/dbConnect.ts`: cached Mongoose connection for application models.
- `src/lib/mongodbClient.ts`: `getMongoClient()`, the cached native `MongoClient` for the Auth.js adapter; a failed connect is retried on the next call.
- `src/models/*.ts`: schemas and model registration guards.
- `src/services/*.ts`: business operations; services return plain serializable data.

The two MongoDB clients are intentional because Auth.js requires a native
MongoClient while application domains use Mongoose.

### PostgreSQL

- `src/lib/prisma.ts`: Prisma 7 singleton using a `pg` pool and `PrismaPg`
  driver adapter.
- `prisma/schema.prisma`: source of truth for relational learning/tool data.
- `src/features/*/repositories`: feature-specific persistence operations.
- `src/services/vocabSetService.ts` and `scoreService.ts`: established Prisma
  services for vocabulary flows.

Run migrations with `npm run db:migrate` locally or
`npm run db:migrate:deploy` in deployment environments.

## 5. Caching, uploads and public content

- Public editorial reads may use Next.js cache/revalidation in the post service.
- Admin mutations revalidate affected public paths where applicable.
- Image uploads are written to `public/uploads/`, suitable for the current
  single-server VPS deployment but not for horizontal scaling.
- Editorial/marketing content is primarily composed from `src/content` and
  feature data; it is not equivalent to the archived `/blog` application.
- Global CSS: `src/app/layout.tsx` loads `globals.css`, which imports the
  `.mc` product theme (`my-class-theme.css`, about 10 KB gzipped). The theme
  stays global on purpose: `/admin`, `/lop`, `/my-space`, `/vocabulary`, and
  shared form components use it, so per-layout imports would save little and
  risk unstyled screens. `learn.css` is route-scoped to `/my-space/courses`.

## 6. Testing harness

Vitest has three projects configured in `vitest.config.ts`:

| Project       | Environment | Scope                                               |
| ------------- | ----------- | --------------------------------------------------- |
| `unit`        | Node        | pure utilities, schemas, scoring and validation     |
| `integration` | Node        | MongoDB Memory Server plus PostgreSQL test database |
| `component`   | jsdom       | React components/hooks and Testing Library          |

Integration setup loads `.env.test` then `.env.local`, starts an in-memory
MongoDB instance, and requires an explicit `TEST_DATABASE_URL` for PostgreSQL;
it never falls back to a development or production `DATABASE_URL`.
`scripts/setup-test-db.sh` creates/applies migrations to the local PostgreSQL
test database.

Playwright tests live in `e2e/`. The GitHub Actions end-to-end job downloads
the production build from the build job and then invokes Playwright. When run
with `CI=true`, its config starts that already-built app; locally,
`npm run test:e2e` expects an already-running app at the configured base URL.
Area ownership is documented in `docs/areas.md`.

## 7. Source-of-truth files

- URL and redirect policy: `src/config/routes.ts`
- Public/admin navigation: `src/config/navigation.ts`
- Site metadata and brand constants: `src/config/site.ts`
- Relational schema: `prisma/schema.prisma`
- API response/auth conventions: `src/lib/apiUtils.ts`, `src/lib/apiAuth.ts`
- Test projects and setup: `vitest.config.ts`, `src/test/`, `playwright.config.ts`
