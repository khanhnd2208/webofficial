# Course interaction reports

Admins open `/admin/learn-analytics` from the admin sidebar or dashboard. The course selector reads `LearnCourse`, including archived courses, so historical reports remain accessible. HRM and ITM use the same tracker and are isolated by course ID. Use `?course=hrm` or `?course=itm` for a direct link.

## Meaning of the figures

- Visitors are distinct signed-in accounts with a session starting, or study time recorded, within the selected Vietnam calendar days. A session crossing midnight remains included when it records time in the new day.
- A visit starts on the course overview or reader. After 30 minutes without activity, the next active visit starts a new session. Opening only the overview records a visit with zero study time.
- Active learners have positive recorded time inside a course section. Admin browsing is excluded by the course page.
- Time is an estimate of active reading/interaction: the section must be visible, the window focused, and the last interaction less than five minutes ago. Opening a page counts as initial activity. Scrolls inside reading panes, pointer presses and keys extend this window.
- One account can own only one active timer, including across courses, devices and duplicated tabs. A background or idle tab releases ownership; a crashed tab's lease expires after two minutes.
- Reports aggregate a consistent PostgreSQL snapshot. Current completion progress is all-time; time and visit figures use the chosen date filter. The learner table is paginated in groups of 50; totals include all accounts.
- No historical activity can be reconstructed before tracking was deployed. Network failure, abrupt shutdown and browser scheduling can undercount time, particularly the last heartbeat (normally every 60 seconds). These figures do not prove attention or learning outcomes.

## Daily and learner drill-down

The daily report includes every Vietnam calendar day in the selected range, including days with no recorded time. It shows distinct active accounts, distinct sessions with study time, total seconds and the average per active account. A session touching multiple sections counts once per day; a session crossing midnight may count on both days. Zero means no recorded time, including dates before tracking began.

Select a learner name to open the `user` drill-down on the same admin page. It shows daily time, sections studied that day, active days, average time per active day and paginated visits (20 per page via `sessionPage`). Both totals and visit durations use only buckets within the selected course, account and date range. Overview-only visits remain visible with zero time. Session timestamps describe the entire visit and may start before the selected range; their elapsed span must not be presented as active study time. Missing history returns an empty state. Student and guest authorization is checked before either report query.

Existing storage cannot reconstruct hourly active durations or precise first/last study timestamps per day. No hourly distribution is inferred from visit starts. This drill-down requires no database migration.

## Storage and deployment

`LearnStudySession` stores one row per visit. `LearnStudyBucket` stores one aggregate per session/section/Vietnam day; heartbeats update these rows, rather than adding event logs. `LearnStudyLease` is a reusable ownership row per account. No mouse coordinates, keystroke contents, IP addresses or detailed event stream are stored. The admin report resolves names/emails from the existing user directory.

Migration `20260926100000_learn_study_analytics` is additive and compatible with the previous application release. Use the canonical `scripts/deploy-vps.sh` workflow, which backs up the databases before migration and checks the candidate before promotion. Existing course content is not reseeded. There is no automatic deletion of analytics history in this version.

## Verification

The regression suite covers database isolation between courses, identity/progress lookup, pagination, request retries, server time limits, concurrent/duplicated tabs, ownership handover, idle session expiry, foreign-course rejection, Vietnam midnight, renamed/deleted sections, reader navigation, hidden/idle timers, and admin/student/guest access.

Run the normal CI gates. Targeted checks:

```bash
npx vitest run --project integration src/features/learn/studyAnalytics.integration.test.ts
npx vitest run --project component src/components/learn/LearnStudyTracker.test.tsx src/app/admin/learn-analytics/page.test.tsx
```

Integration tests require the isolated `TEST_DATABASE_URL` and applied migrations. After deployment, verify the migration status, liveness/readiness, authenticated HRM and ITM reports, and denial of report access to guests and students. Empty reports are expected until the first learner visits after deployment.
