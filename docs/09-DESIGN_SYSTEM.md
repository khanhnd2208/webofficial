# 09 — Design System

**Status:** active
**Last updated:** 2026-10-05

This site has **four named surfaces** with separate visual grammars. Each owns its layout language and palette; accessibility and interaction contracts are shared.

| Surface | Routes | Grammar |
| --- | --- | --- |
| **Editorial** | `/`, `/muc-luc`, `/gioi-thieu`, `/du-an`, marketing | Hairline bands, serif display, generous whitespace, rare cards |
| **Admin Studio** | `/admin/**` shell and active admin pages | Light blue-gray canvas, white panels, Inter, task-focused data controls |
| **My Class Product UI** | `/my-space/my-class/**`, `/admin/my-class/**` | Material 3 Indigo surfaces, Inter throughout, efficient learning and studio work |
| **Teaching** | `/my-space/teaching/**`, `/lop/**` | Academic paper and teal, Inter, compact classroom tools, dedicated SVG icons |

Do not force My Class to look like the editorial marketing pages. Do not soft-card
the public site to look like a product UI.

---

## Teaching surface

Teaching owns its light palette through `data-surface="teaching"`; do not set theme variables on `body` or recolor another destination. It stays light when the surrounding site is dark. The shared `SurfaceTheme` provider carries the destination identity to React portals and native dialogs. Teaching SVG icons are an explicit exception to the Material-only My Class icon rule below.

- Canvas `#F7F8F4`, paper `#FFFFFF`, ink `#19332F`, secondary text `#52645E`.
- Accent `#176B63`, hover `#12564F`, selected fill `#E5F1ED`; status colors convey state with text or symbols.
- Inter; page headings 24–32px, workspace headings 18–24px, body 14–16px, metadata 12px. Numbers use tabular figures.
- Spacing 4/8/12/16/24/32px; shared radius tokens are 8/12/20px. Component-specific shapes remain explicit in Teaching styles. Coarse-pointer targets are at least 44px.
- The contents Teaching tile uses the hand-drawn illustration, with a light teal wash from `--teaching-accent`. My Space keeps `TeachingMark` and those tokens. Task icons come from the typed `TeachingIcon` set. Label meaningful controls; decorative icons remain hidden from assistive technology.
- Active classes precede courses. Courses are a compact list: classes in progress first, courses with no class and no deck collapsed, and status chips that count active courses only. One primary action per task; administrative actions use secondary controls and the management menu. Learner-facing copy says "sinh viên".
- Gradebook toolbar groups tutorial, week, search, result count and saving/error feedback. Sticky identity columns and headers live inside the scrollable table; page overflow is never used to expose columns. The attendance score column is wide enough for "Chuyên cần". Only the current week spells out "Chưa chốt"; a future week without a date is a small add control.
- A public class page can pin "Đây là tôi" in localStorage for that browser only. The choice is not sent to the server, and blocked storage leaves the page usable.
- Mobile class headers stay compact, tabs scroll, and management opens a bottom sheet. Full metadata remains available in the eyebrow title and accessible text.
- Teaching styles live in `src/components/teaching/ui/styles/`; experience access and choice styles are separate CSS Modules. Shared studio primitives still provide controls and typography.
- Paper rulings are reserved for empty states. Tables and form surfaces remain flat; shared hover/control transitions use 150/250ms and respect reduced motion.
- Active Recall receives the optional `surface="teaching"` only for a class player. Standalone Active Recall and My Class retain their palettes.

See [Teaching implementation and verification](./teaching-ui-standardization.md) for the route checklist and acceptance checks.

---

## Editorial surface

Source of truth: [05-BRAND_BRIEF.md](./05-BRAND_BRIEF.md) and
`src/app/globals.css` (`.editorial-*`, `.premium-*`).

- Warm canvas `#F8F7F4`, ink `#171717`, bronze accent `#765625`
- Source Serif 4 display + Inter body
- Sections as full-width bands with `border-b border-hairline`
- Cards rare; prefer hairline grids and mono indices

---

## My Class Product UI — eight rules

1. **A surface represents one independent object or task.** Cards are appropriate
   for courses, dashboards and editors; card-in-card decoration is not.
2. **One focal action per task region.** Solid ink is reserved for the next
   meaningful action (hover → inverse surface); secondary controls step down.
   Indigo is for active position, progress fill, TEST badges, and links.
3. **Emphasis is typographic first** — size, then weight, then ink contrast.
   Never a pastel wash where a weight change works.
4. **Radius is systematic:** 4px inline, 8px controls, 12px panels, 16px overlays.
   `rounded-full` is reserved for icon buttons and progress tracks.
