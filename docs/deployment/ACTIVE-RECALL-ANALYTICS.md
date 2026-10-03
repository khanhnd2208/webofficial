# Anonymous Active Recall analytics

Admins open `/my-space/teaching/recall-analytics` from Teaching or a course's workspace. Course links preselect the course. The report includes date, course, class source and deck filters, anonymous visitor history, daily charts with accessible tables and pagination.

## Definitions

- Identity is a random first-party HttpOnly cookie valid for 365 days. PostgreSQL stores its hash and a separate public report identifier. No account/device merging or fingerprinting is used.
- A session includes all Recall decks used by that browser until 30 minutes without activity. Midnight does not create another session.
- Each player mount is an open. Retrying its begin request is idempotent; reloading creates another open in the same session.
- Flipping, successfully navigating a card or enabling side-by-side EN/VI text establishes study engagement. Restoring saved state does not establish engagement. Answer-to-question flips do not increase answer reveals.
- Time starts after the first engagement acknowledgement, while the document is visible and focused and interaction occurred in the last five minutes. Browser timing is approximate and server-bounded. A two-minute server lease grants one tab timer ownership; hide/blur releases it.
- Engaged days and sessions require qualifying study actions within the selected range and filters. A session with actions on two dates counts on both daily rows, but once in the range total.
- Returning visitors have qualifying actions before the range and again inside it, under the same content filters. Visitor first/last timestamps refer to the browser's complete recorded history. Counts and duration use the selected range.
- Class source comes from the actual class route. It does not prove membership. Direct access has the “Không qua link lớp” source.
- Logged-in administrators are excluded from collection. Other signed-in users retain the same anonymous browser identity.

A cleared cookie, another device or private browsing may create another visitor. Time does not prove attention or learning outcomes. Offline use and abrupt closure can lose telemetry, especially the last batch. There is no retrospective reconstruction from Nginx requests or local resume state.

## Storage and request safety

Migration `20261003120000_recall_study_analytics` adds `RecallVisitor`, `RecallStudySession`, `RecallStudyVisit`, `RecallStudyBucket` and `RecallStudyLease` plus indexes/analytics foreign keys. It does not modify existing course, card or learner rows. Visit snapshots retain course/deck/class names after content changes or deletion. History has no automated expiry in this release.

Public POST routes `/api/active-recall/study/begin` and `/heartbeat` require same-origin requests, bounded JSON, ownership cookies, public deck/class access and valid counters. They use the existing Mongo-backed scoped request limiter (short-lived window HMACs, not raw IP storage), with 120 begin/600 heartbeat requests per IP/minute. The existing auth/rate-limit secret configuration is sufficient. Heartbeats use transactional sequence acknowledgement and visitor locking to avoid concurrent or retry double counts. Requests cannot supply another browser's ownership key.

GET `/api/admin/active-recall/analytics` and the server report service both require admin access. Responses are uncached. Filters are `start`, `end` (inclusive Vietnam dates, maximum 366 days), `course`, `class` (`direct` or class ID), `deck`, `visitor` (public report UUID), `page` and `historyPage`. Default date range: last 30 days including today; page size: 25. Reports aggregate PostgreSQL data within a repeatable-read snapshot.

The browser sends batches every 60 seconds and on hide/exit. It retries unchanged sequence numbers and bounds its queue to five batches. Tracking never writes browser storage or sends learning contents to Umami.

## Local verification and rollout

The user approved migration creation and local testing in this chat. Local checks must use an explicitly isolated local `TEST_DATABASE_URL`. Never use a production URL for tests.

Run the normal typecheck, lint, formatting, area map, unit/component/integration and build checks. Focused database tests are in `src/features/active-recall/analytics/collection.integration.test.ts`; browser E2E is `e2e/active-recall-analytics.spec.ts` and requires a local app with an isolated test database and matching `AUTH_SECRET`. It creates its own content through admin APIs and removes that fixture only through an explicitly local test database connection, because published content is protected from destructive admin deletion.

Deploy through the standard reviewed pipeline after permission to merge/deploy. The previous app tolerates the additive schema. After deployment check migration status, readiness, unsigned direct/class player tracking, repeated-browser history, admin exclusion and denial of guest report access. An empty report is expected until tracking receives the first new visit. No migration or deployment was applied on the VPS during implementation.

## Build compatibility

The installed Next.js 16.3.6 Turbopack compiler fails resolving existing Google fonts locally. The build command now uses supported Webpack without changing dependencies. Shared API wrappers expose a required route context overload for Next.js generated validation while preserving one-argument test callers. The server sanitizer is externalized so jsdom reads its resources from the installed package.

The production build and its generated TypeScript checks pass. The analytics Chromium scenario also passes against `next start` without copying jsdom resources or using dev-only workarounds.

## Implementation verification results

- Full unit suite: 119 files / 764 tests passed; updated route boundary tests were rerun after route typing changes.
- Final full component suite: 77 files / 323 tests passed, including early interaction buffering, StrictMode, focus-claim queue draining, EN/VI reveal semantics and idle tracking.
- Full integration suite: 22 files / 180 tests passed; all eight Recall database scenarios were rerun after the final server changes.
- Browser E2E: two consecutive Chromium runs passed, including cookie reuse, one browser/session across direct and class routes, actual elapsed time, class attribution, admin exclusion, guest denial, visitor history and a 390px viewport. Desktop/mobile screenshots were inspected.
- Lint with zero warnings, format check, area check and diff whitespace check passed.
- Final typecheck (including generated route validators), production build and dependency audit (zero vulnerabilities) passed.
- Migration was applied only to PostgreSQL at the local test endpoint. Test fixture rows were removed; the temporary test MongoDB and dev server were stopped. No push, merge or production deployment was performed.
