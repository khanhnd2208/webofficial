# Active Recall usage analytics

Status: implemented in `codex/active-recall-analytics`; migration creation and local testing approved by the user. Production release pending.
Operational behavior and verification: `docs/deployment/ACTIVE-RECALL-ANALYTICS.md`.

## User decisions

- Keep learning available without sign-in.
- Show aggregate usage and the history of individual anonymous visitors.
- Put the report inside Teaching management, with course, class, deck and date filters.

Defaults proposed after the optional session-definition question was interrupted:

- A session covers all Active Recall decks used by one browser until 30 minutes of inactivity.
- Stop accumulating active time after five minutes without interaction, on loss of focus, or when the document is hidden.
- Opening a deck is a visit. Flipping a card, successfully moving to another card, or enabling side-by-side EN/VI text marks it as engaged study. Loading a saved position does not.
- Report calendar dates in Asia/Ho_Chi_Minh. Crossing midnight does not itself create another session.

## Report and metric definitions

Add `/my-space/teaching/recall-analytics`, linked from the Teaching overview and course workspace. A course link preselects its course. Reuse Teaching styles and its admin-only layout; enforce admin authorization in every report data entry point as well.

The default range is the last 30 calendar days including today. Offer 7, 30, 90 and 365 days and an inclusive custom date range limited to 366 days. Validate filters on the server and preserve them in the URL. Include zero-activity dates in charts.

Display:

- Unique anonymous browsers that visited, unique browsers that engaged, engaged sessions, active study time, and returning engaged browsers.
- Daily chart for engaged browsers, engaged sessions and active minutes, with an accessible data table.
- Deck usage table: opens, engaged sessions, engaged browsers, active minutes and answer reveals.
- Paginated visitor table: short anonymous label, first/last observed visit, engaged days, engaged sessions and active minutes within the selected filters.
- Selecting a visitor opens their session history with start/end activity, decks, class-link context, engagement and active time. Paginate history; never expose it publicly.

An engaged session is counted once across the selected decks/classes, even if several match. For daily charts count a session on each day it actually engaged; label this explicitly because summed daily sessions can exceed distinct sessions for the range. Returning browsers have engagement before the range start and again within the range. Engaged days are distinct local dates with a qualifying study interaction. Active time starts at the first qualifying study interaction and can continue for up to five minutes after the latest interaction.

Class attribution means the visit used that class's public link; it does not establish class membership. Direct deck access has a separate “Không qua link lớp” category. Counts refer to browsers, not verified people. There is no reliable historical backfill: collection starts after release.

## Collection and interfaces

Keep the feature in the Classroom area under Active Recall. Do not import Learn's Portfolio feature; its existing tracker is a reference for behavior only. Do not send visitor identifiers or learning history to Umami.

Add public POST endpoints under `/api/active-recall/study` using `withErrorHandling` and the existing response envelope:

- `begin`: accepts deck ID, optional class slug, random tab/client ID and a per-mount visit ID. Resolves or creates the browser identity and current session; validates publication and public class/deck availability using the same conditions as public pages. Returns session/visit IDs, sequence acknowledgement and timer ownership. Repeating the same begin request does not add another open.
- `heartbeat`: accepts the session/visit/client IDs, increasing sequence number, bounded active-time increments, answer-reveal and qualifying-interaction increments, and an optional ownership release. Resolve visitor ownership from the cookie, never a body-supplied visitor ID. Server timestamps are authoritative; validate the current deck/class context again.
- Admin GET `/api/admin/active-recall/analytics`: validated date/course/class/deck/visitor filters and page. Uses `withAdmin`; returns overview, daily series, deck summary, visitor page and optional visitor session page. Reuse the same report service for server rendering.

The identity is a cryptographically random first-party HttpOnly cookie, Secure in production, SameSite=Lax, path `/`, lasting 365 days. Store a SHA-256 hash as the internal visitor key; show a separate random public label in reports. Use no fingerprinting, IP history, names or email. Signing in does not change this browser identity or merge devices. Exclude authenticated administrators from collection, including classroom presentations.