5. **Color is state, never decoration.** Accent indigo = "you are here" + progress.
   Green = done, amber = vocab — as _text/rule/subtle fill_, not as decoration.
   No gradients, no tinted placeholder thumbnails.
6. **Three density tiers:** `nav` (40px outline rows, 44px on coarse pointers), `data` (40px tabular rows),
   `read` (800px / Inter 18/30).
7. **Elevation is restrained** — interactive cards may gain a hairline shadow on
   hover; sticky bars, dialogs, sheets and popovers may use stronger elevation.
8. **Numbers are tabular Inter** — lesson indices, percents, scores (`07/24`).

Active unit row = 2px indigo left bar + `surface-container-highest` + primary text.

---

## Four levels, four registers

Every content level owns one visual register. Never reuse the same size/case/weight
for two different levels.

| Level                   | Where                      | Register                                                                                                                                                                                                                                             |
| ----------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Khóa học**            | Top bar (64px)             | Inter semibold 20/28 + 4px meter (`w-48`) + `completed/total`                                                                                                                                                                                        |
| **Bài (lesson)**        | Outline + reader eyebrow   | Expand icon + `01 Title` (14/20/700) + counter `1/22`. Open lesson has `bg-surface-container`. Hairline between lessons                                                                                                                              |
| **Phần (section)**      | Outline + reader eyebrow   | `1.1 TITLE` uppercase tracked (12/16/600). Uppercase is exclusive to this level in the outline. Check when complete                                                                                                                                  |
| **Nội dung (unit)**     | Outline leaf + reader `h1` | 14/20 regular on a container guide rail; active = highest container + 2px primary bar; only outline rows that navigate                                                                                                                               |
| **In-content headings** | `.mc-prose`                | Inter throughout. h2 24/32/600 with a chapter hairline on subsequent h2s; h3 20/28/600; h4 small uppercase. Circular ul markers, decimal ol. Callout `blockquote` is a left-ruled surface-container-low box. `strong` is 600 so it never outranks h3 |

Reader header ladder (above the unit body):

1. `BÀI 01 • {lesson title}` — label-sm uppercase eyebrow
2. `{section title} • 01/04` — same register, counter scoped to the **section**
3. Unit title — `.mc-title` (headline-xl, 40/48/700, −0.02em)
4. Unit summary — `.mc-dek` (Inter 18/30, secondary ink)
5. Reading-level switcher, hint, then a hairline before prose

Layout metrics: sidebar 320px (360px in edit mode), reader max 800px, right rail 256px, top bar 64px,
gutter 24px, desktop margin 40px / mobile 16px.

Icons: Material Symbols Outlined via `McIcon`. Do not add inline SVG icons.

---

## Navigation contract

1. **Free expand/collapse.** Users may open or close any lesson/section at any
   time, including while authoring (`?edit=1`). Edit mode no longer force-opens
   the whole tree. Carets stay interactive; "Thu gọn tất cả" / "Mở tất cả" is in
   the outline header.
2. **Navigation still reveals.** Changing the active unit calls `ensureOpen` so
   ancestors expand once and the active row can scroll into view; the user may
   collapse them again immediately after.
3. **Lesson selector lands on first unit.** Top-bar lesson jump always opens the
   first knowledge unit of that lesson — never "first unfinished".
4. **Section numbers are hierarchical.** Outline sections show `1.1`, `1.2`, …
   (`{lessonIndex}.{sectionIndex}`) next to the uppercase section title.
5. **Right rail is practical chrome only.** Estimated time + section tests — not an
   in-content heading list (template headings like "Điểm chính" added noise).
6. **Outline grid.** Lesson rows sit at the sidebar edge. Nested sections live
   inside `.mc-outline-lesson-body`; units sit on `.mc-outline-unit-rail`. Filter
   is an icon that expands an inline field; command search (`/` / ⌘K) remains the
   full jump.

---

## Tokens (`.mc` scope)

Defined in `src/app/my-class-theme.css`, registered for Tailwind in
`src/app/globals.css` `@theme inline`.

