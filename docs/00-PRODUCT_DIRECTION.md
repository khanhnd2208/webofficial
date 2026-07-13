# Product Direction

## Primary purpose

**Duy Khánh** is a Personal Knowledge & Advisory Studio with four public tracks under one master brand:

1. **Đồng hành cùng Khánh** — mentoring, business advisory, training/workshop, AI ứng dụng (`/dong-hanh/*`).
2. **Học cùng Khánh** — public learning hub and catalog; lessons require login + enrollment (`/hoc/*`, `/tai-khoan/hoc`).
3. **HANOICAM Journal** — editorial library (`/bai-viet`). HANOICAM is the editorial brand, not the site-wide wordmark.
4. **Góc của Khánh** — creative lab and resources with explicit status/access (`/goc-cua-khanh/*`).

`NDK` remains a personal mark/signature only.

## Access policy

- The owner is the sole author and administrator.
- Public visitors see only `published` marketing, journal, case, resource, and catalog routes.
- Signed-in learners only see courses with an `ACTIVE` enrollment.
- Creation, configuration, reporting, upload, and management surfaces for tools are admin-only.
- A tool may expose a narrowly scoped public output, such as a recipient link, without exposing its management interface.
- Draft service, case, resource, collection, or course routes return 404/noindex — never empty shells in navigation.

## Current decisions

- Vietnamese is the default for marketing, services, and learning; journal posts may stay bilingual.
- Service pages never publish prices; cost is proposed after clarifying need, outcomes, and scope.
- Personality Test is archived as inactive research software. Its existing database records are preserved, but no active page or API route exposes it.
- Lời nhắn is an admin-only creation and management tool. Its `/m/[slug]` recipient view remains public by design.
- Vocabulary is admin-only.
- Teaching domain uses PostgreSQL + Prisma; MongoDB remains for auth, posts, profile, messages, streak, and inquiries.
- Lesson/course work is a dedicated learning domain, not embedded into blog posts or generic tools.
- No marketplace, payment, community, membership, chatbot, large CRM, or service CMS in this restructure program.

## Product rule

Every new feature must belong to exactly one brand track above (or to system/auth/admin). If its audience, ownership, and publication model are unclear, it should remain `draft` until those decisions are explicit.

## Implementation phases

| Phase | Branch | Focus |
|------|--------|--------|
| 0 | — | Brand brief, content inventory, publication gates |
| 1 | `codex/restructure-brand-foundation` | Site identity, nav/footer publish gates, marketing primitives |
| 2 | `codex/restructure-home-about` | Homepage + standalone About |
| 3 | `codex/restructure-services` | `/dong-hanh` service architecture |
| 4 | `codex/restructure-inquiries` | Contact, inquiry API, admin workflow, email |
| 5 | `codex/restructure-trust` | Case study, testimonials, policies |
| 6 | `codex/restructure-journal` | HANOICAM taxonomy + pillar/collection |
| 7 | `codex/restructure-lab` | Góc của Khánh |
| 8 | `codex/restructure-learning` | Catalog, enrollment, lesson E2E |
| 9 | `codex/restructure-seo-analytics` | Sitemap, robots, Umami, a11y/perf |
| Final | `codex/restructure-final-qa` | Program QA |

Phase 1 delivers brand foundation and application shell without changing domain data models.
