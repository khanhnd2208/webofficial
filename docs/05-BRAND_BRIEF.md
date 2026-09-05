# Brand brief — Duy Khánh

**Status:** owner-approved direction, implemented September 2026
**Last updated:** 2026-09-05

## A personal book still being written

Visitors should understand and remember Khánh first. Projects provide evidence of
his thinking and work; services invite a conversation about working together.

The cover keeps **Trở thành**, **[động từ]**, and **Chưa xong. Và có lẽ, đó mới là
điều hay.** The illustrated explorer, landscape, warm paper, and personal English
quotation belong to the identity. Do not replace them with generic sales copy.

Keep the voice calm, specific, sincere, and evidence-aware. Preserve the owner's
personal expressions. Never invent affiliations, outcomes, dates, or testimonials.

## Public reading journey

- `/`: a book cover, with the author's name and an immediately usable “Mở mục lục”.
- `/muc-luc`: aligned, numbered entries with visible descriptions; ordinary links.
- `/gioi-thieu`: portrait illustration, personal introduction, and chapters A/B/C
  about work, classrooms, and personal projects. School names do not imply a
  particular relationship beyond what the owner has supplied.
- `/du-an`: a horizontal dossier from 1024px; vertical reading below 1024px. Each
  project includes a summary, role, status, and a distinct conceptual cover.
- `/dich-vu`: three editorial sections, native expandable details, relevant project
  links, three questions about the learner/context/outcome, and an invitation to write.

My Space remains a destination. My Class and admin retain their separate Study
Tool grammar; see [09-DESIGN_SYSTEM.md](./09-DESIGN_SYSTEM.md).

## Graphic system

- Warm canvas `#F8F7F4`, paper `#F1EFEA`, ink `#171717`, readable secondary ink
  `#595650`, bronze `#765625`. Sunlight yellow belongs to illustration, not small text.
- Source Serif 4: headings, personal quotations, and cover. Inter: reading text.
  Mono: indices and notes; the table of contents deliberately keeps a typewriter voice.
- Cover typography has its own generous scale. Content H1: about 40–64px desktop,
  32–40px mobile. Body: 16–18px, line height about 1.65–1.75. Informative captions:
  at least 13px. Test Vietnamese accents and text enlargement.
- Prefer fine rules, chapter indices, modest asymmetry, and a single journey stroke.
  Reduce nested frames, heavy shadows, and generic icon grids.
- Project covers may use muted paper tints and original SVG diagrams grounded in
  existing project content. Label conceptual covers “Minh họa ý tưởng dự án”.
  A conceptual cover is not documentary evidence of delivered work.
- The existing portrait is an illustration, captioned “Chân dung minh họa”.
- Keep login available, visually quiet. Mobile contact links stay in the reading
  flow; desktop contact rail retains the existing quick-contact panel.

## Motion and robustness

Motion supports opening, progression, and feedback. The cover arrives in 750–850ms;
section movement is at most 8px over 350ms; the journey stroke draws in 800ms.
Parallax uses small translation and fixed overscan, without pointer-triggered zoom.
No enforced navigation delay, sibling dimming, or perpetual blinking is needed.

HTML content is visible before hydration. Native links and details work without
JavaScript. Respect reduced-motion preferences and keep primary controls reachable.
Do not stack a route-wide entrance over these pages' section animations.

## Implementation and verification

`src/app/personal-book.css` scopes visual rules to the five public pages. Existing
URLs, contact payloads, project records, and backend contracts are retained.
`e2e/personal-book.spec.ts` covers responsive layouts, no-JS reading, native
navigation, project dragging versus clicking, keyboard use, reduced motion, short
screens, and zoom-equivalent reflow. Screenshots, video, and rendering measurements
are QA artifacts; local measurements are not field Core Web Vitals.