| Token                                                                        | Role                                     |
| ---------------------------------------------------------------------------- | ---------------------------------------- |
| `--canvas` `#f8f9ff`                                                         | Page background                          |
| `--paper` `#ffffff`                                                          | Raised / panel fill                      |
| `--surface-sunken` / `--surface-container-low` `#eff4ff`                     | Inputs, tracks, hover                    |
| `--surface-container` `#e6eeff`                                              | Open lesson, segmented track             |
| `--surface-container-high` `#dee9fc`                                         | Meter track                              |
| `--surface-container-highest` `#d9e3f6`                                      | Active unit row                          |
| `--inverse-surface` `#27313f`                                                | Ink CTA hover                            |
| `--accent` `#3525cd` / `--accent-hover` `#4f46e5`                            | Position, progress, TEST, links          |
| `--mc-rule` `#c7c4d8`                                                        | Outline-variant divider                  |
| `--mc-rule-strong` `#777587`                                                 | Section boundary / outline               |
| `--ink` `#121c2a` / `--ink-secondary` `#464555` / `--ink-tertiary` `#777587` | Text ladder                              |
| `--mc-done` `#006c49`                                                        | Complete                                 |
| `--mc-vocab` `#684000`                                                       | Vocabulary                               |
| `--mc-r-xs/sm/md/lg`                                                         | 8 / 8 / 12 / 20 px                       |
| `--mc-measure`                                                               | 800px reader measure                     |
| `--mc-sidebar` / `--mc-rail`                                                 | 320px / 256px; edit mode sidebar 360px   |
| `--mc-topbar-height`                                                         | 4rem                                     |
| `--mc-dur-1/2/3`                                                             | 150 / 250 / 400 ms                       |
| `--mc-ease-standard` / `--mc-ease-emphasized`                                | Motion curves for hover, expand, overlay |

Typography classes: `.mc-title`, `.mc-dek`, `.mc-eyebrow`, `.mc-h3`, `.mc-meta`, `.mc-num`, `.mc-prose`.

Scale: headline-xl 40/48/700, headline-lg 30/38/700, headline-md 24/32/600,
headline-sm 20/28/600, body-lg 18/30, body-md 16/24, label-md 14/20/500,
label-sm 12/16/600.

---

## Component catalog

### Learner (`src/components/myclass/ui/`)

| Primitive          | Use                                                        |
| ------------------ | ---------------------------------------------------------- |
| `McIcon`           | Material Symbols Outlined                                  |
| `McRows` / `McRow` | Hairline lists (default for scannable content)             |
| `McSection`        | Eyebrow + title band, no box                               |
| `McPanel`          | Only static bordered container (12px, hairline)            |
| `McButton`         | 8px radius; primary / secondary / quiet                    |
| `McBadge`          | 4px; TEST/accent use `bg-accent/10`; done keeps green fill |
| `McMeter`          | 4px rounded-full track, indigo fill                        |
| `McSegmented`      | Level switcher — ink active chip on surface-container      |
| `McProgressRing`   | One focal progress display per view                        |

`McCard` is a deprecated alias of `McPanel`. Prefer `McRows` for lists.

### Admin studio (`src/components/myclass/admin/studio/`)

| Primitive                                                           | Use                                       |
| ------------------------------------------------------------------- | ----------------------------------------- |
| `StudioPageHeader`                                                  | Title + actions + bottom rule             |
| `StudioField` / `StudioInput` / `StudioTextarea` / `StudioSelect`   | Form controls                             |
| `StudioButton`                                                      | primary / secondary / danger / quiet      |
| `StudioPanel` / `StudioToolbar` / `StudioTable` / `StudioDataTable` | Studio chrome and Jira-style admin tables |

Admin My Class routes wrap in `.mc.mc-studio` via
`src/app/admin/my-class/layout.tsx`.

---

## Motion tokens

Defined on `.mc` in `src/app/my-class-theme.css`. Prefer these over ad-hoc durations.

| Token                  | Use                          |
| ---------------------- | ---------------------------- |
| `--mc-dur-1` 150ms     | Hover / color                |
| `--mc-dur-2` 250ms     | Caret rotate, overlay, toast |
| `--mc-dur-3` 400ms     | Reserved page-level timing   |
| `--mc-ease-standard`   | Close, hover                 |
| `--mc-ease-emphasized` | Open, overlay                |

Outline branches keep their specific 260ms opening choreography; closing uses 150ms, with the rail opacity/slide at 250ms.
Chevrons are a single `chevron_right` glyph rotated 90°. `prefers-reduced-motion`
already collapses animation under `.mc`.

---

## Edit-mode outline density

Authoring (`?edit=1`) uses the same outline as the learner, plus:

- Sidebar width 360px (`--mc-sidebar: 22.5rem` on `.mc-workspace[data-edit='true']`)
- Status is a 6px amber/tertiary dot for draft/unpublished; published rows stay clean
- Drag handles and ⋮ sit at 35% opacity until hover / focus / active
- Reorder uses `@dnd-kit` with same-parent collision, a drop line, optimistic tree
  updates, and Vietnamese screen-reader announcements
