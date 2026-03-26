# 04 — Architecture Decision Records & Changelog

> This document captures *why* key architectural decisions were made.  
> Format: **ADR-NNN** — Decision → Context → Rationale → Consequences.

---

## ADR-001 — Auth.js Split Config (Edge + Node.js)

**Date:** Project inception  
**Status:** Active

**Decision:** Split Auth.js configuration into `auth.config.ts` (edge-safe) and `auth.ts` (Node.js full).

**Context:** Next.js Middleware runs in the **Edge Runtime**, which forbids Node.js-only modules (crypto, net, tls, mongoose). Auth.js's `MongoDBAdapter` uses the native MongoDB driver which requires Node.js. We need both: a middleware that guards routes AND a full auth handler that writes sessions to MongoDB.

**Rationale:** This is the officially documented Auth.js v5 pattern for edge compatibility. `auth.config.ts` contains only the Google provider setup and cookie/session options — no external I/O. `auth.ts` extends it with the MongoDB adapter and `jwt`/`events` callbacks that query the database.

**Consequences:**
- `middleware.ts` imports from `auth.config.ts` only — stays edge-safe.
- API routes and server components import from `auth.ts` — full power, Node.js runtime.
- Cookie names/options are duplicated across both files and **must be kept in sync manually**.

---

## ADR-002 — Dual MongoDB Client (Mongoose + Native MongoClient)

**Date:** Project inception  
**Status:** Active

**Decision:** Maintain two separate MongoDB connection objects — Mongoose (`dbConnect.ts`) for application data and the native `MongoClient` (`mongodbClient.ts`) for the Auth.js adapter.

**Context:** Auth.js's `MongoDBAdapter` requires a native `MongoClient` instance. All application models (Posts, Users, VocabSets, etc.) use Mongoose ODM for schema validation, middleware hooks, and type-safe queries.

**Rationale:** Forcing Mongoose to share its internal connection with the adapter would require extracting the underlying driver connection — a fragile coupling. Keeping two pools (max 10 connections each) is simpler and avoids cross-framework interference. On a free-tier Atlas cluster this is acceptable; revisit if pool count becomes a concern.

**Consequences:** Two connection pools to monitor. Both use the global cache pattern (`global._mongoClientPromise`, `global.mongoose`) to prevent exhausting connections during Next.js hot-reload in development.

---

## ADR-003 — Centralized API Wrappers (`apiUtils.ts`)

**Date:** Phase 3 Refactoring (2026-03-19)  
**Status:** Active

**Decision:** All API route handlers must use `withAuth`, `withAdmin`, or `withErrorHandling` higher-order functions from `src/lib/apiUtils.ts` instead of writing inline `try/catch` and auth checks.

**Context:** Before this change, all 27 API route files contained identical boilerplate:

```typescript
// This exact pattern was copy-pasted 27 times:
export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser(request);
    if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    // ... actual logic
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
```

Additionally, some admin routes used `auth()` directly while others used `isAdmin()` from `apiAuth.ts`, creating two different auth check paths for the same purpose.

