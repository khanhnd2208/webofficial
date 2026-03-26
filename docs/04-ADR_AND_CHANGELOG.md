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