- Dragging a lesson temporarily collapses all lessons; dragging a section collapses
  sibling sections so drop targets stay on one screen

---

## Allowed / forbidden

**Allowed**

- Hairline / rule dividers (`border-mc-rule`)
- Left accent bar for current unit
- Solid ink primary CTA (one per view)
- Tabular numbers
- Segmented control for reading levels
- `rounded-full` on icon buttons and progress tracks
- Material Symbols via `McIcon`

**Forbidden**

- arbitrary `rounded-2xl` / `rounded-3xl` outside the token system
- heavy shadows on static cards
- decorative pastel washes; semantic state feedback is allowed
- Card-in-card nesting
- Side-by-side multi-level reader columns
- Gradients and decorative thumbnail fills
- Hardcoded hex colors outside the theme file
- Inline SVG icons (use `McIcon`)
- Serif / bronze editorial tokens inside `.mc`

Enforcement: `.cursor/rules/my-class-ui.mdc` and
`src/components/myclass/__tests__/designSystem.unit.test.ts`.


## Admin Studio

Admin is a light-only workspace. Its CSS Module (`src/components/admin/AdminStudio.module.css`)
scopes tokens to the shell; it never toggles the document theme. Nested My Class studios
retain their `.mc` palette. Native confirmation dialogs remain in the Admin DOM subtree
and inherit its tokens, including when displayed in the browser top layer.

- Canvas `#F4F6FA`, paper `#FFFFFF`, ink `#172033`, secondary ink `#596579`,
  accent `#365CCE`, active surface `#EAF0FF`, border `#DFE5EE`.
- Inter: page title 28/36, section title 18/26, body 14/22, metadata 12/18.
  Numbers use tabular figures. Controls 8px, panels 12px, dialogs 16px.
- Desktop starts at 1024px. Sidebar 240px / collapsed 72px. The name "Admin Studio"
  lives in the sidebar only. Below 1024px a 64px bar opens a drawer with focus trapping,
  Escape and focus restoration. "Về Mục lục" is an in-app sidebar link.
- Page measure 1200px; analytics 1440px. Gutters 16px mobile, 24px tablet, 32px desktop.
- One primary action per task region. Use border separation and restrained elevation.
  Color supplements explicit status labels. Controls have visible keyboard focus.
- AdminIcon owns the admin glyphs (including inbox, archive, logout and retry).
  Do not add those names to McIcon. Navigation 20px, actions 18px, empty states 32px.
  Collapsed navigation exposes focus/hover labels. The collapsed state is read from
  a cookie so the sidebar does not flash open.
- Shared primitives: buttons, links, badges, statistics, pagination, page headers,
  empty/error states and loading skeletons. Each field has an associated label.
- Overview is a work queue: new inquiries, a short excerpt, and a failed-notification
  alert when one exists. Inbox status filters are counted links in the URL; search and
  topic still submit together. A page past the end clamps back. Rows show the sender,
  one excerpt line, and relative time. Below 768px records become stacked cards.
- Inquiry detail leads with reply and copy. A new inquiry can be marked reviewing in
  one step. Suggested statuses sit above the full selector. Unsaved notes block
  navigation through the shared leave guard. Previous and next stay inside the same
  filters.
- Existing internal notes populate the editor. Saves are explicit, unchanged drafts
  cannot be submitted, failed saves preserve input, and refresh does not replace drafts.
  All writes are locked while a request runs. Deletion requires confirmation.
- Archive modules keep their status and task layouts; only the shell and archive hub
  adopt Admin Studio. Teaching remains a separate workspace in My Space.
- Shared hover/control feedback uses 150/250ms. Reduced motion disables animation.


## Public UI polish

Public editorial typography opts into named Tailwind utilities: text-caption (12px), text-label (13px), text-control (15px), text-body (17px), text-lead (20px), text-title (24px), text-heading (32px), and text-display (48px), each with a line-height token. Tailwind’s built-in sizes remain unchanged. My Class and Admin keep their existing text density.

Shared interface timings are 150ms hover, 250ms control, and 400ms public page movement. Incoming motion uses --ui-ease; outgoing easing preserves acceleration. Internal workspaces render without a pathname-keyed transition so persistent layouts keep their state. Teaching keeps the palette, visual mark, portals, tables, and workspaces introduced in PR #21.

Interface controls use the shared Icon renderer, with compatibility adapters for existing areas. New editorial raster artwork follows public/brand/prompts.json. Shared radius tiers are 8, 12, and 20px; focus rings and graphic geometry retain their distinct roles.
