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
| `/lien-he` | Contact form | index |
| `/chinh-sach/[slug]` | Required policies | allowed, omitted from primary nav |

## Retired public routes

| From | Destination |
|------|-------------|
| `/dong-hanh/*`, `/giang-day` | `/dich-vu` |
| `/case-study/*`, `/goc-cua-khanh/*` | `/du-an` |
| `/bai-viet/*`, `/phat-trien-ban-than/*`, `/archive` | `/` |
| `/hoc`, `/hoc/chuong-trinh` | `/` |

The corresponding UI implementations are stored under
`src/_archived/routes-v1` and are not compiled by Next.js.

## Internal/system routes

| Path | Purpose |
|------|---------|
| `/dang-nhap` | Authentication |
| `/tai-khoan/*` | Account and learner hub |
| `/hoc/khoa-hoc/*` | Course and lesson surfaces |
| `/vocabulary/*` | Vocabulary tools |
| `/messages/*`, `/m/[slug]` | Message tools and recipient view |
| `/admin/*` | Administration |
| `/api/*` | Backend APIs |

These remain operational but do not render public portfolio navigation or
footer and are disallowed where appropriate in `robots.ts`.
