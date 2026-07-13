# Content inventory & publication matrix

**Last updated:** 2026-07-13  
**Legend:** `ready` = published + gate met · `draft` = built, hidden · `missing` = needs owner input

## Routes / pages

| Target | Status | Notes |
|--------|--------|-------|
| `/` Homepage | ready | Proof/cases auto-hide when empty |
| `/gioi-thieu` | ready | |
| `/dong-hanh` + 4 services | ready | Full copy in `src/content/services.ts` |
| `/lien-he` | ready | Prod form needs Resend env |
| `/chinh-sach/*` | draft* | Published copy; `legalReview: pending` |
| `/case-study` | draft | Infra ready; 0 approved cases |
| `/bai-viet` Journal | ready | Taxonomy UI shipping; public pillar filter after 100% map |
| `/bai-viet/chu-de/*` | draft | Pages exist when pillars defined |
| `/bai-viet/bo-suu-tap/*` | draft | Pages exist when collections defined |
| `/goc-cua-khanh` | ready | 2 published resources |
| `/hoc` hub + catalog | ready (nav draft) | Infra live; set nav `Học` → published after first CATALOG course |
| `/tai-khoan/hoc` | ready | Learner dashboard |
| Journal taxonomy admin | ready | Pillar/type/collections/featured in editor |
| Pillar/collection pages | ready | Filter public pillars only after 100% map |
| Inquiry dashboard stats | ready | |
| Retention purge script | ready | `scripts/purge-closed-inquiries.ts` |

\*Policies are publicly readable but marked pending legal review.

## Content pack

| Asset | Status |
|-------|--------|
| Service copy ×4 | ready |
| Bio 50/150/long | ready (in brand brief + about) |
| Public email | missing |
| LinkedIn / social | missing |
| Real portrait | missing (illustration used) |
| Case studies ≥2 approved | missing |
| Testimonials ≥3 approved | missing |
| Activity photos ≥5 w/ permission | missing |
| Legal review sign-off | missing |
| Free lab resource ≥1 | ready |
| Course PUBLISHED+CATALOG + E2E | missing |

## Existing domains (do not break)

| Domain | Status |
|--------|--------|
| Blog/posts Mongo | ready |
| Auth Google | ready |
| Admin shell | ready |
| Vocabulary (admin) | ready |
| Messages `/m/[slug]` | ready |
| Course/enrollment/lesson PG | ready (visibility default PRIVATE) |

## Tools

| Tool | Public? |
|------|---------|
| Vocabulary | no (admin) |
| Lucky Card | no (admin) |
| Messages admin | no |
| Personality test | archived |

## Next owner actions

1. Fill email + LinkedIn in `src/config/site.ts`.
2. Supply approved cases/testimonials or keep hidden.
3. Supply portrait / activity photos with permission.
4. Legal review of `/chinh-sach/*`.
5. Publish first course as `PUBLISHED` + `CATALOG`, enroll test learner, then set nav `Học` → published.
