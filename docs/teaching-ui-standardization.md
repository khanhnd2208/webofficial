# Teaching UI standardization

Implemented on `codex/teaching-ui-standardization`, based on `origin/main`.

## Ownership and extension

Teaching is the first destination with an explicit surface identity. Shared accessibility and interaction primitives remain in `components/ui`; the destination owns its palette, icon vocabulary and presentation components. Introduce another surface by extending `SurfaceName`, providing its scoped tokens, and passing the surface context to overlays. Never apply destination tokens to `body` or change a global theme on navigation.

- `SurfaceTheme` scopes pages with `data-surface="teaching"` and carries the identity through React context to menus, grid editors, dialogs and mobile sheets.
- `components/teaching/ui/styles/tokens.css` owns ivory/teal colors, state colors, radii, motion and compatibility variables for existing studio primitives.
- `styles/components.css` owns destination components and responsive refinements. `workspace-1.css` through `workspace-4.css` preserve the original Teaching rule order after extraction from global styles; `groups.css` owns group views. All selectors are scoped.
- `TeachingMark` is the shared destination mark for the contents page and My Space. `TeachingIcon` supplies typed 24px round-stroke task icons. SVGs are code assets, with no icon dependency; meaningful controls require accessible names.
- `TeachingSectionHeading`, `TeachingEmpty`, `TeachingStatus` and `TeachingToolbar` establish reusable hierarchy, state presentation and action grouping.
- The student Learning Experience styles are split between access/layout and choices modules. Photographs remain content; decorative gradients and image backdrops were removed.
- `ActiveRecallPlayer` accepts an optional Teaching surface only on the class route. Independent Active Recall keeps its existing presentation.

## Screen behavior

Active classes precede courses. The course list is compact: a row shows the code, name, class count, deck count and menu. Courses with an active class sort first, then by latest update. Courses with neither a class nor a deck sit in a collapsed group. Status chips count active, archived and all courses; "Đang dạy" counts `ACTIVE` courses. Create class stays the primary entry action. Learner-facing copy says "sinh viên". The management menu retains setup, student-page and export actions; on a phone the trigger shows the word "Quản lý" and opens a bottom sheet.

The attendance score column reads "Chuyên cần" and is wide enough that the heading and score are not clipped. Only the current week shows "Chưa chốt" and the full date control. A future week without a date is `W4` plus a control labelled "Thêm ngày W4".

The public class header is one line of course, class and term. Tabs use the same Vietnamese names as the instructor workspace. "Đây là tôi" stores the chosen enrollment id in localStorage for that class slug and that browser, pins the row, and can be cleared. Blocked storage does not break the page. The table still scrolls the current week into the gap between the sticky name and score columns.

The gradebook toolbar groups tutorial, week, search and saving feedback. The week selector uses the existing selection and URL contracts, including clearing a week; tab changes retain the current week. Identity columns and headers remain sticky inside the table scroll area. Student cards allow long names without widening the mobile page. Import steps describe the existing source, reconciliation and result states without introducing another workflow.

Student class pages inherit the same light theme with more reading space. Tab navigation respects reduced motion. Portal panels receive the destination tokens without changing the surrounding website. Existing permissions, persistence, feature flags, service APIs and unsaved-change guards are retained.

## Verification record

- Typecheck, ESLint with zero warnings, formatting, area ownership and production build.
- Unit suite: 732 tests. Component suite: 298 tests.
- Teaching regression suite: 27 tests across Chromium, WebKit, mobile Chrome and mobile Safari. Covers class creation/import, notes, recall, public permissions, groups, sessions, attendance/CP autosave and failed-save recovery, sticky columns, mobile sheets, learning access and concurrent device sessions.
- Additional surface regression captures home, course, attendance, CP, students, setup, notes, recall, sharing, public class, learning access and class recall player at 360, 390, 768, 1280 and 1440px. It checks page overflow, light scoped background, week/tab URLs, overlay tokens, focus restoration and destination isolation.
- Before/after image artifacts are delivered separately; only synthetic local API fixtures are used.

No integration suite is required: services, repositories, models and API routes were not changed. No migration or dependency was added. No merge or deployment was performed.

The public My Class route is currently blocked by its existing availability policy (404), so its live page appearance cannot be confirmed in this environment. Its stylesheet and shared component regressions remain checked. Full screen-reader review, manual browser zoom, exhaustive contrast coverage of every state, and the production environment remain unverified. Core text and accent token contrast is checked separately in the review artifact (4.52:1–12.65:1). Active Recall additionally passed 4 E2E tests; 2 existing seeded-deck tests were skipped because those published fixtures were unavailable. The surface test creates its own published deck and verifies flipping, advancing and reduced motion.
