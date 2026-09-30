# Route map — Duy Khánh

Sources of truth: `src/config/routes.ts`, `src/config/navigation.ts`, and
`src/features/portfolio`.

## Public portfolio

| Path | Purpose | Indexing |
|------|---------|----------|
| `/` | Homepage and positioning | index |
| `/gioi-thieu` | Story, expertise, principles, milestones | index |
| `/du-an` | Filterable project index | index |
| `/du-an/[slug]` | Project context, problem, approach, outputs, lessons | index |
| `/dich-vu` | Management education, applied AI, advisory | index |
| `/my-space` | Personal experiments hub (tiles open when real) | index |
| `/my-space/tests` | Subject-first MCQ index (môn → bài → bắt đầu) | index |
| `/my-space/tests/[slug]` | Redirect → play | noindex |
| `/my-space/tests/[slug]/play` | Quiz session (balanced sample from attached questions) | noindex preferred via client play |
| `/lien-he` | Contact form | index |
| `/chinh-sach/[slug]` | Required policies | allowed, omitted from primary nav |

## Retired public routes

| From | Destination |
|------|-------------|
| `/dong-hanh/*`, `/giang-day` | `/dich-vu` |
| `/case-study/*`, `/goc-cua-khanh/*` | `/du-an` |
| `/bai-viet/*`, `/phat-trien-ban-than/*`, `/archive` | `/` |
| `/hoc`, `/hoc/chuong-trinh` | `/` |

The retired UI implementations (`src/_archived/marketing/routes-v1`) are in
git history only.

Standalone archived product modules (not mounted as live routes):

| Module | Former archive path (git history) |
|--------|----------------|
| Personality Test (research 2026) | `src/_archived/features/personality-test-research-2026` |
| K'sTrip party games (spy, night-market, mafia) | `src/_archived/features/kstrip-2026` |

See `docs/archive/src-archived.md` for the archive taxonomy and restore steps.

## Internal/system routes

| Path | Purpose |
|------|---------|
| `/dang-nhap` | Authentication |
| `/tai-khoan/*` | Account and learner hub |
| `/hoc/khoa-hoc/*` | Course and lesson surfaces |
| `/vocabulary/*` | Vocabulary tools |
| `/messages/*`, `/m/[slug]` | Message tools and recipient view |
| `/admin/*` | Administration (incl. `/admin/myspace-tests`, `/admin/myspace-tests/subjects`, smart import) |
| `/api/*` | Backend APIs |

These remain operational but do not render public portfolio navigation or
footer and are disallowed where appropriate in `robots.ts`.