**Rationale:** DRY (Don't Repeat Yourself). Centralizing auth + error handling means:
1. Security fixes (e.g., changing the 401 message) apply to all routes simultaneously.
2. Adding new cross-cutting concerns (rate limiting, logging) requires changes in one place.
3. Route handlers contain only business logic — easier to read and test.
4. Consistent response format is enforced structurally, not by convention.

**Consequences:**
- All route exports changed from `export async function GET(...)` to `export const GET = withAuth(...)`.
- Route handlers no longer receive `{ params }` as a second argument — they receive `context` and must `await context!.params`.
- The `!` non-null assertion on `context` is required for dynamic routes because `withErrorHandling`/`withAuth`/`withAdmin` type `context` as optional (it's absent for non-dynamic routes).

---

## ADR-004 — Unified API Response Envelope `{ ok, data/error }`

**Date:** Phase 3 Refactoring (2026-03-19)  
**Status:** Active

**Decision:** Every API response must be wrapped in `{ ok: true, data: T }` or `{ ok: false, error: string }`. No bare data responses, no `{ success, role }` ad-hoc shapes.

**Context:** Before Phase 3, admin user routes returned bare shapes like `{ error: 'Forbidden' }` (no `ok` field) or `{ success: true, role }` (no `data` wrapper), while all other routes used `{ ok: false, error }`. Client code had to handle both.

**Rationale:** A consistent envelope lets every fetch call use the same check:
```typescript
if (!json.ok) { /* handle error */ }
const data = json.data;
```
This eliminates defensive checks like `if (json.error || !json.success)` scattered through client components.

**Consequences:** `UserDetailPanel.tsx` was updated to unwrap `json.data` after the admin user detail route changed from returning bare data to `{ ok: true, data: detail }`.

---

## ADR-005 — Nullish Coalescing (`??`) for Mongoose Model Registration

**Date:** Phase 3 Refactoring (2026-03-19)  
**Status:** Active

**Decision:** All Mongoose model registration guards use `??` (nullish coalescing), not `||` (logical OR).

**Context:** The standard Next.js pattern for preventing model re-registration during hot-reload is:

```typescript
const Model = mongoose.models.ModelName || mongoose.model('ModelName', Schema);
```

Before Phase 3, approximately half the model files used `||` and half used `??`. This inconsistency was identified during audit.

**Rationale:** `||` is a **falsy check** — it falls through on `0`, `''`, `false`, or `null`. `??` is a **nullish check** — it only falls through on `null` or `undefined`. A registered Mongoose model is a real object and will never be falsy, so the behaviors are equivalent here. However:
1. `??` is semantically more precise (we want to check "not yet registered", not "not truthy").
2. Consistency across all model files prevents future confusion or bugs if the pattern changes.
3. Using `??` everywhere makes the intent explicit: "use the cached model if it exists, otherwise create it."

**Consequences:** All 8 model files updated. No runtime behavior change.

---

## ADR-006 — Centralized Constants (`src/config/constants.ts`)

**Date:** Phase 3 Refactoring (2026-03-19)  
**Status:** Active

**Decision:** All magic numbers (pagination limits, content length caps, TTLs, polling intervals, file size limits) must be defined in `src/config/constants.ts` and imported by name.

**Context:** Before Phase 3, numbers like `2000` (term limit), `5 * 1024 * 1024` (upload size), `30000` (notification polling) appeared inline in multiple files — schema validators, API routes, and client components — with no documentation of their meaning.

**Rationale:**
- A magic number like `500` in `WordStatsSchema` — is that "max history entries" or "max words"? Named constants are self-documenting.
- Changing a limit (e.g., raising max terms to 3,000) requires finding and updating every occurrence. With a named constant, it's a one-line change.
- Named constants can be shared between the schema validator *and* the client-side UI that enforces the same limit.

**Consequences:** Any new limit or configuration value must be added to `constants.ts` first, then imported. Inline magic numbers in schema files, API routes, or components are a code smell.

---

## ADR-007 — Navigation as Configuration (`src/config/navigation.ts`)

**Date:** Phase 3 Refactoring (2026-03-19)  
**Status:** Active

**Decision:** Navigation link arrays (`NAV_LINKS`, `USER_MENU_LINKS`) are defined once in `src/config/navigation.ts` and imported wherever needed.

**Context:** Before Phase 3, `Navbar.tsx` contained a hardcoded `NAV_LINKS` array inline. Any component needing the same links (e.g., a mobile menu, a sitemap, breadcrumbs) would have to duplicate the array or import from `Navbar.tsx` (creating a component-as-data dependency).

**Rationale:** Navigation is configuration, not UI logic. Extracting it makes the data shareable and avoids coupling the data definition to any particular UI component.

**Consequences:** `Navbar.tsx` now imports `NAV_LINKS` from `@/config/navigation`.

---

## ADR-008 — PostgreSQL for Personality Test Module (Hybrid DB Strategy)

**Date:** 2026-03-26  
**Status:** Active

**Decision:** The Personality Test module uses **PostgreSQL** for all data storage (sessions, responses, results), while every other feature continues using MongoDB/Mongoose.

**Context:** The Personality Test module handles structured survey data with:
- Fixed schema (57 questions, 5 demographic fields, denormalized scores)
- Percentile calculations requiring cross-session aggregation (`PERCENT_RANK()`)
- ACID transactions (session + 57 response rows inserted atomically)
- Relational integrity (sessions → responses → results via foreign keys)

MongoDB's document model works well for flexible content (blog posts, vocab sets), but relational survey data benefits from SQL's strengths: aggregation functions, `ON CONFLICT` upserts, window functions, and referential integrity constraints.

**Rationale:**
1. **Structured data** — personality test responses have a fixed, predictable schema. SQL tables with proper types (`SMALLINT`, `NUMERIC(4,2)`, `JSONB`) are more efficient than schemaless documents.
2. **Aggregation** — percentile calculation uses `PERCENT_RANK() OVER (ORDER BY score)` which is native SQL. Doing this in MongoDB requires `$setWindowFields` (available but less ergonomic).
3. **Transactions** — inserting a session + 57 responses atomically is a natural fit for SQL transactions. MongoDB transactions require replica sets.
4. **PostgreSQL already available** — the VPS already runs PostgreSQL 16 for another project (`chijuly_erp`).

**Implementation:**
- `src/lib/pgPool.ts` — Singleton connection pool (reads `DATABASE_URL` or `PG_*` env vars)
- `src/lib/pgMigrate.ts` — Standalone migration script (run via `npx tsx`)
- `src/models/PersonalityTest.ts` — Data access layer (replaces Mongoose model)
- 3 tables: `personality_test_sessions`, `personality_test_responses`, `personality_test_results`
- VPS database: `khanhwebsite` on `localhost:5432`, user `khanhwebsite`

**Consequences:**
- Two database connections to maintain (MongoDB pool + PG pool)
- `pg` + `@types/pg` added to dependencies
- `.env.local` requires `DATABASE_URL` for PostgreSQL
- Migration must be run manually: `DATABASE_URL=... npx tsx src/lib/pgMigrate.ts`
- No ORM — raw SQL via `pgPool.query()` for maximum control and transparency

---

## ADR-009 — Demographic Data Collection in Personality Test

**Date:** 2026-03-26  
**Status:** Active

**Decision:** Collect 5 demographic fields (full name, university, student year, cumulative GPA, self-rated intelligence) before personality test questions, stored alongside test session data.

**Context:** The personality test serves a dual purpose: (1) a fun personality assessment tool for users, and (2) an academic research survey. The demographic fields align with a Google Forms-based survey instrument used in organizational behavior research.

**Rationale:** Collecting demographics enables:
1. Cross-tabulation of personality scores by university, year, GPA — research value.
2. Correlation analysis between self-rated intelligence and actual personality traits.
3. The tool functions as both a standalone personality test AND a structured survey.

**Implementation:**
- `DemographicData` interface in `types/personalityTest.ts`
- Dedicated "demographics" phase in `PersonalityTestWizard.tsx` (between intro and BFI questions)
- Stored in `personality_test_sessions` table columns (not a separate table — one-to-one with session)
- Validation: fullName required, GPA 0-4.0, intelligence 1-10, studentYear 1-5

**Consequences:** Users must fill demographics before starting the test. All fields except fullName could potentially be made optional in the future without schema changes (columns already allow NULL).

---

## Phase 4 — Personality Test Module + PostgreSQL Migration

**Date:** 2026-03-26  
**Scope:** New feature module + database migration

### Files Created

| File | Purpose |
|------|---------|
| `src/lib/pgPool.ts` | PostgreSQL connection pool singleton |
| `src/lib/pgMigrate.ts` | Migration script — creates 3 tables + trigger |
| `src/lib/personalityScoring.ts` | BFI-2-S + SD3 scoring engine (57 questions, attention checks, archetypes) |
| `src/models/PersonalityTest.ts` | PostgreSQL data access layer (queries, transactions) |
| `src/services/personalityTestService.ts` | Business logic + DTO conversion |
| `src/types/personalityTest.ts` | All TypeScript types (DemographicData, QuestionConfig, DTOs, etc.) |
| `src/app/api/personality-test/route.ts` | GET (config+history) + POST (submit with demographics) |
| `src/app/api/personality-test/[id]/route.ts` | GET specific test session result |
| `src/app/personality-test/page.tsx` | Server component — test page |
| `src/app/personality-test/results/[id]/page.tsx` | Server component — results page |
| `src/components/personality-test/PersonalityTestWizard.tsx` | Multi-phase test UI (demographics → BFI → SD3 → review) |
| `src/components/personality-test/PersonalityTestClient.tsx` | Client orchestrator |
| `src/components/personality-test/PersonalityResultsDashboard.tsx` | Results visualization |
| `src/components/personality-test/PersonalityTestHistory.tsx` | Past test sessions list |

### Dependencies Added

| Package | Purpose |
|---------|---------|
| `pg` | PostgreSQL client library |
| `@types/pg` | TypeScript types for pg |

### Database (PostgreSQL)

| Table | Purpose |
|-------|---------|
| `personality_test_sessions` | Session metadata + demographics (uuid PK, user\_id, 5 demographic columns) |
| `personality_test_responses` | Individual answers (session\_id FK, test\_type, item\_number, value, form\_order) |
| `personality_test_results` | Denormalized scores, percentiles, archetype JSONB (session\_id FK UNIQUE) |

### VPS Deployment

- PostgreSQL database `khanhwebsite` created with user `khanhwebsite`
- `DATABASE_URL` added to `/var/www/webofficial/.env.local`
- Migration run successfully — 3 tables + trigger created
- App built and restarted via PM2

---

## Phase 3 Refactoring — Summary Changelog

**Date:** 2026-03-19  
**Scope:** Codebase-wide standardization after system assessment scored 6.3/10.

### Files Created

| File | Purpose |
|------|---------|
| `src/lib/apiUtils.ts` | `withAuth`, `withAdmin`, `withErrorHandling`, `apiSuccess`, `apiError` |
| `src/config/constants.ts` | All magic numbers and application limits |
| `src/config/navigation.ts` | `NAV_LINKS`, `USER_MENU_LINKS` |
| `src/utils/formatNumber.ts` | `formatNumber()` extracted from `page.tsx` |
| `src/types/mongoose.ts` | `LeanDoc<T>`, `WithId<T>` type utilities |
| `docs/` | This documentation directory |

### Files Modified

| File | Change |
|------|--------|
| `src/utils/formatDate.ts` | Added `timeAgo` alias, `formatDateShort()` |
| `src/utils/index.ts` | Added `formatNumber` to barrel export |
| `src/app/page.tsx` | Replaced inline `formatDate`/`formatNumber` with shared util imports |
| `src/components/Navbar.tsx` | Replaced inline `NAV_LINKS` and `timeAgo()` with shared imports |
| **All 8 model files** | `\|\|` → `??` in model registration pattern |
| **26 API route files** | Refactored to use `withAuth`/`withAdmin`/`withErrorHandling` wrappers |
| `src/app/admin/users/UserDetailPanel.tsx` | Updated to unwrap `json.data` after admin user route format change |

### Net Impact

- **~800+ lines removed** (boilerplate auth checks and try/catch blocks)
- **0 TypeScript errors** after refactoring
- **`npx next build` passed** — all 27 API routes and all pages compiled successfully
