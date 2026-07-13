# Route Map — Duy Khánh

Single source of truth in code: `src/config/routes.ts`, `src/config/navigation.ts`, `src/config/site.ts`, `src/content/*`.

Navigation and footer render **only** links with `status: 'published'`.

## Brand hierarchy

| Brand | Role |
|-------|------|
| **Duy Khánh** | Master brand / site wordmark |
| **HANOICAM** | Editorial journal brand |
| **NDK** | Personal mark / signature |

## Public marketing (current)

| Path | Purpose | Status |
|------|---------|--------|
| `/` | Brand homepage + hero illustration | Published |
| `/gioi-thieu` | About (standalone) | Published |
| `/lien-he` | Inquiry form | Published (prod form needs Resend env) |
| `/dong-hanh` | Service hub | Published |
| `/dong-hanh/[slug]` | Mentoring, business, training, AI | Published |
| `/case-study` | Case list | Published (empty until permission) |
| `/chinh-sach/[slug]` | Privacy, terms, cancellation, AI | Published (legal review pending) |
| `/goc-cua-khanh` | Lab hub + categories + resources | Published |
| `/bai-viet` | HANOICAM Journal | Published |

## Learning (still gated)

`/hoc/*` and `/giang-day` still redirect home until a PUBLISHED+CATALOG course passes E2E gate. Prisma `Course.visibility` defaults to `PRIVATE`.

## Admin

| Path | Purpose |
|------|---------|
| `/admin/inquiries` | Inquiry list / detail / status / retry email / delete |

## Redirects

Unchanged permanent: `/blog` → `/bai-viet`, `/login` → `/dang-nhap`, `/profile` → `/tai-khoan`.  
Temporary: `/hoc`, `/giang-day`, `/dashboard` → `/`.
