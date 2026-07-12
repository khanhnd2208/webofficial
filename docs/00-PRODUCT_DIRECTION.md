# Product Direction

## Primary purpose

HANOICAM is a personal website with three clearly separated areas:

1. **Thương hiệu cá nhân** — public personal writing and long-form articles (`/`, `/bai-viet`, `/gioi-thieu`).
2. **Giảng dạy** — courses → modules → lessons for enrolled learners only (`/giang-day`, `/hoc`).
3. **Công cụ** — admin-only utilities. A tool is private by default and becomes public only through an explicit product and security decision (e.g. `/m/[slug]`).

## Access policy

- The owner is the sole author and administrator.
- Public visitors can read published posts and the teaching intro page.
- Signed-in learners only see courses with an `ACTIVE` enrollment.
- Creation, configuration, reporting, upload, and management surfaces for tools are admin-only.
- A tool may expose a narrowly scoped public output, such as a recipient link, without exposing its management interface.

## Current decisions

- Personality Test is archived as inactive research software. Its existing database records are preserved, but no active page or API route exposes it.
- Lời nhắn is an admin-only creation and management tool. Its `/m/[slug]` recipient view remains public by design.
- Vocabulary is admin-only (learner/public routes will be locked in the Tool isolation phase).
- Teaching domain uses PostgreSQL + Prisma; MongoDB remains for auth, posts, profile, messages, and streak during this restructure.
- Lesson/course work is a dedicated teaching domain, not embedded into blog posts or generic tools.

## Product rule

Every new feature must belong to exactly one of the three areas above. If its audience, ownership, and publication model are unclear, it should remain disabled until those decisions are explicit.

## Implementation phases

Phase 1 (Information Architecture) delivers route map, navigation, redirects, and shells without changing domain data models.