Validate same-origin writes, reject oversized/invalid bodies, and bound request frequency and accepted increments. Rate-limit telemetry using the project's existing patterns without a new dependency; abuse controls cannot make client-reported behavior independently verified. The report should describe time as recorded active time.

Integrate a small tracking hook into the public ActiveRecallPlayer on both direct and class routes. Pass class context explicitly from the class page. Handle mouse, keyboard and touch through the shared semantic actions. Navigating against the end of the deck is not a card move; answer-to-question flips are not answer reveals. Restoring side-by-side EN/VI state does not count as a fresh reveal.

Send batches every 60 seconds and on hide/navigation using keepalive. Retry the same sequence after transient failure; bound the in-memory queue to five batches. Do not persist an offline event log. A closed page may lose its final unacknowledged batch. Tracking failure must never prevent study or resume-state storage.

Maintain one server-side timer owner per visitor with a two-minute lease. Release on hide/blur/unmount and reacquire on focus; a different tab waits for release or lease expiry. Do not accumulate time while ownership is absent. Use atomic updates and server elapsed-time limits to prevent duplicate time across tabs, retries, delayed timers or concurrent requests. Do not advance session activity from idle heartbeats. Reopening after 30 minutes creates a new session on the server even if a stale client retained its ID.

## Proposed additive persistence

The following additive persistence was approved by the user:

- `RecallVisitor`: hashed identity key, report label, first/last seen, current session ID. Serialize session selection on this row so concurrent tabs cannot create duplicate current sessions.
- `RecallStudySession`: visitor, started/last activity/first engagement timestamps. Sessions are global to Active Recall, not per deck.
- `RecallStudyVisit`: idempotency/visit ID, session, client ID, deck/course/class identifiers and title snapshots, opened/last activity/first engagement, acknowledged sequence. This preserves deck context through navigation and retries.
- `RecallStudyBucket`: visit and local calendar date, opens, qualifying interactions, answer reveals and active seconds. Unique visit/day; transactional increments share the visit sequence check. Server-validated time is split across midnight rather than assigned entirely to the receiving day.
- `RecallStudyLease`: visitor, session, visit/client owner, expiry and last accepted timing boundary. Unique visitor.

Index session history by visitor/start and daily reporting by day/course/class/deck. Keep source identifiers as historical snapshots without cascading deletion from content; retain foreign keys within analytics itself. Query aggregates in PostgreSQL and paginate details rather than reading all visits into application memory. Retain collected history in v1; no automatic deletion job is introduced.

Register new public API routes in the Classroom area map and synchronize it. Extend the Prisma client generation marker for the new models. No new package is required. Show a brief explanation of anonymous usage measurement on the player and its limitations in the report.

## Verification and delivery

- Unit: idle/session boundaries, midnight splitting, report dates and zero-filled days, metric deduplication and filter parsing.
- Component: flip/move/split actions, restore without false events, keyboard/touch paths, focus/visibility, idle resume, transient network failure, blocked storage and unmount cleanup.
- Integration against local PostgreSQL: concurrent begin, retry idempotency, duplicate/out-of-order sequences, stale sessions, foreign visitor ownership, multi-tab leases, unavailable decks/classes, admin exclusion and authorization, date and class attribution, paginated reports.
- End-to-end: unsigned visitor studies through direct and class links, returns in the same browser, admin sees accurate history, public visitor cannot open reports, and mobile layout remains usable.
- Run typecheck, lint with zero warnings, format check, area check, unit/component/integration suites and production build. Report unavailable environments or failed unrelated checks explicitly.
- Work only in `codex/active-recall-analytics` and its dedicated worktree. The current worktree is based on `origin/main` at `fb60486`.
- Migration creation and local testing were explicitly approved under AGENTS.md rule 5. Apply only to the local test database during verification. Production rollout follows the normal reviewed deployment pipeline after separate authorization to merge/deploy.
